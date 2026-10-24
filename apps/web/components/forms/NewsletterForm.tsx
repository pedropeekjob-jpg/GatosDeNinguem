"use client";
import { useState, type FormEvent } from "react";
import { Button, Checkbox, Notice, TextField } from "@gn/ui";
import { submitForm } from "@/lib/submit";
import { PrivacyHint } from "@/components/forms/PrivacyHint";

export function NewsletterForm() {
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

  if (state === "done") return <Notice tone="success" title="Inscrição feita. Obrigado!">Vai receber o primeiro email no início do próximo mês.</Notice>;
  return (
    <form onSubmit={onSubmit} className="gn-stack gn-stack--s" noValidate>
      <TextField id="newsletter-email" label="O seu email" type="email" autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} />
      <Checkbox id="newsletter-consent" label="Aceito receber emails da associação" hint={<PrivacyHint>Pode cancelar a qualquer momento, no fim de cada email.</PrivacyHint>} checked={consent} onChange={setConsent} />
      {errors.consent ? <p className="gn-field__error">{errors.consent}</p> : null}
      <Button type="submit" disabled={state === "sending"}>{state === "sending" ? "A enviar…" : "Inscrever"}</Button>
    </form>
  );
}
