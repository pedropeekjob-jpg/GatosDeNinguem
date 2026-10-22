"use client";
import { useState, type FormEvent } from "react";
import { Button, Checkbox, Notice, NextStep, TextField } from "@gn/ui";
import { signUpForShift } from "@/lib/submit";

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

/** One button per shift; the short form only opens when the person chooses that shift. */
export function ShiftSignUp({ shift }: { shift: ShiftSummary }) {
  const [open, setOpen] = useState(false);
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
    if (result.ok) return setState("done");
    setErrors(result.fieldErrors);
    setSummary(result.message);
    setState("idle");
  }

  if (state === "done") {
    return (
      <NextStep
        title="Está inscrito. Obrigado!"
        actions={
          <>
            <a className="gn-btn gn-btn--primary" href={calendarFile(shift)} download={`turno-${shift.id}.ics`}>Pôr no meu calendário</a>
            <Button href="/ajudar/turnos" variant="secondary">Ver outros turnos</Button>
          </>
        }
      >
        <p>Esperamos por si {shift.when}, em {shift.location}. Se não puder ir, avise-nos para darmos o lugar a outra pessoa.</p>
      </NextStep>
    );
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} aria-expanded={false} aria-controls={formId} block>
        Quero ajudar neste turno
      </Button>
    );
  }

  return (
    <form id={formId} onSubmit={onSubmit} className="gn-stack gn-stack--m" noValidate aria-label={`Inscrição: ${shift.title}`}>
      {summary ? <Notice tone="error" title="Não foi possível inscrever">{summary}</Notice> : null}
      <TextField id={`${formId}-nome`} label="O seu nome" autoComplete="name" value={form.name} onChange={set("name")} error={errors.name} />
      <TextField
        id={`${formId}-telefone`}
        label="Telemóvel"
        hint="Só para combinarmos consigo, se for preciso."
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
      <Checkbox id={`${formId}-consentimento`} label="Aceito que a associação me contacte sobre este turno" checked={consent} onChange={setConsent} />
      {errors.consent ? <p className="gn-field__error">{errors.consent}</p> : null}
      <Button type="submit" disabled={state === "sending"} block>{state === "sending" ? "A enviar…" : "Confirmar inscrição"}</Button>
      <Button type="button" variant="quiet" onClick={() => setOpen(false)}>Afinal não</Button>
    </form>
  );
}
