import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { NestFastifyApplication } from "@nestjs/platform-fastify";
import type { Account, CareAlert, Contact } from "@gn/domain";
import { createApp } from "../src/app";
import { InMemoryContentRepository } from "../src/content/in-memory.repository";
import { InMemoryPatinhasRepository } from "../src/patinhas/repository";

const TOKEN = "test-admin-token";
const admin = { authorization: `Bearer ${TOKEN}` };
let app: NestFastifyApplication;
// Saturday 7 November 2026, 08:30 in Lisbon. Ana (912000001) is on the 10:00-12:00 gatil shift.
let clock = new Date("2026-11-07T08:30:00.000Z");
const sent: { to: Contact; code: string }[] = [];
const notify = vi.fn(async (_to: Account[], _alert: CareAlert) => {});

beforeAll(async () => {
  app = await createApp({
    repository: new InMemoryContentRepository(),
    patinhas: new InMemoryPatinhasRepository(),
    adminToken: TOKEN,
    onContentChanged: async () => {},
    logger: false,
    now: () => clock,
    sendLoginCode: async (to, code) => { sent.push({ to, code }); },
    notifyVolunteers: notify,
  });
  await app.init();
  await app.getHttpAdapter().getInstance().ready();
});
afterAll(async () => app.close());

type Method = "GET" | "POST" | "PUT";
const req = (method: Method, url: string, payload?: object, headers?: Record<string, string>) => app.inject({ method, url, payload, headers });
const tick = (minutes = 1) => { clock = new Date(clock.getTime() + minutes * 60_000); };
async function signIn(contact: string) {
  await req("POST", "/conta/codigo", { contact });
  const done = await req("POST", "/conta/entrar", { contact, code: sent.at(-1)!.code });
  return { authorization: `Bearer ${done.json().token}` };
}

let ana: Record<string, string>;
let joao: Record<string, string>;
let taskId: string;

beforeAll(async () => {
  ana = await signIn("912000001");
  joao = await signIn("913000002");
});

describe("the volunteer's care page", () => {
  it("needs a signed-in volunteer", async () => {
    expect((await req("GET", "/conta/eu/cuidados")).statusCode).toBe(401);
    const notYet = (await req("GET", "/conta/eu/cuidados", undefined, joao)).json();
    expect(notYet).toMatchObject({ volunteer: false, shift: null, cats: [] });
    // Someone not on a shift yet is offered the gatil shifts with room, to join from their own page.
    expect(notYet.gatilShifts.map((s: { id: string }) => s.id)).toEqual(["shift-1", "shift-2"]);
  });

  it("shows today's shift, the doses to give during it, and how to look after each cat", async () => {
    const page = (await req("GET", "/conta/eu/cuidados", undefined, ana)).json();
    expect(page.shift).toMatchObject({ id: "shift-1", team: ["Ana Ribeiro"] });
    expect(page.isToday).toBe(true);
    expect(page.during.map((d: { time: string; cat: { name: string } }) => `${d.time} ${d.cat.name}`)).toEqual(["09:00 Tobias"]);
    expect(page.rest.map((d: { time: string; cat: { name: string } }) => `${d.time} ${d.cat.name}`)).toEqual(["08:00 Estrela", "20:00 Estrela"]);
    expect(page.cats.map((c: { cat: { name: string } }) => c.cat.name)).toEqual(["Estrela", "Tobias"]);
    const estrela = page.cats[0];
    expect(estrela.location).toMatchObject({ area: "carlota", spot: "jaula", cage: "1" });
    expect(estrela.medications[0]).toMatchObject({ name: "Insulina", times: ["08:00", "20:00"], instructions: expect.stringContaining("pescoço") });
    expect(estrela.specialNeeds).toContain("Diabetes");
    // Pimenta is with a foster family: not part of the gatil shift.
    expect(JSON.stringify(page.during) + JSON.stringify(page.rest)).not.toContain("Pimenta");
  });

  it("marks a dose as given, once", async () => {
    tick();
    const res = await req("POST", "/conta/eu/cuidados/tomas", { medicationId: "med-2", date: "2026-11-07", time: "09:00" }, ana);
    expect(res.statusCode).toBe(201);
    expect(res.json().by).toMatchObject({ name: "Ana Ribeiro", accountId: "conta-1" });
    expect((await req("POST", "/conta/eu/cuidados/tomas", { medicationId: "med-2", date: "2026-11-07", time: "09:00" }, ana)).statusCode).toBe(409);
  });
});

describe("when a dose cannot be given", () => {
  it("asks everyone for help, with the reason kept on the cat", async () => {
    tick();
    const res = await req("POST", "/conta/eu/cuidados/nao-consigo", { medicationId: "med-1", date: "2026-11-07", time: "20:00", comment: "Saio às 12h e ninguém fica à noite" }, ana);
    expect(res.statusCode).toBe(201);
    taskId = res.json().id;
    expect(res.json()).toMatchObject({ status: "aberta", what: "Dar Insulina (1 unidade)" });
    const file = (await req("GET", "/cuidados/gatos/cat-4", undefined, admin)).json();
    expect(file.notes[0]).toMatchObject({ important: true, text: "Não foi possível dar Insulina (20:00): Saio às 12h e ninguém fica à noite" });
    // Nobody else is on the volunteer list yet, so no one is messaged; the alert is there for all to see.
    expect(notify).not.toHaveBeenCalled();
    const [alert] = (await req("GET", "/cuidados/novidades", undefined, admin)).json();
    expect(alert.message).toBe("Precisa-se de quem possa dar Insulina (1 unidade) a Estrela hoje às 20:00. Ana Ribeiro não conseguiu: “Saio às 12h e ninguém fica à noite”");
  });

  it("only volunteers can take it", async () => {
    expect((await req("POST", `/conta/eu/cuidados/tarefas/${taskId}/aceitar`, undefined, joao)).statusCode).toBe(403);
    expect((await req("POST", "/conta/eu/cuidados/turnos/shift-4", undefined, joao)).statusCode).toBe(404);
    expect((await req("POST", "/conta/eu/cuidados/turnos/shift-2", undefined, joao)).statusCode).toBe(201);
    expect((await req("POST", "/conta/eu/cuidados/turnos/shift-2", undefined, joao)).statusCode).toBe(409);
    const page = (await req("GET", "/conta/eu/cuidados", undefined, joao)).json();
    expect(page.volunteer).toBe(true);
    expect(page.tasks.open.map((t: { id: string }) => t.id)).toEqual([taskId]);
    expect(page.unread).toBe(1);
    expect(page.notifications[0]).toMatchObject({ catName: "Estrela", important: true });
  });

  it("someone takes it: the request closes for everyone and they hear it is solved", async () => {
    tick();
    const res = await req("POST", `/conta/eu/cuidados/tarefas/${taskId}/aceitar`, undefined, joao);
    expect(res.json()).toMatchObject({ status: "aceite", acceptedBy: { name: "João Costa" } });
    expect((await req("POST", `/conta/eu/cuidados/tarefas/${taskId}/aceitar`, undefined, ana)).json().message).toBe("João Costa já ficou com este pedido. Obrigado na mesma!");
    const anaPage = (await req("GET", "/conta/eu/cuidados", undefined, ana)).json();
    const lines = anaPage.notifications.flatMap((g: { alerts: { message: string }[] }) => g.alerts.map((a) => a.message));
    expect(lines.filter((m: string) => m.includes("Insulina"))).toEqual(["Resolvido: João Costa vai dar Insulina (1 unidade) a Estrela hoje às 20:00. Obrigado!"]);
    expect(anaPage.tasks.open).toEqual([]);
    const [to] = notify.mock.calls.at(-1)! as [Account[], CareAlert];
    expect(to.map((a) => a.name)).toEqual(["Ana Ribeiro"]);
  });

  it("the person who took it can give that dose, but not others", async () => {
    clock = new Date("2026-11-07T20:05:00.000Z");
    expect((await req("POST", "/conta/eu/cuidados/tomas", { medicationId: "med-1", date: "2026-11-07", time: "08:00" }, joao)).statusCode).toBe(403);
    expect((await req("POST", "/conta/eu/cuidados/tomas", { medicationId: "med-1", date: "2026-11-07", time: "20:00" }, joao)).statusCode).toBe(201);
    const tasks = (await req("GET", "/cuidados/tarefas", undefined, admin)).json();
    expect(tasks.find((t: { id: string }) => t.id === taskId)).toMatchObject({ status: "feita", closedBy: { name: "João Costa" } });
    expect((notify.mock.calls.at(-1)![1] as CareAlert).message).toBe("Feito: João Costa conseguiu dar Insulina (1 unidade) a Estrela.");
  });
});

describe("notifications", () => {
  it("each person can silence them for themselves only", async () => {
    tick();
    await req("PUT", "/conta/eu/cuidados/preferencias", { muteAll: false, mutedKinds: [], mutedCats: ["cat-4"] }, ana);
    await req("POST", "/cuidados/notas", { by: { name: "Gestora" }, catId: "cat-4", text: "Mudámos a ração.", important: false }, admin);
    const anaPage = (await req("GET", "/conta/eu/cuidados", undefined, ana)).json();
    const estrela = anaPage.notifications.find((g: { catId: string }) => g.catId === "cat-4");
    expect(estrela.alerts.every((a: { muted: boolean; unread: boolean }) => a.muted && !a.unread)).toBe(true);
    expect((await req("GET", "/conta/eu/cuidados/resumo", undefined, ana)).json().unread).toBe(anaPage.unread);
  });

  it("marks everything as seen", async () => {
    await req("PUT", "/conta/eu/cuidados/preferencias", { muteAll: false, mutedKinds: [], mutedCats: [] }, ana);
    expect((await req("GET", "/conta/eu/cuidados/resumo", undefined, ana)).json().unread).toBeGreaterThan(0);
    expect((await req("POST", "/conta/eu/cuidados/vistas", undefined, ana)).statusCode).toBe(204);
    expect((await req("GET", "/conta/eu/cuidados/resumo", undefined, ana)).json().unread).toBe(0);
  });
});
