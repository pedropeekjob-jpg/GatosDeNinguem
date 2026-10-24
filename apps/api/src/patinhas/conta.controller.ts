import { Body, Controller, Delete, Get, Headers, HttpCode, Inject, Patch, Post, UseGuards } from "@nestjs/common";
import { accountUpdateSchema, awardErrorMessage, signInStartSchema, signInVerifySchema } from "@gn/domain";
import { z } from "zod";
import { FeatureGuard } from "../common/feature.guard";
import { parseBody } from "../common/validation";
import { PatinhasService } from "./service";

const redeemSchema = z.object({ partnerId: z.string().min(1), perkId: z.string().min(1) });

/**
 * The helper's own account. Sign in with an email or mobile and a 6-digit code;
 * the session token then goes in "Authorization: Bearer". The public site keeps it in an httpOnly cookie.
 */
@Controller("conta")
export class ContaController {
  constructor(@Inject(PatinhasService) private readonly patinhas: PatinhasService) {}

  /** Step 1. New people get { status: "precisa-nome" } and send their name with the consent. */
  @Post("codigo")
  @HttpCode(200)
  requestCode(@Body() body: unknown) {
    return this.patinhas.requestCode(parseBody(signInStartSchema, body));
  }

  /** Step 2. */
  @Post("entrar")
  @HttpCode(200)
  verify(@Body() body: unknown) {
    return this.patinhas.verifyCode(parseBody(signInVerifySchema, body));
  }

  @Post("sair")
  @HttpCode(204)
  async signOut(@Headers("authorization") auth?: string) {
    await this.patinhas.signOut(auth);
  }

  @Get("eu")
  async me(@Headers("authorization") auth?: string) {
    return this.patinhas.painel(await this.patinhas.accountFromHeader(auth));
  }

  @Patch("eu")
  async update(@Headers("authorization") auth: string | undefined, @Body() body: unknown) {
    const account = await this.patinhas.accountFromHeader(auth);
    const changes = parseBody(accountUpdateSchema, body);
    return this.patinhas.repo.saveAccount({ ...account, ...changes, nickname: changes.nickname === "" ? undefined : (changes.nickname ?? account.nickname) });
  }

  /** RGPD: deletes the account. Points already given stay in community totals, without a name. */
  @Delete("eu")
  @HttpCode(204)
  async remove(@Headers("authorization") auth?: string) {
    const account = await this.patinhas.accountFromHeader(auth);
    await this.patinhas.repo.deleteAccount(account.id);
  }

  /** Finishing the "Como posso ajudar?" quiz while signed in. Counts once. */
  @Post("eu/questionario")
  @HttpCode(200)
  async quiz(@Headers("authorization") auth?: string) {
    const account = await this.patinhas.accountFromHeader(auth);
    const result = await this.patinhas.give(account.id, "questionario", { by: "proprio" });
    return result.ok ? { counted: true, points: result.entry.points } : { counted: false, message: awardErrorMessage[result.error] };
  }

  @Post("eu/trocas")
  @HttpCode(201)
  @UseGuards(FeatureGuard("trocas"))
  async redeem(@Headers("authorization") auth: string | undefined, @Body() body: unknown) {
    const account = await this.patinhas.accountFromHeader(auth);
    const { partnerId, perkId } = parseBody(redeemSchema, body);
    return this.patinhas.redeem(account, partnerId, perkId);
  }
}
