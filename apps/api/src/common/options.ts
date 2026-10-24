import type { Account, CareAlert, Contact, PromotionChannel } from "@gn/domain";
import type { ContentRepository } from "../content/repository";
import type { PhotoStore } from "../media/photo-store";
import type { SponsorDebitProvider } from "../padrinhos/debit";
import type { PatinhasRepository } from "../patinhas/repository";

export type ApiOptions = {
  repository: ContentRepository;
  /** Helper accounts and Patinhas. Defaults to in-memory example data. */
  patinhas?: PatinhasRepository;
  /** Delivers a sign-in code by email or SMS. */
  sendLoginCode?: (to: Contact, code: string) => Promise<void>;
  /** Tells volunteers about a help request or its resolution (SMS, email, push…). Each person's mutes are already applied. */
  notifyVolunteers?: (to: Account[], alert: CareAlert) => Promise<void>;
  /** Publishes event promotions, one function per channel that is set up (Meta Graph API, Resend…). */
  promotionPublishers?: Partial<Record<PromotionChannel, PromotionPublisher>>;
  /** Monthly automatic debit for godparents (Stripe SEPA today). Without it, the team arranges payment with each person. */
  sponsorDebit?: SponsorDebitProvider;
  /** Emails a godparent news about their cat (Resend). Without it, the news is only in their area on the site. */
  sendSponsorEmail?: (to: { email: string; name: string }, message: { subject: string; text: string }) => Promise<void>;
  /** Public address of the site, used in links in promotions and emails (default: https://gatosdeninguem.pt). */
  siteUrl?: string;
  /** Signs newsletter unsubscribe links (default: the admin token). */
  unsubscribeSecret?: string;
  /** Demo only: returns the sign-in code in the response so it can be shown on screen. */
  exposeLoginCodes?: boolean;
  /** Bearer token for back office writes. Replaced by per-user login in a later phase. */
  adminToken: string;
  /** Called after any write so the public site can refresh its cached pages. */
  onContentChanged: (what: { type: "cat" | "page" | "post" | "seo" | "loja"; path?: string }) => Promise<void>;
  /** Injectable clock for tests. */
  now?: () => Date;
  logger?: false | ("log" | "error" | "warn")[];
  corsOrigins?: string[];
  /** Folder for uploaded photos (default: ./uploads). */
  uploadDir?: string;
  /** Overrides uploadDir, e.g. to keep photos in the database on hosts without a persistent disk. */
  photoStore?: PhotoStore;
  /** Public address of this API, used in uploaded photo URLs (default: from the request). */
  publicUrl?: string;
};

/** What a channel receives to publish. Photo and links are absolute addresses. */
export type PromotionMessage = {
  text: string;
  imageUrl?: string;
  link: string;
  emailSubject: string;
  emailBody: string;
  /** Email only: who gets it, each with their own unsubscribe link. */
  recipients: { email: string; unsubscribeUrl: string }[];
};
export type PromotionPublisher = (message: PromotionMessage) => Promise<{ externalId?: string; detail?: string }>;

export const API_OPTIONS = Symbol("ApiOptions");
