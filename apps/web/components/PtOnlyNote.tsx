import { i18n } from "@/lib/i18n/server";

/** On a page in another language, above a text the team has not translated yet. */
export function PtOnlyNote() {
  const { lang, t } = i18n();
  if (lang === "pt") return null;
  return (
    <p className="pt-only-note">
      {t({ pt: "", en: "This text is only in Portuguese for now.", es: "Por ahora, este texto solo está en portugués.", fr: "Pour l’instant, ce texte n’existe qu’en portugais." })}
    </p>
  );
}
