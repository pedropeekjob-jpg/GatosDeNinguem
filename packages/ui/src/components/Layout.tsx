import type { ElementType, ReactNode } from "react";
import { cx } from "../cx";

export function Container({ children, narrow }: { children: ReactNode; narrow?: boolean }) {
  return <div className={cx("gn-container", narrow && "gn-container--narrow")}>{children}</div>;
}

export function Stack({ children, gap = "m", as: As = "div" }: { children: ReactNode; gap?: "s" | "m" | "l"; as?: ElementType }) {
  return <As className={`gn-stack gn-stack--${gap}`}>{children}</As>;
}

/** Responsive grid: as many columns as fit at the given minimum width. */
export function Grid({ children, min = "18rem" }: { children: ReactNode; min?: string }) {
  return <div className="gn-grid" style={{ ["--gn-grid-min" as string]: min }}>{children}</div>;
}

export function Section({ id, heading, intro, children, tone }: { id?: string; heading?: ReactNode; intro?: ReactNode; children?: ReactNode; tone?: "plain" | "soft" | "ink" }) {
  return (
    <section id={id} className={cx("gn-section", tone === "soft" && "gn-section--soft", tone === "ink" && "gn-section--ink")}>
      <Container>
        <div className="gn-stack gn-stack--m">
          {heading ? <h2 className="gn-section__heading">{heading}</h2> : null}
          {intro ? <p className="gn-lead">{intro}</p> : null}
          {children}
        </div>
      </Container>
    </section>
  );
}

export function StatTile({ value, label }: { value: ReactNode; label: ReactNode }) {
  return (
    <div className="gn-stat">
      <span className="gn-stat__value">{value}</span>
      <span className="gn-stat__label">{label}</span>
    </div>
  );
}
