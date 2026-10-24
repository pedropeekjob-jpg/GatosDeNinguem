"use client";
import { useState, type FormEvent } from "react";
import { Button, Checkbox, Notice, NextStep, TextArea, TextField } from "@gn/ui";
import { submitForm } from "@/lib/submit";
import { PrivacyHint } from "@/components/forms/PrivacyHint";

export function PartnerApplicationForm() {
  const [form, setForm] = useState({ businessName: "", contactName: "", email: "", phone: "", town: "", offer: "", website_url: "" });
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [summary, setSummary] = useState<string>();
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const set = (key: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setState("sending");
    const result = await submitForm("parceiro", { ...form, phone: form.phone || undefined, consent: consent || undefined });
    if (result.ok) return setState("done");
    setErrors(result.fieldErrors);
    setSummary(result.message);
    setState("idle");
  }

  if (state === "done") {
    return (
      <NextStep title="Obrigado! Entraremos em contacto em breve." actions={<Button href="/ajudar" variant="secondary">Outras formas de ajudar</Button>}>
        <p>Enquanto isso, pode seguir-nos no Facebook e Instagram para conhecer o nosso trabalho.</p>
      </NextStep>
    );
  }
  return (
    <form onSubmit={onSubmit} className="gn-stack gn-stack--m" noValidate>
      {summary ? <Notice tone="error" title="Falta corrigir alguns campos">{summary}</Notice> : null}
      <TextField id="p-negocio" label="Nome do negócio" autoComplete="organization" value={form.businessName} onChange={set("businessName")} error={errors.businessName} />
      <TextField id="p-nome" label="O seu nome" autoComplete="name" value={form.contactName} onChange={set("contactName")} error={errors.contactName} />
      <TextField id="p-email" label="Email" type="email" inputMode="email" autoComplete="email" value={form.email} onChange={set("email")} error={errors.email} />
      <TextField id="p-telefone" label="Telefone (opcional)" type="tel" inputMode="tel" autoComplete="tel" value={form.phone} onChange={set("phone")} />
      <TextField id="p-localidade" label="Localidade" value={form.town} onChange={set("town")} error={errors.town} />
      <TextArea id="p-oferta" label="Que vantagem gostaria de oferecer? (opcional)" hint="Por exemplo: 10% de desconto, um café oferecido, uma consulta a preço solidário." value={form.offer} onChange={set("offer")} />
      <div className="honeypot" aria-hidden="true">
        <label htmlFor="p-website_url">Não preencher</label>
        <input id="p-website_url" tabIndex={-1} autoComplete="off" value={form.website_url} onChange={set("website_url")} />
      </div>
      <Checkbox id="p-consentimento" label="Aceito que a associação me contacte sobre esta parceria" hint={<PrivacyHint />} checked={consent} onChange={setConsent} />
      {errors.consent ? <p className="gn-field__error">{errors.consent}</p> : null}
      <Button type="submit" disabled={state === "sending"} block>{state === "sending" ? "A enviar…" : "Enviar pedido"}</Button>
    </form>
  );
}
