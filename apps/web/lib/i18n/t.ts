import { locale, localize, type Lang } from "./config";

/** A text in every language of the site, written side by side where it is used. */
export type Tr<T = string> = Record<Lang, T>;

/** What a page or component needs to speak the visitor's language. */
export type I18n = {
  lang: Lang;
  /** The BCP 47 tag, e.g. "en-GB", for Intl formatting. */
  locale: string;
  /** Picks this language's version: t({ pt: "Adotar", en: "Adopt", es: "Adoptar", fr: "Adopter" }). */
  t: <T>(text: Tr<T>) => T;
  /** A site link in this language: l("/adotar") → "/en/adotar". */
  l: (href: string) => string;
};

export function i18nFor(lang: Lang): I18n {
  return { lang, locale: locale[lang], t: (text) => text[lang], l: (href) => localize(href, lang) };
}
