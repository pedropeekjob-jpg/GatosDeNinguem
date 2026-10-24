import { BadRequestException, ConflictException, NotFoundException } from "@nestjs/common";
import {
  channelProblem,
  draftPromotion,
  editPromotion,
  eventSubscribers,
  isDue,
  pendingChannels,
  postUrl,
  promotionChannelLabel,
  promotionChannels,
  statusAfterRun,
  syncPromotion,
  type ChannelResult,
  type Post,
  type Promotion,
  type PromotionChannel,
  type PromotionEdit,
} from "@gn/domain";
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import type { ApiOptions, PromotionMessage } from "../common/options";

/** Shown to managers; how to connect each service is in docs/promocao-eventos.md. */
const NOT_SET_UP: Record<PromotionChannel, string> = {
  "facebook-post": "O Facebook ainda não está ligado ao site.",
  "facebook-story": "O Facebook ainda não está ligado ao site.",
  "instagram-post": "A Instagram ainda não está ligada ao site.",
  "instagram-story": "A Instagram ainda não está ligada ao site.",
  email: "O envio de emails ainda não está ligado ao site.",
};

/** Event promotions: drafts follow the events, managers approve, and approved ones go out on the day. */
export class PromotionService {
  private running = false;
  constructor(private readonly options: ApiOptions) {}
  private get repo() { return this.options.repository; }
  private now() { return this.options.now?.() ?? new Date(); }
  private get siteUrl() { return (this.options.siteUrl ?? "https://gatosdeninguem.pt").replace(/\/$/, ""); }

  /** Which channels the server can publish to, for the back office. */
  channels() {
    return promotionChannels.map((c) => ({ channel: c, label: promotionChannelLabel[c], ready: !!this.options.promotionPublishers?.[c], setup: this.options.promotionPublishers?.[c] ? undefined : NOT_SET_UP[c] }));
  }

  async list() {
    return (await this.repo.listPromotions()).map((p) => this.view(p));
  }

  view(p: Promotion) {
    const problems = Object.fromEntries(p.channels.flatMap((c) => {
      const why = channelProblem(p, c) ?? (this.options.promotionPublishers?.[c] ? undefined : NOT_SET_UP[c]);
      return why ? [[c, why]] : [];
    })) as Partial<Record<PromotionChannel, string>>;
    return { ...p, problems };
  }

  async get(id: string) {
    const p = await this.repo.getPromotion(id);
    if (!p) throw new NotFoundException("Promoção não encontrada.");
    return p;
  }

  /** Called after an event is created or edited. */
  async postSaved(post: Post) {
    const current = await this.repo.getPromotionByPost(post.id);
    const ctx = { siteUrl: this.siteUrl, now: this.now() };
    if (!current) {
      const draft = draftPromotion(post, { ...ctx, id: randomUUID() });
      if (draft) await this.repo.savePromotion(draft);
      return;
    }
    const next = syncPromotion(current, post, ctx);
    if (next !== current) await this.repo.savePromotion(next);
  }

  /** Drafts promotions for events saved before this feature, or loaded as demo content. */
  async draftMissing() {
    for (const post of await this.repo.listPosts()) if (!(await this.repo.getPromotionByPost(post.id))) await this.postSaved(post);
  }

  async postDeleted(postId: string) {
    const current = await this.repo.getPromotionByPost(postId);
    if (current && ["rascunho", "aprovada"].includes(current.status))
      await this.repo.savePromotion({ ...current, status: "cancelada", note: "O evento foi apagado.", updatedAt: this.now().toISOString() });
  }

  async edit(id: string, edit: PromotionEdit) {
    const p = await this.get(id);
    if (!["rascunho", "aprovada", "cancelada"].includes(p.status)) throw new ConflictException("Esta promoção já foi publicada e não pode ser alterada.");
    if (edit.scheduledFor && new Date(edit.scheduledFor) >= new Date(p.eventStartsAt)) throw new BadRequestException("A promoção tem de sair antes do evento.");
    return this.view(await this.repo.savePromotion(editPromotion(p, edit, this.now())));
  }

  /** The one click a manager gives: from now on it goes out on its own on the scheduled day. */
  async approve(id: string) {
    const p = await this.get(id);
    if (p.status !== "rascunho") throw new ConflictException("Só se aprova uma promoção por aprovar.");
    this.checkReady(p);
    return this.view(await this.repo.savePromotion({ ...p, status: "aprovada", note: undefined, approvedAt: this.now().toISOString(), updatedAt: this.now().toISOString() }));
  }

  async backToDraft(id: string) {
    const p = await this.get(id);
    if (!["aprovada", "cancelada"].includes(p.status)) throw new ConflictException("Esta promoção já não pode voltar a rascunho.");
    if (new Date(p.eventStartsAt) <= this.now()) throw new ConflictException("O evento já passou.");
    return this.view(await this.repo.savePromotion({ ...p, status: "rascunho", approvedAt: undefined, updatedAt: this.now().toISOString() }));
  }

  async cancel(id: string) {
    const p = await this.get(id);
    if (!["rascunho", "aprovada"].includes(p.status)) throw new ConflictException("Esta promoção já foi publicada.");
    return this.view(await this.repo.savePromotion({ ...p, status: "cancelada", updatedAt: this.now().toISOString() }));
  }

  /** "Publicar já", also used to retry the channels that failed. */
  async publishNow(id: string) {
    const p = await this.get(id);
    if (p.status === "publicada" || p.status === "cancelada") throw new ConflictException(p.status === "publicada" ? "Esta promoção já foi publicada." : "Esta promoção foi cancelada.");
    this.checkReady(p);
    const at = this.now().toISOString();
    return this.view(await this.publish({ ...p, approvedAt: p.approvedAt ?? at }));
  }

  /** Publishes every approved promotion whose day has come. Runs on a timer and from an external cron. */
  async runDue() {
    if (this.running) return { published: 0 };
    this.running = true;
    try {
      const now = this.now();
      const due = (await this.repo.listPromotions()).filter((p) => isDue(p, now));
      for (const p of due) await this.publish(p);
      return { published: due.length };
    } finally {
      this.running = false;
    }
  }

  private checkReady(p: Promotion) {
    if (p.channels.length === 0) throw new BadRequestException("Escolha pelo menos um canal.");
    const problems = p.channels.map((c) => [c, channelProblem(p, c)] as const).filter(([, why]) => why);
    if (problems.length) throw new BadRequestException(problems.map(([c, why]) => `${promotionChannelLabel[c]}: ${why}`).join(" "));
  }

  private async publish(p: Promotion): Promise<Promotion> {
    let current = await this.repo.savePromotion({ ...p, status: "a-publicar", updatedAt: this.now().toISOString() });
    const message = await this.message(current);
    const results: Partial<Record<PromotionChannel, ChannelResult>> = { ...current.results };
    for (const channel of pendingChannels(current)) {
      const at = this.now().toISOString();
      const problem = channelProblem(current, channel);
      const publisher = this.options.promotionPublishers?.[channel];
      if (problem || !publisher) {
        results[channel] = { ok: false, at, error: problem ?? NOT_SET_UP[channel] };
        continue;
      }
      try {
        const out = await publisher(message);
        results[channel] = { ok: true, at, ...out };
      } catch (err) {
        results[channel] = { ok: false, at, error: err instanceof Error ? err.message : String(err) };
      }
    }
    current = { ...current, results };
    const status = statusAfterRun(current);
    const at = this.now().toISOString();
    return this.repo.savePromotion({ ...current, status, publishedAt: status === "publicada" ? at : current.publishedAt, updatedAt: at });
  }

  private async message(p: Promotion): Promise<PromotionMessage> {
    const wantsEmail = p.channels.includes("email");
    const subscribers = wantsEmail ? eventSubscribers(await this.repo.listNewsletterSignups()) : [];
    return {
      text: p.text,
      imageUrl: p.imageUrl ? (p.imageUrl.startsWith("/") ? `${this.siteUrl}${p.imageUrl}` : p.imageUrl) : undefined,
      link: postUrl({ slug: p.postSlug }, this.siteUrl),
      emailSubject: p.emailSubject,
      emailBody: p.emailBody,
      recipients: subscribers.map((s) => ({ email: s.email, unsubscribeUrl: this.unsubscribeUrl(s.email) })),
    };
  }

  unsubscribeUrl(email: string) {
    const base = (this.options.publicUrl ?? "http://localhost:4000").replace(/\/$/, "");
    return `${base}/newsletter/sair?email=${encodeURIComponent(email.toLowerCase())}&t=${this.unsubscribeToken(email)}`;
  }

  private unsubscribeToken(email: string) {
    return createHmac("sha256", this.options.unsubscribeSecret ?? this.options.adminToken).update(`newsletter:${email.toLowerCase()}`).digest("hex").slice(0, 32);
  }

  checkUnsubscribeToken(email: string, token: string) {
    const expected = Buffer.from(this.unsubscribeToken(email));
    const given = Buffer.from(token);
    return given.length === expected.length && timingSafeEqual(given, expected);
  }
}
