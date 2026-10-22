"use client";
import { useState } from "react";
import { Button } from "@gn/ui";

export function CopyIban({ iban }: { iban: string }) {
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
          {copied ? "IBAN copiado ✓" : "Copiar IBAN"}
        </Button>
      </div>
    </div>
  );
}
