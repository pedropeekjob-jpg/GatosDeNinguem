import { Body, ConflictException, Controller, Delete, Get, HttpCode, Inject, Param, Post, Put, UseGuards } from "@nestjs/common";
import { redirectSchema, seoSettingsSchema } from "@gn/domain";
import { auditSeo, findRedirect, normalisePath, resolveSeo } from "@gn/seo";
import { randomUUID } from "node:crypto";
import { AdminGuard } from "../common/admin.guard";
import { API_OPTIONS, type ApiOptions } from "../common/options";
import { parseBody } from "../common/validation";

const newRedirect = redirectSchema.omit({ id: true });

@Controller("seo")
export class SeoController {
  constructor(@Inject(API_OPTIONS) private readonly options: ApiOptions) {}
  private get repo() { return this.options.repository; }

  @Get("settings")
  settings() { return this.repo.getSeoSettings(); }

  @Put("settings")
  @UseGuards(AdminGuard)
  async saveSettings(@Body() body: unknown) {
    const saved = await this.repo.saveSeoSettings(parseBody(seoSettingsSchema, body));
    await this.options.onContentChanged({ type: "seo" });
    return saved;
  }

  @Get("redirects")
  redirects() { return this.repo.listRedirects(); }

  @Post("redirects")
  @HttpCode(201)
  @UseGuards(AdminGuard)
  async addRedirect(@Body() body: unknown) {
    const input = parseBody(newRedirect, body);
    const from = normalisePath(input.from);
    if (findRedirect(await this.repo.listRedirects(), from)) throw new ConflictException("Já existe um redirecionamento para este endereço.");
    const saved = await this.repo.saveRedirect({ ...input, from, id: randomUUID() });
    await this.options.onContentChanged({ type: "seo" });
    return saved;
  }

  @Delete("redirects/:id")
  @HttpCode(204)
  @UseGuards(AdminGuard)
  async removeRedirect(@Param("id") id: string) {
    await this.repo.deleteRedirect(id);
    await this.options.onContentChanged({ type: "seo" });
  }

  /** Final titles and descriptions of every indexable URL, plus problems found. */
  @Get("audit")
  @UseGuards(AdminGuard)
  async audit() {
    const settings = await this.repo.getSeoSettings();
    const [pages, cats, posts] = await Promise.all([this.repo.listPages(), this.repo.listCats(), this.repo.listPosts()]);
    const entries = [
      ...pages.map((p) => ({ id: p.id, kind: "pagina" as const, label: p.heading, path: p.path, seo: resolveSeo(settings, { path: p.path, title: p.heading, description: p.intro, overrides: p.seo }) })),
      ...cats.map((c) => ({ id: c.id, kind: "gato" as const, label: c.name, path: `/adotar/${c.slug}`, seo: resolveSeo(settings, { path: `/adotar/${c.slug}`, title: `${c.name}, ${c.sex === "femea" ? "gata" : "gato"} para adoção`, description: c.summary, overrides: c.seo }) })),
      ...posts.map((p) => ({ id: p.id, kind: "noticia" as const, label: p.title, path: `/noticias/${p.slug}`, seo: resolveSeo(settings, { path: `/noticias/${p.slug}`, title: p.title, description: p.summary, overrides: p.seo }) })),
    ];
    const indexable = entries.filter((e) => e.seo.robots.index);
    const issues = auditSeo(indexable.map((e) => ({ id: e.id, label: e.label, title: e.seo.title, description: e.seo.description })));
    return {
      items: entries.map((e) => ({ id: e.id, kind: e.kind, label: e.label, path: e.path, title: e.seo.title, description: e.seo.description, noindex: !e.seo.robots.index })),
      issues,
    };
  }
}
