import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { NestFastifyApplication } from "@nestjs/platform-fastify";
import { seedCats, type PushSubscriptionJson } from "@gn/domain";
import { createApp } from "../src/app";
import type { OutgoingEmail, PushNotification } from "../src/common/options";
import { InMemoryContentRepository } from "../src/content/in-memory.repository";

const TOKEN = "test-admin-token";
const auth = { authorization: `Bearer ${TOKEN}` };
let clock = new Date("2026-10-24T10:00:00.000Z");
const repo = new InMemoryContentRepository();
const emails: OutgoingEmail[] = [];
const pushes: { to: PushSubscriptionJson; n: PushNotification }[] = [];
const goneEndpoint = "https://fcm.googleapis.com/fcm/send/apagado";
let app: NestFastifyApplication;

beforeAll(async () => {
  app = await createApp({
    repository: repo,
    adminToken: TOKEN,
    onContentChanged: async () => {},
    logger: false,
    now: () => clock,
    siteUrl: "https://gatosdeninguem.pt",
    publicUrl: "https://api.gatosdeninguem.pt",
    sendEmail: async (batch) => { emails.push(...batch); },
    sendPush: async (to, n) => { if (to.endpoint === goneEndpoint) return "gone"; pushes.push({ to, n }); return "ok"; },
    pushPublicKey: "BPublicKeyForTests",
  });
  await app.init();
  await app.getHttpAdapter().getInstance().ready();
});
afterAll(async () => app.close());

const req = (method: "GET" | "POST" | "PATCH" | "DELETE", url: string, payload?: unknown, headers: Record<string, string> = {}) =>
  app.inject({ method, url, payload: payload as object, headers });
const linkIn = (text: string, kind: "confirmar" | "sair") => new URL(text.match(new RegExp(`https://api\\.gatosdeninguem\\.pt/alertas/${kind}\\S+`))![0]);

const newCat = (over: Record<string, unknown> = {}) => {
  const { id: _id, updatedAt: _u, ...base } = seedCats[0]!;
  return { ...base, slug: `gato-${Math.random().toString(36).slice(2, 8)}`, name: "Pirata", sex: "macho", ageYears: 0.5, status: "a-recuperar", goodWithKids: true, ...over };
};

describe("Avisem-me quando chegarem gatos", () => {
  let confirmUrl: URL;

  it("needs explicit consent", async () => {
    const res = await req("POST", "/alertas", { email: "ana@exemplo.pt" });
    expect(res.statusCode).toBe(400);
    expect(JSON.stringify(res.json())).toContain("Precisa de aceitar");
  });

  it("sends a confirmation email and sends nothing else until it is confirmed", async () => {
    const res = await req("POST", "/alertas", { email: "Ana@Exemplo.pt", consent: true, filters: { ages: ["bebe"] } });
    expect(res.statusCode).toBe(201);
    expect(res.json()).toEqual({ ok: true });
    expect(emails).toHaveLength(1);
    expect(emails[0]!.to).toBe("ana@exemplo.pt");
    expect(emails[0]!.text).toContain("Escolheu: Bebés");
    confirmUrl = linkIn(emails[0]!.text, "confirmar");

    const cat = (await req("POST", "/cats", newCat({ status: "para-adocao" }), auth)).json();
    expect(cat.id).toBeTruthy();
    expect(emails).toHaveLength(1);
    const overview = (await req("GET", "/alertas/gestao", undefined, auth)).json();
    expect(overview.subscribers[0]).toMatchObject({ email: "ana@exemplo.pt", status: "pendente", preferences: "Bebés" });
    expect(overview.sent[0]).toMatchObject({ catName: "Pirata", emails: 0 });
  });

  it("does not send a second confirmation within ten minutes", async () => {
    await req("POST", "/alertas", { email: "ana@exemplo.pt", consent: true, filters: { ages: ["bebe"] } });
    expect(emails).toHaveLength(1);
  });

  it("asks for a click before confirming, so mail scanners cannot confirm", async () => {
    const page = await req("GET", `/alertas/confirmar${confirmUrl.search}`);
    expect(page.statusCode).toBe(200);
    expect(page.body).toContain("<form method=\"post\">");
    expect((await req("GET", "/alertas/gestao", undefined, auth)).json().subscribers[0].status).toBe("pendente");

    expect((await req("POST", `/alertas/confirmar?id=${confirmUrl.searchParams.get("id")}&t=errado`)).statusCode).toBe(400);
    const done = await req("POST", `/alertas/confirmar${confirmUrl.search}`);
    expect(done.statusCode).toBe(200);
    expect(done.body).toContain("ana@exemplo.pt");
    const s = (await req("GET", "/alertas/gestao", undefined, auth)).json().subscribers[0];
    expect(s.status).toBe("ativo");
    expect(s.confirmedAt).toBe(clock.toISOString());
  });

  it("emails matching subscribers once, when a cat is put up for adoption", async () => {
    emails.length = 0;
    const created = (await req("POST", "/cats", newCat(), auth)).json();
    expect(emails).toHaveLength(0); // still recovering

    await req("PATCH", `/cats/${created.id}`, { status: "para-adocao" }, auth);
    expect(emails).toHaveLength(1);
    expect(emails[0]).toMatchObject({ to: "ana@exemplo.pt", subject: "Pirata procura família" });
    expect(emails[0]!.text).toContain(`https://gatosdeninguem.pt/adotar/${created.slug}`);
    expect(emails[0]!.headers?.["List-Unsubscribe"]).toContain("/alertas/sair");

    // Reserved and back: no second alert.
    await req("PATCH", `/cats/${created.id}`, { status: "reservado" }, auth);
    await req("PATCH", `/cats/${created.id}`, { status: "para-adocao" }, auth);
    expect(emails).toHaveLength(1);

    // Does not match "bebés".
    await req("POST", "/cats", newCat({ ageYears: 12, status: "para-adocao" }), auth);
    expect(emails).toHaveLength(1);
  });

  it("keeps the current alerts until new preferences are confirmed", async () => {
    emails.length = 0;
    clock = new Date(clock.getTime() + 60 * 60_000);
    await req("POST", "/alertas", { email: "ana@exemplo.pt", consent: true, filters: { ages: ["senior"] } });
    expect(emails).toHaveLength(1);
    const s = (await req("GET", "/alertas/gestao", undefined, auth)).json().subscribers[0];
    expect(s).toMatchObject({ status: "ativo", preferences: "Bebés" });
    await req("POST", `/alertas/confirmar${linkIn(emails[0]!.text, "confirmar").search}`);
    expect((await req("GET", "/alertas/gestao", undefined, auth)).json().subscribers[0].preferences).toBe("Séniores");
  });

  it("notifies devices and forgets the ones the browser dropped", async () => {
    const sub = { endpoint: "https://fcm.googleapis.com/fcm/send/abc123", keys: { p256dh: "BKeyKeyKeyKey", auth: "authauth" } };
    expect((await req("GET", "/alertas/config")).json()).toEqual({ push: true, pushPublicKey: "BPublicKeyForTests" });
    expect((await req("POST", "/alertas/push", { subscription: sub })).statusCode).toBe(400);
    expect((await req("POST", "/alertas/push", { subscription: sub, consent: true })).statusCode).toBe(201);
    expect((await req("POST", "/alertas/push", { subscription: { ...sub, endpoint: goneEndpoint }, consent: true })).statusCode).toBe(201);

    const cat = (await req("POST", "/cats", newCat({ name: "Nina", sex: "femea", status: "para-adocao" }), auth)).json();
    expect(pushes).toHaveLength(1);
    expect(pushes[0]!.n).toMatchObject({ title: "Nina procura família", url: `https://gatosdeninguem.pt/adotar/${cat.slug}` });
    const overview = (await req("GET", "/alertas/gestao", undefined, auth)).json();
    expect(overview.subscribers.filter((s: { channel: string }) => s.channel === "push")).toHaveLength(1);
    expect(overview.subscribers.find((s: { channel: string }) => s.channel === "push")).toMatchObject({ device: "Chrome ou Android", alertsSent: 1 });
    expect(JSON.stringify(overview)).not.toContain("authauth");
    expect(overview.sent[0]).toMatchObject({ catName: "Nina", pushes: 1 });

    await req("POST", "/alertas/push/sair", { endpoint: sub.endpoint });
    expect((await req("GET", "/alertas/gestao", undefined, auth)).json().subscribers.filter((s: { channel: string }) => s.channel === "push")).toHaveLength(0);
  });

  it("unsubscribes from the link in each email, with one click", async () => {
    emails.length = 0;
    await req("POST", "/cats", newCat({ ageYears: 11, status: "para-adocao" }), auth);
    const leave = linkIn(emails[0]!.text, "sair");
    expect((await req("GET", `/alertas/sair${leave.search}`)).body).toContain("Deixar de receber");
    expect((await req("POST", `/alertas/sair${leave.search}`)).statusCode).toBe(200);
    expect((await req("GET", "/alertas/gestao", undefined, auth)).json().subscribers).toHaveLength(0);
  });

  it("drops sign-ups never confirmed within a week", async () => {
    await req("POST", "/alertas", { email: "rui@exemplo.pt", consent: true });
    expect((await req("GET", "/alertas/gestao", undefined, auth)).json().subscribers).toHaveLength(1);
    clock = new Date(clock.getTime() + 8 * 86_400_000);
    expect((await req("GET", "/alertas/gestao", undefined, auth)).json().subscribers).toHaveLength(0);
  });

  it("keeps the subscriber list for managers only", async () => {
    expect((await req("GET", "/alertas/gestao")).statusCode).toBe(401);
  });
});

describe("without email set up", () => {
  it("still saves the cat and shows the problem to managers", async () => {
    const repo2 = new InMemoryContentRepository();
    const app2 = await createApp({ repository: repo2, adminToken: TOKEN, onContentChanged: async () => {}, logger: false, exposeLoginCodes: true });
    await app2.init();
    await app2.getHttpAdapter().getInstance().ready();
    const signup = (await app2.inject({ method: "POST", url: "/alertas", payload: { email: "eva@exemplo.pt", consent: true } })).json();
    // The demo shows the confirmation link on screen instead.
    expect(signup.demoConfirmUrl).toContain("/alertas/confirmar?id=");
    await app2.inject({ method: "POST", url: new URL(signup.demoConfirmUrl).pathname + new URL(signup.demoConfirmUrl).search });
    const created = await app2.inject({ method: "POST", url: "/cats", headers: auth, payload: newCat({ status: "para-adocao" }) });
    expect(created.statusCode).toBe(201);
    const overview = (await app2.inject({ method: "GET", url: "/alertas/gestao", headers: auth })).json();
    expect(overview.setup).toEqual({ email: false, push: false });
    expect(overview.sent[0].problem).toContain("emails ainda não está ligado");
    await app2.close();
  });
});
