"use client";
import { useState, type FormEvent } from "react";
import { itemConditionLabel, itemHandoverLabel, type ItemDonation } from "@gn/domain";
import { Button, Checkbox, ChoiceList, Notice, NextStep, TextArea, TextField } from "@gn/ui";
import { submitForm } from "@/lib/submit";
import { PrivacyHint } from "@/components/forms/PrivacyHint";

/** "Quero doar artigos para a loja": what, in what state, how it gets to us, and a contact. */
export function ItemDonationForm() {
  const [form, setForm] = useState({ what: "", name: "", phone: "", email: "", town: "", website_url: "" });
  const [condition, setCondition] = useState<ItemDonation["condition"]>("como-novo");
  const [handover, setHandover] = useState<ItemDonation["handover"]>("entrego");
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [summary, setSummary] = useState<string>();
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const set = (key: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setState("sending");
    const result = await submitForm("doacao-loja", { ...form, condition, handover, consent: consent || undefined });
    if (result.ok) return setState("done");
    setErrors(result.fieldErrors);
    setSummary(result.message);
    setState("idle");
  }

  if (state === "done") {
    return (
      <NextStep title="Obrigado pela sua oferta!" actions={<Button href="/loja">Voltar à loja</Button>}>
        <p>Ligamos-lhe nos próximos dias para combinar {handover === "recolha" ? "quando podemos ir buscar" : "onde e quando entregar"}. Tudo o que vendermos ajuda os gatos do gatil.</p>
      </NextStep>
    );
  }

  return (
    <form onSubmit={onSubmit} className="gn-stack gn-stack--m" noValidate>
      {summary ? <Notice tone="error" title="Falta corrigir alguns campos">{summary}</Notice> : null}
      <TextArea id="doar-o-que" label="O que quer doar?" hint="Por exemplo: duas camisolas de lã e uma caixa de livros infantis." rows={3} value={form.what} onChange={set("what")} error={errors.what} required />
      <ChoiceList name="estado" legend="Em que estado está?" value={condition} onChange={setCondition} options={(Object.keys(itemConditionLabel) as ItemDonation["condition"][]).map((v) => ({ value: v, label: itemConditionLabel[v] }))} />
      <ChoiceList name="entrega-doacao" legend="Como chega até nós?" value={handover} onChange={setHandover} options={(Object.keys(itemHandoverLabel) as ItemDonation["handover"][]).map((v) => ({ value: v, label: itemHandoverLabel[v] }))} />
      <TextField id="doar-nome" label="O seu nome" autoComplete="name" value={form.name} onChange={set("name")} error={errors.name} required />
      <TextField id="doar-telefone" label="Telemóvel" type="tel" inputMode="tel" autoComplete="tel" value={form.phone} onChange={set("phone")} error={errors.phone} required />
      <TextField id="doar-email" label="Email (opcional)" type="email" inputMode="email" autoComplete="email" value={form.email} onChange={set("email")} error={errors.email} />
      <TextField id="doar-terra" label="Onde vive?" hint="A localidade chega." autoComplete="address-level2" value={form.town} onChange={set("town")} error={errors.town} required />
      <div className="honeypot" aria-hidden="true">
        <label htmlFor="doar-website_url">Não preencher</label>
        <input id="doar-website_url" tabIndex={-1} autoComplete="off" value={form.website_url} onChange={set("website_url")} />
      </div>
      <Checkbox id="doar-consentimento" label="Aceito que a associação me contacte sobre esta oferta" hint={<PrivacyHint />} checked={consent} onChange={setConsent} />
      {errors.consent ? <p className="gn-field__error">{errors.consent}</p> : null}
      <Button type="submit" disabled={state === "sending"} block>{state === "sending" ? "A enviar…" : "Enviar oferta"}</Button>
    </form>
  );
}
