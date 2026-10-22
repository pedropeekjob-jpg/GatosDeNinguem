import { z } from "zod";

/**
 * Care inside the shelter ("Cuidados"): where each cat lives, its medication,
 * vet appointments and the notes volunteers leave after each visit.
 * Team-only data: never sent to the public site.
 */

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use uma data no formato AAAA-MM-DD");
const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use uma hora no formato HH:MM");

/** Who made a change. accountId links to a volunteer account once the back office has per-person login. */
export const authorSchema = z.object({
  name: z.string({ required_error: "Indique o seu nome" }).trim().min(2, "Indique o seu nome"),
  accountId: z.string().optional(),
});
export type Author = z.infer<typeof authorSchema>;

// ---------- where each cat lives ----------

/** The shelter has three containers and the colony; "fora" covers foster homes and clinic stays. */
export const shelterAreaSchema = z.enum(["paquito", "caramelo", "carlota", "colonia", "fora"]);
export type ShelterArea = z.infer<typeof shelterAreaSchema>;
export const shelterAreas: ShelterArea[] = ["paquito", "caramelo", "carlota", "colonia", "fora"];
export const shelterAreaLabel: Record<ShelterArea, string> = {
  paquito: "Contentor Paquito",
  caramelo: "Contentor Caramelo",
  carlota: "Contentor Carlota",
  colonia: "Colónia",
  fora: "Fora do gatil",
};
/** Only the containers have cages. */
export const hasCages = (area: ShelterArea) => area === "paquito" || area === "caramelo" || area === "carlota";

export const catLocationSchema = z
  .object({
    area: shelterAreaSchema,
    /** In a container a cat is loose, or in a cage while sick or on medication. */
    spot: z.enum(["solto", "jaula"]).default("solto"),
    /** Cage name or number, e.g. "2". */
    cage: z.string().trim().max(20).optional(),
    /** Why it is there, e.g. "Em jaula enquanto toma antibiótico". */
    reason: z.string().trim().max(200).optional(),
  })
  .refine((l) => l.spot === "solto" || hasCages(l.area), { message: "Só os contentores têm jaulas", path: ["spot"] });
export type CatLocation = z.infer<typeof catLocationSchema>;

export const catCareSchema = z.object({
  catId: z.string(),
  location: catLocationSchema,
  since: z.string().datetime(),
  updatedBy: authorSchema,
});
export type CatCare = z.infer<typeof catCareSchema>;

export function locationLabel(l: Pick<CatLocation, "area" | "spot" | "cage">): string {
  const area = shelterAreaLabel[l.area];
  if (l.spot !== "jaula") return hasCages(l.area) ? `${area}, solto` : area;
  return l.cage ? `${area}, jaula ${l.cage}` : `${area}, em jaula`;
}

const sameLocation = (a: CatLocation, b: CatLocation) => a.area === b.area && a.spot === b.spot && (a.cage ?? "") === (b.cage ?? "");

// ---------- medication ----------

export const medicationInputSchema = z
  .object({
    catId: z.string(),
    name: z.string({ required_error: "Indique o medicamento" }).trim().min(2, "Indique o medicamento"),
    /** As the vet wrote it: "1/2 comprimido", "0,3 ml". */
    dose: z.string({ required_error: "Indique a dose" }).trim().min(1, "Indique a dose"),
    /** Times of day in Lisbon. Empty means "only when needed". */
    times: z.array(timeSchema).max(6).default([]),
    withFood: z.boolean().default(false),
    instructions: z.string().trim().max(500).optional(),
    startDate: dateSchema,
    endDate: dateSchema.optional(),
  })
  .refine((m) => !m.endDate || m.endDate >= m.startDate, { message: "O fim tem de ser depois do início", path: ["endDate"] });
export type MedicationInput = z.infer<typeof medicationInputSchema>;

export const medicationSchema = z
  .object({
    id: z.string(),
    catId: z.string(),
    name: z.string().min(2),
    dose: z.string().min(1),
    times: z.array(timeSchema).default([]),
    withFood: z.boolean().default(false),
    instructions: z.string().optional(),
    startDate: dateSchema,
    endDate: dateSchema.optional(),
    /** Set when the team stops the treatment early. */
    stoppedAt: z.string().datetime().optional(),
    createdBy: authorSchema,
    updatedAt: z.string().datetime(),
  });
export type Medication = z.infer<typeof medicationSchema>;

/** A dose given, so nobody gives it twice. */
export const doseSchema = z.object({
  id: z.string(),
  medicationId: z.string(),
  catId: z.string(),
  date: dateSchema,
  time: timeSchema,
  givenAt: z.string().datetime(),
  by: authorSchema,
});
export type Dose = z.infer<typeof doseSchema>;

export function isMedicationActive(m: Pick<Medication, "startDate" | "endDate" | "stoppedAt">, date: string): boolean {
  if (m.stoppedAt && m.stoppedAt.slice(0, 10) <= date) return false;
  return m.startDate <= date && (!m.endDate || date <= m.endDate);
}

export function timesLabel(m: Pick<Medication, "times" | "withFood">): string {
  const times = [...m.times].sort();
  const when = times.length === 0 ? "Só quando for preciso" : times.length === 1 ? `Uma vez por dia, às ${times[0]}` : `${times.length} vezes por dia: ${times.join(", ")}`;
  return m.withFood ? `${when}, com comida` : when;
}

export type RoundItem = { medication: Medication; time: string; given?: Dose };

/** "Ronda de medicação": every dose due on a day, by time, with the ones already given. */
export function medicationRound(meds: Medication[], doses: Dose[], date: string): RoundItem[] {
  const given = new Map(doses.filter((d) => d.date === date).map((d) => [`${d.medicationId}@${d.time}`, d]));
  return meds
    .filter((m) => isMedicationActive(m, date))
    .flatMap((m) => [...m.times].sort().map((time) => ({ medication: m, time, given: given.get(`${m.id}@${time}`) })))
    .sort((a, b) => a.time.localeCompare(b.time) || a.medication.name.localeCompare(b.medication.name));
}

/** Doses whose time has passed today and were not given yet. */
export function overdueDoses(round: RoundItem[], nowTime: string): RoundItem[] {
  return round.filter((r) => !r.given && r.time <= nowTime);
}

// ---------- vet appointments ----------

export const appointmentStatusSchema = z.enum(["marcada", "feita", "cancelada"]);
export type AppointmentStatus = z.infer<typeof appointmentStatusSchema>;
export const appointmentStatusLabel: Record<AppointmentStatus, string> = { marcada: "Marcada", feita: "Feita", cancelada: "Cancelada" };

export const appointmentInputSchema = z.object({
  catId: z.string(),
  startsAt: z.string({ required_error: "Indique o dia e a hora" }).datetime({ message: "Indique o dia e a hora" }),
  clinic: z.string({ required_error: "Indique a clínica" }).trim().min(2, "Indique a clínica"),
  reason: z.string({ required_error: "Indique o motivo" }).trim().min(2, "Indique o motivo"),
  notes: z.string().trim().max(500).optional(),
  /** Creates a "Transporte ao veterinário" slot in Escalas so a volunteer can sign up. */
  needsTransport: z.boolean().default(false),
});
export type AppointmentInput = z.infer<typeof appointmentInputSchema>;

export const appointmentSchema = z.object({
  id: z.string(),
  catId: z.string(),
  startsAt: z.string().datetime(),
  clinic: z.string().min(2),
  reason: z.string().min(2),
  notes: z.string().optional(),
  status: appointmentStatusSchema,
  /** What the vet said, written when the appointment is marked as done. */
  outcome: z.string().optional(),
  /** The Escalas transport slot for this appointment, if any. */
  transportShiftId: z.string().optional(),
  createdBy: authorSchema,
  updatedAt: z.string().datetime(),
});
export type Appointment = z.infer<typeof appointmentSchema>;

export function upcomingAppointments(list: Appointment[], now: Date): Appointment[] {
  return list.filter((a) => a.status === "marcada" && a.startsAt >= now.toISOString()).sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}

/** Transport slot for an appointment: leaves 30 minutes before, back about an hour after. */
export function transportWindow(startsAt: string): { startsAt: string; endsAt: string } {
  const t = new Date(startsAt).getTime();
  return { startsAt: new Date(t - 30 * 60_000).toISOString(), endsAt: new Date(t + 60 * 60_000).toISOString() };
}

// ---------- notes after each visit ----------

export const visitNoteInputSchema = z.object({
  catId: z.string(),
  text: z.string({ required_error: "Escreva o comentário" }).trim().min(2, "Escreva o comentário").max(2000),
  /** Set when the note is about a vet appointment. */
  appointmentId: z.string().optional(),
  /** Asks everyone to look: "não comeu", "vomitou". */
  important: z.boolean().default(false),
});
export type VisitNoteInput = z.infer<typeof visitNoteInputSchema>;

export const visitNoteSchema = visitNoteInputSchema.extend({
  id: z.string(),
  by: authorSchema,
  createdAt: z.string().datetime(),
});
export type VisitNote = z.infer<typeof visitNoteSchema>;

// ---------- alerts ("Novidades") ----------

export const careAlertKindSchema = z.enum(["localizacao", "medicacao", "consulta", "nota"]);
export type CareAlertKind = z.infer<typeof careAlertKindSchema>;
export const careAlertKindLabel: Record<CareAlertKind, string> = { localizacao: "Mudou de sítio", medicacao: "Medicação", consulta: "Consulta", nota: "Comentário" };

/** Raised on every change so the whole team sees what is new. */
export const careAlertSchema = z.object({
  id: z.string(),
  catId: z.string(),
  catName: z.string(),
  kind: careAlertKindSchema,
  message: z.string(),
  important: z.boolean().default(false),
  by: authorSchema,
  createdAt: z.string().datetime(),
});
export type CareAlert = z.infer<typeof careAlertSchema>;
export type CareAlertDraft = Pick<CareAlert, "kind" | "message" | "important">;

const shortDate = (iso: string) =>
  new Intl.DateTimeFormat("pt-PT", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Lisbon" }).format(new Date(iso));
const dayMonth = (date: string) => new Intl.DateTimeFormat("pt-PT", { day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${date}T12:00:00Z`));

/** Returns undefined when nothing really moved, so saving the same place twice raises no alert. */
export function locationChangeAlert(catName: string, from: CatLocation | undefined, to: CatLocation): CareAlertDraft | undefined {
  if (from && sameLocation(from, to)) return undefined;
  const why = to.reason ? ` Motivo: ${to.reason}.` : "";
  const message = from ? `${catName} mudou de ${locationLabel(from)} para ${locationLabel(to)}.${why}` : `${catName} está agora em ${locationLabel(to)}.${why}`;
  return { kind: "localizacao", message, important: to.spot === "jaula" || from?.spot === "jaula" };
}

export function medicationAlert(catName: string, m: Pick<Medication, "name" | "dose" | "times" | "withFood" | "startDate" | "endDate">, change: "nova" | "alterada" | "terminada"): CareAlertDraft {
  if (change === "terminada") return { kind: "medicacao", message: `${catName} deixou de tomar ${m.name}.`, important: true };
  const until = m.endDate ? ` até ${dayMonth(m.endDate)}` : "";
  const what = `${m.name}, ${m.dose}. ${timesLabel(m)}${until}.`;
  return { kind: "medicacao", message: change === "nova" ? `${catName} começa a tomar ${what}` : `A medicação de ${catName} mudou: ${what}`, important: true };
}

export function appointmentAlert(catName: string, a: Pick<Appointment, "startsAt" | "clinic" | "reason" | "status" | "outcome">, change: "marcada" | "alterada" | "feita" | "cancelada"): CareAlertDraft {
  const when = `${shortDate(a.startsAt)}, ${a.clinic}`;
  switch (change) {
    case "marcada": return { kind: "consulta", message: `Consulta marcada para ${catName}: ${a.reason}, ${when}.`, important: false };
    case "alterada": return { kind: "consulta", message: `A consulta de ${catName} mudou: ${a.reason}, ${when}.`, important: true };
    case "cancelada": return { kind: "consulta", message: `A consulta de ${catName} (${a.reason}) foi cancelada.`, important: true };
    case "feita": return { kind: "consulta", message: `${catName} foi à consulta (${a.reason}).${a.outcome ? ` ${a.outcome}` : ""}`, important: false };
  }
}

export function noteAlert(catName: string, note: Pick<VisitNote, "text" | "important">): CareAlertDraft {
  const text = note.text.length > 160 ? `${note.text.slice(0, 157)}…` : note.text;
  return { kind: "nota", message: `Sobre ${catName}: “${text}”`, important: note.important };
}

export function unreadAlerts(alerts: CareAlert[], lastSeenAt: string | undefined): CareAlert[] {
  return lastSeenAt ? alerts.filter((a) => a.createdAt > lastSeenAt) : alerts;
}

/** Lisbon calendar date and wall-clock time for an instant, e.g. { date: "2026-11-02", time: "08:05" }. */
export function lisbonNow(at: Date): { date: string; time: string } {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Lisbon", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
      .formatToParts(at)
      .map((p) => [p.type, p.value]),
  );
  return { date: `${parts.year}-${parts.month}-${parts.day}`, time: `${parts.hour}:${parts.minute}` };
}
