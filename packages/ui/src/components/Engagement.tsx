"use client";
import { useState, type ReactNode } from "react";

/**
 * Share links that work without any third-party script: WhatsApp, Facebook,
 * email and copy-to-clipboard. Content-agnostic: pass any url and text.
 */
export function ShareBar({ url, text, label = "Partilhar" }: { url: string; text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(text);
  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      window.prompt?.("Copie este endereço:", url);
    }
  }
  return (
    <div className="gn-share" role="group" aria-label={label}>
      <p className="gn-share__label">{label}</p>
      <div className="gn-share__buttons">
        <a className="gn-btn gn-btn--secondary" href={`https://wa.me/?text=${t}%20${u}`} target="_blank" rel="noopener noreferrer">WhatsApp</a>
        <a className="gn-btn gn-btn--secondary" href={`https://www.facebook.com/sharer/sharer.php?u=${u}`} target="_blank" rel="noopener noreferrer">Facebook</a>
        <a className="gn-btn gn-btn--secondary" href={`mailto:?subject=${t}&body=${u}`}>Email</a>
        <button type="button" className="gn-btn gn-btn--secondary" onClick={copy}>{copied ? "Copiado ✓" : "Copiar endereço"}</button>
      </div>
      <p className="gn-sr-only" aria-live="polite">{copied ? "Endereço copiado" : ""}</p>
    </div>
  );
}

/** A two-state button with a text label for each state (e.g. "Guardar" / "Guardado"). */
export function ToggleButton({ pressed, onToggle, children, pressedChildren, icon }: {
  pressed: boolean; onToggle: () => void; children: ReactNode; pressedChildren?: ReactNode; icon?: ReactNode;
}) {
  return (
    <button type="button" className="gn-btn gn-btn--secondary gn-toggle" aria-pressed={pressed} onClick={onToggle}>
      {icon ? <span className="gn-btn__icon" aria-hidden="true">{icon}</span> : null}
      <span>{pressed && pressedChildren ? pressedChildren : children}</span>
    </button>
  );
}

/** Thank-you panel that always offers a next step. */
export function NextStep({ title, children, actions }: { title: ReactNode; children?: ReactNode; actions: ReactNode }) {
  return (
    <div className="gn-nextstep" role="status">
      <p className="gn-nextstep__title">{title}</p>
      {children ? <div>{children}</div> : null}
      <div className="gn-nextstep__actions">{actions}</div>
    </div>
  );
}
