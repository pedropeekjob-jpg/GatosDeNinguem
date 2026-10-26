"use client";
import { useState, type FormEvent } from "react";
import { Button, Checkbox, Notice, NextStep, TextArea, TextField } from "@gn/ui";
import { submitForm } from "@/lib/submit";
import { PrivacyHint } from "@/components/forms/PrivacyHint";
import { useI18n } from "@/lib/i18n/client";

export function PartnerApplicationForm() {
  const { t, l } = useI18n();
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
      <NextStep title={t({ pt: "Obrigado! Entraremos em contacto em breve.", en: "Thank you! We’ll be in touch soon.", es: "¡Gracias! Le contactaremos pronto.", fr: "Merci ! Nous vous contacterons bientôt." })} actions={<Button href={l("/ajudar")} variant="secondary">{t({ pt: "Outras formas de ajudar", en: "Other ways to help", es: "Otras formas de ayudar", fr: "Autres façons d’aider" })}</Button>}>
        <p>{t({ pt: "Enquanto isso, pode seguir-nos no Facebook e Instagram para conhecer o nosso trabalho.", en: "Meanwhile, you can follow us on Facebook and Instagram to see our work.", es: "Mientras tanto, puede seguirnos en Facebook e Instagram para conocer nuestro trabajo.", fr: "En attendant, suivez-nous sur Facebook et Instagram pour découvrir notre travail." })}</p>
      </NextStep>
    );
  }
  return (
    <form onSubmit={onSubmit} className="gn-stack gn-stack--m" noValidate>
      {summary ? <Notice tone="error" title={t({ pt: "Falta corrigir alguns campos", en: "Some fields need fixing", es: "Hay que corregir algunos campos", fr: "Certains champs sont à corriger" })}>{summary}</Notice> : null}
      <TextField id="p-negocio" label={t({ pt: "Nome do negócio", en: "Business name", es: "Nombre del negocio", fr: "Nom du commerce" })} autoComplete="organization" value={form.businessName} onChange={set("businessName")} error={errors.businessName} />
      <TextField id="p-nome" label={t({ pt: "O seu nome", en: "Your name", es: "Su nombre", fr: "Votre nom" })} autoComplete="name" value={form.contactName} onChange={set("contactName")} error={errors.contactName} />
      <TextField id="p-email" label={t({ pt: "Email", en: "Email", es: "Correo electrónico", fr: "E-mail" })} type="email" inputMode="email" autoComplete="email" value={form.email} onChange={set("email")} error={errors.email} />
      <TextField id="p-telefone" label={t({ pt: "Telefone (opcional)", en: "Phone (optional)", es: "Teléfono (opcional)", fr: "Téléphone (facultatif)" })} type="tel" inputMode="tel" autoComplete="tel" value={form.phone} onChange={set("phone")} />
      <TextField id="p-localidade" label={t({ pt: "Localidade", en: "Town", es: "Localidad", fr: "Localité" })} value={form.town} onChange={set("town")} error={errors.town} />
      <TextArea id="p-oferta" label={t({ pt: "Que vantagem gostaria de oferecer? (opcional)", en: "What offer would you like to give? (optional)", es: "¿Qué ventaja le gustaría ofrecer? (opcional)", fr: "Quel avantage aimeriez-vous offrir ? (facultatif)" })} hint={t({ pt: "Por exemplo: 10% de desconto, um café oferecido, uma consulta a preço solidário.", en: "For example: 10% off, a free coffee, a vet visit at a charity price.", es: "Por ejemplo: un 10% de descuento, un café gratis, una consulta a precio solidario.", fr: "Par exemple : 10 % de réduction, un café offert, une consultation à prix solidaire." })} value={form.offer} onChange={set("offer")} />
      <div className="honeypot" aria-hidden="true">
        <label htmlFor="p-website_url">{t({ pt: "Não preencher", en: "Leave empty", es: "No rellenar", fr: "Ne pas remplir" })}</label>
        <input id="p-website_url" tabIndex={-1} autoComplete="off" value={form.website_url} onChange={set("website_url")} />
      </div>
      <Checkbox id="p-consentimento" label={t({ pt: "Aceito que a associação me contacte sobre esta parceria", en: "I agree that the association may contact me about this partnership", es: "Acepto que la asociación me contacte sobre esta colaboración", fr: "J’accepte que l’association me contacte au sujet de ce partenariat" })} hint={<PrivacyHint />} checked={consent} onChange={setConsent} />
      {errors.consent ? <p className="gn-field__error">{errors.consent}</p> : null}
      <Button type="submit" disabled={state === "sending"} block>{state === "sending" ? t({ pt: "A enviar…", en: "Sending…", es: "Enviando…", fr: "Envoi…" }) : t({ pt: "Enviar pedido", en: "Send request", es: "Enviar solicitud", fr: "Envoyer la demande" })}</Button>
    </form>
  );
}
