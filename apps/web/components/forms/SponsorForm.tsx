"use client";
import { useState, type FormEvent } from "react";
import { MIN_SPONSOR_AMOUNT } from "@gn/domain";
import { Button, Checkbox, ChoiceList, Notice, NextStep, TextArea, TextField } from "@gn/ui";
import { submitForm } from "@/lib/submit";

const amounts = ["5", "10", "20"] as const;

export function SponsorForm({ catSlug, catName, pronoun }: { catSlug: string; catName: string; pronoun: "a" | "o" }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "", website_url: "" });
  const [amount, setAmount] = useState<string>("10");
  const [other, setOther] = useState("");
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [summary, setSummary] = useState<string>();
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const set = (key: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setState("sending");
    const monthlyAmount = amount === "outro" ? other.replace(",", ".") : amount;
    const result = await submitForm("apadrinhar", { ...form, catSlug, monthlyAmount, consent: consent || undefined, message: form.message || undefined });
    if (result.ok) return setState("done");
    setErrors(result.fieldErrors);
    setSummary(result.message);
    setState("idle");
  }

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
        <p>Recebemos o seu pedido. Entramos em contacto nos próximos dias para combinar a contribuição. Depois disso recebe todos os meses notícias d{pronoun} {catName}.</p>
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
      <TextField id="nome" label="O seu nome" autoComplete="name" value={form.name} onChange={set("name")} error={errors.name} required />
      <TextField id="email" label="Email" hint={`Para receber as notícias d${pronoun} ${catName}.`} type="email" inputMode="email" autoComplete="email" value={form.email} onChange={set("email")} error={errors.email} required />
      <TextField id="telefone" label="Telefone (opcional)" type="tel" inputMode="tel" autoComplete="tel" value={form.phone} onChange={set("phone")} error={errors.phone} />
      <TextArea id="mensagem" label="Quer dizer-nos alguma coisa? (opcional)" value={form.message} onChange={set("message")} />
      <div className="honeypot" aria-hidden="true">
        <label htmlFor="website_url">Não preencher</label>
        <input id="website_url" tabIndex={-1} autoComplete="off" value={form.website_url} onChange={set("website_url")} />
      </div>
      <Checkbox id="consentimento" label="Aceito que a associação me contacte sobre este apadrinhamento" hint="Usamos os seus dados apenas para isto." checked={consent} onChange={setConsent} />
      {errors.consent ? <p className="gn-field__error">{errors.consent}</p> : null}
      <Button type="submit" disabled={state === "sending"} block>{state === "sending" ? "A enviar…" : "Enviar pedido"}</Button>
    </form>
  );
}
