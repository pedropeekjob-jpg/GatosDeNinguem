import type { ContactTopic } from "@gn/domain";

/**
 * The association's public details, used in the footer and the legal pages.
 * NIF from the commercial registry (Iberinform); gatil address given by the association on 2026-10-24.
 * No email address on purpose (Pedro, 2026-10-26): every contact goes through the form at /contactos,
 * which the API emails to the association (CONTACT_EMAIL_TO / CONTACT_EMAIL_CC).
 */
export const association = {
  name: "Associação Gatos de Ninguém",
  nif: "513283307",
  gatil: {
    label: "Gatil Gatos de Ninguém",
    lines: ["Rua dos Lentos, 6", "4925-070 Santa Marta de Portuzelo", "Viana do Castelo"],
    visits: "Visitas só com marcação",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent("Rua dos Lentos 6, 4925-070 Santa Marta de Portuzelo, Viana do Castelo"),
  },
} as const;

/** Shown at the top of the legal pages until the association approves the text. */
export const LEGAL_DRAFT_UPDATED = "24 de outubro de 2026";

/** Link to the contact form, optionally with the topic already chosen. */
export const contactHref = (topic?: ContactTopic) => (topic ? `/contactos?assunto=${topic}` : "/contactos");
