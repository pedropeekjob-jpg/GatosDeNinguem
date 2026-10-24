/**
 * The association's public details, used in the footer and the legal pages.
 * Sources: NIF from the commercial registry (Iberinform), email from the
 * CIM Alto Minho list of animal associations. The gatil's exact street is not
 * public yet: until the association confirms it, we show the parish only.
 */
export const association = {
  name: "Associação Gatos de Ninguém",
  nif: "513283307",
  email: "gatos.de.ninguem@hotmail.com",
  gatil: {
    label: "Gatil Gatos de Ninguém",
    lines: ["Santa Marta de Portuzelo", "Viana do Castelo"],
    visits: "Visitas só com marcação",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent("Santa Marta de Portuzelo, Viana do Castelo"),
  },
} as const;

/** Shown at the top of the legal pages until the association approves the text. */
export const LEGAL_DRAFT_UPDATED = "24 de outubro de 2026";
