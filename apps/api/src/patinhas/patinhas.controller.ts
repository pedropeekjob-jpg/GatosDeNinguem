import { Body, Controller, Delete, Get, HttpCode, Inject, NotFoundException, Param, Post, Put, UseGuards } from "@nestjs/common";
import { badgeSchema, challengeProgress, challengeSchema, earnActionSchema, pointsRulesSchema, type Challenge } from "@gn/domain";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { AdminGuard } from "../common/admin.guard";
import { parseBody } from "../common/validation";
import { PatinhasService } from "./service";

const teamAwardSchema = z.object({
  action: z.union([earnActionSchema, z.literal("ajuste")]),
  quantity: z.number().positive().max(200).optional(),
  points: z.number().int().min(-10_000).max(10_000).optional(),
  note: z.string().max(200).optional(),
});

@Controller("patinhas")
export class PatinhasController {
  constructor(@Inject(PatinhasService) private readonly patinhas: PatinhasService) {}
  private get repo() { return this.patinhas.repo; }

  /** For the public Patinhas page: how to earn, levels, badges, this month's challenge and the thanks wall. */
  @Get()
  summary() {
    return this.patinhas.publicSummary();
  }

  // ----- back office -----

  @Get("contas")
  @UseGuards(AdminGuard)
  accounts() {
    return this.patinhas.overview();
  }

  @Get("contas/:id")
  @UseGuards(AdminGuard)
  async account(@Param("id") id: string) {
    const account = await this.repo.getAccount(id);
    if (!account) throw new NotFoundException("Pessoa não encontrada.");
    return this.patinhas.painel(account);
  }

  /** The team confirms something done outside the site (a donation, foster week, photos of an adopted cat...). */
  @Post("contas/:id/registos")
  @HttpCode(201)
  @UseGuards(AdminGuard)
  give(@Param("id") id: string, @Body() body: unknown) {
    return this.patinhas.teamAward(id, parseBody(teamAwardSchema, body));
  }

  @Get("regras")
  @UseGuards(AdminGuard)
  rules() {
    return this.repo.getRules();
  }

  @Put("regras")
  @UseGuards(AdminGuard)
  saveRules(@Body() body: unknown) {
    return this.repo.saveRules(parseBody(pointsRulesSchema, body));
  }

  @Get("medalhas")
  @UseGuards(AdminGuard)
  badges() {
    return this.repo.listBadges();
  }

  @Post("medalhas")
  @HttpCode(201)
  @UseGuards(AdminGuard)
  saveBadge(@Body() body: unknown) {
    return this.repo.saveBadge(parseBody(badgeSchema, body));
  }

  @Delete("medalhas/:id")
  @HttpCode(204)
  @UseGuards(AdminGuard)
  async deleteBadge(@Param("id") id: string) {
    await this.repo.deleteBadge(id);
  }

  @Get("desafios")
  @UseGuards(AdminGuard)
  async challenges() {
    const [challenges, entries] = await Promise.all([this.repo.listChallenges(), this.repo.listEntries()]);
    return challenges.map((c) => ({ ...c, progress: challengeProgress(c, entries) }));
  }

  @Post("desafios")
  @HttpCode(201)
  @UseGuards(AdminGuard)
  saveChallenge(@Body() body: unknown) {
    const input = parseBody(challengeSchema.extend({ id: z.string().optional() }), body);
    const challenge: Challenge = { ...input, id: input.id ?? randomUUID() };
    return this.repo.saveChallenge(challenge);
  }

  @Delete("desafios/:id")
  @HttpCode(204)
  @UseGuards(AdminGuard)
  async deleteChallenge(@Param("id") id: string) {
    await this.repo.deleteChallenge(id);
  }

  @Get("trocas")
  @UseGuards(AdminGuard)
  async redemptions() {
    const [redemptions, accounts] = await Promise.all([this.repo.listRedemptions(), this.repo.listAccounts()]);
    const names = new Map(accounts.map((a) => [a.id, a.name]));
    return redemptions.map((r) => ({ ...r, personName: r.accountId ? names.get(r.accountId) : undefined }));
  }

  @Post("trocas/:id/usada")
  @HttpCode(200)
  @UseGuards(AdminGuard)
  used(@Param("id") id: string) {
    return this.patinhas.markRedemptionUsed(id);
  }

  @Post("trocas/:id/cancelar")
  @HttpCode(200)
  @UseGuards(AdminGuard)
  cancel(@Param("id") id: string) {
    return this.patinhas.cancelRedemption(id);
  }
}
