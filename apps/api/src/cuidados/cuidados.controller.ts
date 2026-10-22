import { Body, ConflictException, Controller, Delete, Get, HttpCode, Inject, NotFoundException, Param, Patch, Post, Put, Query, UseGuards } from "@nestjs/common";
import {
  appointmentAlert,
  appointmentInputSchema,
  appointmentStatusSchema,
  authorSchema,
  catLocationSchema,
  isMedicationActive,
  lisbonNow,
  locationChangeAlert,
  medicationAlert,
  medicationInputSchema,
  medicationRound,
  noteAlert,
  transportWindow,
  visitNoteInputSchema,
  type Appointment,
  type Author,
  type Cat,
  type CareAlertDraft,
  type Medication,
  type Shift,
  type VisitNote,
} from "@gn/domain";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { AdminGuard } from "../common/admin.guard";
import { CareService, catSummary } from "./care.service";
import { API_OPTIONS, type ApiOptions } from "../common/options";
import { parseBody } from "../common/validation";

const withAuthor = z.object({ by: authorSchema.optional().refine((x): x is Author => !!x, "Indique o seu nome") });
const dateParam = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const timeParam = z.string().regex(/^\d{2}:\d{2}$/);


/**
 * Team-only care: where each cat lives, medication, vet appointments and notes.
 * Every change writes an alert ("Novidades") that the whole team sees.
 */
@Controller("cuidados")
@UseGuards(AdminGuard)
export class CuidadosController {
  constructor(@Inject(API_OPTIONS) private readonly options: ApiOptions, @Inject(CareService) private readonly care: CareService) {}
  private get repo() { return this.options.repository; }
  private now() { return this.options.now?.() ?? new Date(); }

  private cat(catId: string) { return this.care.cat(catId); }
  private raise(cat: Cat, draft: CareAlertDraft, by: Author) { return this.care.raise(cat, draft, by); }

  // ----- overview -----

  /** Every cat still with the association, where it is, and what it needs. */
  @Get("gatil")
  async shelter() {
    const today = lisbonNow(this.now()).date;
    const [cats, care, meds, appointments] = await Promise.all([this.repo.listCats(), this.repo.listCatCare(), this.repo.listMedications(), this.repo.listAppointments()]);
    const careById = new Map(care.map((c) => [c.catId, c]));
    const nowIso = this.now().toISOString();
    return cats
      .filter((c) => c.status !== "adotado")
      .sort((a, b) => a.name.localeCompare(b.name, "pt"))
      .map((c) => ({
        cat: catSummary(c),
        care: careById.get(c.id) ?? null,
        activeMedications: meds.filter((m) => m.catId === c.id && isMedicationActive(m, today)).map((m) => m.name),
        nextAppointment: appointments.find((a) => a.catId === c.id && a.status === "marcada" && a.startsAt >= nowIso) ?? null,
      }));
  }

  /** Everything about one cat, for its care page. */
  @Get("gatos/:catId")
  async catFile(@Param("catId") catId: string) {
    const cat = await this.cat(catId);
    const [care, medications, appointments, notes, alerts] = await Promise.all([
      this.repo.getCatCare(catId),
      this.repo.listMedications(catId),
      this.repo.listAppointments(catId),
      this.repo.listVisitNotes(catId),
      this.repo.listCareAlerts({ catId, limit: 20 }),
    ]);
    return { cat: catSummary(cat), care: care ?? null, medications, appointments, notes, alerts };
  }

  @Put("gatos/:catId/localizacao")
  async move(@Param("catId") catId: string, @Body() body: unknown) {
    const cat = await this.cat(catId);
    const { by, location } = parseBody(withAuthor.extend({ location: catLocationSchema }), body);
    const current = await this.repo.getCatCare(catId);
    const draft = locationChangeAlert(cat.name, current?.location, location);
    const care = await this.repo.saveCatCare({
      catId,
      location,
      // Editing only the reason keeps the date the cat moved there.
      since: draft || !current ? this.now().toISOString() : current.since,
      updatedBy: by,
    });
    if (draft) await this.raise(cat, draft, by);
    return care;
  }

  // ----- medication -----

  @Post("medicacao")
  @HttpCode(201)
  async addMedication(@Body() body: unknown) {
    const { by, ...input } = parseBody(withAuthor.and(medicationInputSchema), body);
    const cat = await this.cat(input.catId);
    const med: Medication = { ...input, id: randomUUID(), createdBy: by, updatedAt: this.now().toISOString() };
    await this.repo.saveMedication(med);
    await this.raise(cat, medicationAlert(cat.name, med, "nova"), by);
    return med;
  }

  @Patch("medicacao/:id")
  async updateMedication(@Param("id") id: string, @Body() body: unknown) {
    const current = await this.repo.getMedication(id);
    if (!current) throw new NotFoundException("Medicação não encontrada.");
    const { by, ...changes } = parseBody(withAuthor.passthrough(), body);
    const merged = parseBody(medicationInputSchema, { ...current, ...changes, catId: current.catId });
    const next: Medication = { ...current, ...merged, updatedAt: this.now().toISOString() };
    await this.repo.saveMedication(next);
    const cat = await this.cat(current.catId);
    await this.raise(cat, medicationAlert(cat.name, next, "alterada"), by);
    return next;
  }

  /** Stops a treatment today, keeping its history. */
  @Post("medicacao/:id/terminar")
  async stopMedication(@Param("id") id: string, @Body() body: unknown) {
    const current = await this.repo.getMedication(id);
    if (!current) throw new NotFoundException("Medicação não encontrada.");
    const { by } = parseBody(withAuthor, body);
    const now = this.now().toISOString();
    const next: Medication = { ...current, stoppedAt: now, updatedAt: now };
    await this.repo.saveMedication(next);
    const cat = await this.cat(current.catId);
    await this.raise(cat, medicationAlert(cat.name, next, "terminada"), by);
    return next;
  }

  /** "Ronda de medicação": every dose due on a day, which cat, where it is, and who already gave it. */
  @Get("ronda")
  async round(@Query("dia") day?: string) {
    const date = day ? parseBody(dateParam, day) : lisbonNow(this.now()).date;
    return { date, items: await this.care.round(date) };
  }

  @Post("medicacao/:id/tomas")
  @HttpCode(201)
  async giveDose(@Param("id") id: string, @Body() body: unknown) {
    const med = await this.care.medication(id);
    const { by, date, time } = parseBody(withAuthor.extend({ date: dateParam, time: timeParam }), body);
    return this.care.giveDose(med, date, time, by);
  }

  // ----- help requests -----

  /** Open and recently closed help requests, for the managers to follow. */
  @Get("tarefas")
  async tasks() {
    const since = new Date(this.now().getTime() - 7 * 86_400_000).toISOString();
    return (await this.repo.listCareTasks()).filter((t) => t.status === "aberta" || t.status === "aceite" || (t.closedAt ?? "") >= since);
  }

  @Post("medicacao/:id/nao-consigo")
  @HttpCode(201)
  async cantGive(@Param("id") id: string, @Body() body: unknown) {
    const { by, ...input } = parseBody(withAuthor.extend({ date: dateParam, time: timeParam, comment: z.string().trim().min(3, "Diga porque não conseguiu") }), body);
    return this.care.requestHelp(await this.care.medication(id), input, by);
  }

  @Post("tarefas/:id/aceitar")
  async acceptTask(@Param("id") id: string, @Body() body: unknown) {
    return this.care.acceptTask(id, parseBody(withAuthor, body).by);
  }

  @Post("tarefas/:id/cancelar")
  async cancelTask(@Param("id") id: string, @Body() body: unknown) {
    const t = await this.care.task(id);
    if (t.status === "feita" || t.status === "cancelada") throw new ConflictException("Este pedido já está resolvido.");
    return this.care.closeTask(t, "cancelada", parseBody(withAuthor, body).by);
  }

  /** Undo a dose marked by mistake. */
  @Delete("tomas/:id")
  @HttpCode(204)
  async undoDose(@Param("id") id: string) {
    await this.repo.deleteDose(id);
  }

  // ----- vet appointments -----

  /** Upcoming appointments, with the cat and whether someone is taking it. */
  @Get("consultas")
  async appointments() {
    const nowIso = this.now().toISOString();
    const [list, cats] = await Promise.all([this.repo.listAppointments(), this.repo.listCats()]);
    const catById = new Map(cats.map((c) => [c.id, c]));
    const upcoming = list.filter((a) => a.status === "marcada" && a.startsAt >= nowIso && catById.has(a.catId));
    return Promise.all(upcoming.map(async (a) => ({ ...a, cat: catSummary(catById.get(a.catId)!), transport: await this.transportStatus(a) })));
  }

  private async transportStatus(a: Appointment) {
    if (!a.transportShiftId) return null;
    const shift = await this.repo.getShift(a.transportShiftId);
    return shift ? { shiftId: shift.id, volunteers: shift.signups.map((s) => s.name), free: Math.max(0, shift.capacity - shift.signups.length) } : null;
  }

  private transportShift(cat: Cat, a: Pick<Appointment, "startsAt" | "clinic" | "reason" | "notes">, id: string, signups: Shift["signups"] = []): Shift {
    return {
      id,
      type: "transporte-vet",
      title: `Levar ${cat.name} à consulta`,
      ...transportWindow(a.startsAt),
      location: `Gatil → ${a.clinic}`,
      capacity: 1,
      catSlug: cat.slug,
      clinic: a.clinic,
      notes: [a.reason, a.notes].filter(Boolean).join(". "),
      signups,
    };
  }

  @Post("consultas")
  @HttpCode(201)
  async addAppointment(@Body() body: unknown) {
    const { by, needsTransport, ...input } = parseBody(withAuthor.and(appointmentInputSchema), body);
    const cat = await this.cat(input.catId);
    const appointment: Appointment = { ...input, id: randomUUID(), status: "marcada", createdBy: by, updatedAt: this.now().toISOString() };
    if (needsTransport) {
      const shift = this.transportShift(cat, appointment, randomUUID());
      await this.repo.saveShifts([shift]);
      appointment.transportShiftId = shift.id;
    }
    await this.repo.saveAppointment(appointment);
    await this.raise(cat, appointmentAlert(cat.name, appointment, "marcada"), by);
    return appointment;
  }

  @Patch("consultas/:id")
  async updateAppointment(@Param("id") id: string, @Body() body: unknown) {
    const current = await this.repo.getAppointment(id);
    if (!current) throw new NotFoundException("Consulta não encontrada.");
    const input = parseBody(
      withAuthor.extend({
        startsAt: z.string().datetime().optional(),
        clinic: z.string().trim().min(2).optional(),
        reason: z.string().trim().min(2).optional(),
        notes: z.string().trim().max(500).optional(),
        status: appointmentStatusSchema.optional(),
        outcome: z.string().trim().max(2000).optional(),
      }),
      body,
    );
    const { by, ...changes } = input;
    const cat = await this.cat(current.catId);
    const next: Appointment = { ...current, ...changes, updatedAt: this.now().toISOString() };
    const change = next.status === "cancelada" ? "cancelada" : next.status === "feita" ? "feita" : "alterada";
    const draft = appointmentAlert(cat.name, next, change);

    const shift = current.transportShiftId ? await this.repo.getShift(current.transportShiftId) : undefined;
    if (shift && change === "cancelada") {
      await this.repo.deleteShift(shift.id);
      next.transportShiftId = undefined;
      if (shift.signups.length) draft.message += ` Avisar ${shift.signups.map((s) => s.name).join(" e ")} de que o transporte já não é preciso.`;
    } else if (shift && change === "alterada") {
      await this.repo.saveShifts([this.transportShift(cat, next, shift.id, shift.signups)]);
    }

    await this.repo.saveAppointment(next);
    await this.raise(cat, draft, by);
    // The vet's words are also kept with the visit notes, so the history reads in one place.
    if (change === "feita" && changes.outcome && current.status !== "feita") {
      const note: VisitNote = { id: randomUUID(), catId: cat.id, text: `Consulta (${next.reason}): ${changes.outcome}`, appointmentId: id, important: false, by, createdAt: this.now().toISOString() };
      await this.repo.saveVisitNote(note);
    }
    return next;
  }

  // ----- notes after each visit -----

  @Post("notas")
  @HttpCode(201)
  async addNote(@Body() body: unknown) {
    const { by, ...input } = parseBody(withAuthor.and(visitNoteInputSchema), body);
    const cat = await this.cat(input.catId);
    const note: VisitNote = { ...input, id: randomUUID(), by, createdAt: this.now().toISOString() };
    await this.repo.saveVisitNote(note);
    await this.raise(cat, noteAlert(cat.name, note), by);
    return note;
  }

  // ----- alerts -----

  @Get("novidades")
  async alerts(@Query("desde") since?: string, @Query("limite") limit?: string) {
    return this.repo.listCareAlerts({ since: since ? parseBody(z.string().datetime(), since) : undefined, limit: limit ? Math.min(200, Number(limit) || 50) : 50 });
  }
}
