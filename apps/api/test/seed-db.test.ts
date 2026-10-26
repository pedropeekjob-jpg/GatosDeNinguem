/**
 * The real site starts with the pages but none of the example cats or people.
 * Needs DATABASE_URL (skipped otherwise).
 */
import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaContentRepository } from "../src/content/prisma.repository";
import { seedEssentials } from "../src/seed-db";

const url = process.env.DATABASE_URL;

describe.runIf(Boolean(url))("seedEssentials", () => {
  const db = new PrismaClient();
  const repo = new PrismaContentRepository(db);

  beforeAll(async () => {
    await db.$transaction([db.cat.deleteMany(), db.page.deleteMany(), db.post.deleteMany(), db.partner.deleteMany(), db.redirect.deleteMany(), db.setting.deleteMany(), db.shift.deleteMany(), db.sponsorship.deleteMany(), db.product.deleteMany(), db.shopOrder.deleteMany()]);
    await seedEssentials(db);
  });
  afterAll(async () => db.$disconnect());

  it("loads pages, SEO, redirects and shop settings", async () => {
    expect((await repo.listPages()).length).toBeGreaterThan(3);
    expect((await repo.getSeoSettings()).siteUrl).toBe("https://gatosdeninguem.pt");
    expect((await db.redirect.findUnique({ where: { from: "/wp-admin" } }))?.to).toBe("/");
    expect(await repo.getShopSettings()).toEqual({});
  });

  it("loads no example cats, posts, partners, shifts, godparents or orders", async () => {
    expect(await db.cat.count()).toBe(0);
    expect(await db.post.count()).toBe(0);
    expect(await db.partner.count()).toBe(0);
    expect(await db.shift.count()).toBe(0);
    expect(await db.sponsorship.count()).toBe(0);
    expect(await db.product.count()).toBe(0);
    expect((await repo.getImpact()).campaign).toBeUndefined();
  });
});
