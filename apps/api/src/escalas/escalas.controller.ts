import { BadRequestException, Body, ConflictException, Controller, Delete, Get, HttpCode, Inject, NotFoundException, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import {
  cancelSignUp,
  checkIn,
  expandWeeklyRule,
  fosterPlacementSchema,
  freeSpots,
  openNeeds,
  shiftInputSchema,
  signUp,
  signUpErrorMessage,
  sponsorsDueUpdate,
  sponsorshipSchema,
  volunteerSignupInputSchema,
  weeklyRuleSchema,
  type Shift,
} from "@gn/domain";
import { randomUUID } from "node:crypto";
import { AdminGuard } from "../common/admin.guard";
import { API_OPTIONS, type ApiOptions } from "../common/options";
import { parseBody } from "../common/validation";
import { volunteerIdFromPhone } from "../common/volunteer";
import { PatinhasService } from "../patinhas/service";

/** Public view of a shift: volunteers see how many places are left, never other people's details. */
const toPublic = ({ signups, ...shift }: Shift) => ({ ...shift, taken: signups.length, free: freeSpots({ capacity: shift.capacity, signups }) });


@Controller("escalas")
export class EscalasController {
  constructor(@Inject(API_OPTIONS) private readonly options: ApiOptions, @Inject(PatinhasService) private readonly patinhas: PatinhasService) {}
  private get repo() { return this.options.repository; }
  private now() { return this.options.now?.() ?? new Date(); }

  // ----- public -----

  /** Upcoming shifts with free places and cats waiting for a foster home. */
  @Get("vagas")
  async publicNeeds() {
    const now = this.now();
    const needs = openNeeds(await this.repo.listShifts({ from: now.toISOString() }), await this.repo.listFosterPlacements(), now, 30);
    return needs.map((n) =>
      n.kind === "turno"
        ? { kind: n.kind, shift: toPublic(n.shift) }
        : { kind: n.kind, catSlug: n.placement.catSlug, startDate: n.placement.startDate, notes: n.placement.notes },
    );
  }

  @Post("turnos/:id/inscricao")
  @HttpCode(201)
  async publicSignUp(@Param("id") id: string, @Body() body: unknown) {
    const input = parseBody(volunteerSignupInputSchema, body);
    const shift = await this.repo.getShift(id);
    if (!shift) throw new NotFoundException("Turno não encontrado.");
    const result = signUp(shift, { volunteerId: volunteerIdFromPhone(input.phone), name: input.name, phone: input.phone }, this.now());
    if (!result.ok) throw new ConflictException(signUpErrorMessage[result.error]);
    await this.repo.saveShifts([result.shift]);
    return toPublic(result.shift);
  }

  // ----- back office -----

  @Get("turnos")
  @UseGuards(AdminGuard)
  shifts(@Query("de") from?: string, @Query("ate") to?: string) {
    return this.repo.listShifts({ from, to });
  }

  @Post("turnos")
  @HttpCode(201)
  @UseGuards(AdminGuard)
  async createShift(@Body() body: unknown) {
    const shift: Shift = { ...parseBody(shiftInputSchema, body), id: randomUUID(), signups: [] };
    await this.repo.saveShifts([shift]);
    return shift;
  }

  /** "Todos os sábados das 10h às 12h": creates every shift in the series at once. */
  @Post("turnos/semanais")
  @HttpCode(201)
  @UseGuards(AdminGuard)
  async createWeekly(@Body() body: unknown) {
    const rule = parseBody(weeklyRuleSchema, body);
    let shifts: Shift[];
    try {
      shifts = expandWeeklyRule(rule, randomUUID(), randomUUID);
    } catch (err) {
      throw new BadRequestException((err as Error).message);
    }
    await this.repo.saveShifts(shifts);
    return { created: shifts.length, shifts };
  }

  @Patch("turnos/:id")
  @UseGuards(AdminGuard)
  async updateShift(@Param("id") id: string, @Body() body: unknown) {
    const current = await this.repo.getShift(id);
    if (!current) throw new NotFoundException("Turno não encontrado.");
    const merged = parseBody(shiftInputSchema, { ...current, ...(body as object) });
    if (merged.capacity < current.signups.length) {
      throw new ConflictException(`Já há ${current.signups.length} pessoas inscritas. Cancele inscrições antes de reduzir as vagas.`);
    }
    const next: Shift = { ...current, ...merged };
    await this.repo.saveShifts([next]);
    return next;
  }

  @Delete("turnos/:id")
  @HttpCode(204)
  @UseGuards(AdminGuard)
  async deleteShift(@Param("id") id: string) {
    await this.repo.deleteShift(id);
  }

  @Post("turnos/:id/inscricoes")
  @HttpCode(201)
  @UseGuards(AdminGuard)
  async addSignUp(@Param("id") id: string, @Body() body: unknown) {
    const input = parseBody(volunteerSignupInputSchema.omit({ consent: true }), body);
    const shift = await this.repo.getShift(id);
    if (!shift) throw new NotFoundException("Turno não encontrado.");
    const result = signUp(shift, { volunteerId: volunteerIdFromPhone(input.phone), ...input }, this.now());
    if (!result.ok) throw new ConflictException(signUpErrorMessage[result.error]);
    await this.repo.saveShifts([result.shift]);
    return result.shift;
  }

  @Delete("turnos/:id/inscricoes/:volunteerId")
  @UseGuards(AdminGuard)
  async removeSignUp(@Param("id") id: string, @Param("volunteerId") volunteerId: string) {
    const shift = await this.repo.getShift(id);
    if (!shift) throw new NotFoundException("Turno não encontrado.");
    const next = cancelSignUp(shift, volunteerId);
    await this.repo.saveShifts([next]);
    return next;
  }

  @Post("turnos/:id/inscricoes/:volunteerId/presenca")
  @UseGuards(AdminGuard)
  async markPresent(@Param("id") id: string, @Param("volunteerId") volunteerId: string) {
    const shift = await this.repo.getShift(id);
    if (!shift) throw new NotFoundException("Turno não encontrado.");
    const next = checkIn(shift, volunteerId, this.now());
    await this.repo.saveShifts([next]);
    // Being there is the verification: the volunteer's account gets the shift's Patinhas.
    await this.patinhas.awardShift(next, volunteerId);
    return next;
  }

  @Get("familias-temporarias")
  @UseGuards(AdminGuard)
  placements() {
    return this.repo.listFosterPlacements();
  }

  @Post("familias-temporarias")
  @HttpCode(201)
  @UseGuards(AdminGuard)
  async savePlacement(@Body() body: unknown) {
    const input = parseBody(fosterPlacementSchema.extend({ id: fosterPlacementSchema.shape.id.optional() }), body);
    return this.repo.saveFosterPlacement({ ...input, id: input.id ?? randomUUID() });
  }

  @Get("padrinhos")
  @UseGuards(AdminGuard)
  async sponsorships() {
    const all = await this.repo.listSponsorships();
    const due = new Set(sponsorsDueUpdate(all, this.now().toISOString().slice(0, 10)).map((s) => s.id));
    return all.map((s) => ({ ...s, needsUpdate: due.has(s.id) }));
  }

  @Post("padrinhos")
  @HttpCode(201)
  @UseGuards(AdminGuard)
  async saveSponsorship(@Body() body: unknown) {
    const input = parseBody(sponsorshipSchema.extend({ id: sponsorshipSchema.shape.id.optional() }), body);
    return this.repo.saveSponsorship({ ...input, id: input.id ?? randomUUID() });
  }
}
