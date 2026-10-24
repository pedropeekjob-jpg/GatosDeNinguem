import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  centsFromText, deliveryLabel, euros, forTheCatsCents, itemConditionLabel, itemDonationStatusLabel, itemHandoverLabel, orderStatusLabel, paymentLabel, productCategoryLabel, stockOf,
  type ItemDonationStatus, type OrderLineInput, type OrderStatus, type Product, type ProductCategory, type ProductInput, type ShopOrder, type StoredItemDonation,
} from "@gn/domain";
import { Badge, Button, Checkbox, ChoiceList, Notice, StatTile, TextArea, TextField } from "@gn/ui";
import { PhotoManager } from "../components/PhotoManager";
import { errorMessage, useApi } from "../lib/api";
import { photoSrc } from "../lib/photos";
import { slugify } from "../lib/slug";

type Tab = "pedidos" | "artigos" | "doacoes" | "contas";
const tabs: { key: Tab; label: string }[] = [
  { key: "pedidos", label: "Pedidos" },
  { key: "artigos", label: "Artigos" },
  { key: "doacoes", label: "Doações de artigos" },
  { key: "contas", label: "Contas e transparência" },
];
const when = (iso: string) => new Intl.DateTimeFormat("pt-PT", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Lisbon" }).format(new Date(iso));
const toEuroText = (cents: number) => (cents / 100).toFixed(2).replace(".", ",").replace(",00", "");

/** A new article started from something people offered: everything it sells for goes to the cats. */
type Draft = Partial<ProductInput>;

export function LojaPage({ today = new Date() }: { today?: Date }) {
  const [tab, setTab] = useState<Tab>("pedidos");
  const [draft, setDraft] = useState<Draft>();
  return (
    <div className="gn-stack gn-stack--l">
      <h1>Loja solidária</h1>
      <div className="tabs" role="tablist" aria-label="Loja">
        {tabs.map(({ key, label }) => (
          <button key={key} type="button" role="tab" aria-selected={tab === key} className="tabs__tab" onClick={() => { setTab(key); setDraft(undefined); }}>{label}</button>
        ))}
      </div>
      {tab === "pedidos" ? <Orders /> : null}
      {tab === "artigos" ? <Products draft={draft} onDraftUsed={() => setDraft(undefined)} /> : null}
      {tab === "doacoes" ? <Donations onSell={(d) => { setDraft(d); setTab("artigos"); }} /> : null}
      {tab === "contas" ? <Accounts today={today} /> : null}
    </div>
  );
}

// ---------- Pedidos ----------

const nextSteps: Record<OrderStatus, { status: OrderStatus; label: string }[]> = {
  novo: [{ status: "pago", label: "Marcar como pago" }],
  pago: [{ status: "entregue", label: "Marcar como entregue" }],
  entregue: [],
  cancelado: [],
};

function Orders() {
  const api = useApi();
  const qc = useQueryClient();
  const orders = useQuery({ queryKey: ["shop-orders"], queryFn: () => api.shopOrders() });
  const [all, setAll] = useState(false);
  const [selling, setSelling] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState<string>();
  const update = useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) => api.updateOrder(id, { status }),
    onSuccess: async () => {
      setConfirmCancel(undefined);
      await Promise.all([qc.invalidateQueries({ queryKey: ["shop-orders"] }), qc.invalidateQueries({ queryKey: ["shop-products"] }), qc.invalidateQueries({ queryKey: ["shop-summary"] })]);
    },
  });
  const open = (orders.data ?? []).filter((o) => o.status === "novo" || o.status === "pago");
  const shown = all ? orders.data ?? [] : open;

  return (
    <div className="gn-stack gn-stack--m">
      <p className="muted">Os pedidos do site chegam aqui. Quando o dinheiro chegar, marque como pago; quando a pessoa levar os artigos, como entregue. Cancelar devolve os artigos ao stock.</p>
      <div className="action-row">
        <Button onClick={() => setSelling((v) => !v)} variant={selling ? "secondary" : "primary"}>{selling ? "Fechar" : "Registar venda na banca"}</Button>
      </div>
      {selling ? <SellInPerson onDone={() => setSelling(false)} /> : null}
      <div className="action-row" role="group" aria-label="Mostrar">
        <Button variant={all ? "secondary" : "primary"} aria-pressed={!all} onClick={() => setAll(false)}>Por tratar ({open.length})</Button>
        <Button variant={all ? "primary" : "secondary"} aria-pressed={all} onClick={() => setAll(true)}>Todos</Button>
      </div>
      {orders.isError ? <Notice tone="error" title="Erro">{errorMessage(orders.error)}</Notice> : null}
      {update.isError ? <Notice tone="error" title="Não foi guardado">{errorMessage(update.error)}</Notice> : null}
      {orders.data && shown.length === 0 ? <p className="muted">Não há pedidos por tratar.</p> : null}
      <ul className="bo-list">
        {shown.map((o) => (
          <li key={o.id}>
            <OrderCard
              order={o}
              busy={update.isPending}
              confirming={confirmCancel === o.id}
              onStatus={(status) => (status === "cancelado" && confirmCancel !== o.id ? setConfirmCancel(o.id) : update.mutate({ id: o.id, status }))}
              onKeep={() => setConfirmCancel(undefined)}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

function OrderCard({ order: o, busy, confirming, onStatus, onKeep }: { order: ShopOrder; busy: boolean; confirming: boolean; onStatus: (s: OrderStatus) => void; onKeep: () => void }) {
  const tone = o.status === "novo" ? "warning" : o.status === "pago" ? "info" : o.status === "entregue" ? "success" : "neutral";
  return (
    <article className="shift" aria-label={`Pedido ${o.code}`}>
      <div className="shift__head">
        <span className="shift__title"><span className="bo-code">{o.code}</span> · {o.name}</span>
        <Badge tone={tone}>{orderStatusLabel[o.status]}</Badge>
      </div>
      <p className="small muted">{when(o.createdAt)}{o.inPerson ? " · Venda na banca" : ""}</p>
      {!o.inPerson ? (
        <p>
          {o.phone ? <a href={`tel:${o.phone.replace(/\s/g, "")}`}>{o.phone}</a> : null}
          {o.email ? <> · <a href={`mailto:${o.email}`}>{o.email}</a></> : null}
          <br />{deliveryLabel[o.delivery]}{o.address ? `: ${o.address}` : ""}
          <br />Pagamento: {paymentLabel[o.payment]}
        </p>
      ) : null}
      <ul className="order-lines">
        {o.lines.map((l, i) => <li key={i}>{l.quantity} × {l.name}{l.variant ? ` (${l.variant})` : ""} <span className="muted">{euros(l.unitPriceCents * l.quantity)}</span></li>)}
      </ul>
      <p><strong>Total {euros(o.totalCents)}</strong></p>
      {o.message ? <p className="small">“{o.message}”</p> : null}
      {o.teamNote ? <p className="small muted">Nota: {o.teamNote}</p> : null}
      {o.status === "novo" || o.status === "pago" ? (
        <div className="action-row">
          {nextSteps[o.status].map((s) => <Button key={s.status} disabled={busy} onClick={() => onStatus(s.status)}>{s.label}<span className="gn-sr-only"> ({o.code})</span></Button>)}
          {confirming ? (
            <>
              <Button variant="urgent" disabled={busy} onClick={() => onStatus("cancelado")}>Sim, cancelar o pedido {o.code}</Button>
              <Button variant="quiet" onClick={onKeep}>Não cancelar</Button>
            </>
          ) : (
            <Button variant="quiet" disabled={busy} onClick={() => onStatus("cancelado")}>Cancelar<span className="gn-sr-only"> pedido {o.code}</span></Button>
          )}
        </div>
      ) : null}
    </article>
  );
}

/** Sold at a stand or at the shelter: pick the articles, and stock and totals stay right. */
function SellInPerson({ onDone }: { onDone: () => void }) {
  const api = useApi();
  const qc = useQueryClient();
  const products = useQuery({ queryKey: ["shop-products"], queryFn: () => api.shopProducts() });
  const available = (products.data ?? []).filter((p) => p.active && stockOf(p) > 0);
  const [productId, setProductId] = useState("");
  const [variant, setVariant] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [lines, setLines] = useState<OrderLineInput[]>([]);
  const product = available.find((p) => p.id === productId);
  const sell = useMutation({
    mutationFn: () => api.sellInPerson(lines),
    onSuccess: async () => {
      await Promise.all([qc.invalidateQueries({ queryKey: ["shop-orders"] }), qc.invalidateQueries({ queryKey: ["shop-products"] }), qc.invalidateQueries({ queryKey: ["shop-summary"] })]);
      onDone();
    },
  });
  const nameOf = (l: OrderLineInput) => `${available.find((p) => p.id === l.productId)?.name ?? "Artigo"}${l.variant ? ` (${l.variant})` : ""}`;
  const total = lines.reduce((n, l) => n + (available.find((p) => p.id === l.productId)?.priceCents ?? 0) * l.quantity, 0);

  return (
    <div className="panel gn-stack gn-stack--s">
      <h2>Venda na banca</h2>
      <div className="gn-field">
        <label className="gn-field__label" htmlFor="venda-artigo">Artigo</label>
        <select id="venda-artigo" className="gn-input" value={productId} onChange={(e) => { setProductId(e.target.value); setVariant(""); }}>
          <option value="">Escolha um artigo</option>
          {available.map((p) => <option key={p.id} value={p.id}>{p.name} · {euros(p.priceCents)}</option>)}
        </select>
      </div>
      {product && product.variants.length > 0 ? (
        <div className="gn-field">
          <label className="gn-field__label" htmlFor="venda-tamanho">Tamanho</label>
          <select id="venda-tamanho" className="gn-input" value={variant} onChange={(e) => setVariant(e.target.value)}>
            <option value="">Escolha</option>
            {product.variants.filter((v) => v.stock > 0).map((v) => <option key={v.label} value={v.label}>{v.label} (restam {v.stock})</option>)}
          </select>
        </div>
      ) : null}
      <TextField id="venda-qtd" label="Quantidade" type="number" inputMode="numeric" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
      <div>
        <Button
          variant="secondary"
          disabled={!product || (product.variants.length > 0 && !variant) || Number(quantity) < 1}
          onClick={() => { setLines((ls) => [...ls, { productId, ...(variant ? { variant } : {}), quantity: Number(quantity) }]); setProductId(""); setVariant(""); setQuantity("1"); }}
        >
          Juntar à venda
        </Button>
      </div>
      {lines.length > 0 ? (
        <>
          <ul className="order-lines">{lines.map((l, i) => <li key={i}>{l.quantity} × {nameOf(l)} <Button variant="quiet" onClick={() => setLines((ls) => ls.filter((_, j) => j !== i))}>Tirar<span className="gn-sr-only"> {nameOf(l)}</span></Button></li>)}</ul>
          <p><strong>Total {euros(total)}</strong></p>
        </>
      ) : null}
      {sell.isError ? <Notice tone="error" title="Não foi registada">{errorMessage(sell.error)}</Notice> : null}
      <div><Button disabled={lines.length === 0 || sell.isPending} onClick={() => sell.mutate()}>{sell.isPending ? "A registar…" : "Registar venda"}</Button></div>
    </div>
  );
}

// ---------- Artigos ----------

function Products({ draft, onDraftUsed }: { draft?: Draft; onDraftUsed: () => void }) {
  const api = useApi();
  const products = useQuery({ queryKey: ["shop-products"], queryFn: () => api.shopProducts() });
  const [editing, setEditing] = useState<Product | "novo" | undefined>(draft ? "novo" : undefined);
  if (editing) return <ProductForm product={editing === "novo" ? undefined : editing} draft={editing === "novo" ? draft : undefined} onClose={() => { setEditing(undefined); onDraftUsed(); }} />;
  return (
    <div className="gn-stack gn-stack--m">
      <div><Button onClick={() => setEditing("novo")}>Adicionar artigo</Button></div>
      {products.isError ? <Notice tone="error" title="Erro">{errorMessage(products.error)}</Notice> : null}
      <ul className="cat-list">
        {products.data?.map((p) => {
          const left = stockOf(p);
          return (
            <li key={p.id} className="shift">
              <img src={p.photos[0] ? photoSrc(p.photos[0].url) : undefined} alt="" width={96} height={72} />
              <div className="gn-stack gn-stack--s">
                <p className="shift__title">{p.name}</p>
                <p className="small muted">{euros(p.priceCents)} · {euros(forTheCatsCents(p))} para os gatos · {p.variants.length ? p.variants.map((v) => `${v.label}: ${v.stock}`).join(", ") : `${left} em stock`}</p>
                <div className="action-row">
                  {!p.active ? <Badge tone="neutral">Escondido do site</Badge> : left === 0 ? <Badge tone="warning">Esgotado</Badge> : null}
                  {p.donated ? <Badge tone="info">Doado</Badge> : null}
                </div>
              </div>
              <Button variant="secondary" onClick={() => setEditing(p)}>Editar<span className="gn-sr-only"> {p.name}</span></Button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

const categoryOptions = (Object.keys(productCategoryLabel) as ProductCategory[]).map((c) => ({ value: c, label: productCategoryLabel[c] }));

function ProductForm({ product, draft, onClose }: { product?: Product; draft?: Draft; onClose: () => void }) {
  const api = useApi();
  const qc = useQueryClient();
  const start = product ?? draft;
  const [f, setF] = useState({
    name: start?.name ?? "",
    category: start?.category ?? ("roupa" as ProductCategory),
    description: start?.description ?? "",
    price: start?.priceCents ? toEuroText(start.priceCents) : "",
    cost: start?.costCents ? toEuroText(start.costCents) : "",
    donated: start?.donated ?? false,
    hasVariants: (start?.variants?.length ?? 0) > 0,
    variants: (start?.variants ?? []).map((v) => ({ label: v.label, stock: String(v.stock) })),
    stock: String(start?.stock ?? 1),
    active: start?.active ?? true,
    photos: start?.photos ?? [],
  });
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((x) => ({ ...x, [k]: v }));
  const priceCents = centsFromText(f.price);
  const costCents = f.donated ? 0 : centsFromText(f.cost || "0");
  const preview = Number.isFinite(priceCents) && Number.isFinite(costCents) && priceCents > costCents ? priceCents - costCents : undefined;

  const save = useMutation({
    mutationFn: () => {
      if (f.photos.length === 0) throw new Error("Adicione pelo menos uma fotografia.");
      if (f.photos.some((p) => p.alt.trim().length < 3)) throw new Error("Escreva uma descrição curta em cada fotografia.");
      if (!Number.isFinite(priceCents) || priceCents <= 0) throw new Error("Indique o preço, por exemplo 9 ou 2,50.");
      if (!Number.isFinite(costCents)) throw new Error("Indique o custo, por exemplo 3,50, ou deixe em branco.");
      const input: ProductInput = {
        slug: product?.slug ?? slugify(f.name),
        name: f.name.trim(),
        category: f.category,
        description: f.description.trim(),
        priceCents,
        costCents,
        donated: f.donated,
        photos: f.photos.map((p) => ({ url: p.url, alt: p.alt.trim() })),
        variants: f.hasVariants ? f.variants.filter((v) => v.label.trim()).map((v) => ({ label: v.label.trim(), stock: Math.max(0, Math.round(Number(v.stock) || 0)) })) : [],
        stock: f.hasVariants ? 0 : Math.max(0, Math.round(Number(f.stock) || 0)),
        active: f.active,
      };
      return product ? api.updateProduct(product.id, input) : api.createProduct(input);
    },
    onSuccess: async () => { await qc.invalidateQueries({ queryKey: ["shop-products"] }); onClose(); },
  });

  return (
    <form className="gn-stack gn-stack--m" onSubmit={(e) => { e.preventDefault(); save.mutate(); }}>
      <div><Button variant="quiet" onClick={onClose}>← Voltar</Button></div>
      <h2>{product ? `Editar ${product.name}` : "Novo artigo"}</h2>
      {draft ? <Notice tone="info" title="A partir de uma doação">Confirme o nome, o preço e tire uma fotografia. O valor da venda vai todo para os gatos.</Notice> : null}
      <TextField id="a-nome" label="Nome" value={f.name} onChange={(e) => set("name", e.target.value)} hint={!product && f.name ? `Endereço: /loja/${slugify(f.name)}` : undefined} />
      <section className="gn-stack gn-stack--s" aria-labelledby="a-fotos">
        <h3 id="a-fotos">Fotografias</h3>
        <PhotoManager photos={f.photos} onChange={(photos) => set("photos", photos)} altFor={(n) => `${f.name || "Artigo"}, foto ${n}`} />
      </section>
      <ChoiceList name="a-categoria" legend="Categoria" value={f.category} onChange={(v) => set("category", v)} options={categoryOptions} />
      <TextArea id="a-descricao" label="Descrição" hint="Material, tamanho, quem fez. Uma ou duas frases chegam." rows={3} value={f.description} onChange={(e) => set("description", e.target.value)} />
      <TextField id="a-preco" label="Preço de venda (euros)" inputMode="numeric" value={f.price} onChange={(e) => set("price", e.target.value)} />
      <Checkbox id="a-doado" label="Foi oferecido à loja" hint="Não custou nada à associação: o preço vai todo para os gatos." checked={f.donated} onChange={(v) => set("donated", v)} />
      {!f.donated ? <TextField id="a-custo" label="Quanto custou à associação, por unidade (euros)" hint="Aparece no site para quem compra saber quanto vai para os gatos." inputMode="numeric" value={f.cost} onChange={(e) => set("cost", e.target.value)} /> : null}
      {preview !== undefined ? <p className="panel">No site: <strong>{euros(preview)}</strong> de cada venda vão para os gatos.</p> : null}
      <Checkbox id="a-variantes" label="Tem tamanhos ou cores" checked={f.hasVariants} onChange={(v) => set("hasVariants", v)} />
      {f.hasVariants ? (
        <fieldset className="bo-fieldset">
          <legend>Tamanhos ou cores, e quantos há de cada</legend>
          {f.variants.map((v, i) => (
            <div key={i} className="row-2">
              <TextField id={`a-var-${i}`} label={`Opção ${i + 1}`} value={v.label} onChange={(e) => set("variants", f.variants.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} />
              <TextField id={`a-var-stock-${i}`} label={`Quantos há (opção ${i + 1})`} type="number" inputMode="numeric" value={v.stock} onChange={(e) => set("variants", f.variants.map((x, j) => (j === i ? { ...x, stock: e.target.value } : x)))} />
            </div>
          ))}
          <div><Button variant="secondary" onClick={() => set("variants", [...f.variants, { label: "", stock: "0" }])}>Juntar opção</Button></div>
        </fieldset>
      ) : (
        <TextField id="a-stock" label="Quantos há" type="number" inputMode="numeric" value={f.stock} onChange={(e) => set("stock", e.target.value)} />
      )}
      <Checkbox id="a-ativo" label="Mostrar no site" hint="Desligue para esconder o artigo sem perder os pedidos antigos." checked={f.active} onChange={(v) => set("active", v)} />
      {save.isError ? <Notice tone="error" title="Não foi guardado">{errorMessage(save.error)}</Notice> : null}
      <div><Button type="submit" disabled={save.isPending}>{save.isPending ? "A guardar…" : "Guardar artigo"}</Button></div>
    </form>
  );
}

// ---------- Doações de artigos ----------

const donationActions: Record<ItemDonationStatus, { status: ItemDonationStatus; label: string; variant?: "secondary" | "quiet" }[]> = {
  nova: [{ status: "aceite", label: "Aceitar" }, { status: "recusada", label: "Recusar", variant: "quiet" }],
  aceite: [{ status: "recebida", label: "Já recebemos" }, { status: "recusada", label: "Recusar", variant: "quiet" }],
  recebida: [],
  recusada: [],
};

function Donations({ onSell }: { onSell: (d: Draft) => void }) {
  const api = useApi();
  const qc = useQueryClient();
  const offers = useQuery({ queryKey: ["item-donations"], queryFn: () => api.itemDonations() });
  const update = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ItemDonationStatus }) => api.setItemDonationStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["item-donations"] }),
  });
  const sellDraft = (d: StoredItemDonation): Draft => ({ name: "", category: d.category, description: d.what, donated: true, costCents: 0, stock: 1 });
  return (
    <div className="gn-stack gn-stack--m">
      <p className="muted">Pessoas que querem oferecer coisas para vender. Ligue, aceite ou recuse, e quando chegarem ponha-as à venda.</p>
      {offers.isError ? <Notice tone="error" title="Erro">{errorMessage(offers.error)}</Notice> : null}
      {update.isError ? <Notice tone="error" title="Não foi guardado">{errorMessage(update.error)}</Notice> : null}
      {offers.data?.length === 0 ? <p className="muted">Ainda não há ofertas.</p> : null}
      <ul className="bo-list">
        {offers.data?.map((d) => (
          <li key={d.id}>
            <article className="shift" aria-label={`Oferta de ${d.name}`}>
              <div className="shift__head">
                <span className="shift__title">{d.name}</span>
                <Badge tone={d.status === "nova" ? "warning" : d.status === "recusada" ? "neutral" : "success"}>{itemDonationStatusLabel[d.status]}</Badge>
              </div>
              <p className="small muted">{when(d.receivedAt)} · {d.town}</p>
              <p>{d.what}</p>
              <p className="small">{itemConditionLabel[d.condition]} · {itemHandoverLabel[d.handover]}</p>
              <p><a href={`tel:${d.phone.replace(/\s/g, "")}`}>{d.phone}</a>{d.email ? <> · <a href={`mailto:${d.email}`}>{d.email}</a></> : null}</p>
              <div className="action-row">
                {donationActions[d.status].map((a) => (
                  <Button key={a.status} variant={a.variant ?? "primary"} disabled={update.isPending} onClick={() => update.mutate({ id: d.id, status: a.status })}>{a.label}<span className="gn-sr-only"> (oferta de {d.name})</span></Button>
                ))}
                {d.status === "recebida" ? <Button variant="secondary" onClick={() => onSell(sellDraft(d))}>Pôr à venda<span className="gn-sr-only"> (oferta de {d.name})</span></Button> : null}
              </div>
            </article>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------- Contas ----------

const SITE_URL = import.meta.env.VITE_SITE_URL ?? "http://localhost:3000";

function Accounts({ today }: { today: Date }) {
  const api = useApi();
  const qc = useQueryClient();
  const summary = useQuery({ queryKey: ["shop-summary"], queryFn: () => api.shopSummary() });
  const [spend, setSpend] = useState({ date: today.toISOString().slice(0, 10), description: "", amount: "" });
  const add = useMutation({
    mutationFn: () => {
      const amountCents = centsFromText(spend.amount);
      if (!Number.isFinite(amountCents) || amountCents <= 0) throw new Error("Indique o valor, por exemplo 38 ou 12,50.");
      return api.addSpending({ date: spend.date, description: spend.description.trim(), amountCents });
    },
    onSuccess: async () => { setSpend((s) => ({ ...s, description: "", amount: "" })); await qc.invalidateQueries({ queryKey: ["shop-summary"] }); },
  });
  const remove = useMutation({ mutationFn: (id: string) => api.deleteSpending(id), onSuccess: () => qc.invalidateQueries({ queryKey: ["shop-summary"] }) });
  const t = summary.data?.transparency;
  const available = t ? t.forTheCatsCents - t.spentCents : 0;

  return (
    <div className="gn-stack gn-stack--l">
      {summary.isError ? <Notice tone="error" title="Erro">{errorMessage(summary.error)}</Notice> : null}
      {t ? (
        <section className="gn-stack gn-stack--s">
          <h2>Em {t.year}</h2>
          <div className="stats">
            <StatTile value={euros(t.salesCents)} label="em vendas pagas" />
            <StatTile value={euros(t.forTheCatsCents)} label="para os gatos, sem o custo dos artigos" />
            <StatTile value={euros(t.spentCents)} label="já gastos (lista abaixo)" />
            <StatTile value={euros(Math.max(0, available))} label="por gastar" />
          </div>
          <p className="small muted">Estes números e a lista de gastos aparecem na <a href={`${SITE_URL}/loja#para-onde-vai`} target="_blank" rel="noreferrer">página da loja</a>.</p>
        </section>
      ) : null}

      <section className="gn-stack gn-stack--s">
        <h2>Em que foi gasto</h2>
        <form className="panel gn-stack gn-stack--s" onSubmit={(e) => { e.preventDefault(); add.mutate(); }}>
          <div className="row-2">
            <TextField id="g-data" label="Data" type="date" value={spend.date} onChange={(e) => setSpend({ ...spend, date: e.target.value })} />
            <TextField id="g-valor" label="Valor (euros)" inputMode="numeric" value={spend.amount} onChange={(e) => setSpend({ ...spend, amount: e.target.value })} />
          </div>
          <TextField id="g-desc" label="Em quê" hint="Escrito para o público, por exemplo: Ração húmida para os gatinhos bebés." value={spend.description} onChange={(e) => setSpend({ ...spend, description: e.target.value })} />
          {add.isError ? <Notice tone="error" title="Não foi guardado">{errorMessage(add.error)}</Notice> : null}
          <div><Button type="submit" disabled={add.isPending}>Juntar gasto</Button></div>
        </form>
        <ul className="bo-list">
          {t?.spending.map((s) => (
            <li key={s.id} className="care-row">
              <span>{s.date}</span>
              <span>{s.description} · <strong>{euros(s.amountCents)}</strong></span>
              <Button variant="quiet" disabled={remove.isPending} onClick={() => remove.mutate(s.id)}>Apagar<span className="gn-sr-only"> {s.description}</span></Button>
            </li>
          ))}
        </ul>
      </section>

      {summary.data ? <Settings key={JSON.stringify(summary.data.settings)} initial={summary.data.settings} /> : null}
    </div>
  );
}

function Settings({ initial }: { initial: { mbwayPhone?: string; iban: string; pickup: string; shipping: string } }) {
  const api = useApi();
  const qc = useQueryClient();
  const [s, setS] = useState({ ...initial, mbwayPhone: initial.mbwayPhone ?? "" });
  const save = useMutation({
    mutationFn: () => api.saveShopSettings({ ...s, mbwayPhone: s.mbwayPhone.trim() || undefined }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["shop-summary"] }),
  });
  return (
    <form className="gn-stack gn-stack--s" onSubmit={(e) => { e.preventDefault(); save.mutate(); }}>
      <h2>Pagamento e entrega</h2>
      <p className="muted">Aparece a quem faz um pedido, logo a seguir a enviar.</p>
      <TextField id="d-mbway" label="Número MB WAY da associação" hint="Sem número, dizemos a quem escolhe MB WAY que lhe ligamos para combinar." type="tel" inputMode="tel" value={s.mbwayPhone} onChange={(e) => setS({ ...s, mbwayPhone: e.target.value })} />
      <TextField id="d-iban" label="IBAN para transferências" value={s.iban} onChange={(e) => setS({ ...s, iban: e.target.value })} />
      <TextArea id="d-levantar" label="Onde e quando levantar" rows={2} value={s.pickup} onChange={(e) => setS({ ...s, pickup: e.target.value })} />
      <TextArea id="d-correio" label="Envios pelo correio" rows={2} value={s.shipping} onChange={(e) => setS({ ...s, shipping: e.target.value })} />
      {save.isError ? <Notice tone="error" title="Não foi guardado">{errorMessage(save.error)}</Notice> : null}
      {save.isSuccess ? <p role="status">Guardado</p> : null}
      <div><Button type="submit" disabled={save.isPending}>Guardar</Button></div>
    </form>
  );
}
