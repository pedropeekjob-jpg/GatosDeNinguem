import { buildSitemapXml, type SitemapEntry } from "@gn/seo";
import { getSeoSettings, listCats, listPages, listPosts, listProducts } from "@/lib/content";
import { switchedOffRedirect } from "@/lib/features";
import { localize, otherLangs } from "@/lib/i18n/config";
import { languageAlternates } from "@/lib/seo";

export const revalidate = 3600;
export const dynamic = "force-static";

/**
 * Built from content, so new cats, news and noindex choices appear automatically. Every page is listed once per
 * language (Portuguese, then /en, /es, /fr), each with links to its twins, as search engines ask.
 */
export async function GET() {
  const [settings, pages, cats, posts, products] = await Promise.all([getSeoSettings(), listPages(), listCats(), listPosts(), listProducts()]);
  const entries: SitemapEntry[] = [
    ...pages.filter((p) => !switchedOffRedirect(p.path)).map((p) => ({ path: p.path, lastModified: p.updatedAt, noindex: p.seo.noindex, priority: p.path === "/" ? 1 : 0.8 })),
    ...cats.map((c) => ({ path: `/adotar/${c.slug}`, lastModified: c.updatedAt, noindex: c.seo.noindex, priority: c.status === "para-adocao" ? 0.9 : 0.5 })),
    ...posts.map((p) => ({ path: `/noticias/${p.slug}`, lastModified: p.updatedAt, noindex: p.seo.noindex, priority: 0.6 })),
    ...products.map((p) => ({ path: `/loja/${p.slug}`, lastModified: p.updatedAt, priority: 0.5 })),
  ];
  const withLanguages = entries.flatMap((e) => {
    const alternates = languageAlternates(e.path);
    if (!alternates.length) return [e];
    return [e, ...otherLangs.map((l) => ({ ...e, path: localize(e.path, l), priority: Math.max(0.1, (e.priority ?? 0.5) - 0.1) }))].map((x) => ({ ...x, alternates }));
  });
  return new Response(buildSitemapXml(settings, withLanguages), { headers: { "content-type": "application/xml; charset=utf-8" } });
}
