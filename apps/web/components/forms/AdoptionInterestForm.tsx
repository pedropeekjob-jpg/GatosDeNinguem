"use client";
import { useState, type FormEvent } from "react";
import { Button, Checkbox, ChoiceList, Notice, NextStep, TextArea, TextField } from "@gn/ui";
import { submitForm } from "@/lib/submit";
import { PrivacyHint } from "@/components/forms/PrivacyHint";

export function AdoptionInterestForm({ catSlug, catName }: { catSlug: string; catName: string }) {
  const [form, setForm] = useState({ name: "", phone: "", email: "", town: "", bestTime: "qualquer", message: "", website_url: "" });
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [summary, setSummary] = useState<string>();
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const set = (key: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setState("sending");
    const result = await submitForm("adocao", { ...form, catSlug, consent: consent || undefined, email: form.email || undefined });
    if (result.ok) return setState("done");
    setErrors(result.fieldErrors);
    setSummary(result.message);
    setState("idle");
  }

  if (state === "done") {
    return (
      <NextStep
        title="Obrigado! Recebemos o seu pedido."
        actions={
          <>
            <Button href="/adotar">Ver outros gatos</Button>
            <Button href="/ajudar" variant="secondary">Outras formas de ajudar</Button>
          </>
        }
      >
        <p>Vamos ligar-lhe nos próximos dias para falar sobre {catName}. Enquanto espera, pode partilhar a página de {catName} com amigos.</p>
      </NextStep>
    );
  }

  return (
    <form onSubmit={onSubmit} className="gn-stack gn-stack--m" noValidate>
      {summary ? <Notice tone="error" title="Falta corrigir alguns campos">{summary}</Notice> : null}
      <TextField id="nome" label="O seu nome" autoComplete="name" value={form.name} onChange={set("name")} error={errors.name} required />
      <TextField id="telefone" label="Telefone" hint="Ligamos-lhe para combinar a visita." type="tel" inputMode="tel" autoComplete="tel" value={form.phone} onChange={set("phone")} error={errors.phone} required />
      <TextField id="localidade" label="Onde vive?" hint="Por exemplo: Viana do Castelo, Darque, Ponte de Lima." autoComplete="address-level2" value={form.town} onChange={set("town")} error={errors.town} required />
      <ChoiceList
        name="melhor-hora"
        legend="Qual a melhor hora para lhe ligarmos?"
        value={form.bestTime}
        onChange={(v) => setForm((f) => ({ ...f, bestTime: v }))}
        options={[
          { value: "manha", label: "De manhã" },
          { value: "tarde", label: "À tarde" },
          { value: "noite", label: "Ao fim do dia" },
          { value: "qualquer", label: "Qualquer hora" },
        ]}
      />
      <TextField id="email" label="Email (opcional)" type="email" inputMode="email" autoComplete="email" value={form.email} onChange={set("email")} error={errors.email} />
      <TextArea id="mensagem" label="Quer dizer-nos alguma coisa? (opcional)" hint="Por exemplo: se tem outros animais ou crianças em casa." value={form.message} onChange={set("message")} />
      <div className="honeypot" aria-hidden="true">
        <label htmlFor="website_url">Não preencher</label>
        <input id="website_url" tabIndex={-1} autoComplete="off" value={form.website_url} onChange={set("website_url")} />
      </div>
      <Checkbox id="consentimento" label="Tenho 18 anos ou mais e aceito que a associação me contacte sobre esta adoção" hint={<PrivacyHint />} checked={consent} onChange={setConsent} />
      {errors.consent ? <p className="gn-field__error">{errors.consent}</p> : null}
      <Button type="submit" disabled={state === "sending"} block>{state === "sending" ? "A enviar…" : "Enviar pedido"}</Button>
    </form>
  );
}
