import type { ContentRepository } from "../content/repository";

export type ApiOptions = {
  repository: ContentRepository;
  /** Bearer token for back office writes. Replaced by per-user login in a later phase. */
  adminToken: string;
  /** Called after any write so the public site can refresh its cached pages. */
  onContentChanged: (what: { type: "cat" | "page" | "post" | "seo"; path?: string }) => Promise<void>;
  /** Injectable clock for tests. */
  now?: () => Date;
  logger?: false | ("log" | "error" | "warn")[];
  corsOrigins?: string[];
};

export const API_OPTIONS = Symbol("ApiOptions");
