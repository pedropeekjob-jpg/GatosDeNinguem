"use client";
import { useEffect, useId, useRef, type ReactNode } from "react";

/**
 * A window over the page: full screen on phones, centred on computers.
 * Built on the native <dialog>, so focus stays inside and Esc closes it.
 * Clicking outside does not close it, so a half-filled form is never lost by accident.
 * The content is only mounted while open.
 */
export function Modal({ open, onClose, title, intro, children }: { open: boolean; onClose: () => void; title: string; intro?: ReactNode; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      if (typeof dialog.showModal === "function") dialog.showModal();
      else dialog.setAttribute("open", "");
    }
    if (!open && dialog.open) {
      if (typeof dialog.close === "function") dialog.close();
      else dialog.removeAttribute("open");
    }
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="gn-modal"
      aria-labelledby={titleId}
      onCancel={(e) => { e.preventDefault(); onClose(); }}
    >
      {open ? (
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
