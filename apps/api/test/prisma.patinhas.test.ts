/** Patinhas storage against a real PostgreSQL. Runs when DATABASE_URL is set, like prisma.repository.test.ts. */
import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { defaultPointsRules, seedAccounts, seedEntries, seedRedemptions } from "@gn/domain";
import { PrismaPatinhasRepository } from "../src/patinhas/prisma.repository";

const url = process.env.DATABASE_URL;

describe.runIf(Boolean(url))("PrismaPatinhasRepository", () => {
  const db = new PrismaClient();
  const repo = new PrismaPatinhasRepository(db);

  beforeAll(async () => {
    await db.$transaction([db.account.deleteMany(), db.session.deleteMany(), db.loginCode.deleteMany(), db.patinhasEntry.deleteMany(), db.redemption.deleteMany(), db.badge.deleteMany(), db.challenge.deleteMany(), db.setting.deleteMany({ where: { key: "patinhas-regras" } })]);
    for (const a of seedAccounts) await repo.saveAccount(a);
    for (const e of seedEntries) await repo.addEntry(e);
    for (const r of seedRedemptions) await repo.saveRedemption(r);
  });
  afterAll(async () => db.$disconnect());

  it("finds people by email or mobile", async () => {
    expect((await repo.findAccount({ email: "ana@exemplo.pt" }))?.name).toBe("Ana Ribeiro");
    expect((await repo.findAccount({ phone: "913000002" }))?.name).toBe("João Costa");
    expect(await repo.findAccount({})).toBeUndefined();
  });

  it("filters the ledger by person and month, and never stores the same source twice", async () => {
    expect(await repo.listEntries({ accountId: "conta-1" })).toHaveLength(9);
    expect(await repo.listEntries({ from: "2026-10-01T00:00:00.000Z", to: "2026-11-01T00:00:00.000Z" })).toHaveLength(4);
    await expect(repo.addEntry({ ...seedEntries[2]!, id: "duplicado" })).rejects.toThrow();
  });

  it("uses the default rules until the team edits them", async () => {
    expect(await repo.getRules()).toEqual(defaultPointsRules);
    await repo.saveRules(defaultPointsRules.map((r) => ({ ...r, points: r.points + 1 })));
    expect((await repo.getRules())[0]!.points).toBe(defaultPointsRules[0]!.points + 1);
  });

  it("keeps sessions and codes", async () => {
    await repo.saveSession({ tokenHash: "h1", accountId: "conta-2", expiresAt: "2027-01-01T00:00:00.000Z" });
    expect(await repo.getSession("h1")).toEqual({ tokenHash: "h1", accountId: "conta-2", expiresAt: "2027-01-01T00:00:00.000Z" });
    await repo.saveLoginCode({ contact: "email:x@y.pt", codeHash: "c", expiresAt: "2027-01-01T00:00:00.000Z", attempts: 0, windowStart: "2026-10-22T00:00:00.000Z", sentInWindow: 1 });
    await repo.saveLoginCode({ contact: "email:x@y.pt", codeHash: "c", expiresAt: "2027-01-01T00:00:00.000Z", attempts: 2, windowStart: "2026-10-22T00:00:00.000Z", sentInWindow: 1 });
    expect((await repo.getLoginCode("email:x@y.pt"))?.attempts).toBe(2);
  });

  it("deletes a person, their sessions and the link to their points", async () => {
    await repo.deleteAccount("conta-2");
    expect(await repo.getAccount("conta-2")).toBeUndefined();
    expect(await repo.getSession("h1")).toBeUndefined();
    const anonymous = (await repo.listEntries()).filter((e) => e.id === "pt-11");
    expect(anonymous[0]).toMatchObject({ action: "donativo", accountId: undefined });
    expect(anonymous[0]!.note).toBeUndefined();
  });

  it("stores perk swaps", async () => {
    const r = (await repo.listRedemptions({ accountId: "conta-1" }))[0]!;
    await repo.saveRedemption({ ...r, status: "usada", usedAt: "2026-10-20T10:00:00.000Z" });
    expect((await repo.getRedemption(r.id))?.status).toBe("usada");
  });
});
