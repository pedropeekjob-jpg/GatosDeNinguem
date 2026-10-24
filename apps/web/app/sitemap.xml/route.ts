import { buildSitemapXml, type SitemapEntry } from "@gn/seo";
import { getSeoSettings, listCats, listPages, listPosts, listProducts } from "@/lib/content";
import { switchedOffRedirect } from "@/lib/features";

export const revalidate = 3600;
export const dynamic = "force-static";

/** Built from content, so new cats, news and noindex choices appear automatically. */
export async function GET() {
  const [settings, pages, cats, posts, products] = await Promise.all([getSeoSettings(), listPages(), listCats(), listPosts(), listProducts()]);
  const entries: SitemapEntry[] = [
    ...pages.filter((p) => !switchedOffRedirect(p.path)).map((p) => ({ path: p.path, lastModified: p.updatedAt, noindex: p.seo.noindex, priority: p.path === "/" ? 1 : 0.8 })),
    ...cats.map((c) => ({ path: `/adotar/${c.slug}`, lastModified: c.updatedAt, noindex: c.seo.noindex, priority: c.status === "para-adocao" ? 0.9 : 0.5 })),
    ...posts.map((p) => ({ path: `/noticias/${p.slug}`, lastModified: p.updatedAt, noindex: p.seo.noindex, priority: 0.6 })),
    ...products.map((p) => ({ path: `/loja/${p.slug}`, lastModified: p.updatedAt, priority: 0.5 })),
  ];
  return new Response(buildSitemapXml(settings, entries), { headers: { "content-type": "application/xml; charset=utf-8" } });
}
