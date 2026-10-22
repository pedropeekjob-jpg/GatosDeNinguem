import type { Cat } from "./content";
import type { Shift } from "./escalas";
import {
  defaultCarePrefs,
  groupAlertsByCat,
  isMedicationActive,
  isMuted,
  lisbonNow,
  medicationRound,
  relevantAlerts,
  splitRoundForShift,
  unreadForVolunteer,
  volunteerDuty,
  type Appointment,
  type CareAlert,
  type CareNotificationPrefs,
  type CareTask,
  type CatCare,
  type Dose,
  type Medication,
  type VisitNote,
} from "./cuidados";

/**
 * The volunteer's own care page, built from plain data so the API and the in-browser demo
 * show exactly the same thing.
 */
export const catSummary = (c: Cat) => ({ id: c.id, name: c.name, slug: c.slug, status: c.status, photo: c.photos[0] });
export type CatSummary = ReturnType<typeof catSummary>;

const OPEN_TASK: CareTask["status"][] = ["aberta", "aceite"];
const NOTIFICATION_DAYS = 14;
const IMPORTANT_DAYS = 7;
const dayMs = 86_400_000;
const lisbonDate = (iso: string) => lisbonNow(new Date(iso)).date;

export type CareData = {
  cats: Cat[];
  care: CatCare[];
  medications: Medication[];
  doses: Dose[];
  tasks: CareTask[];
};

/** Every dose due on a day, which cat, where it is, who gave it, and any open help request about it. */
export function careRound(data: CareData, date: string) {
  const catById = new Map(data.cats.map((c) => [c.id, c]));
  const careById = new Map(data.care.map((c) => [c.catId, c]));
  const open = data.tasks.filter((t) => OPEN_TASK.includes(t.status));
  return medicationRound(data.medications.filter((m) => catById.has(m.catId)), data.doses, date).map((r) => {
    const cat = catById.get(r.medication.catId)!;
    return {
      ...r,
      cat: catSummary(cat),
      location: careById.get(cat.id)?.location ?? null,
      specialNeeds: cat.specialNeeds,
      task: open.find((t) => t.medicationId === r.medication.id && t.date === date && t.time === r.time) ?? null,
    };
  });
}
export type CareRoundItem = ReturnType<typeof careRound>[number];

export type VolunteerCareInput = CareData & {
  shifts: Shift[];
  appointments: Appointment[];
  notes: VisitNote[];
  alerts: CareAlert[];
  prefs?: CareNotificationPrefs;
  account: { id: string; phone?: string };
  now: Date;
};

export function buildVolunteerCare(input: VolunteerCareInput) {
  const { account, now } = input;
  const prefs = input.prefs ?? defaultCarePrefs;
  const duty = volunteerDuty(input.shifts, account.phone, now);
  const base = { volunteer: duty.isVolunteer, phoneMissing: !account.phone, prefs, today: lisbonNow(now).date };
  if (!duty.isVolunteer) {
    return { ...base, shift: null, isToday: false, during: [] as CareRoundItem[], rest: [] as CareRoundItem[], cats: [] as CatGuide[], transports: [] as Transport[], tasks: { open: [] as CareTask[], mine: [] as CareTask[] }, notifications: [] as NotificationGroup[], unread: 0 };
  }

  const careById = new Map(input.care.map((c) => [c.catId, c]));
  const shiftDate = duty.shift ? lisbonDate(duty.shift.startsAt) : base.today;
  const inShelter = (catId: string) => {
    const where = careById.get(catId)?.location;
    return !!where && where.area !== "fora";
  };

  // The shift: that day's doses in the gatil, split into "during your shift" and the rest of the day.
  const round = duty.shift ? careRound(input, shiftDate).filter((r) => inShelter(r.cat.id)) : [];
  const { during, rest } = duty.shift ? splitRoundForShift(round, duty.shift) : { during: [], rest: [] };

  // "Como tratar de cada gato": what it needs now first, then the latest news.
  const weekAgo = new Date(now.getTime() - IMPORTANT_DAYS * dayMs).toISOString();
  const nowIso = now.toISOString();
  const notesNewestFirst = [...input.notes].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const guide = (cat: Cat) => {
    const catNotes = notesNewestFirst.filter((n) => n.catId === cat.id);
    return {
      cat: catSummary(cat),
      location: careById.get(cat.id)?.location ?? null,
      specialNeeds: cat.specialNeeds,
      medications: input.medications
        .filter((m) => m.catId === cat.id && isMedicationActive(m, shiftDate))
        .map(({ id, name, dose, times, withFood, instructions }) => ({ id, name, dose, times, withFood, instructions })),
      importantNotes: catNotes.filter((n) => n.important && n.createdAt >= weekAgo).slice(0, 3),
      latestNotes: catNotes.filter((n) => !(n.important && n.createdAt >= weekAgo)).slice(0, 3),
      nextAppointment: input.appointments
        .filter((a) => a.catId === cat.id && a.status === "marcada" && a.startsAt >= nowIso)
        .sort((a, b) => a.startsAt.localeCompare(b.startsAt))[0] ?? null,
    };
  };
  const needsCare = (c: Cat) => {
    const where = careById.get(c.id)?.location;
    if (!where || where.area === "fora") return false;
    return (
      where.spot === "jaula" ||
      !!c.specialNeeds ||
      input.medications.some((m) => m.catId === c.id && isMedicationActive(m, shiftDate)) ||
      input.notes.some((n) => n.catId === c.id && n.important && n.createdAt >= weekAgo)
    );
  };
  const shiftCats = duty.shift ? input.cats.filter((c) => c.status !== "adotado" && needsCare(c)).sort((a, b) => a.name.localeCompare(b.name, "pt")) : [];

  const transports = duty.transports.map((shift) => {
    const appointment = input.appointments.find((a) => a.transportShiftId === shift.id) ?? null;
    const cat = input.cats.find((c) => c.id === appointment?.catId || c.slug === shift.catSlug);
    return {
      shift: { id: shift.id, title: shift.title, startsAt: shift.startsAt, endsAt: shift.endsAt, location: shift.location, notes: shift.notes, clinic: shift.clinic },
      appointment,
      guide: cat ? guide(cat) : null,
    };
  });

  const openTasks = input.tasks.filter((t) => OPEN_TASK.includes(t.status));
  const mine = openTasks.filter((t) => t.acceptedBy?.accountId === account.id || (t.status === "aberta" && t.createdBy.accountId === account.id));
  const open = openTasks.filter((t) => t.status === "aberta" && t.createdBy.accountId !== account.id);

  // Notifications only about what this person looks after, plus help requests (one line each, latest news).
  const catIds = new Set([...shiftCats.map((c) => c.id), ...transports.flatMap((t) => (t.guide ? [t.guide.cat.id] : [])), ...mine.map((t) => t.catId)]);
  const since = new Date(now.getTime() - NOTIFICATION_DAYS * dayMs).toISOString();
  const relevant = relevantAlerts(input.alerts, { catIds, tasks: input.tasks, since });
  const unread = unreadForVolunteer(relevant, prefs);
  const unreadIds = new Set(unread.map((a) => a.id));

  return {
    ...base,
    shift: duty.shift ? { id: duty.shift.id, title: duty.shift.title, startsAt: duty.shift.startsAt, endsAt: duty.shift.endsAt, location: duty.shift.location, team: duty.shift.signups.map((s) => s.name) } : null,
    isToday: duty.isToday,
    during,
    rest,
    cats: shiftCats.map(guide),
    transports,
    tasks: { open, mine },
    notifications: groupAlertsByCat(relevant.map((a) => ({ ...a, unread: unreadIds.has(a.id), muted: isMuted(a, prefs) }))) as NotificationGroup[],
    unread: unread.length,
  };
}

export type CatGuide = {
  cat: CatSummary;
  location: CatCare["location"] | null;
  specialNeeds?: string;
  medications: Pick<Medication, "id" | "name" | "dose" | "times" | "withFood" | "instructions">[];
  importantNotes: VisitNote[];
  latestNotes: VisitNote[];
  nextAppointment: Appointment | null;
};
export type Transport = {
  shift: Pick<Shift, "id" | "title" | "startsAt" | "endsAt" | "location" | "notes" | "clinic">;
  appointment: Appointment | null;
  guide: CatGuide | null;
};
export type VolunteerAlert = CareAlert & { unread: boolean; muted: boolean };
export type NotificationGroup = { catId: string; catName: string; alerts: VolunteerAlert[]; important: boolean; latestAt: string };
export type VolunteerCare = ReturnType<typeof buildVolunteerCare>;

/** Who may mark or hand over a dose: someone on today's gatil shift (cat in the gatil), or who took the request. */
export function canHandleDose(
  ctx: { isToday: boolean; accountId: string; today: string },
  dose: { medicationId: string; date: string; time: string },
  data: { catInShelter: boolean; tasks: CareTask[] },
): { ok: true } | { ok: false; reason: "dia" | "turno" } {
  if (dose.date !== ctx.today) return { ok: false, reason: "dia" };
  const taken = data.tasks.some((t) => t.status === "aceite" && t.medicationId === dose.medicationId && t.date === dose.date && t.time === dose.time && t.acceptedBy?.accountId === ctx.accountId);
  return (ctx.isToday && data.catInShelter) || taken ? { ok: true } : { ok: false, reason: "turno" };
}
