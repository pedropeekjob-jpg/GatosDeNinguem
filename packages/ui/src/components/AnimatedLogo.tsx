"use client";
import { useEffect, useRef } from "react";
import { cx } from "../cx";
import { LOGO_CAT, LOGO_LETTERS, LOGO_O, LOGO_TRANSFORM, LOGO_VIEWBOX } from "./logoPaths";

/**
 * The association's logo, animated: the cat comes out from behind the lettering
 * playing with a ball of yarn, sits down in its place and flicks the ball, which
 * lands as the "O" of "Gatos". `intro` plays once when the logo scrolls into
 * view; `loader` loops while something loads. People who ask their device for
 * less motion just see the still logo.
 */
export function AnimatedLogo({ variant = "intro", label = variant === "loader" ? "A carregar…" : "Gatos de Ninguém", size = 160, className }: {
  variant?: "intro" | "loader"; label?: string; size?: number; className?: string;
}) {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const svg = ref.current;
    if (!svg || variant !== "intro") return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    // Hold on the first frame until the logo is actually on screen.
    svg.dataset.armed = "";
    if (typeof IntersectionObserver === "undefined") { svg.dataset.play = ""; return; }
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) { svg.dataset.play = ""; io.disconnect(); }
    }, { threshold: 0.5 });
    io.observe(svg);
    return () => io.disconnect();
  }, [variant]);

  const art = (
    <svg ref={ref} className={cx("gn-alogo", `gn-alogo--${variant}`, variant === "intro" && className)}
      viewBox={LOGO_VIEWBOX} width={size} height={Math.round((size * 1234) / 1185)}
      role={variant === "intro" ? "img" : undefined} aria-label={variant === "intro" ? label : undefined}
      aria-hidden={variant === "loader" ? true : undefined} focusable="false">
      <g className="gn-alogo__cat"><g transform={LOGO_TRANSFORM}><path d={LOGO_CAT} /></g></g>
      <g className="gn-alogo__letters"><g transform={LOGO_TRANSFORM}>{LOGO_LETTERS.map((d, i) => <path key={i} d={d} />)}</g></g>
      <g className="gn-alogo__o"><g transform={LOGO_TRANSFORM}><path d={LOGO_O} /></g></g>
      <g className="gn-alogo__ball">
        <g className="gn-alogo__yarn">
          <circle r="58" />
          <path d="M-41-32Q0-62 41-37M-54 3Q0-32 54-3M-41 39Q0 8 41 31" fill="none" className="gn-alogo__strand" />
        </g>
      </g>
    </svg>
  );

  if (variant === "intro") return art;
  return (
    <div className={cx("gn-loader", className)} role="status">
      {art}
      <span className="gn-sr-only">{label}</span>
    </div>
  );
}
