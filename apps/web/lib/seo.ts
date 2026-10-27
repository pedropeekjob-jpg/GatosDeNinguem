import type { Metadata } from "next";
import type { SeoFields } from "@gn/domain";
import { absoluteUrl, resolveSeo, type SeoInput } from "@gn/seo";
import { getSeoSettings } from "./content";
import { isPortugueseOnly, langs, locale, localize, ogLocale, type Lang } from "./i18n/config";
import { i18n } from "./i18n/server";

/** The site's default description in the other languages (the Portuguese one is edited in the back office). */
const defaultDescription: Record<Exclude<Lang, "pt">, string> = {
  en: "An association in Viana do Castelo, Portugal, that rescues and neuters street cats and finds them families. Adopt, sponsor, volunteer or donate.",
  es: "Asociación de Viana do Castelo (Portugal) que rescata y esteriliza gatos callejeros y les busca familia. Adopte, apadrine, sea voluntario o done.",
  fr: "Association de Viana do Castelo (Portugal) qui sauve et stérilise les chats des rues et leur trouve une famille. Adoptez, parrainez, devenez bénévole ou faites un don.",
};

/** The same page in every language, for <link rel="alternate" hreflang> and the sitemap. */
export function languageAlternates(path: string): { hreflang: string; path: string }[] {
  if (isPortugueseOnly(path)) return [];
  return [...langs.map((l) => ({ hreflang: locale[l], path: localize(path, l) })), { hreflang: "x-default", path }];
}

/**
 * Next.js metadata from generated values plus the SEO editor's overrides. `path` is the Portuguese address;
 * pages in another language get their own address as canonical. The editor's title and description are written
 * in Portuguese, so other languages use the translated ones from the page instead.
 */
export async function buildMetadata(input: SeoInput): Promise<Metadata> {
  const { lang } = i18n();
  const settings = await getSeoSettings();
  const o = input.overrides ?? {};
  const local: SeoInput = lang === "pt" ? input : { ...input, path: localize(input.path, lang), overrides: { noindex: o.noindex, ogImage: o.ogImage, jsonLd: o.jsonLd } };
  const seo = resolveSeo({ ...settings, locale: ogLocale[lang], defaultDescription: lang === "pt" ? settings.defaultDescription : defaultDescription[lang] }, local);
  const images = seo.openGraph.image ? [{ url: seo.openGraph.image }] : undefined;
  const alternates = languageAlternates(input.path);
  return {
    title: { absolute: seo.title },
    description: seo.description,
    alternates: {
      canonical: seo.canonical,
      languages: alternates.length ? Object.fromEntries(alternates.map((a) => [a.hreflang, absoluteUrl(settings, a.path)])) : { "pt-PT": seo.canonical },
    },
    robots: { index: seo.robots.index, follow: seo.robots.follow },
    openGraph: {
      title: seo.openGraph.title,
      description: seo.openGraph.description,
      url: seo.openGraph.url,
      siteName: seo.openGraph.siteName,
      locale: seo.openGraph.locale,
      alternateLocale: alternates.length ? langs.filter((l) => l !== lang).map((l) => ogLocale[l]) : undefined,
      type: seo.openGraph.type === "article" ? "article" : "website",
      images,
    },
    twitter: { card: images ? "summary_large_image" : "summary", title: seo.title, description: seo.description, images: images?.map((i) => i.url) },
  };
}

export type { SeoFields };
