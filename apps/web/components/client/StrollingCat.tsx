"use client";
import { useEffect, useId, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { ageLabel } from "@gn/domain";
import { Button } from "@gn/ui";
import { nextWalkIn, pickCat, STROLL, STROLL_QUIET, type StrollState } from "@/lib/passeio";
import { NEW_CAT_SESSION_KEY, QUIET_PAGES, type NewCat } from "./CatAlerts";

const VISIT_KEY = "gn-passeio";
const PAUSE_KEY = "gn-passeio-pausa";
const LAST_KEY = "gn-passeio-ultimo";
/** Walking speeds in pixels per second, and how long it sits saying hello. */
const IN_SPEED = 70;
const OUT_SPEED = 95;
const SIT_MS = 6_000;
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
 * Now and then (see lib/passeio.ts) a cat drawn like the one in the logo walks in along the bottom of the screen,
 * sits down and says hello with the name of a real cat waiting for a family, then walks on. Tapping it, or pointing
 * at it with a mouse, opens that cat's card. It walks under every window, never while someone types or on pages
 * where people need to concentrate, and never for people who asked their device for less motion.
 */
export function StrollingCat({ cats }: { cats: NewCat[] }) {
  const pathname = usePathname();
  const [cat, setCat] = useState<NewCat>();
  const [phase, setPhase] = useState<Phase>("away");
  const [x, setX] = useState(-120);
  const [ms, setMs] = useState(0);
  const [card, setCard] = useState<"closed" | "hover" | "open">("closed");
  const box = useRef<HTMLDivElement>(null);
  const cardId = useId();
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const later = (fn: () => void, wait: number) => { timers.current.push(setTimeout(fn, wait)); };
  const clear = () => { timers.current.forEach(clearTimeout); timers.current = []; };

  const walkTo = (to: number, speed: number, from: number) => {
    const duration = Math.round((Math.abs(to - from) / speed) * 1000);
    setMs(duration);
    setX(to);
    return duration;
  };

  const walkOut = (from: number) => {
    clear();
    setCard("closed");
    setPhase("out");
    const d = walkTo(window.innerWidth + 40, OUT_SPEED, from);
    later(() => { setPhase("away"); setCat(undefined); setMs(0); setX(-120); }, d + 100);
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
      setX(-120);
      // Next frame: walk in to a spot near the left edge and sit there for a while.
      later(() => {
        const stop = Math.round(Math.max(16, Math.min(window.innerWidth * 0.12, 200)));
        const d = walkTo(stop, IN_SPEED, -120);
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
      className={`stroll${sitting ? " stroll--sit" : ""}`}
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
        aria-label={`Olá, sou ${female ? "a" : "o"} ${name} e procuro família. Ver ${female ? "a" : "o"} ${name}`}
        aria-expanded={card !== "closed"}
        aria-controls={card !== "closed" ? cardId : undefined}
        onPointerEnter={(e) => { if (e.pointerType === "mouse") open("hover"); }}
        onClick={() => (card === "open" ? walkOut(x) : open("open"))}
      >
        <WalkingCat />
      </button>
    </div>
  );
}

/** A side view of the logo's cat: black, with the logo's closed happy eye and little smile, tail up. */
function WalkingCat() {
  return (
    <svg viewBox="0 0 120 92" width="88" height="68" aria-hidden="true" focusable="false">
      <g className="stroll__tail"><path d="M30 52C14 50 6 36 10 22C12 14 20 10 25 14" fill="none" stroke="currentColor" strokeWidth="7" strokeLinecap="round" /></g>
      <g className="stroll__legs stroll__legs--a">
        <path d="M38 58V84M74 58V84" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
      </g>
      <g className="stroll__legs stroll__legs--b">
        <path d="M48 58V84M84 58V84" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
      </g>
      <g className="stroll__body">
        <ellipse cx="60" cy="52" rx="32" ry="16" fill="currentColor" />
        <g className="stroll__head">
          <path d="M80 30L82 10L92 21Q97 19 102 21L111 10L112 31Q114 46 97 49Q82 50 80 38Z" fill="currentColor" />
          <path d="M85 16L86 22L90 21Z" fill="var(--gn-bg, #fff)" />
          <path d="M91 31Q94 28 97 31M102 31Q105 28 108 31" fill="none" stroke="var(--gn-bg, #fff)" strokeWidth="2" strokeLinecap="round" />
          <path d="M97 38Q100 41 103 38Q106 41 109 38" fill="none" stroke="var(--gn-bg, #fff)" strokeWidth="1.8" strokeLinecap="round" />
        </g>
      </g>
    </svg>
  );
}
