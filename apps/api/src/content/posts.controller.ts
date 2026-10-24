import { BadRequestException, Body, ConflictException, Controller, Delete, Get, HttpCode, Inject, NotFoundException, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { postEventSchema, postInputSchema, seoFieldsSchema, sortNewestFirst, type Post as NewsPost } from "@gn/domain";
import { randomUUID } from "node:crypto";
import { AdminGuard } from "../common/admin.guard";
import { API_OPTIONS, type ApiOptions } from "../common/options";
import { parseBody } from "../common/validation";
import { PromotionService } from "../promocao/promotion.service";

const eventInput = postInputSchema.superRefine((p, ctx) => {
  if (p.event?.endsAt && p.event.endsAt < p.event.startsAt) ctx.addIssue({ code: "custom", path: ["event", "endsAt"], message: "O evento tem de acabar depois de começar." });
});

@Controller("posts")
export class PostsController {
  constructor(@Inject(API_OPTIONS) private readonly options: ApiOptions, @Inject(PromotionService) private readonly promotions: PromotionService) {}
  private get repo() { return this.options.repository; }

  @Get()
  async list() {
    const now = new Date().toISOString();
    return sortNewestFirst((await this.repo.listPosts()).filter((p) => p.publishedAt <= now));
  }

  @Get(":slug")
  async get(@Param("slug") slug: string) {
    const post = await this.repo.getPostBySlug(slug);
    if (!post) throw new NotFoundException("Notícia não encontrada.");
    return post;
  }

  @Post()
  @HttpCode(201)
  @UseGuards(AdminGuard)
  async create(@Body() body: unknown) {
    const input = parseBody(eventInput, body);
    if (await this.repo.getPostBySlug(input.slug)) throw new ConflictException("Já existe uma notícia com este endereço (slug).");
    const post: NewsPost = { ...input, id: randomUUID(), updatedAt: new Date().toISOString() };
    await this.repo.savePost(post);
    await this.promotions.postSaved(post);
    await this.options.onContentChanged({ type: "post", path: `/noticias/${post.slug}` });
    return post;
  }

  @Patch(":id")
  @UseGuards(AdminGuard)
  async update(@Param("id") id: string, @Body() body: unknown) {
    const current = await this.repo.getPost(id);
    if (!current) throw new NotFoundException("Notícia não encontrada.");
    const changes = parseBody(postInputSchema.partial().extend({ event: postEventSchema.nullable().optional() }), body);
    if (changes.slug && changes.slug !== current.slug && (await this.repo.getPostBySlug(changes.slug)))
      throw new ConflictException("Já existe uma notícia com este endereço (slug).");
    const { event, ...rest } = changes;
    const merged = { ...current, ...rest, event: event === null ? undefined : event ?? current.event, updatedAt: new Date().toISOString() };
    if (merged.event?.endsAt && merged.event.endsAt < merged.event.startsAt) throw new BadRequestException("O evento tem de acabar depois de começar.");
    const next = await this.repo.savePost(merged);
    await this.promotions.postSaved(next);
    await this.options.onContentChanged({ type: "post", path: `/noticias/${next.slug}` });
    return next;
  }

  @Patch(":id/seo")
  @UseGuards(AdminGuard)
  async updateSeo(@Param("id") id: string, @Body() body: unknown) {
    const current = await this.repo.getPost(id);
    if (!current) throw new NotFoundException("Notícia não encontrada.");
    const next = await this.repo.savePost({ ...current, seo: parseBody(seoFieldsSchema, body), updatedAt: new Date().toISOString() });
    await this.options.onContentChanged({ type: "post", path: `/noticias/${next.slug}` });
    return next;
  }

  @Delete(":id")
  @HttpCode(204)
  @UseGuards(AdminGuard)
  async remove(@Param("id") id: string) {
    await this.repo.deletePost(id);
    await this.promotions.postDeleted(id);
    await this.options.onContentChanged({ type: "post", path: "/noticias" });
  }
}
