"use client";
import { useState, type FormEvent } from "react";
import type { FosterApplication } from "@gn/domain";
import { fosterCanHostLabel, fosterHowLongLabel } from "@/lib/i18n/labels";
import { Button, Checkbox, ChoiceList, Notice, NextStep, TextArea, TextField } from "@gn/ui";
import { submitForm } from "@/lib/submit";
import { PrivacyHint } from "@/components/forms/PrivacyHint";
import { useI18n } from "@/lib/i18n/client";

const options = <K extends string>(labels: Record<K, string>) => (Object.keys(labels) as K[]).map((value) => ({ value, label: labels[value] }));

/** "Quero ser família temporária": a few questions so the team can call back with the right cat in mind. */
export function FosterForm() {
  const { lang, t, l } = useI18n();
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
        title={t({ pt: "Obrigado! Vamos ligar-lhe.", en: "Thank you! We’ll call you.", es: "¡Gracias! Le llamaremos.", fr: "Merci ! Nous vous appellerons." })}
        actions={
          <>
            <Button href={l("/adotar")}>{t({ pt: "Conhecer os gatos", en: "Meet the cats", es: "Conocer a los gatos", fr: "Découvrir les chats" })}</Button>
            <Button href={l("/ajudar")} variant="secondary">{t({ pt: "Outras formas de ajudar", en: "Other ways to help", es: "Otras formas de ayudar", fr: "Autres façons d’aider" })}</Button>
          </>
        }
      >
        <p>{t({ pt: "Recebemos o seu pedido. Nos próximos dias alguém da equipa liga-lhe para conversar e explicar tudo. Não fica com nenhum compromisso até combinarmos.", en: "We have received your request. In the next few days someone from the team will call you to talk and explain everything. You’re not committed to anything until we agree.", es: "Hemos recibido su solicitud. En los próximos días alguien del equipo le llamará para hablar y explicárselo todo. No se compromete a nada hasta que lo acordemos.", fr: "Nous avons bien reçu votre demande. Dans les prochains jours, quelqu’un de l’équipe vous appellera pour discuter et tout vous expliquer. Vous ne vous engagez à rien tant que nous n’avons rien convenu." })}</p>
      </NextStep>
    );
  }

  return (
    <form onSubmit={onSubmit} className="gn-stack gn-stack--m" noValidate>
      {summary ? <Notice tone="error" title={t({ pt: "Falta corrigir alguns campos", en: "Some fields need fixing", es: "Hay que corregir algunos campos", fr: "Certains champs sont à corriger" })}>{summary}</Notice> : null}
      <TextField id="nome" label={t({ pt: "O seu nome", en: "Your name", es: "Su nombre", fr: "Votre nom" })} autoComplete="name" value={form.name} onChange={set("name")} error={errors.name} required />
      <TextField id="telefone" label={t({ pt: "Telefone", en: "Phone", es: "Teléfono", fr: "Téléphone" })} hint={t({ pt: "Para lhe ligarmos.", en: "So we can call you.", es: "Para llamarle.", fr: "Pour vous appeler." })} type="tel" inputMode="tel" autoComplete="tel" value={form.phone} onChange={set("phone")} error={errors.phone} required />
      <TextField id="localidade" label={t({ pt: "Onde vive?", en: "Where do you live?", es: "¿Dónde vive?", fr: "Où habitez-vous ?" })} hint={t({ pt: "Freguesia ou localidade.", en: "Parish or town.", es: "Parroquia o localidad.", fr: "Paroisse ou localité." })} autoComplete="address-level2" value={form.town} onChange={set("town")} error={errors.town} required />
      <ChoiceList name="acolher" legend={t({ pt: "Que gato pode acolher?", en: "Which cat could you take in?", es: "¿Qué gato puede acoger?", fr: "Quel chat pouvez-vous accueillir ?" })} value={canHost} onChange={(v) => setCanHost(v as FosterApplication["canHost"])} options={options(fosterCanHostLabel[lang])} />
      <ChoiceList name="tempo" legend={t({ pt: "Durante quanto tempo?", en: "For how long?", es: "¿Durante cuánto tiempo?", fr: "Pendant combien de temps ?" })} value={howLong} onChange={(v) => setHowLong(v as FosterApplication["howLong"])} options={options(fosterHowLongLabel[lang])} />
      <TextField id="animais" label={t({ pt: "Tem outros animais em casa? (opcional)", en: "Do you have other pets at home? (optional)", es: "¿Tiene otros animales en casa? (opcional)", fr: "Avez-vous d’autres animaux à la maison ? (facultatif)" })} hint={t({ pt: "Por exemplo: um cão calmo, dois gatos.", en: "For example: a calm dog, two cats.", es: "Por ejemplo: un perro tranquilo, dos gatos.", fr: "Par exemple : un chien calme, deux chats." })} value={form.otherAnimals} onChange={set("otherAnimals")} error={errors.otherAnimals} />
      <TextField id="email" label={t({ pt: "Email (opcional)", en: "Email (optional)", es: "Correo electrónico (opcional)", fr: "E-mail (facultatif)" })} type="email" inputMode="email" autoComplete="email" value={form.email} onChange={set("email")} error={errors.email} />
      <TextArea id="mensagem" label={t({ pt: "Quer dizer-nos alguma coisa? (opcional)", en: "Anything you’d like to tell us? (optional)", es: "¿Quiere decirnos algo? (opcional)", fr: "Voulez-vous nous dire quelque chose ? (facultatif)" })} value={form.message} onChange={set("message")} />
      <div className="honeypot" aria-hidden="true">
        <label htmlFor="website_url">{t({ pt: "Não preencher", en: "Leave empty", es: "No rellenar", fr: "Ne pas remplir" })}</label>
        <input id="website_url" tabIndex={-1} autoComplete="off" value={form.website_url} onChange={set("website_url")} />
      </div>
      <Checkbox id="consentimento" label={t({ pt: "Tenho 18 anos ou mais e aceito que a associação me contacte sobre ser família temporária", en: "I am 18 or over and agree that the association may contact me about fostering", es: "Tengo 18 años o más y acepto que la asociación me contacte sobre ser casa de acogida", fr: "J’ai 18 ans ou plus et j’accepte que l’association me contacte au sujet de l’accueil temporaire" })} hint={<PrivacyHint />} checked={consent} onChange={setConsent} />
      {errors.consent ? <p className="gn-field__error">{errors.consent}</p> : null}
      <Button type="submit" disabled={state === "sending"} block>{state === "sending" ? t({ pt: "A enviar…", en: "Sending…", es: "Enviando…", fr: "Envoi…" }) : t({ pt: "Enviar pedido", en: "Send request", es: "Enviar solicitud", fr: "Envoyer la demande" })}</Button>
    </form>
  );
}
