import type { Product, ShopOrder, ShopSettings, ShopSpending, StoredItemDonation } from "./loja";

const now = "2026-10-20T10:00:00.000Z";

/** Example articles for previews. Prices and costs are examples: the team sets the real ones in the back office. */
export const seedProducts: Product[] = [
  {
    id: "art-tshirt", slug: "t-shirt-gatos-de-ninguem", name: "T-shirt Gatos de Ninguém", category: "roupa",
    description: "T-shirt preta de algodão com o gato do logótipo. Corte unissexo.",
    priceCents: 1500, costCents: 600, donated: false,
    photos: [{ url: "/loja/t-shirt.svg", alt: "T-shirt preta com o gato do logótipo e o nome Gatos de Ninguém" }],
    variants: [{ label: "S", stock: 3 }, { label: "M", stock: 6 }, { label: "L", stock: 4 }, { label: "XL", stock: 0 }], stock: 0, active: true, updatedAt: now,
  },
  {
    id: "art-caneca", slug: "caneca-gato-a-piscar-o-olho", name: "Caneca do gato a piscar o olho", category: "casa",
    description: "Caneca branca de 330 ml com o gato do logótipo. Pode ir à máquina da loiça.",
    priceCents: 900, costCents: 350, donated: false,
    photos: [{ url: "/loja/caneca.svg", alt: "Caneca branca com um gato preto de olhos amarelos" }],
    variants: [], stock: 12, active: true, updatedAt: now,
  },
  {
    id: "art-calendario", slug: "calendario-2027", name: "Calendário 2027 dos gatos do gatil", category: "casa",
    description: "Doze meses, doze gatos do gatil, fotografados pelos voluntários. Para pendurar na parede.",
    priceCents: 1000, costCents: 400, donated: false,
    photos: [{ url: "/loja/calendario.svg", alt: "Calendário de parede de 2027 com um gato preto na capa" }],
    variants: [], stock: 30, active: true, updatedAt: now,
  },
  {
    id: "art-saco", slug: "saco-de-pano-adote", name: "Saco de pano «Adote, não compre»", category: "acessorios",
    description: "Saco de algodão cru, resistente, para as compras do dia a dia.",
    priceCents: 800, costCents: 300, donated: false,
    photos: [{ url: "/loja/saco.svg", alt: "Saco de pano cor de areia com um gato preto e a frase Adote, não compre" }],
    variants: [], stock: 2, active: true, updatedAt: now,
  },
  {
    id: "art-crochet", slug: "gatinho-de-croche", name: "Gatinho de croché", category: "artesanato",
    description: "Feito à mão por uma voluntária. Cada um é diferente. Cerca de 15 cm.",
    priceCents: 1200, costCents: 200, donated: false,
    photos: [{ url: "/loja/crochet.svg", alt: "Gatinho amarelo de croché sentado, com a cauda enrolada" }],
    variants: [], stock: 4, active: true, updatedAt: now,
  },
  {
    id: "art-livro", slug: "livro-gatos-de-viana", name: "Livro de contos (usado)", category: "livros",
    description: "Livro de contos em português, em bom estado. Oferecido à loja por uma amiga da associação.",
    priceCents: 400, costCents: 0, donated: true,
    photos: [{ url: "/loja/livro.svg", alt: "Livro aberto com um pequeno gato preto no canto" }],
    variants: [], stock: 1, active: true, updatedAt: now,
  },
  {
    id: "art-porta-chaves", slug: "porta-chaves-gato", name: "Porta-chaves gato", category: "acessorios",
    description: "Porta-chaves em acrílico com o gato do logótipo.",
    priceCents: 400, costCents: 100, donated: false,
    photos: [{ url: "/loja/porta-chaves.svg", alt: "Porta-chaves com a cabeça de um gato preto de olhos amarelos" }],
    variants: [], stock: 0, active: true, updatedAt: now,
  },
];

export const seedShopOrders: ShopOrder[] = [
  {
    id: "enc-1", code: "L-7K3Q", name: "Helena Castro", phone: "912000011", delivery: "levantar", payment: "mbway", status: "novo", inPerson: false,
    lines: [{ productId: "art-caneca", name: "Caneca do gato a piscar o olho", quantity: 2, unitPriceCents: 900, unitForCatsCents: 550 }],
    totalCents: 1800, createdAt: "2026-10-22T19:10:00.000Z",
  },
  {
    id: "enc-2", code: "L-M4TS", name: "Paulo Rocha", phone: "913000012", email: "paulo@example.pt", delivery: "correio", address: "Rua do Exemplo 10, 4900-000 Viana do Castelo", payment: "transferencia", status: "pago", inPerson: false,
    lines: [{ productId: "art-tshirt", name: "T-shirt Gatos de Ninguém", variant: "M", quantity: 1, unitPriceCents: 1500, unitForCatsCents: 900 }],
    totalCents: 1500, createdAt: "2026-10-12T09:00:00.000Z", paidAt: "2026-10-13T10:00:00.000Z",
  },
  {
    id: "enc-3", code: "L-B9XW", name: "Venda na banca", delivery: "levantar", payment: "ao-levantar", status: "entregue", inPerson: true,
    lines: [
      { productId: "art-calendario", name: "Calendário 2027 dos gatos do gatil", quantity: 6, unitPriceCents: 1000, unitForCatsCents: 600 },
      { productId: "art-crochet", name: "Gatinho de croché", quantity: 3, unitPriceCents: 1200, unitForCatsCents: 1000 },
    ],
    totalCents: 9600, createdAt: "2026-10-04T15:00:00.000Z", paidAt: "2026-10-04T15:00:00.000Z", deliveredAt: "2026-10-04T15:00:00.000Z",
  },
];

/** Examples of what the shop's money paid for. */
export const seedShopSpending: ShopSpending[] = [
  { id: "gasto-1", date: "2026-10-06", description: "Ração húmida para os gatinhos bebés", amountCents: 3800 },
  { id: "gasto-2", date: "2026-10-15", description: "Vacinas da Estrela e do Tobias", amountCents: 3000 },
];

// IBAN as published on the association's current website. No MB WAY number until the team adds the real one.
export const seedShopSettings: ShopSettings = {
  iban: "PT50 0045 1436 4033 0203 2321 6",
  pickup: "No gatil, em Santa Marta de Portuzelo, aos sábados de manhã, ou numa banca da associação. Avisamos quando estiver pronto.",
  shipping: "Enviamos por CTT para todo o país. Os portes dependem do peso: dizemos-lhe o valor antes de pagar.",
};

export const seedItemDonations: StoredItemDonation[] = [
  { id: "doa-1", what: "Caixa com 10 livros infantis e 2 puzzles completos", category: "livros", condition: "como-novo", handover: "entrego", name: "Inês Faria", phone: "914000013", town: "Darque", consent: true, receivedAt: "2026-10-21T11:00:00.000Z", status: "nova" },
];
