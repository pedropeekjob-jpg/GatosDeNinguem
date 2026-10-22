"use client";
import { useEffect, useId, useMemo, useRef } from "react";
import { cx } from "../cx";
import { animatedLogoSvg } from "./logoRig";

/**
 * The association's logo with the cat brought to life (see logoRig.ts): `intro` plays once when the logo
 * scrolls into view, `loader` loops while something loads. People who ask their device for less motion
 * just see the still logo. The same SVG is published as /logo-animado.svg and /logo-a-carregar.svg.
 */
export function AnimatedLogo({ variant = "intro", label = variant === "loader" ? "A carregar…" : "Gatos de Ninguém", size = 160, className }: {
  variant?: "intro" | "loader"; label?: string; size?: number; className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const id = "gnc" + useId().replace(/[^a-zA-Z0-9]/g, "");
  const svg = useMemo(
    () => animatedLogoSvg({ variant, id, label: variant === "intro" ? label : undefined, armed: variant === "intro", width: size, height: Math.round((size * 1234) / 1185) }),
    [variant, id, label, size],
  );

  useEffect(() => {
    const el = ref.current?.querySelector("svg");
    if (!el || variant !== "intro") return;
    if (typeof IntersectionObserver === "undefined") { el.setAttribute("data-play", ""); return; }
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) { el.setAttribute("data-play", ""); io.disconnect(); }
    }, { threshold: 0.5 });
    io.observe(el);
    return () => io.disconnect();
  }, [variant, svg]);

  const art = <span ref={ref} className={cx("gn-alogo", variant === "intro" && className)} dangerouslySetInnerHTML={{ __html: svg }} />;
  if (variant === "intro") return art;
  return (
    <div className={cx("gn-loader", className)} role="status">
      {art}
      <span className="gn-sr-only">{label}</span>
    </div>
  );
}
