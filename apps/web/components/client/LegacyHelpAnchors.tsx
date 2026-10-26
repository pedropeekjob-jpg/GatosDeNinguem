"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { features } from "@/lib/features";
import { useI18n } from "@/lib/i18n/client";

/** Old links such as /ajudar#doar (campaigns, posts, shares) now open the page of their own. */
const pages: Record<string, string> = {
  "#doar": "/doar",
  "#apadrinhar": "/apadrinhar",
  "#voluntariado": "/ajudar/voluntariado",
  "#familia-temporaria": "/ajudar/familia-temporaria",
  ...(features.amigo ? { "#amigo": "/ajudar/amigo" } : {}),
};

export function LegacyHelpAnchors() {
  const router = useRouter();
  const { lang, l } = useI18n();
  useEffect(() => {
    const to = pages[window.location.hash];
    if (to) router.replace(l(to));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- l() only depends on lang
  }, [router, lang]);
  return null;
}
