import { Controller, Get, HttpCode, Inject, Post, UseGuards } from "@nestjs/common";
import { campaignTranslationSpec, catTranslationSpec, pageTranslationSpec, partnerTranslationSpec, perkTranslationSpec, postTranslationSpec, productTranslationSpec } from "@gn/domain";
import { AdminGuard } from "../common/admin.guard";
import { API_OPTIONS, type ApiOptions } from "../common/options";
import { TranslationService } from "./translation.service";

const changed = (a: unknown, b: unknown) => JSON.stringify(a) !== JSON.stringify(b);

/** For the back office: whether texts are translated automatically, and filling in what is missing all at once. */
@Controller("traducoes")
@UseGuards(AdminGuard)
export class TraducoesController {
  constructor(@Inject(API_OPTIONS) private readonly options: ApiOptions) {}

  @Get()
  status() {
    const t = new TranslationService(this.options);
    return { on: t.enabled, provider: t.provider ?? null };
  }

  /** Translates every text that has no translation yet (for example right after the key is set). Manual translations stay. */
  @Post("preencher")
  @HttpCode(200)
  async fillMissing() {
    const t = new TranslationService(this.options);
    if (!t.enabled) return { on: false, updated: 0 };
    const repo = this.options.repository;
    let updated = 0;
    for (const cat of await repo.listCats()) {
      const next = await t.fill(catTranslationSpec, cat, cat, [cat.name]);
      if (changed(next.translations, cat.translations)) { await repo.saveCat(next); updated++; }
    }
    for (const post of await repo.listPosts()) {
      const next = await t.fill(postTranslationSpec, post, post, [post.event?.location]);
      if (changed(next.translations, post.translations)) { await repo.savePost(next); updated++; }
    }
    for (const page of await repo.listPages()) {
      const next = await t.fill(pageTranslationSpec, page, page);
      if (changed(next.translations, page.translations)) { await repo.savePage(next); updated++; }
    }
    for (const partner of await repo.listPartners()) {
      const perks = await Promise.all(partner.perks.map((perk) => t.fill(perkTranslationSpec, perk, perk, [partner.name])));
      const next = await t.fill(partnerTranslationSpec, { ...partner, perks }, partner, [partner.name]);
      if (changed(next, partner)) { await repo.savePartner(next); updated++; }
    }
    const products = [];
    for (const product of await repo.listProducts()) {
      const next = await t.fill(productTranslationSpec, product, product);
      if (changed(next.translations, product.translations)) products.push(next);
    }
    if (products.length) { await repo.saveProducts(products); updated += products.length; }
    const impact = await repo.getImpact();
    if (impact.campaign) {
      const campaign = await t.fill(campaignTranslationSpec, impact.campaign, impact.campaign);
      if (changed(campaign.translations, impact.campaign.translations)) { await repo.saveImpact({ ...impact, campaign }); updated++; }
    }
    if (updated) await this.options.onContentChanged({ type: "page", path: "/" });
    return { on: true, updated };
  }
}
