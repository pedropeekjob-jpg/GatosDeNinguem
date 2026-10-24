import { z } from "zod";

/** Volunteer schedules ("Escalas"): time slots and ongoing commitments. */

export const shiftTypeSchema = z.enum(["limpeza", "transporte-vet", "evento", "outro"]);
export type ShiftType = z.infer<typeof shiftTypeSchema>;
export const shiftTypeLabel: Record<ShiftType, string> = {
  limpeza: "Limpeza e mimos no gatil",
  "transporte-vet": "Transporte ao veterinário",
  evento: "Evento",
  outro: "Outra tarefa",
};

export const signupSchema = z.object({
  volunteerId: z.string(),
  name: z.string().min(2),
  phone: z.string().min(9),
  signedUpAt: z.string().datetime(),
  checkedInAt: z.string().datetime().optional(),
});
export type Signup = z.infer<typeof signupSchema>;

export const shiftSchema = z
  .object({
    id: z.string(),
    type: shiftTypeSchema,
    title: z.string().min(2),
    startsAt: z.string().datetime(),
    endsAt: z.string().datetime(),
    location: z.string().min(2),
    capacity: z.number().int().min(1).max(50),
    notes: z.string().optional(),
    /** Transport: which cat goes to which clinic. */
    catSlug: z.string().optional(),
    clinic: z.string().optional(),
    /** Events: group several slots under one event name. */
    eventName: z.string().optional(),
    /** Set when created from a weekly rule, so the series can be changed together. */
    seriesId: z.string().optional(),
    signups: z.array(signupSchema).default([]),
  })
  .refine((s) => s.endsAt > s.startsAt, { message: "O fim tem de ser depois do início", path: ["endsAt"] });
export type Shift = z.infer<typeof shiftSchema>;

export const shiftInputSchema = z
  .object({
    type: shiftTypeSchema,
    title: z.string().min(2, "Dê um nome à tarefa"),
    startsAt: z.string().datetime(),
    endsAt: z.string().datetime(),
    location: z.string().min(2, "Indique o local"),
    capacity: z.number().int().min(1).max(50),
    notes: z.string().optional(),
    catSlug: z.string().optional(),
    clinic: z.string().optional(),
    eventName: z.string().optional(),
  })
  .refine((s) => s.endsAt > s.startsAt, { message: "O fim tem de ser depois do início", path: ["endsAt"] });
export type ShiftInput = z.infer<typeof shiftInputSchema>;

export const weeklyRuleSchema = z.object({
  type: shiftTypeSchema,
  title: z.string().min(2),
  location: z.string().min(2),
  capacity: z.number().int().min(1).max(50),
  notes: z.string().optional(),
  /** 0 = Sunday ... 6 = Saturday. */
  weekdays: z.array(z.number().int().min(0).max(6)).min(1),
  /** Local time in Lisbon, "HH:MM". */
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  /** Dates "YYYY-MM-DD", inclusive. At most 26 weeks per series. */
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  until: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});
export type WeeklyRule = z.infer<typeof weeklyRuleSchema>;

export const volunteerSignupInputSchema = z.object({
  name: z.string({ required_error: "Indique o seu nome" }).min(2, "Indique o seu nome"),
  phone: z.string({ required_error: "Indique um telefone com pelo menos 9 números" }).min(9, "Indique um telefone com pelo menos 9 números"),
  consent: z.literal(true, { errorMap: () => ({ message: "Precisa de aceitar para o contactarmos" }) }),
});
export type VolunteerSignupInput = z.infer<typeof volunteerSignupInputSchema>;

export const fosterPlacementSchema = z.object({
  id: z.string(),
  catSlug: z.string(),
  status: z.enum(["procura-familia", "ativa", "terminada"]),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  expectedEndDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  familyName: z.string().optional(),
  familyPhone: z.string().optional(),
  notes: z.string().optional(),
});
export type FosterPlacement = z.infer<typeof fosterPlacementSchema>;

/** "Quero ser família temporária" form on the site. The team calls back, visits if needed, then places a cat. */
export const fosterApplicationSchema = z.object({
  name: z.string({ required_error: "Indique o seu nome" }).min(2, "Indique o seu nome"),
  phone: z.string({ required_error: "Indique um telefone com pelo menos 9 números" }).min(9, "Indique um telefone com pelo menos 9 números"),
  email: z.string().email("Indique um email válido").optional().or(z.literal("")),
  town: z.string({ required_error: "Indique onde vive" }).min(2, "Indique onde vive"),
  canHost: z.enum(["bebes", "recuperar", "qualquer"]).default("qualquer"),
  howLong: z.enum(["semanas", "meses", "necessario"]).default("necessario"),
  otherAnimals: z.string().max(300).optional(),
  message: z.string().max(1000).optional(),
  consent: z.literal(true, { errorMap: () => ({ message: "Precisa de aceitar para o contactarmos" }) }),
});
export type FosterApplication = z.infer<typeof fosterApplicationSchema>;

export const fosterApplicationStatus = ["nova", "contactada", "aprovada", "arquivada"] as const;
export type FosterApplicationStatus = (typeof fosterApplicationStatus)[number];
export type StoredFosterApplication = FosterApplication & { id: string; receivedAt: string; status: FosterApplicationStatus };
export const fosterApplicationStatusLabel: Record<FosterApplicationStatus, string> = { nova: "Nova", contactada: "Contactada", aprovada: "Aprovada", arquivada: "Arquivada" };

export const fosterCanHostLabel: Record<FosterApplication["canHost"], string> = {
  bebes: "Gatinhos bebés",
  recuperar: "Um gato a recuperar",
  qualquer: "O que for preciso",
};
export const fosterHowLongLabel: Record<FosterApplication["howLong"], string> = {
  semanas: "Algumas semanas",
  meses: "Um ou dois meses",
  necessario: "O tempo que for preciso",
};

/** How a godparent pays: a monthly automatic debit they set up themselves, or arranged with the team (transfer, MB WAY). */
export const sponsorPaymentSchema = z.enum(["debito", "combinar"]);
export type SponsorPayment = z.infer<typeof sponsorPaymentSchema>;

export const debitStatusSchema = z.enum(["a-configurar", "ativo", "falhou", "cancelado"]);
export type DebitStatus = z.infer<typeof debitStatusSchema>;
export const debitStatusLabel: Record<DebitStatus, string> = {
  "a-configurar": "Débito por ativar",
  ativo: "Débito ativo",
  falhou: "Último débito falhou",
  cancelado: "Débito cancelado",
};

/** The monthly automatic debit, as the payment provider reports it. The IBAN never reaches us: it stays with the provider. */
export const sponsorDebitSchema = z.object({
  provider: z.string(),
  status: debitStatusSchema,
  customerId: z.string().optional(),
  subscriptionId: z.string().optional(),
  startedAt: z.string().datetime().optional(),
  lastPaymentAt: z.string().datetime().optional(),
  lastFailureAt: z.string().datetime().optional(),
  cancelledAt: z.string().datetime().optional(),
  /** Everything collected so far, in cents. */
  paidCents: z.number().int().nonnegative().default(0),
});
export type SponsorDebit = z.infer<typeof sponsorDebitSchema>;

/** What a godparent gets by email; everything is always in their area on the site. */
export const sponsorEmailUpdatesSchema = z.enum(["todas", "cartas", "nenhuma"]);
export type SponsorEmailUpdates = z.infer<typeof sponsorEmailUpdatesSchema>;
export const sponsorEmailUpdatesLabel: Record<SponsorEmailUpdates, string> = {
  todas: "Tudo o que acontece",
  cartas: "Só as cartas da equipa",
  nenhuma: "Nada por email (vejo no site)",
};

export const sponsorshipSchema = z.object({
  id: z.string(),
  catSlug: z.string(),
  sponsorName: z.string().min(2),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  monthlyAmount: z.number().positive(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  active: z.boolean().default(true),
  /** Date of the last news sent to the godparent, to remind the team monthly. */
  lastUpdateSentAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  /** Asked on the site and not yet confirmed by the team (inactive until then). */
  pending: z.boolean().optional(),
  message: z.string().max(1000).optional(),
  payment: sponsorPaymentSchema.optional(),
  debit: sponsorDebitSchema.optional(),
  emailUpdates: sponsorEmailUpdatesSchema.optional(),
});
export type Sponsorship = z.infer<typeof sponsorshipSchema>;

/** Smallest monthly amount we ask of a godparent. */
export const MIN_SPONSOR_AMOUNT = 5;

/** "Quero apadrinhar" form on the site. The team calls or writes back, then confirms it in the back office. */
export const sponsorshipRequestSchema = z.object({
  catSlug: z.string().min(1),
  name: z.string({ required_error: "Indique o seu nome" }).min(2, "Indique o seu nome"),
  email: z.string({ required_error: "Indique um email para receber notícias" }).email("Indique um email válido"),
  phone: z.string().min(9, "Indique um telefone com pelo menos 9 números").optional().or(z.literal("")),
  monthlyAmount: z.coerce
    .number({ invalid_type_error: "Indique um valor em euros" })
    .min(MIN_SPONSOR_AMOUNT, `O valor mínimo é ${MIN_SPONSOR_AMOUNT} euros por mês`)
    .max(1000, "Para valores acima de 1000 euros fale connosco"),
  payment: sponsorPaymentSchema.default("debito"),
  /** Separate, unticked by default: news about the cat by email. Their area on the site always has it. */
  newsByEmail: z.boolean().default(false),
  message: z.string().max(1000).optional(),
  consent: z.literal(true, { errorMap: () => ({ message: "Precisa de aceitar para o contactarmos" }) }),
});
export type SponsorshipRequest = z.infer<typeof sponsorshipRequestSchema>;

/** Turns a site request into an inactive sponsorship the team confirms later. */
export function sponsorshipFromRequest(r: SponsorshipRequest, id: string, today: string): Sponsorship {
  return {
    id,
    catSlug: r.catSlug,
    sponsorName: r.name,
    email: r.email,
    ...(r.phone ? { phone: r.phone } : {}),
    monthlyAmount: r.monthlyAmount,
    startDate: today,
    active: false,
    pending: true,
    payment: r.payment,
    emailUpdates: r.newsByEmail ? "todas" : "nenhuma",
    ...(r.message ? { message: r.message } : {}),
  };
}

// ---------- rules ----------

export const freeSpots = (shift: Pick<Shift, "capacity" | "signups">) => Math.max(0, shift.capacity - shift.signups.length);

export type SignUpError = "lotado" | "ja-inscrito" | "ja-passou";
export const signUpErrorMessage: Record<SignUpError, string> = {
  lotado: "Este turno já está completo. Escolha outro, por favor.",
  "ja-inscrito": "Já está inscrito neste turno.",
  "ja-passou": "Este turno já terminou.",
};

export function signUp(shift: Shift, volunteer: { volunteerId: string; name: string; phone: string }, now: Date): { ok: true; shift: Shift } | { ok: false; error: SignUpError } {
  if (new Date(shift.endsAt) <= now) return { ok: false, error: "ja-passou" };
  if (shift.signups.some((s) => s.volunteerId === volunteer.volunteerId)) return { ok: false, error: "ja-inscrito" };
  if (freeSpots(shift) === 0) return { ok: false, error: "lotado" };
  return { ok: true, shift: { ...shift, signups: [...shift.signups, { ...volunteer, signedUpAt: now.toISOString() }] } };
}

export function cancelSignUp(shift: Shift, volunteerId: string): Shift {
  return { ...shift, signups: shift.signups.filter((s) => s.volunteerId !== volunteerId) };
}

export function checkIn(shift: Shift, volunteerId: string, now: Date): Shift {
  return { ...shift, signups: shift.signups.map((s) => (s.volunteerId === volunteerId && !s.checkedInAt ? { ...s, checkedInAt: now.toISOString() } : s)) };
}

/** Hours a volunteer actually did (checked in), for certificates and future Patinhas. */
export function volunteerHours(shifts: Shift[], volunteerId: string): number {
  const ms = shifts
    .filter((s) => s.signups.some((x) => x.volunteerId === volunteerId && x.checkedInAt))
    .reduce((sum, s) => sum + (new Date(s.endsAt).getTime() - new Date(s.startsAt).getTime()), 0);
  return Math.round((ms / 3_600_000) * 10) / 10;
}

/** Lisbon local date + time to a UTC ISO string, handling summer time. */
export function lisbonToUtc(date: string, time: string): string {
  const [y, mo, d] = date.split("-").map(Number) as [number, number, number];
  const [h, mi] = time.split(":").map(Number) as [number, number];
  const guess = Date.UTC(y, mo - 1, d, h, mi);
  const fmt = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Lisbon", hour: "2-digit", minute: "2-digit", hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit" });
  const parts = Object.fromEntries(fmt.formatToParts(new Date(guess)).map((p) => [p.type, p.value]));
  const asLisbon = Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), Number(parts.hour), Number(parts.minute));
  return new Date(guess - (asLisbon - guess)).toISOString();
}

const MAX_SERIES_DAYS = 26 * 7;

/** Turns a weekly rule ("every Saturday 10h-12h") into individual shifts. */
export function expandWeeklyRule(rule: WeeklyRule, seriesId: string, newId: () => string): Shift[] {
  const start = new Date(`${rule.from}T00:00:00Z`);
  const end = new Date(`${rule.until}T00:00:00Z`);
  const days = Math.round((end.getTime() - start.getTime()) / 86_400_000);
  if (days < 0) throw new Error("A data final tem de ser depois da inicial.");
  if (days > MAX_SERIES_DAYS) throw new Error("Uma série pode ter no máximo 26 semanas.");
  const shifts: Shift[] = [];
  for (let i = 0; i <= days; i++) {
    const day = new Date(start.getTime() + i * 86_400_000);
    if (!rule.weekdays.includes(day.getUTCDay())) continue;
    const date = day.toISOString().slice(0, 10);
    shifts.push({
      id: newId(),
      type: rule.type,
      title: rule.title,
      location: rule.location,
      capacity: rule.capacity,
      notes: rule.notes,
      startsAt: lisbonToUtc(date, rule.startTime),
      endsAt: lisbonToUtc(date, rule.endTime),
      seriesId,
      signups: [],
    });
  }
  return shifts;
}

export type OpenNeed =
  | { kind: "turno"; shift: Shift; free: number }
  | { kind: "familia-temporaria"; placement: FosterPlacement };

/** "Vagas por preencher": upcoming shifts with free spots and cats waiting for a foster home, soonest first. */
export function openNeeds(shifts: Shift[], placements: FosterPlacement[], now: Date, withinDays = 14): OpenNeed[] {
  const horizon = now.getTime() + withinDays * 86_400_000;
  const turnos: OpenNeed[] = shifts
    .filter((s) => new Date(s.startsAt).getTime() > now.getTime() && new Date(s.startsAt).getTime() <= horizon && freeSpots(s) > 0)
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
    .map((shift) => ({ kind: "turno", shift, free: freeSpots(shift) }));
  const fat: OpenNeed[] = placements.filter((p) => p.status === "procura-familia").map((placement) => ({ kind: "familia-temporaria", placement }));
  return [...fat, ...turnos];
}

/** Godparents who have not had news about their cat for over a month. */
export function sponsorsDueUpdate(sponsorships: Sponsorship[], today: string): Sponsorship[] {
  const monthAgo = new Date(new Date(`${today}T00:00:00Z`).getTime() - 30 * 86_400_000).toISOString().slice(0, 10);
  return sponsorships.filter((s) => s.active && (s.lastUpdateSentAt ?? s.startDate) <= monthAgo);
}
