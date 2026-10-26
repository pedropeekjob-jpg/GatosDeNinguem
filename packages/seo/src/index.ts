import type { Redirect, SeoFields, SeoSettings } from "@gn/domain";

export const LIMITS = {
  title: { min: 30, max: 60 },
  description: { min: 70, max: 160 },
} as const;

export function absoluteUrl(settings: Pick<SeoSettings, "siteUrl">, pathOrUrl: string): string {
  if (/^https?:\/\//.test(pathOrUrl)) return pathOrUrl;
  const base = settings.siteUrl.replace(/\/+$/, "");
  const path = normalisePath(pathOrUrl);
  return path === "/" ? `${base}/` : `${base}${path}`;
}

export function normalisePath(path: string): string {
  const clean = ("/" + path.trim()).replace(/\/{2,}/g, "/");
  return clean.length > 1 ? clean.replace(/\/+$/, "") : "/";
}

export type SeoInput = {
  path: string;
  /** Generated title, e.g. the page heading or the cat's name. */
  title: string;
  description?: string;
  image?: string;
  type?: "website" | "article";
  overrides?: SeoFields;
};

export type ResolvedSeo = {
  title: string;
  description: string;
  canonical: string;
  robots: { index: boolean; follow: boolean };
  openGraph: { title: string; description: string; url: string; siteName: string; locale: string; type: string; image?: string };
  jsonLd: Record<string, unknown>[];
};

/**
 * Merges generated values with what the SEO editor set in the back office.
 * Override titles are used exactly as typed; generated titles get the site template.
 */
/** The association's horizontal logo on white, 1200×630, for link previews that have no photo of their own. */
export const DEFAULT_SHARE_IMAGE = "/partilha.png";
/** The logo's cat as a square image, for search engines (schema.org asks for a raster logo). */
export const DEFAULT_LOGO = "/icon-512.png";

export function resolveSeo(settings: SeoSettings, input: SeoInput): ResolvedSeo {
  const o = input.overrides ?? {};
  const title = o.title?.trim() || settings.titleTemplate.replace("%s", input.title);
  const description = o.description?.trim() || input.description?.trim() || settings.defaultDescription;
  const canonical = o.canonicalUrl || absoluteUrl(settings, input.path);
  // Without a photo, shares show the logo (apps/web/public/partilha.png).
  const rawImage = o.ogImage || input.image || settings.defaultOgImage || DEFAULT_SHARE_IMAGE;
  const image = rawImage ? absoluteUrl(settings, rawImage) : undefined;
  return {
    title,
    description,
    canonical,
    robots: { index: !o.noindex, follow: true },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: settings.siteName,
      locale: settings.locale,
      type: input.type ?? "website",
      ...(image ? { image } : {}),
    },
    jsonLd: o.jsonLd ?? [],
  };
}

export function organizationJsonLd(settings: SeoSettings) {
  const org = settings.organization;
  return {
    "@context": "https://schema.org",
    "@type": ["AnimalShelter", "NGO"],
    "@id": `${absoluteUrl(settings, "/")}#organizacao`,
    name: settings.siteName,
    legalName: org.legalName,
    url: absoluteUrl(settings, "/"),
    logo: org.logo || absoluteUrl(settings, DEFAULT_LOGO),
    ...(org.email ? { email: org.email } : {}),
    ...(org.telephone ? { telephone: org.telephone } : {}),
    address: {
      "@type": "PostalAddress",
      addressLocality: org.locality,
      addressCountry: org.country,
      ...(org.streetAddress ? { streetAddress: org.streetAddress } : {}),
      ...(org.postalCode ? { postalCode: org.postalCode } : {}),
    },
    sameAs: org.sameAs,
  };
}

export function breadcrumbJsonLd(settings: SeoSettings, items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(settings, item.path),
    })),
  };
}

/** Questions and answers, so search engines can show them under the page. */
export function faqJsonLd(items: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map(({ q, a }) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
  };
}

export type SitemapEntry = { path: string; lastModified?: string; noindex?: boolean; priority?: number };

const escapeXml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

export function buildSitemapXml(settings: SeoSettings, entries: SitemapEntry[]): string {
  const urls = entries
    .filter((e) => !e.noindex)
    .map((e) => {
      const parts = [`<loc>${escapeXml(absoluteUrl(settings, e.path))}</loc>`];
      if (e.lastModified) parts.push(`<lastmod>${e.lastModified.slice(0, 10)}</lastmod>`);
      if (e.priority !== undefined) parts.push(`<priority>${e.priority.toFixed(1)}</priority>`);
      return `  <url>${parts.join("")}</url>`;
    });
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`;
}

export function buildRobotsTxt(settings: SeoSettings, opts: { allowIndexing: boolean }): string {
  if (!opts.allowIndexing) return "User-agent: *\nDisallow: /\n";
  const lines = ["User-agent: *", "Allow: /"];
  if (settings.robotsExtra?.trim()) lines.push(settings.robotsExtra.trim());
  lines.push("", `Sitemap: ${absoluteUrl(settings, "/sitemap.xml")}`);
  return lines.join("\n") + "\n";
}

export function findRedirect(redirects: Redirect[], path: string): Redirect | undefined {
  const target = normalisePath(path).toLowerCase();
  return redirects.find((r) => normalisePath(r.from).toLowerCase() === target);
}

export type SeoIssueCode =
  | "title-missing"
  | "title-short"
  | "title-long"
  | "title-duplicate"
  | "description-missing"
  | "description-short"
  | "description-long";

export type SeoIssue = { id: string; code: SeoIssueCode; severity: "erro" | "aviso"; message: string };

/** Checks the final (resolved) title and description of every indexable page. */
export function auditSeo(items: { id: string; label: string; title: string; description: string }[]): SeoIssue[] {
  const issues: SeoIssue[] = [];
  const titleCount = new Map<string, number>();
  for (const i of items) titleCount.set(i.title.trim().toLowerCase(), (titleCount.get(i.title.trim().toLowerCase()) ?? 0) + 1);

  items.forEach((item, index) => {
    const t = item.title.trim();
    const d = item.description.trim();
    const add = (code: SeoIssueCode, severity: SeoIssue["severity"], message: string) =>
      issues.push({ id: item.id, code, severity, message: `${item.label}: ${message}` });

    if (!t) add("title-missing", "erro", "falta o título.");
    else if (t.length < LIMITS.title.min) add("title-short", "aviso", `o título tem ${t.length} caracteres; o ideal é entre ${LIMITS.title.min} e ${LIMITS.title.max}.`);
    else if (t.length > LIMITS.title.max) add("title-long", "aviso", `o título tem ${t.length} caracteres e pode ser cortado no Google (máximo ${LIMITS.title.max}).`);

    const firstWithTitle = items.findIndex((x) => x.title.trim().toLowerCase() === t.toLowerCase());
    if (t && (titleCount.get(t.toLowerCase()) ?? 0) > 1 && firstWithTitle !== index)
      add("title-duplicate", "erro", "tem o mesmo título que outra página. Cada página precisa de um título único.");

    if (!d) add("description-missing", "erro", "falta a descrição.");
    else if (d.length < LIMITS.description.min) add("description-short", "aviso", `a descrição tem ${d.length} caracteres; o ideal é entre ${LIMITS.description.min} e ${LIMITS.description.max}.`);
    else if (d.length > LIMITS.description.max) add("description-long", "aviso", `a descrição tem ${d.length} caracteres e pode ser cortada no Google (máximo ${LIMITS.description.max}).`);
  });
  return issues;
}
