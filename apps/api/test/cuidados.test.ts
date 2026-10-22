import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { NestFastifyApplication } from "@nestjs/platform-fastify";
import { createApp } from "../src/app";
import { InMemoryContentRepository } from "../src/content/in-memory.repository";

const TOKEN = "test-admin-token";
const auth = { authorization: `Bearer ${TOKEN}` };
const by = { name: "Ana Ribeiro" };
let app: NestFastifyApplication;
// Monday 2 November 2026, 09:30 in Lisbon (winter time = UTC).
let clock = new Date("2026-11-02T09:30:00.000Z");

beforeAll(async () => {
  app = await createApp({ repository: new InMemoryContentRepository(), adminToken: TOKEN, onContentChanged: async () => {}, logger: false, now: () => clock });
  await app.init();
  await app.getHttpAdapter().getInstance().ready();
});
afterAll(async () => app.close());

const req = (method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE", url: string, payload?: object, admin = true) =>
  app.inject({ method, url, payload, headers: admin ? auth : undefined });
const tick = (minutes = 1) => { clock = new Date(clock.getTime() + minutes * 60_000); };

describe("access", () => {
  it("is team only: medical data never goes out without the access code", async () => {
    expect((await req("GET", "/cuidados/gatil", undefined, false)).statusCode).toBe(401);
    expect((await req("GET", "/cuidados/ronda", undefined, false)).statusCode).toBe(401);
    const publicCat = (await req("GET", "/cats/estrela", undefined, false)).body;
    expect(publicCat).not.toContain("Insulina");
    expect(publicCat).not.toContain("jaula");
  });
});

describe("where each cat lives", () => {
  it("lists the cats still with us, with their place and treatments", async () => {
    const list = (await req("GET", "/cuidados/gatil")).json();
    expect(list.map((x: { cat: { name: string } }) => x.cat.name)).toEqual(["Carvão", "Estrela", "Mia", "Pimenta", "Tobias"]);
    const estrela = list.find((x: { cat: { name: string } }) => x.cat.name === "Estrela");
    expect(estrela.care.location).toEqual({ area: "carlota", spot: "jaula", cage: "1", reason: "Controlo da diabetes" });
    expect(estrela.activeMedications).toEqual(["Insulina"]);
    expect(estrela.nextAppointment.reason).toBe("Curva de glicemia");
  });

  it("moves a cat into a cage and tells everyone", async () => {
    tick();
    const res = await req("PUT", "/cuidados/gatos/cat-3/localizacao", { by, location: { area: "caramelo", spot: "jaula", cage: "2", reason: "Começou antibiótico" } });
    expect(res.statusCode).toBe(200);
    expect(res.json().updatedBy.name).toBe("Ana Ribeiro");
    const [latest] = (await req("GET", "/cuidados/novidades")).json();
    expect(latest).toMatchObject({ catName: "Carvão", kind: "localizacao", important: true, by: { name: "Ana Ribeiro" } });
    expect(latest.message).toBe("Carvão mudou de Contentor Caramelo, solto para Contentor Caramelo, jaula 2. Motivo: Começou antibiótico.");
  });

  it("raises no alert when only the reason changes", async () => {
    const before = (await req("GET", "/cuidados/novidades")).json().length;
    tick();
    await req("PUT", "/cuidados/gatos/cat-3/localizacao", { by, location: { area: "caramelo", spot: "jaula", cage: "2", reason: "Antibiótico durante 7 dias" } });
    expect((await req("GET", "/cuidados/novidades")).json()).toHaveLength(before);
  });

  it("refuses a cage in the colony and changes without a name", async () => {
    expect((await req("PUT", "/cuidados/gatos/cat-2/localizacao", { by, location: { area: "colonia", spot: "jaula" } })).statusCode).toBe(400);
    const anonymous = await req("PUT", "/cuidados/gatos/cat-2/localizacao", { location: { area: "paquito", spot: "solto" } });
    expect(anonymous.statusCode).toBe(400);
    expect(JSON.stringify(anonymous.json().issues)).toContain("Indique o seu nome");
  });
});

describe("medication", () => {
  let medId: string;

  it("adds a treatment and alerts the team", async () => {
    tick();
    const res = await req("POST", "/cuidados/medicacao", { by, catId: "cat-3", name: "Amoxicilina", dose: "1/2 comprimido", times: ["10:00", "22:00"], withFood: true, startDate: "2026-11-02", endDate: "2026-11-08" });
    expect(res.statusCode).toBe(201);
    medId = res.json().id;
    const [latest] = (await req("GET", "/cuidados/novidades")).json();
    expect(latest.message).toBe("Carvão começa a tomar Amoxicilina, 1/2 comprimido. 2 vezes por dia: 10:00, 22:00, com comida até 8 de novembro.");
  });

  it("builds today's round with where to find each cat", async () => {
    const { date, items } = (await req("GET", "/cuidados/ronda")).json();
    expect(date).toBe("2026-11-02");
    expect(items.map((i: { time: string; cat: { name: string } }) => `${i.time} ${i.cat.name}`)).toEqual(["08:00 Estrela", "09:00 Tobias", "10:00 Carvão", "20:00 Estrela", "20:00 Pimenta", "22:00 Carvão"]);
    expect(items[2].location).toMatchObject({ area: "caramelo", spot: "jaula", cage: "2" });
  });

  it("records a dose once and refuses to give it twice", async () => {
    const first = await req("POST", `/cuidados/medicacao/${medId}/tomas`, { by, date: "2026-11-02", time: "10:00" });
    expect(first.statusCode).toBe(201);
    const twice = await req("POST", `/cuidados/medicacao/${medId}/tomas`, { by: { name: "Rui Sousa" }, date: "2026-11-02", time: "10:00" });
    expect(twice.statusCode).toBe(409);
    expect(twice.json().message).toBe("Esta dose já foi dada por Ana Ribeiro às 09:33. Não dê outra vez.");
    const round = (await req("GET", "/cuidados/ronda?dia=2026-11-02")).json();
    expect(round.items.find((i: { time: string; cat: { name: string } }) => i.time === "10:00").given.by.name).toBe("Ana Ribeiro");
    // Undo a mistake
    expect((await req("DELETE", `/cuidados/tomas/${first.json().id}`)).statusCode).toBe(204);
    expect((await req("POST", `/cuidados/medicacao/${medId}/tomas`, { by, date: "2026-11-02", time: "10:00" })).statusCode).toBe(201);
  });

  it("changes the dose and stops the treatment, with alerts", async () => {
    tick();
    const changed = await req("PATCH", `/cuidados/medicacao/${medId}`, { by, dose: "1 comprimido" });
    expect(changed.json().dose).toBe("1 comprimido");
    tick();
    const stopped = await req("POST", `/cuidados/medicacao/${medId}/terminar`, { by });
    expect(stopped.json().stoppedAt).toBeTruthy();
    const [last, previous] = (await req("GET", "/cuidados/novidades")).json();
    expect(last.message).toBe("Carvão deixou de tomar Amoxicilina.");
    expect(previous.message).toContain("A medicação de Carvão mudou: Amoxicilina, 1 comprimido.");
    tick(24 * 60);
    const tomorrow = (await req("GET", "/cuidados/ronda")).json();
    expect(tomorrow.items.some((i: { cat: { name: string } }) => i.cat.name === "Carvão")).toBe(false);
  });
});

describe("vet appointments", () => {
  it("books one and creates the transport slot in Escalas", async () => {
    tick();
    const res = await req("POST", "/cuidados/consultas", { by, catId: "cat-1", startsAt: "2026-11-10T11:00:00.000Z", clinic: "Hospital Veterinário de Viana", reason: "Análises aos rins", needsTransport: true });
    expect(res.statusCode).toBe(201);
    const shiftId = res.json().transportShiftId;
    const shifts = (await req("GET", "/escalas/turnos?de=2026-11-10T00:00:00.000Z&ate=2026-11-11T00:00:00.000Z")).json();
    expect(shifts.find((s: { id: string }) => s.id === shiftId)).toMatchObject({ type: "transporte-vet", title: "Levar Tobias à consulta", catSlug: "tobias", clinic: "Hospital Veterinário de Viana", startsAt: "2026-11-10T10:30:00.000Z", capacity: 1 });
    const [latest] = (await req("GET", "/cuidados/novidades")).json();
    expect(latest.message).toBe("Consulta marcada para Tobias: Análises aos rins, terça-feira, 10 de novembro às 11:00, Hospital Veterinário de Viana.");
  });

  it("shows upcoming appointments with who is driving", async () => {
    await req("POST", "/escalas/turnos/shift-3/inscricoes", { name: "Luís Costa", phone: "933333333" });
    const list = (await req("GET", "/cuidados/consultas")).json();
    expect(list.map((a: { cat: { name: string } }) => a.cat.name)).toEqual(["Pimenta", "Tobias", "Estrela"]);
    expect(list[0].transport).toEqual({ shiftId: "shift-3", volunteers: ["Luís Costa"], free: 0 });
    expect(list[2].transport).toBeNull();
  });

  it("moves the transport slot when the appointment changes", async () => {
    const tobias = (await req("GET", "/cuidados/consultas")).json().find((a: { cat: { name: string } }) => a.cat.name === "Tobias");
    tick();
    await req("PATCH", `/cuidados/consultas/${tobias.id}`, { by, startsAt: "2026-11-11T15:00:00.000Z" });
    const shifts = (await req("GET", "/escalas/turnos?de=2026-11-11T00:00:00.000Z&ate=2026-11-12T00:00:00.000Z")).json();
    expect(shifts.find((s: { id: string }) => s.id === tobias.transportShiftId).startsAt).toBe("2026-11-11T14:30:00.000Z");
  });

  it("cancelling removes the transport and says who to warn", async () => {
    tick();
    const res = await req("PATCH", "/cuidados/consultas/con-1", { by, status: "cancelada" });
    expect(res.json().transportShiftId).toBeUndefined();
    expect((await req("GET", "/escalas/turnos?de=2026-11-05T00:00:00.000Z&ate=2026-11-06T00:00:00.000Z")).json()).toHaveLength(0);
    const [latest] = (await req("GET", "/cuidados/novidades")).json();
    expect(latest.message).toBe("A consulta de Pimenta (Revisão da pata) foi cancelada. Avisar Luís Costa de que o transporte já não é preciso.");
  });

  it("marking it done keeps the vet's words with the cat's notes", async () => {
    tick();
    await req("PATCH", "/cuidados/consultas/con-2", { by, status: "feita", outcome: "Glicemia estável. Manter 1 unidade." });
    const file = (await req("GET", "/cuidados/gatos/cat-4")).json();
    expect(file.notes[0]).toMatchObject({ text: "Consulta (Curva de glicemia): Glicemia estável. Manter 1 unidade.", appointmentId: "con-2" });
    expect(file.alerts[0].message).toBe("Estrela foi à consulta (Curva de glicemia). Glicemia estável. Manter 1 unidade.");
  });
});

describe("notes after each visit", () => {
  it("adds a note, flags it as important, and lists only what is new", async () => {
    const since = clock.toISOString();
    tick();
    const res = await req("POST", "/cuidados/notas", { by: { name: "Rui Sousa" }, catId: "cat-2", text: "Não apareceu para comer à tarde.", important: true });
    expect(res.statusCode).toBe(201);
    const fresh = (await req("GET", `/cuidados/novidades?desde=${encodeURIComponent(since)}`)).json();
    expect(fresh).toHaveLength(1);
    expect(fresh[0]).toMatchObject({ kind: "nota", important: true, catName: "Mia", message: "Sobre Mia: “Não apareceu para comer à tarde.”" });
    const file = (await req("GET", "/cuidados/gatos/cat-2")).json();
    expect(file.notes[0].by.name).toBe("Rui Sousa");
  });

  it("refuses empty notes and unknown cats", async () => {
    expect((await req("POST", "/cuidados/notas", { by, catId: "cat-2", text: " " })).statusCode).toBe(400);
    expect((await req("POST", "/cuidados/notas", { by, catId: "nao-existe", text: "Olá" })).statusCode).toBe(404);
  });
});

describe("browser access from the back office", () => {
  it("allows editing methods in the CORS preflight", async () => {
    const res = await app.inject({ method: "OPTIONS", url: "/cuidados/gatos/cat-3/localizacao", headers: { origin: "http://localhost:5173", "access-control-request-method": "PUT" } });
    expect(res.headers["access-control-allow-methods"]).toContain("PUT");
    expect(res.headers["access-control-allow-methods"]).toContain("PATCH");
    expect(res.headers["access-control-allow-methods"]).toContain("DELETE");
  });
});
