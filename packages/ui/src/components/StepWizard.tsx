"use client";
import type { ReactNode } from "react";
import { Button } from "./Button";
import { useUiText } from "./UiText";

/** One question per screen, with a visible "Passo X de Y" and large back/next buttons. */
export function StepWizard({ step, total, title, children, onBack, onNext, nextLabel, nextDisabled }: {
  step: number; total: number; title: ReactNode; children: ReactNode;
  onBack?: () => void; onNext: () => void; nextLabel?: string; nextDisabled?: boolean;
}) {
  const pct = Math.round((step / total) * 100);
  const text = useUiText();
  return (
    <div className="gn-wizard">
      <p className="gn-wizard__step">{text.step(step, total)}</p>
      <div className="gn-wizard__bar" aria-hidden="true"><span style={{ width: `${pct}%` }} /></div>
      <h2 className="gn-wizard__title">{title}</h2>
      <div>{children}</div>
      <div className="gn-wizard__nav">
        {step > 1 && onBack ? <Button variant="secondary" onClick={onBack}>{text.back}</Button> : <span />}
        <Button onClick={onNext} disabled={nextDisabled}>{nextLabel ?? text.continue}</Button>
      </div>
    </div>
  );
}
