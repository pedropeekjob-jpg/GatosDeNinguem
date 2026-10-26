"use client";
import { useEffect, useState, type FormEvent } from "react";
import { usePathname } from "next/navigation";
import { alertAgeGroups, unseenNewCats, noAlertFilters, type AlertAgeGroup, type CatAlertFilters } from "@gn/domain";
import { Button, Checkbox, Modal, Notice, TextField } from "@gn/ui";
import { markCatSeen, pushSetup, seenCats, signUpForAlerts, subscribeThisDevice } from "@/lib/alertas";
import { splitLang } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/client";
import { ageLabel, alertAgeGroupLabel, catWords, describeAlertFilters, sexLabel } from "@/lib/i18n/labels";
import type { I18n } from "@/lib/i18n/t";
import { PrivacyHint } from "../forms/PrivacyHint";
import { useModalHistory } from "./FormModal";

const title = ({ t }: I18n) => t({ pt: "Quer saber quando chegam gatos novos?", en: "Would you like to hear when new cats arrive?", es: "¿Quiere saber cuándo llegan gatos nuevos?", fr: "Voulez-vous savoir quand de nouveaux chats arrivent ?" });
const intro = ({ t }: I18n) => t({ pt: "Enviamos-lhe um email quando um gato fica pronto para adoção. Só isso, sem publicidade.", en: "We email you when a cat is ready for adoption. Nothing else, no advertising.", es: "Le enviamos un correo cuando un gato está listo para adopción. Solo eso, sin publicidad.", fr: "Nous vous envoyons un e-mail quand un chat est prêt à être adopté. Rien d’autre, sans publicité." });
const STATIC_DEMO = process.env.NEXT_PUBLIC_STATIC_DEMO === "1";

const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

function Chip({ pressed, onClick, children }: { pressed: boolean; onClick: () => void; children: string }) {
  return <button type="button" className="cat-filter__chip" aria-pressed={pressed} onClick={onClick}>{children}</button>;
}

/** Email sign-up with optional preferences, and notifications on this device where the browser allows them. */
export function CatAlertForm() {
  const { lang, t } = useI18n();
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
      <Notice tone="success" title={t({ pt: "Pronto!", en: "Done!", es: "¡Listo!", fr: "C’est fait !" })}>
        {t({
          pt: <>Vamos avisar <strong>{email.trim()}</strong> quando chegar um gato para adoção. Escolheu: {describeAlertFilters(lang, filters)}.</>,
          en: <>We will tell <strong>{email.trim()}</strong> when a cat is ready for adoption. You chose: {describeAlertFilters(lang, filters)}.</>,
          es: <>Avisaremos a <strong>{email.trim()}</strong> cuando llegue un gato en adopción. Ha elegido: {describeAlertFilters(lang, filters)}.</>,
          fr: <>Nous préviendrons <strong>{email.trim()}</strong> quand un chat sera prêt à être adopté. Votre choix : {describeAlertFilters(lang, filters)}.</>,
        })}
        <br /><span className="small">{t({ pt: "(Demonstração: nada foi guardado nem enviado.)", en: "(Demo: nothing was saved or sent.)", es: "(Demostración: no se ha guardado ni enviado nada.)", fr: "(Démonstration : rien n’a été enregistré ni envoyé.)" })}</span>
      </Notice>
    );
  }
  if (state === "email") {
    return (
      <div className="gn-stack gn-stack--s">
        <Notice tone="success" title={t({ pt: "Falta só confirmar", en: "Just one more step", es: "Solo falta confirmar", fr: "Il ne reste qu’à confirmer" })}>
          {STATIC_DEMO
            ? t({
                pt: <>Aqui a pessoa recebe um email em <strong>{email.trim()}</strong> e só começa a receber avisos depois de carregar em “Confirmar”.</>,
                en: <>Here the person gets an email at <strong>{email.trim()}</strong> and only starts receiving alerts after pressing “Confirm”.</>,
                es: <>Aquí la persona recibe un correo en <strong>{email.trim()}</strong> y solo empieza a recibir avisos después de pulsar “Confirmar”.</>,
                fr: <>Ici, la personne reçoit un e-mail à <strong>{email.trim()}</strong> et ne reçoit les alertes qu’après avoir appuyé sur « Confirmer ».</>,
              })
            : t({
                pt: <>Enviámos um email para <strong>{email.trim()}</strong>. Abra-o e carregue em “Confirmar”: só depois começamos a avisar.</>,
                en: <>We sent an email to <strong>{email.trim()}</strong>. Open it and press “Confirm”: only then will we start sending alerts.</>,
                es: <>Hemos enviado un correo a <strong>{email.trim()}</strong>. Ábralo y pulse “Confirmar”: solo entonces empezaremos a avisarle.</>,
                fr: <>Nous avons envoyé un e-mail à <strong>{email.trim()}</strong>. Ouvrez-le et appuyez sur « Confirmer » : ce n’est qu’ensuite que nous vous préviendrons.</>,
              })}
          {demoLink ? <><br /><a href={demoLink} target="_blank" rel="noopener">{t({ pt: "Demonstração: confirmar aqui", en: "Demo: confirm here", es: "Demostración: confirmar aquí", fr: "Démonstration : confirmer ici" })}</a></> : null}
        </Notice>
        {STATIC_DEMO ? (
          <>
            <p className="small muted">{t({ pt: "Na versão de demonstração não enviamos emails. Veja o que acontece quando a pessoa confirma:", en: "The demo sends no emails. See what happens when the person confirms:", es: "En la versión de demostración no enviamos correos. Vea qué pasa cuando la persona confirma:", fr: "La démonstration n’envoie pas d’e-mails. Voyez ce qui se passe quand la personne confirme :" })}</p>
            <Button type="button" variant="secondary" block onClick={() => setState("confirmed")}>{t({ pt: "Simular a confirmação do email", en: "Simulate confirming the email", es: "Simular la confirmación del correo", fr: "Simuler la confirmation de l’e-mail" })}</Button>
          </>
        ) : null}
      </div>
    );
  }
  if (state === "push") return <Notice tone="success" title={t({ pt: "Pronto!", en: "Done!", es: "¡Listo!", fr: "C’est fait !" })}>{t({ pt: "Vai receber uma notificação neste aparelho quando chegar um gato para adoção.", en: "You will get a notification on this device when a cat is ready for adoption.", es: "Recibirá una notificación en este dispositivo cuando llegue un gato en adopción.", fr: "Vous recevrez une notification sur cet appareil quand un chat sera prêt à être adopté." })}</Notice>;

  const ages = alertAgeGroups as readonly AlertAgeGroup[];
  return (
    <form onSubmit={onSubmit} className="gn-stack gn-stack--m" noValidate>
      <TextField id="aviso-email" label={t({ pt: "O seu email", en: "Your email", es: "Su correo electrónico", fr: "Votre e-mail" })} type="email" autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} />
      <details className="alert-prefs">
        <summary>{t({ pt: "Só alguns gatos?", en: "Only some cats?", es: "¿Solo algunos gatos?", fr: "Seulement certains chats ?" })} <span className="muted">{t({ pt: "(opcional)", en: "(optional)", es: "(opcional)", fr: "(facultatif)" })}</span></summary>
        <div className="gn-stack gn-stack--s">
          <fieldset className="alert-prefs__group">
            <legend>{t({ pt: "Idade", en: "Age", es: "Edad", fr: "Âge" })}</legend>
            <div className="alert-prefs__chips">
              {ages.map((a) => <Chip key={a} pressed={filters.ages.includes(a)} onClick={() => setFilters({ ...filters, ages: toggle(filters.ages, a) })}>{alertAgeGroupLabel[lang][a].replace(/ \(.*\)$/, "")}</Chip>)}
            </div>
          </fieldset>
          <fieldset className="alert-prefs__group">
            <legend>{t({ pt: "Sexo", en: "Sex", es: "Sexo", fr: "Sexe" })}</legend>
            <div className="alert-prefs__chips">
              <Chip pressed={filters.sexes.includes("femea")} onClick={() => setFilters({ ...filters, sexes: toggle(filters.sexes, "femea") })}>{t({ pt: "Fêmeas", en: "Females", es: "Hembras", fr: "Femelles" })}</Chip>
              <Chip pressed={filters.sexes.includes("macho")} onClick={() => setFilters({ ...filters, sexes: toggle(filters.sexes, "macho") })}>{t({ pt: "Machos", en: "Males", es: "Machos", fr: "Mâles" })}</Chip>
            </div>
          </fieldset>
          <fieldset className="alert-prefs__group">
            <legend>{t({ pt: "Que se dê bem com", en: "Good with", es: "Que se lleve bien con", fr: "Qui s’entend avec" })}</legend>
            <div className="alert-prefs__chips">
              <Chip pressed={filters.withKids} onClick={() => setFilters({ ...filters, withKids: !filters.withKids })}>{t({ pt: "Crianças", en: "Children", es: "Niños", fr: "Enfants" })}</Chip>
              <Chip pressed={filters.withCats} onClick={() => setFilters({ ...filters, withCats: !filters.withCats })}>{t({ pt: "Outros gatos", en: "Other cats", es: "Otros gatos", fr: "Autres chats" })}</Chip>
              <Chip pressed={filters.withDogs} onClick={() => setFilters({ ...filters, withDogs: !filters.withDogs })}>{t({ pt: "Cães", en: "Dogs", es: "Perros", fr: "Chiens" })}</Chip>
            </div>
          </fieldset>
          <p className="small muted">{t({ pt: "Sem escolher nada, avisamos de todos os gatos.", en: "If you choose nothing, we tell you about every cat.", es: "Si no elige nada, le avisamos de todos los gatos.", fr: "Sans choix, nous vous prévenons pour tous les chats." })}</p>
        </div>
      </details>
      <Checkbox
        id="aviso-consentimento"
        label={t({ pt: "Aceito receber estes avisos por email", en: "I agree to receive these alerts by email", es: "Acepto recibir estos avisos por correo", fr: "J’accepte de recevoir ces alertes par e-mail" })}
        hint={<PrivacyHint>{t({ pt: "Usamos o seu email só para isto. Pode cancelar quando quiser, com a ligação no fim de cada aviso.", en: "We only use your email for this. You can stop at any time with the link at the end of each alert.", es: "Solo usamos su correo para esto. Puede darse de baja cuando quiera con el enlace al final de cada aviso.", fr: "Nous n’utilisons votre e-mail que pour cela. Vous pouvez vous désinscrire à tout moment avec le lien en bas de chaque alerte." })}</PrivacyHint>}
        checked={consent}
        onChange={setConsent}
      />
      {errors.consent ? <p className="gn-field__error">{errors.consent}</p> : null}
      {message ? <Notice tone="error" title={t({ pt: "Não foi possível", en: "That didn’t work", es: "No ha sido posible", fr: "Cela n’a pas fonctionné" })}>{message}</Notice> : null}
      <Button type="submit" block disabled={state === "sending"}>{state === "sending" ? t({ pt: "A enviar…", en: "Sending…", es: "Enviando…", fr: "Envoi…" }) : t({ pt: "Avisem-me", en: "Let me know", es: "Avísenme", fr: "Prévenez-moi" })}</Button>
      {push ? (
        <div className="gn-stack gn-stack--s alert-push">
          <p className="small muted">{t({ pt: "Prefere sem email?", en: "Rather not use email?", es: "¿Prefiere sin correo?", fr: "Vous préférez sans e-mail ?" })}</p>
          <Button type="button" variant="secondary" block disabled={state === "sending"} onClick={onPush}>{t({ pt: "Receber notificações neste aparelho", en: "Get notifications on this device", es: "Recibir notificaciones en este dispositivo", fr: "Recevoir des notifications sur cet appareil" })}</Button>
        </div>
      ) : null}
    </form>
  );
}

/** A button that opens the sign-up (on Adotar, and wherever a page wants it). */
export function CatAlertButton({ label, variant = "secondary" }: { label?: string; variant?: "primary" | "secondary" }) {
  const i18n = useI18n();
  const modal = useModalHistory();
  return (
    <>
      <Button variant={variant} aria-haspopup="dialog" onClick={modal.show}>{label ?? i18n.t({ pt: "Avisem-me de gatos novos", en: "Tell me about new cats", es: "Avísenme de gatos nuevos", fr: "Prévenez-moi des nouveaux chats" })}</Button>
      <Modal open={modal.open} onClose={modal.hide} title={title(i18n)} intro={intro(i18n)} sheet>
        <CatAlertForm />
      </Modal>
    </>
  );
}

/** What the pop-up needs to show a cat. */
export type NewCat = { slug: string; name: string; sex: "macho" | "femea"; ageYears: number; summary: string; status: "para-adocao"; listedAt?: string; photo: { url: string; alt: string } };

/** Pages where a pop-up would get in the way (emergencies, forms, the shop, the volunteers' area), in any language. */
const QUIET = [/^\/sos/, /^\/conta/, /^\/loja/, /^\/patinhas/, /\/conhecer$/, /^\/adotar\/descobrir/, /^\/apadrinhar\//, /^\/ajudar\/(turnos|familia-temporaria)/, /^\/privacidade/, /^\/cookies/];
export const isQuietPage = (pathname: string) => { const path = splitLang(pathname)[1]; return QUIET.some((r) => r.test(path)); };
export const NEW_CAT_SESSION_KEY = "gn-novo-gato-mostrado";
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
  const i18n = useI18n();
  const { lang, t, l } = i18n;
  const pathname = usePathname();
  const [cat, setCat] = useState<NewCat>();
  const [more, setMore] = useState(0);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"cat" | "email">("cat");

  useEffect(() => {
    const own = splitLang(pathname)[1].match(/^\/adotar\/([^/]+)$/)?.[1];
    if (own) markCatSeen(own);
    if (cat) return;
    const preview = isPreview();
    let shownThisVisit = false;
    try { shownThisVisit = sessionStorage.getItem(NEW_CAT_SESSION_KEY) === "1"; } catch { /* private mode */ }
    if (!preview && (shownThisVisit || isQuietPage(pathname))) return;
    const candidates = preview || TEST_SITE ? cats.filter((c) => c.slug !== own) : unseenNewCats(cats, seenCats(), new Date()).filter((c) => c.slug !== own);
    const first = candidates[0];
    if (!first) return;
    const busy = () => !!document.querySelector("dialog[open]") || /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName ?? "") || document.visibilityState !== "visible";
    let timer: ReturnType<typeof setTimeout>;
    const attempt = () => {
      if (busy()) { timer = setTimeout(attempt, 5_000); return; }
      if (!preview) {
        candidates.forEach((c) => markCatSeen(c.slug));
        try { sessionStorage.setItem(NEW_CAT_SESSION_KEY, "1"); } catch { /* private mode */ }
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
  const isNew = catWords(lang, cat.sex).newForAdoption;
  return (
    <Modal open={open} onClose={close} title={view === "cat" ? `${isNew}: ${cat.name}` : title(i18n)} intro={view === "email" ? intro(i18n) : undefined} sheet bare={view === "cat"}>
      {view === "cat" ? (
        <article className="new-cat">
          <div className="new-cat__media">
            <img className="new-cat__photo" src={cat.photo.url} alt={cat.photo.alt} />
            <span className="new-cat__badge">{isNew}</span>
          </div>
          <div className="new-cat__body">
            <div>
              <h2 className="new-cat__name">{cat.name}</h2>
              <p className="new-cat__meta">{ageLabel(lang, cat.ageYears)} · {sexLabel[lang][cat.sex]}</p>
            </div>
            <p className="new-cat__summary">{cat.summary}</p>
            <div className="new-cat__actions">
              <Button href={l(`/adotar/${cat.slug}`)} block onClick={close}>{t({ pt: `Conhecer ${female ? "a" : "o"} ${cat.name}`, en: `Meet ${cat.name}`, es: `Conocer a ${cat.name}`, fr: `Découvrir ${cat.name}` })}</Button>
              {more > 0 ? (
                <Button href={l("/adotar")} variant="secondary" block onClick={close}>
                  {more === 1
                    ? t({ pt: "Ver o outro gato novo", en: "See the other new cat", es: "Ver el otro gato nuevo", fr: "Voir l’autre nouveau chat" })
                    : t({ pt: `Ver os outros ${more} gatos novos`, en: `See the other ${more} new cats`, es: `Ver los otros ${more} gatos nuevos`, fr: `Voir les ${more} autres nouveaux chats` })}
                </Button>
              ) : null}
            </div>
            <button type="button" className="alert-later" onClick={() => setView("email")}>{t({ pt: "Avisem-me por email quando chegarem outros", en: "Email me when others arrive", es: "Avísenme por correo cuando lleguen otros", fr: "Prévenez-moi par e-mail quand d’autres arrivent" })}</button>
          </div>
        </article>
      ) : (
        <CatAlertForm />
      )}
    </Modal>
  );
}
