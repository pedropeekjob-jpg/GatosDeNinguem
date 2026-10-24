"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Old links such as /ajudar#doar (campaigns, posts, shares) now open the page of their own. */
const pages: Record<string, string> = {
  "#doar": "/ajudar/doar",
  "#apadrinhar": "/apadrinhar",
  "#voluntariado": "/ajudar/voluntariado",
  "#familia-temporaria": "/ajudar/familia-temporaria",
  "#amigo": "/ajudar/amigo",
};

export function LegacyHelpAnchors() {
  const router = useRouter();
  useEffect(() => {
    const to = pages[window.location.hash];
    if (to) router.replace(to);
  }, [router]);
  return null;
}
