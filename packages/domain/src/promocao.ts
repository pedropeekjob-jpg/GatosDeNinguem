import { z } from "zod";
import type { NewsletterSignup, Post, PostEvent } from "./content";

/**
 * Event promotion: a week before each event the association's Facebook Page and Instagram
 * get a post and/or story and newsletter subscribers get an email. A draft is made as soon as
 * the event is saved; a manager reviews it once and it goes out on its own on the day.
 */
export const promotionChannelSchema = z.enum(["facebook-post", "facebook-story", "instagram-post", "instagram-story", "email"]);
export type PromotionChannel = z.infer<typeof promotionChannelSchema>;
export const promotionChannels = promotionChannelSchema.options;

export const promotionChannelLabel: Record<PromotionChannel, string> = {
  "facebook-post": "Publicação no Facebook",
  "facebook-story": "Story no Facebook",
  "instagram-post": "Publicação no Instagram",
  "instagram-story": "Story no Instagram",
  email: "Email aos subscritores",
};

export const promotionStatusSchema = z.enum(["rascunho", "aprovada", "a-publicar", "publicada", "com-erros", "cancelada"]);
export type PromotionStatus = z.infer<typeof promotionStatusSchema>;

export const promotionStatusLabel: Record<PromotionStatus, string> = {
  rascunho: "Por aprovar",
  aprovada: "Agendada",
  "a-publicar": "A publicar",
  publicada: "Publicada",
  "com-erros": "Com erros",
  cancelada: "Cancelada",
};

export const channelResultSchema = z.object({
  ok: z.boolean(),
  at: z.string().datetime(),
  /** The id Meta or the email provider gave the published item. */
  externalId: z.string().optional(),
  /** E.g. "Enviado a 12 subscritores". */
  detail: z.string().optional(),
  error: z.string().optional(),
});
export type ChannelResult = z.infer<typeof channelResultSchema>;

/** Instagram captions are cut at 2200 characters. */
export const SOCIAL_TEXT_MAX = 2200;
export const PROMOTION_DAYS_BEFORE = 7;

export const promotionSchema = z.object({
  id: z.string(),
  postId: z.string(),
  /** Copied from the event so the list reads well without loading every post. */
  postTitle: z.string(),
  postSlug: z.string(),
  eventStartsAt: z.string().datetime(),
  scheduledFor: z.string().datetime(),
  status: promotionStatusSchema,
  channels: z.array(promotionChannelSchema),
  text: z.string().min(1).max(SOCIAL_TEXT_MAX),
  /** Photo for posts and stories. Instagram only takes JPG. */
  imageUrl: z.string().regex(/^(https?:\/\/|\/)/).optional(),
  emailSubject: z.string().min(1).max(120),
  emailBody: z.string().min(1),
  /** The manager changed the texts, so later changes to the event do not overwrite them. */
  edited: z.boolean().default(false),
  /** Why the promotion needs another look, e.g. the event moved. */
  note: z.string().optional(),
  results: z.record(promotionChannelSchema, channelResultSchema).default({}),
  approvedAt: z.string().datetime().optional(),
  publishedAt: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Promotion = z.infer<typeof promotionSchema>;

/** What a manager may change before approving. */
export const promotionEditSchema = z.object({
  channels: z.array(promotionChannelSchema).optional(),
  text: z.string().min(1, "Escreva o texto da publicação.").max(SOCIAL_TEXT_MAX, `O texto tem de ter no máximo ${SOCIAL_TEXT_MAX} caracteres.`).optional(),
  imageUrl: z.string().regex(/^(https?:\/\/|\/)/, "Use um URL ou um caminho que comece por /").nullable().optional(),
  emailSubject: z.string().min(1, "Escreva o assunto do email.").max(120).optional(),
  emailBody: z.string().min(1, "Escreva o texto do email.").optional(),
  scheduledFor: z.string().datetime().optional(),
});
export type PromotionEdit = z.infer<typeof promotionEditSchema>;

const tz = "Europe/Lisbon";
const hour = (iso: string) => new Intl.DateTimeFormat("pt-PT", { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: tz }).format(new Date(iso)).replace(":", "h");
const day = (iso: string) => new Intl.DateTimeFormat("pt-PT", { weekday: "long", day: "numeric", month: "long", timeZone: tz }).format(new Date(iso));
const sameDay = (a: string, b: string) => new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(new Date(a)) === new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(new Date(b));

/** "domingo, 15 de novembro, das 10h00 às 17h00" */
export function eventWhen(e: Pick<PostEvent, "startsAt" | "endsAt">): string {
  if (e.endsAt && sameDay(e.startsAt, e.endsAt)) return `${day(e.startsAt)}, das ${hour(e.startsAt)} às ${hour(e.endsAt)}`;
  if (e.endsAt) return `de ${day(e.startsAt)}, às ${hour(e.startsAt)}, a ${day(e.endsAt)}`;
  return `${day(e.startsAt)}, às ${hour(e.startsAt)}`;
}

/** A week before the event, or straight away when the event is already less than a week off. */
export function promotionTime(e: Pick<PostEvent, "startsAt">, now: Date): string | undefined {
  const starts = new Date(e.startsAt).getTime();
  if (starts <= now.getTime()) return undefined;
  return new Date(Math.max(starts - PROMOTION_DAYS_BEFORE * 86_400_000, now.getTime())).toISOString();
}

export function postUrl(post: Pick<Post, "slug">, siteUrl: string) {
  return `${siteUrl.replace(/\/$/, "")}/noticias/${post.slug}`;
}

type EventPost = Post & { event: PostEvent };
export const isEventPost = (p: Post): p is EventPost => p.category === "evento" && !!p.event;

function texts(post: EventPost, siteUrl: string) {
  const when = eventWhen(post.event);
  const url = postUrl(post, siteUrl);
  const text = [
    post.title,
    "",
    `📅 ${capitalise(when)}`,
    `📍 ${post.event.location}`,
    "",
    post.summary,
    "",
    `Saiba mais em ${url}`,
    "",
    "#gatosdeninguem #vianadocastelo #adocaoresponsavel #gatos",
  ].join("\n");
  const emailBody = [
    "Olá!",
    "",
    `Daqui a uma semana: ${post.title}.`,
    "",
    `Quando: ${when}`,
    `Onde: ${post.event.location}`,
    "",
    post.summary,
    "",
    `Saiba mais: ${url}`,
    "",
    "Contamos consigo!",
    "Gatos de Ninguém",
  ].join("\n");
  return { text: text.slice(0, SOCIAL_TEXT_MAX), emailSubject: `Daqui a uma semana: ${post.title}`.slice(0, 120), emailBody };
}

const capitalise = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export const defaultPromotionChannels: PromotionChannel[] = ["facebook-post", "instagram-post", "instagram-story", "email"];

/** The draft made when an event is saved. None for past events or posts that are not events. */
export function draftPromotion(post: Post, ctx: { siteUrl: string; now: Date; id: string }): Promotion | undefined {
  if (!isEventPost(post)) return undefined;
  const scheduledFor = promotionTime(post.event, ctx.now);
  if (!scheduledFor) return undefined;
  const at = ctx.now.toISOString();
  return {
    id: ctx.id,
    postId: post.id,
    postTitle: post.title,
    postSlug: post.slug,
    eventStartsAt: post.event.startsAt,
    scheduledFor,
    status: "rascunho",
    channels: [...defaultPromotionChannels],
    imageUrl: post.photo?.url,
    ...texts(post, ctx.siteUrl),
    edited: false,
    results: {},
    createdAt: at,
    updatedAt: at,
  };
}

const DONE: PromotionStatus[] = ["a-publicar", "publicada", "com-erros"];

/**
 * Keeps a promotion in step with its event after the event is edited. Texts the manager wrote are kept;
 * an approved promotion whose date or place changed goes back for approval, since its text may now be wrong.
 */
export function syncPromotion(p: Promotion, post: Post, ctx: { siteUrl: string; now: Date }): Promotion {
  if (DONE.includes(p.status)) return p;
  const at = ctx.now.toISOString();
  if (!isEventPost(post)) return p.status === "cancelada" ? p : { ...p, status: "cancelada", note: "A notícia deixou de ser um evento.", updatedAt: at };
  const scheduledFor = promotionTime(post.event, ctx.now);
  if (!scheduledFor) return p.status === "cancelada" ? p : { ...p, status: "cancelada", note: "O evento já passou.", updatedAt: at };
  const moved = p.eventStartsAt !== post.event.startsAt || (!p.edited && texts(post, ctx.siteUrl).text !== p.text);
  const next: Promotion = {
    ...p,
    postTitle: post.title,
    postSlug: post.slug,
    eventStartsAt: post.event.startsAt,
    imageUrl: p.imageUrl ?? post.photo?.url,
    ...(p.edited ? {} : texts(post, ctx.siteUrl)),
    updatedAt: at,
  };
  // Keep a date the manager picked unless the event itself moved.
  if (p.eventStartsAt !== post.event.startsAt || new Date(p.scheduledFor) >= new Date(post.event.startsAt)) next.scheduledFor = scheduledFor;
  if (p.status === "cancelada") return { ...next, status: "rascunho", note: undefined, approvedAt: undefined };
  if (p.status === "aprovada" && moved)
    return { ...next, status: "rascunho", approvedAt: undefined, note: p.edited ? "O evento mudou: confirme que o texto continua certo e aprove de novo." : "O evento mudou e o texto foi atualizado: reveja e aprove de novo." };
  return next;
}

/** Applies a manager's edit; the texts become theirs and an approved promotion stays approved. */
export function editPromotion(p: Promotion, edit: PromotionEdit, now: Date): Promotion {
  const textsChanged = (edit.text !== undefined && edit.text !== p.text) || (edit.emailSubject !== undefined && edit.emailSubject !== p.emailSubject) || (edit.emailBody !== undefined && edit.emailBody !== p.emailBody);
  const { imageUrl, ...rest } = edit;
  return {
    ...p,
    ...Object.fromEntries(Object.entries(rest).filter(([, v]) => v !== undefined)),
    imageUrl: imageUrl === null ? undefined : imageUrl ?? p.imageUrl,
    edited: p.edited || textsChanged,
    updatedAt: now.toISOString(),
  };
}

export const isDue = (p: Promotion, now: Date) => p.status === "aprovada" && new Date(p.scheduledFor) <= now && new Date(p.eventStartsAt) > now;

/** Channels still to publish: chosen and without a successful result. */
export const pendingChannels = (p: Promotion) => p.channels.filter((c) => !p.results[c]?.ok);

export function statusAfterRun(p: Promotion): PromotionStatus {
  return pendingChannels(p).length === 0 ? "publicada" : "com-erros";
}

const isJpeg = (url: string) => /\.jpe?g($|\?)/i.test(url);

/** Why a channel cannot be published as the promotion stands, in words for the manager. */
export function channelProblem(p: Pick<Promotion, "imageUrl">, channel: PromotionChannel): string | undefined {
  if (channel === "email" || channel === "facebook-post") return undefined;
  if (!p.imageUrl) return "Precisa de uma fotografia.";
  if (channel.startsWith("instagram") && !isJpeg(p.imageUrl)) return "A Instagram só aceita fotografias JPG. Carregue a fotografia aqui na promoção.";
  return undefined;
}

/** Subscribers who asked for events, or who did not pick any topic. */
export function eventSubscribers<T extends Pick<NewsletterSignup, "email" | "interests">>(signups: T[]): T[] {
  return signups.filter((s) => s.interests.length === 0 || s.interests.includes("eventos"));
}
