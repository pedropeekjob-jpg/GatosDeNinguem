"use client";
import { useEffect, useRef } from "react";
import { AnimatedLogo } from "@gn/ui";

/**
 * The logo's cat as a faint backdrop the full width of the screen, always moving (the looping animation), and
 * scrolling slower than the page (parallax). Purely decorative, hidden from screen readers. People who ask their
 * device for less motion get a still logo that scrolls with the page.
 */
export function ParallaxLogo() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      el.style.setProperty("--parallax", `${Math.round(window.scrollY * 0.45)}px`);
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); cancelAnimationFrame(frame); };
  }, []);
  return (
    <div className="about-bg" aria-hidden="true">
      <div ref={ref} className="about-bg__logo"><AnimatedLogo variant="loader" size={1200} label="" /></div>
    </div>
  );
}
