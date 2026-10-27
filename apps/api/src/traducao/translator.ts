import type { TranslationLang } from "@gn/domain";

/**
 * Turns Portuguese texts into another language. `keep` lists words that must stay exactly as written: the
 * association's name, the cats' names (Estrela, Lua, Pimenta… are also ordinary words), Patinhas.
 */
export type Translator = {
  /** Shown in the back office: who translates. */
  name: string;
  translate(texts: string[], to: TranslationLang, keep: string[]): Promise<string[]>;
};

const deeplTarget: Record<TranslationLang, string> = { en: "EN-GB", es: "ES", fr: "FR" };
const escapeXml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const unescapeXml = (s: string) => s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Marks the words to keep so DeepL leaves them alone (XML tag handling with an ignored tag). */
export function protect(text: string, keep: string[]): string {
  let out = escapeXml(text);
  const words = [...new Set(keep.filter((w) => w.trim().length > 1))].sort((a, b) => b.length - a.length);
  if (words.length === 0) return out;
  const pattern = new RegExp(`(?<![\\p{L}\\p{N}])(${words.map((w) => escapeRegExp(escapeXml(w))).join("|")})(?![\\p{L}\\p{N}])`, "gu");
  out = out.replace(pattern, "<keep>$1</keep>");
  return out;
}

export const unprotect = (text: string) => unescapeXml(text.replace(/<\/?keep>/g, ""));

/**
 * DeepL (https://www.deepl.com/pro-api): good with European languages, and its free plan (500 000 characters a
 * month) is far more than the association writes. Free keys end in ":fx" and use their own address.
 */
export function deeplTranslator(apiKey: string, fetchImpl: typeof fetch = fetch): Translator {
  const url = apiKey.endsWith(":fx") ? "https://api-free.deepl.com/v2/translate" : "https://api.deepl.com/v2/translate";
  return {
    name: "DeepL",
    async translate(texts, to, keep) {
      if (texts.length === 0) return [];
      const res = await fetchImpl(url, {
        method: "POST",
        headers: { authorization: `DeepL-Auth-Key ${apiKey}`, "content-type": "application/json" },
        body: JSON.stringify({
          text: texts.map((t) => protect(t, keep)),
          source_lang: "PT",
          target_lang: deeplTarget[to],
          tag_handling: "xml",
          ignore_tags: ["keep"],
          preserve_formatting: true,
          // Friendly but polite, as the site is written.
          ...(to === "en" ? {} : { formality: "prefer_more" }),
        }),
        signal: AbortSignal.timeout(15_000),
      });
      if (!res.ok) throw new Error(`DeepL ${res.status}: ${(await res.text().catch(() => "")).slice(0, 200)}`);
      const body = (await res.json()) as { translations: { text: string }[] };
      if (body.translations.length !== texts.length) throw new Error("DeepL devolveu um número errado de textos.");
      return body.translations.map((t) => unprotect(t.text));
    },
  };
}
