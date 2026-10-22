import { Body, Controller, Get, HttpCode, Inject, NotFoundException, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { catInputSchema, catStatusSchema, publicHappyEnding, seoFieldsSchema, type Cat } from "@gn/domain";
import { randomUUID } from "node:crypto";
import { AdminGuard } from "../common/admin.guard";
import { API_OPTIONS, type ApiOptions } from "../common/options";
import { parseBody } from "../common/validation";

/** Public view of a cat: private adopter data is never sent. */
function toPublic(cat: Cat) {
  const { happyEnding: _private, ...rest } = cat;
  return rest;
}

@Controller("cats")
export class CatsController {
  constructor(@Inject(API_OPTIONS) private readonly options: ApiOptions) {}
  private get repo() { return this.options.repository; }

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
    const cat: Cat = { ...input, id: randomUUID(), updatedAt: new Date().toISOString() };
    if (cat.status === "adotado" && !cat.adoptedAt) cat.adoptedAt = cat.updatedAt;
    await this.repo.saveCat(cat);
    await this.options.onContentChanged({ type: "cat", path: `/adotar/${cat.slug}` });
    return cat;
  }

  @Patch(":id")
  @UseGuards(AdminGuard)
  async update(@Param("id") id: string, @Body() body: unknown) {
    const current = await this.repo.getCat(id);
    if (!current) throw new NotFoundException("Gato não encontrado.");
    const changes = parseBody(catInputSchema.partial(), body);
    const now = new Date().toISOString();
    const next: Cat = { ...current, ...changes, updatedAt: now };
    if (next.status === "adotado" && !next.adoptedAt) next.adoptedAt = now;
    await this.repo.saveCat(next);
    await this.options.onContentChanged({ type: "cat", path: `/adotar/${next.slug}` });
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
