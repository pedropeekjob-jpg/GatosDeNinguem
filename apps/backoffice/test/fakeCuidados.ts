import { vi } from "vitest";
import {
  appointmentAlert, isMedicationActive, lisbonNow, locationChangeAlert, medicationAlert, medicationRound, noteAlert,
  seedAppointments, seedCareAlerts, seedCatCare, seedCats, seedDoses, seedMedications, seedVisitNotes,
  type Author, type CareAlert, type CareAlertDraft, type Cat,
} from "@gn/domain";
import type { CuidadosApi } from "../src/lib/cuidadosApi";

/** In-memory care API on the same demo data and rules as the server. */
export function fakeCuidados(now: Date, cats: () => Cat[]): CuidadosApi {
  let care = structuredClone(seedCatCare);
  let meds = structuredClone(seedMedications);
  let doses = structuredClone(seedDoses);
  let appointments = structuredClone(seedAppointments);
  let notes = structuredClone(seedVisitNotes);
  let alerts: CareAlert[] = structuredClone(seedCareAlerts);
  let n = 0;
  const id = () => `c-${++n}`;
  const summary = (c: Cat) => ({ id: c.id, name: c.name, slug: c.slug, status: c.status, photo: c.photos[0] });
  const cat = (catId: string) => (cats().length ? cats() : seedCats).find((c) => c.id === catId)!;
  const raise = (catId: string, d: CareAlertDraft, by: Author) => {
    alerts = [{ ...d, id: id(), catId, catName: cat(catId).name, by, createdAt: new Date(now.getTime() + n * 1000).toISOString() }, ...alerts];
  };
  const sorted = () => [...alerts].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const today = lisbonNow(now).date;

  return {
    shelter: async () => seedCats.filter((c) => c.status !== "adotado").map((c) => ({
      cat: summary(c),
      care: care.find((x) => x.catId === c.id) ?? null,
      activeMedications: meds.filter((m) => m.catId === c.id && isMedicationActive(m, today)).map((m) => m.name),
      nextAppointment: appointments.find((a) => a.catId === c.id && a.status === "marcada") ?? null,
    })).sort((a, b) => a.cat.name.localeCompare(b.cat.name, "pt")),
    catFile: async (catId) => ({
      cat: summary(cat(catId)),
      care: care.find((x) => x.catId === catId) ?? null,
      medications: meds.filter((m) => m.catId === catId),
      appointments: appointments.filter((a) => a.catId === catId),
      notes: notes.filter((x) => x.catId === catId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      alerts: sorted().filter((a) => a.catId === catId),
    }),
    moveCat: vi.fn(async (catId, location, by) => {
      const draft = locationChangeAlert(cat(catId).name, care.find((x) => x.catId === catId)?.location, location);
      const next = { catId, location, since: now.toISOString(), updatedBy: by };
      care = [...care.filter((x) => x.catId !== catId), next];
      if (draft) raise(catId, draft, by);
      return next;
    }),
    addMedication: vi.fn(async (input, by) => {
      const m = { ...input, times: input.times ?? [], withFood: input.withFood ?? false, id: id(), createdBy: by, updatedAt: now.toISOString() };
      meds = [...meds, m];
      raise(m.catId, medicationAlert(cat(m.catId).name, m, "nova"), by);
      return m;
    }),
    updateMedication: async (mid, changes, by) => {
      meds = meds.map((m) => (m.id === mid ? { ...m, ...changes } : m));
      const m = meds.find((x) => x.id === mid)!;
      raise(m.catId, medicationAlert(cat(m.catId).name, m, "alterada"), by);
      return m;
    },
    stopMedication: async (mid, by) => {
      meds = meds.map((m) => (m.id === mid ? { ...m, stoppedAt: now.toISOString() } : m));
      const m = meds.find((x) => x.id === mid)!;
      raise(m.catId, medicationAlert(cat(m.catId).name, m, "terminada"), by);
      return m;
    },
    round: async (date) => ({
      date,
      items: medicationRound(meds, doses, date).map((r) => ({ ...r, cat: summary(cat(r.medication.catId)), location: care.find((x) => x.catId === r.medication.catId)?.location ?? null })),
    }),
    giveDose: vi.fn(async (medicationId, slot, by) => {
      const d = { id: id(), medicationId, catId: meds.find((m) => m.id === medicationId)!.catId, ...slot, givenAt: now.toISOString(), by };
      doses = [...doses, d];
      return d;
    }),
    undoDose: async (doseId) => { doses = doses.filter((d) => d.id !== doseId); },
    upcomingAppointments: async () => appointments.filter((a) => a.status === "marcada").map((a) => ({
      ...a, cat: summary(cat(a.catId)), transport: a.transportShiftId ? { shiftId: a.transportShiftId, volunteers: [], free: 1 } : null,
    })),
    addAppointment: vi.fn(async ({ needsTransport, ...input }, by) => {
      const a = { ...input, id: id(), status: "marcada" as const, transportShiftId: needsTransport ? id() : undefined, createdBy: by, updatedAt: now.toISOString() };
      appointments = [...appointments, a];
      raise(a.catId, appointmentAlert(cat(a.catId).name, a, "marcada"), by);
      return a;
    }),
    updateAppointment: async (aid, changes, by) => {
      appointments = appointments.map((a) => (a.id === aid ? { ...a, ...changes } : a));
      const a = appointments.find((x) => x.id === aid)!;
      raise(a.catId, appointmentAlert(cat(a.catId).name, a, a.status === "marcada" ? "alterada" : a.status), by);
      return a;
    },
    addNote: vi.fn(async (input, by) => {
      const note = { ...input, important: input.important ?? false, id: id(), by, createdAt: now.toISOString() };
      notes = [...notes, note];
      raise(note.catId, noteAlert(cat(note.catId).name, note), by);
      return note;
    }),
    careAlerts: async () => sorted(),
  };
}
