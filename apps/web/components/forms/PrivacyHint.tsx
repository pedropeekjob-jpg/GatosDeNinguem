"use client";
import { useI18n } from "@/lib/i18n/client";

/** The line under every consent box: what the data is for, and where to read more (artigo 13.º RGPD). The policy itself is only in Portuguese. */
export function PrivacyHint({ children }: { children?: React.ReactNode }) {
  const { t } = useI18n();
  return (
    <>
      {children ?? t({ pt: "Usamos os seus dados apenas para isto.", en: "We only use your details for this.", es: "Solo usamos sus datos para esto.", fr: "Nous n’utilisons vos données que pour cela." })}{" "}
      <a href="/privacidade" target="_blank" rel="noopener" hrefLang="pt-PT">{t({ pt: "Como tratamos os seus dados", en: "How we handle your data (in Portuguese)", es: "Cómo tratamos sus datos (en portugués)", fr: "Comment nous traitons vos données (en portugais)" })}</a>
    </>
  );
}
