import { Body, ConflictException, Controller, Delete, Get, HttpCode, Inject, NotFoundException, Param, Patch, Post, Put, UseGuards } from "@nestjs/common";
import {
  donationAmountSchema,
  itemDonationSchema,
  itemDonationStatus,
  orderCode,
  orderErrorMessage,
  orderLineInputSchema,
  orderStatus,
  placeOrder,
  productInputSchema,
  productTranslationSpec,
  restock,
  setOrderStatus,
  shopSettingsSchema,
  shopSpendingSchema,
  shopTransparency,
  type Product,
  type ShopOrder,
} from "@gn/domain";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { AdminGuard } from "../common/admin.guard";
import { API_OPTIONS, type ApiOptions } from "../common/options";
import { parseBody } from "../common/validation";
import { TranslationService } from "../traducao/translation.service";

const isBot = (body: unknown) => !!(body && typeof body === "object" && (body as Record<string, unknown>).website_url);

/** Loja solidária: the articles shown on the site, donations recorded at the shop, what the money paid for, and articles people offer. */
@Controller("loja")
export class LojaController {
  constructor(@Inject(API_OPTIONS) private readonly options: ApiOptions) {}
  private get repo() { return this.options.repository; }
  private now() { return this.options.now?.() ?? new Date(); }
  /** Donations are recorded one at a time, so stock never goes below zero. */
  private queue: Promise<unknown> = Promise.resolve();
  private serial<T>(work: () => Promise<T>): Promise<T> {
    const next = this.queue.then(work, work);
    this.queue = next.catch(() => undefined);
    return next;
  }
  private changed() { return this.options.onContentChanged({ type: "loja", path: "/loja" }); }

  // ----- public -----

  @Get("artigos")
  async products() {
    return (await this.repo.listProducts()).filter((p) => p.active);
  }

  @Get("artigos/:slug")
  async product(@Param("slug") slug: string) {
    const p = await this.repo.getProductBySlug(slug);
    if (!p || !p.active) throw new NotFoundException("Esta oferta não existe ou já não está disponível.");
    return p;
  }

  /** Where the shop is and when it opens, and how much it raised this year and what it paid for. */
  @Get("resumo")
  async summary() {
    const [settings, orders, spending] = await Promise.all([this.repo.getShopSettings(), this.repo.listShopOrders(), this.repo.listShopSpending()]);
    return { settings, transparency: shopTransparency(orders, spending, this.now().getUTCFullYear()) };
  }

  @Post("doacoes")
  @HttpCode(201)
  async offerItems(@Body() body: unknown) {
    if (isBot(body)) return { ok: true };
    const input = parseBody(itemDonationSchema, body);
    await this.repo.saveItemDonation({ ...input, id: randomUUID(), receivedAt: this.now().toISOString(), status: "nova" });
    return { ok: true };
  }

  private async place(input: Parameters<typeof placeOrder>[1], inPerson = false): Promise<ShopOrder> {
    const [products, orders] = await Promise.all([this.repo.listProducts(), this.repo.listShopOrders()]);
    const used = new Set(orders.map((o) => o.code));
    let code = orderCode();
    while (used.has(code)) code = orderCode();
    const result = placeOrder(products, input, { id: randomUUID(), code, now: this.now(), inPerson });
    if (!result.ok) throw new ConflictException(orderErrorMessage(result));
    await this.repo.saveProducts(result.products);
    return this.repo.saveShopOrder(result.order);
  }

  // ----- back office -----

  @Get("gestao/artigos")
  @UseGuards(AdminGuard)
  allProducts() {
    return this.repo.listProducts();
  }

  @Post("gestao/artigos")
  @HttpCode(201)
  @UseGuards(AdminGuard)
  async createProduct(@Body() body: unknown) {
    const input = parseBody(productInputSchema, body);
    if (await this.repo.getProductBySlug(input.slug)) throw new ConflictException("Já há um artigo com este nome. Escolha outro.");
    const product: Product = await new TranslationService(this.options).fill(productTranslationSpec, { ...input, id: randomUUID(), updatedAt: this.now().toISOString() });
    await this.repo.saveProducts([product]);
    await this.changed();
    return product;
  }

  @Patch("gestao/artigos/:id")
  @UseGuards(AdminGuard)
  async updateProduct(@Param("id") id: string, @Body() body: unknown) {
    const current = await this.repo.getProduct(id);
    if (!current) throw new NotFoundException("Artigo não encontrado.");
    const { id: _id, updatedAt: _u, ...rest } = current;
    const input = parseBody(productInputSchema, { ...rest, ...(body as object) });
    const product: Product = await new TranslationService(this.options).fill(productTranslationSpec, { ...input, id, updatedAt: this.now().toISOString() }, current);
    await this.repo.saveProducts([product]);
    await this.changed();
    return product;
  }

  @Get("gestao/pedidos")
  @UseGuards(AdminGuard)
  orders() {
    return this.repo.listShopOrders();
  }

  /** "Registar donativo na banca": given in person, already paid and handed over. Counts for stock and transparency. */
  @Post("gestao/pedidos")
  @HttpCode(201)
  @UseGuards(AdminGuard)
  async giveInPerson(@Body() body: unknown) {
    const { items, amountCents } = parseBody(z.object({ items: z.array(orderLineInputSchema).min(1, "Escolha pelo menos uma oferta"), amountCents: donationAmountSchema.optional() }), body);
    const order = await this.serial(() => this.place({ items, ...(amountCents !== undefined ? { amountCents } : {}) }, true));
    await this.changed();
    return order;
  }

  /** Paid, delivered or cancelled. Cancelling puts the gifts back. */
  @Patch("gestao/pedidos/:id")
  @UseGuards(AdminGuard)
  async updateOrder(@Param("id") id: string, @Body() body: unknown) {
    const { status, teamNote } = parseBody(z.object({ status: z.enum(orderStatus).optional(), teamNote: z.string().max(500).optional() }), body);
    const order = await this.serial(async () => {
      const current = await this.repo.getShopOrder(id);
      if (!current) throw new NotFoundException("Pedido não encontrado.");
      let next: ShopOrder = teamNote !== undefined ? { ...current, teamNote: teamNote || undefined } : current;
      if (status && status !== current.status) {
        try {
          next = setOrderStatus(next, status, this.now());
        } catch (err) {
          throw new ConflictException((err as Error).message);
        }
        if (status === "cancelado") await this.repo.saveProducts(restock(await this.repo.listProducts(), current));
      }
      return this.repo.saveShopOrder(next);
    });
    await this.changed();
    return order;
  }

  @Get("gestao/gastos")
  @UseGuards(AdminGuard)
  spending() {
    return this.repo.listShopSpending();
  }

  @Post("gestao/gastos")
  @HttpCode(201)
  @UseGuards(AdminGuard)
  async addSpending(@Body() body: unknown) {
    const input = parseBody(shopSpendingSchema.extend({ id: shopSpendingSchema.shape.id.optional() }), body);
    const saved = await this.repo.saveShopSpending({ ...input, id: input.id ?? randomUUID() });
    await this.changed();
    return saved;
  }

  @Delete("gestao/gastos/:id")
  @HttpCode(204)
  @UseGuards(AdminGuard)
  async deleteSpending(@Param("id") id: string) {
    await this.repo.deleteShopSpending(id);
    await this.changed();
  }

  @Get("gestao/doacoes")
  @UseGuards(AdminGuard)
  itemDonations() {
    return this.repo.listItemDonations();
  }

  @Patch("gestao/doacoes/:id")
  @UseGuards(AdminGuard)
  async updateItemDonation(@Param("id") id: string, @Body() body: unknown) {
    const { status } = parseBody(z.object({ status: z.enum(itemDonationStatus) }), body);
    const current = (await this.repo.listItemDonations()).find((d) => d.id === id);
    if (!current) throw new NotFoundException("Oferta não encontrada.");
    return this.repo.saveItemDonation({ ...current, status });
  }

  @Put("gestao/definicoes")
  @UseGuards(AdminGuard)
  async saveSettings(@Body() body: unknown) {
    const input = parseBody(shopSettingsSchema, body);
    const saved = await this.repo.saveShopSettings({ address: input.address || undefined, landmark: input.landmark || undefined, hours: input.hours || undefined });
    await this.changed();
    return saved;
  }
}
