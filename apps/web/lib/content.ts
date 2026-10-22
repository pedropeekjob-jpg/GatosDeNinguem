import "server-only";
import {
  challengeProgress,
  currentChallenges,
  defaultPointsRules,
  earnedTotal,
  freeSpots,
  levelFor,
  levels,
  seedAccounts,
  seedBadges,
  seedChallenges,
  seedEntries,
  wallName,
  type Badge,
  type Challenge,
  type Level,
  type PointsRule,
  openNeeds,
  publicHappyEnding,
  seedCats,
  seedImpact,
  seedPages,
  seedPartners,
  seedPosts,
  seedRedirects,
  seedSeoSettings,
  seedFosterPlacements,
  seedShifts,
  sortNewestFirst,
  type Cat,
  type Impact,
  type Page,
  type Partner,
  type Post,
  type Redirect,
  type SeoSettings,
  type Shift,
} from "@gn/domain";

/**
 * All public content comes through here. With API_URL set it reads from the API
 * (cached, refreshed when the back office saves). Without it, it serves the demo
 * content so the site runs and tests with no backend.
 */
const API_URL = process.env.API_URL;
export const CONTENT_TAG = "content";

export type PublicCat = Omit<Cat, "happyEnding"> & { happyEnding?: ReturnType<typeof publicHappyEnding> };
export type HappyEndingItem = { cat: PublicCat; happyEnding: NonNullable<ReturnType<typeof publicHappyEnding>> | null };

async function api<T>(path: string): Promise<T | undefined> {
  const res = await fetch(`${API_URL}${path}`, { next: { revalidate: 300, tags: [CONTENT_TAG] } });
  if (res.status === 404) return undefined;
  if (!res.ok) throw new Error(`API ${path} respondeu ${res.status}`);
  return (await res.json()) as T;
}

const toPublic = (cat: Cat): PublicCat => {
  const { happyEnding: _private, ...rest } = cat;
  return { ...rest, happyEnding: publicHappyEnding(cat) };
};

export async function getSeoSettings(): Promise<SeoSettings> {
  return API_URL ? (await api<SeoSettings>("/seo/settings"))! : seedSeoSettings;
}

export async function getPage(path: string): Promise<Page> {
  // Pages added in a new release show their default text until the team edits them.
  const page = (API_URL ? await api<Page>(`/pages?path=${encodeURIComponent(path)}`) : undefined) ?? seedPages.find((p) => p.path === path);
  if (!page) throw new Error(`Página ${path} não existe no conteúdo`);
  return page;
}

export async function listPages(): Promise<Page[]> {
  return API_URL ? (await api<Page[]>("/pages"))! : seedPages;
}

export async function listCats(status?: Cat["status"]): Promise<PublicCat[]> {
  if (API_URL) return (await api<PublicCat[]>(`/cats${status ? `?status=${status}` : ""}`))!;
  return seedCats.filter((c) => !status || c.status === status).map(toPublic);
}

export async function getCat(slug: string): Promise<PublicCat | undefined> {
  if (API_URL) return api<PublicCat>(`/cats/${encodeURIComponent(slug)}`);
  const cat = seedCats.find((c) => c.slug === slug);
  return cat && toPublic(cat);
}

export async function listHappyEndings(): Promise<HappyEndingItem[]> {
  if (API_URL) return (await api<HappyEndingItem[]>("/cats/finais-felizes"))!;
  return seedCats
    .filter((c) => c.status === "adotado")
    .sort((a, b) => (b.adoptedAt ?? "").localeCompare(a.adoptedAt ?? ""))
    .map((c) => ({ cat: toPublic(c), happyEnding: publicHappyEnding(c) ?? null }));
}

export async function listPosts(): Promise<Post[]> {
  return API_URL ? (await api<Post[]>("/posts"))! : sortNewestFirst(seedPosts);
}

export async function getPost(slug: string): Promise<Post | undefined> {
  return API_URL ? api<Post>(`/posts/${encodeURIComponent(slug)}`) : seedPosts.find((p) => p.slug === slug);
}

export async function listPartners(): Promise<Partner[]> {
  return API_URL ? (await api<Partner[]>("/partners"))! : seedPartners.filter((p) => p.active);
}

export async function getImpact(): Promise<Impact> {
  return API_URL ? (await api<Impact>("/impact"))! : seedImpact;
}

export async function listRedirects(): Promise<Redirect[]> {
  return API_URL ? (await api<Redirect[]>("/seo/redirects"))! : seedRedirects;
}

/** A shift as the public sees it: how many places are left, never who signed up. */
export type PublicShift = Omit<Shift, "signups"> & { taken: number; free: number };

/**
 * Upcoming shifts with free places. Not cached for long: places fill up.
 * Demo mode pretends today is 1 Nov 2026 (or DEMO_NOW) so the example shifts are always upcoming.
 */
export async function listOpenShifts(): Promise<PublicShift[]> {
  if (API_URL) {
    const res = await fetch(`${API_URL}/escalas/vagas`, { next: { revalidate: 60 } });
    if (!res.ok) throw new Error(`API /escalas/vagas respondeu ${res.status}`);
    const needs = (await res.json()) as { kind: string; shift?: PublicShift }[];
    return needs.flatMap((n) => (n.kind === "turno" && n.shift ? [n.shift] : []));
  }
  const now = new Date(process.env.DEMO_NOW ?? "2026-11-01T09:00:00.000Z");
  return openNeeds(seedShifts, seedFosterPlacements, now, 30).flatMap((n) =>
    n.kind === "turno" ? [{ ...withoutSignups(n.shift), taken: n.shift.signups.length, free: freeSpots(n.shift) }] : [],
  );
}

const withoutSignups = ({ signups: _private, ...shift }: Shift) => shift;

/** The public Patinhas page: ways to earn, levels, badges, this month's challenge and the opt-in thanks wall. */
export type PatinhasSummary = {
  levels: Level[];
  waysToEarn: PointsRule[];
  badges: Badge[];
  challenges: { challenge: Challenge; progress: number }[];
  wall: { name: string; levelName: string }[];
};

export async function getPatinhasSummary(): Promise<PatinhasSummary> {
  if (API_URL) {
    const res = await fetch(`${API_URL}/patinhas`, { next: { revalidate: 300, tags: [CONTENT_TAG] } });
    if (!res.ok) throw new Error(`API /patinhas respondeu ${res.status}`);
    return (await res.json()) as PatinhasSummary;
  }
  const now = new Date();
  return {
    levels,
    waysToEarn: defaultPointsRules.filter((r) => r.active),
    badges: seedBadges,
    challenges: currentChallenges(seedChallenges, now).map((challenge) => ({ challenge, progress: challengeProgress(challenge, seedEntries) })),
    wall: seedAccounts
      .filter((a) => a.showOnWall)
      .map((a) => ({ name: wallName(a), levelName: levelFor(earnedTotal(seedEntries.filter((e) => e.accountId === a.id))).name })),
  };
}
