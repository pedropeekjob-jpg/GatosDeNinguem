import type { ItemDonationStatus, OrderLineInput, OrderStatus, Product, ProductInput, ShopOrder, ShopSettings, ShopSpending, ShopTransparency, StoredItemDonation } from "@gn/domain";

/** What the back office asks the API about the Loja solidária. */
export interface LojaApi {
  shopProducts(): Promise<Product[]>;
  createProduct(input: ProductInput): Promise<Product>;
  updateProduct(id: string, changes: Partial<ProductInput>): Promise<Product>;
  shopOrders(): Promise<ShopOrder[]>;
  updateOrder(id: string, changes: { status?: OrderStatus; teamNote?: string }): Promise<ShopOrder>;
  /** A sale at a stand or at the shelter: already paid and handed over. */
  sellInPerson(items: OrderLineInput[]): Promise<ShopOrder>;
  shopSummary(): Promise<{ settings: ShopSettings; transparency: ShopTransparency }>;
  addSpending(s: Omit<ShopSpending, "id">): Promise<ShopSpending>;
  deleteSpending(id: string): Promise<void>;
  saveShopSettings(s: ShopSettings): Promise<ShopSettings>;
  itemDonations(): Promise<StoredItemDonation[]>;
  setItemDonationStatus(id: string, status: ItemDonationStatus): Promise<StoredItemDonation>;
}

type Call = <T>(method: string, path: string, body?: unknown) => Promise<T>;

export const lojaHttp = (call: Call): LojaApi => ({
  shopProducts: () => call("GET", "/loja/gestao/artigos"),
  createProduct: (input) => call("POST", "/loja/gestao/artigos", input),
  updateProduct: (id, changes) => call("PATCH", `/loja/gestao/artigos/${id}`, changes),
  shopOrders: () => call("GET", "/loja/gestao/pedidos"),
  updateOrder: (id, changes) => call("PATCH", `/loja/gestao/pedidos/${id}`, changes),
  sellInPerson: (items) => call("POST", "/loja/gestao/pedidos", { items }),
  shopSummary: () => call("GET", "/loja/resumo"),
  addSpending: (s) => call("POST", "/loja/gestao/gastos", s),
  deleteSpending: (id) => call("DELETE", `/loja/gestao/gastos/${id}`),
  saveShopSettings: (s) => call("PUT", "/loja/gestao/definicoes", s),
  itemDonations: () => call("GET", "/loja/gestao/doacoes"),
  setItemDonationStatus: (id, status) => call("PATCH", `/loja/gestao/doacoes/${id}`, { status }),
});
