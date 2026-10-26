"use client";
import { useEffect, useId, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { ageLabel } from "@gn/domain";
import { Button, walkingCatSvg } from "@gn/ui";
import { nextWalkIn, pickCat, STROLL, STROLL_QUIET, type StrollState } from "@/lib/passeio";
import { NEW_CAT_SESSION_KEY, QUIET_PAGES, type NewCat } from "./CatAlerts";

const VISIT_KEY = "gn-passeio";
const PAUSE_KEY = "gn-passeio-pausa";
const LAST_KEY = "gn-passeio-ultimo";
/** Walking speeds in pixels per second, each with the stride that keeps its paws from sliding on the ground. */
const IN = { speed: 37, step: 0.8 };
const OUT = { speed: 49, step: 0.6 };
const SIT_MS = 8_000;
/** Width of the cat on screen (matches .stroll in globals.css), so it starts and ends just off screen. */
const OFF = 130;
/** `?gato=agora` sends a cat out at once, on any page: to try it on test sites and the demo. */
const isPreview = () => new URLSearchParams(window.location.search).get("gato") === "agora";

type Phase = "away" | "in" | "sit" | "out";

function readState(): StrollState & { lastSlug?: string } {
  let visit: Partial<StrollState> = {};
  let pausedUntil: number | undefined;
  let lastSlug: string | undefined;
  let newCatShown = false;
  try {
    visit = JSON.parse(sessionStorage.getItem(VISIT_KEY) ?? "{}");
    newCatShown = sessionStorage.getItem(NEW_CAT_SESSION_KEY) === "1";
    pausedUntil = Number(localStorage.getItem(PAUSE_KEY)) || undefined;
    lastSlug = localStorage.getItem(LAST_KEY) ?? undefined;
  } catch { /* private mode: every visit starts afresh */ }
  const state = { visitStart: visit.visitStart ?? Date.now(), walks: visit.walks ?? 0, lastWalk: visit.lastWalk, pausedUntil, newCatShown, lastSlug };
  if (!visit.visitStart) saveVisit(state);
  return state;
}

function saveVisit(s: Pick<StrollState, "visitStart" | "walks" | "lastWalk">) {
  try { sessionStorage.setItem(VISIT_KEY, JSON.stringify({ visitStart: s.visitStart, walks: s.walks, lastWalk: s.lastWalk })); } catch { /* private mode */ }
}

/**
 * Now and then (see lib/passeio.ts) the logo's cat walks in from the right into the bottom right corner of the
 * screen, head-butts the glass to get our attention, rubs itself as against your legs and says hello with the name
 * of a real cat waiting for a family, then turns round and goes. Tapping it, or pointing at it with a mouse, opens
 * that cat's card. It walks under every window, never while someone types or on pages
 * where people need to concentrate, and never for people who asked their device for less motion.
 */
export function StrollingCat({ cats }: { cats: NewCat[] }) {
  const pathname = usePathname();
  const [cat, setCat] = useState<NewCat>();
  const [phase, setPhase] = useState<Phase>("away");
  const [x, setX] = useState(-OFF);
  const [ms, setMs] = useState(0);
  const [card, setCard] = useState<"closed" | "hover" | "open">("closed");
  const box = useRef<HTMLDivElement>(null);
  const cardId = useId();
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const later = (fn: () => void, wait: number) => { timers.current.push(setTimeout(fn, wait)); };
  const clear = () => { timers.current.forEach(clearTimeout); timers.current = []; };

  const walkTo = (to: number, speed: number, from: number) => {
    // Speeds are for a cat 120px wide; a smaller cat takes smaller steps.
    const width = box.current?.offsetWidth || OFF;
    const duration = Math.round((Math.abs(to - from) / (speed * (width / 120))) * 1000);
    setMs(duration);
    setX(to);
    return duration;
  };

  const walkOut = (from: number) => {
    clear();
    setCard("closed");
    setPhase("out");
    // It turns round and goes back the way it came, so it never crosses the page.
    const d = walkTo(window.innerWidth + 20, OUT.speed, from);
    later(() => { setPhase("away"); setCat(undefined); setMs(0); }, d + 100);
  };

  // Schedules the next walk; checked again on every page change.
  useEffect(() => {
    if (phase !== "away" || !cats.length) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const preview = isPreview();
    const state = readState();
    const wait = preview ? 500 : nextWalkIn(state, Date.now());
    if (wait === null) return;
    const quiet = () => QUIET_PAGES.some((r) => r.test(window.location.pathname)) || STROLL_QUIET.some((r) => r.test(window.location.pathname));
    const busy = () => !!document.querySelector("dialog[open]") || /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName ?? "") || document.visibilityState !== "visible";
    let timer: ReturnType<typeof setTimeout>;
    const start = () => {
      if (!preview && (quiet() || busy())) { timer = setTimeout(start, 10_000); return; }
      const next = pickCat(cats, state.lastSlug);
      if (!next) return;
      const now = Date.now();
      saveVisit({ visitStart: state.visitStart, walks: state.walks + 1, lastWalk: now });
      try { localStorage.setItem(LAST_KEY, next.slug); } catch { /* private mode */ }
      setCat(next);
      setPhase("in");
      setMs(0);
      const enter = window.innerWidth + 20;
      setX(enter);
      // Next frame: walk in from the right into the bottom right corner and stop there for a while.
      later(() => {
        const width = box.current?.offsetWidth || OFF;
        const stop = Math.round(window.innerWidth - width - (window.innerWidth < 640 ? 12 : 32));
        const d = walkTo(stop, IN.speed, enter);
        later(() => { setPhase("sit"); later(() => walkOut(stop), SIT_MS); }, d);
      }, 50);
    };
    timer = setTimeout(start, wait);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, phase, cats]);

  // While its card is open the cat stays sitting; Escape closes the card.
  useEffect(() => {
    if (card === "closed") return;
    clear();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") walkOut(x); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card]);

  if (!cat || phase === "away") return null;
  const walking = !(phase === "sit" || card !== "closed");
  const art = walkingCatSvg({ walking, step: phase === "out" ? OUT.step : IN.step });
  const female = cat.sex === "femea";
  const name = cat.name;
  const sitting = phase === "sit" || card !== "closed";
  // Stops it where it is right now (it may be halfway through a walk).
  const hold = () => {
    if (phase === "sit") return;
    const el = box.current;
    const here = el ? new DOMMatrixReadOnly(getComputedStyle(el).transform).m41 : x;
    clear();
    setPhase("sit");
    setMs(0);
    setX(Math.round(here));
  };
  const open = (how: "hover" | "open") => { hold(); setCard((c) => (c === "open" ? c : how)); };
  const notNow = () => {
    try { localStorage.setItem(PAUSE_KEY, String(Date.now() + STROLL.pauseMs)); } catch { /* private mode */ }
    walkOut(x);
  };

  return (
    <div
      ref={box}
      className={`stroll${sitting ? " stroll--sit" : ""}${phase === "out" ? " stroll--back" : ""}`}
      style={{ transform: `translateX(${x}px)`, transitionDuration: `${ms}ms` }}
      onPointerLeave={(e) => { if (e.pointerType === "mouse" && card === "hover") later(() => walkOut(x), 600); }}
      onPointerEnter={(e) => { if (e.pointerType === "mouse" && card === "hover") clear(); }}
    >
      {card !== "closed" ? (
        <div className="stroll__card" id={cardId} role="dialog" aria-label={`${name}, para adoção`}>
          <img className="stroll__photo" src={cat.photo.url} alt={cat.photo.alt} />
          <div className="stroll__info">
            <p className="stroll__name">{name}</p>
            <p className="stroll__meta">{ageLabel(cat.ageYears)} · {female ? "Fêmea" : "Macho"}</p>
            <p className="stroll__summary">{cat.summary}</p>
            <Button href={`/adotar/${cat.slug}`} block onClick={() => walkOut(x)}>Conhecer {female ? "a" : "o"} {name}</Button>
            <button type="button" className="stroll__later" onClick={notNow}>Agora não</button>
          </div>
          <button type="button" className="stroll__close" aria-label="Fechar" onClick={() => walkOut(x)}>×</button>
        </div>
      ) : sitting ? (
        <p className="stroll__bubble" aria-hidden="true">Olá, sou {female ? "a" : "o"} {name}</p>
      ) : null}
      <button
        type="button"
        className="stroll__cat"
        dangerouslySetInnerHTML={{ __html: art }}
        aria-label={`Olá, sou ${female ? "a" : "o"} ${name} e procuro família. Ver ${female ? "a" : "o"} ${name}`}
        aria-expanded={card !== "closed"}
        aria-controls={card !== "closed" ? cardId : undefined}
        onPointerEnter={(e) => { if (e.pointerType === "mouse") open("hover"); }}
        onClick={() => (card === "open" ? walkOut(x) : open("open"))}
      />
    </div>
  );
}
