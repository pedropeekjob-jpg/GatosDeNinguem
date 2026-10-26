"use client";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";

/**
 * A window over the page: full screen on phones, centred on computers.
 * Built on the native <dialog>, so focus stays inside and Esc closes it.
 * Clicking outside does not close it, so a half-filled form is never lost by accident.
 * The content is only mounted while open.
 * `sheet`: on phones, a panel that rises from the bottom only as tall as its content (for short offers the
 * visitor did not ask for, which should not take over the whole screen).
 * `bare`: no title bar, only a round close button over the content, which brings its own heading and padding
 * (for a picture-first card). `title` then only names the window for screen readers.
 */
export function Modal({ open, onClose, title, intro, sheet, bare, children }: { open: boolean; onClose: () => void; title: string; intro?: ReactNode; sheet?: boolean; bare?: boolean; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      if (typeof dialog.showModal === "function") dialog.showModal();
      else dialog.setAttribute("open", "");
      // A bare card starts with focus on itself, not on the close button, so no focus ring greets the visitor.
      if (bare) dialog.querySelector<HTMLElement>(".gn-modal__bare")?.focus();
    }
    if (!open && dialog.open) {
      if (typeof dialog.close === "function") dialog.close();
      else dialog.removeAttribute("open");
    }
  }, [open, bare]);

  return (
    <dialog
      ref={ref}
      className={["gn-modal", sheet && "gn-modal--sheet", bare && "gn-modal--bare"].filter(Boolean).join(" ")}
      aria-labelledby={bare ? undefined : titleId}
      aria-label={bare ? title : undefined}
      onCancel={(e) => { e.preventDefault(); onClose(); }}
    >
      {open && bare ? (
        <>
          <button type="button" className="gn-modal__x" onClick={onClose} aria-label="Fechar" title="Fechar">
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /></svg>
          </button>
          <div className="gn-modal__bare" tabIndex={-1}>{children}</div>
        </>
      ) : open ? (
        <>
          <div className="gn-modal__head">
            <h2 id={titleId} className="gn-modal__title">{title}</h2>
            <button type="button" className="gn-modal__close" onClick={onClose}>
              <span aria-hidden="true">✕</span> Fechar
            </button>
          </div>
          <div className="gn-modal__body gn-stack gn-stack--m">
            {intro ? <div className="gn-modal__intro">{intro}</div> : null}
            {children}
          </div>
        </>
      ) : null}
    </dialog>
  );
}

/** Open/close state for a Modal where the phone's Back button closes the window instead of leaving the page. */
export function useModalHistory() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const onPop = () => setOpen(false);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [open]);
  return {
    open,
    show: () => {
      window.history.pushState({ ...window.history.state, gnModal: true }, "");
      setOpen(true);
    },
    hide: () => {
      if (window.history.state?.gnModal) window.history.back();
      else setOpen(false);
    },
  };
}
