"use client";
import { useState, type FormEvent } from "react";
import { fosterCanHostLabel, fosterHowLongLabel, type FosterApplication } from "@gn/domain";
import { Button, Checkbox, ChoiceList, Notice, NextStep, TextArea, TextField } from "@gn/ui";
import { submitForm } from "@/lib/submit";
import { PrivacyHint } from "@/components/forms/PrivacyHint";

const options = <K extends string>(labels: Record<K, string>) => (Object.keys(labels) as K[]).map((value) => ({ value, label: labels[value] }));

/** "Quero ser família temporária": a few questions so the team can call back with the right cat in mind. */
export function FosterForm() {
  const [form, setForm] = useState({ name: "", phone: "", email: "", town: "", otherAnimals: "", message: "", website_url: "" });
  const [canHost, setCanHost] = useState<FosterApplication["canHost"]>("qualquer");
  const [howLong, setHowLong] = useState<FosterApplication["howLong"]>("necessario");
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [summary, setSummary] = useState<string>();
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const set = (key: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setState("sending");
    const result = await submitForm("familia-temporaria", {
      ...form,
      canHost,
      howLong,
      otherAnimals: form.otherAnimals || undefined,
      message: form.message || undefined,
      consent: consent || undefined,
    });
    if (result.ok) return setState("done");
    setErrors(result.fieldErrors);
    setSummary(result.message);
    setState("idle");
  }

  if (state === "done") {
    return (
      <NextStep
        title="Obrigado! Vamos ligar-lhe."
        actions={
          <>
            <Button href="/adotar">Conhecer os gatos</Button>
            <Button href="/ajudar" variant="secondary">Outras formas de ajudar</Button>
          </>
        }
      >
        <p>Recebemos o seu pedido. Nos próximos dias alguém da equipa liga-lhe para conversar e explicar tudo. Não fica com nenhum compromisso até combinarmos.</p>
      </NextStep>
    );
  }

  return (
    <form onSubmit={onSubmit} className="gn-stack gn-stack--m" noValidate>
      {summary ? <Notice tone="error" title="Falta corrigir alguns campos">{summary}</Notice> : null}
      <TextField id="nome" label="O seu nome" autoComplete="name" value={form.name} onChange={set("name")} error={errors.name} required />
      <TextField id="telefone" label="Telefone" hint="Para lhe ligarmos." type="tel" inputMode="tel" autoComplete="tel" value={form.phone} onChange={set("phone")} error={errors.phone} required />
      <TextField id="localidade" label="Onde vive?" hint="Freguesia ou localidade." autoComplete="address-level2" value={form.town} onChange={set("town")} error={errors.town} required />
      <ChoiceList name="acolher" legend="Que gato pode acolher?" value={canHost} onChange={(v) => setCanHost(v as FosterApplication["canHost"])} options={options(fosterCanHostLabel)} />
      <ChoiceList name="tempo" legend="Durante quanto tempo?" value={howLong} onChange={(v) => setHowLong(v as FosterApplication["howLong"])} options={options(fosterHowLongLabel)} />
      <TextField id="animais" label="Tem outros animais em casa? (opcional)" hint="Por exemplo: um cão calmo, dois gatos." value={form.otherAnimals} onChange={set("otherAnimals")} error={errors.otherAnimals} />
      <TextField id="email" label="Email (opcional)" type="email" inputMode="email" autoComplete="email" value={form.email} onChange={set("email")} error={errors.email} />
      <TextArea id="mensagem" label="Quer dizer-nos alguma coisa? (opcional)" value={form.message} onChange={set("message")} />
      <div className="honeypot" aria-hidden="true">
        <label htmlFor="website_url">Não preencher</label>
        <input id="website_url" tabIndex={-1} autoComplete="off" value={form.website_url} onChange={set("website_url")} />
      </div>
      <Checkbox id="consentimento" label="Tenho 18 anos ou mais e aceito que a associação me contacte sobre ser família temporária" hint={<PrivacyHint />} checked={consent} onChange={setConsent} />
      {errors.consent ? <p className="gn-field__error">{errors.consent}</p> : null}
      <Button type="submit" disabled={state === "sending"} block>{state === "sending" ? "A enviar…" : "Enviar pedido"}</Button>
    </form>
  );
}
