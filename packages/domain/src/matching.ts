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

/** The reasons, worded in one language. Portuguese by default; the site passes its own for other languages. */
export type MatchWords = {
  noKids: (name: string) => string;
  onlyCat: (name: string) => string;
  noDogs: (name: string) => string;
  needsCare: (name: string, needs: string) => string;
  likesKids: (name: string) => string;
  likesCats: (name: string) => string;
  likesDogs: (name: string) => string;
  quietHome: string;
  calm: (name: string) => string;
  active: (name: string) => string;
  seniorTime: (name: string) => string;
  careHelp: (needs: string) => string;
  unknown: string;
  goodCompany: (name: string) => string;
};

export const ptMatchWords: MatchWords = {
  noKids: (n) => `${n} prefere uma casa sem crianças.`,
  onlyCat: (n) => `${n} prefere ser o único gato da casa.`,
  noDogs: (n) => `${n} não se dá bem com cães.`,
  needsCare: (n, needs) => `${n} precisa de cuidados especiais: ${needs}.`,
  likesKids: (n) => `${n} gosta de crianças.`,
  likesCats: (n) => `${n} dá-se bem com outros gatos.`,
  likesDogs: (n) => `${n} dá-se bem com cães.`,
  quietHome: "A sua casa é tranquila, sem outros animais nem crianças.",
  calm: (n) => `${n} é calmo, como procura.`,
  active: (n) => `${n} é ativo e brincalhão, como procura.`,
  seniorTime: (n) => `Tem tempo para dar a ${n} a companhia que um gato sénior merece.`,
  careHelp: (needs) => `Ajudamos com os cuidados especiais: ${needs}.`,
  unknown: "Ainda não sabemos como reage a todos os membros da sua casa. Falamos sobre isso na visita.",
  goodCompany: (n) => `${n} pode ser uma boa companhia. Venha conhecê-lo.`,
};

/**
 * Compatibility between one cat and one home. A "match" means the cat suits the
 * home, never that the adoption is approved: that still goes through the team.
 */
export function matchCat(cat: MatchableCat, home: AdopterProfile, w: MatchWords = ptMatchWords): MatchResult {
  const blockers: string[] = [];
  if (home.hasKids && cat.goodWithKids === false) blockers.push(w.noKids(cat.name));
  if (home.hasCats && cat.goodWithCats === false) blockers.push(w.onlyCat(cat.name));
  if (home.hasDogs && cat.goodWithDogs === false) blockers.push(w.noDogs(cat.name));
  if (cat.specialNeeds && !home.openToSpecialNeeds) blockers.push(w.needsCare(cat.name, cat.specialNeeds));
  if (blockers.length > 0) return { level: "nao-combina", score: 0, reasons: blockers };

  let score = 60;
  const reasons: string[] = [];

  const household: Array<[boolean, boolean | undefined, (name: string) => string]> = [
    [home.hasKids, cat.goodWithKids, w.likesKids],
    [home.hasCats, cat.goodWithCats, w.likesCats],
    [home.hasDogs, cat.goodWithDogs, w.likesDogs],
  ];
  let unknown = false;
  for (const [present, good, label] of household) {
    if (!present) continue;
    if (good === true) {
      score += 8;
      reasons.push(label(cat.name));
    } else {
      unknown = true;
    }
  }
  if (!home.hasKids && !home.hasCats && !home.hasDogs) {
    score += 8;
    reasons.push(w.quietHome);
  }

  if (home.energyPreference !== "tanto-faz") {
    if (cat.energy === home.energyPreference) {
      score += 15;
      reasons.push(home.energyPreference === "calmo" ? w.calm(cat.name) : w.active(cat.name));
    } else if (cat.energy !== "equilibrado") {
      score -= 15;
    }
  }

  if (cat.energy === "ativo" && home.timeAtHome === "pouco") score -= 15;
  if (home.timeAtHome === "muito") {
    score += 5;
    if (isSenior(cat)) {
      score += 5;
      reasons.push(w.seniorTime(cat.name));
    }
  }

  if (cat.specialNeeds) reasons.push(w.careHelp(cat.specialNeeds));
  if (unknown) reasons.push(w.unknown);
  if (reasons.length === 0) reasons.push(w.goodCompany(cat.name));

  score = Math.max(0, Math.min(100, score));
  const level: MatchLevel = score >= SUPER_MATCH_THRESHOLD && !unknown ? "super-match" : "match";
  return { level, score, reasons };
}

export type RankedCat<T extends MatchableCat = Cat> = { cat: T; match: MatchResult };

/** Cats looking for a family that suit this home, best first. */
export function rankCats<T extends MatchableCat>(cats: T[], home: AdopterProfile, w: MatchWords = ptMatchWords): RankedCat<T>[] {
  const overlooked = (cat: MatchableCat) => (isSenior(cat) || cat.specialNeeds ? 1 : 0);
  return cats
    .filter((cat) => cat.status === "para-adocao")
    .map((cat) => ({ cat, match: matchCat(cat, home, w) }))
    .filter((r) => r.match.level !== "nao-combina")
    .sort((a, b) => b.match.score - a.match.score || overlooked(b.cat) - overlooked(a.cat));
}
