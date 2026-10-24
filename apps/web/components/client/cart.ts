"use client";
import { useCallback, useEffect, useState } from "react";

/** One line in the basket. Price and name are a snapshot for display; the order is always priced by the server. */
export type CartLine = { productId: string; slug: string; name: string; variant?: string; unitPriceCents: number; photo: string; quantity: number };

const KEY = "gn-cesto";
const EVENT = "gn-cesto-change";
const sameLine = (a: Pick<CartLine, "productId" | "variant">, b: Pick<CartLine, "productId" | "variant">) => a.productId === b.productId && a.variant === b.variant;

function read(): CartLine[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as CartLine[]) : [];
  } catch {
    return [];
  }
}

function write(lines: CartLine[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(lines));
  } catch { /* storage unavailable: the basket lasts until the page closes */ }
  window.dispatchEvent(new Event(EVENT));
}

/** The shop basket, kept on this device only (no account needed). */
export function useCart() {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setLines(read());
    setReady(true);
    const sync = () => setLines(read());
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  const update = useCallback((next: CartLine[]) => { setLines(next); write(next); }, []);
  const add = useCallback((line: CartLine) => {
    const current = read();
    const existing = current.find((l) => sameLine(l, line));
    update(existing ? current.map((l) => (sameLine(l, line) ? { ...l, quantity: Math.min(10, l.quantity + line.quantity) } : l)) : [...current, line]);
  }, [update]);
  const setQuantity = useCallback((line: Pick<CartLine, "productId" | "variant">, quantity: number) => {
    const current = read();
    update(quantity <= 0 ? current.filter((l) => !sameLine(l, line)) : current.map((l) => (sameLine(l, line) ? { ...l, quantity: Math.min(10, quantity) } : l)));
  }, [update]);
  const clear = useCallback(() => update([]), [update]);
  return {
    lines,
    ready,
    count: lines.reduce((n, l) => n + l.quantity, 0),
    totalCents: lines.reduce((n, l) => n + l.unitPriceCents * l.quantity, 0),
    add,
    setQuantity,
    clear,
  };
}
