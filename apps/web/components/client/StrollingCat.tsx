"use client";
import { useEffect, useId, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { ageLabel } from "@gn/domain";
import { Button } from "@gn/ui";
import { nextWalkIn, pickCat, STROLL_QUIET, type StrollState } from "@/lib/passeio";
import { QUIET_PAGES, type NewCat } from "./CatAlerts";
import sprites from "../../public/gato/acoes.json";

const VISIT_KEY = "gn-passeio";
const LAST_KEY = "gn-passeio-ultimo";
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
type Action = keyof typeof sprites.actions;
/**
 * The cat is the logo's cat in 3D, drawn beforehand into one strip of frames per action (public/gato, made by
 * scripts/gato-3d). Walking, its paws move one stride (STRIDE of the frame's width) per loop of the walk strip, so
 * the walk across the screen keeps that pace and the paws do not slide; it leaves a little faster than it came.
 */
const STRIDE = 0.124;
const OUT_PACE = 1.3;
const ms = (a: Action) => sprites.actions[a].seconds * 1000;
/** How long it lies purring if nobody comes. */
const LIE_MS = 40_000;
/** Width of the cat on screen (matches .stroll in globals.css), so it starts and ends just off screen. */
const OFF = 176;
/** How long the runner takes to roll out (matches .stroll-rug in globals.css). */
const RUG_MS = 650;
/** `?gato=agora` sends a cat out at once, on any page: to try it on test sites and the demo. */
const isPreview = () => new URLSearchParams(window.location.search).get("gato") === "agora";

/** in: walking in; bonk: rubs its head on the glass; turn: turns round on the spot; lie: lies down; purr: lies purring; stand: stays up while its card is open; rise: gets up; leaving: one more rub, turning to go; out: walking away. */
type Phase = "away" | "in" | "bonk" | "turn" | "lie" | "purr" | "stand" | "rise" | "leaving" | "out";

/** This visit (sessionStorage, so "Agora não" lasts until the browser tab is closed) and the last cat shown. */
function readState(): StrollState & { lastSlug?: string } {
  let visit: Partial<StrollState> = {};
  let lastSlug: string | undefined;
  try {
    visit = JSON.parse(sessionStorage.getItem(VISIT_KEY) ?? "{}");
    lastSlug = localStorage.getItem(LAST_KEY) ?? undefined;
  } catch { /* private mode: every visit starts afresh */ }
  const state = { visitStart: visit.visitStart ?? Date.now(), lastWalk: visit.lastWalk, declined: visit.declined, lastSlug };
  if (!visit.visitStart) saveVisit({});
  return state;
}

function saveVisit(changes: Partial<StrollState>) {
  try {
    const visit = JSON.parse(sessionStorage.getItem(VISIT_KEY) ?? "{}");
    sessionStorage.setItem(VISIT_KEY, JSON.stringify({ visitStart: Date.now(), ...visit, ...changes }));
  } catch { /* private mode */ }
}

/**
 * Now and then (see lib/passeio.ts) the logo's cat walks in from the right into the bottom right corner of the
 * screen, rubs its head against the glass as against our legs, turns round on the spot, lies down and purrs, with the name of
 * a real cat waiting for a family. Tapping it, or pointing at it with a mouse, opens that cat's card; when the card
 * goes, the cat gets up, rubs its head on the glass once more and leaves the way it came. If nobody comes, it does the
 * same after a while. It stays under every window, never shows while someone types or on pages where people need
 * to concentrate, and never for people who asked their device for less motion.
 */
export function StrollingCat({ cats, everySeconds }: { cats: NewCat[]; everySeconds?: number }) {
  const pathname = usePathname();
  const [cat, setCat] = useState<NewCat>();
  const [phase, setPhase] = useState<Phase>("away");
  const [x, setX] = useState(-OFF);
  const [dur, setDur] = useState(0);
  /** The white runner it walks in on: how wide (px) and whether it is rolled out. */
  const [rug, setRug] = useState({ width: 0, open: false });
  const [card, setCard] = useState<"closed" | "hover" | "open">("closed");
  const box = useRef<HTMLDivElement>(null);
  const cardId = useId();
  const previewed = useRef(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const later = (fn: () => void, wait: number) => { timers.current.push(setTimeout(fn, wait)); };
  const clear = () => { timers.current.forEach(clearTimeout); timers.current = []; };

  const walkTo = (to: number, from: number, pace = 1) => {
    const width = box.current?.offsetWidth || OFF;
    const speed = (STRIDE * width * pace) / sprites.actions.walk.seconds;
    const duration = Math.round((Math.abs(to - from) / speed) * 1000);
    setDur(duration);
    setX(to);
    return duration;
  };

  /** Where it is right now (it may be halfway through a walk), and stop it there. */
  const halt = () => {
    const el = box.current;
    const here = Math.round(el ? new DOMMatrixReadOnly(getComputedStyle(el).transform).m41 : x);
    setDur(0);
    setX(here);
    return here;
  };

  /** Gets up if lying, rubs its head on the glass once more and goes back out to the right. */
  const leave = (lying: boolean) => {
    clear();
    setCard("closed");
    const here = halt();
    const out = () => {
      setPhase("out");
      const d = walkTo(window.innerWidth + 20, here, OUT_PACE);
      // once it is gone, the runner rolls back up
      later(() => {
        setRug((r) => ({ ...r, open: false }));
        later(() => { saveVisit({ lastWalk: Date.now() }); setPhase("away"); setCat(undefined); setDur(0); }, RUG_MS);
      }, d + 100);
    };
    const bonkThenOut = () => { setPhase("leaving"); later(out, ms("leave")); };
    if (lying) { setPhase("rise"); later(bonkThenOut, ms("lie")); } else bonkThenOut();
  };

  // Schedules the next visit; checked again on every page change.
  useEffect(() => {
    if (phase !== "away" || !cats.length) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // ?gato=agora: the first one at once, then as usual
    const preview = isPreview() && !previewed.current;
    const state = readState();
    const wait = preview ? 500 : nextWalkIn(state, Date.now(), everySeconds ? everySeconds * 1000 : undefined);
    if (wait === null) return;
    const quiet = () => QUIET_PAGES.some((r) => r.test(window.location.pathname)) || STROLL_QUIET.some((r) => r.test(window.location.pathname));
    const busy = () => !!document.querySelector("dialog[open]") || /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName ?? "") || document.visibilityState !== "visible";
    let timer: ReturnType<typeof setTimeout>;
    const start = () => {
      if (!preview && (quiet() || busy())) { timer = setTimeout(start, 10_000); return; }
      const next = pickCat(cats, state.lastSlug);
      if (!next) return;
      previewed.current = true;
      // counted from now too, in case the page is closed while it is out
      saveVisit({ lastWalk: Date.now() });
      try { localStorage.setItem(LAST_KEY, next.slug); } catch { /* private mode */ }
      // Its pictures first (fetched only now), so it never walks in half drawn; standing is rare, so it comes later.
      Promise.all(Object.keys(sprites.actions).filter((a) => a !== "stand").map((a) => {
        const img = new Image();
        img.src = `${BASE}/gato/${a}.webp`;
        return img.decode().catch(() => undefined);
      })).then(() => {
        if (gone) return;
        setCat(next);
        setPhase("in");
        setDur(0);
        const enter = window.innerWidth + 20;
        setX(enter);
        // Next frame: a white runner rolls out into the bottom right corner; then the cat walks in on it, rubs its
        // head on the screen, turns round, lies down and purrs.
        later(() => {
          const width = box.current?.offsetWidth || OFF;
          const stop = Math.round(window.innerWidth - width - (window.innerWidth < 640 ? 4 : 24));
          setRug({ width: window.innerWidth - stop, open: true });
          later(() => {
          const d = walkTo(stop, enter);
          later(() => {
            setPhase("bonk");
            later(() => {
              setPhase("turn");
              later(() => {
                setPhase("lie");
                later(() => { setPhase("purr"); later(() => leave(true), LIE_MS); }, ms("lie"));
              }, ms("turn"));
            }, ms("bonk"));
          }, d);
          }, RUG_MS);
        }, 50);
      });
    };
    let gone = false;
    timer = setTimeout(start, wait);
    return () => { gone = true; clearTimeout(timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, phase, cats, everySeconds]);

  // While its card is open the cat stays where it is (lying, or standing); Escape closes the card.
  useEffect(() => {
    if (card === "closed") return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") leave(phase === "lie" || phase === "purr"); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card, phase]);

  if (!cat || phase === "away") return null;
  const runner = <div className={`stroll-rug${rug.open ? " stroll-rug--open" : ""}`} style={{ width: rug.width }} aria-hidden="true" />;
  const female = cat.sex === "femea";
  const name = cat.name;
  const action = ({ in: "walk", out: "walk", turn: "turn", bonk: "bonk", leaving: "leave", lie: "lie", purr: "purr", stand: "stand", rise: "lie" } as const)[phase];
  const { frames, seconds, loop } = sprites.actions[action];
  const lying = phase === "lie" || phase === "purr";
  const sprite = {
    backgroundImage: `url(${BASE}/gato/${action}.webp)`,
    backgroundSize: `${frames * 100}% 100%`,
    animation: `stroll-frames ${phase === "out" ? seconds / OUT_PACE : seconds}s steps(${frames}, jump-none) ${loop ? "infinite" : "1 both"}${phase === "rise" ? " reverse" : ""}`,
  };
  const settled = phase === "bonk" || phase === "turn" || lying || phase === "stand";
  const open = (how: "hover" | "open") => {
    if (phase === "out" || phase === "leaving" || phase === "rise") return;
    clear();
    if (!lying && phase !== "stand") { halt(); setPhase("stand"); }
    setCard((c) => (c === "open" ? c : how));
  };
  const close = () => leave(lying);
  const notNow = () => {
    saveVisit({ declined: true });
    close();
  };

  return (
    <>
    {runner}
    <div
      ref={box}
      className={`stroll stroll--${phase}`}
      style={{ transform: `translateX(${x}px)`, transitionDuration: `${dur}ms` }}
      onPointerLeave={(e) => { if (e.pointerType === "mouse" && card === "hover") later(close, 600); }}
      onPointerEnter={(e) => { if (e.pointerType === "mouse" && card === "hover") clear(); }}
    >
      {card !== "closed" ? (
        <div className="stroll__card" id={cardId} role="dialog" aria-label={`${name}, para adoção`}>
          <img className="stroll__photo" src={cat.photo.url} alt={cat.photo.alt} />
          <div className="stroll__info">
            <p className="stroll__name">{name}</p>
            <p className="stroll__meta">{ageLabel(cat.ageYears)} · {female ? "Fêmea" : "Macho"}</p>
            <p className="stroll__summary">{cat.summary}</p>
            <Button href={`/adotar/${cat.slug}`} block onClick={close}>Conhecer {female ? "a" : "o"} {name}</Button>
            <button type="button" className="stroll__later" onClick={notNow}>Agora não</button>
          </div>
          <button type="button" className="stroll__close" aria-label="Fechar" onClick={close}>×</button>
        </div>
      ) : settled ? (
        <p className="stroll__bubble" aria-hidden="true">Olá, sou {female ? "a" : "o"} {name}</p>
      ) : null}
      <button
        type="button"
        className="stroll__cat"
        aria-label={`Olá, sou ${female ? "a" : "o"} ${name} e procuro família. Ver ${female ? "a" : "o"} ${name}`}
        aria-expanded={card !== "closed"}
        aria-controls={card !== "closed" ? cardId : undefined}
        onPointerEnter={(e) => { if (e.pointerType === "mouse") open("hover"); }}
        onClick={() => (card === "open" ? close() : open("open"))}
      >
        <span key={phase} className="stroll__sprite" style={sprite} />
      </button>
    </div>
    </>
  );
}
