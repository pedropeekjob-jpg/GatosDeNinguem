/**
 * Integration test against a real PostgreSQL. Runs when DATABASE_URL is set
 * (CI starts a Postgres service); locally: DATABASE_URL=... pnpm --filter @gn/api test
 */
import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaContentRepository } from "../src/content/prisma.repository";
import { seedDatabase } from "../src/seed-db";

const url = process.env.DATABASE_URL;

describe.runIf(Boolean(url))("PrismaContentRepository", () => {
  const db = new PrismaClient();
  const repo = new PrismaContentRepository(db);

  beforeAll(async () => {
    await db.$transaction([db.cat.deleteMany(), db.page.deleteMany(), db.post.deleteMany(), db.partner.deleteMany(), db.partnerApplication.deleteMany(), db.redirect.deleteMany(), db.setting.deleteMany(), db.adoptionInterest.deleteMany(), db.newsletterSignup.deleteMany()]);
    await seedDatabase(db);
  });
  afterAll(async () => db.$disconnect());

  it("round-trips cats, pages, posts, partners and settings", async () => {
    expect((await repo.getCatBySlug("tobias"))?.name).toBe("Tobias");
    expect((await repo.listPages()).length).toBeGreaterThan(3);
    expect((await repo.listPosts())[0]?.slug).toBe("precisamos-de-areia-e-racao");
    expect((await repo.listPartners()).length).toBe(3);
    expect((await repo.getSeoSettings()).siteName).toBe("Gatos de Ninguém");
  });

  it("updates SEO on an existing cat", async () => {
    const cat = (await repo.getCatBySlug("mia"))!;
    await repo.saveCat({ ...cat, seo: { title: "Mia, gata para adoção em Viana" } });
    expect((await repo.getCat(cat.id))?.seo.title).toBe("Mia, gata para adoção em Viana");
  });

  it("stores impact numbers and newsletter signups (idempotent by email)", async () => {
    expect((await repo.getImpact()).catsInShelter).toBe(140);
    await repo.saveNewsletterSignup({ email: "A@b.pt", interests: [], consent: true, subscribedAt: new Date().toISOString() });
    await repo.saveNewsletterSignup({ email: "a@b.pt", interests: ["eventos"], consent: true, subscribedAt: new Date().toISOString() });
    expect(await db.newsletterSignup.count()).toBe(1);
  });

  it("stores and lists partner applications", async () => {
    await repo.savePartnerApplication({ id: "a1", receivedAt: new Date().toISOString(), businessName: "Padaria", contactName: "Ana", email: "ana@example.pt", town: "Viana", consent: true });
    expect(await repo.listPartnerApplications()).toHaveLength(1);
  });
});
