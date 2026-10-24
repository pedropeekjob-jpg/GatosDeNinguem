import { Body, Controller, Get, Headers, HttpCode, Inject, Param, Post, Put, Query, Req, UseGuards, type RawBodyRequest } from "@nestjs/common";
import { authorSchema, sponsorEmailUpdatesSchema, sponsorLetterInputSchema } from "@gn/domain";
import type { FastifyRequest } from "fastify";
import { z } from "zod";
import { AdminGuard } from "../common/admin.guard";
import { parseBody } from "../common/validation";
import { PatinhasService } from "../patinhas/service";
import { SponsorService } from "./sponsor.service";

const letterSchema = sponsorLetterInputSchema.extend({ by: authorSchema });

@Controller()
export class PadrinhosController {
  constructor(@Inject(SponsorService) private readonly sponsors: SponsorService, @Inject(PatinhasService) private readonly patinhas: PatinhasService) {}

  /** The payment provider's notifications (debit started, paid, failed, cancelled). Checked by its signature. */
  @Post("padrinhos/debito/webhook")
  @HttpCode(200)
  webhook(@Req() req: RawBodyRequest<FastifyRequest>) {
    return this.sponsors.webhook(req.rawBody?.toString("utf8") ?? "", req.headers);
  }

  // ----- the godparent's own area on the site -----

  @Get("conta/eu/apadrinhamentos")
  async mine(@Headers("authorization") auth?: string) {
    const account = await this.patinhas.accountFromHeader(auth);
    return { debitAvailable: this.sponsors.debitReady, sponsorships: await this.sponsors.mine(account) };
  }

  /** Sets up the monthly debit for a sponsorship arranged by hand, or one whose debit was left halfway. */
  @Post("conta/eu/apadrinhamentos/:id/debito")
  @HttpCode(200)
  async startDebit(@Headers("authorization") auth: string | undefined, @Param("id") id: string) {
    const s = await this.sponsors.ownSponsorship(await this.patinhas.accountFromHeader(auth), id);
    return this.sponsors.startDebit(s);
  }

  @Post("conta/eu/apadrinhamentos/:id/cancelar")
  @HttpCode(200)
  async cancel(@Headers("authorization") auth: string | undefined, @Param("id") id: string) {
    await this.sponsors.cancel(await this.patinhas.accountFromHeader(auth), id);
    return { ok: true };
  }

  @Put("conta/eu/apadrinhamentos/:id/preferencias")
  async prefs(@Headers("authorization") auth: string | undefined, @Param("id") id: string, @Body() body: unknown) {
    const { emailUpdates } = parseBody(z.object({ emailUpdates: sponsorEmailUpdatesSchema }), body);
    await this.sponsors.setEmailUpdates(await this.patinhas.accountFromHeader(auth), id, emailUpdates);
    return { ok: true };
  }

  // ----- back office -----

  @Get("escalas/padrinhos/novidades")
  @UseGuards(AdminGuard)
  letters(@Query("gato") catSlug?: string) {
    return this.sponsors.repo.listSponsorLetters(catSlug || undefined);
  }

  /** "Escrever novidade": goes to every godparent of the cat, on their page and by email. */
  @Post("escalas/padrinhos/novidades")
  @HttpCode(201)
  @UseGuards(AdminGuard)
  sendLetter(@Body() body: unknown) {
    const { by, ...input } = parseBody(letterSchema, body);
    return this.sponsors.sendLetter(input, by);
  }
}
