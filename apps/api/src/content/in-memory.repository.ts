import { seedFosterPlacements, seedShifts, seedSponsorships, type FosterPlacement, type Shift, type Sponsorship } from "@gn/domain";
import { seedCats, seedImpact, seedPages, seedPartners, seedPosts, seedRedirects, seedSeoSettings, type Cat, type Impact, type NewsletterSignup, type Page, type Partner, type Post, type Redirect, type SeoSettings } from "@gn/domain";
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
  private sponsorships = new Map<string, Sponsorship>(seedSponsorships.map((x) => [x.id, structuredClone(x)]));
  private impact: Impact = clone(seedImpact);
  private newsletter = new Map<string, NewsletterSignup & { subscribedAt: string }>();

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
  async saveNewsletterSignup(s: NewsletterSignup & { subscribedAt: string }) { this.newsletter.set(s.email.toLowerCase(), clone(s)); }

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
  async listSponsorships() { return [...this.sponsorships.values()].map(clone); }
  async saveSponsorship(x: Sponsorship) { this.sponsorships.set(x.id, clone(x)); return clone(x); }

  async getSeoSettings() { return clone(this.settings); }
  async saveSeoSettings(settings: SeoSettings) { this.settings = clone(settings); return clone(settings); }

  async listRedirects() { return [...this.redirects.values()].map(clone); }
  async saveRedirect(r: Redirect) { this.redirects.set(r.id, clone(r)); return clone(r); }
  async deleteRedirect(id: string) { this.redirects.delete(id); }
}
