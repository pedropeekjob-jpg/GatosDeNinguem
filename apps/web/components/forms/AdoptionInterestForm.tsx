"use client";
import { useState, type FormEvent } from "react";
import { Button, Checkbox, ChoiceList, Notice, NextStep, TextArea, TextField } from "@gn/ui";
import { submitForm } from "@/lib/submit";
import { PrivacyHint } from "@/components/forms/PrivacyHint";
import { useI18n } from "@/lib/i18n/client";

export function AdoptionInterestForm({ catSlug, catName }: { catSlug: string; catName: string }) {
  const { t, l } = useI18n();
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
        title={t({ pt: "Obrigado! Recebemos o seu pedido.", en: "Thank you! We have received your request.", es: "¡Gracias! Hemos recibido su solicitud.", fr: "Merci ! Nous avons bien reçu votre demande." })}
        actions={
          <>
            <Button href={l("/adotar")}>{t({ pt: "Ver outros gatos", en: "See other cats", es: "Ver otros gatos", fr: "Voir d’autres chats" })}</Button>
            <Button href={l("/ajudar")} variant="secondary">{t({ pt: "Outras formas de ajudar", en: "Other ways to help", es: "Otras formas de ayudar", fr: "Autres façons d’aider" })}</Button>
          </>
        }
      >
        <p>{t({ pt: `Vamos ligar-lhe nos próximos dias para falar sobre ${catName}. Enquanto espera, pode partilhar a página de ${catName} com amigos.`, en: `We’ll call you in the next few days to talk about ${catName}. Meanwhile, you can share ${catName}’s page with friends.`, es: `Le llamaremos en los próximos días para hablar de ${catName}. Mientras tanto, puede compartir la página de ${catName} con sus amigos.`, fr: `Nous vous appellerons dans les prochains jours pour parler de ${catName}. En attendant, vous pouvez partager la page de ${catName} avec vos amis.` })}</p>
      </NextStep>
    );
  }

  return (
    <form onSubmit={onSubmit} className="gn-stack gn-stack--m" noValidate>
      {summary ? <Notice tone="error" title={t({ pt: "Falta corrigir alguns campos", en: "Some fields need fixing", es: "Hay que corregir algunos campos", fr: "Certains champs sont à corriger" })}>{summary}</Notice> : null}
      <TextField id="nome" label={t({ pt: "O seu nome", en: "Your name", es: "Su nombre", fr: "Votre nom" })} autoComplete="name" value={form.name} onChange={set("name")} error={errors.name} required />
      <TextField id="telefone" label={t({ pt: "Telefone", en: "Phone", es: "Teléfono", fr: "Téléphone" })} hint={t({ pt: "Ligamos-lhe para combinar a visita.", en: "We’ll call you to arrange the visit.", es: "Le llamamos para organizar la visita.", fr: "Nous vous appelons pour organiser la visite." })} type="tel" inputMode="tel" autoComplete="tel" value={form.phone} onChange={set("phone")} error={errors.phone} required />
      <TextField id="localidade" label={t({ pt: "Onde vive?", en: "Where do you live?", es: "¿Dónde vive?", fr: "Où habitez-vous ?" })} hint={t({ pt: "Por exemplo: Viana do Castelo, Darque, Ponte de Lima.", en: "For example: Viana do Castelo, Darque, Ponte de Lima.", es: "Por ejemplo: Viana do Castelo, Darque, Ponte de Lima.", fr: "Par exemple : Viana do Castelo, Darque, Ponte de Lima." })} autoComplete="address-level2" value={form.town} onChange={set("town")} error={errors.town} required />
      <ChoiceList
        name="melhor-hora"
        legend={t({ pt: "Qual a melhor hora para lhe ligarmos?", en: "When is the best time to call you?", es: "¿Cuál es la mejor hora para llamarle?", fr: "Quel est le meilleur moment pour vous appeler ?" })}
        value={form.bestTime}
        onChange={(v) => setForm((f) => ({ ...f, bestTime: v }))}
        options={[
          { value: "manha", label: t({ pt: "De manhã", en: "In the morning", es: "Por la mañana", fr: "Le matin" }) },
          { value: "tarde", label: t({ pt: "À tarde", en: "In the afternoon", es: "Por la tarde", fr: "L’après-midi" }) },
          { value: "noite", label: t({ pt: "Ao fim do dia", en: "In the early evening", es: "Al final del día", fr: "En fin de journée" }) },
          { value: "qualquer", label: t({ pt: "Qualquer hora", en: "Any time", es: "Cualquier hora", fr: "N’importe quand" }) },
        ]}
      />
      <TextField id="email" label={t({ pt: "Email (opcional)", en: "Email (optional)", es: "Correo electrónico (opcional)", fr: "E-mail (facultatif)" })} type="email" inputMode="email" autoComplete="email" value={form.email} onChange={set("email")} error={errors.email} />
      <TextArea id="mensagem" label={t({ pt: "Quer dizer-nos alguma coisa? (opcional)", en: "Anything you’d like to tell us? (optional)", es: "¿Quiere decirnos algo? (opcional)", fr: "Voulez-vous nous dire quelque chose ? (facultatif)" })} hint={t({ pt: "Por exemplo: se tem outros animais ou crianças em casa.", en: "For example: if you have other pets or children at home.", es: "Por ejemplo: si tiene otros animales o niños en casa.", fr: "Par exemple : si vous avez d’autres animaux ou des enfants à la maison." })} value={form.message} onChange={set("message")} />
      <div className="honeypot" aria-hidden="true">
        <label htmlFor="website_url">{t({ pt: "Não preencher", en: "Leave empty", es: "No rellenar", fr: "Ne pas remplir" })}</label>
        <input id="website_url" tabIndex={-1} autoComplete="off" value={form.website_url} onChange={set("website_url")} />
      </div>
      <Checkbox id="consentimento" label={t({ pt: "Tenho 18 anos ou mais e aceito que a associação me contacte sobre esta adoção", en: "I am 18 or over and agree that the association may contact me about this adoption", es: "Tengo 18 años o más y acepto que la asociación me contacte sobre esta adopción", fr: "J’ai 18 ans ou plus et j’accepte que l’association me contacte au sujet de cette adoption" })} hint={<PrivacyHint />} checked={consent} onChange={setConsent} />
      {errors.consent ? <p className="gn-field__error">{errors.consent}</p> : null}
      <Button type="submit" disabled={state === "sending"} block>{state === "sending" ? t({ pt: "A enviar…", en: "Sending…", es: "Enviando…", fr: "Envoi…" }) : t({ pt: "Enviar pedido", en: "Send request", es: "Enviar solicitud", fr: "Envoyer la demande" })}</Button>
    </form>
  );
}
