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
    await db.$transaction([db.cat.deleteMany(), db.page.deleteMany(), db.post.deleteMany(), db.partner.deleteMany(), db.partnerApplication.deleteMany(), db.redirect.deleteMany(), db.setting.deleteMany(), db.adoptionInterest.deleteMany(), db.newsletterSignup.deleteMany(), db.shift.deleteMany(), db.fosterPlacement.deleteMany(), db.fosterApplication.deleteMany(), db.sponsorship.deleteMany(), db.sponsorLetter.deleteMany(), db.badge.deleteMany(), db.challenge.deleteMany(), db.catCare.deleteMany(), db.medication.deleteMany(), db.medicationDose.deleteMany(), db.vetAppointment.deleteMany(), db.visitNote.deleteMany(), db.careAlert.deleteMany(), db.promotion.deleteMany(), db.product.deleteMany(), db.shopOrder.deleteMany(), db.shopSpending.deleteMany(), db.itemDonation.deleteMany(), db.catAlertSubscriber.deleteMany(), db.catAlertSent.deleteMany()]);
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

  it("keeps godparents' debits and the team's letters", async () => {
    const ana = (await repo.listSponsorships()).find((s) => s.id === "sp-3")!;
    expect(ana.debit).toMatchObject({ provider: "stripe", status: "ativo", paidCents: 2000 });
    await repo.saveSponsorLetter({ id: "carta-2", catSlug: "estrela", catName: "Estrela", text: "A Estrela já sai da jaula.", by: { name: "Rui" }, createdAt: "2026-10-24T10:00:00.000Z" });
    expect((await repo.listSponsorLetters("tobias")).map((l) => l.id)).toEqual(["carta-1"]);
    expect((await repo.listSponsorLetters()).map((l) => l.id)).toEqual(["carta-2", "carta-1"]);
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

  it("filters shifts by date range and stores foster placements and sponsorships", async () => {
    const nov = await repo.listShifts({ from: "2026-11-10T00:00:00.000Z", to: "2026-11-30T00:00:00.000Z" });
    expect(nov.map((s) => s.id)).toEqual(["shift-2", "shift-4", "shift-5"]);
    expect((await repo.getShift("shift-1"))?.signups).toHaveLength(1);
    expect(await repo.listFosterPlacements()).toHaveLength(2);
    expect(await repo.listSponsorships()).toHaveLength(3);
  });

  it("stores foster family requests and their follow-up", async () => {
    const base = { name: "Joana", phone: "913333333", town: "Darque", canHost: "bebes" as const, howLong: "semanas" as const, consent: true as const };
    await repo.saveFosterApplication({ ...base, id: "f1", receivedAt: "2026-10-01T10:00:00.000Z", status: "nova" });
    await repo.saveFosterApplication({ ...base, id: "f2", receivedAt: "2026-10-02T10:00:00.000Z", status: "nova" });
    await repo.saveFosterApplication({ ...base, id: "f1", receivedAt: "2026-10-01T10:00:00.000Z", status: "contactada" });
    const list = await repo.listFosterApplications();
    expect(list.map((a) => [a.id, a.status])).toEqual([["f2", "nova"], ["f1", "contactada"]]);
  });

  it("stores and lists partner applications", async () => {
    await repo.savePartnerApplication({ id: "a1", receivedAt: new Date().toISOString(), businessName: "Padaria", contactName: "Ana", email: "ana@example.pt", town: "Viana", consent: true });
    expect(await repo.listPartnerApplications()).toHaveLength(1);
  });

  it("stores care: places, medication, doses, appointments, notes and alerts", async () => {
    expect((await repo.getCatCare("cat-4"))?.location).toMatchObject({ area: "carlota", spot: "jaula", cage: "1" });
    await repo.saveCatCare({ catId: "cat-4", location: { area: "carlota", spot: "solto" }, since: new Date().toISOString(), updatedBy: { name: "Ana" } });
    expect((await repo.listCatCare()).find((c) => c.catId === "cat-4")?.location.spot).toBe("solto");
    expect((await repo.listMedications("cat-4")).map((m) => m.name)).toEqual(["Insulina"]);
    const dose = { id: "d1", medicationId: "med-1", catId: "cat-4", date: "2026-11-02", time: "08:00", givenAt: new Date().toISOString(), by: { name: "Ana" } };
    await repo.saveDose(dose);
    await expect(repo.saveDose({ ...dose, id: "d2" })).rejects.toThrow();
    expect(await repo.listDoses({ from: "2026-11-02", to: "2026-11-02" })).toHaveLength(1);
    await repo.deleteDose("d1");
    expect(await repo.listDoses({ from: "2026-11-01", to: "2026-11-30" })).toHaveLength(0);
    expect((await repo.listAppointments()).map((a) => a.id)).toEqual(["con-1", "con-2"]);
    expect((await repo.listVisitNotes("cat-4"))[0]?.text).toContain("Comeu tudo");
    expect((await repo.listCareAlerts({ since: "2026-10-21T00:00:00.000Z" })).map((a) => a.id)).toEqual(["al-3", "al-2"]);
  });

  it("keeps the shop: articles with stock, orders by newest, spending and offered articles", async () => {
    const caneca = (await repo.getProductBySlug("caneca-gato-a-piscar-o-olho"))!;
    await repo.saveProducts([{ ...caneca, stock: 7 }]);
    expect((await repo.getProduct(caneca.id))?.stock).toBe(7);
    expect((await repo.listShopOrders())[0]?.code).toBe("L-7K3Q");
    expect((await repo.listShopSpending()).map((s) => s.id)).toEqual(["gasto-2", "gasto-1"]);
    expect((await repo.listItemDonations())[0]?.status).toBe("nova");
    expect(await repo.getShopSettings()).toEqual({});
  });

  it("stores cat alert sign-ups by email or device, and one alert per cat", async () => {
    const filters = { ages: [], sexes: ["femea" as const], withKids: false, withCats: false, withDogs: false };
    await repo.saveCatAlertSubscriber({ id: "al-1", channel: "email", email: "ana@b.pt", filters, status: "pendente", createdAt: "2026-10-24T10:00:00.000Z", alertsSent: 0 });
    await repo.saveCatAlertSubscriber({ id: "al-2", channel: "push", push: { endpoint: "https://fcm.googleapis.com/x", keys: { p256dh: "p256dhp256dh", auth: "authauth" } }, filters, status: "ativo", createdAt: "2026-10-24T11:00:00.000Z", alertsSent: 0 });
    expect((await repo.findCatAlertSubscriber({ email: "ANA@b.pt" }))?.id).toBe("al-1");
    expect((await repo.findCatAlertSubscriber({ endpoint: "https://fcm.googleapis.com/x" }))?.id).toBe("al-2");
    await repo.saveCatAlertSubscriber({ ...(await repo.getCatAlertSubscriber("al-1"))!, status: "ativo" });
    expect((await repo.listCatAlertSubscribers()).map((s) => [s.id, s.status])).toEqual([["al-1", "ativo"], ["al-2", "ativo"]]);
    await repo.deleteCatAlertSubscriber("al-2");
    expect(await repo.listCatAlertSubscribers()).toHaveLength(1);

    await repo.saveCatAlertSent({ catId: "cat-1", catName: "Tobias", catSlug: "tobias", sentAt: "2026-10-24T12:00:00.000Z", emails: 1, pushes: 0 });
    expect((await repo.getCatAlertSent("cat-1"))?.emails).toBe(1);
    expect(await repo.listCatAlertsSent()).toHaveLength(1);
  });

  it("lists and removes newsletter subscribers, and stores promotions by event", async () => {
    await repo.saveNewsletterSignup({ email: "sair@b.pt", interests: ["eventos"], consent: true, subscribedAt: new Date().toISOString() });
    expect((await repo.listNewsletterSignups()).some((s) => s.email === "sair@b.pt")).toBe(true);
    await repo.deleteNewsletterSignup("SAIR@b.pt");
    expect((await repo.listNewsletterSignups()).some((s) => s.email === "sair@b.pt")).toBe(false);

    const at = new Date().toISOString();
    const promo = { id: "pr-1", postId: "post-2", postTitle: "Open Day", postSlug: "open-day-novembro", eventStartsAt: "2026-11-15T10:00:00.000Z", scheduledFor: "2026-11-08T10:00:00.000Z", status: "rascunho" as const, channels: ["email" as const], text: "Olá", emailSubject: "Olá", emailBody: "Olá", edited: false, results: {}, createdAt: at, updatedAt: at };
    await repo.savePromotion(promo);
    await repo.savePromotion({ ...promo, status: "aprovada" });
    expect((await repo.getPromotionByPost("post-2"))?.status).toBe("aprovada");
    expect((await repo.listPromotions()).length).toBe(1);
  });
});
