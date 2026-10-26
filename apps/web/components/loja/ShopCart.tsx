"use client";
import { useState, type FormEvent } from "react";
import { centsFromText, DONATE_BUTTON_LABEL, euros, stockOf, type Delivery, type Payment, type Product, type ShopSettings } from "@gn/domain";
import { Button, Checkbox, ChoiceList, Modal, Notice, NextStep, TextArea, TextField } from "@gn/ui";
import { useCart, type CartLine } from "@/components/client/cart";
import { useModalHistory } from "@/components/client/FormModal";
import { placeShopOrder, type OrderPlaced } from "@/lib/submit";
import { PrivacyHint } from "@/components/forms/PrivacyHint";
import { PaymentSteps } from "./PaymentSteps";

/** The chosen gifts: change quantities, see the minimum donation, then donate in a window over the page. */
export function ShopCart({ products, settings }: { products: Product[]; settings: ShopSettings }) {
  const cart = useCart();
  const modal = useModalHistory();
  const [placed, setPlaced] = useState<{ order: OrderPlaced; payment: Payment; delivery: Delivery }>();

  if (!cart.ready) return <p className="muted">A abrir as suas ofertas…</p>;

  if (placed) {
    return (
      <NextStep
        title="Obrigado pelo seu donativo!"
        actions={<><Button href="/loja">Voltar à loja</Button><Button href="/ajudar" variant="secondary">Outras formas de ajudar</Button></>}
      >
        <PaymentSteps code={placed.order.code} totalCents={placed.order.totalCents} payment={placed.payment} delivery={placed.delivery} settings={settings} />
      </NextStep>
    );
  }

  if (cart.lines.length === 0) {
    return (
      <div className="gn-stack gn-stack--m">
        <p className="gn-lead">Ainda não escolheu nenhuma oferta.</p>
        <div className="action-row"><Button href="/loja">Ver as ofertas da loja</Button></div>
      </div>
    );
  }

  // Stock may have changed since the gift was chosen.
  const problem = (l: CartLine) => {
    const p = products.find((x) => x.id === l.productId);
    if (!p) return "Já não está disponível.";
    const left = stockOf(p, p.variants.length ? l.variant : undefined);
    if (left === 0) return "Esgotou entretanto.";
    if (left < l.quantity) return `Só há ${left}.`;
    return undefined;
  };
  const blocked = cart.lines.some(problem);

  return (
    <div className="gn-stack gn-stack--l">
      <ul className="cart-lines" aria-label="Ofertas escolhidas">
        {cart.lines.map((l) => {
          const issue = problem(l);
          const label = l.variant ? `${l.name}, tamanho ${l.variant}` : l.name;
          return (
            <li key={`${l.productId}-${l.variant ?? ""}`} className="cart-line">
              <img src={l.photo} alt="" width={96} height={72} />
              <div className="cart-line__info">
                <a href={`/loja/${l.slug}`} className="cart-line__name">{l.name}</a>
                {l.variant ? <span className="small muted">Tamanho {l.variant}</span> : null}
                <span>Donativo a partir de {euros(l.unitMinDonationCents)}{l.quantity > 1 ? " cada" : ""}</span>
                {issue ? <span className="gn-field__error">{issue}</span> : null}
              </div>
              <div className="cart-line__qty">
                <div className="qty" role="group" aria-label={`Quantidade de ${label}`}>
                  <button type="button" className="qty__btn" onClick={() => cart.setQuantity(l, l.quantity - 1)} aria-label={l.quantity === 1 ? `Tirar ${label}` : `Menos um: ${label}`}>−</button>
                  <output className="qty__value">{l.quantity}</output>
                  <button type="button" className="qty__btn" onClick={() => cart.setQuantity(l, l.quantity + 1)} disabled={l.quantity >= 10} aria-label={`Mais um: ${label}`}>+</button>
                </div>
                <Button variant="quiet" onClick={() => cart.setQuantity(l, 0)}>Tirar<span className="gn-sr-only"> {label}</span></Button>
              </div>
            </li>
          );
        })}
      </ul>
      <p className="cart-total">Donativo mínimo <strong>{euros(cart.minDonationCents)}</strong></p>
      <p className="small muted">A associação não vende: estas ofertas são o nosso obrigado pelo seu donativo. Pode dar mais do que o mínimo, e tudo o que der a mais vai para os gatos.</p>
      {blocked ? <Notice tone="warning" title="Algumas ofertas mudaram">Ajuste as quantidades marcadas a vermelho antes de fazer o donativo.</Notice> : null}
      <div className="action-row">
        <Button onClick={modal.show} disabled={blocked} aria-haspopup="dialog">Fazer o donativo</Button>
        <Button href="/loja" variant="secondary">Continuar a ver</Button>
      </div>
      <p className="small muted">Ainda não paga nada. Depois de enviar dizemos-lhe como pagar: MB WAY, transferência ou quando levantar.</p>
      <Modal open={modal.open} onClose={modal.hide} title="Fazer o donativo" intro={`Donativo a partir de ${euros(cart.minDonationCents)}. Escolha quanto quer dar e diga-nos como prefere receber e pagar.`}>
        <OrderForm
          lines={cart.lines}
          minDonationCents={cart.minDonationCents}
          settings={settings}
          onPlaced={(result) => { cart.clear(); modal.hide(); setPlaced(result); window.scrollTo({ top: 0 }); }}
        />
      </Modal>
    </div>
  );
}

/** Quick choices: the minimum, and a little or a lot more. */
const amountChoices = (min: number) => [min, min + 500, min + 1500].map(String);

function OrderForm({ lines, minDonationCents, settings, onPlaced }: { lines: CartLine[]; minDonationCents: number; settings: ShopSettings; onPlaced: (r: { order: OrderPlaced; payment: Payment; delivery: Delivery }) => void }) {
  const [amount, setAmount] = useState<string>(String(minDonationCents));
  const [other, setOther] = useState("");
  const amountCents = amount === "outro" ? centsFromText(other) : Number(amount);
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
    if (!Number.isFinite(amountCents) || amountCents < minDonationCents) {
      setErrors({ amountCents: `O donativo mínimo para estas ofertas é ${euros(minDonationCents)}.` });
      setSummary("Aumente o valor do donativo, por favor.");
      return;
    }
    setSending(true);
    const result = await placeShopOrder({
      ...form,
      amountCents,
      items: lines.map((l) => ({ productId: l.productId, ...(l.variant ? { variant: l.variant } : {}), quantity: l.quantity })),
      delivery,
      payment,
      address: delivery === "correio" ? form.address : undefined,
      message: form.message || undefined,
      consent: consent || undefined,
    }, amountCents);
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
        name="valor"
        legend="Quanto quer doar?"
        value={amount}
        onChange={setAmount}
        options={[...amountChoices(minDonationCents).map((v, i) => ({ value: v, label: euros(Number(v)), ...(i === 0 ? { hint: "O mínimo" } : {}) })), { value: "outro", label: "Outro valor" }]}
      />
      {amount === "outro" ? (
        <TextField id="outro-valor" label="Valor do donativo, em euros" hint={`A partir de ${euros(minDonationCents)}.`} inputMode="numeric" value={other} onChange={(e) => setOther(e.target.value)} error={errors.amountCents} required />
      ) : errors.amountCents ? <p className="gn-field__error">{errors.amountCents}</p> : null}
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
      <Checkbox id="consentimento" label="Tenho 18 anos ou mais e aceito que a associação me contacte sobre este donativo" hint={<PrivacyHint />} checked={consent} onChange={setConsent} />
      {errors.consent ? <p className="gn-field__error">{errors.consent}</p> : null}
      <p className="small">
        O seu donativo: <strong>{Number.isFinite(amountCents) && amountCents > 0 ? euros(amountCents) : "…"}</strong>{delivery === "correio" ? " mais os portes" : ""}.
        As ofertas são o nosso obrigado: não é uma compra.{" "}
        <a href="/loja/condicoes" target="_blank" rel="noopener">Como funcionam os donativos com oferta</a>
      </p>
      <Button type="submit" disabled={sending} block>{sending ? "A enviar…" : DONATE_BUTTON_LABEL}</Button>
    </form>
  );
}
