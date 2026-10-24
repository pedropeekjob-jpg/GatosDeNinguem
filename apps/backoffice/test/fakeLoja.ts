import { vi } from "vitest";
import {
  placeOrder, restock, seedItemDonations, seedProducts, seedShopOrders, seedShopSettings, seedShopSpending, setOrderStatus, shopTransparency, orderErrorMessage,
  type Product, type ShopOrder,
} from "@gn/domain";
import type { LojaApi } from "../src/lib/lojaApi";

/** In-memory shop API on the same demo data and rules as the server. */
export function fakeLoja(now: Date): LojaApi {
  let products: Product[] = structuredClone(seedProducts);
  let orders: ShopOrder[] = structuredClone(seedShopOrders);
  let spending = structuredClone(seedShopSpending);
  let donations = structuredClone(seedItemDonations);
  let settings = structuredClone(seedShopSettings);
  let n = 0;
  const id = () => `l-${++n}`;
  const merge = (changed: Product[]) => { products = products.map((p) => changed.find((c) => c.id === p.id) ?? p); };
  return {
    shopProducts: async () => products,
    createProduct: vi.fn(async (input) => { const p = { ...input, id: id(), updatedAt: now.toISOString() }; products = [...products, p]; return p; }),
    updateProduct: vi.fn(async (pid, changes) => { products = products.map((p) => (p.id === pid ? { ...p, ...changes } : p)); return products.find((p) => p.id === pid)!; }),
    shopOrders: async () => [...orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    updateOrder: vi.fn(async (oid, { status }) => {
      const o = orders.find((x) => x.id === oid)!;
      const next = status ? setOrderStatus(o, status, now) : o;
      if (status === "cancelado") merge(restock(products, o));
      orders = orders.map((x) => (x.id === oid ? next : x));
      return next;
    }),
    sellInPerson: vi.fn(async (items) => {
      const r = placeOrder(products, { items }, { id: id(), code: "L-BANC", now, inPerson: true });
      if (!r.ok) throw new Error(orderErrorMessage(r));
      merge(r.products);
      orders = [r.order, ...orders];
      return r.order;
    }),
    shopSummary: async () => ({ settings, transparency: shopTransparency(orders, spending, now.getUTCFullYear()) }),
    addSpending: vi.fn(async (s) => { const x = { ...s, id: id() }; spending = [...spending, x]; return x; }),
    deleteSpending: async (sid) => { spending = spending.filter((s) => s.id !== sid); },
    saveShopSettings: vi.fn(async (s) => { settings = s; return s; }),
    itemDonations: async () => donations,
    setItemDonationStatus: async (did, status) => { donations = donations.map((d) => (d.id === did ? { ...d, status } : d)); return donations.find((d) => d.id === did)!; },
  };
}
