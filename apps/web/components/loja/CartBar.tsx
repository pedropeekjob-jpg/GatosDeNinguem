"use client";
import { euros } from "@gn/domain";
import { useCart } from "@/components/client/cart";

/** A reminder of what is in the basket, on every shop page, once something is in it. */
export function CartBar() {
  const cart = useCart();
  if (cart.count === 0) return null;
  return (
    <a className="cart-bar" href="/loja/cesto">
      <span className="cart-bar__icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"><path d="M5 9h14l-1.4 10.2a1 1 0 0 1-1 .8H7.4a1 1 0 0 1-1-.8L5 9z" /><path d="M9 9V7a3 3 0 0 1 6 0v2" /></svg>
      </span>
      <span>{cart.count === 1 ? "1 artigo" : `${cart.count} artigos`} no cesto · {euros(cart.totalCents)}</span>
      <span className="cart-bar__go">Ver o cesto</span>
    </a>
  );
}
