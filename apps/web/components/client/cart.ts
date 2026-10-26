"use client";
import { useCallback, useEffect, useState } from "react";

/** One chosen gift. The minimum and name are a snapshot for display; the server checks the minimum again. */
export type CartLine = { productId: string; slug: string; name: string; variant?: string; unitMinDonationCents: number; photo: string; quantity: number };

const KEY = "gn-cesto";
const EVENT = "gn-cesto-change";
const sameLine = (a: Pick<CartLine, "productId" | "variant">, b: Pick<CartLine, "productId" | "variant">) => a.productId === b.productId && a.variant === b.variant;

function read(): CartLine[] {
  try {
    const raw = localStorage.getItem(KEY);
    // Baskets saved when the shop had prices keep working: the price became the minimum donation.
    return raw ? (JSON.parse(raw) as (CartLine & { unitPriceCents?: number })[]).map(({ unitPriceCents, ...l }) => ({ ...l, unitMinDonationCents: l.unitMinDonationCents ?? unitPriceCents ?? 0 })) : [];
  } catch {
    return [];
  }
}

function write(lines: CartLine[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(lines));
  } catch { /* storage unavailable: the choice lasts until the page closes */ }
  window.dispatchEvent(new Event(EVENT));
}

/** The gifts chosen in the shop, kept on this device only (no account needed). */
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
    minDonationCents: lines.reduce((n, l) => n + l.unitMinDonationCents * l.quantity, 0),
    add,
    setQuantity,
    clear,
  };
}
