"use client";
import { useState, type FormEvent } from "react";
import { MIN_SPONSOR_AMOUNT } from "@gn/domain";
import { Button, Checkbox, ChoiceList, Notice, NextStep, TextArea, TextField } from "@gn/ui";
import { requestSponsorship } from "@/lib/submit";

const amounts = ["5", "10", "20"] as const;

export function SponsorForm({ catSlug, catName, pronoun }: { catSlug: string; catName: string; pronoun: "a" | "o" }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "", website_url: "" });
  const [amount, setAmount] = useState<string>("10");
  const [other, setOther] = useState("");
  const [payment, setPayment] = useState<"debito" | "combinar">("debito");
  const [newsByEmail, setNewsByEmail] = useState(false);
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [summary, setSummary] = useState<string>();
  const [state, setState] = useState<"idle" | "sending" | "a-abrir-banco" | "done">("idle");
  const set = (key: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setState("sending");
    const monthlyAmount = amount === "outro" ? other.replace(",", ".") : amount;
    const result = await requestSponsorship({ ...form, catSlug, monthlyAmount, payment, newsByEmail, consent: consent || undefined, message: form.message || undefined });
    if (result.ok && result.checkoutUrl) {
      setState("a-abrir-banco");
      window.location.assign(result.checkoutUrl);
      return;
    }
    if (result.ok) return setState("done");
    setErrors(result.fieldErrors);
    setSummary(result.message);
    setState("idle");
  }

  if (state === "a-abrir-banco") return <p role="status">A abrir a página segura do débito direto…</p>;

  if (state === "done") {
    return (
      <NextStep
        title={`Obrigado! ${catName} agradece.`}
        actions={
          <>
            <Button href={`/adotar/${catSlug}`}>Ver {pronoun} {catName}</Button>
            <Button href="/ajudar" variant="secondary">Outras formas de ajudar</Button>
          </>
        }
      >
        {payment === "debito" ? (
          <p>Recebemos o seu pedido. Na próxima vez que entrar em <a href="/conta/afilhados">A minha conta</a> com este email, pode ativar o débito mensal e acompanhar {pronoun} {catName}. Se o débito ainda não estiver disponível, entramos em contacto nos próximos dias.</p>
        ) : (
          <p>Recebemos o seu pedido. Entramos em contacto nos próximos dias para combinar a contribuição. Depois disso pode acompanhar {pronoun} {catName} em <a href="/conta/afilhados">A minha conta</a>, com este email.</p>
        )}
      </NextStep>
    );
  }

  return (
    <form onSubmit={onSubmit} className="gn-stack gn-stack--m" noValidate>
      {summary ? <Notice tone="error" title="Falta corrigir alguns campos">{summary}</Notice> : null}
      <ChoiceList
        name="valor"
        legend="Quanto quer dar por mês?"
        value={amount}
        onChange={setAmount}
        options={[...amounts.map((v) => ({ value: v, label: `${v} €` })), { value: "outro", label: "Outro valor" }]}
      />
      {amount === "outro" ? (
        <TextField id="outro-valor" label="Valor por mês, em euros" hint={`A partir de ${MIN_SPONSOR_AMOUNT} euros.`} inputMode="numeric" value={other} onChange={(e) => setOther(e.target.value)} error={errors.monthlyAmount} required />
      ) : errors.monthlyAmount ? <p className="gn-field__error">{errors.monthlyAmount}</p> : null}
      <ChoiceList
        name="pagamento"
        legend="Como quer contribuir?"
        value={payment}
        onChange={(v) => setPayment(v as typeof payment)}
        options={[
          { value: "debito", label: "Débito direto todos os meses", hint: "Indica o IBAN numa página segura a seguir. Cancela quando quiser, na sua conta." },
          { value: "combinar", label: "Prefiro combinar convosco", hint: "Transferência ou MB WAY. Entramos em contacto." },
        ]}
      />
      <TextField id="nome" label="O seu nome" autoComplete="name" value={form.name} onChange={set("name")} error={errors.name} required />
      <TextField id="email" label="Email" hint={`Para entrar na sua conta e acompanhar ${pronoun} ${catName}.`} type="email" inputMode="email" autoComplete="email" value={form.email} onChange={set("email")} error={errors.email} required />
      <TextField id="telefone" label="Telefone (opcional)" type="tel" inputMode="tel" autoComplete="tel" value={form.phone} onChange={set("phone")} error={errors.phone} />
      <TextArea id="mensagem" label="Quer dizer-nos alguma coisa? (opcional)" value={form.message} onChange={set("message")} />
      <div className="honeypot" aria-hidden="true">
        <label htmlFor="website_url">Não preencher</label>
        <input id="website_url" tabIndex={-1} autoComplete="off" value={form.website_url} onChange={set("website_url")} />
      </div>
      <Checkbox id="noticias-email" label={`Quero receber por email as novidades d${pronoun} ${catName}`} hint="Pode mudar isto quando quiser. As novidades estão sempre na sua conta." checked={newsByEmail} onChange={setNewsByEmail} />
      <Checkbox
        id="consentimento"
        label="Tenho 18 anos ou mais e aceito que a associação me contacte sobre este apadrinhamento"
        hint={<>Usamos os seus dados apenas para isto. Saiba mais na <a href="/privacidade">política de privacidade</a>.</>}
        checked={consent}
        onChange={setConsent}
      />
      {errors.consent ? <p className="gn-field__error">{errors.consent}</p> : null}
      <Button type="submit" disabled={state === "sending"} block>{state === "sending" ? "A enviar…" : payment === "debito" ? "Continuar para o débito" : "Enviar pedido"}</Button>
    </form>
  );
}
