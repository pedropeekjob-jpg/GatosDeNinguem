/** Loads the demo content into an empty database: pnpm --filter @gn/api db:seed */
import { PrismaClient } from "@prisma/client";
import { seedCats, seedFosterPlacements, seedImpact, seedShifts, seedSponsorships, seedPages, seedPartners, seedPosts, seedRedirects, seedSeoSettings } from "@gn/domain";
import { PrismaContentRepository } from "./content/prisma.repository";

export async function seedDatabase(db: PrismaClient) {
  const repo = new PrismaContentRepository(db);
  await repo.saveSeoSettings(seedSeoSettings);
  await repo.saveImpact(seedImpact);
  for (const page of seedPages) await repo.savePage(page);
  for (const cat of seedCats) await repo.saveCat(cat);
  for (const post of seedPosts) await repo.savePost(post);
  for (const partner of seedPartners) await repo.savePartner(partner);
  for (const r of seedRedirects) await repo.saveRedirect(r);
  await repo.saveShifts(seedShifts);
  for (const p of seedFosterPlacements) await repo.saveFosterPlacement(p);
  for (const sp of seedSponsorships) await repo.saveSponsorship(sp);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const db = new PrismaClient();
  await seedDatabase(db);
  await db.$disconnect();
  console.log("Demo content loaded.");
}
