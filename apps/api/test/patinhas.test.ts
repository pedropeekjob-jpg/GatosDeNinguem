import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { NestFastifyApplication } from "@nestjs/platform-fastify";
import { allFeatures, type Contact } from "@gn/domain";
import { createApp } from "../src/app";
import { InMemoryContentRepository } from "../src/content/in-memory.repository";
import { InMemoryPatinhasRepository } from "../src/patinhas/repository";

const TOKEN = "test-admin-token";
const admin = { authorization: `Bearer ${TOKEN}` };
let app: NestFastifyApplication;
let clock = new Date("2026-11-01T09:00:00.000Z");
const sent: { to: Contact; code: string }[] = [];

beforeAll(async () => {
  app = await createApp({
    repository: new InMemoryContentRepository(),
    patinhas: new InMemoryPatinhasRepository(),
    features: allFeatures,
    adminToken: TOKEN,
    onContentChanged: async () => {},
    logger: false,
    now: () => clock,
    sendLoginCode: async (to, code) => { sent.push({ to, code }); },
  });
  await app.init();
  await app.getHttpAdapter().getInstance().ready();
});
afterAll(async () => app.close());

type Method = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
const req = (method: Method, url: string, payload?: object, headers?: Record<string, string>) => app.inject({ method, url, payload, headers });
const session = (token: string) => ({ authorization: `Bearer ${token}` });

async function signIn(contact: string, name?: string) {
  const start = await req("POST", "/conta/codigo", { contact, ...(name ? { name, consent: true } : {}) });
  expect(start.statusCode).toBe(200);
  const code = sent.at(-1)!.code;
  const done = await req("POST", "/conta/entrar", { contact, code });
  expect(done.statusCode).toBe(200);
  return done.json() as { token: string; account: { id: string; name: string } };
}

describe("signing up and in, without a password", () => {
  it("asks new people for their name, then sends a 6-digit code", async () => {
    const first = await req("POST", "/conta/codigo", { contact: "rosa@exemplo.pt" });
    expect(first.json()).toEqual({ status: "precisa-nome" });
    const noConsent = await req("POST", "/conta/codigo", { contact: "rosa@exemplo.pt", name: "Rosa Lima" });
    expect(noConsent.statusCode).toBe(400);
    const res = await req("POST", "/conta/codigo", { contact: "Rosa@Exemplo.pt", name: "Rosa Lima", consent: true });
    expect(res.json()).toMatchObject({ status: "codigo-enviado", sentTo: "email", newAccount: true });
    expect(res.json().demoCode).toBeUndefined();
    expect(sent.at(-1)).toMatchObject({ to: { kind: "email", value: "rosa@exemplo.pt" } });
    expect(sent.at(-1)!.code).toMatch(/^\d{6}$/);
  });

  it("refuses a wrong code, then creates the account with the right one and welcome Patinhas", async () => {
    const wrong = await req("POST", "/conta/entrar", { contact: "rosa@exemplo.pt", code: "000000" === sent.at(-1)!.code ? "111111" : "000000" });
    expect(wrong.statusCode).toBe(401);
    expect(wrong.json().message).toMatch(/não está certo/);
    const ok = await req("POST", "/conta/entrar", { contact: "rosa@exemplo.pt", code: sent.at(-1)!.code.replace(/(\d{3})/, "$1 ") });
    expect(ok.statusCode).toBe(200);
    const { token, account, newAccount } = ok.json();
    expect(newAccount).toBe(true);
    expect(account.name).toBe("Rosa Lima");
    const me = (await req("GET", "/conta/eu", undefined, session(token))).json();
    expect(me.earned).toBe(10);
    expect(me.level.name).toBe("Gatinho");
    // The code only works once.
    expect((await req("POST", "/conta/entrar", { contact: "rosa@exemplo.pt", code: sent.at(-1)!.code })).statusCode).toBe(401);
  });

  it("signs a returning person in with just their mobile", async () => {
    const res = await req("POST", "/conta/codigo", { contact: "+351 912 000 001" });
    expect(res.json()).toMatchObject({ status: "codigo-enviado", newAccount: false, sentTo: "telemovel" });
    const done = await req("POST", "/conta/entrar", { contact: "912000001", code: sent.at(-1)!.code });
    expect(done.json().account.name).toBe("Ana Ribeiro");
  });

  it("needs a valid session for the helper's page, and signing out ends it", async () => {
    expect((await req("GET", "/conta/eu")).statusCode).toBe(401);
    const { token } = await signIn("913000002");
    expect((await req("GET", "/conta/eu", undefined, session(token))).statusCode).toBe(200);
    await req("POST", "/conta/sair", undefined, session(token));
    expect((await req("GET", "/conta/eu", undefined, session(token))).statusCode).toBe(401);
  });
});

describe("earning Patinhas", () => {
  it("gives quiz points once", async () => {
    const { token } = await signIn("quiz@exemplo.pt", "Quim");
    expect((await req("POST", "/conta/eu/questionario", undefined, session(token))).json()).toEqual({ counted: true, points: 10 });
    expect((await req("POST", "/conta/eu/questionario", undefined, session(token))).json()).toMatchObject({ counted: false });
    const me = (await req("GET", "/conta/eu", undefined, session(token))).json();
    expect(me.earned).toBe(20);
    expect(me.badges.find((b: { badge: { id: string } }) => b.badge.id === "primeiros-passos").earned).toBe(true);
  });

  it("gives shift points when the team marks the volunteer present, matched by mobile", async () => {
    const { token } = await signIn("964 444 444", "Vera Sousa");
    await req("POST", "/escalas/turnos/shift-1/inscricao", { name: "Vera Sousa", phone: "+351964444444", consent: true });
    const shift = (await req("GET", "/escalas/turnos", undefined, admin)).json().find((s: { id: string }) => s.id === "shift-1");
    const signup = shift.signups.find((s: { name: string }) => s.name === "Vera Sousa");
    clock = new Date(shift.startsAt);
    await req("POST", `/escalas/turnos/shift-1/inscricoes/${signup.volunteerId}/presenca`, undefined, admin);
    // Marking twice does not pay twice.
    await req("POST", `/escalas/turnos/shift-1/inscricoes/${signup.volunteerId}/presenca`, undefined, admin);
    const me = (await req("GET", "/conta/eu", undefined, session(token))).json();
    const hours = (new Date(shift.endsAt).getTime() - new Date(shift.startsAt).getTime()) / 3_600_000;
    expect(me.earned).toBe(10 + 25 * hours);
    expect(me.history[0]).toMatchObject({ action: "turno-hora", label: "Turno de voluntariado" });
    clock = new Date("2026-11-01T09:00:00.000Z");
  });

  it("lets the team confirm a donation and make corrections", async () => {
    const people = (await req("GET", "/patinhas/contas", undefined, admin)).json();
    const joao = people.find((p: { name: string }) => p.name === "João Costa");
    const r = await req("POST", `/patinhas/contas/${joao.id}/registos`, { action: "donativo", note: "Transferência de 10 €" }, admin);
    expect(r.statusCode).toBe(201);
    expect(r.json().points).toBe(20);
    const fix = await req("POST", `/patinhas/contas/${joao.id}/registos`, { action: "ajuste", points: -5, note: "Engano" }, admin);
    expect(fix.json().points).toBe(-5);
    const after = (await req("GET", "/patinhas/contas", undefined, admin)).json().find((p: { id: string }) => p.id === joao.id);
    expect(after.earned).toBe(joao.earned + 15);
  });

  it("has no way for the team to give points for an adoption", async () => {
    const people = (await req("GET", "/patinhas/contas", undefined, admin)).json();
    const res = await req("POST", `/patinhas/contas/${people[0].id}/registos`, { action: "adocao" }, admin);
    expect(res.statusCode).toBe(400);
  });
});

describe("perks", () => {
  it("swaps Patinhas for a partner perk, with a code to show at the counter", async () => {
    const { token } = await signIn("912000001");
    const before = (await req("GET", "/conta/eu", undefined, session(token))).json();
    const vet = before.perks.find((p: { perk: { id: string } }) => p.perk.id === "consulta-10");
    expect(vet.available).toBe(true);
    const res = await req("POST", "/conta/eu/trocas", { partnerId: "partner-1", perkId: "consulta-10" }, session(token));
    expect(res.statusCode).toBe(201);
    expect(res.json().code).toMatch(/^GN-[A-Z2-9]{5}$/);
    const after = (await req("GET", "/conta/eu", undefined, session(token))).json();
    expect(after.balance).toBe(before.balance - 150);
    expect(after.earned).toBe(before.earned);
    // Once a month for this perk.
    const again = await req("POST", "/conta/eu/trocas", { partnerId: "partner-1", perkId: "consulta-10" }, session(token));
    expect(again.statusCode).toBe(409);
    expect(again.json().message).toBe("Já usou esta vantagem este mês.");
  });

  it("refuses when the level is too low", async () => {
    const { token } = await signIn("novo@exemplo.pt", "Novo");
    const res = await req("POST", "/conta/eu/trocas", { partnerId: "partner-1", perkId: "consulta-10" }, session(token));
    expect(res.statusCode).toBe(409);
    expect(res.json().message).toMatch(/nível 2/);
  });

  it("lets the team mark a perk as used, or cancel it and give the Patinhas back", async () => {
    const list = (await req("GET", "/patinhas/trocas", undefined, admin)).json();
    const active = list.filter((r: { status: string }) => r.status === "ativa");
    expect(active[0].personName).toBeTruthy();
    expect((await req("POST", `/patinhas/trocas/${active[0].id}/usada`, undefined, admin)).json().status).toBe("usada");
    expect((await req("POST", `/patinhas/trocas/${active[0].id}/cancelar`, undefined, admin)).statusCode).toBe(409);

    const { token } = await signIn("912000001");
    const before = (await req("GET", "/conta/eu", undefined, session(token))).json();
    const cancelled = await req("POST", `/patinhas/trocas/${active[1].id}/cancelar`, undefined, admin);
    expect(cancelled.json().status).toBe("cancelada");
    const after = (await req("GET", "/conta/eu", undefined, session(token))).json();
    expect(after.balance).toBe(before.balance + active[1].cost);
  });
});

describe("back office settings", () => {
  it("requires the team password", async () => {
    for (const url of ["/patinhas/contas", "/patinhas/regras", "/patinhas/medalhas", "/patinhas/desafios", "/patinhas/trocas"]) {
      expect((await req("GET", url)).statusCode).toBe(401);
    }
  });

  it("edits points per action", async () => {
    const rules = (await req("GET", "/patinhas/regras", undefined, admin)).json();
    const changed = rules.map((r: { action: string; points: number }) => (r.action === "sos" ? { ...r, points: 20 } : r));
    expect((await req("PUT", "/patinhas/regras", changed, admin)).statusCode).toBe(200);
    const pub = (await req("GET", "/patinhas")).json();
    expect(pub.waysToEarn.find((r: { action: string }) => r.action === "sos").points).toBe(20);
  });

  it("creates a badge and a monthly challenge", async () => {
    const badge = await req("POST", "/patinhas/medalhas", { id: "inverno-quente", name: "Inverno quente", description: "Ajudou na campanha de abrigos de inverno", icon: "❄️", action: "donativo", count: 1 }, admin);
    expect(badge.statusCode).toBe(201);
    const challenge = await req("POST", "/patinhas/desafios", { title: "Novembro: 10 voltas ao veterinário", month: "2026-11", action: "transporte", goal: 10, extraProgress: 2 }, admin);
    expect(challenge.statusCode).toBe(201);
    const pub = (await req("GET", "/patinhas")).json();
    expect(pub.badges.some((b: { id: string }) => b.id === "inverno-quente")).toBe(true);
    expect(pub.challenges.find((c: { challenge: { title: string } }) => c.challenge.title === "Novembro: 10 voltas ao veterinário")?.progress).toBe(2);
  });

  it("shows on the public wall only people who chose to, by nickname or first name", async () => {
    const pub = (await req("GET", "/patinhas")).json();
    expect(pub.wall).toEqual([{ name: "Ana dos Gatos", levelName: "Amigo de Bigodes" }]);
    expect(JSON.stringify(pub)).not.toContain("Ribeiro");
    expect(JSON.stringify(pub)).not.toContain("912000001");
  });
});

describe("privacy", () => {
  it("deletes the account and its sessions, keeping only anonymous totals", async () => {
    const { token, account } = await signIn("apagar@exemplo.pt", "Para Apagar");
    expect((await req("DELETE", "/conta/eu", undefined, session(token))).statusCode).toBe(204);
    expect((await req("GET", "/conta/eu", undefined, session(token))).statusCode).toBe(401);
    const people = (await req("GET", "/patinhas/contas", undefined, admin)).json();
    expect(people.some((p: { id: string }) => p.id === account.id)).toBe(false);
  });
});

describe("demo mode", () => {
  it("returns the code on screen only when asked to", async () => {
    const demo = await createApp({ repository: new InMemoryContentRepository(), adminToken: TOKEN, onContentChanged: async () => {}, logger: false, exposeLoginCodes: true });
    await demo.init();
    await demo.getHttpAdapter().getInstance().ready();
    const res = await demo.inject({ method: "POST", url: "/conta/codigo", payload: { contact: "912000001" } });
    expect(res.json().demoCode).toMatch(/^\d{6}$/);
    await demo.close();
  });
});

describe("feature flags", () => {
  async function appWith(features?: Parameters<typeof createApp>[0]["features"]) {
    const codes: string[] = [];
    const other = await createApp({ repository: new InMemoryContentRepository(), adminToken: TOKEN, onContentChanged: async () => {}, logger: false, features, sendLoginCode: async (_to, code) => { codes.push(code); } });
    await other.init();
    await other.getHttpAdapter().getInstance().ready();
    const call = (method: Method, url: string, payload?: object, headers?: Record<string, string>) => other.inject({ method, url, payload, headers });
    const signInHere = async (contact: string, name: string) => {
      await call("POST", "/conta/codigo", { contact, name, consent: true });
      return (await call("POST", "/conta/entrar", { contact, code: codes.at(-1)! })).json().token as string;
    };
    return { other, call, signInHere };
  }

  it("with everything off (the default): accounts work, but nothing earns, swaps or shows Patinhas", async () => {
    const { other, call, signInHere } = await appWith();
    expect((await call("GET", "/features")).json()).toEqual({ patinhas: false, trocas: false, amigo: false });
    const token = await signInHere("sem.patinhas@exemplo.pt", "Rita Sem");
    const me = (await call("GET", "/conta/eu", undefined, session(token))).json();
    expect(me.account.name).toBe("Rita Sem");
    expect(me.features.patinhas).toBe(false);
    expect(me.earned).toBe(0);
    expect(me.perks).toEqual([]);
    expect((await call("POST", "/conta/eu/questionario", undefined, session(token))).json()).toMatchObject({ counted: false });
    expect((await call("POST", "/conta/eu/trocas", { partnerId: "partner-1", perkId: "consulta-10" }, session(token))).statusCode).toBe(404);
    expect((await call("GET", "/patinhas")).statusCode).toBe(404);
    expect((await call("GET", "/patinhas/contas", undefined, admin)).statusCode).toBe(404);
    await other.close();
  });

  it("with Patinhas on but swaps off: earning works, swaps stay closed", async () => {
    const { other, call, signInHere } = await appWith({ patinhas: true, trocas: false, amigo: false });
    const token = await signInHere("so.patinhas@exemplo.pt", "Rui Pontos");
    const me = (await call("GET", "/conta/eu", undefined, session(token))).json();
    expect(me.earned).toBe(10);
    expect(me.perks).toEqual([]);
    expect((await call("GET", "/patinhas")).statusCode).toBe(200);
    expect((await call("GET", "/patinhas/contas", undefined, admin)).statusCode).toBe(200);
    expect((await call("GET", "/patinhas/trocas", undefined, admin)).statusCode).toBe(404);
    expect((await call("POST", "/conta/eu/trocas", { partnerId: "partner-1", perkId: "consulta-10" }, session(token))).statusCode).toBe(404);
    await other.close();
  });
});
