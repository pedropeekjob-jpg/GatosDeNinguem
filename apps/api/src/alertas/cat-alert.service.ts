import { NotFoundException } from "@nestjs/common";
import {
  alertRecipients,
  catAlertMessage,
  CONFIRMATION_RESEND_MINUTES,
  describeAlertFilters,
  isExpiredPending,
  type Cat,
  type CatAlertPushSignup,
  type CatAlertSent,
  type CatAlertSignup,
  type CatAlertSubscriber,
} from "@gn/domain";
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import type { ApiOptions, OutgoingEmail } from "../common/options";

type Purpose = "confirmar" | "sair";

/**
 * "Avisem-me quando chegarem gatos": sign-ups with double opt-in, and one alert per cat
 * the first time it is put up for adoption.
 */
export class CatAlertService {
  constructor(private readonly options: ApiOptions) {}
  private get repo() { return this.options.repository; }
  private now() { return this.options.now?.() ?? new Date(); }
  private get siteUrl() { return (this.options.siteUrl ?? "https://gatosdeninguem.pt").replace(/\/$/, ""); }
  private get apiUrl() { return (this.options.publicUrl ?? "http://localhost:4000").replace(/\/$/, ""); }

  /** Which channels can send, for the site (push key) and the back office. */
  setup() {
    return { email: !!this.options.sendEmail, push: !!(this.options.sendPush && this.options.pushPublicKey), pushPublicKey: this.options.sendPush ? this.options.pushPublicKey : undefined };
  }

  /**
   * Email sign-up. Always answers the same way, so the form does not reveal who is subscribed.
   * A second sign-up with the same address keeps the current alerts until the new preferences are confirmed.
   */
  async signUp(input: CatAlertSignup): Promise<{ ok: true; demoConfirmUrl?: string }> {
    const email = input.email.toLowerCase();
    const now = this.now();
    let s = await this.repo.findCatAlertSubscriber({ email });
    if (s && isExpiredPending(s, now)) {
      await this.repo.deleteCatAlertSubscriber(s.id);
      s = undefined;
    }
    if (!s) s = { id: randomUUID(), channel: "email", email, filters: input.filters, status: "pendente", createdAt: now.toISOString(), alertsSent: 0 };
    else if (s.status === "pendente") s = { ...s, filters: input.filters };
    else s = { ...s, pendingFilters: input.filters };

    const confirmUrl = this.link("confirmar", s.id);
    const recentlySent = s.confirmationSentAt && now.getTime() - new Date(s.confirmationSentAt).getTime() < CONFIRMATION_RESEND_MINUTES * 60_000;
    if (!recentlySent) {
      await this.send([{
        to: email,
        subject: "Confirme para receber os avisos de gatos para adoção",
        text: `Olá!\n\nPara receber um email quando chegar um gato para adoção à Gatos de Ninguém, confirme o seu email nesta ligação:\n${confirmUrl}\n\nEscolheu: ${describeAlertFilters(s.pendingFilters ?? s.filters)}.\n\nSe não foi você que pediu, ignore este email: não lhe enviaremos mais nada.`,
      }], `confirmação para ${email}: ${confirmUrl}`);
      s = { ...s, confirmationSentAt: now.toISOString() };
    }
    await this.repo.saveCatAlertSubscriber(s);
    return this.options.exposeLoginCodes ? { ok: true, demoConfirmUrl: confirmUrl } : { ok: true };
  }

  async confirm(id: string, token: string): Promise<CatAlertSubscriber | undefined> {
    if (!this.checkToken("confirmar", id, token)) return undefined;
    const s = await this.repo.getCatAlertSubscriber(id);
    if (!s) return undefined;
    const { pendingFilters, ...rest } = s;
    return this.repo.saveCatAlertSubscriber({ ...rest, filters: pendingFilters ?? s.filters, status: "ativo", confirmedAt: this.now().toISOString() });
  }

  /** Whether the link is genuine; unknown (already removed) subscribers count as done. */
  async unsubscribe(id: string, token: string): Promise<boolean> {
    if (!this.checkToken("sair", id, token)) return false;
    await this.repo.deleteCatAlertSubscriber(id);
    return true;
  }

  /** Notifications on a device: the browser's permission prompt is the confirmation. */
  async pushSignUp(input: CatAlertPushSignup) {
    const existing = await this.repo.findCatAlertSubscriber({ endpoint: input.subscription.endpoint });
    const now = this.now().toISOString();
    await this.repo.saveCatAlertSubscriber({
      id: existing?.id ?? randomUUID(),
      channel: "push",
      push: input.subscription,
      filters: input.filters,
      status: "ativo",
      createdAt: existing?.createdAt ?? now,
      confirmedAt: now,
      alertsSent: existing?.alertsSent ?? 0,
      lastAlertAt: existing?.lastAlertAt,
    });
    return { ok: true as const };
  }

  async pushUnsubscribe(endpoint: string) {
    const s = await this.repo.findCatAlertSubscriber({ endpoint });
    if (s) await this.repo.deleteCatAlertSubscriber(s.id);
    return { ok: true as const };
  }

  /** Back office view: no push keys, and sign-ups never confirmed within a week are dropped. */
  async overview() {
    const now = this.now();
    const all = await this.repo.listCatAlertSubscribers();
    const expired = all.filter((s) => isExpiredPending(s, now));
    await Promise.all(expired.map((s) => this.repo.deleteCatAlertSubscriber(s.id)));
    const subscribers = all.filter((s) => !expired.includes(s)).map(({ push, pendingFilters: _p, confirmationSentAt: _c, ...s }) => ({
      ...s,
      device: push ? deviceLabel(push.endpoint) : undefined,
      preferences: describeAlertFilters(s.filters),
    }));
    const { pushPublicKey: _key, ...setup } = this.setup();
    return { setup, subscribers, sent: await this.repo.listCatAlertsSent() };
  }

  async remove(id: string) {
    if (!(await this.repo.getCatAlertSubscriber(id))) throw new NotFoundException("Inscrição não encontrada.");
    await this.repo.deleteCatAlertSubscriber(id);
  }

  /**
   * Called whenever a cat is saved with status "para-adocao". Only the first time per cat sends anything,
   * unless `again` is set (the back office "Enviar outra vez" after a problem).
   */
  async catAvailable(cat: Cat, opts: { again?: boolean } = {}): Promise<CatAlertSent | undefined> {
    if (cat.status !== "para-adocao") return undefined;
    if (!opts.again && (await this.repo.getCatAlertSent(cat.id))) return undefined;
    const subscribers = await this.repo.listCatAlertSubscribers();
    const recipients = alertRecipients(cat, subscribers);
    const m = catAlertMessage(cat, this.siteUrl);
    const problems: string[] = [];

    const byEmail = recipients.filter((s) => s.channel === "email" && s.email);
    let emails = 0;
    if (byEmail.length > 0) {
      if (!this.options.sendEmail) problems.push("O envio de emails ainda não está ligado ao site.");
      else {
        try {
          await this.options.sendEmail(byEmail.map((s) => {
            const leave = this.link("sair", s.id);
            return {
              to: s.email!,
              subject: m.subject,
              text: `${m.text}\n\n—\nRecebe este email porque pediu avisos de gatos para adoção (${describeAlertFilters(s.filters).toLowerCase()}).\nDeixar de receber: ${leave}`,
              headers: { "List-Unsubscribe": `<${leave}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
            };
          }));
          emails = byEmail.length;
        } catch (err) {
          problems.push(err instanceof Error ? err.message : String(err));
        }
      }
    }

    const byPush = recipients.filter((s) => s.channel === "push" && s.push);
    let pushes = 0;
    if (byPush.length > 0) {
      const sendPush = this.options.sendPush;
      if (!sendPush) problems.push("As notificações ainda não estão ligadas ao site.");
      else {
        const photo = cat.photos[0]?.url;
        const image = photo ? (photo.startsWith("/") ? `${this.siteUrl}${photo}` : photo) : undefined;
        const results = await Promise.allSettled(byPush.map((s) => sendPush(s.push!, { title: m.pushTitle, body: m.pushBody, url: m.link, image })));
        for (const [i, r] of results.entries()) {
          if (r.status === "fulfilled" && r.value === "ok") pushes++;
          // The browser no longer accepts notifications (person blocked them or cleared the site).
          if (r.status === "fulfilled" && r.value === "gone") await this.repo.deleteCatAlertSubscriber(byPush[i]!.id);
        }
        const failed = results.filter((r) => r.status === "rejected").length;
        if (failed > 0) problems.push(`${failed} notificaç${failed === 1 ? "ão não saiu" : "ões não saíram"}.`);
      }
    }

    const at = this.now().toISOString();
    const reached = new Set([...(emails > 0 ? byEmail : []), ...byPush].map((s) => s.id));
    for (const s of subscribers.filter((x) => reached.has(x.id))) {
      if (s.channel === "push" && !(await this.repo.getCatAlertSubscriber(s.id))) continue;
      await this.repo.saveCatAlertSubscriber({ ...s, alertsSent: s.alertsSent + 1, lastAlertAt: at });
    }
    const sent: CatAlertSent = { catId: cat.id, catName: cat.name, catSlug: cat.slug, sentAt: at, emails, pushes, problem: problems.length ? problems.join(" ") : undefined };
    await this.repo.saveCatAlertSent(sent);
    return sent;
  }

  private async send(emails: OutgoingEmail[], logLine: string) {
    if (!this.options.sendEmail) {
      console.warn(`[avisos de gatos] sem envio de emails configurado; ${logLine}`);
      return;
    }
    await this.options.sendEmail(emails);
  }

  private link(purpose: Purpose, id: string) {
    return `${this.apiUrl}/alertas/${purpose}?id=${encodeURIComponent(id)}&t=${this.token(purpose, id)}`;
  }

  private token(purpose: Purpose, id: string) {
    return createHmac("sha256", this.options.unsubscribeSecret ?? this.options.adminToken).update(`alerta:${purpose}:${id}`).digest("hex").slice(0, 32);
  }

  checkToken(purpose: Purpose, id: string, token: string) {
    const expected = Buffer.from(this.token(purpose, id));
    const given = Buffer.from(token);
    return given.length === expected.length && timingSafeEqual(given, expected);
  }
}

/** Which push service the subscription belongs to, as a hint for managers ("Chrome / Android", "Safari / iPhone"…). */
function deviceLabel(endpoint: string): string {
  const host = (() => { try { return new URL(endpoint).hostname; } catch { return ""; } })();
  if (host.includes("google")) return "Chrome ou Android";
  if (host.includes("mozilla")) return "Firefox";
  if (host.includes("apple")) return "Safari (iPhone ou Mac)";
  if (host.includes("windows") || host.includes("microsoft")) return "Edge";
  return "Navegador";
}
