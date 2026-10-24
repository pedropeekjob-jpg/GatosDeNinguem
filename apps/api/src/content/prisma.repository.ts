import type { PrismaClient } from "@prisma/client";
import { careNotificationPrefsSchema, careTaskSchema, type CareNotificationPrefs, type CareTask } from "@gn/domain";
import { appointmentSchema, careAlertSchema, catCareSchema, doseSchema, medicationSchema, visitNoteSchema, type Appointment, type CareAlert, type CatCare, type Dose, type Medication, type VisitNote } from "@gn/domain";
import { fosterApplicationSchema, fosterApplicationStatus, fosterPlacementSchema, shiftSchema, sponsorshipSchema, type FosterPlacement, type Shift, type Sponsorship, type StoredFosterApplication } from "@gn/domain";
import { itemDonationSchema, itemDonationStatus, productSchema, seedShopSettings, shopOrderSchema, shopSettingsSchema, shopSpendingSchema, type Product, type ShopOrder, type ShopSettings, type ShopSpending, type StoredItemDonation } from "@gn/domain";
import { z } from "zod";
import { adoptionInterestSchema, catSchema, impactSchema, pageSchema, partnerApplicationSchema, partnerSchema, postSchema, promotionSchema, seoSettingsSchema, type Cat, type Impact, type NewsletterSignup, type Page, type Partner, type Post, type Promotion, type Redirect, type SeoSettings } from "@gn/domain";
import type { ContentRepository, StoredAdoptionInterest, StoredPartnerApplication } from "./repository";

const SEO_KEY = "seo";
const IMPACT_KEY = "impact";
const SHOP_KEY = "loja";

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
  async listNewsletterSignups() {
    const rows = await this.db.newsletterSignup.findMany({ orderBy: { subscribedAt: "asc" } });
    return rows.map((r) => ({ email: r.email, interests: r.interests as NewsletterSignup["interests"], consent: true as const, subscribedAt: r.subscribedAt.toISOString() }));
  }
  async deleteNewsletterSignup(email: string) { await this.db.newsletterSignup.deleteMany({ where: { email: email.toLowerCase() } }); }

  async listPromotions() { return (await this.db.promotion.findMany({ orderBy: { eventStartsAt: "asc" } })).map((r) => promotionSchema.parse(r.data)); }
  async getPromotion(id: string) { const r = await this.db.promotion.findUnique({ where: { id } }); return r ? promotionSchema.parse(r.data) : undefined; }
  async getPromotionByPost(postId: string) { const r = await this.db.promotion.findUnique({ where: { postId } }); return r ? promotionSchema.parse(r.data) : undefined; }
  async savePromotion(p: Promotion) {
    const data = { postId: p.postId, status: p.status, scheduledFor: new Date(p.scheduledFor), eventStartsAt: new Date(p.eventStartsAt), data: p as object };
    await this.db.promotion.upsert({ where: { id: p.id }, create: { id: p.id, ...data }, update: data });
    return p;
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
  async listFosterApplications() {
    const rows = await this.db.fosterApplication.findMany({ orderBy: { receivedAt: "desc" } });
    return rows.map((r) => ({ ...fosterApplicationSchema.parse(r.data), id: r.id, receivedAt: r.receivedAt.toISOString(), status: z.enum(fosterApplicationStatus).parse(r.status) }));
  }
  async saveFosterApplication(a: StoredFosterApplication) {
    const data = { receivedAt: new Date(a.receivedAt), status: a.status, data: a as object };
    await this.db.fosterApplication.upsert({ where: { id: a.id }, create: { id: a.id, ...data }, update: data });
    return a;
  }
  async listSponsorships() { return (await this.db.sponsorship.findMany()).map((r) => sponsorshipSchema.parse(r.data)); }
  async saveSponsorship(x: Sponsorship) {
    const data = { catSlug: x.catSlug, active: x.active, data: x as object };
    await this.db.sponsorship.upsert({ where: { id: x.id }, create: { id: x.id, ...data }, update: data });
    return x;
  }

  async listProducts() { return (await this.db.product.findMany()).map((r) => productSchema.parse(r.data)); }
  async getProduct(id: string) { const r = await this.db.product.findUnique({ where: { id } }); return r ? productSchema.parse(r.data) : undefined; }
  async getProductBySlug(slug: string) { const r = await this.db.product.findUnique({ where: { slug } }); return r ? productSchema.parse(r.data) : undefined; }
  async saveProducts(products: Product[]) {
    await this.db.$transaction(
      products.map((p) => {
        const data = { slug: p.slug, active: p.active, data: p as object };
        return this.db.product.upsert({ where: { id: p.id }, create: { id: p.id, ...data }, update: data });
      }),
    );
  }
  async listShopOrders() { return (await this.db.shopOrder.findMany({ orderBy: { createdAt: "desc" } })).map((r) => shopOrderSchema.parse(r.data)); }
  async getShopOrder(id: string) { const r = await this.db.shopOrder.findUnique({ where: { id } }); return r ? shopOrderSchema.parse(r.data) : undefined; }
  async saveShopOrder(o: ShopOrder) {
    const data = { code: o.code, status: o.status, createdAt: new Date(o.createdAt), data: o as object };
    await this.db.shopOrder.upsert({ where: { id: o.id }, create: { id: o.id, ...data }, update: data });
    return o;
  }
  async listShopSpending() { return (await this.db.shopSpending.findMany({ orderBy: { date: "desc" } })).map((r) => shopSpendingSchema.parse(r.data)); }
  async saveShopSpending(x: ShopSpending) {
    const data = { date: x.date, data: x as object };
    await this.db.shopSpending.upsert({ where: { id: x.id }, create: { id: x.id, ...data }, update: data });
    return x;
  }
  async deleteShopSpending(id: string) { await this.db.shopSpending.deleteMany({ where: { id } }); }
  async listItemDonations() {
    const rows = await this.db.itemDonation.findMany({ orderBy: { receivedAt: "desc" } });
    return rows.map((r) => ({ ...itemDonationSchema.parse(r.data), id: r.id, receivedAt: r.receivedAt.toISOString(), status: z.enum(itemDonationStatus).parse(r.status) }));
  }
  async saveItemDonation(d: StoredItemDonation) {
    const data = { receivedAt: new Date(d.receivedAt), status: d.status, data: d as object };
    await this.db.itemDonation.upsert({ where: { id: d.id }, create: { id: d.id, ...data }, update: data });
    return d;
  }
  /** Databases created before the shop existed get the defaults until the team edits them. */
  async getShopSettings() {
    const r = await this.db.setting.findUnique({ where: { key: SHOP_KEY } });
    return r ? shopSettingsSchema.parse(r.value) : seedShopSettings;
  }
  async saveShopSettings(x: ShopSettings) {
    await this.db.setting.upsert({ where: { key: SHOP_KEY }, create: { key: SHOP_KEY, value: x as object }, update: { value: x as object } });
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

  async listCatCare() { return (await this.db.catCare.findMany()).map((r) => catCareSchema.parse(r.data)); }
  async getCatCare(catId: string) { const r = await this.db.catCare.findUnique({ where: { catId } }); return r ? catCareSchema.parse(r.data) : undefined; }
  async saveCatCare(c: CatCare) {
    const data = { area: c.location.area, data: c as object };
    await this.db.catCare.upsert({ where: { catId: c.catId }, create: { catId: c.catId, ...data }, update: data });
    return c;
  }
  async listMedications(catId?: string) {
    return (await this.db.medication.findMany({ where: catId ? { catId } : {} })).map((r) => medicationSchema.parse(r.data));
  }
  async getMedication(id: string) { const r = await this.db.medication.findUnique({ where: { id } }); return r ? medicationSchema.parse(r.data) : undefined; }
  async saveMedication(m: Medication) {
    const data = { catId: m.catId, data: m as object };
    await this.db.medication.upsert({ where: { id: m.id }, create: { id: m.id, ...data }, update: data });
    return m;
  }
  async listDoses(range: { from: string; to: string }) {
    return (await this.db.medicationDose.findMany({ where: { date: { gte: range.from, lte: range.to } } })).map((r) => doseSchema.parse(r.data));
  }
  async saveDose(d: Dose) {
    await this.db.medicationDose.create({ data: { id: d.id, medicationId: d.medicationId, date: d.date, time: d.time, data: d as object } });
    return d;
  }
  async deleteDose(id: string) { await this.db.medicationDose.deleteMany({ where: { id } }); }
  async listAppointments(catId?: string) {
    return (await this.db.vetAppointment.findMany({ where: catId ? { catId } : {}, orderBy: { startsAt: "asc" } })).map((r) => appointmentSchema.parse(r.data));
  }
  async getAppointment(id: string) { const r = await this.db.vetAppointment.findUnique({ where: { id } }); return r ? appointmentSchema.parse(r.data) : undefined; }
  async saveAppointment(a: Appointment) {
    const data = { catId: a.catId, startsAt: new Date(a.startsAt), status: a.status, data: a as object };
    await this.db.vetAppointment.upsert({ where: { id: a.id }, create: { id: a.id, ...data }, update: data });
    return a;
  }
  async listVisitNotes(catId?: string) {
    return (await this.db.visitNote.findMany({ where: catId ? { catId } : {}, orderBy: { createdAt: "desc" } })).map((r) => visitNoteSchema.parse(r.data));
  }
  async saveVisitNote(n: VisitNote) {
    await this.db.visitNote.create({ data: { id: n.id, catId: n.catId, createdAt: new Date(n.createdAt), data: n as object } });
    return n;
  }
  async listCareAlerts(opts: { since?: string; catId?: string; limit?: number } = {}) {
    const rows = await this.db.careAlert.findMany({
      where: { ...(opts.since ? { createdAt: { gt: new Date(opts.since) } } : {}), ...(opts.catId ? { catId: opts.catId } : {}) },
      orderBy: { createdAt: "desc" },
      take: opts.limit ?? 100,
    });
    return rows.map((r) => careAlertSchema.parse(r.data));
  }
  async saveCareAlert(a: CareAlert) {
    await this.db.careAlert.create({ data: { id: a.id, catId: a.catId, createdAt: new Date(a.createdAt), data: a as object } });
    return a;
  }
  async listCareTasks(filter: { status?: CareTask["status"][] } = {}) {
    const rows = await this.db.careTask.findMany({ where: filter.status ? { status: { in: filter.status } } : {}, orderBy: { createdAt: "desc" } });
    return rows.map((r) => careTaskSchema.parse(r.data));
  }
  async getCareTask(id: string) { const r = await this.db.careTask.findUnique({ where: { id } }); return r ? careTaskSchema.parse(r.data) : undefined; }
  async saveCareTask(t: CareTask) {
    const data = { status: t.status, createdAt: new Date(t.createdAt), data: t as object };
    await this.db.careTask.upsert({ where: { id: t.id }, create: { id: t.id, ...data }, update: data });
    return t;
  }
  async getCarePrefs(accountId: string) {
    const r = await this.db.setting.findUnique({ where: { key: `cuidados:${accountId}` } });
    return r ? careNotificationPrefsSchema.parse(r.value) : undefined;
  }
  async saveCarePrefs(accountId: string, prefs: CareNotificationPrefs) {
    const key = `cuidados:${accountId}`;
    await this.db.setting.upsert({ where: { key }, create: { key, value: prefs as object }, update: { value: prefs as object } });
    return prefs;
  }
}
