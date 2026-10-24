import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { NestFastifyApplication } from "@nestjs/platform-fastify";
import type { Contact } from "@gn/domain";
import { createApp } from "../src/app";
import { InMemoryContentRepository } from "../src/content/in-memory.repository";
import { stripeSepaDebit, stripeSignature } from "../src/padrinhos/debit";
import { InMemoryPatinhasRepository } from "../src/patinhas/repository";

const TOKEN = "test-admin-token";
const admin = { authorization: `Bearer ${TOKEN}` };
const WHSEC = "whsec_test";
let clock = new Date("2026-11-02T10:00:00.000Z");
const codes: { to: Contact; code: string }[] = [];
const emails: { to: string; subject: string; text: string }[] = [];

/** A pretend Stripe: Checkout answers with a page address, cancelling a subscription succeeds. */
const stripeCalls: { url: string; method: string; body?: string }[] = [];
const fakeStripe = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
  stripeCalls.push({ url: String(url), method: init?.method ?? "GET", body: init?.body?.toString() });
  if (String(url).endsWith("/checkout/sessions")) return Response.json({ id: "cs_1", url: "https://checkout.stripe.com/c/pay/cs_1" });
  return Response.json({ id: "sub_1", status: "canceled" });
}) as unknown as typeof fetch;

let app: NestFastifyApplication;
beforeAll(async () => {
  app = await createApp({
    repository: new InMemoryContentRepository(),
    patinhas: new InMemoryPatinhasRepository(),
    adminToken: TOKEN,
    onContentChanged: async () => {},
    logger: false,
    now: () => clock,
    siteUrl: "https://gatos.example",
    sendLoginCode: async (to, code) => { codes.push({ to, code }); },
    sendSponsorEmail: async (to, m) => { emails.push({ to: to.email, ...m }); },
    sponsorDebit: stripeSepaDebit({ secretKey: "sk_test", webhookSecret: WHSEC, fetch: fakeStripe, now: () => clock }),
  });
  await app.init();
  await app.getHttpAdapter().getInstance().ready();
});
afterAll(async () => app.close());

type Method = "GET" | "POST" | "PUT";
const req = (method: Method, url: string, payload?: object, headers?: Record<string, string>) => app.inject({ method, url, payload, headers });
async function signIn(contact: string, name?: string) {
  await req("POST", "/conta/codigo", name ? { contact, name, consent: true } : { contact });
  const done = await req("POST", "/conta/entrar", { contact, code: codes.at(-1)!.code });
  return { authorization: `Bearer ${done.json().token}` };
}
function stripeEvent(type: string, object: object) {
  const raw = JSON.stringify({ id: `evt_${Math.random()}`, type, created: Math.floor(clock.getTime() / 1000), data: { object } });
  return app.inject({ method: "POST", url: "/padrinhos/debito/webhook", payload: raw, headers: { "content-type": "application/json", "stripe-signature": stripeSignature(raw, WHSEC, clock) } });
}
const sponsorships = async () => (await req("GET", "/escalas/padrinhos", undefined, admin)).json() as { id: string; sponsorName: string; active: boolean; pending?: boolean; debit?: { status: string; paidCents: number; subscriptionId?: string } }[];

describe("sponsoring with an automatic debit", () => {
  let id: string;

  it("sends the godparent to the provider's secure page, for the amount they chose, every month", async () => {
    const res = await req("POST", "/escalas/padrinhos/pedido", { catSlug: "mia", name: "Carla Dias", email: "carla@exemplo.pt", monthlyAmount: 12, newsByEmail: true, consent: true });
    expect(res.statusCode).toBe(201);
    expect(res.json().checkoutUrl).toBe("https://checkout.stripe.com/c/pay/cs_1");
    const params = new URLSearchParams(stripeCalls.at(-1)!.body);
    expect(params.get("mode")).toBe("subscription");
    expect(params.get("payment_method_types[0]")).toBe("sepa_debit");
    expect(params.get("line_items[0][price_data][unit_amount]")).toBe("1200");
    expect(params.get("line_items[0][price_data][recurring][interval]")).toBe("month");
    expect(params.get("success_url")).toBe("https://gatos.example/conta/afilhados?debito=ativo");
    const carla = (await sponsorships()).find((s) => s.sponsorName === "Carla Dias")!;
    expect(carla).toMatchObject({ pending: true, active: false, debit: { status: "a-configurar" } });
    id = carla.id;
  });

  it("refuses notifications that Stripe did not sign", async () => {
    const raw = JSON.stringify({ type: "checkout.session.completed", data: { object: { mode: "subscription", client_reference_id: id } } });
    const res = await app.inject({ method: "POST", url: "/padrinhos/debito/webhook", payload: raw, headers: { "content-type": "application/json", "stripe-signature": stripeSignature(raw, "whsec_wrong", clock) } });
    expect(res.statusCode).toBe(400);
    expect((await sponsorships()).find((s) => s.id === id)!.active).toBe(false);
  });

  it("starts the sponsorship as soon as the mandate is signed, and counts each payment", async () => {
    expect((await stripeEvent("checkout.session.completed", { mode: "subscription", client_reference_id: id, subscription: "sub_1", customer: "cus_1" })).json()).toEqual({ received: true, applied: 1 });
    await stripeEvent("invoice.paid", { amount_paid: 1200, customer: "cus_1", parent: { subscription_details: { subscription: "sub_1", metadata: { sponsorshipId: id } } } });
    const carla = (await sponsorships()).find((s) => s.id === id)!;
    expect(carla).toMatchObject({ active: true, pending: false, debit: { status: "ativo", subscriptionId: "sub_1", paidCents: 1200 } });
  });

  it("flags a failed payment (older Stripe API versions name the subscription elsewhere)", async () => {
    await stripeEvent("invoice.payment_failed", { customer: "cus_1", subscription: "sub_1" });
    expect((await sponsorships()).find((s) => s.id === id)!.debit!.status).toBe("falhou");
  });

  it("without a debit, the request waits for the team as before", async () => {
    const res = await req("POST", "/escalas/padrinhos/pedido", { catSlug: "mia", name: "Rita", email: "rita@exemplo.pt", monthlyAmount: 5, payment: "combinar", consent: true });
    expect(res.json()).toEqual({ ok: true });
  });
});

describe("the godparent's own page", () => {
  let carla: Record<string, string>;
  beforeAll(async () => { carla = await signIn("carla@exemplo.pt", "Carla Dias"); });

  it("needs a session", async () => {
    expect((await req("GET", "/conta/eu/apadrinhamentos")).statusCode).toBe(401);
  });

  it("shows each cat, where it is now, the debit and the news, found by the email they signed in with", async () => {
    const body = (await req("GET", "/conta/eu/apadrinhamentos", undefined, carla)).json();
    expect(body.debitAvailable).toBe(true);
    const mia = body.sponsorships.find((s: { cat: { slug: string } }) => s.cat.slug === "mia");
    expect(mia).toMatchObject({ state: "ativo", monthlyAmount: 12, emailUpdates: "todas", debit: { status: "falhou", paidCents: 1200 }, cat: { name: "Mia", whereNow: "Colónia" } });
    expect(JSON.stringify(body)).not.toContain("cus_1");
  });

  it("tells the godparent by email when something happens to their cat, but not about help requests between volunteers", async () => {
    emails.length = 0;
    clock = new Date(clock.getTime() + 60_000);
    await req("PUT", "/cuidados/gatos/cat-2/localizacao", { by: { name: "Rui" }, location: { area: "paquito", spot: "jaula", cage: "3", reason: "Constipação" } }, admin);
    expect(emails).toHaveLength(1);
    expect(emails[0]).toMatchObject({ to: "carla@exemplo.pt", subject: "Mia: mudou de sítio" });
    expect(emails[0]!.text).toContain("https://gatos.example/conta/afilhados");
    const news = (await req("GET", "/conta/eu/apadrinhamentos", undefined, carla)).json().sponsorships[0].news;
    expect(news[0]).toMatchObject({ kind: "localizacao", label: "Mudou de sítio" });
  });

  it("lets the godparent choose what arrives by email", async () => {
    expect((await req("PUT", `/conta/eu/apadrinhamentos/x/preferencias`, { emailUpdates: "cartas" }, carla)).statusCode).toBe(404);
    const [mia] = (await req("GET", "/conta/eu/apadrinhamentos", undefined, carla)).json().sponsorships;
    expect((await req("PUT", `/conta/eu/apadrinhamentos/${mia.id}/preferencias`, { emailUpdates: "cartas" }, carla)).statusCode).toBe(200);
    emails.length = 0;
    clock = new Date(clock.getTime() + 60_000);
    await req("POST", "/cuidados/notas", { by: { name: "Rui" }, catId: "cat-2", text: "Já espirra menos." }, admin);
    expect(emails).toHaveLength(0);
  });

  it("the team writes a letter: on every godparent's page, by email, and it counts as this month's news", async () => {
    clock = new Date(clock.getTime() + 60_000);
    const res = await req("POST", "/escalas/padrinhos/novidades", { catSlug: "mia", text: "A Mia já está melhor e voltou a brincar com as outras.", photoUrl: "/fotos/mia.webp", by: { name: "Feliciano Silva" } }, admin);
    expect(res.statusCode).toBe(201);
    expect(res.json()).toMatchObject({ sponsors: 1, emailed: 1 });
    expect(emails.at(-1)).toMatchObject({ subject: "Notícias da Mia" });
    expect(emails.at(-1)!.text).toContain("https://gatos.example/fotos/mia.webp");
    const news = (await req("GET", "/conta/eu/apadrinhamentos", undefined, carla)).json().sponsorships[0].news;
    expect(news[0]).toMatchObject({ kind: "carta", by: "Feliciano" });
    expect((await req("POST", "/escalas/padrinhos/novidades", { catSlug: "mia", text: "Olá", by: { name: "X" } })).statusCode).toBe(401);
  });

  it("lets the godparent stop the debit and the sponsorship themselves", async () => {
    const [mia] = (await req("GET", "/conta/eu/apadrinhamentos", undefined, carla)).json().sponsorships;
    expect((await req("POST", `/conta/eu/apadrinhamentos/${mia.id}/cancelar`, {}, carla)).statusCode).toBe(200);
    expect(stripeCalls.at(-1)).toMatchObject({ method: "DELETE", url: "https://api.stripe.com/v1/subscriptions/sub_1" });
    const after = (await sponsorships()).find((s) => s.id === mia.id)!;
    expect(after).toMatchObject({ active: false, debit: { status: "cancelado" } });
    // Stripe confirms later; that changes nothing more.
    await stripeEvent("customer.subscription.deleted", { id: "sub_1", metadata: { sponsorshipId: mia.id } });
    expect((await sponsorships()).find((s) => s.id === mia.id)!.active).toBe(false);
  });

  it("someone else cannot touch it", async () => {
    const ana = await signIn("ana@exemplo.pt");
    const mine = (await req("GET", "/conta/eu/apadrinhamentos", undefined, ana)).json().sponsorships;
    expect(mine.map((s: { cat: { slug: string } }) => s.cat.slug)).toEqual(["tobias"]);
    const carlas = (await sponsorships()).find((s) => s.sponsorName === "Carla Dias")!;
    expect((await req("POST", `/conta/eu/apadrinhamentos/${carlas.id}/cancelar`, {}, ana)).statusCode).toBe(404);
  });
});
