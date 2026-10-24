"use client";
import { useState, type FormEvent } from "react";
import { euros, ORDER_BUTTON_LABEL, stockOf, WITHDRAWAL_DAYS, type Delivery, type Payment, type Product, type ShopSettings } from "@gn/domain";
import { Button, Checkbox, ChoiceList, Modal, Notice, NextStep, TextArea, TextField } from "@gn/ui";
import { useCart, type CartLine } from "@/components/client/cart";
import { useModalHistory } from "@/components/client/FormModal";
import { placeShopOrder, type OrderPlaced } from "@/lib/submit";
import { PrivacyHint } from "@/components/forms/PrivacyHint";
import { PaymentSteps } from "./PaymentSteps";

/** The basket: change quantities, see the total, then order in a window over the page. */
export function ShopCart({ products, settings }: { products: Product[]; settings: ShopSettings }) {
  const cart = useCart();
  const modal = useModalHistory();
  const [placed, setPlaced] = useState<{ order: OrderPlaced; payment: Payment; delivery: Delivery }>();

  if (!cart.ready) return <p className="muted">A abrir o cesto…</p>;

  if (placed) {
    return (
      <NextStep
        title="Obrigado! O seu pedido foi enviado."
        actions={<><Button href="/loja">Voltar à loja</Button><Button href="/ajudar" variant="secondary">Outras formas de ajudar</Button></>}
      >
        <PaymentSteps code={placed.order.code} totalCents={placed.order.totalCents} payment={placed.payment} delivery={placed.delivery} settings={settings} />
      </NextStep>
    );
  }

  if (cart.lines.length === 0) {
    return (
      <div className="gn-stack gn-stack--m">
        <p className="gn-lead">O cesto está vazio.</p>
        <div className="action-row"><Button href="/loja">Ver os artigos da loja</Button></div>
      </div>
    );
  }

  // Stock may have changed since the article went into the basket.
  const problem = (l: CartLine) => {
    const p = products.find((x) => x.id === l.productId);
    if (!p) return "Já não está à venda.";
    const left = stockOf(p, p.variants.length ? l.variant : undefined);
    if (left === 0) return "Esgotou entretanto.";
    if (left < l.quantity) return `Só há ${left}.`;
    return undefined;
  };
  const blocked = cart.lines.some(problem);

  return (
    <div className="gn-stack gn-stack--l">
      <ul className="cart-lines" aria-label="Artigos no cesto">
        {cart.lines.map((l) => {
          const issue = problem(l);
          const label = l.variant ? `${l.name}, tamanho ${l.variant}` : l.name;
          return (
            <li key={`${l.productId}-${l.variant ?? ""}`} className="cart-line">
              <img src={l.photo} alt="" width={96} height={72} />
              <div className="cart-line__info">
                <a href={`/loja/${l.slug}`} className="cart-line__name">{l.name}</a>
                {l.variant ? <span className="small muted">Tamanho {l.variant}</span> : null}
                <span>{euros(l.unitPriceCents)} cada</span>
                {issue ? <span className="gn-field__error">{issue}</span> : null}
              </div>
              <div className="cart-line__qty">
                <div className="qty" role="group" aria-label={`Quantidade de ${label}`}>
                  <button type="button" className="qty__btn" onClick={() => cart.setQuantity(l, l.quantity - 1)} aria-label={l.quantity === 1 ? `Tirar ${label} do cesto` : `Menos um: ${label}`}>−</button>
                  <output className="qty__value">{l.quantity}</output>
                  <button type="button" className="qty__btn" onClick={() => cart.setQuantity(l, l.quantity + 1)} disabled={l.quantity >= 10} aria-label={`Mais um: ${label}`}>+</button>
                </div>
                <Button variant="quiet" onClick={() => cart.setQuantity(l, 0)}>Tirar<span className="gn-sr-only"> {label}</span></Button>
              </div>
            </li>
          );
        })}
      </ul>
      <p className="cart-total">Total <strong>{euros(cart.totalCents)}</strong>{settings.vatNote ? <span className="small muted"> {settings.vatNote}</span> : null}</p>
      {blocked ? <Notice tone="warning" title="Alguns artigos mudaram">Ajuste as quantidades marcadas a vermelho antes de fazer o pedido.</Notice> : null}
      <div className="action-row">
        <Button onClick={modal.show} disabled={blocked} aria-haspopup="dialog">Fazer o pedido</Button>
        <Button href="/loja" variant="secondary">Continuar a ver</Button>
      </div>
      <p className="small muted">Ainda não paga nada. Depois de enviar o pedido dizemos-lhe como pagar: MB WAY, transferência ou quando levantar.</p>
      <Modal open={modal.open} onClose={modal.hide} title="Fazer o pedido" intro={`Total: ${euros(cart.totalCents)}. Deixe o seu contacto e diga-nos como prefere receber e pagar.`}>
        <OrderForm
          lines={cart.lines}
          totalCents={cart.totalCents}
          settings={settings}
          onPlaced={(result) => { cart.clear(); modal.hide(); setPlaced(result); window.scrollTo({ top: 0 }); }}
        />
      </Modal>
    </div>
  );
}

function OrderForm({ lines, totalCents, settings, onPlaced }: { lines: CartLine[]; totalCents: number; settings: ShopSettings; onPlaced: (r: { order: OrderPlaced; payment: Payment; delivery: Delivery }) => void }) {
  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "", message: "", website_url: "" });
  const [delivery, setDelivery] = useState<Delivery>("levantar");
  const [payment, setPayment] = useState<Payment>("mbway");
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [summary, setSummary] = useState<string>();
  const [sending, setSending] = useState(false);
  const set = (key: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSending(true);
    const result = await placeShopOrder({
      ...form,
      items: lines.map((l) => ({ productId: l.productId, ...(l.variant ? { variant: l.variant } : {}), quantity: l.quantity })),
      delivery,
      payment,
      address: delivery === "correio" ? form.address : undefined,
      message: form.message || undefined,
      consent: consent || undefined,
    }, totalCents);
    setSending(false);
    if (result.ok && result.order) return onPlaced({ order: result.order, payment, delivery });
    if (!result.ok) {
      // The address rule only runs once the other fields are right; show it from the first try.
      const address: Record<string, string> = delivery === "correio" && form.address.trim().length < 10 ? { address: "Indique a morada completa, com código postal" } : {};
      setErrors({ ...address, ...result.fieldErrors });
      setSummary(result.message);
    }
  }

  const paymentOptions: { value: Payment; label: string; hint?: string }[] = [
    { value: "mbway", label: "MB WAY", hint: settings.mbwayPhone ? `Para o ${settings.mbwayPhone}` : "Ligamos-lhe para combinar" },
    { value: "transferencia", label: "Transferência bancária", hint: "Damos-lhe o IBAN a seguir" },
    ...(delivery === "levantar" ? [{ value: "ao-levantar" as const, label: "Pagar quando levantar", hint: "Em dinheiro ou MB WAY" }] : []),
  ];

  return (
    <form onSubmit={onSubmit} className="gn-stack gn-stack--m" noValidate>
      {summary ? <Notice tone="error" title="Falta corrigir alguns campos">{summary}</Notice> : null}
      <ChoiceList
        name="entrega"
        legend="Como quer receber?"
        value={delivery}
        onChange={(v) => { setDelivery(v); if (v === "correio" && payment === "ao-levantar") setPayment("mbway"); }}
        options={[
          { value: "levantar", label: "Levantar no gatil ou numa banca", hint: "Sem custos" },
          { value: "correio", label: "Receber pelo correio", hint: "Os portes pagam-se à parte e dizemos-lhe o valor antes de pagar" },
        ]}
      />
      {delivery === "correio" ? (
        <TextArea id="morada" label="Morada completa, com código postal" rows={3} value={form.address} onChange={set("address")} error={errors.address} required />
      ) : null}
      <ChoiceList name="pagamento" legend="Como quer pagar?" value={payment} onChange={setPayment} options={paymentOptions} />
      {errors.payment ? <p className="gn-field__error">{errors.payment}</p> : null}
      <TextField id="nome" label="O seu nome" autoComplete="name" value={form.name} onChange={set("name")} error={errors.name} required />
      <TextField id="telefone" label="Telemóvel" hint="Para avisarmos quando estiver pronto." type="tel" inputMode="tel" autoComplete="tel" value={form.phone} onChange={set("phone")} error={errors.phone} required />
      <TextField id="email" label="Email (opcional)" type="email" inputMode="email" autoComplete="email" value={form.email} onChange={set("email")} error={errors.email} />
      <TextArea id="mensagem" label="Quer dizer-nos alguma coisa? (opcional)" value={form.message} onChange={set("message")} />
      <div className="honeypot" aria-hidden="true">
        <label htmlFor="website_url">Não preencher</label>
        <input id="website_url" tabIndex={-1} autoComplete="off" value={form.website_url} onChange={set("website_url")} />
      </div>
      <Checkbox id="consentimento" label="Tenho 18 anos ou mais e aceito que a associação me contacte sobre este pedido" hint={<PrivacyHint />} checked={consent} onChange={setConsent} />
      {errors.consent ? <p className="gn-field__error">{errors.consent}</p> : null}
      <p className="small">
        Total a pagar: <strong>{euros(totalCents)}</strong>{delivery === "correio" ? " mais os portes" : ""}{settings.vatNote ? ` (${settings.vatNote})` : ""}.
        Pode desistir até {WITHDRAWAL_DAYS} dias depois de receber os artigos.{" "}
        <a href="/loja/condicoes" target="_blank" rel="noopener">Condições da loja</a>
      </p>
      <Button type="submit" disabled={sending} block>{sending ? "A enviar…" : ORDER_BUTTON_LABEL}</Button>
    </form>
  );
}
