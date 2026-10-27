"use client";
import { useState, type FormEvent } from "react";
import { Button, Checkbox, Notice, TextField } from "@gn/ui";
import { submitForm } from "@/lib/submit";
import { PrivacyHint } from "@/components/forms/PrivacyHint";
import { useI18n } from "@/lib/i18n/client";

export function NewsletterForm() {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setState("sending");
    const result = await submitForm("newsletter", { email, consent: consent || undefined });
    if (result.ok) return setState("done");
    setErrors(result.fieldErrors);
    setState("idle");
  }

  if (state === "done") return <Notice tone="success" title={t({ pt: "Inscrição feita. Obrigado!", en: "You’re signed up. Thank you!", es: "Suscripción hecha. ¡Gracias!", fr: "Inscription faite. Merci !" })}>{t({ pt: "Vai receber o primeiro email no início do próximo mês.", en: "You’ll get the first email at the start of next month.", es: "Recibirá el primer correo a principios del mes que viene.", fr: "Vous recevrez le premier e-mail au début du mois prochain." })}</Notice>;
  return (
    <form onSubmit={onSubmit} className="gn-stack gn-stack--s" noValidate>
      <TextField id="newsletter-email" label={t({ pt: "O seu email", en: "Your email", es: "Su correo electrónico", fr: "Votre e-mail" })} type="email" autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} />
      <Checkbox id="newsletter-consent" label={t({ pt: "Aceito receber emails da associação", en: "I agree to receive emails from the association", es: "Acepto recibir correos de la asociación", fr: "J’accepte de recevoir des e-mails de l’association" })} hint={<PrivacyHint>{t({ pt: "Pode cancelar a qualquer momento, no fim de cada email.", en: "You can unsubscribe at any time, at the end of each email.", es: "Puede darse de baja en cualquier momento, al final de cada correo.", fr: "Vous pouvez vous désinscrire à tout moment, en bas de chaque e-mail." })}</PrivacyHint>} checked={consent} onChange={setConsent} />
      {errors.consent ? <p className="gn-field__error">{errors.consent}</p> : null}
      <Button type="submit" disabled={state === "sending"}>{state === "sending" ? t({ pt: "A enviar…", en: "Sending…", es: "Enviando…", fr: "Envoi…" }) : t({ pt: "Inscrever", en: "Sign up", es: "Suscribirme", fr: "M’inscrire" })}</Button>
    </form>
  );
}
