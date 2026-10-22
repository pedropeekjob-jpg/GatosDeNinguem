import type { Contact } from "@gn/domain";
import type { ContentRepository } from "../content/repository";
import type { PatinhasRepository } from "../patinhas/repository";

export type ApiOptions = {
  repository: ContentRepository;
  /** Helper accounts and Patinhas. Defaults to in-memory example data. */
  patinhas?: PatinhasRepository;
  /** Delivers a sign-in code by email or SMS. */
  sendLoginCode?: (to: Contact, code: string) => Promise<void>;
  /** Demo only: returns the sign-in code in the response so it can be shown on screen. */
  exposeLoginCodes?: boolean;
  /** Bearer token for back office writes. Replaced by per-user login in a later phase. */
  adminToken: string;
  /** Called after any write so the public site can refresh its cached pages. */
  onContentChanged: (what: { type: "cat" | "page" | "post" | "seo"; path?: string }) => Promise<void>;
  /** Injectable clock for tests. */
  now?: () => Date;
  logger?: false | ("log" | "error" | "warn")[];
  corsOrigins?: string[];
  /** Folder for uploaded photos (default: ./uploads). */
  uploadDir?: string;
  /** Public address of this API, used in uploaded photo URLs (default: from the request). */
  publicUrl?: string;
};

export const API_OPTIONS = Symbol("ApiOptions");
