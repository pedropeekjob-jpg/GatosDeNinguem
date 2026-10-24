import { seedAppointments, seedCareAlerts, seedCatCare, seedDoses, seedMedications, seedVisitNotes, type Appointment, type CareAlert, type CareNotificationPrefs, type CareTask, type CatCare, type Dose, type Medication, type VisitNote } from "@gn/domain";
import { seedFosterApplications, seedFosterPlacements, seedShifts, seedSponsorLetters, seedSponsorships, type FosterPlacement, type Shift, type SponsorLetter, type Sponsorship, type StoredFosterApplication } from "@gn/domain";
import { seedCats, seedImpact, seedPages, seedPartners, seedPosts, seedRedirects, seedSeoSettings, type Cat, type Impact, type NewsletterSignup, type Page, type Partner, type Post, type Promotion, type Redirect, type SeoSettings } from "@gn/domain";
import { seedItemDonations, seedProducts, seedShopOrders, seedShopSettings, seedShopSpending, type Product, type ShopOrder, type ShopSettings, type ShopSpending, type StoredItemDonation } from "@gn/domain";
import type { ContentRepository, StoredAdoptionInterest, StoredPartnerApplication } from "./repository";

const clone = <T>(v: T): T => structuredClone(v);

/** Seeded, process-local storage for development, tests and previews. */
export class InMemoryContentRepository implements ContentRepository {
  private cats = new Map<string, Cat>();
  private pages = new Map<string, Page>();
  private posts = new Map<string, Post>();
  private redirects = new Map<string, Redirect>();
  private partners = new Map<string, Partner>();
  private applications: StoredPartnerApplication[] = [];
  private interests: StoredAdoptionInterest[] = [];
  private settings: SeoSettings;
  private shifts = new Map<string, Shift>(seedShifts.map((x) => [x.id, structuredClone(x)]));
  private placements = new Map<string, FosterPlacement>(seedFosterPlacements.map((x) => [x.id, structuredClone(x)]));
  private fosterApplications = new Map<string, StoredFosterApplication>(seedFosterApplications.map((x) => [x.id, structuredClone(x)]));
  private sponsorships = new Map<string, Sponsorship>(seedSponsorships.map((x) => [x.id, structuredClone(x)]));
  private letters = new Map<string, SponsorLetter>(seedSponsorLetters.map((x) => [x.id, structuredClone(x)]));
  private impact: Impact = clone(seedImpact);
  private newsletter = new Map<string, NewsletterSignup & { subscribedAt: string }>();
  private care = new Map<string, CatCare>(seedCatCare.map((x) => [x.catId, structuredClone(x)]));
  private medications = new Map<string, Medication>(seedMedications.map((x) => [x.id, structuredClone(x)]));
  private doses = new Map<string, Dose>(seedDoses.map((x) => [x.id, structuredClone(x)]));
  private appointments = new Map<string, Appointment>(seedAppointments.map((x) => [x.id, structuredClone(x)]));
  private notes = new Map<string, VisitNote>(seedVisitNotes.map((x) => [x.id, structuredClone(x)]));
  private alerts = new Map<string, CareAlert>(seedCareAlerts.map((x) => [x.id, structuredClone(x)]));
  private tasks = new Map<string, CareTask>();
  private carePrefs = new Map<string, CareNotificationPrefs>();
  private products = new Map<string, Product>(seedProducts.map((x) => [x.id, structuredClone(x)]));
  private orders = new Map<string, ShopOrder>(seedShopOrders.map((x) => [x.id, structuredClone(x)]));
  private spending = new Map<string, ShopSpending>(seedShopSpending.map((x) => [x.id, structuredClone(x)]));
  private itemDonations = new Map<string, StoredItemDonation>(seedItemDonations.map((x) => [x.id, structuredClone(x)]));
  private shopSettings: ShopSettings = clone(seedShopSettings);
  private promotions = new Map<string, Promotion>();

  constructor(seed = { cats: seedCats, pages: seedPages, posts: seedPosts, redirects: seedRedirects, settings: seedSeoSettings, partners: seedPartners }) {
    seed.partners.forEach((p) => this.partners.set(p.id, clone(p)));
    seed.cats.forEach((c) => this.cats.set(c.id, clone(c)));
    seed.pages.forEach((p) => this.pages.set(p.id, clone(p)));
    seed.posts.forEach((p) => this.posts.set(p.id, clone(p)));
    seed.redirects.forEach((r) => this.redirects.set(r.id, clone(r)));
    this.settings = clone(seed.settings);
  }

  async listCats() { return [...this.cats.values()].map(clone); }
  async getCat(id: string) { const c = this.cats.get(id); return c && clone(c); }
  async getCatBySlug(slug: string) { const c = [...this.cats.values()].find((x) => x.slug === slug); return c && clone(c); }
  async saveCat(cat: Cat) { this.cats.set(cat.id, clone(cat)); return clone(cat); }

  async listPages() { return [...this.pages.values()].map(clone); }
  async getPage(id: string) { const p = this.pages.get(id); return p && clone(p); }
  async savePage(page: Page) { this.pages.set(page.id, clone(page)); return clone(page); }

  async listPosts() { return [...this.posts.values()].map(clone); }
  async getPost(id: string) { const p = this.posts.get(id); return p && clone(p); }
  async getPostBySlug(slug: string) { const p = [...this.posts.values()].find((x) => x.slug === slug); return p && clone(p); }
  async savePost(post: Post) { this.posts.set(post.id, clone(post)); return clone(post); }
  async deletePost(id: string) { this.posts.delete(id); }

  async listPartners() { return [...this.partners.values()].map(clone); }
  async getPartner(id: string) { const p = this.partners.get(id); return p && clone(p); }
  async savePartner(partner: Partner) { this.partners.set(partner.id, clone(partner)); return clone(partner); }
  async savePartnerApplication(a: StoredPartnerApplication) { this.applications.push(clone(a)); }
  async listPartnerApplications() { return this.applications.map(clone); }

  async saveAdoptionInterest(i: StoredAdoptionInterest) { this.interests.push(clone(i)); }
  async listAdoptionInterests() { return this.interests.map(clone); }

  async getImpact() { return clone(this.impact); }
  async saveImpact(impact: Impact) { this.impact = clone(impact); return clone(impact); }
  async saveNewsletterSignup(s: NewsletterSignup & { subscribedAt: string }) { this.newsletter.set(s.email.toLowerCase(), clone({ ...s, email: s.email.toLowerCase() })); }
  async listNewsletterSignups() { return [...this.newsletter.values()].map(clone); }
  async deleteNewsletterSignup(email: string) { this.newsletter.delete(email.toLowerCase()); }

  async listPromotions() { return [...this.promotions.values()].sort((a, b) => a.eventStartsAt.localeCompare(b.eventStartsAt)).map(clone); }
  async getPromotion(id: string) { const x = this.promotions.get(id); return x && clone(x); }
  async getPromotionByPost(postId: string) { const x = [...this.promotions.values()].find((p) => p.postId === postId); return x && clone(x); }
  async savePromotion(p: Promotion) { this.promotions.set(p.id, clone(p)); return clone(p); }

  async listShifts(range: { from?: string; to?: string } = {}) {
    return [...this.shifts.values()]
      .filter((x) => (!range.from || x.endsAt >= range.from) && (!range.to || x.startsAt <= range.to))
      .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
      .map(clone);
  }
  async getShift(id: string) { const x = this.shifts.get(id); return x && clone(x); }
  async saveShifts(shifts: Shift[]) { shifts.forEach((x) => this.shifts.set(x.id, clone(x))); }
  async deleteShift(id: string) { this.shifts.delete(id); }
  async listFosterPlacements() { return [...this.placements.values()].map(clone); }
  async saveFosterPlacement(p: FosterPlacement) { this.placements.set(p.id, clone(p)); return clone(p); }
  async listFosterApplications() { return [...this.fosterApplications.values()].sort((a, b) => b.receivedAt.localeCompare(a.receivedAt)).map(clone); }
  async saveFosterApplication(x: StoredFosterApplication) { this.fosterApplications.set(x.id, clone(x)); return clone(x); }
  async listSponsorships() { return [...this.sponsorships.values()].map(clone); }
  async saveSponsorship(x: Sponsorship) { this.sponsorships.set(x.id, clone(x)); return clone(x); }
  async listSponsorLetters(catSlug?: string) {
    return [...this.letters.values()].filter((l) => !catSlug || l.catSlug === catSlug).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(clone);
  }
  async saveSponsorLetter(l: SponsorLetter) { this.letters.set(l.id, clone(l)); return clone(l); }

  async listProducts() { return [...this.products.values()].map(clone); }
  async getProduct(id: string) { const x = this.products.get(id); return x && clone(x); }
  async getProductBySlug(slug: string) { const x = [...this.products.values()].find((p) => p.slug === slug); return x && clone(x); }
  async saveProducts(products: Product[]) { products.forEach((x) => this.products.set(x.id, clone(x))); }
  async listShopOrders() { return [...this.orders.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(clone); }
  async getShopOrder(id: string) { const x = this.orders.get(id); return x && clone(x); }
  async saveShopOrder(o: ShopOrder) { this.orders.set(o.id, clone(o)); return clone(o); }
  async listShopSpending() { return [...this.spending.values()].sort((a, b) => b.date.localeCompare(a.date)).map(clone); }
  async saveShopSpending(x: ShopSpending) { this.spending.set(x.id, clone(x)); return clone(x); }
  async deleteShopSpending(id: string) { this.spending.delete(id); }
  async listItemDonations() { return [...this.itemDonations.values()].sort((a, b) => b.receivedAt.localeCompare(a.receivedAt)).map(clone); }
  async saveItemDonation(x: StoredItemDonation) { this.itemDonations.set(x.id, clone(x)); return clone(x); }
  async getShopSettings() { return clone(this.shopSettings); }
  async saveShopSettings(x: ShopSettings) { this.shopSettings = clone(x); return clone(x); }

  async getSeoSettings() { return clone(this.settings); }
  async saveSeoSettings(settings: SeoSettings) { this.settings = clone(settings); return clone(settings); }

  async listRedirects() { return [...this.redirects.values()].map(clone); }
  async saveRedirect(r: Redirect) { this.redirects.set(r.id, clone(r)); return clone(r); }
  async deleteRedirect(id: string) { this.redirects.delete(id); }

  async listCatCare() { return [...this.care.values()].map(clone); }
  async getCatCare(catId: string) { const x = this.care.get(catId); return x && clone(x); }
  async saveCatCare(c: CatCare) { this.care.set(c.catId, clone(c)); return clone(c); }
  async listMedications(catId?: string) { return [...this.medications.values()].filter((m) => !catId || m.catId === catId).map(clone); }
  async getMedication(id: string) { const x = this.medications.get(id); return x && clone(x); }
  async saveMedication(m: Medication) { this.medications.set(m.id, clone(m)); return clone(m); }
  async listDoses(range: { from: string; to: string }) { return [...this.doses.values()].filter((d) => d.date >= range.from && d.date <= range.to).map(clone); }
  async saveDose(d: Dose) { this.doses.set(d.id, clone(d)); return clone(d); }
  async deleteDose(id: string) { this.doses.delete(id); }
  async listAppointments(catId?: string) {
    return [...this.appointments.values()].filter((a) => !catId || a.catId === catId).sort((a, b) => a.startsAt.localeCompare(b.startsAt)).map(clone);
  }
  async getAppointment(id: string) { const x = this.appointments.get(id); return x && clone(x); }
  async saveAppointment(a: Appointment) { this.appointments.set(a.id, clone(a)); return clone(a); }
  async listVisitNotes(catId?: string) {
    return [...this.notes.values()].filter((n) => !catId || n.catId === catId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(clone);
  }
  async saveVisitNote(n: VisitNote) { this.notes.set(n.id, clone(n)); return clone(n); }
  async listCareAlerts(opts: { since?: string; catId?: string; limit?: number } = {}) {
    return [...this.alerts.values()]
      .filter((a) => (!opts.since || a.createdAt > opts.since) && (!opts.catId || a.catId === opts.catId))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, opts.limit ?? 100)
      .map(clone);
  }
  async saveCareAlert(a: CareAlert) { this.alerts.set(a.id, clone(a)); return clone(a); }
  async listCareTasks(filter: { status?: CareTask["status"][] } = {}) {
    return [...this.tasks.values()].filter((t) => !filter.status || filter.status.includes(t.status)).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(clone);
  }
  async getCareTask(id: string) { const x = this.tasks.get(id); return x && clone(x); }
  async saveCareTask(t: CareTask) { this.tasks.set(t.id, clone(t)); return clone(t); }
  async getCarePrefs(accountId: string) { const x = this.carePrefs.get(accountId); return x && clone(x); }
  async saveCarePrefs(accountId: string, prefs: CareNotificationPrefs) { this.carePrefs.set(accountId, clone(prefs)); return clone(prefs); }
}
