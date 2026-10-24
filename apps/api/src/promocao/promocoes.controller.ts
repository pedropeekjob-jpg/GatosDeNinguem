import { Body, Controller, Get, HttpCode, Inject, Param, Patch, Post, Query, Res, UseGuards } from "@nestjs/common";
import { promotionEditSchema } from "@gn/domain";
import type { FastifyReply } from "fastify";
import { AdminGuard } from "../common/admin.guard";
import { API_OPTIONS, type ApiOptions } from "../common/options";
import { escapeHtml as escape, htmlPage as page } from "../common/html-page";
import { parseBody } from "../common/validation";
import { PromotionService } from "./promotion.service";

/** Back office: review, approve and follow the promotion of each event. */
@Controller("promocoes")
@UseGuards(AdminGuard)
export class PromocoesController {
  constructor(@Inject(PromotionService) private readonly promotions: PromotionService) {}

  @Get()
  list() { return this.promotions.list(); }

  @Get("canais")
  channels() { return this.promotions.channels(); }

  /** For an external cron (the API sleeps on free hosting, so its own timer is not enough). */
  @Post("correr")
  @HttpCode(200)
  run() { return this.promotions.runDue(); }

  @Patch(":id")
  edit(@Param("id") id: string, @Body() body: unknown) { return this.promotions.edit(id, parseBody(promotionEditSchema, body)); }

  @Post(":id/aprovar")
  @HttpCode(200)
  approve(@Param("id") id: string) { return this.promotions.approve(id); }

  @Post(":id/rascunho")
  @HttpCode(200)
  backToDraft(@Param("id") id: string) { return this.promotions.backToDraft(id); }

  @Post(":id/cancelar")
  @HttpCode(200)
  cancel(@Param("id") id: string) { return this.promotions.cancel(id); }

  @Post(":id/publicar")
  @HttpCode(200)
  publishNow(@Param("id") id: string) { return this.promotions.publishNow(id); }
}

/**
 * Unsubscribe links in newsletter emails. Opening the link asks for a click (mail scanners open links
 * on their own); the POST also serves the one-click unsubscribe that Gmail and others offer.
 */
@Controller("newsletter/sair")
export class NewsletterSairController {
  constructor(@Inject(API_OPTIONS) private readonly options: ApiOptions, @Inject(PromotionService) private readonly promotions: PromotionService) {}

  @Get()
  ask(@Query("email") email = "", @Query("t") token = "", @Res() res: FastifyReply) {
    if (!this.promotions.checkUnsubscribeToken(email, token)) return res.status(400).type("text/html").send(page("Ligação inválida", "<p>Esta ligação não está completa. Copie-a inteira do email ou escreva-nos.</p>"));
    const action = `?email=${encodeURIComponent(email)}&t=${encodeURIComponent(token)}`;
    return res.type("text/html").send(page("Deixar de receber emails", `<p>Vamos deixar de enviar as novidades da Gatos de Ninguém para <strong>${escape(email)}</strong>.</p><form method="post" action="${action}"><button type="submit">Deixar de receber</button></form>`));
  }

  @Post()
  async leave(@Query("email") email = "", @Query("t") token = "", @Res() res: FastifyReply) {
    if (!this.promotions.checkUnsubscribeToken(email, token)) return res.status(400).type("text/html").send(page("Ligação inválida", "<p>Esta ligação não está completa. Copie-a inteira do email ou escreva-nos.</p>"));
    await this.options.repository.deleteNewsletterSignup(email);
    return res.status(200).type("text/html").send(page("Pronto", "<p>Já não vai receber os nossos emails. Obrigado por ter acompanhado os gatos!</p>"));
  }
}
