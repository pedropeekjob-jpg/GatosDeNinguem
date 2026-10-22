/** Loads the demo content into an empty database: pnpm --filter @gn/api db:seed */
import { PrismaClient } from "@prisma/client";
import { seedCats, seedImpact, seedPages, seedPartners, seedPosts, seedRedirects, seedSeoSettings } from "@gn/domain";
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
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const db = new PrismaClient();
  await seedDatabase(db);
  await db.$disconnect();
  console.log("Demo content loaded.");
}
