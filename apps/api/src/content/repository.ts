import type { AdoptionInterest, Cat, Impact, NewsletterSignup, Page, Partner, PartnerApplication, Post, Redirect, SeoSettings } from "@gn/domain";

export type StoredAdoptionInterest = AdoptionInterest & { id: string; receivedAt: string };
export type StoredPartnerApplication = PartnerApplication & { id: string; receivedAt: string };

/** Storage port. The API only talks to this interface. */
export interface ContentRepository {
  listCats(): Promise<Cat[]>;
  getCatBySlug(slug: string): Promise<Cat | undefined>;
  getCat(id: string): Promise<Cat | undefined>;
  saveCat(cat: Cat): Promise<Cat>;

  listPages(): Promise<Page[]>;
  getPage(id: string): Promise<Page | undefined>;
  savePage(page: Page): Promise<Page>;

  listPosts(): Promise<Post[]>;
  getPost(id: string): Promise<Post | undefined>;
  getPostBySlug(slug: string): Promise<Post | undefined>;
  savePost(post: Post): Promise<Post>;
  deletePost(id: string): Promise<void>;

  listPartners(): Promise<Partner[]>;
  getPartner(id: string): Promise<Partner | undefined>;
  savePartner(partner: Partner): Promise<Partner>;
  savePartnerApplication(application: StoredPartnerApplication): Promise<void>;
  listPartnerApplications(): Promise<StoredPartnerApplication[]>;

  saveAdoptionInterest(interest: StoredAdoptionInterest): Promise<void>;
  listAdoptionInterests(): Promise<StoredAdoptionInterest[]>;

  getImpact(): Promise<Impact>;
  saveImpact(impact: Impact): Promise<Impact>;
  saveNewsletterSignup(signup: NewsletterSignup & { subscribedAt: string }): Promise<void>;

  getSeoSettings(): Promise<SeoSettings>;
  saveSeoSettings(settings: SeoSettings): Promise<SeoSettings>;

  listRedirects(): Promise<Redirect[]>;
  saveRedirect(redirect: Redirect): Promise<Redirect>;
  deleteRedirect(id: string): Promise<void>;
}

export const CONTENT_REPOSITORY = Symbol("ContentRepository");
