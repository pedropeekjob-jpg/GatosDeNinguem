"use client";
import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** The site path of a link this app can open itself, or null for anything the browser should handle. */
function internalPath(a: HTMLAnchorElement): string | null {
  if (a.target && a.target !== "_self") return null;
  if (a.hasAttribute("download") || a.getAttribute("rel")?.includes("external")) return null;
  // A link to another language (the language menu, the footer) loads the whole page in that language.
  if (a.hasAttribute("hreflang")) return null;
  const url = new URL(a.href, location.href);
  if (url.origin !== location.origin) return null;
  let path = url.pathname;
  if (BASE && path.startsWith(BASE)) path = path.slice(BASE.length) || "/";
  // Files and routes that are not pages (sitemap, robots, API, images) load normally.
  if (path.startsWith("/api/") || /\.[a-z0-9]+$/i.test(path)) return null;
  // Same page, only a different #section: let the browser scroll.
  if (url.hash && url.pathname === location.pathname && url.search === location.search) return null;
  return path + url.search + url.hash;
}

/**
 * Our shared components render plain <a> links, which reload the whole page: the next page flashed, then the
 * loader, then the page again. This opens internal links inside the app instead, preloads them on hover or
 * touch, and cross-fades between pages (View Transitions) unless the visitor asks for reduced motion.
 */
export function ClientNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const pending = useRef<(() => void) | undefined>(undefined);

  // The new page is on screen: let the cross-fade finish.
  useEffect(() => { pending.current?.(); pending.current = undefined; }, [pathname]);

  useEffect(() => {
    const anchor = (e: Event) => (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;

    function onClick(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = anchor(e);
      const path = a && internalPath(a);
      if (!path) return;
      e.preventDefault();
      const samePage = path.split(/[?#]/)[0] === (location.pathname.slice(BASE.length) || "/");
      const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (samePage || reduced || !document.startViewTransition) {
        router.push(path);
        return;
      }
      document.startViewTransition(() => new Promise<void>((resolve) => {
        pending.current = resolve;
        setTimeout(resolve, 1500); // never hold the old page on screen for long
        router.push(path);
      }));
    }

    function onIntent(e: Event) {
      const a = anchor(e);
      const path = a && internalPath(a);
      if (path) router.prefetch(path.split("#")[0]!);
    }

    document.addEventListener("click", onClick);
    document.addEventListener("pointerenter", onIntent, { capture: true, passive: true });
    document.addEventListener("touchstart", onIntent, { capture: true, passive: true });
    document.addEventListener("focusin", onIntent);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("pointerenter", onIntent, { capture: true });
      document.removeEventListener("touchstart", onIntent, { capture: true });
      document.removeEventListener("focusin", onIntent);
    };
  }, [router]);

  return null;
}
