import { BadRequestException, ConflictException, NotFoundException } from "@nestjs/common";
import {
  applyDebitEvent,
  isSponsorAlert,
  lisbonNow,
  newsSince,
  sponsorEmail,
  sponsorNews,
  sponsorshipForEvent,
  sponsorshipsOf,
  sponsorView,
  wantsEmail,
  type Account,
  type Author,
  type CareAlert,
  type Cat,
  type SponsorEmailUpdates,
  type SponsorLetterInput,
  type Sponsorship,
  type SponsorView,
} from "@gn/domain";
import { randomUUID } from "node:crypto";
import type { ApiOptions } from "../common/options";
import type { WebhookHeaders } from "./debit";

/** Godparents: their monthly debit, and news about their cat on the site and by email. */
export class SponsorService {
  constructor(private readonly options: ApiOptions) {}
  get repo() { return this.options.repository; }
  get debitReady() { return Boolean(this.options.sponsorDebit); }
  now() { return this.options.now?.() ?? new Date(); }
  private today() { return lisbonNow(this.now()).date; }
  private get site() { return (this.options.siteUrl ?? "https://gatosdeninguem.pt").replace(/\/$/, ""); }

  // ----- automatic debit -----

  /** The address of the provider's secure page. After it, the godparent lands on their own page on the site. */
  async startDebit(s: Sponsorship): Promise<{ checkoutUrl: string }> {
    const provider = this.options.sponsorDebit;
    if (!provider) throw new BadRequestException("O débito direto ainda não está disponível. A equipa vai contactá-lo para combinar.");
    if (s.debit?.status === "ativo") throw new ConflictException("O débito deste apadrinhamento já está ativo.");
    const cat = await this.repo.getCatBySlug(s.catSlug);
    if (!cat || cat.status === "adotado") throw new NotFoundException("Este gato já não precisa de padrinho.");
    const { url } = await provider.startMandate({
      sponsorship: s,
      catName: cat.name,
      successUrl: `${this.site}/conta/afilhados?debito=ativo`,
      cancelUrl: `${this.site}/apadrinhar/${cat.slug}?debito=cancelado`,
    });
    if (!s.debit) await this.repo.saveSponsorship({ ...s, payment: "debito", debit: { provider: provider.name, status: "a-configurar", paidCents: 0 } });
    return { checkoutUrl: url };
  }

  /** The provider tells us a debit started, was paid, failed or was cancelled. */
  async webhook(rawBody: string, headers: WebhookHeaders) {
    const provider = this.options.sponsorDebit;
    if (!provider) throw new NotFoundException();
    let events;
    try {
      events = provider.parseWebhook(rawBody, headers);
    } catch (err) {
      throw new BadRequestException((err as Error).message);
    }
    let applied = 0;
    for (const e of events) {
      const s = sponsorshipForEvent(await this.repo.listSponsorships(), e);
      if (!s) {
        console.warn(`[débito] ${e.kind} sem apadrinhamento correspondente`, e.subscriptionId ?? e.sponsorshipId ?? "");
        continue;
      }
      await this.repo.saveSponsorship(applyDebitEvent(s, e, provider.name, this.today()));
      applied++;
    }
    return { received: true, applied };
  }

  // ----- the godparent's own area -----

  async mine(account: Account): Promise<SponsorView[]> {
    const list = sponsorshipsOf(await this.repo.listSponsorships(), account).filter((s) => s.active || s.pending || s.debit);
    const [letters, care] = await Promise.all([this.repo.listSponsorLetters(), this.repo.listCatCare()]);
    const views: SponsorView[] = [];
    for (const s of list.sort((a, b) => Number(b.active) - Number(a.active) || b.startDate.localeCompare(a.startDate))) {
      const cat = await this.repo.getCatBySlug(s.catSlug);
      if (!cat) continue;
      const since = newsSince(s);
      const alerts = await this.repo.listCareAlerts({ catId: cat.id, since, limit: 60 });
      views.push(sponsorView(s, cat, care.find((c) => c.catId === cat.id), sponsorNews({ alerts, letters, catId: cat.id, catSlug: cat.slug, since })));
    }
    return views;
  }

  async ownSponsorship(account: Account, id: string): Promise<Sponsorship> {
    const s = sponsorshipsOf(await this.repo.listSponsorships(), account).find((x) => x.id === id);
    if (!s) throw new NotFoundException("Apadrinhamento não encontrado.");
    return s;
  }

  async setEmailUpdates(account: Account, id: string, emailUpdates: SponsorEmailUpdates) {
    const s = await this.ownSponsorship(account, id);
    return this.repo.saveSponsorship({ ...s, emailUpdates });
  }

  /** Stops the debit and ends the sponsorship. The team sees it in the back office. */
  async cancel(account: Account, id: string) {
    const s = await this.ownSponsorship(account, id);
    if (!s.active && !s.pending) throw new ConflictException("Este apadrinhamento já terminou.");
    if (s.debit && s.debit.status !== "cancelado" && this.options.sponsorDebit) {
      try {
        await this.options.sponsorDebit.cancel(s.debit);
      } catch (err) {
        console.error("Could not cancel the debit", err);
        throw new ConflictException("Não foi possível cancelar o débito agora. Tente daqui a pouco ou fale connosco.");
      }
    }
    const at = this.now().toISOString();
    return this.repo.saveSponsorship({ ...s, active: false, pending: false, ...(s.debit ? { debit: { ...s.debit, status: "cancelado" as const, cancelledAt: at } } : {}) });
  }

  // ----- news -----

  /** Every change about a cat at the gatil reaches its godparents who asked for everything. */
  async onCareAlert(alert: CareAlert) {
    if (!isSponsorAlert(alert) || !this.options.sendSponsorEmail) return;
    const cat = await this.repo.getCat(alert.catId);
    if (!cat) return;
    const to = (await this.repo.listSponsorships()).filter((s) => s.catSlug === cat.slug && wantsEmail(s, "alerta"));
    await this.email(to, cat, sponsorEmail({ kind: alert.kind, text: alert.message }, cat, this.site));
  }

  /** A letter from the team: kept on each godparent's page, emailed, and it counts as this month's news. */
  async sendLetter(input: SponsorLetterInput, by: Author) {
    const cat = await this.repo.getCatBySlug(input.catSlug);
    if (!cat) throw new NotFoundException("Gato não encontrado.");
    const letter = await this.repo.saveSponsorLetter({ ...input, id: randomUUID(), catName: cat.name, by, createdAt: this.now().toISOString() });
    const sponsors = (await this.repo.listSponsorships()).filter((s) => s.catSlug === cat.slug && s.active);
    const today = this.today();
    for (const s of sponsors) await this.repo.saveSponsorship({ ...s, lastUpdateSentAt: today });
    const emailed = await this.email(sponsors.filter((s) => wantsEmail(s, "carta")), cat, sponsorEmail({ kind: "carta", text: letter.text, photoUrl: letter.photoUrl }, cat, this.site));
    return { letter, sponsors: sponsors.length, emailed };
  }

  private async email(to: Sponsorship[], cat: Cat, message: { subject: string; text: string }) {
    const send = this.options.sendSponsorEmail;
    if (!send) return 0;
    let sent = 0;
    for (const s of to) {
      try {
        await send({ email: s.email!, name: s.sponsorName }, message);
        sent++;
      } catch (err) {
        console.error(`Could not email the godparent of ${cat.name}`, err);
      }
    }
    return sent;
  }
}
