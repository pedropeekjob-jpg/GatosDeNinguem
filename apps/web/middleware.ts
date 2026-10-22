import { NextResponse, type NextRequest } from "next/server";
import { seedRedirects, type Redirect } from "@gn/domain";
import { findRedirect } from "@gn/seo";

/**
 * Redirects managed in the back office (e.g. old Wix URLs → new pages).
 * The list is cached for a minute per server instance.
 */
let cache: { at: number; redirects: Redirect[] } | undefined;

async function redirects(): Promise<Redirect[]> {
  const api = process.env.API_URL;
  if (!api) return seedRedirects;
  if (cache && Date.now() - cache.at < 60_000) return cache.redirects;
  try {
    const res = await fetch(`${api}/seo/redirects`);
    if (res.ok) cache = { at: Date.now(), redirects: (await res.json()) as Redirect[] };
  } catch {
    /* keep serving the last known list */
  }
  return cache?.redirects ?? [];
}

export async function middleware(request: NextRequest) {
  const match = findRedirect(await redirects(), request.nextUrl.pathname);
  if (!match) return NextResponse.next();
  const target = new URL(match.to, request.url);
  return NextResponse.redirect(target, match.permanent ? 308 : 307);
}

export const config = {
  matcher: ["/((?!_next/|api/|demo/|logo.svg|favicon.ico|sitemap.xml|robots.txt).*)"],
};
