import { Body, Controller, Get, HttpCode, Inject, NotFoundException, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { catInputSchema, catStatusSchema, catTranslationSpec, publicHappyEnding, seoFieldsSchema, type Cat } from "@gn/domain";
import { randomUUID } from "node:crypto";
import { CatAlertService } from "../alertas/cat-alert.service";
import { AdminGuard } from "../common/admin.guard";
import { API_OPTIONS, type ApiOptions } from "../common/options";
import { parseBody } from "../common/validation";
import { TranslationService } from "../traducao/translation.service";

/** Public view of a cat: private adopter data is never sent. */
function toPublic(cat: Cat) {
  const { happyEnding: _private, ...rest } = cat;
  return rest;
}

/** Remembers when a cat was first put up for adoption and when it was adopted. */
function stampDates(cat: Cat, now: string) {
  if (cat.status === "para-adocao" && !cat.listedAt) cat.listedAt = now;
  if (cat.status === "adotado" && !cat.adoptedAt) cat.adoptedAt = now;
}

@Controller("cats")
export class CatsController {
  constructor(@Inject(API_OPTIONS) private readonly options: ApiOptions, @Inject(CatAlertService) private readonly alerts: CatAlertService) {}
  private get repo() { return this.options.repository; }
  private get translations() { return new TranslationService(this.options); }

  /** A cat put up for adoption for the first time: tell the people who asked. Saving never fails because of it. */
  private async announce(cat: Cat) {
    try {
      await this.alerts.catAvailable(cat);
    } catch (err) {
      console.error(`Could not send the alert for ${cat.slug}`, err);
    }
  }

  @Get()
  async list(@Query("status") status?: string) {
    const filter = status ? catStatusSchema.parse(status) : undefined;
    const cats = await this.repo.listCats();
    return cats.filter((c) => !filter || c.status === filter).map(toPublic);
  }

  @Get("finais-felizes")
  async happyEndings() {
    const cats = (await this.repo.listCats()).filter((c) => c.status === "adotado");
    cats.sort((a, b) => (b.adoptedAt ?? "").localeCompare(a.adoptedAt ?? ""));
    return cats.map((cat) => ({ cat: toPublic(cat), happyEnding: publicHappyEnding(cat) ?? null }));
  }

  @Get(":slug")
  async get(@Param("slug") slug: string) {
    const cat = await this.repo.getCatBySlug(slug);
    if (!cat) throw new NotFoundException("Gato não encontrado.");
    return { ...toPublic(cat), happyEnding: publicHappyEnding(cat) };
  }

  @Post()
  @HttpCode(201)
  @UseGuards(AdminGuard)
  async create(@Body() body: unknown) {
    const input = parseBody(catInputSchema, body);
    const cat: Cat = await this.translations.fill(catTranslationSpec, { ...input, id: randomUUID(), updatedAt: new Date().toISOString() }, undefined, [input.name]);
    stampDates(cat, cat.updatedAt);
    await this.repo.saveCat(cat);
    await this.options.onContentChanged({ type: "cat", path: `/adotar/${cat.slug}` });
    await this.announce(cat);
    return cat;
  }

  @Patch(":id")
  @UseGuards(AdminGuard)
  async update(@Param("id") id: string, @Body() body: unknown) {
    const current = await this.repo.getCat(id);
    if (!current) throw new NotFoundException("Gato não encontrado.");
    const changes = parseBody(catInputSchema.partial(), body);
    const now = new Date().toISOString();
    const next: Cat = await this.translations.fill(catTranslationSpec, { ...current, ...changes, updatedAt: now }, current, [changes.name ?? current.name]);
    stampDates(next, now);
    await this.repo.saveCat(next);
    await this.options.onContentChanged({ type: "cat", path: `/adotar/${next.slug}` });
    if (current.status !== "para-adocao") await this.announce(next);
    return next;
  }

  @Patch(":id/seo")
  @UseGuards(AdminGuard)
  async updateSeo(@Param("id") id: string, @Body() body: unknown) {
    const current = await this.repo.getCat(id);
    if (!current) throw new NotFoundException("Gato não encontrado.");
    const seo = parseBody(seoFieldsSchema, body);
    const next = await this.repo.saveCat({ ...current, seo, updatedAt: new Date().toISOString() });
    await this.options.onContentChanged({ type: "cat", path: `/adotar/${next.slug}` });
    return next;
  }
}
