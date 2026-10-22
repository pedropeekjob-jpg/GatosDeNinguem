import type { Metadata } from "next";
import type { SeoFields } from "@gn/domain";
import { resolveSeo, type SeoInput } from "@gn/seo";
import { getSeoSettings } from "./content";

/** Next.js metadata from generated values plus the SEO editor's overrides. */
export async function buildMetadata(input: SeoInput): Promise<Metadata> {
  const settings = await getSeoSettings();
  const seo = resolveSeo(settings, input);
  const images = seo.openGraph.image ? [{ url: seo.openGraph.image }] : undefined;
  return {
    title: { absolute: seo.title },
    description: seo.description,
    alternates: { canonical: seo.canonical, languages: { "pt-PT": seo.canonical } },
    robots: { index: seo.robots.index, follow: seo.robots.follow },
    openGraph: {
      title: seo.openGraph.title,
      description: seo.openGraph.description,
      url: seo.openGraph.url,
      siteName: seo.openGraph.siteName,
      locale: seo.openGraph.locale,
      type: seo.openGraph.type === "article" ? "article" : "website",
      images,
    },
    twitter: { card: images ? "summary_large_image" : "summary", title: seo.title, description: seo.description, images: images?.map((i) => i.url) },
  };
}

export type { SeoFields };
