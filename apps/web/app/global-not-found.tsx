import type { Metadata } from "next";
import { SiteLayout } from "@/components/SiteLayout";
import NotFound from "./(pt)/not-found";

export const metadata: Metadata = { title: "Página não encontrada | Gatos de Ninguém", robots: { index: false } };

/**
 * Addresses that match no page at all. The site has one layout per language (app/(pt), app/[lang]), so this page
 * brings its own, in Portuguese; a missing cat or article under /en, /es or /fr gets app/[lang]/not-found instead.
 */
export default function GlobalNotFound() {
  return <SiteLayout lang="pt"><NotFound /></SiteLayout>;
}
