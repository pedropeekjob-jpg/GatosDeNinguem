import { describe, expect, it } from "vitest";
import {
  centsFromText, euros, forTheCatsCents, orderCode, orderErrorMessage, orderRequestSchema, placeOrder, productInputSchema, restock, setOrderStatus, shopTransparency, stockOf,
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
  it("says how much goes to the cats: all of it for donated articles", () => {
    expect(forTheCatsCents(caneca)).toBe(550);
    expect(forTheCatsCents({ priceCents: 400, costCents: 100, donated: true })).toBe(400);
  });
  it("refuses a cost higher than the price", () => {
    const r = productInputSchema.safeParse({ ...caneca, costCents: 1000 });
    expect(r.success).toBe(false);
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
  it("prices from the catalogue and takes the articles out of stock", () => {
    const r = placeOrder(products, { items: [{ productId: "art-tshirt", variant: "M", quantity: 2 }, { productId: "art-caneca", quantity: 1, variant: "ignorado" }], name: "Ana", phone: "912345678", delivery: "levantar", payment: "mbway" }, ids);
    if (!r.ok) throw new Error(r.error);
    expect(r.order.totalCents).toBe(3900);
    expect(r.order.status).toBe("novo");
    expect(r.order.lines[1]).not.toHaveProperty("variant");
    expect(stockOf(r.products.find((p) => p.id === "art-tshirt")!, "M")).toBe(4);
    expect(r.products.find((p) => p.id === "art-caneca")!.stock).toBe(11);
  });

  it("will not sell more than there is, counting the same article twice in one cart", () => {
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

  it("records a sale at a stand as already paid and delivered", () => {
    const r = placeOrder(products, { items: [{ productId: "art-caneca", quantity: 3 }] }, { ...ids, inPerson: true });
    if (!r.ok) throw new Error(r.error);
    expect(r.order).toMatchObject({ status: "entregue", inPerson: true, name: "Venda na banca", paidAt: now.toISOString() });
  });

  it("asks for an address and a way to pay ahead when sending by post", () => {
    const base = { items: [{ productId: "art-caneca", quantity: 1 }], name: "Ana", phone: "912345678", consent: true };
    const noAddress = orderRequestSchema.safeParse({ ...base, delivery: "correio", payment: "mbway" });
    expect(noAddress.error?.issues[0]).toMatchObject({ path: ["address"] });
    const payLater = orderRequestSchema.safeParse({ ...base, delivery: "correio", address: "Rua das Flores 1, 4900-000 Viana", payment: "ao-levantar" });
    expect(payLater.error?.issues[0]).toMatchObject({ path: ["payment"] });
    expect(orderRequestSchema.safeParse({ ...base, delivery: "levantar", payment: "ao-levantar" }).success).toBe(true);
  });
});

describe("after the order", () => {
  it("puts cancelled articles back on sale", () => {
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
  it("adds up paid orders and what the money paid for, this year only", () => {
    const t = shopTransparency([...seedShopOrders, { ...seedShopOrders[1]!, id: "velho", paidAt: "2025-12-01T10:00:00.000Z" }], [...seedShopSpending, { id: "x", date: "2025-05-01", description: "Antigo", amountCents: 999 }], 2026);
    expect(t.salesCents).toBe(1500 + 9600);
    expect(t.forTheCatsCents).toBe(900 + 6 * 600 + 3 * 1000);
    expect(t.articlesSold).toBe(10);
    expect(t.spentCents).toBe(6800);
    expect(t.spending.map((s) => s.id)).toEqual(["gasto-2", "gasto-1"]);
  });
});
