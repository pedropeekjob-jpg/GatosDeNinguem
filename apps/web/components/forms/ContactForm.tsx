"use client";
import { useEffect, useState, type FormEvent } from "react";
import { contactTopics, isContactTopic, type ContactTopic } from "@gn/domain";
import { Button, Checkbox, Notice, NextStep, TextArea, TextField } from "@gn/ui";
import { submitForm } from "@/lib/submit";
import { PrivacyHint } from "@/components/forms/PrivacyHint";

/**
 * The only way to write to the association: the site shows no email address.
 * Links can pick the topic with ?assunto= (for example /contactos?assunto=dados from the privacy page).
 */
export function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", topic: "geral" as ContactTopic, orderCode: "", message: "", website_url: "" });
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [summary, setSummary] = useState<string>();
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const set = (key: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [key]: e.target.value }));

  // Read on the client so the page also works as a static export.
  useEffect(() => {
    const topic = new URLSearchParams(window.location.search).get("assunto");
    if (isContactTopic(topic)) setForm((f) => ({ ...f, topic }));
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setState("sending");
    const result = await submitForm("contacto", {
      ...form,
      phone: form.phone || undefined,
      orderCode: form.topic === "loja" || form.topic === "reclamacao" ? form.orderCode || undefined : undefined,
      consent: consent || undefined,
    });
    if (result.ok) return setState("done");
    setErrors(result.fieldErrors);
    setSummary(result.message);
    setState("idle");
  }

  if (state === "done") {
    return (
      <NextStep title="Mensagem enviada. Obrigado!" actions={<Button href="/" variant="secondary">Voltar ao início</Button>}>
        <p>Respondemos para {form.email} assim que possível. Somos voluntários: às vezes demoramos alguns dias.</p>
      </NextStep>
    );
  }
  const shopTopic = form.topic === "loja" || form.topic === "reclamacao";
  return (
    <form onSubmit={onSubmit} className="gn-stack gn-stack--m" noValidate>
      {summary ? <Notice tone="error" title="Falta corrigir alguns campos">{summary}</Notice> : null}
      <div className={errors.topic ? "gn-field gn-field--error" : "gn-field"}>
        <label htmlFor="c-assunto" className="gn-field__label">Assunto</label>
        <select id="c-assunto" className="gn-input" value={form.topic} onChange={(e) => setForm((f) => ({ ...f, topic: e.target.value as ContactTopic }))}>
          {Object.entries(contactTopics).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        {errors.topic ? <p className="gn-field__error">{errors.topic}</p> : null}
      </div>
      <TextField id="c-nome" label="O seu nome" autoComplete="name" value={form.name} onChange={set("name")} error={errors.name} required />
      <TextField id="c-email" label="Email" hint="É para aqui que respondemos." type="email" inputMode="email" autoComplete="email" value={form.email} onChange={set("email")} error={errors.email} required />
      <TextField id="c-telefone" label="Telefone (opcional)" hint="Se preferir que lhe liguemos." type="tel" inputMode="tel" autoComplete="tel" value={form.phone} onChange={set("phone")} />
      {shopTopic ? (
        <TextField id="c-pedido" label="Código do pedido (opcional)" hint="Está na confirmação da encomenda, por exemplo L-1234." value={form.orderCode} onChange={set("orderCode")} />
      ) : null}
      <TextArea id="c-mensagem" label="Mensagem" rows={6} value={form.message} onChange={set("message")} error={errors.message} required />
      <div className="honeypot" aria-hidden="true">
        <label htmlFor="c-website_url">Não preencher</label>
        <input id="c-website_url" tabIndex={-1} autoComplete="off" value={form.website_url} onChange={set("website_url")} />
      </div>
      <Checkbox id="c-consentimento" label="Aceito que a associação use estes dados para me responder" hint={<PrivacyHint />} checked={consent} onChange={setConsent} />
      {errors.consent ? <p className="gn-field__error">{errors.consent}</p> : null}
      <Button type="submit" disabled={state === "sending"} block>{state === "sending" ? "A enviar…" : "Enviar mensagem"}</Button>
    </form>
  );
}
