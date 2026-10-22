import { isSenior, type Cat } from "./content";

export type AdopterProfile = {
  hasKids: boolean;
  hasCats: boolean;
  hasDogs: boolean;
  timeAtHome: "pouco" | "algum" | "muito";
  energyPreference: "calmo" | "ativo" | "tanto-faz";
  openToSpecialNeeds: boolean;
};

/** Any cat shape that carries the matching fields (public or full record). */
export type MatchableCat = Omit<Cat, "happyEnding">;

export type MatchLevel = "super-match" | "match" | "nao-combina";

export type MatchResult = {
  level: MatchLevel;
  /** 0 to 100. Only meaningful when level is not "nao-combina". */
  score: number;
  /** Plain-language reasons shown to the adopter ("Combina contigo porque..."). */
  reasons: string[];
};

const SUPER_MATCH_THRESHOLD = 85;

/**
 * Compatibility between one cat and one home. A "match" means the cat suits the
 * home, never that the adoption is approved: that still goes through the team.
 */
export function matchCat(cat: MatchableCat, home: AdopterProfile): MatchResult {
  const blockers: string[] = [];
  if (home.hasKids && cat.goodWithKids === false) blockers.push(`${cat.name} prefere uma casa sem crianças.`);
  if (home.hasCats && cat.goodWithCats === false) blockers.push(`${cat.name} prefere ser o único gato da casa.`);
  if (home.hasDogs && cat.goodWithDogs === false) blockers.push(`${cat.name} não se dá bem com cães.`);
  if (cat.specialNeeds && !home.openToSpecialNeeds) blockers.push(`${cat.name} precisa de cuidados especiais: ${cat.specialNeeds}.`);
  if (blockers.length > 0) return { level: "nao-combina", score: 0, reasons: blockers };

  let score = 60;
  const reasons: string[] = [];

  const household: Array<[boolean, boolean | undefined, string]> = [
    [home.hasKids, cat.goodWithKids, "gosta de crianças"],
    [home.hasCats, cat.goodWithCats, "dá-se bem com outros gatos"],
    [home.hasDogs, cat.goodWithDogs, "dá-se bem com cães"],
  ];
  let unknown = false;
  for (const [present, good, label] of household) {
    if (!present) continue;
    if (good === true) {
      score += 8;
      reasons.push(`${cat.name} ${label}.`);
    } else {
      unknown = true;
    }
  }
  if (!home.hasKids && !home.hasCats && !home.hasDogs) {
    score += 8;
    reasons.push("A sua casa é tranquila, sem outros animais nem crianças.");
  }

  if (home.energyPreference !== "tanto-faz") {
    if (cat.energy === home.energyPreference) {
      score += 15;
      reasons.push(home.energyPreference === "calmo" ? `${cat.name} é calmo, como procura.` : `${cat.name} é ativo e brincalhão, como procura.`);
    } else if (cat.energy !== "equilibrado") {
      score -= 15;
    }
  }

  if (cat.energy === "ativo" && home.timeAtHome === "pouco") score -= 15;
  if (home.timeAtHome === "muito") {
    score += 5;
    if (isSenior(cat)) {
      score += 5;
      reasons.push(`Tem tempo para dar a ${cat.name} a companhia que um gato sénior merece.`);
    }
  }

  if (cat.specialNeeds) reasons.push(`Ajudamos com os cuidados especiais: ${cat.specialNeeds}.`);
  if (unknown) reasons.push("Ainda não sabemos como reage a todos os membros da sua casa. Falamos sobre isso na visita.");
  if (reasons.length === 0) reasons.push(`${cat.name} pode ser uma boa companhia. Venha conhecê-lo.`);

  score = Math.max(0, Math.min(100, score));
  const level: MatchLevel = score >= SUPER_MATCH_THRESHOLD && !unknown ? "super-match" : "match";
  return { level, score, reasons };
}

export type RankedCat<T extends MatchableCat = Cat> = { cat: T; match: MatchResult };

/** Cats looking for a family that suit this home, best first. */
export function rankCats<T extends MatchableCat>(cats: T[], home: AdopterProfile): RankedCat<T>[] {
  const overlooked = (cat: MatchableCat) => (isSenior(cat) || cat.specialNeeds ? 1 : 0);
  return cats
    .filter((cat) => cat.status === "para-adocao")
    .map((cat) => ({ cat, match: matchCat(cat, home) }))
    .filter((r) => r.match.level !== "nao-combina")
    .sort((a, b) => b.match.score - a.match.score || overlooked(b.cat) - overlooked(a.cat));
}
