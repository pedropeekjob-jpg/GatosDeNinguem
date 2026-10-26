"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { IconGlobe } from "@gn/ui";
import { isPortugueseOnly, langName, langs, locale, localize, splitLang, type Lang } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/client";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
/** The language the visitor picked, so the suggestion below never comes back once they chose. */
const CHOICE_KEY = "gn-idioma";

const remember = (lang: Lang) => { try { localStorage.setItem(CHOICE_KEY, lang); } catch { /* private mode */ } };

/** The same page in another language; pages that exist only in Portuguese lead to that language's home page. */
function useOtherLanguages() {
  const pathname = usePathname() ?? "/";
  const [, path] = splitLang(BASE && pathname.startsWith(BASE) ? pathname.slice(BASE.length) || "/" : pathname);
  const [query, setQuery] = useState("");
  useEffect(() => setQuery(window.location.search), [pathname]);
  return (lang: Lang) => localize(isPortugueseOnly(path) && lang !== "pt" ? "/" : `${path}${query}`, lang);
}

/**
 * "PT" with a globe in the header, on every screen size: opens a short list with each language named in itself.
 * Plain links (a new page in that language), so it works without scripts and search engines follow them.
 */
export function LangSwitcher() {
  const { lang, t } = useI18n();
  const hrefIn = useOtherLanguages();
  const ref = useRef<HTMLDetailsElement>(null);
  const pathname = usePathname();

  useEffect(() => { if (ref.current) ref.current.open = false; }, [pathname]);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onDown = (e: PointerEvent) => { if (el.open && !el.contains(e.target as Node)) el.open = false; };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && el.open) { el.open = false; el.querySelector("summary")?.focus(); } };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("pointerdown", onDown); document.removeEventListener("keydown", onKey); };
  }, []);

  return (
    <details ref={ref} className="lang-switch">
      <summary className="gn-btn gn-btn--quiet lang-switch__button" aria-label={t({ pt: "Idioma: Português", en: "Language: English", es: "Idioma: Español", fr: "Langue : Français" })}>
        <span className="lang-switch__icon" aria-hidden="true"><IconGlobe /></span>
        <span aria-hidden="true">{lang.toUpperCase()}</span>
      </summary>
      <ul className="lang-switch__list">
        {langs.map((l) => (
          <li key={l}>
            <a href={hrefIn(l)} hrefLang={locale[l]} lang={locale[l]} aria-current={l === lang ? "true" : undefined} onClick={() => remember(l)}>
              {langName[l]}
            </a>
          </li>
        ))}
      </ul>
    </details>
  );
}

const suggestion: Record<Exclude<Lang, "pt">, { text: string; yes: string; no: string }> = {
  en: { text: "This site is also in English.", yes: "Read in English", no: "No, thanks" },
  es: { text: "Esta web también está en español.", yes: "Leer en español", no: "No, gracias" },
  fr: { text: "Ce site existe aussi en français.", yes: "Lire en français", no: "Non, merci" },
};

/**
 * A slim bar on the Portuguese site for visitors whose phone or computer is set to English, Spanish or French:
 * one tap to the same page in their language. Never shown again once they choose (either way).
 */
export function LangSuggestion() {
  const { lang } = useI18n();
  const hrefIn = useOtherLanguages();
  const [offer, setOffer] = useState<Exclude<Lang, "pt">>();

  useEffect(() => {
    if (lang !== "pt") return;
    try { if (localStorage.getItem(CHOICE_KEY)) return; } catch { return; }
    const preferred = (navigator.languages ?? [navigator.language]).map((l) => l.slice(0, 2).toLowerCase());
    if (preferred[0] === "pt") return;
    const first = preferred.find((l): l is Exclude<Lang, "pt"> => l === "en" || l === "es" || l === "fr");
    if (first) setOffer(first);
  }, [lang]);

  if (!offer) return null;
  const s = suggestion[offer];
  return (
    <div className="lang-suggest" role="region" aria-label={s.text} lang={locale[offer]}>
      <p>{s.text}</p>
      <a className="lang-suggest__yes" href={hrefIn(offer)} hrefLang={locale[offer]} onClick={() => remember(offer)}>{s.yes}</a>
      <button type="button" className="lang-suggest__no" onClick={() => { remember("pt"); setOffer(undefined); }}>{s.no}</button>
    </div>
  );
}
