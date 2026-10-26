import { Body, Controller, Get, HttpCode, Inject, NotFoundException, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { partnerApplicationSchema, partnerSchema, partnerTranslationSpec, perkTranslationSpec, type Partner } from "@gn/domain";
import { randomUUID } from "node:crypto";
import { AdminGuard } from "../common/admin.guard";
import { API_OPTIONS, type ApiOptions } from "../common/options";
import { parseBody } from "../common/validation";
import { TranslationService } from "../traducao/translation.service";

const partnerInput = partnerSchema.omit({ id: true });

@Controller("partners")
export class PartnersController {
  constructor(@Inject(API_OPTIONS) private readonly options: ApiOptions) {}
  private get repo() { return this.options.repository; }

  /** The partner's "why" and each of its offers. */
  private async translated(next: Partner, previous?: Partner): Promise<Partner> {
    const t = new TranslationService(this.options);
    const keep = [next.name, next.town];
    const perks = await Promise.all(next.perks.map((perk) => t.fill(perkTranslationSpec, perk, previous?.perks.find((p) => p.id === perk.id), keep)));
    return t.fill(partnerTranslationSpec, { ...next, perks }, previous, keep);
  }

  @Get()
  async list() {
    return (await this.repo.listPartners()).filter((p) => p.active).sort((a, b) => a.name.localeCompare(b.name, "pt"));
  }

  /** "Seja parceiro" form. Public; a hidden "website_url" field catches spam bots. */
  @Post("applications")
  @HttpCode(201)
  async apply(@Body() body: unknown) {
    if (body && typeof body === "object" && (body as Record<string, unknown>).website_url) return { ok: true };
    const application = parseBody(partnerApplicationSchema, body);
    await this.repo.savePartnerApplication({ ...application, id: randomUUID(), receivedAt: new Date().toISOString() });
    return { ok: true };
  }

  @Get("applications")
  @UseGuards(AdminGuard)
  applications() { return this.repo.listPartnerApplications(); }

  @Post()
  @HttpCode(201)
  @UseGuards(AdminGuard)
  async create(@Body() body: unknown) {
    const partner: Partner = await this.translated({ ...parseBody(partnerInput, body), id: randomUUID() });
    await this.repo.savePartner(partner);
    await this.options.onContentChanged({ type: "page", path: "/parceiros" });
    return partner;
  }

  @Patch(":id")
  @UseGuards(AdminGuard)
  async update(@Param("id") id: string, @Body() body: unknown) {
    const current = await this.repo.getPartner(id);
    if (!current) throw new NotFoundException("Parceiro não encontrado.");
    const next = await this.repo.savePartner(await this.translated({ ...current, ...parseBody(partnerInput.partial(), body) }, current));
    await this.options.onContentChanged({ type: "page", path: "/parceiros" });
    return next;
  }
}
