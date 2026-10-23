import type { Appointment, CareAlert, CareNotificationPrefs, CareTask, CatCare, Dose, Medication, VisitNote } from "@gn/domain";
import type { FosterPlacement, Shift, Sponsorship, StoredFosterApplication } from "@gn/domain";
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

  listShifts(range?: { from?: string; to?: string }): Promise<Shift[]>;
  getShift(id: string): Promise<Shift | undefined>;
  saveShifts(shifts: Shift[]): Promise<void>;
  deleteShift(id: string): Promise<void>;
  listFosterPlacements(): Promise<FosterPlacement[]>;
  saveFosterPlacement(p: FosterPlacement): Promise<FosterPlacement>;
  /** "Quero ser família temporária" requests. Newest first. */
  listFosterApplications(): Promise<StoredFosterApplication[]>;
  saveFosterApplication(a: StoredFosterApplication): Promise<StoredFosterApplication>;
  listSponsorships(): Promise<Sponsorship[]>;
  saveSponsorship(s: Sponsorship): Promise<Sponsorship>;

  getSeoSettings(): Promise<SeoSettings>;
  saveSeoSettings(settings: SeoSettings): Promise<SeoSettings>;

  listRedirects(): Promise<Redirect[]>;
  saveRedirect(redirect: Redirect): Promise<Redirect>;
  deleteRedirect(id: string): Promise<void>;

  // Cuidados (team only)
  listCatCare(): Promise<CatCare[]>;
  getCatCare(catId: string): Promise<CatCare | undefined>;
  saveCatCare(care: CatCare): Promise<CatCare>;
  listMedications(catId?: string): Promise<Medication[]>;
  getMedication(id: string): Promise<Medication | undefined>;
  saveMedication(m: Medication): Promise<Medication>;
  listDoses(range: { from: string; to: string }): Promise<Dose[]>;
  saveDose(d: Dose): Promise<Dose>;
  deleteDose(id: string): Promise<void>;
  listAppointments(catId?: string): Promise<Appointment[]>;
  getAppointment(id: string): Promise<Appointment | undefined>;
  saveAppointment(a: Appointment): Promise<Appointment>;
  listVisitNotes(catId?: string): Promise<VisitNote[]>;
  saveVisitNote(n: VisitNote): Promise<VisitNote>;
  /** Newest first. */
  listCareAlerts(opts?: { since?: string; catId?: string; limit?: number }): Promise<CareAlert[]>;
  saveCareAlert(a: CareAlert): Promise<CareAlert>;
  /** Help requests ("Não consigo dar"). Newest first. */
  listCareTasks(filter?: { status?: CareTask["status"][] }): Promise<CareTask[]>;
  getCareTask(id: string): Promise<CareTask | undefined>;
  saveCareTask(t: CareTask): Promise<CareTask>;
  /** Each volunteer's notification settings, by account id. */
  getCarePrefs(accountId: string): Promise<CareNotificationPrefs | undefined>;
  saveCarePrefs(accountId: string, prefs: CareNotificationPrefs): Promise<CareNotificationPrefs>;
}

export const CONTENT_REPOSITORY = Symbol("ContentRepository");
