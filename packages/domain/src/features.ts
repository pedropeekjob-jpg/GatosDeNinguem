/**
 * Parts of the site that can be switched on later, without new code.
 * All start switched off: Patinhas and the Amigo membership are still being discussed with the association,
 * and the partners for perk swaps are still being found.
 */
export type FeatureFlags = {
  /** Earning Patinhas: points, levels, badges, challenges and the thanks wall. */
  patinhas: boolean;
  /** Swapping Patinhas for partner perks. Only works together with `patinhas`. */
  trocas: boolean;
  /** "Ser Amigo da associação": the yearly membership with partner discounts. */
  amigo: boolean;
};

export const featureNames = ["patinhas", "trocas", "amigo"] as const satisfies readonly (keyof FeatureFlags)[];

export const noFeatures: FeatureFlags = { patinhas: false, trocas: false, amigo: false };
export const allFeatures: FeatureFlags = { patinhas: true, trocas: true, amigo: true };

/**
 * Reads the FEATURES setting: names separated by commas or spaces, e.g. "patinhas,trocas,amigo", or "todas".
 * Anything not named stays off.
 */
export function parseFeatures(value: string | undefined | null): FeatureFlags {
  const names = new Set((value ?? "").toLowerCase().split(/[\s,;]+/).filter(Boolean));
  const on = (name: keyof FeatureFlags) => names.has("todas") || names.has(name);
  const patinhas = on("patinhas");
  return { patinhas, trocas: patinhas && on("trocas"), amigo: on("amigo") };
}

/** The other way round, for logs and docs. */
export function formatFeatures(flags: FeatureFlags): string {
  return featureNames.filter((name) => flags[name]).join(",");
}
