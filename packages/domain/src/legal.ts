/**
 * The shop gives thank-you gifts for donations; it does not sell. The donor still commits to giving
 * the amount they chose, so the button says so plainly.
 */
export const DONATE_BUTTON_LABEL = "Confirmar o donativo";

/** Official electronic complaints book (DL 156/2005, as changed by DL 74/2017). */
export const COMPLAINTS_BOOK_URL = "https://www.livroreclamacoes.pt";

/** Out-of-court consumer dispute bodies (Lei 144/2015). CIAB covers the districts of Braga and Viana do Castelo. */
export const disputeBodies = [
  { name: "CIAB – Tribunal Arbitral de Consumo", area: "Distritos de Braga e Viana do Castelo", url: "https://www.ciab.pt" },
  { name: "CNIACC – Centro Nacional de Informação e Arbitragem de Conflitos de Consumo", area: "Todo o país", url: "https://www.cniacc.pt" },
] as const;

/** Minimum age to make a commitment the association relies on: adopting, ordering, fostering. */
export const ADULT_AGE = 18;
/** Age from which a person can consent alone to an online account in Portugal (Lei 58/2019, artigo 16.º). */
export const DIGITAL_CONSENT_AGE = 13;
