import { Notice } from "@gn/ui";
import { LEGAL_DRAFT_UPDATED } from "@/lib/association";

/** Marks a legal text that the association still has to review before launch. */
export function LegalDraftNotice() {
  return (
    <Notice tone="info" title="Texto em revisão">
      Esta é uma proposta de texto, a rever pela direção da associação antes de o site ser lançado. Última atualização: {LEGAL_DRAFT_UPDATED}.
    </Notice>
  );
}
