"use client";
import { useEffect, useRef } from "react";
import { AnimatedLogo } from "@gn/ui";

const REPLAY_MS = 9_000;

/**
 * The logo's cat as a faint backdrop behind a section: the long animation (the cat leaps out from behind the
 * association's name), replayed every few seconds while it is on screen, and scrolling slower than the page
 * (parallax). Purely decorative, hidden from screen readers. People who ask their device for less motion get the
 * still logo, scrolling with the page.
 */
export function ParallaxLogo() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    const box = el?.parentElement;
    if (!el || !box || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      // Centred when the section is centred on screen; drifts at a third of the scroll speed either side.
      // Never further than the free space above or below it, so the whole cat stays inside the block.
      const r = box.getBoundingClientRect();
      const room = Math.max(0, (r.height - el.offsetHeight) / 2);
      const shift = (window.innerHeight / 2 - (r.top + r.height / 2)) * 0.3;
      el.style.setProperty("--parallax", `${Math.round(Math.max(-room, Math.min(room, shift)))}px`);
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    // AnimatedLogo plays the intro once when it comes into view; start it again from the top while it stays visible.
    let visible = false;
    const io = new IntersectionObserver((entries) => { visible = entries.some((e) => e.isIntersecting); });
    io.observe(el);
    const replay = setInterval(() => {
      const svg = el.querySelector("svg");
      if (!visible || !svg?.hasAttribute("data-play")) return;
      for (const a of svg.getAnimations({ subtree: true })) { a.currentTime = 0; a.play(); }
    }, REPLAY_MS);
    return () => { window.removeEventListener("scroll", onScroll); cancelAnimationFrame(frame); io.disconnect(); clearInterval(replay); };
  }, []);
  return (
    <div className="story-bg" aria-hidden="true">
      <div ref={ref} className="story-bg__logo"><AnimatedLogo size={1000} label="" /></div>
    </div>
  );
}
