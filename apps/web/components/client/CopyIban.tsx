"use client";
import { useState } from "react";
import { Button } from "@gn/ui";
import { useI18n } from "@/lib/i18n/client";

export function CopyIban({ iban }: { iban: string }) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  return (
    <div className="gn-stack gn-stack--s">
      <p><strong>IBAN</strong></p>
      <p className="iban">{iban}</p>
      <div>
        <Button
          variant="secondary"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(iban.replace(/\s/g, ""));
              setCopied(true);
            } catch { /* user can select the text above */ }
          }}
        >
          {copied ? t({ pt: "IBAN copiado ✓", en: "IBAN copied ✓", es: "IBAN copiado ✓", fr: "IBAN copié ✓" }) : t({ pt: "Copiar IBAN", en: "Copy IBAN", es: "Copiar IBAN", fr: "Copier l’IBAN" })}
        </Button>
      </div>
    </div>
  );
}
