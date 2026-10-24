/**
 * Loads the demo content: pnpm --filter @gn/api db:seed
 * With --if-empty it does nothing when the database already has cats, so a deploy can run it every time
 * without overwriting what the team changed.
 */
import { PrismaClient } from "@prisma/client";
import { seedAppointments, seedCareAlerts, seedCatCare, seedMedications, seedVisitNotes } from "@gn/domain";
import { seedCats, seedFosterPlacements, seedImpact, seedShifts, seedSponsorships, seedPages, seedPartners, seedPosts, seedRedirects, seedSeoSettings } from "@gn/domain";
import { seedBadges, seedChallenges } from "@gn/domain";
import { seedItemDonations, seedProducts, seedShopOrders, seedShopSettings, seedShopSpending } from "@gn/domain";
import { PrismaContentRepository } from "./content/prisma.repository";
import { PrismaPatinhasRepository } from "./patinhas/prisma.repository";

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
  // Patinhas: example badges and monthly challenges. Points rules use the defaults until edited.
  const patinhas = new PrismaPatinhasRepository(db);
  for (const b of seedBadges) await patinhas.saveBadge(b);
  for (const c of seedChallenges) await patinhas.saveChallenge(c);
  for (const c of seedCatCare) await repo.saveCatCare(c);
  for (const m of seedMedications) await repo.saveMedication(m);
  for (const a of seedAppointments) await repo.saveAppointment(a);
  for (const n of seedVisitNotes) await repo.saveVisitNote(n);
  for (const a of seedCareAlerts) await repo.saveCareAlert(a);
  await repo.saveShopSettings(seedShopSettings);
  await repo.saveProducts(seedProducts);
  for (const o of seedShopOrders) await repo.saveShopOrder(o);
  for (const s of seedShopSpending) await repo.saveShopSpending(s);
  for (const d of seedItemDonations) await repo.saveItemDonation(d);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const db = new PrismaClient();
  if (process.argv.includes("--if-empty") && (await db.cat.count()) > 0) {
    console.log("The database already has content: demo content not loaded.");
  } else {
    await seedDatabase(db);
    console.log("Demo content loaded.");
  }
  await db.$disconnect();
}
