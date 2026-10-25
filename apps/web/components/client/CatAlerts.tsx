"use client";
import { useEffect, useState, type FormEvent } from "react";
import { usePathname } from "next/navigation";
import { ageLabel, alertAgeGroupLabel, alertAgeGroups, describeAlertFilters, unseenNewCats, noAlertFilters, type AlertAgeGroup, type CatAlertFilters } from "@gn/domain";
import { Button, Checkbox, Modal, Notice, TextField } from "@gn/ui";
import { markCatSeen, pushSetup, seenCats, signUpForAlerts, subscribeThisDevice } from "@/lib/alertas";
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
export function CatAlertForm() {
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
      return;
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
      return;
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
        <CatAlertForm />
      </Modal>
    </>
  );
}

/** What the pop-up needs to show a cat. */
export type NewCat = { slug: string; name: string; sex: "macho" | "femea"; ageYears: number; summary: string; status: "para-adocao"; listedAt?: string; photo: { url: string; alt: string } };

/** Pages where a pop-up would get in the way (emergencies, forms, the shop, the volunteers' area). */
const QUIET = [/^\/sos/, /^\/conta/, /^\/loja/, /^\/patinhas/, /\/conhecer$/, /^\/adotar\/descobrir/, /^\/apadrinhar\//, /^\/ajudar\/(turnos|familia-temporaria)/, /^\/privacidade/, /^\/cookies/];
const SESSION_KEY = "gn-novo-gato-mostrado";
/** `?avisos=agora` shows the newest cat at once, on any page, even if already seen: to try it on test sites and the demo. */
const isPreview = () => new URLSearchParams(window.location.search).get("avisos") === "agora";
/** Test sites (GitHub Pages demo, Render): the newest cat on every visit, seen or not, so the pop-up can be tried. */
const TEST_SITE = process.env.NEXT_PUBLIC_NEW_CAT_POPUP === "teste";
const DELAY_MS = 5_000;

/**
 * When a cat has just been put up for adoption (last 30 days) and this visitor has not seen it yet, a pop-up shows
 * it: photo, name, age and a short description, with a link to its page. Each cat once per visitor (opening its
 * page also counts), at most one pop-up per visit, 5 seconds after entering the site, never over another window,
 * while someone types, or on pages where it would get in the way. People can also ask for an email instead.
 */
export function NewCatPrompt({ cats }: { cats: NewCat[] }) {
  const pathname = usePathname();
  const [cat, setCat] = useState<NewCat>();
  const [more, setMore] = useState(0);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"cat" | "email">("cat");

  useEffect(() => {
    const own = pathname.match(/^\/adotar\/([^/]+)$/)?.[1];
    if (own) markCatSeen(own);
    if (cat) return;
    const preview = isPreview();
    let shownThisVisit = false;
    try { shownThisVisit = sessionStorage.getItem(SESSION_KEY) === "1"; } catch { /* private mode */ }
    if (!preview && (shownThisVisit || QUIET.some((r) => r.test(pathname)))) return;
    const candidates = preview || TEST_SITE ? cats.filter((c) => c.slug !== own) : unseenNewCats(cats, seenCats(), new Date()).filter((c) => c.slug !== own);
    const first = candidates[0];
    if (!first) return;
    const busy = () => !!document.querySelector("dialog[open]") || /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName ?? "") || document.visibilityState !== "visible";
    let timer: ReturnType<typeof setTimeout>;
    const attempt = () => {
      if (busy()) { timer = setTimeout(attempt, 5_000); return; }
      if (!preview) {
        candidates.forEach((c) => markCatSeen(c.slug));
        try { sessionStorage.setItem(SESSION_KEY, "1"); } catch { /* private mode */ }
      }
      setCat(first);
      setMore(candidates.length - 1);
      setOpen(true);
    };
    timer = setTimeout(attempt, preview ? 300 : DELAY_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  if (!cat) return null;
  const close = () => setOpen(false);
  const female = cat.sex === "femea";
  return (
    <Modal open={open} onClose={close} title={view === "cat" ? `Nov${female ? "a" : "o"} para adoção: ${cat.name}` : TITLE} intro={view === "email" ? INTRO : undefined} sheet bare={view === "cat"}>
      {view === "cat" ? (
        <article className="new-cat">
          <div className="new-cat__media">
            <img className="new-cat__photo" src={cat.photo.url} alt={cat.photo.alt} />
            <span className="new-cat__badge">Nov{female ? "a" : "o"} para adoção</span>
          </div>
          <div className="new-cat__body">
            <div>
              <h2 className="new-cat__name">{cat.name}</h2>
              <p className="new-cat__meta">{ageLabel(cat.ageYears)} · {female ? "Fêmea" : "Macho"}</p>
            </div>
            <p className="new-cat__summary">{cat.summary}</p>
            <div className="new-cat__actions">
              <Button href={`/adotar/${cat.slug}`} block onClick={close}>Conhecer {female ? "a" : "o"} {cat.name}</Button>
              {more > 0 ? <Button href="/adotar" variant="secondary" block onClick={close}>Ver {more === 1 ? "o outro gato novo" : `os outros ${more} gatos novos`}</Button> : null}
            </div>
            <button type="button" className="alert-later" onClick={() => setView("email")}>Avisem-me por email quando chegarem outros</button>
          </div>
        </article>
      ) : (
        <CatAlertForm />
      )}
    </Modal>
  );
}
