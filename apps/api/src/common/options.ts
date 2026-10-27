import type { Account, CareAlert, Contact, FeatureFlags, PromotionChannel, PushSubscriptionJson } from "@gn/domain";
import type { ContentRepository } from "../content/repository";
import type { PhotoStore } from "../media/photo-store";
import type { SponsorDebitProvider } from "../padrinhos/debit";
import type { PatinhasRepository } from "../patinhas/repository";
import type { Translator } from "../traducao/translator";

export type ApiOptions = {
  repository: ContentRepository;
  /** Parts switched on (FEATURES setting). Default: all off. */
  features?: FeatureFlags;
  /** Helper accounts and Patinhas. Defaults to in-memory example data. */
  patinhas?: PatinhasRepository;
  /** Delivers a sign-in code by email or SMS. */
  sendLoginCode?: (to: Contact, code: string) => Promise<void>;
  /** Tells volunteers about a help request or its resolution (SMS, email, push…). Each person's mutes are already applied. */
  notifyVolunteers?: (to: Account[], alert: CareAlert) => Promise<void>;
  /** Publishes event promotions, one function per channel that is set up (Meta Graph API, Resend…). */
  promotionPublishers?: Partial<Record<PromotionChannel, PromotionPublisher>>;
  /** Sends plain-text emails (Resend). Used for "Avisem-me quando chegarem gatos" confirmations and alerts. */
  sendEmail?: (emails: OutgoingEmail[]) => Promise<void>;
  /** Who receives the "Contactos" form (CONTACT_EMAIL_TO / CONTACT_EMAIL_CC). Default: gatosninguem@gmail.com, copy to gatosdeninguemvc@gmail.com. */
  contactRecipients?: ContactRecipients;
  /** Sends a Web Push notification. "gone" means the browser dropped the subscription and it can be deleted. */
  sendPush?: (to: PushSubscriptionJson, notification: PushNotification) => Promise<"ok" | "gone">;
  /** VAPID public key the site needs to subscribe a device to notifications. */
  pushPublicKey?: string;
  /** Monthly automatic debit for godparents (Stripe SEPA today). Without it, the team arranges payment with each person. */
  sponsorDebit?: SponsorDebitProvider;
  /** Emails a godparent news about their cat (Resend). Without it, the news is only in their area on the site. */
  sendSponsorEmail?: (to: { email: string; name: string }, message: { subject: string; text: string }) => Promise<void>;
  /** Translates what the team writes into English, Spanish and French when it is saved (DeepL). Without it, texts stay in Portuguese. */
  translator?: Translator;
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

export type OutgoingEmail = { to: string; cc?: string[]; replyTo?: string; subject: string; text: string; headers?: Record<string, string> };
export type ContactRecipients = { to: string; cc?: string[] };
export type PushNotification = { title: string; body: string; url: string; image?: string };

export const API_OPTIONS = Symbol("ApiOptions");
