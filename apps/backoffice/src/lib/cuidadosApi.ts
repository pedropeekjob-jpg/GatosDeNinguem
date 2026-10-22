import type { Appointment, AppointmentInput, AppointmentStatus, Author, CareAlert, CareTask, CatCare, CatLocation, CatStatus, Dose, Medication, MedicationInput, Photo, VisitNote, VisitNoteInput } from "@gn/domain";

export type CatSummary = { id: string; name: string; slug: string; status: CatStatus; photo?: Photo };
export type ShelterRow = { cat: CatSummary; care: CatCare | null; activeMedications: string[]; nextAppointment: Appointment | null };
export type CatFile = { cat: CatSummary; care: CatCare | null; medications: Medication[]; appointments: Appointment[]; notes: VisitNote[]; alerts: CareAlert[] };
export type RoundRow = { medication: Medication; time: string; given?: Dose; cat: CatSummary; location: CatLocation | null; task?: CareTask | null };
export type UpcomingAppointment = Appointment & { cat: CatSummary; transport: { shiftId: string; volunteers: string[]; free: number } | null };
export type AppointmentChanges = Partial<Pick<Appointment, "startsAt" | "clinic" | "reason" | "notes" | "outcome">> & { status?: AppointmentStatus };

/** What the back office asks the API about care inside the shelter. Every write says who made it. */
export interface CuidadosApi {
  shelter(): Promise<ShelterRow[]>;
  catFile(catId: string): Promise<CatFile>;
  moveCat(catId: string, location: CatLocation, by: Author): Promise<CatCare>;
  addMedication(input: MedicationInput, by: Author): Promise<Medication>;
  updateMedication(id: string, changes: Partial<MedicationInput>, by: Author): Promise<Medication>;
  stopMedication(id: string, by: Author): Promise<Medication>;
  round(date: string): Promise<{ date: string; items: RoundRow[] }>;
  giveDose(medicationId: string, slot: { date: string; time: string }, by: Author): Promise<Dose>;
  undoDose(id: string): Promise<void>;
  upcomingAppointments(): Promise<UpcomingAppointment[]>;
  addAppointment(input: AppointmentInput, by: Author): Promise<Appointment>;
  updateAppointment(id: string, changes: AppointmentChanges, by: Author): Promise<Appointment>;
  addNote(input: VisitNoteInput, by: Author): Promise<VisitNote>;
  careAlerts(): Promise<CareAlert[]>;
  /** Help requests from volunteers who could not give a dose: open ones and those closed this week. */
  careTasks(): Promise<CareTask[]>;
  cancelTask(id: string, by: Author): Promise<CareTask>;
}

type Call = <T>(method: string, path: string, body?: unknown) => Promise<T>;

export function cuidadosHttp(call: Call): CuidadosApi {
  return {
    shelter: () => call("GET", "/cuidados/gatil"),
    catFile: (id) => call("GET", `/cuidados/gatos/${id}`),
    moveCat: (id, location, by) => call("PUT", `/cuidados/gatos/${id}/localizacao`, { location, by }),
    addMedication: (input, by) => call("POST", "/cuidados/medicacao", { ...input, by }),
    updateMedication: (id, changes, by) => call("PATCH", `/cuidados/medicacao/${id}`, { ...changes, by }),
    stopMedication: (id, by) => call("POST", `/cuidados/medicacao/${id}/terminar`, { by }),
    round: (date) => call("GET", `/cuidados/ronda?dia=${date}`),
    giveDose: (id, slot, by) => call("POST", `/cuidados/medicacao/${id}/tomas`, { ...slot, by }),
    undoDose: (id) => call("DELETE", `/cuidados/tomas/${id}`),
    upcomingAppointments: () => call("GET", "/cuidados/consultas"),
    addAppointment: (input, by) => call("POST", "/cuidados/consultas", { ...input, by }),
    updateAppointment: (id, changes, by) => call("PATCH", `/cuidados/consultas/${id}`, { ...changes, by }),
    addNote: (input, by) => call("POST", "/cuidados/notas", { ...input, by }),
    careAlerts: () => call("GET", "/cuidados/novidades?limite=100"),
    careTasks: () => call("GET", "/cuidados/tarefas"),
    cancelTask: (id, by) => call("POST", `/cuidados/tarefas/${id}/cancelar`, { by }),
  };
}
