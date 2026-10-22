import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { NestFastifyApplication } from "@nestjs/platform-fastify";
import { createApp } from "../src/app";
import { InMemoryContentRepository } from "../src/content/in-memory.repository";

const TOKEN = "test-admin-token";
const auth = { authorization: `Bearer ${TOKEN}` };
let app: NestFastifyApplication;

beforeAll(async () => {
  app = await createApp({ repository: new InMemoryContentRepository(), adminToken: TOKEN, onContentChanged: async () => {}, logger: false, now: () => new Date("2026-11-01T09:00:00.000Z") });
  await app.init();
  await app.getHttpAdapter().getInstance().ready();
});
afterAll(async () => app.close());

const req = (method: "GET" | "POST" | "PATCH" | "DELETE", url: string, payload?: object, admin = false) =>
  app.inject({ method, url, payload, headers: admin ? auth : undefined });

describe("public vagas", () => {
  it("lists foster requests and shifts with places, without volunteers' details", async () => {
    const res = await req("GET", "/escalas/vagas");
    const body = res.json();
    expect(body[0].kind).toBe("familia-temporaria");
    const turno = body.find((n: { kind: string }) => n.kind === "turno");
    expect(turno.shift.free).toBeGreaterThan(0);
    expect(turno.shift.signups).toBeUndefined();
    expect(JSON.stringify(body)).not.toContain("912000001");
  });

  it("lets someone sign up with name and phone, once", async () => {
    const payload = { name: "Carla Dias", phone: "915 555 555", consent: true };
    const first = await req("POST", "/escalas/turnos/shift-2/inscricao", payload);
    expect(first.statusCode).toBe(201);
    expect(first.json().taken).toBe(1);
    const again = await req("POST", "/escalas/turnos/shift-2/inscricao", { ...payload, phone: "915555555" });
    expect(again.statusCode).toBe(409);
    expect(again.json().message).toBe("Já está inscrito neste turno.");
  });

  it("refuses when the transport slot is already taken", async () => {
    await req("POST", "/escalas/turnos/shift-3/inscricao", { name: "Rui", phone: "911111111", consent: true });
    const res = await req("POST", "/escalas/turnos/shift-3/inscricao", { name: "Eva", phone: "922222222", consent: true });
    expect(res.statusCode).toBe(409);
    expect(res.json().message).toMatch(/completo/);
  });
});

describe("back office", () => {
  it("requires the admin token", async () => {
    expect((await req("GET", "/escalas/turnos")).statusCode).toBe(401);
  });

  it("creates a weekly series of cleaning shifts", async () => {
    const res = await req("POST", "/escalas/turnos/semanais", { type: "limpeza", title: "Limpeza de quarta", location: "Gatil", capacity: 2, weekdays: [3], startTime: "18:00", endTime: "20:00", from: "2026-11-01", until: "2026-11-30" }, true);
    expect(res.statusCode).toBe(201);
    expect(res.json().created).toBe(4);
  });

  it("creates an event slot, signs someone up, and marks presence", async () => {
    const created = await req("POST", "/escalas/turnos", { type: "evento", title: "Feira de Natal: banca", eventName: "Feira de Natal", startsAt: "2026-12-12T10:00:00.000Z", endsAt: "2026-12-12T13:00:00.000Z", location: "Praça da República", capacity: 2 }, true);
    const id = created.json().id;
    const signed = await req("POST", `/escalas/turnos/${id}/inscricoes`, { name: "Luís", phone: "933333333" }, true);
    const volunteerId = signed.json().signups[0].volunteerId;
    const present = await req("POST", `/escalas/turnos/${id}/inscricoes/${volunteerId}/presenca`, undefined, true);
    expect(present.json().signups[0].checkedInAt).toBeTruthy();
  });

  it("will not reduce places below the number already signed up", async () => {
    const res = await req("PATCH", "/escalas/turnos/shift-5", { capacity: 0 }, true);
    expect(res.statusCode).toBe(400);
    const res2 = await req("POST", "/escalas/turnos/shift-1/inscricoes", { name: "Zé", phone: "944444444" }, true);
    expect(res2.statusCode).toBe(201);
    const shrink = await req("PATCH", "/escalas/turnos/shift-1", { capacity: 1 }, true);
    expect(shrink.statusCode).toBe(409);
  });

  it("flags godparents who need news about their cat", async () => {
    const list = (await req("GET", "/escalas/padrinhos", undefined, true)).json();
    expect(list.find((s: { id: string }) => s.id === "sp-1").needsUpdate).toBe(true);
    expect(list.find((s: { id: string }) => s.id === "sp-2").needsUpdate).toBe(false);
  });

  it("takes sponsorship requests from the site as pending, for the team to confirm", async () => {
    const res = await req("POST", "/escalas/padrinhos/pedido", { catSlug: "tobias", name: "Ana Lima", email: "ana@example.pt", monthlyAmount: 10, consent: true });
    expect(res.statusCode).toBe(201);
    const list = (await req("GET", "/escalas/padrinhos", undefined, true)).json();
    const asked = list.find((s: { sponsorName: string }) => s.sponsorName === "Ana Lima");
    expect(asked).toMatchObject({ catSlug: "tobias", monthlyAmount: 10, active: false, pending: true, startDate: "2026-11-01", needsUpdate: false });
    const confirmed = await req("POST", "/escalas/padrinhos", { ...asked, needsUpdate: undefined, active: true, pending: undefined }, true);
    expect(confirmed.statusCode).toBe(201);
    expect(confirmed.json()).toMatchObject({ id: asked.id, active: true });
  });

  it("refuses sponsorship requests for unknown cats or with too little", async () => {
    expect((await req("POST", "/escalas/padrinhos/pedido", { catSlug: "nao-existe", name: "Ana", email: "ana@example.pt", monthlyAmount: 10, consent: true })).statusCode).toBe(404);
    expect((await req("POST", "/escalas/padrinhos/pedido", { catSlug: "tobias", name: "Ana", email: "ana@example.pt", monthlyAmount: 1, consent: true })).statusCode).toBe(400);
  });

  it("records a foster family taking a cat", async () => {
    const res = await req("POST", "/escalas/familias-temporarias", { id: "fat-2", catSlug: "estrela", status: "ativa", startDate: "2026-11-02", familyName: "Família Pires" }, true);
    expect(res.statusCode).toBe(201);
    const needs = (await req("GET", "/escalas/vagas")).json();
    expect(needs.some((n: { kind: string }) => n.kind === "familia-temporaria")).toBe(false);
  });
});
