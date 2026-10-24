import { z } from "zod";
import { photoSchema } from "./content";
import { slugSchema } from "./seo-fields";

/**
 * Loja solidária: the association's charity shop, online.
 * People reserve online and pay by MB WAY, bank transfer or when they pick up. The team confirms payments
 * in the back office. Every article shows what part of its price goes to the cats, and the shop page shows
 * how much it raised and what the money paid for. Money is kept in cents so sums never drift.
 */

export const productCategorySchema = z.enum(["roupa", "casa", "acessorios", "artesanato", "livros", "outro"]);
export type ProductCategory = z.infer<typeof productCategorySchema>;
export const productCategoryLabel: Record<ProductCategory, string> = {
  roupa: "Roupa",
  casa: "Casa",
  acessorios: "Acessórios",
  artesanato: "Feito à mão",
  livros: "Livros",
  outro: "Outros",
};

/** A size or colour with its own stock, e.g. "M" or "Amarela". */
export const productVariantSchema = z.object({
  label: z.string().min(1, "Dê um nome à opção").max(30),
  stock: z.number().int().min(0),
});
export type ProductVariant = z.infer<typeof productVariantSchema>;

const productFields = {
  slug: slugSchema,
  name: z.string().min(2, "Dê um nome ao artigo").max(80),
  category: productCategorySchema,
  description: z.string().max(1000).default(""),
  priceCents: z.number().int().min(50, "O preço mínimo é 0,50 €").max(100_000),
  /** What the article cost the association (production, materials). Shown publicly so buyers see where the money goes. */
  costCents: z.number().int().min(0).default(0),
  /** Given to the shop by someone: everything goes to the cats. */
  donated: z.boolean().default(false),
  photos: z.array(photoSchema).min(1, "Adicione pelo menos uma fotografia"),
  /** Sizes or colours. When there are any, stock is counted per option and `stock` is ignored. */
  variants: z.array(productVariantSchema).default([]),
  stock: z.number().int().min(0).default(0),
  /** Hidden from the site when false (kept for the order history). */
  active: z.boolean().default(true),
};

export const productInputSchema = z
  .object(productFields)
  .refine((p) => p.costCents < p.priceCents, { message: "O custo tem de ser menor do que o preço", path: ["costCents"] });
export type ProductInput = z.infer<typeof productInputSchema>;
export const productSchema = z.object({ ...productFields, id: z.string(), updatedAt: z.string().datetime() });
export type Product = z.infer<typeof productSchema>;

export const euros = (cents: number) => (cents / 100).toLocaleString("pt-PT", { style: "currency", currency: "EUR", minimumFractionDigits: cents % 100 === 0 ? 0 : 2 });

/** "9 €" and "2,50 €" typed by a person, to cents. */
export const centsFromText = (text: string) => Math.round(Number(text.replace(/\s|€/g, "").replace(",", ".")) * 100);

/** The part of the price that goes to the cats. */
export const forTheCatsCents = (p: Pick<Product, "priceCents" | "costCents" | "donated">) => (p.donated ? p.priceCents : p.priceCents - p.costCents);

export function stockOf(p: Pick<Product, "variants" | "stock">, variant?: string): number {
  if (p.variants.length === 0) return p.stock;
  if (variant === undefined) return p.variants.reduce((n, v) => n + v.stock, 0);
  return p.variants.find((v) => v.label === variant)?.stock ?? 0;
}

/** Few enough left to say so on the site. */
export const LOW_STOCK = 3;

// ---------- orders ----------

export const deliverySchema = z.enum(["levantar", "correio"]);
export type Delivery = z.infer<typeof deliverySchema>;
export const deliveryLabel: Record<Delivery, string> = {
  levantar: "Levantar no gatil ou numa banca da associação",
  correio: "Receber pelo correio (portes à parte)",
};

export const paymentSchema = z.enum(["mbway", "transferencia", "ao-levantar"]);
export type Payment = z.infer<typeof paymentSchema>;
export const paymentLabel: Record<Payment, string> = {
  mbway: "MB WAY",
  transferencia: "Transferência bancária",
  "ao-levantar": "Pagar quando levantar",
};

export const orderLineInputSchema = z.object({
  productId: z.string().min(1),
  variant: z.string().optional(),
  quantity: z.number().int().min(1).max(10, "No máximo 10 de cada artigo"),
});
export type OrderLineInput = z.infer<typeof orderLineInputSchema>;

/** The order form on the site. Nothing is charged online: the team gets in touch and confirms the payment. */
export const orderRequestSchema = z
  .object({
    items: z.array(orderLineInputSchema).min(1, "O cesto está vazio").max(20),
    name: z.string({ required_error: "Indique o seu nome" }).min(2, "Indique o seu nome"),
    phone: z.string({ required_error: "Indique um telefone com pelo menos 9 números" }).min(9, "Indique um telefone com pelo menos 9 números"),
    email: z.string().email("Indique um email válido").optional().or(z.literal("")),
    delivery: deliverySchema,
    address: z.string().max(300).optional(),
    payment: paymentSchema,
    message: z.string().max(1000).optional(),
    consent: z.literal(true, { errorMap: () => ({ message: "Precisa de aceitar para o contactarmos" }) }),
  })
  .refine((o) => o.delivery !== "correio" || (o.address?.trim().length ?? 0) >= 10, { message: "Indique a morada completa, com código postal", path: ["address"] })
  .refine((o) => o.delivery !== "correio" || o.payment !== "ao-levantar", { message: "Pelo correio, pague por MB WAY ou transferência", path: ["payment"] });
export type OrderRequest = z.infer<typeof orderRequestSchema>;

export const orderStatus = ["novo", "pago", "entregue", "cancelado"] as const;
export type OrderStatus = (typeof orderStatus)[number];
export const orderStatusLabel: Record<OrderStatus, string> = { novo: "À espera de pagamento", pago: "Pago, por entregar", entregue: "Entregue", cancelado: "Cancelado" };

export const orderLineSchema = z.object({
  productId: z.string(),
  name: z.string(),
  variant: z.string().optional(),
  quantity: z.number().int().min(1),
  unitPriceCents: z.number().int().min(0),
  /** What went to the cats per unit, fixed when ordered. */
  unitForCatsCents: z.number().int().min(0),
});
export type OrderLine = z.infer<typeof orderLineSchema>;

export const shopOrderSchema = z.object({
  id: z.string(),
  /** Short code the buyer writes in the MB WAY or transfer description, e.g. "L-7K3Q". */
  code: z.string(),
  lines: z.array(orderLineSchema).min(1),
  totalCents: z.number().int().min(0),
  name: z.string(),
  phone: z.string().optional(),
  email: z.string().optional(),
  delivery: deliverySchema,
  address: z.string().optional(),
  payment: paymentSchema,
  message: z.string().optional(),
  status: z.enum(orderStatus),
  /** Sold at a stand or at the shelter and recorded by the team. */
  inPerson: z.boolean().default(false),
  createdAt: z.string().datetime(),
  paidAt: z.string().datetime().optional(),
  deliveredAt: z.string().datetime().optional(),
  teamNote: z.string().max(500).optional(),
});
export type ShopOrder = z.infer<typeof shopOrderSchema>;

export type OrderError = { error: "indisponivel" | "esgotado"; productName: string; left: number };
export function orderErrorMessage(e: OrderError): string {
  if (e.error === "indisponivel") return `${e.productName} já não está à venda. Tire-o do cesto, por favor.`;
  return e.left === 0 ? `${e.productName} esgotou. Tire-o do cesto, por favor.` : `Só há ${e.left} de ${e.productName}. Diminua a quantidade, por favor.`;
}

/** Letters and digits that cannot be confused when read aloud or typed (no 0/O, 1/I/L). */
const CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
export function orderCode(random: () => number = Math.random): string {
  let code = "";
  for (let i = 0; i < 4; i++) code += CODE_ALPHABET[Math.floor(random() * CODE_ALPHABET.length)];
  return `L-${code}`;
}

/**
 * Turns a cart into an order and takes the articles out of stock, so two people never buy the last one.
 * Prices come from the catalogue, never from the buyer.
 */
export function placeOrder(
  products: Product[],
  request: Pick<OrderRequest, "items"> & Omit<Partial<OrderRequest>, "items" | "consent">,
  meta: { id: string; code: string; now: Date; inPerson?: boolean },
): { ok: true; order: ShopOrder; products: Product[] } | ({ ok: false } & OrderError) {
  const changed = new Map<string, Product>();
  const lines: OrderLine[] = [];
  for (const item of request.items) {
    const product = changed.get(item.productId) ?? products.find((p) => p.id === item.productId);
    if (!product || !product.active) return { ok: false, error: "indisponivel", productName: product?.name ?? "Um artigo", left: 0 };
    const variant = product.variants.length > 0 ? item.variant : undefined;
    if (product.variants.length > 0 && !product.variants.some((v) => v.label === variant)) return { ok: false, error: "indisponivel", productName: `${product.name} (${item.variant ?? "sem tamanho"})`, left: 0 };
    const left = stockOf(product, variant);
    const label = variant ? `${product.name} (${variant})` : product.name;
    if (left < item.quantity) return { ok: false, error: "esgotado", productName: label, left };
    changed.set(product.id, takeStock(product, variant, item.quantity));
    lines.push({ productId: product.id, name: product.name, ...(variant ? { variant } : {}), quantity: item.quantity, unitPriceCents: product.priceCents, unitForCatsCents: forTheCatsCents(product) });
  }
  const now = meta.now.toISOString();
  const inPerson = meta.inPerson ?? false;
  const order: ShopOrder = {
    id: meta.id,
    code: meta.code,
    lines,
    totalCents: lines.reduce((n, l) => n + l.unitPriceCents * l.quantity, 0),
    name: request.name ?? "Venda na banca",
    ...(request.phone ? { phone: request.phone } : {}),
    ...(request.email ? { email: request.email } : {}),
    delivery: request.delivery ?? "levantar",
    ...(request.delivery === "correio" && request.address ? { address: request.address.trim() } : {}),
    payment: request.payment ?? "ao-levantar",
    ...(request.message ? { message: request.message } : {}),
    status: inPerson ? "entregue" : "novo",
    inPerson,
    createdAt: now,
    ...(inPerson ? { paidAt: now, deliveredAt: now } : {}),
  };
  return { ok: true, order, products: [...changed.values()] };
}

function takeStock(p: Product, variant: string | undefined, quantity: number): Product {
  if (p.variants.length === 0) return { ...p, stock: p.stock - quantity };
  return { ...p, variants: p.variants.map((v) => (v.label === variant ? { ...v, stock: v.stock - quantity } : v)) };
}

/** A cancelled order puts its articles back on sale. */
export function restock(products: Product[], order: Pick<ShopOrder, "lines">): Product[] {
  const changed = new Map<string, Product>();
  for (const line of order.lines) {
    const p = changed.get(line.productId) ?? products.find((x) => x.id === line.productId);
    if (!p) continue;
    changed.set(p.id, takeStock(p, line.variant, -line.quantity));
  }
  return [...changed.values()];
}

/** Moves an order along. Cancelling needs restocking (the caller does it); a cancelled order cannot come back. */
export function setOrderStatus(order: ShopOrder, status: OrderStatus, now: Date): ShopOrder {
  if (order.status === "cancelado" && status !== "cancelado") throw new Error("Este pedido foi cancelado. Faça um pedido novo.");
  const at = now.toISOString();
  return {
    ...order,
    status,
    ...(status === "pago" || status === "entregue" ? { paidAt: order.paidAt ?? at } : {}),
    ...(status === "entregue" ? { deliveredAt: order.deliveredAt ?? at } : {}),
  };
}

// ---------- transparency ----------

/** What the shop's money paid for, entered by the team, e.g. "Ração húmida para os bebés". */
export const shopSpendingSchema = z.object({
  id: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Indique a data"),
  description: z.string().min(3, "Escreva em que foi gasto").max(140),
  amountCents: z.number().int().min(1, "Indique o valor"),
});
export type ShopSpending = z.infer<typeof shopSpendingSchema>;

export type ShopTransparency = {
  year: number;
  /** Money received from paid orders this year. */
  salesCents: number;
  /** The part of it that went to the cats, after paying for what was produced. */
  forTheCatsCents: number;
  articlesSold: number;
  spentCents: number;
  spending: ShopSpending[];
};

export function shopTransparency(orders: ShopOrder[], spending: ShopSpending[], year: number): ShopTransparency {
  const paid = orders.filter((o) => (o.status === "pago" || o.status === "entregue") && (o.paidAt ?? o.createdAt).startsWith(String(year)));
  const lines = paid.flatMap((o) => o.lines);
  const thisYear = spending.filter((s) => s.date.startsWith(String(year))).sort((a, b) => b.date.localeCompare(a.date));
  return {
    year,
    salesCents: paid.reduce((n, o) => n + o.totalCents, 0),
    forTheCatsCents: lines.reduce((n, l) => n + l.unitForCatsCents * l.quantity, 0),
    articlesSold: lines.reduce((n, l) => n + l.quantity, 0),
    spentCents: thisYear.reduce((n, s) => n + s.amountCents, 0),
    spending: thisYear,
  };
}

/** Payment details and practical information shown after ordering. Edited in the back office. */
export const shopSettingsSchema = z.object({
  /** The association's MB WAY number. Without it, MB WAY is not offered. */
  mbwayPhone: z.string().optional(),
  iban: z.string().min(15),
  pickup: z.string().min(3).max(300),
  shipping: z.string().min(3).max(300),
});
export type ShopSettings = z.infer<typeof shopSettingsSchema>;

// ---------- donated articles ----------

/** "Quero doar artigos para a loja" form. The team answers, and turns what arrives into articles for sale. */
export const itemDonationSchema = z.object({
  what: z.string({ required_error: "Diga-nos o que quer doar" }).min(3, "Diga-nos o que quer doar").max(500),
  category: productCategorySchema.default("outro"),
  condition: z.enum(["novo", "como-novo", "usado"]).default("como-novo"),
  handover: z.enum(["entrego", "recolha"]).default("entrego"),
  name: z.string({ required_error: "Indique o seu nome" }).min(2, "Indique o seu nome"),
  phone: z.string({ required_error: "Indique um telefone com pelo menos 9 números" }).min(9, "Indique um telefone com pelo menos 9 números"),
  email: z.string().email("Indique um email válido").optional().or(z.literal("")),
  town: z.string({ required_error: "Indique onde vive" }).min(2, "Indique onde vive"),
  consent: z.literal(true, { errorMap: () => ({ message: "Precisa de aceitar para o contactarmos" }) }),
});
export type ItemDonation = z.infer<typeof itemDonationSchema>;
export const itemDonationStatus = ["nova", "aceite", "recebida", "recusada"] as const;
export type ItemDonationStatus = (typeof itemDonationStatus)[number];
export type StoredItemDonation = ItemDonation & { id: string; receivedAt: string; status: ItemDonationStatus };
export const itemDonationStatusLabel: Record<ItemDonationStatus, string> = { nova: "Nova", aceite: "Aceite, à espera", recebida: "Recebida", recusada: "Recusada" };
export const itemConditionLabel: Record<ItemDonation["condition"], string> = { novo: "Novo, nunca usado", "como-novo": "Usado, como novo", usado: "Usado, com marcas de uso" };
export const itemHandoverLabel: Record<ItemDonation["handover"], string> = { entrego: "Entrego no gatil ou numa banca", recolha: "Preciso que alguém vá buscar" };

/** What the shop accepts, so people don't offer what cannot be sold. */
export const acceptedDonations = [
  "Roupa e calçado limpos e em bom estado",
  "Livros, discos e jogos",
  "Loiça, decoração e pequenos objetos para a casa",
  "Artesanato feito por si",
  "Brinquedos completos",
];
