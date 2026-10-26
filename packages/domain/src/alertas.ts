import { z } from "zod";
import { ageLabel, type Cat } from "./content";

/**
 * "Avisem-me quando chegarem gatos": visitors leave an email (or allow notifications on their device)
 * and hear about each cat the moment it is put up for adoption. Email needs a click on a confirmation
 * link before anything is sent (double opt-in); unconfirmed sign-ups are dropped after a week.
 */

export const alertAgeGroupSchema = z.enum(["bebe", "jovem", "adulto", "senior"]);
export type AlertAgeGroup = z.infer<typeof alertAgeGroupSchema>;
export const alertAgeGroups = alertAgeGroupSchema.options;
export const alertAgeGroupLabel: Record<AlertAgeGroup, string> = {
  bebe: "Bebés (até 1 ano)",
  jovem: "Jovens (1 a 3 anos)",
  adulto: "Adultos (4 a 9 anos)",
  senior: "Séniores (10 anos ou mais)",
};

export function alertAgeGroup(ageYears: number): AlertAgeGroup {
  if (ageYears < 1) return "bebe";
  if (ageYears < 4) return "jovem";
  if (ageYears < 10) return "adulto";
  return "senior";
}

/** Optional preferences. Empty lists and unticked boxes mean "any cat". */
export const catAlertFiltersSchema = z.object({
  ages: z.array(alertAgeGroupSchema).max(4).default([]),
  sexes: z.array(z.enum(["macho", "femea"])).max(2).default([]),
  /** Only cats known to get on with children / other cats / dogs. */
  withKids: z.boolean().default(false),
  withCats: z.boolean().default(false),
  withDogs: z.boolean().default(false),
});
export type CatAlertFilters = z.infer<typeof catAlertFiltersSchema>;
export const noAlertFilters: CatAlertFilters = { ages: [], sexes: [], withKids: false, withCats: false, withDogs: false };

const consent = z.literal(true, { errorMap: () => ({ message: "Precisa de aceitar para receber os avisos" }) });

export const catAlertSignupSchema = z.object({
  email: z.string({ required_error: "Indique um email válido" }).trim().email("Indique um email válido").max(200),
  filters: catAlertFiltersSchema.default(noAlertFilters),
  consent,
});
export type CatAlertSignup = z.infer<typeof catAlertSignupSchema>;

/** What the browser's PushManager gives us (PushSubscription.toJSON()). */
export const pushSubscriptionSchema = z.object({
  endpoint: z.string().url().startsWith("https://").max(1000),
  keys: z.object({ p256dh: z.string().min(10).max(200), auth: z.string().min(8).max(100) }),
});
export type PushSubscriptionJson = z.infer<typeof pushSubscriptionSchema>;

/** Notifications on this device. The browser's own permission prompt is the confirmation, so no email round trip. */
export const catAlertPushSignupSchema = z.object({
  subscription: pushSubscriptionSchema,
  filters: catAlertFiltersSchema.default(noAlertFilters),
  consent,
});
export type CatAlertPushSignup = z.infer<typeof catAlertPushSignupSchema>;

export const catAlertSubscriberSchema = z.object({
  id: z.string(),
  channel: z.enum(["email", "push"]),
  /** Lower case. Only for channel "email". */
  email: z.string().optional(),
  push: pushSubscriptionSchema.optional(),
  filters: catAlertFiltersSchema,
  /** "pendente" until the confirmation link is opened (email only). */
  status: z.enum(["pendente", "ativo"]),
  /** New preferences from a second sign-up with the same email; they replace `filters` once confirmed. */
  pendingFilters: catAlertFiltersSchema.optional(),
  createdAt: z.string().datetime(),
  /** When consent was given: the confirmation click for email, the sign-up for push. Kept as proof (RGPD). */
  confirmedAt: z.string().datetime().optional(),
  /** Last confirmation email, so the form cannot be used to flood someone's inbox. */
  confirmationSentAt: z.string().datetime().optional(),
  alertsSent: z.number().int().min(0).default(0),
  lastAlertAt: z.string().datetime().optional(),
});
export type CatAlertSubscriber = z.infer<typeof catAlertSubscriberSchema>;

/** One alert per cat, ever: a cat that goes back to "para adoção" after a reservation is not announced again. */
export const catAlertSentSchema = z.object({
  catId: z.string(),
  catName: z.string(),
  catSlug: z.string(),
  sentAt: z.string().datetime(),
  emails: z.number().int().min(0),
  pushes: z.number().int().min(0),
  /** Set when a channel could not send (not set up, provider error). */
  problem: z.string().optional(),
});
export type CatAlertSent = z.infer<typeof catAlertSentSchema>;

export const PENDING_ALERT_DAYS = 7;
/** A second confirmation email to the same address waits at least this long. */
export const CONFIRMATION_RESEND_MINUTES = 10;

export function matchesAlertFilters(cat: Pick<Cat, "ageYears" | "sex" | "goodWithKids" | "goodWithCats" | "goodWithDogs">, f: CatAlertFilters): boolean {
  if (f.ages.length > 0 && !f.ages.includes(alertAgeGroup(cat.ageYears))) return false;
  if (f.sexes.length > 0 && !f.sexes.includes(cat.sex)) return false;
  if (f.withKids && cat.goodWithKids !== true) return false;
  if (f.withCats && cat.goodWithCats !== true) return false;
  if (f.withDogs && cat.goodWithDogs !== true) return false;
  return true;
}

/** "Todos os gatos" or e.g. "Bebés ou jovens · fêmeas · que se dão com crianças". */
export function describeAlertFilters(f: CatAlertFilters): string {
  const parts: string[] = [];
  if (f.ages.length > 0 && f.ages.length < 4) {
    const names: Record<AlertAgeGroup, string> = { bebe: "bebés", jovem: "jovens", adulto: "adultos", senior: "séniores" };
    const s = f.ages.map((a) => names[a]).join(" ou ");
    parts.push(s.charAt(0).toUpperCase() + s.slice(1));
  }
  if (f.sexes.length === 1) parts.push(f.sexes[0] === "femea" ? "fêmeas" : "machos");
  const with_ = [f.withKids && "crianças", f.withCats && "outros gatos", f.withDogs && "cães"].filter(Boolean) as string[];
  if (with_.length > 0) parts.push(`que se dão com ${with_.length > 1 ? `${with_.slice(0, -1).join(", ")} e ${with_.at(-1)}` : with_[0]}`);
  if (parts.length === 0) return "Todos os gatos";
  const text = parts.join(" · ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Subscribers who should hear about this cat: confirmed, and the cat fits their preferences. */
export function alertRecipients<T extends Pick<CatAlertSubscriber, "status" | "filters">>(cat: Parameters<typeof matchesAlertFilters>[0], subscribers: T[]): T[] {
  return subscribers.filter((s) => s.status === "ativo" && matchesAlertFilters(cat, s.filters));
}

export function isExpiredPending(s: Pick<CatAlertSubscriber, "status" | "createdAt">, now: Date): boolean {
  return s.status === "pendente" && now.getTime() - new Date(s.createdAt).getTime() > PENDING_ALERT_DAYS * 86_400_000;
}

/** The email (plain text, like the other emails the association sends) and the notification for one cat. */
export function catAlertMessage(cat: Pick<Cat, "name" | "slug" | "sex" | "ageYears" | "summary">, siteUrl: string) {
  const link = `${siteUrl.replace(/\/$/, "")}/adotar/${cat.slug}`;
  const novo = cat.sex === "femea" ? "nova" : "novo";
  return {
    link,
    subject: `${cat.name} procura família`,
    text: `Há um${cat.sex === "femea" ? "a" : ""} gat${cat.sex === "femea" ? "a" : "o"} ${novo} para adoção na Gatos de Ninguém.\n\n${cat.name} · ${ageLabel(cat.ageYears)}\n${cat.summary}\n\nConhecer ${cat.name}: ${link}`,
    pushTitle: `${cat.name} procura família`,
    pushBody: `${ageLabel(cat.ageYears)}. ${cat.summary}`.slice(0, 180),
  };
}

/** A cat counts as "new" for the website pop-up during this many days after it is put up for adoption. */
export const NEW_CAT_DAYS = 30;

/**
 * Cats to show in the "new cat" pop-up: put up for adoption in the last NEW_CAT_DAYS days and not yet seen
 * by this visitor (in the pop-up or on its own page), newest first. "*" in `seen` means all seen.
 */
export function unseenNewCats<T extends Pick<Cat, "slug" | "status" | "listedAt">>(cats: T[], seen: string[], now: Date, days = NEW_CAT_DAYS): T[] {
  if (seen.includes("*")) return [];
  const since = now.getTime() - days * 86_400_000;
  return cats
    .filter((c) => c.status === "para-adocao" && c.listedAt && new Date(c.listedAt).getTime() >= since && !seen.includes(c.slug))
    .sort((a, b) => b.listedAt!.localeCompare(a.listedAt!));
}
