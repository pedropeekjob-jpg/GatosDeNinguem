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
        <a className="gn-share__icon" href={`https://wa.me/?text=${t}%20${u}`} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" title="WhatsApp">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 3a9 9 0 0 0-7.8 13.5L3 21l4.6-1.2A9 9 0 1 0 12 3zm0 16.4c-1.4 0-2.7-.4-3.9-1.1l-.3-.2-2.7.7.7-2.6-.2-.3A7.4 7.4 0 1 1 12 19.4zm4-5.5c-.2-.1-1.3-.7-1.5-.7-.2-.1-.4-.1-.5.1l-.7.9c-.1.2-.3.2-.5.1a6 6 0 0 1-3-2.6c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.7-1.6c-.2-.4-.4-.4-.5-.4h-.4c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 1.9s.8 2.2.9 2.4c.1.1 1.6 2.5 4 3.5 1.5.6 2 .7 2.8.6.5-.1 1.3-.6 1.5-1.1.2-.5.2-1 .1-1.1l-.5-.3z" /></svg>
        </a>
        <a className="gn-share__icon" href={`https://www.facebook.com/sharer/sharer.php?u=${u}`} target="_blank" rel="noopener noreferrer" aria-label="Facebook" title="Facebook">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M13.5 21v-7.5h2.6l.4-3h-3V8.6c0-.9.3-1.5 1.6-1.5h1.6V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.2H7.9v3h2.6V21h3z" /></svg>
        </a>
        <a className="gn-share__icon" href={`mailto:?subject=${t}&body=${u}`} aria-label="Email" title="Email">
          <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"><rect x="3.5" y="5.5" width="17" height="13" rx="2" /><path d="m4 7 8 6 8-6" /></svg>
        </a>
        <button type="button" className="gn-share__icon" onClick={copy} aria-label={copied ? "Copiado" : "Copiar endereço"} title={copied ? "Copiado" : "Copiar endereço"}>
          {copied ? (
            <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>
          ) : (
            <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1.2 1.2" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1.2-1.2" /></svg>
          )}
        </button>
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
