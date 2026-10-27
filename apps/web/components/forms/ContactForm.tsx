"use client";
import { useEffect, useState, type FormEvent } from "react";
import { isContactTopic, type ContactTopic } from "@gn/domain";
import { contactTopics } from "@/lib/i18n/labels";
import { Button, Checkbox, Notice, NextStep, TextArea, TextField } from "@gn/ui";
import { submitForm } from "@/lib/submit";
import { PrivacyHint } from "@/components/forms/PrivacyHint";
import { useI18n } from "@/lib/i18n/client";

/**
 * The only way to write to the association: the site shows no email address.
 * Links can pick the topic with ?assunto= (for example /contactos?assunto=dados from the privacy page).
 */
export function ContactForm() {
  const { lang, t, l } = useI18n();
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
      <NextStep title={t({ pt: "Mensagem enviada. Obrigado!", en: "Message sent. Thank you!", es: "Mensaje enviado. ¡Gracias!", fr: "Message envoyé. Merci !" })} actions={<Button href={l("/")} variant="secondary">{t({ pt: "Voltar ao início", en: "Back to the home page", es: "Volver al inicio", fr: "Retour à l’accueil" })}</Button>}>
        <p>{t({ pt: `Respondemos para ${form.email} assim que possível. Somos voluntários: às vezes demoramos alguns dias.`, en: `We’ll reply to ${form.email} as soon as we can. We are volunteers, so sometimes it takes a few days.`, es: `Responderemos a ${form.email} lo antes posible. Somos voluntarios: a veces tardamos unos días.`, fr: `Nous répondrons à ${form.email} dès que possible. Nous sommes bénévoles : cela prend parfois quelques jours.` })}</p>
      </NextStep>
    );
  }
  const shopTopic = form.topic === "loja" || form.topic === "reclamacao";
  return (
    <form onSubmit={onSubmit} className="gn-stack gn-stack--m" noValidate>
      {summary ? <Notice tone="error" title={t({ pt: "Falta corrigir alguns campos", en: "Some fields need fixing", es: "Hay que corregir algunos campos", fr: "Certains champs sont à corriger" })}>{summary}</Notice> : null}
      <div className={errors.topic ? "gn-field gn-field--error" : "gn-field"}>
        <label htmlFor="c-assunto" className="gn-field__label">{t({ pt: "Assunto", en: "Topic", es: "Asunto", fr: "Sujet" })}</label>
        <select id="c-assunto" className="gn-input" value={form.topic} onChange={(e) => setForm((f) => ({ ...f, topic: e.target.value as ContactTopic }))}>
          {Object.entries(contactTopics[lang]).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        {errors.topic ? <p className="gn-field__error">{errors.topic}</p> : null}
      </div>
      <TextField id="c-nome" label={t({ pt: "O seu nome", en: "Your name", es: "Su nombre", fr: "Votre nom" })} autoComplete="name" value={form.name} onChange={set("name")} error={errors.name} required />
      <TextField id="c-email" label={t({ pt: "Email", en: "Email", es: "Correo electrónico", fr: "E-mail" })} hint={t({ pt: "É para aqui que respondemos.", en: "This is where we’ll reply.", es: "Es aquí donde le responderemos.", fr: "C’est ici que nous répondrons." })} type="email" inputMode="email" autoComplete="email" value={form.email} onChange={set("email")} error={errors.email} required />
      <TextField id="c-telefone" label={t({ pt: "Telefone (opcional)", en: "Phone (optional)", es: "Teléfono (opcional)", fr: "Téléphone (facultatif)" })} hint={t({ pt: "Se preferir que lhe liguemos.", en: "If you’d rather we called you.", es: "Si prefiere que le llamemos.", fr: "Si vous préférez que nous vous appelions." })} type="tel" inputMode="tel" autoComplete="tel" value={form.phone} onChange={set("phone")} />
      {shopTopic ? (
        <TextField id="c-pedido" label={t({ pt: "Código do pedido (opcional)", en: "Order code (optional)", es: "Código del pedido (opcional)", fr: "Code de la commande (facultatif)" })} hint={t({ pt: "Está na confirmação da encomenda, por exemplo L-1234.", en: "It’s in the order confirmation, for example L-1234.", es: "Está en la confirmación del pedido, por ejemplo L-1234.", fr: "Il figure dans la confirmation de commande, par exemple L-1234." })} value={form.orderCode} onChange={set("orderCode")} />
      ) : null}
      <TextArea id="c-mensagem" label={t({ pt: "Mensagem", en: "Message", es: "Mensaje", fr: "Message" })} rows={6} value={form.message} onChange={set("message")} error={errors.message} required />
      <div className="honeypot" aria-hidden="true">
        <label htmlFor="c-website_url">{t({ pt: "Não preencher", en: "Leave empty", es: "No rellenar", fr: "Ne pas remplir" })}</label>
        <input id="c-website_url" tabIndex={-1} autoComplete="off" value={form.website_url} onChange={set("website_url")} />
      </div>
      <Checkbox id="c-consentimento" label={t({ pt: "Aceito que a associação use estes dados para me responder", en: "I agree that the association may use these details to reply to me", es: "Acepto que la asociación use estos datos para responderme", fr: "J’accepte que l’association utilise ces données pour me répondre" })} hint={<PrivacyHint />} checked={consent} onChange={setConsent} />
      {errors.consent ? <p className="gn-field__error">{errors.consent}</p> : null}
      <Button type="submit" disabled={state === "sending"} block>{state === "sending" ? t({ pt: "A enviar…", en: "Sending…", es: "Enviando…", fr: "Envoi…" }) : t({ pt: "Enviar mensagem", en: "Send message", es: "Enviar mensaje", fr: "Envoyer le message" })}</Button>
    </form>
  );
}
