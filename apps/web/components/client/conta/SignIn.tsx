"use client";
import { useRef, useState, type FormEvent } from "react";
import { Button, Checkbox, Notice, TextField } from "@gn/ui";
import { contaClient } from "@/lib/conta";

type Step = { name: "contacto" } | { name: "nome" } | { name: "codigo"; sentTo: "email" | "telemovel"; newAccount: boolean; demoCode?: string };

/**
 * One box for email or mobile, then a 6-digit code. New people also give their name.
 * No passwords to remember, which matters most to the older helpers.
 */
export function SignIn({ onSignedIn }: { onSignedIn: (newAccount: boolean) => void }) {
  const client = contaClient();
  const [step, setStep] = useState<Step>({ name: "contacto" });
  const [contact, setContact] = useState("");
  const [name, setName] = useState("");
  const [consent, setConsent] = useState(false);
  const [code, setCode] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string>();
  const [busy, setBusy] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);

  const go = (next: Step) => {
    setStep(next);
    setErrors({});
    setMessage(undefined);
    requestAnimationFrame(() => heading.current?.focus());
  };

  async function sendCode(e?: FormEvent) {
    e?.preventDefault();
    setBusy(true);
    const withName = step.name === "nome";
    const r = await client.requestCode({ contact, ...(withName ? { name, consent: consent || undefined } : {}) });
    setBusy(false);
    if (!r.ok) {
      setErrors(r.fieldErrors);
      setMessage(r.fieldErrors.contact || r.fieldErrors.name || r.fieldErrors.consent ? undefined : r.message);
      return;
    }
    if (r.data.status === "precisa-nome") return go({ name: "nome" });
    go({ name: "codigo", sentTo: r.data.sentTo, newAccount: r.data.newAccount, demoCode: r.data.demoCode });
  }

  async function verify(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    const r = await client.verifyCode({ contact, code });
    setBusy(false);
    if (!r.ok) {
      setErrors(r.fieldErrors);
      setMessage(r.fieldErrors.code ? undefined : r.message);
      return;
    }
    onSignedIn(r.newAccount);
  }

  if (step.name === "codigo") {
    return (
      <form className="gn-stack gn-stack--m conta-form" onSubmit={verify} noValidate>
        <h2 ref={heading} tabIndex={-1}>Escreva o código</h2>
        <p>
          Enviámos um código de 6 números {step.sentTo === "email" ? "para o email" : "por mensagem para o telemóvel"} <strong>{contact.trim()}</strong>. Pode demorar um minuto a chegar.
        </p>
        {step.demoCode ? (
          <Notice tone="info" title={`Demonstração: o código é ${step.demoCode}`}>
            No site verdadeiro o código chega {step.sentTo === "email" ? "por email" : "por mensagem"}.
          </Notice>
        ) : null}
        {message ? <Notice tone="error" title="Não foi possível entrar">{message}</Notice> : null}
        <TextField id="conta-codigo" label="Código" inputMode="numeric" autoComplete="one-time-code" value={code} onChange={(e) => setCode(e.target.value)} error={errors.code} />
        <Button type="submit" disabled={busy} block>{busy ? "A verificar…" : step.newAccount ? "Criar a minha conta" : "Entrar"}</Button>
        <div className="action-row">
          <Button variant="quiet" onClick={() => { setCode(""); void sendCode(); }}>Enviar outro código</Button>
          <Button variant="quiet" onClick={() => { setCode(""); go({ name: "contacto" }); }}>Usar outro email ou telemóvel</Button>
        </div>
      </form>
    );
  }

  if (step.name === "nome") {
    return (
      <form className="gn-stack gn-stack--m conta-form" onSubmit={sendCode} noValidate>
        <h2 ref={heading} tabIndex={-1}>Bem-vindo! Vamos criar a sua conta</h2>
        <p>Ainda não há uma conta com <strong>{contact.trim()}</strong>. Só precisamos do seu nome.</p>
        {message ? <Notice tone="error" title="Não foi possível continuar">{message}</Notice> : null}
        <TextField id="conta-nome" label="O seu nome" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} />
        <Checkbox
          id="conta-consentimento"
          label="Aceito que a associação guarde o meu nome e contacto para as Patinhas"
          hint="Pode apagar a conta quando quiser. Nunca partilhamos os seus dados."
          checked={consent}
          onChange={setConsent}
        />
        {errors.consent ? <p className="gn-field__error">{errors.consent}</p> : null}
        <Button type="submit" disabled={busy} block>{busy ? "A enviar…" : "Enviar o código"}</Button>
        <Button variant="quiet" onClick={() => go({ name: "contacto" })}>Voltar</Button>
      </form>
    );
  }

  return (
    <form className="gn-stack gn-stack--m conta-form" onSubmit={sendCode} noValidate>
      <h2 ref={heading} tabIndex={-1}>Entrar ou criar conta</h2>
      <p>Não precisa de palavra-passe. Enviamos-lhe um código para entrar.</p>
      {message ? <Notice tone="error" title="Não foi possível continuar">{message}</Notice> : null}
      <TextField id="conta-contacto" label="Email ou telemóvel" autoComplete="username" value={contact} onChange={(e) => setContact(e.target.value)} error={errors.contact} />
      <Button type="submit" disabled={busy} block>{busy ? "A continuar…" : "Continuar"}</Button>
      {client.demo ? (
        <p className="small muted">Demonstração: para ver uma conta com Patinhas, medalhas e trocas, entre com o telemóvel 912 000 001.</p>
      ) : null}
    </form>
  );
}
