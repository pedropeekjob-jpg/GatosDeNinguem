/**
 * Consumer rules for the online shop (Decreto-Lei 24/2014, distance contracts).
 * Kept here so the conditions page, the order confirmation and the tests agree.
 */

/** Days the buyer has to change their mind, counted from the day they (or someone for them) receive the articles. */
export const WITHDRAWAL_DAYS = 14;

/** Days the association has to give the money back after the buyer says they are returning the articles. */
export const REFUND_DAYS = 14;

/** Last day to say "I give up", as an ISO date (YYYY-MM-DD), for articles received on `receivedAt`. */
export function withdrawalDeadline(receivedAt: Date): string {
  const d = new Date(Date.UTC(receivedAt.getUTCFullYear(), receivedAt.getUTCMonth(), receivedAt.getUTCDate()));
  d.setUTCDate(d.getUTCDate() + WITHDRAWAL_DAYS);
  return d.toISOString().slice(0, 10);
}

/** The order button must say plainly that ordering means paying (artigo 5.º, n.º 3, DL 24/2014). */
export const ORDER_BUTTON_LABEL = "Encomendar com obrigação de pagar";

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
