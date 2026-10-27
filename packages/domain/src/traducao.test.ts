import { describe, expect, it } from "vitest";
import { seedCats } from "./seed";
import { catTranslationSpec, translationJobs, uncheckedTranslations, withTranslations } from "./traducao";
import type { Cat } from "./content";

const cat: Cat = { ...seedCats[0]!, translations: undefined, specialNeeds: undefined, happyEnding: undefined };

describe("automatic translation of the team's texts", () => {
  it("translates every text of a new cat into the three languages", () => {
    const jobs = translationJobs(catTranslationSpec, cat);
    expect(jobs.map((j) => j.lang)).toEqual(["en", "es", "fr"]);
    expect(Object.keys(jobs[0]!.fields)).toEqual(["summary", "story", "traits"]);
  });

  it("after a change, translates only what changed in Portuguese", () => {
    const translated = withTranslations(catTranslationSpec, cat, translationJobs(catTranslationSpec, cat).map((j) => ({ ...j, fields: { ...j.fields, summary: `${j.lang} summary` } })));
    const edited = { ...translated, story: "Uma história nova." };
    const jobs = translationJobs(catTranslationSpec, edited, translated);
    expect(jobs.map((j) => Object.keys(j.fields))).toEqual([["story"], ["story"], ["story"]]);
  });

  it("never touches a translation the team wrote or corrected", () => {
    const withManual: Cat = { ...cat, translations: { en: { summary: "Hand written", story: "By the team", auto: false }, fr: { summary: "Fait main" } } };
    const jobs = translationJobs(catTranslationSpec, { ...withManual, story: "Mudou" }, withManual);
    expect(jobs.map((j) => j.lang)).toEqual(["es"]);
  });

  it("drops machine translations of a text that was removed, and marks machine work as unchecked", () => {
    const withNeeds = { ...cat, specialNeeds: "Dieta renal" };
    const translated = withTranslations(catTranslationSpec, withNeeds, [{ lang: "en", fields: { specialNeeds: "Kidney diet" } }]);
    expect(uncheckedTranslations(translated)).toEqual(["en"]);
    const cleared = withTranslations(catTranslationSpec, { ...translated, specialNeeds: undefined }, []);
    expect(cleared.translations?.en?.specialNeeds).toBeUndefined();
  });
});
