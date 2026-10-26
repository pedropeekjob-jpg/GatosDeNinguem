/**
 * The strolling cat: now and then a cat drawn like the one in the logo walks along the bottom of the screen, stops,
 * says the name of a real cat up for adoption, and walks on. Tapping it (or pointing at it) shows that cat's card.
 * These rules keep it rare, so it stays a nice surprise and never gets in the way.
 */

/** Optional part of the site; on unless the site is built with GATO_PASSEIO=0. */
export const strollingCatOn = process.env.NEXT_PUBLIC_GATO_PASSEIO !== "0";

export const STROLL = {
  /** Never in the first seconds of a visit: people first look at the page. */
  firstAfterMs: 20_000,
  /** At least this long between two walks. */
  gapMs: 150_000,
  /** At most this many walks per visit. */
  perVisit: 3,
  /** "Agora não" hides it for this long. */
  pauseMs: 3 * 24 * 60 * 60 * 1000,
};

/** Pages where it never walks, on top of the new-cat pop-up's quiet pages: giving money and signing up are focus moments. */
export const STROLL_QUIET = [/^\/doar/, /^\/ajudar\/(doar|amigo|voluntariado)/, /^\/apadrinhar/, /^\/parceiros/];

export type StrollState = {
  /** When this visit started (ms). */
  visitStart: number;
  /** Walks so far in this visit. */
  walks: number;
  /** When the last walk started (ms), if any. */
  lastWalk?: number;
  /** Hidden with "Agora não" until then (ms). */
  pausedUntil?: number;
  /** The new-cat pop-up already showed in this visit: one cat surprise per visit is enough. */
  newCatShown: boolean;
};

/** How long to wait before the next walk, or null when there is none left in this visit. */
export function nextWalkIn(s: StrollState, now: number): number | null {
  if (s.newCatShown || s.walks >= STROLL.perVisit) return null;
  if (s.pausedUntil && s.pausedUntil > now) return null;
  const due = Math.max(s.visitStart + STROLL.firstAfterMs, (s.lastWalk ?? 0) + STROLL.gapMs);
  return Math.max(0, due - now);
}

/** Which cat walks next: the ones waiting longest first, then round again, starting after the last one shown. */
export function pickCat<T extends { slug: string; listedAt?: string }>(cats: T[], lastSlug?: string): T | undefined {
  const order = [...cats].sort((a, b) => (a.listedAt ?? "").localeCompare(b.listedAt ?? ""));
  const i = order.findIndex((c) => c.slug === lastSlug);
  return order[(i + 1) % order.length];
}
