import { describe, expect, it } from "vitest";
import { matchCat, rankCats, type AdopterProfile } from "./matching";
import { seedCats } from "./seed";
import type { Cat } from "./content";

const base: Cat = { ...seedCats[0]!, goodWithKids: undefined, goodWithCats: undefined, goodWithDogs: undefined, ageYears: 4, energy: "equilibrado" };
const quietHome: AdopterProfile = { hasKids: false, hasCats: false, hasDogs: false, timeAtHome: "muito", energyPreference: "calmo", openToSpecialNeeds: false };

describe("matchCat", () => {
  it("rules out a cat that is not good with kids for a family with kids", () => {
    const result = matchCat({ ...base, goodWithKids: false }, { ...quietHome, hasKids: true });
    expect(result.level).toBe("nao-combina");
    expect(result.reasons.join(" ")).toMatch(/crianças/);
  });

  it("rules out cats with special needs unless the adopter is open to them", () => {
    const cat = { ...base, specialNeeds: "Diabetes" };
    expect(matchCat(cat, quietHome).level).toBe("nao-combina");
    expect(matchCat(cat, { ...quietHome, openToSpecialNeeds: true }).level).not.toBe("nao-combina");
  });

  it("gives a super match when energy and household fit and everything is known", () => {
    const cat: Cat = { ...base, energy: "calmo", goodWithKids: true, goodWithCats: true, goodWithDogs: true, ageYears: 11 };
    const result = matchCat(cat, quietHome);
    expect(result.level).toBe("super-match");
    expect(result.reasons.length).toBeGreaterThan(1);
  });

  it("gives a plain match when compatibility is unknown", () => {
    const result = matchCat(base, { ...quietHome, energyPreference: "tanto-faz" });
    expect(result.level).toBe("match");
  });

  it("lowers the score when an active cat meets a home with little time", () => {
    const active = { ...base, energy: "ativo" as const };
    const busy = matchCat(active, { ...quietHome, timeAtHome: "pouco", energyPreference: "tanto-faz" });
    const free = matchCat(active, { ...quietHome, timeAtHome: "muito", energyPreference: "tanto-faz" });
    expect(busy.score).toBeLessThan(free.score);
  });

  it("always explains itself in plain Portuguese", () => {
    for (const cat of seedCats) {
      const result = matchCat(cat, quietHome);
      expect(result.reasons.length).toBeGreaterThan(0);
    }
  });
});

describe("rankCats", () => {
  it("only includes cats looking for a family and excludes non-matches", () => {
    const ranked = rankCats(seedCats, { ...quietHome, hasKids: true });
    expect(ranked.every((r) => r.cat.status === "para-adocao")).toBe(true);
    expect(ranked.some((r) => r.cat.slug === "carvao")).toBe(false);
  });

  it("orders by score and breaks ties in favour of overlooked cats (seniors, special needs)", () => {
    const young = { ...base, id: "a", slug: "a", ageYears: 2 };
    const senior = { ...base, id: "b", slug: "b", ageYears: 12 };
    const ranked = rankCats([young, senior], { ...quietHome, energyPreference: "tanto-faz" });
    expect(ranked[0]!.cat.slug).toBe("b");
  });
});
