"use client";
import { useState, type FormEvent } from "react";
import { Button, Checkbox, Modal, Notice, NextStep, TextField } from "@gn/ui";
import { useModalHistory } from "@/components/client/FormModal";
import { signUpForShift } from "@/lib/submit";
import { PrivacyHint } from "@/components/forms/PrivacyHint";
import { useI18n } from "@/lib/i18n/client";

type ShiftSummary = { id: string; title: string; startsAt: string; endsAt: string; location: string; when: string };

/** "Add to my calendar" file, so the shift shows up on the volunteer's phone with a reminder. */
function calendarFile(shift: ShiftSummary) {
  const stamp = (iso: string) => iso.replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Gatos de Ninguem//Turnos//PT",
    "BEGIN:VEVENT",
    `UID:${shift.id}@gatosdeninguem`,
    `DTSTAMP:${stamp(new Date().toISOString())}`,
    `DTSTART:${stamp(shift.startsAt)}`,
    `DTEND:${stamp(shift.endsAt)}`,
    `SUMMARY:Gatos de Ninguém: ${shift.title}`,
    `LOCATION:${shift.location}`,
    "BEGIN:VALARM",
    "TRIGGER:-PT2H",
    "ACTION:DISPLAY",
    "DESCRIPTION:Turno de voluntariado",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`;
}

/** One button per shift; the short form opens in a window only when the person chooses that shift. */
export function ShiftSignUp({ shift }: { shift: ShiftSummary }) {
  const { t, l } = useI18n();
  const modal = useModalHistory();
  const [form, setForm] = useState({ name: "", phone: "", website_url: "" });
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [summary, setSummary] = useState<string>();
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const set = (key: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const formId = `turno-${shift.id}`;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setState("sending");
    const result = await signUpForShift(shift.id, { ...form, consent: consent || undefined });
    if (result.ok) {
      modal.hide();
      return setState("done");
    }
    setErrors(result.fieldErrors);
    setSummary(result.message);
    setState("idle");
  }

  if (state === "done") {
    return (
      <NextStep
        title={t({ pt: "Está inscrito. Obrigado!", en: "You’re signed up. Thank you!", es: "Está inscrito. ¡Gracias!", fr: "Vous êtes inscrit. Merci !" })}
        actions={
          <>
            <a className="gn-btn gn-btn--primary" href={calendarFile(shift)} download={`turno-${shift.id}.ics`}>{t({ pt: "Pôr no meu calendário", en: "Add to my calendar", es: "Añadir a mi calendario", fr: "Ajouter à mon agenda" })}</a>
            <Button href={l("/ajudar/turnos")} variant="secondary">{t({ pt: "Ver outros turnos", en: "See other shifts", es: "Ver otros turnos", fr: "Voir d’autres créneaux" })}</Button>
          </>
        }
      >
        <p>{t({ pt: `Esperamos por si ${shift.when}, em ${shift.location}. Se não puder ir, avise-nos para darmos o lugar a outra pessoa.`, en: `We’ll expect you ${shift.when}, at ${shift.location}. If you can’t come, let us know so someone else can take your place.`, es: `Le esperamos ${shift.when}, en ${shift.location}. Si no puede ir, avísenos para dar el sitio a otra persona.`, fr: `Nous vous attendons ${shift.when}, à ${shift.location}. Si vous ne pouvez pas venir, prévenez-nous pour laisser la place à quelqu’un d’autre.` })}</p>
      </NextStep>
    );
  }

  return (
    <>
      <Button onClick={modal.show} aria-haspopup="dialog" block>
        {t({ pt: "Quero ajudar neste turno", en: "I want to help on this shift", es: "Quiero ayudar en este turno", fr: "Je veux aider sur ce créneau" })}
      </Button>
      <Modal open={modal.open} onClose={modal.hide} title={shift.title} intro={<p>{shift.when}, {t({ pt: "em", en: "at", es: "en", fr: "à" })} {shift.location}.</p>}>
        <form id={formId} onSubmit={onSubmit} className="gn-stack gn-stack--m" noValidate aria-label={`${t({ pt: "Inscrição", en: "Sign-up", es: "Inscripción", fr: "Inscription" })}: ${shift.title}`}>
          {summary ? <Notice tone="error" title={t({ pt: "Não foi possível inscrever", en: "Sign-up didn’t work", es: "No ha sido posible inscribirse", fr: "L’inscription n’a pas abouti" })}>{summary}</Notice> : null}
          <TextField id={`${formId}-nome`} label={t({ pt: "O seu nome", en: "Your name", es: "Su nombre", fr: "Votre nom" })} autoComplete="name" value={form.name} onChange={set("name")} error={errors.name} />
          <TextField
            id={`${formId}-telefone`}
            label={t({ pt: "Telemóvel", en: "Mobile phone", es: "Móvil", fr: "Téléphone portable" })}
            hint={t({ pt: "Só para combinarmos consigo, se for preciso.", en: "Only to arrange things with you if needed.", es: "Solo para organizarnos con usted si hace falta.", fr: "Uniquement pour nous organiser avec vous si besoin." })}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={form.phone}
            onChange={set("phone")}
            error={errors.phone}
          />
          <div className="honeypot" aria-hidden="true">
            <label htmlFor={`${formId}-website_url`}>Não preencher</label>
            <input id={`${formId}-website_url`} tabIndex={-1} autoComplete="off" value={form.website_url} onChange={set("website_url")} />
          </div>
          <Checkbox id={`${formId}-consentimento`} label={t({ pt: "Aceito que a associação me contacte sobre este turno", en: "I agree that the association may contact me about this shift", es: "Acepto que la asociación me contacte sobre este turno", fr: "J’accepte que l’association me contacte au sujet de ce créneau" })} hint={<PrivacyHint />} checked={consent} onChange={setConsent} />
          {errors.consent ? <p className="gn-field__error">{errors.consent}</p> : null}
          <Button type="submit" disabled={state === "sending"} block>{state === "sending" ? t({ pt: "A enviar…", en: "Sending…", es: "Enviando…", fr: "Envoi…" }) : t({ pt: "Confirmar inscrição", en: "Confirm sign-up", es: "Confirmar inscripción", fr: "Confirmer l’inscription" })}</Button>
        </form>
      </Modal>
    </>
  );
}
