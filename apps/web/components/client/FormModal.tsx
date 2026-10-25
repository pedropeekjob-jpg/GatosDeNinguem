"use client";
import type { ReactNode } from "react";
import { Button, Modal, useModalHistory } from "@gn/ui";

export { useModalHistory };

/**
 * A big button that opens a form in a window over the page, so the page stays short and calm.
 * With `href`, the button is a real link to a page with the same form, for when scripts are off.
 * The phone's Back button closes the window instead of leaving the page.
 */
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
