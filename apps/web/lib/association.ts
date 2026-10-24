/**
 * The association's public details, used in the footer and the legal pages.
 * NIF from the commercial registry (Iberinform); gatil address and email
 * given by the association on 2026-10-24.
 */
export const association = {
  name: "Associação Gatos de Ninguém",
  nif: "513283307",
  email: "gatosdeninguemvc@gmail.com",
  gatil: {
    label: "Gatil Gatos de Ninguém",
    lines: ["Rua dos Lentos, 6", "4925-070 Santa Marta de Portuzelo", "Viana do Castelo"],
    visits: "Visitas só com marcação",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent("Rua dos Lentos 6, 4925-070 Santa Marta de Portuzelo, Viana do Castelo"),
  },
} as const;

/** Shown at the top of the legal pages until the association approves the text. */
export const LEGAL_DRAFT_UPDATED = "24 de outubro de 2026";
