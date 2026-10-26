import "server-only";
import { cache } from "react";
import { isLang, type Lang } from "./config";
import { i18nFor, type I18n } from "./t";

/**
 * The language of the page being built, kept for the length of one request so server components deep in the
 * page can ask for it without it being passed through every component. Pages and layouts set it from the address.
 */
const current = cache(() => ({ lang: "pt" as Lang }));

/** Server components: the language of the page being built. */
export function i18n(): I18n {
  return i18nFor(current().lang);
}

type LangParams = Promise<{ lang?: string }> | { lang?: string } | undefined;

/**
 * Pages, layouts and generateMetadata: reads the language from the address ("/en/…" gives params.lang = "en";
 * Portuguese pages have none) and makes it the language of the whole request.
 */
export async function langFrom(params: LangParams): Promise<I18n> {
  const value = (await params)?.lang;
  const lang: Lang = isLang(value) ? value : "pt";
  current().lang = lang;
  return i18nFor(lang);
}

/** The props of a page that exists in every language: app/[lang] passes params.lang, app/(pt) none. */
export type LangProps<P extends object = object> = { params: Promise<P & { lang?: string }> };
