import { Body, Controller, Delete, Get, HttpCode, Inject, Param, Post, Query, Res, UseGuards } from "@nestjs/common";
import { NotFoundException } from "@nestjs/common";
import { catAlertPushSignupSchema, catAlertSignupSchema, describeAlertFilters, pushSubscriptionSchema } from "@gn/domain";
import type { FastifyReply } from "fastify";
import { AdminGuard } from "../common/admin.guard";
import { escapeHtml, htmlPage } from "../common/html-page";
import { API_OPTIONS, type ApiOptions } from "../common/options";
import { parseBody } from "../common/validation";
import { CatAlertService } from "./cat-alert.service";

const isBot = (body: unknown) => !!(body && typeof body === "object" && (body as Record<string, unknown>).website_url);
const invalid = (res: FastifyReply) => res.status(400).type("text/html").send(htmlPage("Ligação inválida", "<p>Esta ligação não está completa. Copie-a inteira do email ou escreva-nos.</p>"));

/** "Avisem-me quando chegarem gatos" on the public site, and the links in its emails. */
@Controller("alertas")
export class AlertasController {
  constructor(@Inject(API_OPTIONS) private readonly options: ApiOptions, @Inject(CatAlertService) private readonly alerts: CatAlertService) {}
  private get site() { return (this.options.siteUrl ?? "https://gatosdeninguem.pt").replace(/\/$/, ""); }

  /** What the site needs to offer notifications on the device. */
  @Get("config")
  config() { const { push, pushPublicKey } = this.alerts.setup(); return { push, pushPublicKey }; }

  @Post()
  @HttpCode(201)
  signUp(@Body() body: unknown) {
    if (isBot(body)) return { ok: true };
    return this.alerts.signUp(parseBody(catAlertSignupSchema, body));
  }

  @Post("push")
  @HttpCode(201)
  pushSignUp(@Body() body: unknown) { return this.alerts.pushSignUp(parseBody(catAlertPushSignupSchema, body)); }

  @Post("push/sair")
  @HttpCode(200)
  pushLeave(@Body() body: unknown) { return this.alerts.pushUnsubscribe(parseBody(pushSubscriptionSchema.pick({ endpoint: true }), body).endpoint); }

  /** Opening the link asks for a click: mail scanners open links on their own, and that must not count as consent. */
  @Get("confirmar")
  askConfirm(@Query("id") id = "", @Query("t") token = "", @Res() res: FastifyReply) {
    if (!this.alerts.checkToken("confirmar", id, token)) return invalid(res);
    return res.type("text/html").send(htmlPage("Confirmar avisos", `<p>Carregue no botão para começar a receber um email quando chegar um gato para adoção.</p><form method="post"><button type="submit">Confirmar</button></form>`));
  }

  @Post("confirmar")
  async confirm(@Query("id") id = "", @Query("t") token = "", @Res() res: FastifyReply) {
    const s = await this.alerts.confirm(id, token);
    if (!s) return res.status(400).type("text/html").send(htmlPage("Ligação inválida", "<p>Esta ligação já não é válida. Pode inscrever-se outra vez no site.</p>"));
    return res.status(200).type("text/html").send(htmlPage("Pronto!", `<p>Vamos avisar <strong>${escapeHtml(s.email ?? "")}</strong> quando chegar um gato para adoção.</p><p>Escolheu: ${escapeHtml(describeAlertFilters(s.filters))}.</p><p><a class="button" href="${this.site}/adotar">Ver os gatos que já procuram família</a></p>`));
  }

  @Get("sair")
  askLeave(@Query("id") id = "", @Query("t") token = "", @Res() res: FastifyReply) {
    if (!this.alerts.checkToken("sair", id, token)) return invalid(res);
    return res.type("text/html").send(htmlPage("Deixar de receber avisos", `<p>Vamos deixar de lhe enviar os avisos de gatos para adoção.</p><form method="post"><button type="submit">Deixar de receber</button></form>`));
  }

  /** Also the one-click unsubscribe that Gmail and others offer (List-Unsubscribe-Post). */
  @Post("sair")
  async leave(@Query("id") id = "", @Query("t") token = "", @Res() res: FastifyReply) {
    if (!(await this.alerts.unsubscribe(id, token))) return invalid(res);
    return res.status(200).type("text/html").send(htmlPage("Pronto", "<p>Já não vai receber estes avisos. Obrigado por ter acompanhado os gatos!</p>"));
  }
}

/** Back office: who asked for alerts and what was sent. */
@Controller("alertas/gestao")
@UseGuards(AdminGuard)
export class AlertasGestaoController {
  constructor(@Inject(API_OPTIONS) private readonly options: ApiOptions, @Inject(CatAlertService) private readonly alerts: CatAlertService) {}

  @Get()
  overview() { return this.alerts.overview(); }

  @Delete(":id")
  @HttpCode(204)
  remove(@Param("id") id: string) { return this.alerts.remove(id); }

  /** Sends the alert for a cat again, e.g. after email was not yet set up. */
  @Post("gatos/:catId/enviar")
  @HttpCode(200)
  async sendAgain(@Param("catId") catId: string) {
    const cat = await this.options.repository.getCat(catId);
    if (!cat) throw new NotFoundException("Gato não encontrado.");
    if (cat.status !== "para-adocao") throw new NotFoundException(`${cat.name} não está para adoção.`);
    return this.alerts.catAvailable(cat, { again: true });
  }
}
