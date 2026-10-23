"use client";
import { useEffect, useState, type ReactNode } from "react";
import { Button, Modal } from "@gn/ui";

/**
 * A big button that opens a form in a window over the page, so the page stays short and calm.
 * With `href`, the button is a real link to a page with the same form, for when scripts are off.
 * The phone's Back button closes the window instead of leaving the page.
 */
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

export function FormModal({
  label, title, intro, href, variant = "primary", block, children,
}: { label: string; title: string; intro?: ReactNode; href?: string; variant?: "primary" | "secondary"; block?: boolean; children: ReactNode }) {
  const modal = useModalHistory();
  const trigger = href ? (
    <Button href={href} variant={variant} block={block} role="button" onClick={(e) => { e.preventDefault(); modal.show(); }}>{label}</Button>
  ) : (
    <Button variant={variant} block={block} aria-haspopup="dialog" onClick={modal.show}>{label}</Button>
  );
  return (
    <>
      {trigger}
      <Modal open={modal.open} onClose={modal.hide} title={title} intro={intro}>{children}</Modal>
    </>
  );
}
