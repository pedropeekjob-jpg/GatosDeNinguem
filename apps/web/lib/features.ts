import { parseFeatures, type FeatureFlags } from "@gn/domain";

/**
 * Optional parts of the site, read when the site is built: FEATURES=patinhas,trocas,amigo (all off by default).
 * The account page follows the API's own switches instead, which it gets with the helper's page.
 */
export const features = parseFeatures(process.env.NEXT_PUBLIC_FEATURES);

/** Pages that wait for a switch, and where their old links go meanwhile. */
const featurePages: { path: string; feature: keyof FeatureFlags; to: string }[] = [
  { path: "/patinhas", feature: "patinhas", to: "/ajudar" },
];

/** Where to send a visitor who asks for a page that is switched off (none when it is on). */
export function switchedOffRedirect(pathname: string, flags: FeatureFlags = features): string | undefined {
  const path = pathname.replace(/\/+$/, "") || "/";
  return featurePages.find((p) => p.path === path && !flags[p.feature])?.to;
}
