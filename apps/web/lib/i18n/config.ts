/**
 * The site's languages. Portuguese is the default and lives at the plain addresses ("/adotar");
 * the others under a prefix ("/en/adotar", "/es/adotar", "/fr/adotar"). Addresses keep their Portuguese words.
 */
export const langs = ["pt", "en", "es", "fr"] as const;
export type Lang = (typeof langs)[number];
/** The languages with a prefix in the address. */
export const otherLangs = ["en", "es", "fr"] as const satisfies readonly Lang[];
export type OtherLang = (typeof otherLangs)[number];

export const isLang = (v: unknown): v is Lang => langs.includes(v as Lang);

/** For <html lang>, hreflang and dates. */
export const locale: Record<Lang, string> = { pt: "pt-PT", en: "en-GB", es: "es-ES", fr: "fr-FR" };
export const ogLocale: Record<Lang, string> = { pt: "pt_PT", en: "en_GB", es: "es_ES", fr: "fr_FR" };
/** Each language named in itself, as visitors look for it. */
export const langName: Record<Lang, string> = { pt: "Português", en: "English", es: "Español", fr: "Français" };

/**
 * Pages that exist only in Portuguese: the personal area (volunteers and members, all local) and the legal texts,
 * which the association has to approve word for word. Their links never get a prefix.
 */
const portugueseOnly = ["/conta", "/patinhas", "/privacidade", "/cookies", "/api", "/demo", "/fotos"];
export const isPortugueseOnly = (path: string) => portugueseOnly.some((p) => path === p || path.startsWith(`${p}/`) || path.startsWith(`${p}#`) || path.startsWith(`${p}?`));

/** "/adotar" in the given language: "/en/adotar". External links, files and Portuguese-only pages stay as they are. */
export function localize(href: string, lang: Lang): string {
  if (lang === "pt" || !href.startsWith("/") || href.startsWith("//")) return href;
  const path = href.split(/[?#]/)[0]!;
  if (isPortugueseOnly(path) || /\.[a-z0-9]+$/i.test(path)) return href;
  if (path === `/${lang}` || path.startsWith(`/${lang}/`)) return href;
  return href === "/" ? `/${lang}` : href.startsWith("/?") || href.startsWith("/#") ? `/${lang}${href.slice(1)}` : `/${lang}${href}`;
}

/** The language of a site path and the path without its prefix: "/en/adotar" → ["en", "/adotar"]. */
export function splitLang(pathname: string): [Lang, string] {
  const m = /^\/(en|es|fr)(?=\/|$)/.exec(pathname);
  if (!m) return ["pt", pathname || "/"];
  return [m[1] as Lang, pathname.slice(m[0].length) || "/"];
}
