import { describe, expect, it } from "vitest";
import { alertAgeGroup, alertRecipients, unseenNewCats, catAlertMessage, catAlertSignupSchema, describeAlertFilters, isExpiredPending, matchesAlertFilters, noAlertFilters } from "./alertas";

const cat = { ageYears: 2, sex: "femea" as const, goodWithKids: true, goodWithCats: undefined, goodWithDogs: false };

describe("cat alerts", () => {
  it("groups ages the way people think about them", () => {
    expect([0.5, 1, 3, 4, 9, 10, 15].map(alertAgeGroup)).toEqual(["bebe", "jovem", "jovem", "adulto", "adulto", "senior", "senior"]);
  });

  it("no preferences means every cat", () => {
    expect(matchesAlertFilters(cat, noAlertFilters)).toBe(true);
  });

  it("matches age, sex and only cats known to get on with others", () => {
    expect(matchesAlertFilters(cat, { ...noAlertFilters, ages: ["bebe", "jovem"], sexes: ["femea"], withKids: true })).toBe(true);
    expect(matchesAlertFilters(cat, { ...noAlertFilters, ages: ["senior"] })).toBe(false);
    expect(matchesAlertFilters(cat, { ...noAlertFilters, sexes: ["macho"] })).toBe(false);
    // Unknown is not a yes.
    expect(matchesAlertFilters(cat, { ...noAlertFilters, withCats: true })).toBe(false);
    expect(matchesAlertFilters(cat, { ...noAlertFilters, withDogs: true })).toBe(false);
  });

  it("only confirmed subscribers get alerts", () => {
    const subs = [
      { id: "a", status: "ativo" as const, filters: noAlertFilters },
      { id: "b", status: "pendente" as const, filters: noAlertFilters },
      { id: "c", status: "ativo" as const, filters: { ...noAlertFilters, sexes: ["macho" as const] } },
    ];
    expect(alertRecipients(cat, subs).map((s) => s.id)).toEqual(["a"]);
  });

  it("describes preferences in plain words", () => {
    expect(describeAlertFilters(noAlertFilters)).toBe("Todos os gatos");
    expect(describeAlertFilters({ ...noAlertFilters, ages: ["bebe", "jovem"], sexes: ["femea"], withKids: true, withDogs: true })).toBe("Bebés ou jovens · fêmeas · que se dão com crianças e cães");
  });

  it("needs a valid email and explicit consent", () => {
    expect(catAlertSignupSchema.safeParse({ email: "ana@exemplo.pt" }).success).toBe(false);
    expect(catAlertSignupSchema.safeParse({ email: "nao-e-email", consent: true }).success).toBe(false);
    const ok = catAlertSignupSchema.parse({ email: " ana@exemplo.pt ", consent: true });
    expect(ok).toEqual({ email: "ana@exemplo.pt", consent: true, filters: noAlertFilters });
  });

  it("drops unconfirmed sign-ups after a week", () => {
    const now = new Date("2026-10-24T12:00:00Z");
    expect(isExpiredPending({ status: "pendente", createdAt: "2026-10-16T12:00:00Z" }, now)).toBe(true);
    expect(isExpiredPending({ status: "pendente", createdAt: "2026-10-20T12:00:00Z" }, now)).toBe(false);
    expect(isExpiredPending({ status: "ativo", createdAt: "2026-01-01T12:00:00Z" }, now)).toBe(false);
  });

  it("writes the email with the cat's link", () => {
    const m = catAlertMessage({ name: "Mimi", slug: "mimi", sex: "femea", ageYears: 2, summary: "Meiga e brincalhona." }, "https://gatosdeninguem.pt/");
    expect(m.subject).toBe("Mimi procura família");
    expect(m.text).toContain("Há uma gata nova para adoção");
    expect(m.text).toContain("https://gatosdeninguem.pt/adotar/mimi");
  });
});

describe("new cat pop-up", () => {
  const now = new Date("2026-10-25T12:00:00Z");
  const cats = [
    { slug: "velho", status: "para-adocao" as const, listedAt: "2026-08-01T10:00:00Z" },
    { slug: "mimi", status: "para-adocao" as const, listedAt: "2026-10-20T10:00:00Z" },
    { slug: "tom", status: "para-adocao" as const, listedAt: "2026-10-24T10:00:00Z" },
    { slug: "reservado", status: "reservado" as const, listedAt: "2026-10-24T11:00:00Z" },
    { slug: "sem-data", status: "para-adocao" as const },
  ];
  it("shows cats listed in the last 30 days, newest first, that this visitor has not seen", () => {
    expect(unseenNewCats(cats, [], now).map((c) => c.slug)).toEqual(["tom", "mimi"]);
    expect(unseenNewCats(cats, ["tom"], now).map((c) => c.slug)).toEqual(["mimi"]);
    expect(unseenNewCats(cats, ["*"], now)).toEqual([]);
  });
});
