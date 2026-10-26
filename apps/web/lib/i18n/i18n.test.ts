import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
// @ts-expect-error plain JavaScript script
import { twins } from "../../scripts/lang-pages.mjs";
import { isPortugueseOnly, localize, splitLang } from "./config";
import { catFilters, contactTopics, describeAlertFilters, eventWhen, translateError } from "./labels";
import { i18nFor } from "./t";

describe("addresses in each language", () => {
  it("puts the language in front of site paths", () => {
    expect(localize("/", "en")).toBe("/en");
    expect(localize("/adotar/nina", "fr")).toBe("/fr/adotar/nina");
    expect(localize("/doar?valor=10#iban", "es")).toBe("/es/doar?valor=10#iban");
    expect(localize("/adotar", "pt")).toBe("/adotar");
  });

  it("leaves Portuguese-only pages, files, other sites and already localized paths alone", () => {
    expect(localize("/conta/afilhados", "en")).toBe("/conta/afilhados");
    expect(localize("/privacidade", "fr")).toBe("/privacidade");
    expect(localize("/fotos/nina.webp", "es")).toBe("/fotos/nina.webp");
    expect(localize("https://www.facebook.com/x", "en")).toBe("https://www.facebook.com/x");
    expect(localize("/en/adotar", "en")).toBe("/en/adotar");
    expect(isPortugueseOnly("/patinhas")).toBe(true);
    expect(isPortugueseOnly("/adotar")).toBe(false);
  });

  it("reads the language from a path", () => {
    expect(splitLang("/en")).toEqual(["en", "/"]);
    expect(splitLang("/fr/loja/caneca")).toEqual(["fr", "/loja/caneca"]);
    expect(splitLang("/adotar")).toEqual(["pt", "/adotar"]);
    // a Portuguese page whose name starts like a language code
    expect(splitLang("/english-cats")).toEqual(["pt", "/english-cats"]);
  });

  it("t() and l() follow the language", () => {
    const { t, l } = i18nFor("es");
    expect(t({ pt: "Adotar", en: "Adopt", es: "Adoptar", fr: "Adopter" })).toBe("Adoptar");
    expect(l("/ajudar")).toBe("/es/ajudar");
  });
});

describe("words from the shared rules", () => {
  it("names every filter and topic in every language", () => {
    for (const lang of ["en", "es", "fr"] as const) {
      expect(catFilters(lang).every((f) => f.label && f.label.length > 0)).toBe(true);
      expect(Object.values(contactTopics[lang]).every(Boolean)).toBe(true);
    }
  });

  it("translates form messages, with a plain fallback for new ones", () => {
    expect(translateError("en", "Indique um email válido")).toBe("Please enter a valid email");
    expect(translateError("fr", "O valor mínimo é 5 euros por mês")).toBe("Le minimum est de 5 euros par mois");
    expect(translateError("es", "Uma mensagem nova")).toBe("Revise este campo");
    expect(translateError("pt", "Indique um email válido")).toBe("Indique um email válido");
  });

  it("describes alert choices and event dates in the visitor's language", () => {
    expect(describeAlertFilters("en", { ages: ["bebe"], sexes: ["femea"], withKids: true, withCats: false, withDogs: false })).toBe("Kittens · females · good with children");
    expect(eventWhen("fr", { startsAt: "2026-11-14T10:00:00Z" })).toMatch(/novembre/);
  });
});

describe("pages under /en, /es and /fr", () => {
  it("exist for every public page and are up to date (run node scripts/lang-pages.mjs)", () => {
    const expected = twins() as { path: string; body: string }[];
    expect(expected.length).toBeGreaterThan(20);
    for (const { path, body } of expected) {
      expect(existsSync(path), path).toBe(true);
      expect(readFileSync(path, "utf8"), path).toBe(body);
    }
  });
});
