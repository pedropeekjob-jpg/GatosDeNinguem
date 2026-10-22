import type { PrismaClient } from "@prisma/client";
import { fosterPlacementSchema, shiftSchema, sponsorshipSchema, type FosterPlacement, type Shift, type Sponsorship } from "@gn/domain";
import { adoptionInterestSchema, catSchema, impactSchema, pageSchema, partnerApplicationSchema, partnerSchema, postSchema, seoSettingsSchema, type Cat, type Impact, type NewsletterSignup, type Page, type Partner, type Post, type Redirect, type SeoSettings } from "@gn/domain";
import type { ContentRepository, StoredAdoptionInterest, StoredPartnerApplication } from "./repository";

const SEO_KEY = "seo";
const IMPACT_KEY = "impact";

/** PostgreSQL storage. Documents are re-validated on read so bad rows fail loudly. */
export class PrismaContentRepository implements ContentRepository {
  constructor(private readonly db: PrismaClient) {}

  async listCats() { return (await this.db.cat.findMany()).map((r) => catSchema.parse(r.data)); }
  async getCat(id: string) { const r = await this.db.cat.findUnique({ where: { id } }); return r ? catSchema.parse(r.data) : undefined; }
  async getCatBySlug(slug: string) { const r = await this.db.cat.findUnique({ where: { slug } }); return r ? catSchema.parse(r.data) : undefined; }
  async saveCat(cat: Cat) {
    const data = { slug: cat.slug, status: cat.status, data: cat as object };
    await this.db.cat.upsert({ where: { id: cat.id }, create: { id: cat.id, ...data }, update: data });
    return cat;
  }

  async listPages() { return (await this.db.page.findMany()).map((r) => pageSchema.parse(r.data)); }
  async getPage(id: string) { const r = await this.db.page.findUnique({ where: { id } }); return r ? pageSchema.parse(r.data) : undefined; }
  async savePage(page: Page) {
    const data = { path: page.path, data: page as object };
    await this.db.page.upsert({ where: { id: page.id }, create: { id: page.id, ...data }, update: data });
    return page;
  }

  async listPosts() { return (await this.db.post.findMany({ orderBy: { publishedAt: "desc" } })).map((r) => postSchema.parse(r.data)); }
  async getPost(id: string) { const r = await this.db.post.findUnique({ where: { id } }); return r ? postSchema.parse(r.data) : undefined; }
  async getPostBySlug(slug: string) { const r = await this.db.post.findUnique({ where: { slug } }); return r ? postSchema.parse(r.data) : undefined; }
  async savePost(post: Post) {
    const data = { slug: post.slug, publishedAt: new Date(post.publishedAt), data: post as object };
    await this.db.post.upsert({ where: { id: post.id }, create: { id: post.id, ...data }, update: data });
    return post;
  }
  async deletePost(id: string) { await this.db.post.deleteMany({ where: { id } }); }

  async listPartners() { return (await this.db.partner.findMany()).map((r) => partnerSchema.parse(r.data)); }
  async getPartner(id: string) { const r = await this.db.partner.findUnique({ where: { id } }); return r ? partnerSchema.parse(r.data) : undefined; }
  async savePartner(partner: Partner) {
    const data = { slug: partner.slug, active: partner.active, data: partner as object };
    await this.db.partner.upsert({ where: { id: partner.id }, create: { id: partner.id, ...data }, update: data });
    return partner;
  }
  async savePartnerApplication(a: StoredPartnerApplication) {
    await this.db.partnerApplication.create({ data: { id: a.id, receivedAt: new Date(a.receivedAt), data: a as object } });
  }
  async listPartnerApplications() {
    const rows = await this.db.partnerApplication.findMany({ orderBy: { receivedAt: "desc" } });
    return rows.map((r) => ({ ...partnerApplicationSchema.parse(r.data), id: r.id, receivedAt: r.receivedAt.toISOString() }));
  }

  async saveAdoptionInterest(i: StoredAdoptionInterest) {
    await this.db.adoptionInterest.create({ data: { id: i.id, receivedAt: new Date(i.receivedAt), catSlug: i.catSlug ?? null, data: i as object } });
  }
  async listAdoptionInterests() {
    const rows = await this.db.adoptionInterest.findMany({ orderBy: { receivedAt: "desc" } });
    return rows.map((r) => ({ ...adoptionInterestSchema.parse(r.data), id: r.id, receivedAt: r.receivedAt.toISOString() }));
  }

  async getImpact() {
    const r = await this.db.setting.findUnique({ where: { key: IMPACT_KEY } });
    if (!r) throw new Error("Impact numbers missing: run the database seed");
    return impactSchema.parse(r.value);
  }
  async saveImpact(impact: Impact) {
    await this.db.setting.upsert({ where: { key: IMPACT_KEY }, create: { key: IMPACT_KEY, value: impact as object }, update: { value: impact as object } });
    return impact;
  }
  async saveNewsletterSignup(s: NewsletterSignup & { subscribedAt: string }) {
    const email = s.email.toLowerCase();
    const data = { interests: s.interests, subscribedAt: new Date(s.subscribedAt) };
    await this.db.newsletterSignup.upsert({ where: { email }, create: { email, ...data }, update: data });
  }

  async listShifts(range: { from?: string; to?: string } = {}) {
    const rows = await this.db.shift.findMany({
      where: { ...(range.from ? { endsAt: { gte: new Date(range.from) } } : {}), ...(range.to ? { startsAt: { lte: new Date(range.to) } } : {}) },
      orderBy: { startsAt: "asc" },
    });
    return rows.map((r) => shiftSchema.parse(r.data));
  }
  async getShift(id: string) { const r = await this.db.shift.findUnique({ where: { id } }); return r ? shiftSchema.parse(r.data) : undefined; }
  async saveShifts(shifts: Shift[]) {
    await this.db.$transaction(
      shifts.map((x) => {
        const data = { startsAt: new Date(x.startsAt), endsAt: new Date(x.endsAt), type: x.type, seriesId: x.seriesId ?? null, data: x as object };
        return this.db.shift.upsert({ where: { id: x.id }, create: { id: x.id, ...data }, update: data });
      }),
    );
  }
  async deleteShift(id: string) { await this.db.shift.deleteMany({ where: { id } }); }
  async listFosterPlacements() { return (await this.db.fosterPlacement.findMany()).map((r) => fosterPlacementSchema.parse(r.data)); }
  async saveFosterPlacement(p: FosterPlacement) {
    const data = { status: p.status, catSlug: p.catSlug, data: p as object };
    await this.db.fosterPlacement.upsert({ where: { id: p.id }, create: { id: p.id, ...data }, update: data });
    return p;
  }
  async listSponsorships() { return (await this.db.sponsorship.findMany()).map((r) => sponsorshipSchema.parse(r.data)); }
  async saveSponsorship(x: Sponsorship) {
    const data = { catSlug: x.catSlug, active: x.active, data: x as object };
    await this.db.sponsorship.upsert({ where: { id: x.id }, create: { id: x.id, ...data }, update: data });
    return x;
  }

  async getSeoSettings() {
    const r = await this.db.setting.findUnique({ where: { key: SEO_KEY } });
    if (!r) throw new Error("SEO settings missing: run the database seed");
    return seoSettingsSchema.parse(r.value);
  }
  async saveSeoSettings(settings: SeoSettings) {
    await this.db.setting.upsert({ where: { key: SEO_KEY }, create: { key: SEO_KEY, value: settings as object }, update: { value: settings as object } });
    return settings;
  }

  async listRedirects() { return this.db.redirect.findMany({ orderBy: { from: "asc" } }); }
  async saveRedirect(r: Redirect) {
    await this.db.redirect.upsert({ where: { id: r.id }, create: r, update: { from: r.from, to: r.to, permanent: r.permanent } });
    return r;
  }
  async deleteRedirect(id: string) { await this.db.redirect.deleteMany({ where: { id } }); }
}
