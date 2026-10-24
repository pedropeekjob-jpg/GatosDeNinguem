import { describe, expect, it } from "vitest";
import { applyDebitEvent, sponsorEmail, sponsorNews, sponsorshipsOf, sponsorView, wantsEmail } from "./padrinhos";
import { seedCareAlerts, seedCatCare, seedCats, seedSponsorLetters, seedSponsorships } from "./seed";
import { sponsorshipFromRequest, sponsorshipRequestSchema, type Sponsorship } from "./escalas";
import type { CareAlert } from "./cuidados";

const tobias = seedCats.find((c) => c.slug === "tobias")!;
const ana = seedSponsorships.find((s) => s.id === "sp-3")!;

describe("sponsor news", () => {
  const help: CareAlert = { id: "x", catId: "cat-1", catName: "Tobias", kind: "tarefa", message: "Precisa-se de quem possa dar…", important: true, by: { name: "Rui" }, createdAt: "2026-10-21T12:00:00.000Z" };

  it("mixes the team's letters with what happened at the gatil, newest first, without help requests", () => {
    const news = sponsorNews({ alerts: [...seedCareAlerts, help], letters: seedSponsorLetters, catId: "cat-1", catSlug: "tobias", since: "2026-09-01T00:00:00.000Z" });
    expect(news.map((n) => n.kind)).toEqual(["nota", "carta"]);
    expect(news[1]).toMatchObject({ label: "Carta da equipa", photoUrl: "/fotos/gato-senior-ruby.webp", by: "Rui" });
  });

  it("only shows news about this cat", () => {
    const news = sponsorNews({ alerts: seedCareAlerts, letters: seedSponsorLetters, catId: "cat-4", catSlug: "estrela", since: "2026-01-01T00:00:00.000Z" });
    expect(news.every((n) => n.text.includes("Estrela"))).toBe(true);
  });
});

describe("finding a godparent's cats", () => {
  it("matches the email they sign in with, ignoring case, or their mobile", () => {
    expect(sponsorshipsOf(seedSponsorships, { email: "ANA@exemplo.pt" }).map((s) => s.id)).toEqual(["sp-3"]);
    expect(sponsorshipsOf(seedSponsorships, { phone: "+351 912 000 001" }).map((s) => s.id)).toEqual(["sp-3"]);
    expect(sponsorshipsOf(seedSponsorships, { email: "ninguem@exemplo.pt" })).toEqual([]);
  });

  it("shows where the cat is now and how the debit is going", () => {
    const v = sponsorView(ana, tobias, seedCatCare.find((c) => c.catId === "cat-1"), []);
    expect(v).toMatchObject({ state: "ativo", emailUpdates: "todas", debit: { status: "ativo", paidCents: 2000 }, cat: { name: "Tobias", pronoun: "o", whereNow: "Contentor Paquito, solto" } });
  });
});

describe("automatic debit", () => {
  const request = sponsorshipFromRequest(
    sponsorshipRequestSchema.parse({ catSlug: "tobias", name: "Carla", email: "carla@exemplo.pt", monthlyAmount: 10, consent: true }),
    "sp-novo",
    "2026-10-20",
  );

  it("asks for a debit by default", () => {
    expect(request).toMatchObject({ payment: "debito", pending: true, active: false, emailUpdates: "nenhuma" });
  });

  it("starts the sponsorship as soon as the mandate is signed, without the team confirming", () => {
    const s = applyDebitEvent(request, { kind: "ativo", at: "2026-10-24T10:00:00.000Z", sponsorshipId: "sp-novo", subscriptionId: "sub_1", customerId: "cus_1" }, "stripe", "2026-10-24");
    expect(s).toMatchObject({ active: true, pending: false, startDate: "2026-10-24", debit: { provider: "stripe", status: "ativo", subscriptionId: "sub_1", paidCents: 0 } });
  });

  it("adds up payments, flags failures and ends the sponsorship when the debit is cancelled", () => {
    let s: Sponsorship = applyDebitEvent(request, { kind: "ativo", at: "2026-10-24T10:00:00.000Z" }, "stripe", "2026-10-24");
    s = applyDebitEvent(s, { kind: "pago", at: "2026-10-27T10:00:00.000Z", amountCents: 1000 }, "stripe", "2026-10-27");
    s = applyDebitEvent(s, { kind: "pago", at: "2026-11-27T10:00:00.000Z", amountCents: 1000 }, "stripe", "2026-11-27");
    expect(s.debit).toMatchObject({ status: "ativo", paidCents: 2000, lastPaymentAt: "2026-11-27T10:00:00.000Z" });
    s = applyDebitEvent(s, { kind: "falhou", at: "2026-12-27T10:00:00.000Z" }, "stripe", "2026-12-27");
    expect(s.debit?.status).toBe("falhou");
    expect(s.active).toBe(true);
    s = applyDebitEvent(s, { kind: "cancelado", at: "2027-01-05T10:00:00.000Z" }, "stripe", "2027-01-05");
    expect(s).toMatchObject({ active: false, debit: { status: "cancelado" } });
  });
});

describe("emails", () => {
  it("respects what each godparent chose", () => {
    expect(wantsEmail(ana, "alerta")).toBe(true);
    expect(wantsEmail({ ...ana, emailUpdates: "cartas" }, "alerta")).toBe(false);
    expect(wantsEmail({ ...ana, emailUpdates: "cartas" }, "carta")).toBe(true);
    expect(wantsEmail({ ...ana, emailUpdates: "nenhuma" }, "carta")).toBe(false);
    expect(wantsEmail({ ...ana, active: false }, "carta")).toBe(false);
  });

  it("links to the godparent's page and makes the photo address absolute", () => {
    const mail = sponsorEmail({ kind: "carta", text: "Olá!", photoUrl: "/fotos/x.webp" }, tobias, "https://gatos.pt");
    expect(mail.subject).toBe("Notícias do Tobias");
    expect(mail.text).toContain("https://gatos.pt/fotos/x.webp");
    expect(mail.text).toContain("https://gatos.pt/conta/afilhados");
  });
});
