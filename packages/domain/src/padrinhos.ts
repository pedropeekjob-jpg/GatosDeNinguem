import { z } from "zod";
import { normalizePhone } from "./contas";
import { authorSchema, locationLabel, type CareAlert, type CareAlertKind, type CatCare } from "./cuidados";
import type { Cat } from "./content";
import type { DebitStatus, SponsorDebit, Sponsorship } from "./escalas";

/**
 * What a godparent follows about their cat: where it is, its medication, vet visits and the team's notes,
 * plus the letters the team writes them. Help requests between volunteers stay inside the team.
 */
export const SPONSOR_ALERT_KINDS: CareAlertKind[] = ["localizacao", "medicacao", "consulta", "nota"];
export const isSponsorAlert = (a: Pick<CareAlert, "kind">) => SPONSOR_ALERT_KINDS.includes(a.kind);

// ---------- letters from the team ----------

export const sponsorLetterInputSchema = z.object({
  catSlug: z.string().min(1),
  text: z.string({ required_error: "Escreva a novidade" }).trim().min(10, "Escreva pelo menos uma frase").max(3000),
  /** An uploaded photo (absolute address) or one of the site's own (starting with /). */
  photoUrl: z.string().regex(/^(https?:\/\/|\/)\S+$/, "Endereço de fotografia inválido").optional(),
});
export type SponsorLetterInput = z.infer<typeof sponsorLetterInputSchema>;

export const sponsorLetterSchema = sponsorLetterInputSchema.extend({
  id: z.string(),
  catName: z.string(),
  by: authorSchema,
  createdAt: z.string().datetime(),
});
export type SponsorLetter = z.infer<typeof sponsorLetterSchema>;

// ---------- the godparent's news feed ----------

export type SponsorNewsKind = CareAlertKind | "carta";
export const sponsorNewsLabel: Record<SponsorNewsKind, string> = {
  carta: "Carta da equipa",
  localizacao: "Mudou de sítio",
  medicacao: "Medicação",
  consulta: "Veterinário",
  nota: "No gatil",
  tarefa: "No gatil",
};
export type SponsorNewsItem = { id: string; at: string; kind: SponsorNewsKind; label: string; text: string; photoUrl?: string; by?: string };

/** Newest first. Only what happened since the sponsorship started (or the last 60 days, if that is longer ago). */
export function sponsorNews(input: { alerts: CareAlert[]; letters: SponsorLetter[]; catId: string; catSlug: string; since: string; limit?: number }): SponsorNewsItem[] {
  const from = input.since;
  const fromAlerts: SponsorNewsItem[] = input.alerts
    .filter((a) => a.catId === input.catId && isSponsorAlert(a) && a.createdAt >= from)
    .map((a) => ({ id: a.id, at: a.createdAt, kind: a.kind, label: sponsorNewsLabel[a.kind], text: a.message }));
  const fromLetters: SponsorNewsItem[] = input.letters
    .filter((l) => l.catSlug === input.catSlug && l.createdAt >= from)
    .map((l) => ({ id: l.id, at: l.createdAt, kind: "carta", label: sponsorNewsLabel.carta, text: l.text, photoUrl: l.photoUrl, by: l.by.name.split(" ")[0] }));
  return [...fromAlerts, ...fromLetters].sort((a, b) => b.at.localeCompare(a.at)).slice(0, input.limit ?? 30);
}

/** The feed starts 60 days before the sponsorship, so a new godparent does not open an empty page. */
export function newsSince(s: Pick<Sponsorship, "startDate">): string {
  return new Date(Date.parse(`${s.startDate}T00:00:00Z`) - 60 * 86_400_000).toISOString();
}

/** A godparent's sponsorships, found by the email or mobile they signed in with. */
export function sponsorshipsOf(list: Sponsorship[], who: { email?: string; phone?: string }): Sponsorship[] {
  const email = who.email?.trim().toLowerCase();
  const phone = who.phone ? normalizePhone(who.phone) : undefined;
  return list.filter((s) => (email && s.email?.trim().toLowerCase() === email) || (phone && s.phone && normalizePhone(s.phone) === phone));
}

/** What the godparent sees about one cat in their area on the site. */
export type SponsorView = {
  id: string;
  monthlyAmount: number;
  startDate: string;
  state: "ativo" | "a-aguardar" | "terminado";
  payment?: Sponsorship["payment"];
  debit?: Pick<SponsorDebit, "status" | "lastPaymentAt" | "paidCents">;
  emailUpdates: NonNullable<Sponsorship["emailUpdates"]>;
  cat: { id: string; slug: string; name: string; pronoun: "a" | "o"; status: Cat["status"]; photo?: { url: string; alt: string }; whereNow?: string };
  news: SponsorNewsItem[];
};

export function sponsorView(s: Sponsorship, cat: Cat, care: CatCare | undefined, news: SponsorNewsItem[]): SponsorView {
  const photo = cat.photos[0];
  return {
    id: s.id,
    monthlyAmount: s.monthlyAmount,
    startDate: s.startDate,
    state: s.active ? "ativo" : s.pending ? "a-aguardar" : "terminado",
    payment: s.payment,
    debit: s.debit ? { status: s.debit.status, lastPaymentAt: s.debit.lastPaymentAt, paidCents: s.debit.paidCents } : undefined,
    emailUpdates: s.emailUpdates ?? "todas",
    cat: {
      id: cat.id, slug: cat.slug, name: cat.name, pronoun: cat.sex === "femea" ? "a" : "o", status: cat.status,
      photo: photo ? { url: photo.url, alt: photo.alt } : undefined,
      whereNow: cat.status === "adotado" ? "Já tem família" : care ? (care.location.area === "fora" ? "Fora do gatil" : locationLabel(care.location)) : undefined,
    },
    news,
  };
}

// ---------- automatic debit ----------

/** What a payment provider tells us, in our own words, whatever the provider. */
export type DebitEvent = {
  kind: "ativo" | "pago" | "falhou" | "cancelado";
  at: string;
  sponsorshipId?: string;
  subscriptionId?: string;
  customerId?: string;
  amountCents?: number;
};

/** Finds which sponsorship an event is about: by our own id, or by the provider's subscription id. */
export function sponsorshipForEvent(list: Sponsorship[], e: DebitEvent): Sponsorship | undefined {
  return list.find((s) => (e.sponsorshipId && s.id === e.sponsorshipId) || (e.subscriptionId && s.debit?.subscriptionId === e.subscriptionId));
}

/**
 * A debit that starts makes the sponsorship active without anyone in the team having to confirm it.
 * A cancelled debit ends it. A failed payment only flags it: banks retry, and the team may call.
 */
export function applyDebitEvent(s: Sponsorship, e: DebitEvent, provider: string, today: string): Sponsorship {
  const debit: SponsorDebit = s.debit ?? { provider, status: "a-configurar", paidCents: 0 };
  const next = { ...debit, provider, ...(e.customerId ? { customerId: e.customerId } : {}), ...(e.subscriptionId ? { subscriptionId: e.subscriptionId } : {}) };
  switch (e.kind) {
    case "ativo":
      return { ...s, active: true, pending: false, startDate: s.pending ? today : s.startDate, payment: "debito", debit: { ...next, status: "ativo", startedAt: debit.startedAt ?? e.at } };
    case "pago":
      return { ...s, debit: { ...next, status: debit.status === "cancelado" ? "cancelado" : "ativo", lastPaymentAt: e.at, paidCents: debit.paidCents + (e.amountCents ?? 0) } };
    case "falhou":
      return { ...s, debit: { ...next, status: debit.status === "cancelado" ? "cancelado" : "falhou", lastFailureAt: e.at } };
    case "cancelado":
      return { ...s, active: false, pending: false, debit: { ...next, status: "cancelado", cancelledAt: e.at } };
  }
}

export const debitStatusTone: Record<DebitStatus, "success" | "warning" | "neutral"> = { ativo: "success", falhou: "warning", "a-configurar": "neutral", cancelado: "neutral" };

// ---------- emails ----------

export function wantsEmail(s: Pick<Sponsorship, "emailUpdates" | "active" | "email">, what: "carta" | "alerta"): boolean {
  if (!s.active || !s.email) return false;
  const pref = s.emailUpdates ?? "todas";
  return pref === "todas" || (pref === "cartas" && what === "carta");
}

export function sponsorEmail(item: Pick<SponsorNewsItem, "kind" | "text" | "photoUrl">, cat: Pick<Cat, "name" | "slug" | "sex">, siteUrl: string): { subject: string; text: string } {
  const d = cat.sex === "femea" ? "da" : "do";
  const subject = item.kind === "carta" ? `Notícias ${d} ${cat.name}` : `${cat.name}: ${sponsorNewsLabel[item.kind].toLowerCase()}`;
  const text = [
    item.text,
    item.photoUrl ? `\nFotografia: ${item.photoUrl.startsWith("/") ? siteUrl + item.photoUrl : item.photoUrl}` : "",
    `\nTudo sobre ${cat.name}, desde o início: ${siteUrl}/conta/afilhados`,
    `\n—\nRecebe este email porque apadrinha ${cat.sex === "femea" ? "a" : "o"} ${cat.name}. Pode escolher o que recebe na mesma página (entre com este email).`,
  ].join("");
  return { subject, text };
}
