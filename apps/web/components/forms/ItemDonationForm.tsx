"use client";
import { useState, type FormEvent } from "react";
import type { ItemDonation } from "@gn/domain";
import { itemConditionLabel, itemHandoverLabel } from "@/lib/i18n/labels";
import { Button, Checkbox, ChoiceList, Notice, NextStep, TextArea, TextField } from "@gn/ui";
import { submitForm } from "@/lib/submit";
import { PrivacyHint } from "@/components/forms/PrivacyHint";
import { useI18n } from "@/lib/i18n/client";

/** "Quero doar artigos para a loja": what, in what state, how it gets to us, and a contact. */
export function ItemDonationForm() {
  const { lang, t, l } = useI18n();
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
      <NextStep title={t({ pt: "Obrigado pela sua oferta!", en: "Thank you for your gift!", es: "¡Gracias por su donación!", fr: "Merci pour votre don !" })} actions={<Button href={l("/loja")}>{t({ pt: "Voltar à loja", en: "Back to the shop", es: "Volver a la tienda", fr: "Retour à la boutique" })}</Button>}>
        <p>{handover === "recolha"
          ? t({ pt: "Ligamos-lhe nos próximos dias para combinar quando podemos ir buscar. Tudo o que vendermos ajuda os gatos do gatil.", en: "We’ll call you in the next few days to arrange when we can collect it. Everything raised helps the shelter’s cats.", es: "Le llamaremos en los próximos días para acordar cuándo podemos ir a recogerlo. Todo lo que recaudemos ayuda a los gatos del refugio.", fr: "Nous vous appellerons dans les prochains jours pour convenir du moment où venir le chercher. Tout ce que nous récoltons aide les chats du refuge." })
          : t({ pt: "Ligamos-lhe nos próximos dias para combinar onde e quando entregar. Tudo o que vendermos ajuda os gatos do gatil.", en: "We’ll call you in the next few days to arrange where and when to drop it off. Everything raised helps the shelter’s cats.", es: "Le llamaremos en los próximos días para acordar dónde y cuándo entregarlo. Todo lo que recaudemos ayuda a los gatos del refugio.", fr: "Nous vous appellerons dans les prochains jours pour convenir du lieu et du moment de dépôt. Tout ce que nous récoltons aide les chats du refuge." })}</p>
      </NextStep>
    );
  }

  return (
    <form onSubmit={onSubmit} className="gn-stack gn-stack--m" noValidate>
      {summary ? <Notice tone="error" title={t({ pt: "Falta corrigir alguns campos", en: "Some fields need fixing", es: "Hay que corregir algunos campos", fr: "Certains champs sont à corriger" })}>{summary}</Notice> : null}
      <TextArea id="doar-o-que" label={t({ pt: "O que quer doar?", en: "What would you like to give?", es: "¿Qué quiere donar?", fr: "Que voulez-vous donner ?" })} hint={t({ pt: "Por exemplo: duas camisolas de lã e uma caixa de livros infantis.", en: "For example: two wool jumpers and a box of children’s books.", es: "Por ejemplo: dos jerséis de lana y una caja de libros infantiles.", fr: "Par exemple : deux pulls en laine et un carton de livres pour enfants." })} rows={3} value={form.what} onChange={set("what")} error={errors.what} required />
      <ChoiceList name="estado" legend={t({ pt: "Em que estado está?", en: "What condition is it in?", es: "¿En qué estado está?", fr: "Dans quel état est-il ?" })} value={condition} onChange={setCondition} options={(Object.keys(itemConditionLabel[lang]) as ItemDonation["condition"][]).map((v) => ({ value: v, label: itemConditionLabel[lang][v] }))} />
      <ChoiceList name="entrega-doacao" legend={t({ pt: "Como chega até nós?", en: "How will it reach us?", es: "¿Cómo nos llega?", fr: "Comment nous parvient-il ?" })} value={handover} onChange={setHandover} options={(Object.keys(itemHandoverLabel[lang]) as ItemDonation["handover"][]).map((v) => ({ value: v, label: itemHandoverLabel[lang][v] }))} />
      <TextField id="doar-nome" label={t({ pt: "O seu nome", en: "Your name", es: "Su nombre", fr: "Votre nom" })} autoComplete="name" value={form.name} onChange={set("name")} error={errors.name} required />
      <TextField id="doar-telefone" label={t({ pt: "Telemóvel", en: "Mobile phone", es: "Móvil", fr: "Téléphone portable" })} type="tel" inputMode="tel" autoComplete="tel" value={form.phone} onChange={set("phone")} error={errors.phone} required />
      <TextField id="doar-email" label={t({ pt: "Email (opcional)", en: "Email (optional)", es: "Correo electrónico (opcional)", fr: "E-mail (facultatif)" })} type="email" inputMode="email" autoComplete="email" value={form.email} onChange={set("email")} error={errors.email} />
      <TextField id="doar-terra" label={t({ pt: "Onde vive?", en: "Where do you live?", es: "¿Dónde vive?", fr: "Où habitez-vous ?" })} hint={t({ pt: "A localidade chega.", en: "Your town is enough.", es: "Basta con la localidad.", fr: "La localité suffit." })} autoComplete="address-level2" value={form.town} onChange={set("town")} error={errors.town} required />
      <div className="honeypot" aria-hidden="true">
        <label htmlFor="doar-website_url">{t({ pt: "Não preencher", en: "Leave empty", es: "No rellenar", fr: "Ne pas remplir" })}</label>
        <input id="doar-website_url" tabIndex={-1} autoComplete="off" value={form.website_url} onChange={set("website_url")} />
      </div>
      <Checkbox id="doar-consentimento" label={t({ pt: "Aceito que a associação me contacte sobre esta oferta", en: "I agree that the association may contact me about this gift", es: "Acepto que la asociación me contacte sobre esta donación", fr: "J’accepte que l’association me contacte au sujet de ce don" })} hint={<PrivacyHint />} checked={consent} onChange={setConsent} />
      {errors.consent ? <p className="gn-field__error">{errors.consent}</p> : null}
      <Button type="submit" disabled={state === "sending"} block>{state === "sending" ? t({ pt: "A enviar…", en: "Sending…", es: "Enviando…", fr: "Envoi…" }) : t({ pt: "Enviar oferta", en: "Send offer", es: "Enviar donación", fr: "Envoyer le don" })}</Button>
    </form>
  );
}
