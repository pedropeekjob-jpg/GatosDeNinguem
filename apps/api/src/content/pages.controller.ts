import { Body, Controller, Get, Inject, NotFoundException, Param, Patch, Query, UseGuards } from "@nestjs/common";
import { pageSchema, pageTranslationSpec, seoFieldsSchema } from "@gn/domain";
import { normalisePath } from "@gn/seo";
import { AdminGuard } from "../common/admin.guard";
import { API_OPTIONS, type ApiOptions } from "../common/options";
import { parseBody } from "../common/validation";
import { TranslationService } from "../traducao/translation.service";

const editablePage = pageSchema.pick({ heading: true, intro: true, gallery: true, carousel: true, strollingCat: true, translations: true }).partial();

@Controller("pages")
export class PagesController {
  constructor(@Inject(API_OPTIONS) private readonly options: ApiOptions) {}
  private get repo() { return this.options.repository; }
  private get translations() { return new TranslationService(this.options); }

  @Get()
  async list(@Query("path") path?: string) {
    const pages = await this.repo.listPages();
    if (!path) return pages;
    const page = pages.find((p) => p.path === normalisePath(path));
    if (!page) throw new NotFoundException("Página não encontrada.");
    return page;
  }

  @Patch(":id")
  @UseGuards(AdminGuard)
  async update(@Param("id") id: string, @Body() body: unknown) {
    const current = await this.repo.getPage(id);
    if (!current) throw new NotFoundException("Página não encontrada.");
    const next = await this.repo.savePage(await this.translations.fill(pageTranslationSpec, { ...current, ...parseBody(editablePage, body), updatedAt: new Date().toISOString() }, current));
    await this.options.onContentChanged({ type: "page", path: next.path });
    return next;
  }

  @Patch(":id/seo")
  @UseGuards(AdminGuard)
  async updateSeo(@Param("id") id: string, @Body() body: unknown) {
    const current = await this.repo.getPage(id);
    if (!current) throw new NotFoundException("Página não encontrada.");
    const next = await this.repo.savePage({ ...current, seo: parseBody(seoFieldsSchema, body), updatedAt: new Date().toISOString() });
    await this.options.onContentChanged({ type: "page", path: next.path });
    return next;
  }
}
