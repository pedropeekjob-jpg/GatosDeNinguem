"use client";
import { useCallback, useEffect, useRef, useState } from "react";

export interface CarouselSlide { src: string; alt: string; caption?: string }

interface CarouselProps {
  slides: CarouselSlide[];
  /** Accessible name, e.g. "Fotografias do gatil". */
  label: string;
  /** Move on by itself. Never happens for people who ask their device for reduced motion. */
  autoplay?: boolean;
  intervalSeconds?: number;
}

const reducedMotion = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/**
 * Full-width photo carousel. Built on native horizontal scrolling with snap points, so it
 * still works by swiping (or scrolling) without JavaScript; buttons and autoplay are an extra.
 */
export function Carousel({ slides, label, autoplay = false, intervalSeconds = 6 }: CarouselProps) {
  const track = useRef<HTMLUListElement>(null);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [held, setHeld] = useState(false); // pointer over it or keyboard focus inside: never move under someone's hand
  const count = slides.length;

  useEffect(() => { setPlaying(autoplay && count > 1 && !reducedMotion()); }, [autoplay, count]);

  const go = useCallback((to: number) => {
    const el = track.current;
    if (!el || !count) return;
    const i = (to + count) % count;
    el.scrollTo?.({ left: i * el.clientWidth, behavior: reducedMotion() ? "auto" : "smooth" });
    setIndex(i);
  }, [count]);

  useEffect(() => {
    if (!playing || held) return;
    const t = window.setInterval(() => { if (!document.hidden) go(index + 1); }, intervalSeconds * 1000);
    return () => window.clearInterval(t);
  }, [playing, held, index, intervalSeconds, go]);

  function onScroll() {
    const el = track.current;
    if (el && el.clientWidth) setIndex(Math.round(el.scrollLeft / el.clientWidth));
  }

  if (!count) return null;
  return (
    <section
      className="gn-carousel"
      aria-roledescription="carrossel"
      aria-label={label}
      onPointerEnter={() => setHeld(true)}
      onPointerLeave={() => setHeld(false)}
      onFocus={() => setHeld(true)}
      onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setHeld(false); }}
    >
      {/* Focusable so the photos can be scrolled with the arrow keys. */}
      <ul ref={track} className="gn-carousel__track" onScroll={onScroll} tabIndex={0} aria-label="Fotografias">
        {slides.map((s, i) => (
          <li key={`${s.src}-${i}`} className={i === index ? "gn-carousel__slide is-active" : "gn-carousel__slide"} aria-roledescription="diapositivo" aria-label={`${i + 1} de ${count}`} aria-hidden={i !== index ? true : undefined}>
            <img src={s.src} alt={s.alt} loading={i === 0 ? "eager" : "lazy"} />
            {s.caption ? <p className="gn-carousel__caption">{s.caption}</p> : null}
          </li>
        ))}
      </ul>
      {count > 1 ? (
        <div className="gn-carousel__controls">
          <button type="button" className="gn-carousel__btn" onClick={() => go(index - 1)} aria-label="Fotografia anterior">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
          </button>
          <span className="gn-carousel__count" aria-live={playing ? "off" : "polite"}>{index + 1} / {count}</span>
          <button type="button" className="gn-carousel__btn" onClick={() => go(index + 1)} aria-label="Fotografia seguinte">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
          </button>
          {autoplay ? (
            <button type="button" className="gn-carousel__btn" onClick={() => setPlaying(!playing)} aria-label={playing ? "Parar a passagem automática" : "Passar automaticamente"}>
              {playing
                ? <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6v12M15 6v12" /></svg>
                : <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5l11 7-11 7z" fill="currentColor" /></svg>}
            </button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
