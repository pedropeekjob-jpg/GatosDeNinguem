"use client";
import { useEffect, useState, type FormEvent } from "react";
import { usePathname } from "next/navigation";
import { alertAgeGroupLabel, alertAgeGroups, describeAlertFilters, noAlertFilters, type AlertAgeGroup, type CatAlertFilters } from "@gn/domain";
import { Button, Checkbox, Modal, Notice, TextField } from "@gn/ui";
import { pushSetup, rememberAlerts, shouldOfferAlerts, signUpForAlerts, subscribeThisDevice } from "@/lib/alertas";
import { PrivacyHint } from "../forms/PrivacyHint";
import { useModalHistory } from "./FormModal";

const TITLE = "Quer saber quando chegam gatos novos?";
const INTRO = "Enviamos-lhe um email quando um gato fica pronto para adoção. Só isso, sem publicidade.";
const STATIC_DEMO = process.env.NEXT_PUBLIC_STATIC_DEMO === "1";

const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

function Chip({ pressed, onClick, children }: { pressed: boolean; onClick: () => void; children: string }) {
  return <button type="button" className="cat-filter__chip" aria-pressed={pressed} onClick={onClick}>{children}</button>;
}

/** Email sign-up with optional preferences, and notifications on this device where the browser allows them. */
export function CatAlertForm({ onDone, onLater }: { onDone: () => void; onLater?: () => void }) {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [filters, setFilters] = useState<CatAlertFilters>(noAlertFilters);
  const [state, setState] = useState<"idle" | "sending" | "email" | "push" | "confirmed">("idle");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string>();
  const [demoLink, setDemoLink] = useState<string>();
  const [push, setPush] = useState<{ publicKey: string } | null>(null);

  useEffect(() => { void pushSetup().then(setPush); }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setState("sending");
    const result = await signUpForAlerts({ email, filters, consent: consent || undefined });
    if (result.ok) {
      setDemoLink(result.demoConfirmUrl);
      setState("email");
      return onDone();
    }
    setErrors(result.fieldErrors);
    setMessage(Object.keys(result.fieldErrors).length ? undefined : result.message);
    setState("idle");
  }

  async function onPush() {
    if (!push) return;
    setState("sending");
    const result = await subscribeThisDevice(push.publicKey, filters);
    if (result.ok) {
      setState("push");
      return onDone();
    }
    setMessage(result.message);
    setState("idle");
  }

  if (state === "confirmed") {
    return (
      <Notice tone="success" title="Pronto!">
        Vamos avisar <strong>{email.trim()}</strong> quando chegar um gato para adoção. Escolheu: {describeAlertFilters(filters)}.
        <br /><span className="small">(Demonstração: nada foi guardado nem enviado.)</span>
      </Notice>
    );
  }
  if (state === "email") {
    return (
      <div className="gn-stack gn-stack--s">
        <Notice tone="success" title="Falta só confirmar">
          {STATIC_DEMO
            ? <>Aqui a pessoa recebe um email em <strong>{email.trim()}</strong> e só começa a receber avisos depois de carregar em “Confirmar”.</>
            : <>Enviámos um email para <strong>{email.trim()}</strong>. Abra-o e carregue em “Confirmar”: só depois começamos a avisar.</>}
          {demoLink ? <><br /><a href={demoLink} target="_blank" rel="noopener">Demonstração: confirmar aqui</a></> : null}
        </Notice>
        {STATIC_DEMO ? (
          <>
            <p className="small muted">Na versão de demonstração não enviamos emails. Veja o que acontece quando a pessoa confirma:</p>
            <Button type="button" variant="secondary" block onClick={() => setState("confirmed")}>Simular a confirmação do email</Button>
          </>
        ) : null}
      </div>
    );
  }
  if (state === "push") return <Notice tone="success" title="Pronto!">Vai receber uma notificação neste aparelho quando chegar um gato para adoção.</Notice>;

  const ages = alertAgeGroups as readonly AlertAgeGroup[];
  return (
    <form onSubmit={onSubmit} className="gn-stack gn-stack--m" noValidate>
      <TextField id="aviso-email" label="O seu email" type="email" autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} />
      <details className="alert-prefs">
        <summary>Só alguns gatos? <span className="muted">(opcional)</span></summary>
        <div className="gn-stack gn-stack--s">
          <fieldset className="alert-prefs__group">
            <legend>Idade</legend>
            <div className="alert-prefs__chips">
              {ages.map((a) => <Chip key={a} pressed={filters.ages.includes(a)} onClick={() => setFilters({ ...filters, ages: toggle(filters.ages, a) })}>{alertAgeGroupLabel[a].replace(/ \(.*\)$/, "")}</Chip>)}
            </div>
          </fieldset>
          <fieldset className="alert-prefs__group">
            <legend>Sexo</legend>
            <div className="alert-prefs__chips">
              <Chip pressed={filters.sexes.includes("femea")} onClick={() => setFilters({ ...filters, sexes: toggle(filters.sexes, "femea") })}>Fêmeas</Chip>
              <Chip pressed={filters.sexes.includes("macho")} onClick={() => setFilters({ ...filters, sexes: toggle(filters.sexes, "macho") })}>Machos</Chip>
            </div>
          </fieldset>
          <fieldset className="alert-prefs__group">
            <legend>Que se dê bem com</legend>
            <div className="alert-prefs__chips">
              <Chip pressed={filters.withKids} onClick={() => setFilters({ ...filters, withKids: !filters.withKids })}>Crianças</Chip>
              <Chip pressed={filters.withCats} onClick={() => setFilters({ ...filters, withCats: !filters.withCats })}>Outros gatos</Chip>
              <Chip pressed={filters.withDogs} onClick={() => setFilters({ ...filters, withDogs: !filters.withDogs })}>Cães</Chip>
            </div>
          </fieldset>
          <p className="small muted">Sem escolher nada, avisamos de todos os gatos.</p>
        </div>
      </details>
      <Checkbox
        id="aviso-consentimento"
        label="Aceito receber estes avisos por email"
        hint={<PrivacyHint>Usamos o seu email só para isto. Pode cancelar quando quiser, com a ligação no fim de cada aviso.</PrivacyHint>}
        checked={consent}
        onChange={setConsent}
      />
      {errors.consent ? <p className="gn-field__error">{errors.consent}</p> : null}
      {message ? <Notice tone="error" title="Não foi possível">{message}</Notice> : null}
      <Button type="submit" block disabled={state === "sending"}>{state === "sending" ? "A enviar…" : "Avisem-me"}</Button>
      {push ? (
        <div className="gn-stack gn-stack--s alert-push">
          <p className="small muted">Prefere sem email?</p>
          <Button type="button" variant="secondary" block disabled={state === "sending"} onClick={onPush}>Receber notificações neste aparelho</Button>
        </div>
      ) : null}
      {onLater ? <button type="button" className="alert-later" onClick={onLater}>Agora não</button> : null}
    </form>
  );
}

/** A button that opens the sign-up (on Adotar, and wherever a page wants it). */
export function CatAlertButton({ label = "Avisem-me de gatos novos", variant = "secondary" }: { label?: string; variant?: "primary" | "secondary" }) {
  const modal = useModalHistory();
  return (
    <>
      <Button variant={variant} aria-haspopup="dialog" onClick={modal.show}>{label}</Button>
      <Modal open={modal.open} onClose={modal.hide} title={TITLE} intro={INTRO} sheet>
        <CatAlertForm onDone={() => rememberAlerts("inscrito")} />
      </Modal>
    </>
  );
}

/** Pages where an offer would get in the way (emergencies, forms, the shop, the volunteers' area). */
const QUIET = [/^\/sos/, /^\/conta/, /^\/loja/, /^\/patinhas/, /\/conhecer$/, /^\/adotar\/descobrir/, /^\/apadrinhar\//, /^\/ajudar\/(turnos|familia-temporaria)/];
const VIEWS_KEY = "gn-paginas-vistas";
/** `?avisos=agora` opens the window at once, on any page, without remembering the answer: to try it on test sites and the demo. */
const isPreview = () => new URLSearchParams(window.location.search).get("avisos") === "agora";

/**
 * Offers the alerts once, politely: never on the first page someone opens, only after a while on a page
 * (or a minute on the first one), never over another window, never while they type, and never again after
 * "Agora não" (for two months) or once they have signed up.
 * Add `?avisos=agora` to any address to see it straight away.
 */
export function CatAlertPrompt() {
  const pathname = usePathname();
  const modal = useModalHistory();
  const [offered, setOffered] = useState(false);
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    if (!offered && isPreview()) {
      setPreview(true);
      setOffered(true);
      modal.show();
      return;
    }
    let views = 1;
    try {
      views = Number(sessionStorage.getItem(VIEWS_KEY) ?? "0") + 1;
      sessionStorage.setItem(VIEWS_KEY, String(views));
    } catch { /* private mode */ }
    if (offered || !shouldOfferAlerts() || QUIET.some((r) => r.test(pathname))) return;
    const busy = () => !!document.querySelector("dialog[open]") || /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName ?? "") || document.visibilityState !== "visible";
    let timer: ReturnType<typeof setTimeout>;
    const attempt = () => {
      if (busy()) { timer = setTimeout(attempt, 10_000); return; }
      setOffered(true);
      modal.show();
    };
    timer = setTimeout(attempt, views >= 2 ? 15_000 : 60_000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, offered]);

  const later = () => { if (!preview) rememberAlerts("fechado"); modal.hide(); };
  return (
    <Modal open={modal.open} onClose={later} title={TITLE} intro={INTRO} sheet>
      <CatAlertForm onDone={() => { if (!preview) rememberAlerts("inscrito"); }} onLater={later} />
    </Modal>
  );
}
