import { describe, expect, it } from "vitest";
import {
  award,
  balance,
  buildPainel,
  canRedeem,
  challengeProgress,
  defaultPointsRules,
  earnActionSchema,
  earnedTotal,
  levelFor,
  monthStreak,
  redemptionCode,
  type PatinhasEntry,
} from "./patinhas";
import { checkLoginCode, nextCodeWindow, parseContact, signInVerifySchema, wallName } from "./contas";
import { seedBadges, seedChallenges, seedEntries, seedPartners, seedRedemptions } from "./index";

const at = new Date("2026-10-22T10:00:00.000Z");
let n = 0;
const give = (ledger: PatinhasEntry[], action: Parameters<typeof award>[2]["action"], extra: Partial<Parameters<typeof award>[2]> = {}) =>
  award(defaultPointsRules, ledger, { id: `e${++n}`, accountId: "a", action, at, ...extra });

describe("guardrails", () => {
  it("never has a way to earn points for adopting", () => {
    expect(earnActionSchema.options.some((a) => a.includes("ado"))).toBe(false);
    expect(earnActionSchema.safeParse("adocao").success).toBe(false);
  });

  it("counts every Patinhas challenge in calendar months, with no deadlines in days", () => {
    for (const c of seedChallenges) expect(c.month).toMatch(/^\d{4}-\d{2}$/);
  });
});

describe("earning", () => {
  it("pays shift points per hour", () => {
    const r = give([], "turno-hora", { quantity: 2, sourceId: "turno:1:v" });
    expect(r.ok && r.entry.points).toBe(50);
  });

  it("never counts the same shift twice", () => {
    const first = give([], "turno-hora", { quantity: 2, sourceId: "turno:1:v" });
    if (!first.ok) throw new Error();
    expect(give([first.entry], "turno-hora", { quantity: 2, sourceId: "turno:1:v" })).toEqual({ ok: false, error: "ja-registado" });
  });

  it("counts the quiz once per person", () => {
    const first = give([], "questionario");
    if (!first.ok) throw new Error();
    expect(give([first.entry], "questionario")).toEqual({ ok: false, error: "so-uma-vez" });
  });

  it("caps shares at 10 a week, and starts again on Monday", () => {
    const ledger: PatinhasEntry[] = [];
    for (let i = 0; i < 10; i++) {
      const r = give(ledger, "partilha");
      if (r.ok) ledger.push(r.entry);
    }
    expect(ledger).toHaveLength(10);
    expect(give(ledger, "partilha")).toEqual({ ok: false, error: "limite-semanal" });
    expect(give(ledger, "partilha", { at: new Date("2026-10-26T08:00:00.000Z") }).ok).toBe(true);
  });

  it("refuses actions the team switched off", () => {
    const rules = defaultPointsRules.map((r) => (r.action === "sos" ? { ...r, active: false } : r));
    expect(award(rules, [], { id: "x", accountId: "a", action: "sos", at })).toEqual({ ok: false, error: "regra-inativa" });
  });
});

describe("levels and balance", () => {
  it("climbs levels on what was earned, so taking a perk never lowers the level", () => {
    const ledger = seedEntries.filter((e) => e.accountId === "conta-1");
    expect(earnedTotal(ledger)).toBe(315);
    expect(balance(ledger)).toBe(285);
    expect(levelFor(earnedTotal(ledger)).name).toBe("Amigo de Bigodes");
    expect(levelFor(0).level).toBe(1);
    expect(levelFor(4000).name).toBe("Lenda dos Sete Fôlegos");
  });

  it("counts streaks in months, and this month only breaks it once it is over", () => {
    const ledger = seedEntries.filter((e) => e.accountId === "conta-1");
    // June, July, August, September, October.
    expect(monthStreak(ledger, at)).toBe(5);
    // Early November with nothing yet: still 5, not 0.
    expect(monthStreak(ledger, new Date("2026-11-02T10:00:00.000Z"))).toBe(5);
    // December with nothing in November: the streak is over.
    expect(monthStreak(ledger, new Date("2026-12-02T10:00:00.000Z"))).toBe(0);
  });
});

describe("challenges and badges", () => {
  it("adds everyone's actions in the month to the team's own count", () => {
    const october = seedChallenges.find((c) => c.month === "2026-10")!;
    expect(october.action).toBe("turno-hora");
    expect(challengeProgress(october, seedEntries)).toBe(october.extraProgress + 1);
  });

  it("shows which badges are earned and how far the others are", () => {
    const painel = buildPainel({ ledger: seedEntries.filter((e) => e.accountId === "conta-1"), rules: defaultPointsRules, badges: seedBadges, challenges: seedChallenges, communityEntries: seedEntries, partners: seedPartners, redemptions: seedRedemptions, now: at });
    const byId = Object.fromEntries(painel.badges.map((b) => [b.badge.id, b]));
    expect(byId["maos-a-obra"]!.earned).toBe(true);
    expect(byId["voluntario-fiel"]).toMatchObject({ earned: false, have: 3 });
    expect(painel.next).toMatchObject({ name: "Guardião da Colónia", missing: 185 });
    expect(painel.challenges).toHaveLength(1);
  });
});

describe("perks", () => {
  const [vet, shop, cafe] = seedPartners;
  const person = { level: 1, balance: 120, redemptions: [] };

  it("asks for the right level first, then enough Patinhas", () => {
    expect(canRedeem(vet!, vet!.perks[0]!, person, at)).toMatchObject({ ok: false, error: "nivel", message: "A partir do nível 2, Amigo de Bigodes." });
    expect(canRedeem(vet!, vet!.perks[0]!, { ...person, level: 2 }, at)).toMatchObject({ ok: false, error: "saldo", message: "Faltam 30 Patinhas." });
    expect(canRedeem(shop!, shop!.perks[0]!, person, at)).toEqual({ ok: true });
  });

  it("respects the monthly limit, and cancelled ones do not count", () => {
    const used = (status: "ativa" | "cancelada") => ({ perkId: "consulta-10", status, createdAt: "2026-10-03T10:00:00.000Z" });
    const rich = { level: 3, balance: 900 };
    expect(canRedeem(vet!, vet!.perks[0]!, { ...rich, redemptions: [used("ativa")] }, at)).toMatchObject({ error: "limite-mensal" });
    expect(canRedeem(vet!, vet!.perks[0]!, { ...rich, redemptions: [used("cancelada")] }, at)).toEqual({ ok: true });
    expect(canRedeem(vet!, vet!.perks[0]!, { ...rich, redemptions: [used("ativa")] }, new Date("2026-11-01T10:00:00.000Z"))).toEqual({ ok: true });
    expect(canRedeem(cafe!, { ...cafe!.perks[0]!, patinhasCost: undefined }, rich as never, at)).toMatchObject({ error: "sem-troca" });
  });

  it("makes codes that are easy to read aloud", () => {
    expect(redemptionCode(() => 0)).toBe("GN-AAAAA");
    expect(redemptionCode()).toMatch(/^GN-[A-HJ-NP-Z2-9]{5}$/);
  });
});

describe("signing in", () => {
  it("accepts an email or a Portuguese mobile in the same box", () => {
    expect(parseContact(" Maria@Exemplo.PT ")).toEqual({ kind: "email", value: "maria@exemplo.pt" });
    expect(parseContact("+351 912 345 678")).toEqual({ kind: "telemovel", value: "912345678" });
    expect(parseContact("912 345 678")).toEqual({ kind: "telemovel", value: "912345678" });
    expect(parseContact("maria")).toBeUndefined();
    expect(parseContact("1234")).toBeUndefined();
  });

  it("ignores spaces in the code", () => {
    expect(signInVerifySchema.parse({ contact: "912345678", code: "123 456" }).code).toBe("123456");
    expect(signInVerifySchema.safeParse({ contact: "912345678", code: "12345" }).success).toBe(false);
  });

  it("limits codes per hour and attempts per code", () => {
    let w = nextCodeWindow(undefined, at);
    for (let i = 0; i < 4; i++) {
      if (!w.ok) throw new Error();
      w = nextCodeWindow({ contact: "x", codeHash: "h", expiresAt: at.toISOString(), attempts: 0, windowStart: w.windowStart, sentInWindow: w.sentInWindow }, at);
    }
    expect(w).toMatchObject({ ok: true, sentInWindow: 5 });
    const stored = { contact: "x", codeHash: "h", expiresAt: new Date(at.getTime() + 60_000).toISOString(), attempts: 0, windowStart: at.toISOString(), sentInWindow: 5 };
    expect(nextCodeWindow(stored, at)).toEqual({ ok: false });
    expect(nextCodeWindow(stored, new Date(at.getTime() + 3_600_001)).ok).toBe(true);

    expect(checkLoginCode(stored, (h) => h === "h", at)).toEqual({ ok: true });
    expect(checkLoginCode(stored, () => false, at)).toEqual({ ok: false, error: "codigo-errado", attempts: 1 });
    expect(checkLoginCode({ ...stored, attempts: 5 }, () => true, at)).toMatchObject({ error: "muitas-tentativas" });
    expect(checkLoginCode(stored, () => true, new Date(at.getTime() + 120_000))).toMatchObject({ error: "codigo-expirado" });
  });

  it("uses the nickname or first name on the thanks wall, never the full name", () => {
    expect(wallName({ name: "Ana Ribeiro", nickname: "Ana dos Gatos" })).toBe("Ana dos Gatos");
    expect(wallName({ name: "João Costa" })).toBe("João");
  });
});
