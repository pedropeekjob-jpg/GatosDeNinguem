import { z } from "zod";
import { photoSchema, translationsSchema } from "./content";
import { slugSchema } from "./seo-fields";

/**
 * Loja solidária: the association's shop, a physical place. The site only shows the articles and invites
 * people to visit: no prices and nothing ordered online. The association is a non-profit, so each article
 * is a thank-you ("oferta") for a donation of at least a minimum amount, which the team keeps in the back
 * office and records when a donation is made at the shop or a stand. The shop page shows how much was
 * donated, what the gifts cost and what the money paid for. Money is kept in cents so sums never drift.
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
  /** The smallest donation that gets this gift. It is not a price: people can give more. */
  minDonationCents: z.number().int().min(100, "O donativo mínimo tem de ser pelo menos 1 €").max(100_000),
  /** What the gift cost the association (production, materials). Shown publicly so donors see where the money goes. */
  costCents: z.number().int().min(0).default(0),
  /** Given to the shop by someone: everything goes to the cats. */
  donated: z.boolean().default(false),
  photos: z.array(photoSchema).min(1, "Adicione pelo menos uma fotografia"),
  /** Sizes or colours. When there are any, stock is counted per option and `stock` is ignored. */
  variants: z.array(productVariantSchema).default([]),
  stock: z.number().int().min(0).default(0),
  /** Hidden from the site when false (kept for the order history). */
  active: z.boolean().default(true),
  translations: translationsSchema({ name: z.string().max(80), description: z.string().max(1000) }),
};

/** Articles saved before the shop became donations-with-a-gift had a `priceCents`: it becomes the minimum donation. */
const legacyPrice = (value: unknown) => {
  if (!value || typeof value !== "object") return value;
  const { priceCents, ...rest } = value as Record<string, unknown>;
  return priceCents !== undefined && rest.minDonationCents === undefined ? { ...rest, minDonationCents: priceCents } : value;
};

export const productInputSchema = z.preprocess(
  legacyPrice,
  z.object(productFields).refine((p) => p.costCents < p.minDonationCents, { message: "O custo tem de ser menor do que o donativo mínimo", path: ["costCents"] }),
);
export type ProductInput = z.infer<typeof productInputSchema>;
export const productSchema = z.preprocess(legacyPrice, z.object({ ...productFields, id: z.string(), updatedAt: z.string().datetime() }));
export type Product = z.infer<typeof productSchema>;

/**
 * A thank-you gift must stay symbolic, or the donation looks like a sale in disguise (a donation has no
 * commercial consideration, artigo 61.º do Estatuto dos Benefícios Fiscais). Our rule of thumb, to confirm
 * with the association's accountant: the gift costs at most half of the minimum donation.
 */
export const SYMBOLIC_GIFT_SHARE = 0.5;
export const isSymbolicGift = (p: Pick<Product, "minDonationCents" | "costCents" | "donated">) => p.donated || p.costCents <= p.minDonationCents * SYMBOLIC_GIFT_SHARE;

export const euros = (cents: number) => (cents / 100).toLocaleString("pt-PT", { style: "currency", currency: "EUR", minimumFractionDigits: cents % 100 === 0 ? 0 : 2 });

/** "9 €" and "2,50 €" typed by a person, to cents. */
export const centsFromText = (text: string) => Math.round(Number(text.replace(/\s|€/g, "").replace(",", ".")) * 100);

/** What the gift cost the association: nothing when someone gave it to us. */
export const giftCostCents = (p: Pick<Product, "costCents" | "donated">) => (p.donated ? 0 : p.costCents);

/** The part of the minimum donation that goes to the cats. Everything given above the minimum goes to them too. */
export const forTheCatsCents = (p: Pick<Product, "minDonationCents" | "costCents" | "donated">) => p.minDonationCents - giftCostCents(p);

/** The smallest donation for a set of gifts. */
export const minDonationFor = (lines: { minDonationCents: number; quantity: number }[]) => lines.reduce((n, l) => n + l.minDonationCents * l.quantity, 0);

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

/** How much someone gives, in cents. */
export const donationAmountSchema = z.number({ required_error: "Diga quanto quer doar", invalid_type_error: "Diga quanto quer doar" }).int().min(100, "O donativo tem de ser pelo menos 1 €").max(1_000_000);

/** The donation form on the site. Nothing is charged online: the team gets in touch and confirms the payment. */
export const orderRequestSchema = z
  .object({
    items: z.array(orderLineInputSchema).min(1, "Ainda não escolheu nenhuma oferta").max(20),
    /** How much the person chooses to give. At least the minimum of the gifts they chose (checked against the catalogue). */
    amountCents: donationAmountSchema,
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

/** Lines saved when the shop had prices: the price was the minimum, and price minus "for the cats" was the cost. */
const legacyLine = (value: unknown) => {
  if (!value || typeof value !== "object") return value;
  const { unitPriceCents, unitForCatsCents, ...rest } = value as Record<string, unknown>;
  if (typeof unitPriceCents !== "number" || rest.unitMinDonationCents !== undefined) return value;
  return { ...rest, unitMinDonationCents: unitPriceCents, unitCostCents: unitPriceCents - (typeof unitForCatsCents === "number" ? unitForCatsCents : unitPriceCents) };
};

export const orderLineSchema = z.preprocess(legacyLine, z.object({
  productId: z.string(),
  name: z.string(),
  variant: z.string().optional(),
  quantity: z.number().int().min(1),
  /** Fixed when the donation was made. */
  unitMinDonationCents: z.number().int().min(0),
  /** What the gift cost the association, fixed when the donation was made. */
  unitCostCents: z.number().int().min(0),
}));
export type OrderLine = z.infer<typeof orderLineSchema>;

export const shopOrderSchema = z.object({
  id: z.string(),
  /** Short code the buyer writes in the MB WAY or transfer description, e.g. "L-7K3Q". */
  code: z.string(),
  lines: z.array(orderLineSchema).min(1),
  /** The donation the person chose to make. */
  totalCents: z.number().int().min(0),
  name: z.string(),
  phone: z.string().optional(),
  email: z.string().optional(),
  delivery: deliverySchema,
  address: z.string().optional(),
  payment: paymentSchema,
  message: z.string().optional(),
  status: z.enum(orderStatus),
  /** Given at a stand or at the shelter and recorded by the team. */
  inPerson: z.boolean().default(false),
  createdAt: z.string().datetime(),
  paidAt: z.string().datetime().optional(),
  deliveredAt: z.string().datetime().optional(),
  teamNote: z.string().max(500).optional(),
});
export type ShopOrder = z.infer<typeof shopOrderSchema>;

export type OrderError = { error: "indisponivel" | "esgotado"; productName: string; left: number } | { error: "abaixo-do-minimo"; minimumCents: number };
export function orderErrorMessage(e: OrderError): string {
  if (e.error === "abaixo-do-minimo") return `Para estas ofertas, o donativo mínimo é ${euros(e.minimumCents)}. Aumente o valor, por favor.`;
  if (e.error === "indisponivel") return `${e.productName} já não está disponível. Tire-o das suas ofertas, por favor.`;
  return e.left === 0 ? `${e.productName} esgotou. Tire-o das suas ofertas, por favor.` : `Só há ${e.left} de ${e.productName}. Diminua a quantidade, por favor.`;
}

/** Letters and digits that cannot be confused when read aloud or typed (no 0/O, 1/I/L). */
const CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
export function orderCode(random: () => number = Math.random): string {
  let code = "";
  for (let i = 0; i < 4; i++) code += CODE_ALPHABET[Math.floor(random() * CODE_ALPHABET.length)];
  return `L-${code}`;
}

/**
 * Turns the chosen gifts and a donation into an order and takes the gifts out of stock, so two people never
 * get the last one. Minimum donations come from the catalogue, never from the donor. Without an amount
 * (a donation recorded at a stand) the donation is the minimum.
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
    lines.push({ productId: product.id, name: product.name, ...(variant ? { variant } : {}), quantity: item.quantity, unitMinDonationCents: product.minDonationCents, unitCostCents: giftCostCents(product) });
  }
  const minimumCents = minDonationFor(lines.map((l) => ({ minDonationCents: l.unitMinDonationCents, quantity: l.quantity })));
  const amountCents = request.amountCents ?? minimumCents;
  if (amountCents < minimumCents) return { ok: false, error: "abaixo-do-minimo", minimumCents };
  const now = meta.now.toISOString();
  const inPerson = meta.inPerson ?? false;
  const order: ShopOrder = {
    id: meta.id,
    code: meta.code,
    lines,
    totalCents: amountCents,
    name: request.name ?? "Donativo na banca",
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

/** A cancelled order puts its gifts back. */
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
  /** Donations received with a gift this year (paid orders). */
  donationsCents: number;
  /** What the gifts cost the association. */
  giftsCostCents: number;
  /** The part of the donations that went to the cats, after paying for the gifts. */
  forTheCatsCents: number;
  giftsGiven: number;
  spentCents: number;
  spending: ShopSpending[];
};

export function shopTransparency(orders: ShopOrder[], spending: ShopSpending[], year: number): ShopTransparency {
  const paid = orders.filter((o) => (o.status === "pago" || o.status === "entregue") && (o.paidAt ?? o.createdAt).startsWith(String(year)));
  const lines = paid.flatMap((o) => o.lines);
  const thisYear = spending.filter((s) => s.date.startsWith(String(year))).sort((a, b) => b.date.localeCompare(a.date));
  const donationsCents = paid.reduce((n, o) => n + o.totalCents, 0);
  const giftsCostCents = lines.reduce((n, l) => n + l.unitCostCents * l.quantity, 0);
  return {
    year,
    donationsCents,
    giftsCostCents,
    forTheCatsCents: donationsCents - giftsCostCents,
    giftsGiven: lines.reduce((n, l) => n + l.quantity, 0),
    spentCents: thisYear.reduce((n, s) => n + s.amountCents, 0),
    spending: thisYear,
  };
}

/** Where the shop is and when it opens, edited in the back office. Until they are set, the site says they are coming soon. */
export const shopSettingsSchema = z.object({
  address: z.string().trim().max(200).optional(),
  /** A landmark that helps people find the door, e.g. "Em frente à Prio". Shown under the address, not sent to the map. */
  landmark: z.string().trim().max(120).optional(),
  /** One line per day or group of days, e.g. "Sábados, 10h às 13h". */
  hours: z.string().trim().max(500).optional(),
});
export type ShopSettings = z.infer<typeof shopSettingsSchema>;

// ---------- donated articles ----------

/** "Quero doar artigos para a loja" form. The team answers, and offers what arrives as thank-you gifts. */
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

/** What the shop accepts, so people don't offer what cannot be given on. */
export const acceptedDonations = [
  "Roupa e calçado limpos e em bom estado",
  "Livros, discos e jogos",
  "Loiça, decoração e pequenos objetos para a casa",
  "Artesanato feito por si",
  "Brinquedos completos",
];
