import { Body, ConflictException, Controller, ForbiddenException, Get, Headers, HttpCode, Inject, Param, Post, Put } from "@nestjs/common";
import {
  cantGiveInputSchema,
  careNotificationPrefsSchema,
  defaultCarePrefs,
  groupAlertsByCat,
  isMedicationActive,
  isMuted,
  noteAlert,
  relevantAlerts,
  splitRoundForShift,
  unreadForVolunteer,
  visitNoteInputSchema,
  volunteerDuty,
  type Author,
  type Cat,
  type Shift,
} from "@gn/domain";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { parseBody } from "../common/validation";
import { PatinhasService } from "../patinhas/service";
import { CareService, catSummary } from "./care.service";

const doseSchema = z.object({ medicationId: z.string(), date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), time: z.string().regex(/^\d{2}:\d{2}$/) });
const NOTIFICATION_DAYS = 14;

/**
 * The volunteer's own care page on the site. Volunteers never see the back office: they see the cats of
 * their gatil shift, the cat they are taking to the vet, and help requests, and can only act on those.
 */
@Controller("conta/eu/cuidados")
export class VoluntarioCuidadosController {
  constructor(@Inject(PatinhasService) private readonly patinhas: PatinhasService, @Inject(CareService) private readonly care: CareService) {}
  private get repo() { return this.care.repo; }

  private async context(auth: string | undefined) {
    const account = await this.patinhas.accountFromHeader(auth);
    const now = this.care.now();
    const shifts = await this.repo.listShifts({ from: new Date(now.getTime() - 180 * 86_400_000).toISOString() });
    const duty = volunteerDuty(shifts, account.phone, now);
    const by: Author = { name: account.name, accountId: account.id };
    return { account, duty, by, today: this.care.today() };
  }

  private requireVolunteer(duty: { isVolunteer: boolean }) {
    if (!duty.isVolunteer) throw new ForbiddenException("Esta parte é para quem está inscrito nos turnos do gatil.");
  }

  /** May this person mark or hand over this dose? Today, on their gatil shift, or a request they took. */
  private async canHandleDose(ctx: Awaited<ReturnType<VoluntarioCuidadosController["context"]>>, medicationId: string, date: string, time: string) {
    if (date !== ctx.today) throw new ConflictException("Só pode registar doses de hoje.");
    const med = await this.care.medication(medicationId);
    const tasks = await this.repo.listCareTasks({ status: ["aceite"] });
    const taken = tasks.some((t) => t.medicationId === medicationId && t.date === date && t.time === time && t.acceptedBy?.accountId === ctx.account.id);
    const location = (await this.repo.getCatCare(med.catId))?.location;
    const onShift = ctx.duty.isToday && location?.area !== "fora";
    if (!onShift && !taken) throw new ForbiddenException("Esta dose não faz parte do seu turno.");
    return med;
  }

  @Get()
  async overview(@Headers("authorization") auth?: string) {
    const ctx = await this.context(auth);
    const { account, duty } = ctx;
    const prefs = (await this.repo.getCarePrefs(account.id)) ?? defaultCarePrefs;
    const base = { volunteer: duty.isVolunteer, phoneMissing: !account.phone, prefs };
    if (!duty.isVolunteer) return { ...base, shift: null, isToday: false, during: [], rest: [], cats: [], transports: [], tasks: { open: [], mine: [] }, notifications: [], unread: 0 };

    const [cats, care, meds, appointments, tasks] = await Promise.all([
      this.repo.listCats(), this.repo.listCatCare(), this.repo.listMedications(), this.repo.listAppointments(), this.repo.listCareTasks({ status: ["aberta", "aceite"] }),
    ]);
    const careById = new Map(care.map((c) => [c.catId, c]));

    // The shift: that day's doses, split into "during your shift" and the rest of the day.
    const shiftDate = duty.shift ? new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Lisbon" }).format(new Date(duty.shift.startsAt)) : ctx.today;
    const round = duty.shift ? (await this.care.round(shiftDate)).filter((r) => r.location?.area !== "fora") : [];
    const { during, rest } = duty.shift ? splitRoundForShift(round, duty.shift) : { during: [], rest: [] };

    // "Como tratar de cada gato": the cats that need something, what they need now first.
    const weekAgo = new Date(this.care.now().getTime() - 7 * 86_400_000).toISOString();
    const notes = await this.repo.listVisitNotes();
    const guide = (cat: Cat) => {
      const where = careById.get(cat.id)?.location ?? null;
      const medsToday = meds.filter((m) => m.catId === cat.id && isMedicationActive(m, shiftDate));
      const catNotes = notes.filter((n) => n.catId === cat.id);
      return {
        cat: catSummary(cat),
        location: where,
        specialNeeds: cat.specialNeeds,
        medications: medsToday.map(({ id, name, dose, times, withFood, instructions }) => ({ id, name, dose, times, withFood, instructions })),
        importantNotes: catNotes.filter((n) => n.important && n.createdAt >= weekAgo).slice(0, 3),
        latestNotes: catNotes.slice(0, 3),
        nextAppointment: appointments.find((a) => a.catId === cat.id && a.status === "marcada" && a.startsAt >= this.care.now().toISOString()) ?? null,
      };
    };
    const needsCare = (c: Cat) => {
      const where = careById.get(c.id)?.location;
      if (!where || where.area === "fora") return false;
      return where.spot === "jaula" || !!c.specialNeeds || meds.some((m) => m.catId === c.id && isMedicationActive(m, shiftDate)) || notes.some((n) => n.catId === c.id && n.important && n.createdAt >= weekAgo);
    };
    const shiftCats = duty.shift ? cats.filter((c) => c.status !== "adotado" && needsCare(c)).sort((a, b) => a.name.localeCompare(b.name, "pt")) : [];

    const transports = duty.transports.map((shift: Shift) => {
      const appointment = appointments.find((a) => a.transportShiftId === shift.id) ?? null;
      const cat = cats.find((c) => c.id === appointment?.catId || c.slug === shift.catSlug);
      return { shift: { id: shift.id, title: shift.title, startsAt: shift.startsAt, endsAt: shift.endsAt, location: shift.location, notes: shift.notes, clinic: shift.clinic }, appointment, guide: cat ? guide(cat) : null };
    });

    const mine = tasks.filter((t) => t.acceptedBy?.accountId === account.id || (t.status === "aberta" && t.createdBy.accountId === account.id));
    const open = tasks.filter((t) => t.status === "aberta" && t.createdBy.accountId !== account.id);

    const catIds = new Set([...shiftCats.map((c) => c.id), ...transports.flatMap((t) => (t.guide ? [t.guide.cat.id] : [])), ...mine.map((t) => t.catId)]);
    const since = new Date(this.care.now().getTime() - NOTIFICATION_DAYS * 86_400_000).toISOString();
    const allTasks = await this.repo.listCareTasks();
    const relevant = relevantAlerts(await this.repo.listCareAlerts({ since, limit: 200 }), { catIds, tasks: allTasks, since });
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
      notifications: groupAlertsByCat(relevant.map((a) => ({ ...a, unread: unreadIds.has(a.id), muted: isMuted(a, prefs) }))),
      unread: unread.length,
    };
  }

  /** Just the bell count, for the header on every page. */
  @Get("resumo")
  async summary(@Headers("authorization") auth?: string) {
    const o = await this.overview(auth);
    return { volunteer: o.volunteer, unread: o.unread, openTasks: o.tasks.open.length };
  }

  @Post("tomas")
  @HttpCode(201)
  async give(@Headers("authorization") auth: string | undefined, @Body() body: unknown) {
    const ctx = await this.context(auth);
    this.requireVolunteer(ctx.duty);
    const { medicationId, date, time } = parseBody(doseSchema, body);
    const med = await this.canHandleDose(ctx, medicationId, date, time);
    return this.care.giveDose(med, date, time, ctx.by);
  }

  @Post("nao-consigo")
  @HttpCode(201)
  async cantGive(@Headers("authorization") auth: string | undefined, @Body() body: unknown) {
    const ctx = await this.context(auth);
    this.requireVolunteer(ctx.duty);
    const input = parseBody(cantGiveInputSchema, body);
    const med = await this.canHandleDose(ctx, input.medicationId, input.date, input.time);
    // Someone who took the request and cannot go after all hands it back instead of opening a new one.
    const mineTaken = (await this.repo.listCareTasks({ status: ["aceite"] })).find((t) => t.medicationId === med.id && t.date === input.date && t.time === input.time && t.acceptedBy?.accountId === ctx.account.id);
    if (mineTaken) return this.care.releaseTask(mineTaken.id, ctx.by);
    return this.care.requestHelp(med, input, ctx.by);
  }

  @Post("tarefas/:id/aceitar")
  async accept(@Headers("authorization") auth: string | undefined, @Param("id") id: string) {
    const ctx = await this.context(auth);
    this.requireVolunteer(ctx.duty);
    return this.care.acceptTask(id, ctx.by);
  }

  @Post("tarefas/:id/devolver")
  async release(@Headers("authorization") auth: string | undefined, @Param("id") id: string) {
    const ctx = await this.context(auth);
    const t = await this.care.task(id);
    if (t.acceptedBy?.accountId !== ctx.account.id) throw new ForbiddenException("Este pedido não está consigo.");
    return this.care.releaseTask(id, ctx.by);
  }

  /** A note about a cat of the shift or the transport. */
  @Post("notas")
  @HttpCode(201)
  async note(@Headers("authorization") auth: string | undefined, @Body() body: unknown) {
    const ctx = await this.context(auth);
    this.requireVolunteer(ctx.duty);
    const input = parseBody(visitNoteInputSchema, body);
    const cat = await this.care.cat(input.catId);
    const transporting = ctx.duty.transports.some((s) => s.catSlug === cat.slug);
    if (!ctx.duty.isToday && !transporting) throw new ForbiddenException("Pode deixar comentários no dia do seu turno.");
    const note = { ...input, id: randomUUID(), by: ctx.by, createdAt: this.care.now().toISOString() };
    await this.repo.saveVisitNote(note);
    await this.care.raise(cat, noteAlert(cat.name, note), ctx.by);
    return note;
  }

  @Post("vistas")
  @HttpCode(204)
  async seen(@Headers("authorization") auth?: string) {
    const { account } = await this.context(auth);
    const prefs = (await this.repo.getCarePrefs(account.id)) ?? defaultCarePrefs;
    await this.repo.saveCarePrefs(account.id, { ...prefs, lastSeenAt: this.care.now().toISOString() });
  }

  /** Silence notifications for oneself only: everything, some kinds, or some cats. */
  @Put("preferencias")
  async prefs(@Headers("authorization") auth: string | undefined, @Body() body: unknown) {
    const { account } = await this.context(auth);
    const current = (await this.repo.getCarePrefs(account.id)) ?? defaultCarePrefs;
    const next = parseBody(careNotificationPrefsSchema.omit({ lastSeenAt: true }), body);
    return this.repo.saveCarePrefs(account.id, { ...next, lastSeenAt: current.lastSeenAt });
  }
}

