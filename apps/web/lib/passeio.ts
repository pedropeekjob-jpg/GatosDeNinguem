/**
 * The strolling cat: now and then the logo's cat walks into the bottom right corner, says the name of a real cat up
 * for adoption and lies there a while. Tapping it (or pointing at it) shows that cat's card. How often it comes is
 * set in the back office (Avisos); "Agora não" sends it away for the rest of the visit.
 */

/** Optional part of the site; on unless the site is built with GATO_PASSEIO=0. */
export const strollingCatOn = process.env.NEXT_PUBLIC_GATO_PASSEIO !== "0";

export const STROLL = {
  /** The first one comes a few seconds into a visit, once people have seen the page. */
  firstAfterMs: 8_000,
  /** Between one cat leaving and the next one coming in, unless the back office says otherwise. */
  gapMs: 60_000,
};

/** Pages where it never walks, on top of the new-cat pop-up's quiet pages: giving money and signing up are focus moments. */
export const STROLL_QUIET = [/^\/doar/, /^\/ajudar\/(doar|amigo|voluntariado)/, /^\/apadrinhar/, /^\/parceiros/];

export type StrollState = {
  /** When this visit started (ms). */
  visitStart: number;
  /** When the last cat left the screen (ms), if any. */
  lastWalk?: number;
  /** "Agora não" was chosen in this visit. */
  declined?: boolean;
};

/** How long to wait before the next walk, or null when there is none (after "Agora não"). */
export function nextWalkIn(s: StrollState, now: number, gapMs = STROLL.gapMs): number | null {
  if (s.declined) return null;
  const due = Math.max(s.visitStart + STROLL.firstAfterMs, (s.lastWalk ?? 0) + gapMs);
  return Math.max(0, due - now);
}

/** Which cat walks next: the ones waiting longest first, then round again, starting after the last one shown. */
export function pickCat<T extends { slug: string; listedAt?: string }>(cats: T[], lastSlug?: string): T | undefined {
  const order = [...cats].sort((a, b) => (a.listedAt ?? "").localeCompare(b.listedAt ?? ""));
  const i = order.findIndex((c) => c.slug === lastSlug);
  return order[(i + 1) % order.length];
}
