import { z } from "zod";
import { seoFieldsSchema, slugSchema } from "./seo-fields";

export const catStatusSchema = z.enum(["a-recuperar", "para-adocao", "reservado", "adotado"]);
export type CatStatus = z.infer<typeof catStatusSchema>;

export const photoSchema = z.object({
  /** Absolute URL or a path served by the site, e.g. /demo/gato-1.svg */
  url: z.string().regex(/^(https?:\/\/|\/)/, "Use um URL ou um caminho que comece por /"),
  /** Required: describes the photo for screen readers and image search. */
  alt: z.string().min(3),
});
export type Photo = z.infer<typeof photoSchema>;

export const catSchema = z.object({
  id: z.string(),
  slug: slugSchema,
  name: z.string().min(1),
  sex: z.enum(["macho", "femea"]),
  ageYears: z.number().min(0).max(30),
  status: catStatusSchema,
  summary: z.string().max(200),
  story: z.string(),
  traits: z.array(z.string()).default([]),
  energy: z.enum(["calmo", "equilibrado", "ativo"]).default("equilibrado"),
  goodWithKids: z.boolean().optional(),
  goodWithCats: z.boolean().optional(),
  goodWithDogs: z.boolean().optional(),
  specialNeeds: z.string().optional(),
  sterilized: z.boolean(),
  vaccinated: z.boolean(),
  microchipped: z.boolean(),
  photos: z.array(photoSchema).min(1),
  /** Set when status becomes "adotado"; powers the Finais Felizes section. */
  adoptedAt: z.string().datetime().optional(),
  happyEnding: z
    .object({
      text: z.string(),
      photo: photoSchema.optional(),
      /** GDPR: adopter name and town are only shown with explicit consent. */
      adopterConsent: z.boolean().default(false),
      adopterName: z.string().optional(),
      adopterTown: z.string().optional(),
    })
    .optional(),
  seo: seoFieldsSchema.default({}),
  updatedAt: z.string().datetime(),
});
export type Cat = z.infer<typeof catSchema>;

/** A photo in a page's gallery (the shelter carousel on the home page). */
export const galleryPhotoSchema = photoSchema.extend({
  caption: z.string().max(120).optional(),
  /** Kept in the list but not shown on the site. */
  hidden: z.boolean().optional(),
});
export type GalleryPhoto = z.infer<typeof galleryPhotoSchema>;

/** How the shelter carousel behaves. Autoplay is always off for visitors who ask for reduced motion. */
export const carouselSettingsSchema = z.object({
  autoplay: z.boolean(),
  /** Seconds each photo stays before moving on. */
  intervalSeconds: z.number().int().min(3).max(20),
});
export type CarouselSettings = z.infer<typeof carouselSettingsSchema>;
export const defaultCarouselSettings: CarouselSettings = { autoplay: true, intervalSeconds: 6 };

/** Editable static pages (Início, Ajudar, SOS Gato, Sobre...). */
export const pageSchema = z.object({
  id: z.string(),
  /** Route path on the public site, e.g. "/" or "/ajudar". */
  path: z.string().regex(/^\/[a-z0-9/-]*$/),
  heading: z.string().min(1),
  intro: z.string(),
  /** Photos shown in a full-width carousel (used on the home page). */
  gallery: z.array(galleryPhotoSchema).default([]),
  carousel: carouselSettingsSchema.default(defaultCarouselSettings),
  seo: seoFieldsSchema.default({}),
  updatedAt: z.string().datetime(),
});
export type Page = z.infer<typeof pageSchema>;

export const postCategorySchema = z.enum(["urgente", "evento", "campanha", "noticia", "precisamos"]);
export type PostCategory = z.infer<typeof postCategorySchema>;

export const postCategoryLabel: Record<PostCategory, string> = {
  urgente: "Urgente",
  evento: "Evento",
  campanha: "Campanha",
  noticia: "Notícia",
  precisamos: "Precisamos de ajuda",
};

/** Announcements feed (Notícias). One post can later be sent to every channel. */
export const postSchema = z.object({
  id: z.string(),
  slug: slugSchema,
  title: z.string().min(1).max(120),
  category: postCategorySchema,
  summary: z.string().max(240),
  body: z.string(),
  photo: photoSchema.optional(),
  publishedAt: z.string().datetime(),
  /** Optional call to action, e.g. "Inscrever no Open Day". */
  cta: z.object({ label: z.string(), href: z.string() }).optional(),
  seo: seoFieldsSchema.default({}),
  updatedAt: z.string().datetime(),
});
export type Post = z.infer<typeof postSchema>;
export const postInputSchema = postSchema.omit({ id: true, updatedAt: true });
export type PostInput = z.infer<typeof postInputSchema>;

/** Adopted cats with the adopter details removed unless they consented. */
export function publicHappyEnding(cat: Cat) {
  if (cat.status !== "adotado" || !cat.happyEnding) return undefined;
  const h = cat.happyEnding;
  return {
    text: h.text,
    photo: h.photo,
    adopterName: h.adopterConsent ? h.adopterName : undefined,
    adopterTown: h.adopterConsent ? h.adopterTown : undefined,
  };
}

export function sortNewestFirst<T extends { publishedAt: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export const partnerCategorySchema = z.enum(["veterinario", "loja-animais", "restauracao", "comercio", "servicos", "outro"]);
export type PartnerCategory = z.infer<typeof partnerCategorySchema>;
export const partnerCategoryLabel: Record<PartnerCategory, string> = {
  veterinario: "Clínica veterinária",
  "loja-animais": "Loja de animais",
  restauracao: "Café e restauração",
  comercio: "Comércio",
  servicos: "Serviços",
  outro: "Outro",
};

/** A benefit a partner offers. With an id and a Patinhas cost it can be taken in exchange for Patinhas. */
export const perkSchema = z.object({
  /** Stable id so a perk can be taken with Patinhas. */
  id: z.string().regex(/^[a-z0-9-]+$/).optional(),
  description: z.string().min(3),
  /** Who can use it today, before the rewards system exists. */
  audience: z.enum(["amigos", "voluntarios", "todos"]).default("amigos"),
  patinhasCost: z.number().int().positive().optional(),
  minLevel: z.number().int().min(1).max(5).optional(),
  monthlyLimitPerPerson: z.number().int().positive().optional(),
});
export type Perk = z.infer<typeof perkSchema>;

export const partnerSchema = z.object({
  id: z.string(),
  slug: slugSchema,
  name: z.string().min(1),
  category: partnerCategorySchema,
  town: z.string(),
  address: z.string().optional(),
  website: z.string().url().optional(),
  logo: photoSchema.optional(),
  why: z.string().max(280).optional(),
  perks: z.array(perkSchema).default([]),
  active: z.boolean().default(true),
  since: z.string().datetime(),
});
export type Partner = z.infer<typeof partnerSchema>;

export const partnerApplicationSchema = z.object({
  businessName: z.string({ required_error: "Indique o nome do negócio" }).min(2, "Indique o nome do negócio"),
  contactName: z.string({ required_error: "Indique o seu nome" }).min(2, "Indique o seu nome"),
  email: z.string({ required_error: "Indique um email válido" }).email("Indique um email válido"),
  phone: z.string().optional(),
  town: z.string({ required_error: "Indique a localidade" }).min(2, "Indique a localidade"),
  offer: z.string().max(1000).optional(),
  consent: z.literal(true, { errorMap: () => ({ message: "Precisa de aceitar para o contactarmos" }) }),
});
export type PartnerApplication = z.infer<typeof partnerApplicationSchema>;

/** First contact from someone who wants to meet a cat. Screening happens with the team. */
export const adoptionInterestSchema = z.object({
  catSlug: slugSchema.optional(),
  name: z.string({ required_error: "Indique o seu nome" }).min(2, "Indique o seu nome"),
  phone: z.string({ required_error: "Indique um telefone com pelo menos 9 números" }).min(9, "Indique um telefone com pelo menos 9 números"),
  email: z.string().email("Indique um email válido").optional().or(z.literal("")),
  town: z.string({ required_error: "Indique onde vive" }).min(2, "Indique onde vive"),
  bestTime: z.enum(["manha", "tarde", "noite", "qualquer"]).default("qualquer"),
  message: z.string().max(1000).optional(),
  consent: z.literal(true, { errorMap: () => ({ message: "Precisa de aceitar para o contactarmos" }) }),
});
export type AdoptionInterest = z.infer<typeof adoptionInterestSchema>;

/** Numbers on the home page. Edited by the team in the back office. */
export const impactSchema = z.object({
  catsInShelter: z.number().int().min(0),
  adoptionsThisYear: z.number().int().min(0),
  sterilizationsThisYear: z.number().int().min(0),
  volunteers: z.number().int().min(0),
  campaign: z
    .object({
      title: z.string(),
      current: z.number().min(0),
      goal: z.number().positive(),
      unit: z.string(),
      href: z.string(),
    })
    .optional(),
  /** Shown under the numbers so visitors know how fresh they are. */
  updatedAt: z.string().datetime(),
});
export type Impact = z.infer<typeof impactSchema>;

export const newsletterSignupSchema = z.object({
  email: z.string({ required_error: "Indique um email válido" }).email("Indique um email válido"),
  interests: z.array(z.enum(["adocao", "voluntariado", "eventos", "campanhas"])).default([]),
  consent: z.literal(true, { errorMap: () => ({ message: "Precisa de aceitar para receber emails" }) }),
});
export type NewsletterSignup = z.infer<typeof newsletterSignupSchema>;

export const catInputSchema = catSchema.omit({ id: true, updatedAt: true });
export type CatInput = z.infer<typeof catInputSchema>;

export function ageLabel(ageYears: number): string {
  if (ageYears < 1) return "Bebé (menos de 1 ano)";
  if (ageYears === 1) return "1 ano";
  return `${ageYears} anos`;
}

export function isSenior(cat: Pick<Cat, "ageYears">): boolean {
  return cat.ageYears >= 10;
}

export const statusLabel: Record<CatStatus, string> = {
  "a-recuperar": "A recuperar",
  "para-adocao": "Procura família",
  reservado: "Reservado",
  adotado: "Já foi adotado",
};
