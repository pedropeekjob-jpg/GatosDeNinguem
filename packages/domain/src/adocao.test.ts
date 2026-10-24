import { describe, expect, it } from "vitest";
import { adoptionFaq, catFilterTags, goesHomeWith, similarCats } from "./adocao";
import { seedCats } from "./seed";
import type { Cat } from "./content";

const base: Cat = { ...seedCats[0]!, slug: "base", ageYears: 4, energy: "equilibrado", goodWithKids: undefined, goodWithCats: undefined, goodWithDogs: undefined, specialNeeds: undefined, status: "para-adocao" };
const cat = (slug: string, extra: Partial<Cat>): Cat => ({ ...base, slug, ...extra });

describe("catFilterTags", () => {
  it("tags young, kids, cats, dogs and calm only when they are known to be true", () => {
    expect(catFilterTags(cat("a", { ageYears: 1, sex: "femea", goodWithKids: true, goodWithCats: false, energy: "calmo" }))).toEqual(["jovem", "criancas", "calmo", "femea"]);
  });
  it("does not tag a cat whose compatibility is unknown", () => {
    expect(catFilterTags(base)).not.toContain("criancas");
  });
  it("tags seniors and special needs", () => {
    expect(catFilterTags(cat("b", { ageYears: 12, specialNeeds: "Diabetes" }))).toEqual(expect.arrayContaining(["senior", "cuidados"]));
  });
});

describe("similarCats", () => {
  it("never returns the cat itself or cats that cannot be adopted now", () => {
    const others = [base, cat("adotado", { status: "adotado" }), cat("recupera", { status: "a-recuperar" }), cat("ok", {})];
    expect(similarCats(base, others).map((c) => c.slug)).toEqual(["ok"]);
  });
  it("puts a senior next to other seniors first", () => {
    const senior = cat("s", { ageYears: 12, energy: "calmo" });
    const others = [cat("jovem", { ageYears: 1, energy: "ativo" }), cat("outro-senior", { ageYears: 11, energy: "calmo" })];
    expect(similarCats(senior, others)[0]!.slug).toBe("outro-senior");
  });
  it("returns at most the number asked for", () => {
    const others = Array.from({ length: 6 }, (_, i) => cat(`c${i}`, {}));
    expect(similarCats(base, others, 3)).toHaveLength(3);
  });
});

describe("goesHomeWith", () => {
  it("says plainly what the cat does not have yet", () => {
    const items = goesHomeWith({ sex: "femea", sterilized: false, vaccinated: true, microchipped: true });
    expect(items[0]).toEqual({ label: "Esterilizada", done: false });
    expect(items.find((i) => i.label === "Vacinada")?.done).toBe(true);
  });
});

describe("adoptionFaq", () => {
  it("has a question and an answer in every entry", () => {
    for (const { q, a } of adoptionFaq) { expect(q.endsWith("?") || q.endsWith(".")).toBe(true); expect(a.length).toBeGreaterThan(20); }
  });
});
