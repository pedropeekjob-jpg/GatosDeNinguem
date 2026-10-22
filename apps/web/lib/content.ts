import "server-only";
import {
  publicHappyEnding,
  seedCats,
  seedImpact,
  seedPages,
  seedPartners,
  seedPosts,
  seedRedirects,
  seedSeoSettings,
  sortNewestFirst,
  type Cat,
  type Impact,
  type Page,
  type Partner,
  type Post,
  type Redirect,
  type SeoSettings,
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
  const page = API_URL ? await api<Page>(`/pages?path=${encodeURIComponent(path)}`) : seedPages.find((p) => p.path === path);
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
