import { Body, ConflictException, Controller, ForbiddenException, Get, Headers, HttpCode, Inject, Param, Post, Put } from "@nestjs/common";
import {
  buildVolunteerCare,
  canHandleDose,
  cantGiveInputSchema,
  careNotificationPrefsSchema,
  defaultCarePrefs,
  lisbonNow,
  noteAlert,
  visitNoteInputSchema,
  volunteerDuty,
  type Author,
  type VolunteerCare,
} from "@gn/domain";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { parseBody } from "../common/validation";
import { PatinhasService } from "../patinhas/service";
import { CareService } from "./care.service";

const doseSchema = z.object({ medicationId: z.string(), date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), time: z.string().regex(/^\d{2}:\d{2}$/) });

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
    const med = await this.care.medication(medicationId);
    const location = (await this.repo.getCatCare(med.catId))?.location;
    const check = canHandleDose(
      { isToday: ctx.duty.isToday, accountId: ctx.account.id, today: ctx.today },
      { medicationId, date, time },
      { catInShelter: !!location && location.area !== "fora", tasks: await this.repo.listCareTasks({ status: ["aceite"] }) },
    );
    if (!check.ok) {
      if (check.reason === "dia") throw new ConflictException("Só pode registar doses de hoje.");
      throw new ForbiddenException("Esta dose não faz parte do seu turno.");
    }
    return med;
  }

  @Get()
  async overview(@Headers("authorization") auth?: string): Promise<VolunteerCare> {
    const account = await this.patinhas.accountFromHeader(auth);
    const now = this.care.now();
    const since = new Date(now.getTime() - 180 * 86_400_000).toISOString();
    const [shifts, cats, care, medications, doses, tasks, appointments, notes, alerts, prefs] = await Promise.all([
      this.repo.listShifts({ from: since }), this.repo.listCats(), this.repo.listCatCare(), this.repo.listMedications(),
      this.repo.listDoses({ from: lisbonNow(new Date(now.getTime() - 86_400_000)).date, to: lisbonNow(new Date(now.getTime() + 15 * 86_400_000)).date }), this.repo.listCareTasks(),
      this.repo.listAppointments(), this.repo.listVisitNotes(), this.repo.listCareAlerts({ since: new Date(now.getTime() - 14 * 86_400_000).toISOString(), limit: 200 }),
      this.repo.getCarePrefs(account.id),
    ]);
    return buildVolunteerCare({ account, now, shifts, cats, care, medications, doses, tasks, appointments, notes, alerts, prefs: prefs ?? undefined });
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

