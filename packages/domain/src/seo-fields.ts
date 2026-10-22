import { z } from "zod";

/**
 * SEO overrides an SEO specialist can edit on any page or cat profile.
 * Every field is optional: empty means "use the generated default".
 */
export const seoFieldsSchema = z.object({
  title: z.string().max(120).optional(),
  description: z.string().max(320).optional(),
  canonicalUrl: z.string().url().optional(),
  ogImage: z.string().url().optional(),
  noindex: z.boolean().optional(),
  /** Extra JSON-LD objects appended to the generated ones. */
  jsonLd: z.array(z.record(z.unknown())).optional(),
});
export type SeoFields = z.infer<typeof seoFieldsSchema>;

export const slugSchema = z
  .string()
  .min(1)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use apenas letras minúsculas, números e hífens");

export const redirectSchema = z.object({
  id: z.string(),
  from: z.string().regex(/^\/[^\s?#]*$/, "Deve começar por / e não ter espaços"),
  to: z.string().min(1),
  permanent: z.boolean().default(true),
});
export type Redirect = z.infer<typeof redirectSchema>;

export const seoSettingsSchema = z.object({
  siteName: z.string().min(1),
  siteUrl: z.string().url(),
  titleTemplate: z.string().includes("%s"),
  defaultDescription: z.string().max(320),
  defaultOgImage: z.string().url().optional(),
  locale: z.string().default("pt_PT"),
  googleSiteVerification: z.string().optional(),
  /** Extra lines appended to robots.txt, e.g. "Disallow: /rascunhos". */
  robotsExtra: z.string().optional(),
  organization: z.object({
    legalName: z.string(),
    email: z.string().email().optional(),
    telephone: z.string().optional(),
    streetAddress: z.string().optional(),
    locality: z.string(),
    postalCode: z.string().optional(),
    country: z.string().default("PT"),
    sameAs: z.array(z.string().url()).default([]),
    logo: z.string().url().optional(),
  }),
});
export type SeoSettings = z.infer<typeof seoSettingsSchema>;
