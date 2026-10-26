import { describe, expect, it } from "vitest";
import {
  centsFromText, euros, forTheCatsCents, isSymbolicGift, orderCode, orderErrorMessage, orderRequestSchema, placeOrder, productInputSchema, productSchema, restock, shopOrderSchema, setOrderStatus, shopTransparency, stockOf,
  type Product,
} from "./loja";
import { seedProducts, seedShopOrders, seedShopSpending } from "./seed-loja";

const now = new Date("2026-11-01T09:00:00.000Z");
const products = structuredClone(seedProducts);
const tshirt = products.find((p) => p.id === "art-tshirt")!;
const caneca = products.find((p) => p.id === "art-caneca")!;
const ids = { id: "o1", code: "L-TEST", now };

describe("money", () => {
  it("shows euros the Portuguese way", () => {
    expect(euros(1500)).toMatch(/^15\s€$/);
    expect(euros(250)).toMatch(/^2,50\s€$/);
  });
  it("reads what people type", () => {
    expect(centsFromText("2,50")).toBe(250);
    expect(centsFromText("15 €")).toBe(1500);
  });
  it("says how much of the minimum donation goes to the cats: all of it for gifts someone gave us", () => {
    expect(forTheCatsCents(caneca)).toBe(550);
    expect(forTheCatsCents({ minDonationCents: 400, costCents: 100, donated: true })).toBe(400);
  });
  it("refuses a gift that costs more than the minimum donation", () => {
    const r = productInputSchema.safeParse({ ...caneca, costCents: 1000 });
    expect(r.success).toBe(false);
  });
  it("flags gifts that cost more than half of the minimum donation, so they stay symbolic", () => {
    expect(isSymbolicGift(caneca)).toBe(true);
    expect(isSymbolicGift({ minDonationCents: 1000, costCents: 600, donated: false })).toBe(false);
    expect(isSymbolicGift({ minDonationCents: 1000, costCents: 600, donated: true })).toBe(true);
  });
  it("reads articles saved when the shop had prices", () => {
    const { minDonationCents: _m, ...rest } = caneca;
    const r = productSchema.parse({ ...rest, priceCents: 900 });
    expect(r.minDonationCents).toBe(900);
    expect(r).not.toHaveProperty("priceCents");
  });
});

describe("stock", () => {
  it("counts per size when there are sizes", () => {
    expect(stockOf(tshirt)).toBe(13);
    expect(stockOf(tshirt, "M")).toBe(6);
    expect(stockOf(tshirt, "XL")).toBe(0);
    expect(stockOf(caneca)).toBe(12);
  });
});

describe("placing an order", () => {
  it("takes the donation the person chose and the gifts out of stock", () => {
    const r = placeOrder(products, { items: [{ productId: "art-tshirt", variant: "M", quantity: 2 }, { productId: "art-caneca", quantity: 1, variant: "ignorado" }], amountCents: 5000, name: "Ana", phone: "912345678", delivery: "levantar", payment: "mbway" }, ids);
    if (!r.ok) throw new Error(r.error);
    expect(r.order.totalCents).toBe(5000);
    expect(r.order.lines[0]).toMatchObject({ unitMinDonationCents: 1500, unitCostCents: 600 });
    expect(r.order.status).toBe("novo");
    expect(r.order.lines[1]).not.toHaveProperty("variant");
    expect(stockOf(r.products.find((p) => p.id === "art-tshirt")!, "M")).toBe(4);
    expect(r.products.find((p) => p.id === "art-caneca")!.stock).toBe(11);
  });

  it("refuses a donation below the minimum of the chosen gifts, checked against the catalogue", () => {
    const r = placeOrder(products, { items: [{ productId: "art-caneca", quantity: 2 }], amountCents: 1500 }, ids);
    expect(r).toMatchObject({ ok: false, error: "abaixo-do-minimo", minimumCents: 1800 });
    if (!r.ok) expect(orderErrorMessage(r)).toMatch(/donativo mínimo é 18\s€/);
  });

  it("will not give more than there is, counting the same article twice in one cart", () => {
    const r = placeOrder(products, { items: [{ productId: "art-saco", quantity: 1 }, { productId: "art-saco", quantity: 2 }] }, ids);
    expect(r).toMatchObject({ ok: false, error: "esgotado", left: 1 });
    if (!r.ok) expect(orderErrorMessage(r)).toBe("Só há 1 de Saco de pano «Adote, não compre». Diminua a quantidade, por favor.");
  });

  it("refuses sold-out, hidden or unknown articles and missing sizes", () => {
    expect(placeOrder(products, { items: [{ productId: "art-porta-chaves", quantity: 1 }] }, ids)).toMatchObject({ ok: false, error: "esgotado", left: 0 });
    expect(placeOrder(products.map((p) => ({ ...p, active: false })), { items: [{ productId: "art-caneca", quantity: 1 }] }, ids)).toMatchObject({ ok: false, error: "indisponivel" });
    expect(placeOrder(products, { items: [{ productId: "nao-existe", quantity: 1 }] }, ids)).toMatchObject({ ok: false, error: "indisponivel" });
    expect(placeOrder(products, { items: [{ productId: "art-tshirt", quantity: 1 }] }, ids)).toMatchObject({ ok: false, error: "indisponivel" });
  });

  it("records a donation at a stand as already paid and delivered, at the minimum unless told otherwise", () => {
    const r = placeOrder(products, { items: [{ productId: "art-caneca", quantity: 3 }] }, { ...ids, inPerson: true });
    if (!r.ok) throw new Error(r.error);
    expect(r.order).toMatchObject({ status: "entregue", inPerson: true, name: "Donativo na banca", paidAt: now.toISOString(), totalCents: 2700 });
  });

  it("asks for an address and a way to pay ahead when sending by post", () => {
    const base = { items: [{ productId: "art-caneca", quantity: 1 }], amountCents: 900, name: "Ana", phone: "912345678", consent: true };
    const noAddress = orderRequestSchema.safeParse({ ...base, delivery: "correio", payment: "mbway" });
    expect(noAddress.error?.issues[0]).toMatchObject({ path: ["address"] });
    const payLater = orderRequestSchema.safeParse({ ...base, delivery: "correio", address: "Rua das Flores 1, 4900-000 Viana", payment: "ao-levantar" });
    expect(payLater.error?.issues[0]).toMatchObject({ path: ["payment"] });
    expect(orderRequestSchema.safeParse({ ...base, delivery: "levantar", payment: "ao-levantar" }).success).toBe(true);
  });
});

describe("after the order", () => {
  it("puts the gifts of a cancelled order back", () => {
    const r = placeOrder(products, { items: [{ productId: "art-tshirt", variant: "S", quantity: 3 }] }, ids);
    if (!r.ok) throw new Error(r.error);
    const back = restock(r.products, r.order);
    expect(stockOf(back[0] as Product, "S")).toBe(3);
  });

  it("stamps when it was paid and delivered, and never revives a cancelled order", () => {
    const order = seedShopOrders[0]!;
    const paid = setOrderStatus(order, "pago", now);
    expect(paid.paidAt).toBe(now.toISOString());
    const delivered = setOrderStatus(paid, "entregue", new Date("2026-11-02T10:00:00.000Z"));
    expect(delivered).toMatchObject({ paidAt: now.toISOString(), deliveredAt: "2026-11-02T10:00:00.000Z" });
    expect(() => setOrderStatus(setOrderStatus(order, "cancelado", now), "pago", now)).toThrow(/cancelado/);
  });

  it("makes codes that are easy to read aloud", () => {
    expect(orderCode(() => 0)).toBe("L-2222");
    expect(orderCode()).toMatch(/^L-[2-9A-HJKMNP-Z]{4}$/);
  });
});

describe("transparency", () => {
  it("adds up paid donations, what the gifts cost and what the money paid for, this year only", () => {
    const t = shopTransparency([...seedShopOrders, { ...seedShopOrders[1]!, id: "velho", paidAt: "2025-12-01T10:00:00.000Z" }], [...seedShopSpending, { id: "x", date: "2025-05-01", description: "Antigo", amountCents: 999 }], 2026);
    expect(t.donationsCents).toBe(2000 + 9600);
    expect(t.giftsCostCents).toBe(600 + 6 * 400 + 3 * 200);
    expect(t.forTheCatsCents).toBe(2000 + 9600 - (600 + 6 * 400 + 3 * 200));
    expect(t.giftsGiven).toBe(10);
    expect(t.spentCents).toBe(6800);
    expect(t.spending.map((s) => s.id)).toEqual(["gasto-2", "gasto-1"]);
  });
});

describe("orders saved when the shop had prices", () => {
  it("reads the old price as the minimum donation and works out the gift's cost", () => {
    const old = { ...seedShopOrders[0]!, lines: [{ productId: "art-caneca", name: "Caneca", quantity: 2, unitPriceCents: 900, unitForCatsCents: 550 }] };
    expect(shopOrderSchema.parse(old).lines[0]).toEqual({ productId: "art-caneca", name: "Caneca", quantity: 2, unitMinDonationCents: 900, unitCostCents: 350 });
  });
});
