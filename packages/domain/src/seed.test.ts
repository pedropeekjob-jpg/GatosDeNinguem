import { describe, expect, it } from "vitest";
import { catSchema, pageSchema, partnerSchema, postSchema, publicHappyEnding, redirectSchema, seoSettingsSchema } from "./index";
import { seedCats, seedPages, seedPartners, seedPosts, seedRedirects, seedSeoSettings } from "./seed";

describe("seed data", () => {
  it("is valid against the schemas", () => {
    for (const cat of seedCats) expect(() => catSchema.parse(cat)).not.toThrow();
    for (const page of seedPages) expect(() => pageSchema.parse(page)).not.toThrow();
    for (const post of seedPosts) expect(() => postSchema.parse(post)).not.toThrow();
    for (const partner of seedPartners) expect(() => partnerSchema.parse(partner)).not.toThrow();
    for (const r of seedRedirects) expect(() => redirectSchema.parse(r)).not.toThrow();
    expect(() => seoSettingsSchema.parse(seedSeoSettings)).not.toThrow();
  });

  it("has unique cat slugs", () => {
    const slugs = seedCats.map((c) => c.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});

describe("publicHappyEnding", () => {
  it("shows adopter details only with consent", () => {
    const withConsent = seedCats.find((c) => c.slug === "bolacha")!;
    const without = seedCats.find((c) => c.slug === "lua")!;
    expect(publicHappyEnding(withConsent)?.adopterName).toBe("Família Correia");
    expect(publicHappyEnding(without)?.adopterName).toBeUndefined();
    expect(publicHappyEnding(without)?.text).toMatch(/janela/);
  });

  it("is empty for cats that are not adopted", () => {
    expect(publicHappyEnding(seedCats.find((c) => c.slug === "mia")!)).toBeUndefined();
  });
});
