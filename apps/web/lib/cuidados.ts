"use client";
import {
  buildVolunteerCare,
  canHandleDose,
  cantGiveInputSchema,
  defaultCarePrefs,
  lisbonNow,
  lisbonToUtc,
  noteAlert,
  seedAppointments,
  seedCareAlerts,
  seedCatCare,
  seedCats,
  seedMedications,
  seedShifts,
  seedVisitNotes,
  taskAlert,
  visitNoteInputSchema,
  type Author,
  type CareAlert,
  type CareNotificationPrefs,
  type CareTask,
  type Dose,
  type Shift,
  type VisitNote,
  type VolunteerCare,
} from "@gn/domain";
import { rememberSignedIn, type Failure, type Result } from "./conta";

/**
 * "No gatil" in the volunteer's own area: the cats of their shift, how to look after each one,
 * help requests and notifications. Two versions, like the account: the real API and an in-browser demo.
 */
export type DoseRef = { medicationId: string; date: string; time: string };
export type PrefsInput = Pick<CareNotificationPrefs, "muteAll" | "mutedKinds" | "mutedCats">;
type Done = Result<object>;

export interface CuidadosClient {
  overview(): Promise<VolunteerCare | null>;
  /** The count next to the name in the header. */
  summary(): Promise<{ volunteer: boolean; unread: number } | null>;
  giveDose(dose: DoseRef): Promise<Done>;
  cantGive(dose: DoseRef & { comment: string }): Promise<Done>;
  acceptTask(id: string): Promise<Done>;
  /** Join a gatil shift with the account's own name and mobile number. */
  joinShift(id: string): Promise<Done>;
  releaseTask(id: string): Promise<Done>;
  addNote(note: { catId: string; text: string; important: boolean }): Promise<Done>;
  markSeen(): Promise<void>;
  savePrefs(prefs: PrefsInput): Promise<Done>;
}

type Issue = { path: (string | number)[]; message: string };
const fail = (message: string, issues: Issue[] = []): Failure => {
  const fieldErrors: Record<string, string> = {};
  for (const issue of issues) fieldErrors[String(issue.path[0])] ??= issue.message;
  return { ok: false, message, fieldErrors };
};
const OFFLINE = "Sem ligação à internet. Verifique a ligação e tente outra vez.";
const ok: Done = { ok: true };

// ----- real API -----

function httpClient(): CuidadosClient {
  async function call(method: string, path: string, body?: unknown): Promise<Done> {
    try {
      const res = await fetch(`/api/conta/eu/cuidados${path}`, {
        method,
        headers: body !== undefined ? { "content-type": "application/json" } : undefined,
        body: body !== undefined ? JSON.stringify(body) : undefined,
        credentials: "same-origin",
      });
      if (res.ok) return ok;
      const data = (await res.json().catch(() => ({}))) as { message?: string; issues?: Issue[] };
      return fail(data.message ?? "Não foi possível guardar. Tente outra vez.", data.issues ?? []);
    } catch {
      return fail(OFFLINE);
    }
  }
  return {
    async overview() {
      const res = await fetch("/api/conta/eu/cuidados", { credentials: "same-origin" });
      if (res.status === 401) return null;
      if (!res.ok) throw new Error("Erro");
      return (await res.json()) as VolunteerCare;
    },
    async summary() {
      const res = await fetch("/api/conta/eu/cuidados/resumo", { credentials: "same-origin" });
      return res.ok ? ((await res.json()) as { volunteer: boolean; unread: number }) : null;
    },
    giveDose: (dose) => call("POST", "/tomas", dose),
    cantGive: (input) => call("POST", "/nao-consigo", input),
    acceptTask: (id) => call("POST", `/tarefas/${encodeURIComponent(id)}/aceitar`),
    joinShift: (id) => call("POST", `/turnos/${encodeURIComponent(id)}`),
    releaseTask: (id) => call("POST", `/tarefas/${encodeURIComponent(id)}/devolver`),
    addNote: (note) => call("POST", "/notas", note),
    async markSeen() { await call("POST", "/vistas"); },
    savePrefs: (prefs) => call("PUT", "/preferencias", prefs),
  };
}

// ----- demo: example cats and a gatil shift today, kept in this browser -----

const DEMO_KEY = "gn-cuidados-demo";
const ACCOUNT_KEY = "gn-conta-demo";
type DemoState = {
  doses: Dose[]; tasks: CareTask[]; notes: VisitNote[]; alerts: CareAlert[]; prefs: Record<string, CareNotificationPrefs>;
  joined?: { shiftId: string; name: string; phone: string }[];
};

const newId = () => (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`);
const rui: Author = { name: "Rui Sousa", accountId: "conta-rui" };

/** The example data was written for 22 October 2026: move it so it always reads as "the last few days". */
function shiftIso(iso: string, by: number) {
  return new Date(Date.parse(iso) + by).toISOString();
}
const delta = () => Math.max(0, Date.now() - Date.parse("2026-10-22T12:00:00.000Z"));

/**
 * Ana (912 000 001) and Rui are on this morning's gatil shift, João (913 000 002) on next week's.
 * This evening's shift is free, so anyone trying the demo can join it and see the evening doses.
 */
function demoShifts(now: Date, joined: DemoState["joined"] = []): Shift[] {
  const today = lisbonNow(now).date;
  const inAWeek = lisbonNow(new Date(now.getTime() + 7 * 86_400_000)).date;
  const signedUpAt = shiftIso(now.toISOString(), -3 * 86_400_000);
  const base = { type: "limpeza" as const, title: "Limpeza, comida e medicação", location: "Gatil, Santa Marta de Portuzelo", capacity: 4 };
  return [
    ...seedShifts.filter((s) => s.type !== "limpeza"),
    { ...base, id: "demo-hoje", startsAt: lisbonToUtc(today, "08:30"), endsAt: lisbonToUtc(today, "10:30"), signups: [
      { volunteerId: "vol-1", name: "Ana Ribeiro", phone: "912000001", signedUpAt },
      { volunteerId: "vol-2", name: "Rui Sousa", phone: "912000002", signedUpAt },
    ] },
    { ...base, id: "demo-noite", startsAt: lisbonToUtc(today, "19:30"), endsAt: lisbonToUtc(today, "21:00"), signups: [] },
    { ...base, id: "demo-semana", startsAt: lisbonToUtc(inAWeek, "18:30"), endsAt: lisbonToUtc(inAWeek, "20:30"), signups: [{ volunteerId: "vol-3", name: "João Costa", phone: "913000002", signedUpAt }] },
  ].map((s) => ({
    ...s,
    signups: [...s.signups, ...joined.filter((j) => j.shiftId === s.id).map((j) => ({ volunteerId: `demo-${j.phone}`, name: j.name, phone: j.phone, signedUpAt }))],
  }));
}

function freshDemo(now: Date): DemoState {
  const by = delta();
  const today = lisbonNow(now).date;
  // Rui cannot stay for Estrela's evening insulin: a request waiting for someone.
  const task: CareTask = {
    id: "demo-pedido", catId: "cat-4", catName: "Estrela", medicationId: "med-1", what: "Dar Insulina (1 unidade)", date: today, time: "20:00",
    comment: "Hoje saio tarde do trabalho e não chego a tempo.", status: "aberta", createdBy: rui, createdAt: shiftIso(now.toISOString(), -2 * 3_600_000),
  };
  return {
    doses: [],
    tasks: [task],
    notes: seedVisitNotes.map((n) => ({ ...n, createdAt: shiftIso(n.createdAt, by) })),
    alerts: [
      ...seedCareAlerts.map((a) => ({ ...a, createdAt: shiftIso(a.createdAt, by) })),
      { ...taskAlert(task, "pedida", today), id: newId(), catId: task.catId, catName: task.catName, by: rui, createdAt: task.createdAt, taskId: task.id },
    ],
    prefs: {},
  };
}

function load(now: Date): DemoState {
  try {
    const raw = localStorage.getItem(DEMO_KEY);
    if (raw) return JSON.parse(raw) as DemoState;
  } catch { /* fall through */ }
  return freshDemo(now);
}
function save(state: DemoState) {
  try { localStorage.setItem(DEMO_KEY, JSON.stringify(state)); } catch { /* storage unavailable */ }
}
function signedIn(): { id: string; name: string; phone?: string } | undefined {
  try {
    const raw = localStorage.getItem(ACCOUNT_KEY);
    if (!raw) return undefined;
    const s = JSON.parse(raw) as { accounts: { id: string; name: string; phone?: string }[]; signedIn?: string };
    return s.accounts.find((a) => a.id === s.signedIn);
  } catch {
    return undefined;
  }
}

function demoClient(): CuidadosClient {
  const by = delta();
  const appointments = seedAppointments.map((a) => ({ ...a, startsAt: shiftIso(a.startsAt, by) }));

  function context() {
    const now = new Date();
    const account = signedIn();
    const state = load(now);
    const shifts = demoShifts(now, state.joined);
    return { now, account, state, shifts };
  }
  function view(c: ReturnType<typeof context>) {
    return buildVolunteerCare({
      account: c.account!, now: c.now, shifts: c.shifts, cats: seedCats, care: seedCatCare, medications: seedMedications,
      doses: c.state.doses, tasks: c.state.tasks, appointments, notes: c.state.notes, alerts: c.state.alerts, prefs: c.state.prefs[c.account!.id],
    });
  }
  const author = (a: { id: string; name: string }): Author => ({ name: a.name, accountId: a.id });
  const raise = (state: DemoState, task: CareTask, change: Parameters<typeof taskAlert>[1], who: Author, now: Date) => {
    state.alerts.push({ ...taskAlert(task, change, lisbonNow(now).date), id: newId(), catId: task.catId, catName: task.catName, by: who, createdAt: now.toISOString(), taskId: task.id });
  };
  const findMed = (id: string) => seedMedications.find((m) => m.id === id);

  /** Same rule as the API: today, on the gatil shift or a request this person took. */
  function check(c: ReturnType<typeof context>, dose: DoseRef): Failure | undefined {
    if (!c.account) return fail("A sua sessão terminou. Entre outra vez.");
    const v = view(c);
    const med = findMed(dose.medicationId);
    if (!v.volunteer || !med) return fail("Esta dose não faz parte do seu turno.");
    const where = seedCatCare.find((x) => x.catId === med.catId)?.location;
    const r = canHandleDose({ isToday: v.isToday, accountId: c.account.id, today: v.today }, dose, { catInShelter: !!where && where.area !== "fora", tasks: c.state.tasks });
    if (!r.ok) return fail(r.reason === "dia" ? "Só pode registar doses de hoje." : "Esta dose não faz parte do seu turno.");
    return undefined;
  }

  return {
    async overview() {
      const c = context();
      return c.account ? view(c) : null;
    },
    async summary() {
      const c = context();
      return c.account ? view(c) : null;
    },
    async giveDose(dose) {
      const c = context();
      const problem = check(c, dose);
      if (problem) return problem;
      const already = c.state.doses.find((d) => d.medicationId === dose.medicationId && d.date === dose.date && d.time === dose.time);
      if (already) return fail(`Esta dose já foi dada por ${already.by.name} às ${lisbonNow(new Date(already.givenAt)).time}. Não dê outra vez.`);
      const who = author(c.account!);
      c.state.doses.push({ id: newId(), medicationId: dose.medicationId, catId: findMed(dose.medicationId)!.catId, date: dose.date, time: dose.time, givenAt: c.now.toISOString(), by: who });
      for (const t of c.state.tasks.filter((x) => (x.status === "aberta" || x.status === "aceite") && x.medicationId === dose.medicationId && x.date === dose.date && x.time === dose.time)) {
        Object.assign(t, { status: "feita", closedBy: who, closedAt: c.now.toISOString() });
        raise(c.state, t, "feita", who, c.now);
      }
      save(c.state);
      return ok;
    },
    async cantGive(input) {
      const parsed = cantGiveInputSchema.safeParse(input);
      if (!parsed.success) return fail("Alguns campos não estão corretos.", parsed.error.issues);
      const c = context();
      const problem = check(c, input);
      if (problem) return problem;
      const who = author(c.account!);
      const same = (t: CareTask) => t.medicationId === input.medicationId && t.date === input.date && t.time === input.time;
      const mine = c.state.tasks.find((t) => t.status === "aceite" && same(t) && t.acceptedBy?.accountId === who.accountId);
      if (mine) {
        Object.assign(mine, { status: "aberta", acceptedBy: undefined, acceptedAt: undefined });
        raise(c.state, mine, "devolvida", who, c.now);
        save(c.state);
        return ok;
      }
      if (c.state.tasks.some((t) => (t.status === "aberta" || t.status === "aceite") && same(t))) return fail("Já foi pedida ajuda para esta dose.");
      const med = findMed(input.medicationId)!;
      const cat = seedCats.find((x) => x.id === med.catId)!;
      const task: CareTask = { id: newId(), catId: cat.id, catName: cat.name, medicationId: med.id, what: `Dar ${med.name} (${med.dose})`, date: input.date, time: input.time, comment: parsed.data.comment, status: "aberta", createdBy: who, createdAt: c.now.toISOString() };
      c.state.tasks.push(task);
      c.state.notes.push({ id: newId(), catId: cat.id, text: `Não foi possível dar ${med.name} (${input.time}): ${parsed.data.comment}`, important: true, by: who, createdAt: task.createdAt });
      raise(c.state, task, "pedida", who, c.now);
      save(c.state);
      return ok;
    },
    async joinShift(id) {
      const c = context();
      if (!c.account?.phone) return fail("Para se inscrever aqui, entre com o seu telemóvel.");
      const shift = c.shifts.find((s) => s.id === id);
      if (!shift) return fail("Turno não encontrado.");
      if (shift.signups.some((x) => x.phone === c.account!.phone)) return fail("Já está inscrito neste turno.");
      c.state.joined = [...(c.state.joined ?? []), { shiftId: id, name: c.account.name, phone: c.account.phone }];
      save(c.state);
      return ok;
    },
    async acceptTask(id) {
      const c = context();
      if (!c.account || !view(c).volunteer) return fail("Esta parte é para quem está inscrito nos turnos do gatil.");
      const t = c.state.tasks.find((x) => x.id === id);
      if (!t) return fail("Pedido não encontrado.");
      if (t.status !== "aberta") return fail(t.status === "aceite" ? `${t.acceptedBy!.name} já ficou com este pedido. Obrigado na mesma!` : "Este pedido já está resolvido.");
      const who = author(c.account);
      Object.assign(t, { status: "aceite", acceptedBy: who, acceptedAt: c.now.toISOString() });
      raise(c.state, t, "aceite", who, c.now);
      save(c.state);
      return ok;
    },
    async releaseTask(id) {
      const c = context();
      const t = c.state.tasks.find((x) => x.id === id);
      if (!c.account || !t || t.acceptedBy?.accountId !== c.account.id) return fail("Este pedido não está consigo.");
      const who = author(c.account);
      Object.assign(t, { status: "aberta", acceptedBy: undefined, acceptedAt: undefined });
      raise(c.state, t, "devolvida", who, c.now);
      save(c.state);
      return ok;
    },
    async addNote(input) {
      const parsed = visitNoteInputSchema.safeParse(input);
      if (!parsed.success) return fail("Alguns campos não estão corretos.", parsed.error.issues);
      const c = context();
      if (!c.account || !view(c).isToday) return fail("Pode deixar comentários no dia do seu turno.");
      const cat = seedCats.find((x) => x.id === input.catId);
      if (!cat) return fail("Gato não encontrado.");
      const who = author(c.account);
      const note: VisitNote = { ...parsed.data, id: newId(), by: who, createdAt: c.now.toISOString() };
      c.state.notes.push(note);
      c.state.alerts.push({ ...noteAlert(cat.name, note), id: newId(), catId: cat.id, catName: cat.name, by: who, createdAt: note.createdAt });
      save(c.state);
      return ok;
    },
    async markSeen() {
      const c = context();
      if (!c.account) return;
      c.state.prefs[c.account.id] = { ...(c.state.prefs[c.account.id] ?? defaultCarePrefs), lastSeenAt: c.now.toISOString() };
      save(c.state);
    },
    async savePrefs(prefs) {
      const c = context();
      if (!c.account) return fail("A sua sessão terminou. Entre outra vez.");
      c.state.prefs[c.account.id] = { ...prefs, lastSeenAt: c.state.prefs[c.account.id]?.lastSeenAt };
      save(c.state);
      return ok;
    },
  };
}

/** Lets the header count follow what the person does on the page. */
export const CUIDADOS_EVENT = "gn-cuidados-change";

/** Demo only: switch this browser's demo session to Ana, who is on this morning's gatil shift. */
export function tryAsDemoVolunteer() {
  try {
    const raw = localStorage.getItem(ACCOUNT_KEY);
    if (!raw) return;
    const s = JSON.parse(raw) as { accounts: { id: string; name: string }[]; signedIn?: string };
    const ana = s.accounts.find((a) => a.id === "conta-1");
    if (!ana) return;
    localStorage.setItem(ACCOUNT_KEY, JSON.stringify({ ...s, signedIn: ana.id }));
    rememberSignedIn(ana);
  } catch { /* storage unavailable */ }
}

let client: CuidadosClient | undefined;
export function cuidadosClient(): CuidadosClient {
  client ??= process.env.NEXT_PUBLIC_CONTAS_DEMO === "1" ? demoClient() : httpClient();
  return client;
}
