import type { ReactNode } from "react";
import type { Tone } from "./Badge";

export function Notice({ tone = "info", title, children }: { tone?: Exclude<Tone, "neutral">; title: ReactNode; children?: ReactNode }) {
  return (
    <div className={`gn-notice gn-notice--${tone}`} role={tone === "error" ? "alert" : "status"}>
      <p className="gn-notice__title">{title}</p>
      {children ? <div>{children}</div> : null}
    </div>
  );
}

export function ProgressMeter({ label, value, max, valueText }: { label: string; value: number; max: number; valueText?: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="gn-progress">
      <div className="gn-progress__label">
        <span aria-hidden="true">{label}</span>
        <span>{valueText ?? `${value} de ${max}`}</span>
      </div>
      <div
        className="gn-progress__track"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={valueText ?? `${value} de ${max}`}
      >
        <span className="gn-progress__fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
