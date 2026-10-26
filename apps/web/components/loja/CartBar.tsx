"use client";
import { euros } from "@gn/domain";
import { useCart } from "@/components/client/cart";

/** A reminder of the chosen gifts, on every shop page, once there is one. */
export function CartBar() {
  const cart = useCart();
  if (cart.count === 0) return null;
  return (
    <a className="cart-bar" href="/loja/cesto">
      <span className="cart-bar__icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"><rect x="4" y="10" width="16" height="10" rx="1" /><path d="M3 10h18M12 10v10M12 10C10 6 6.5 6 6.5 8S10 10 12 10zm0 0c2-4 5.5-4 5.5-2S14 10 12 10z" /></svg>
      </span>
      <span>{cart.count === 1 ? "1 oferta escolhida" : `${cart.count} ofertas escolhidas`} · donativo a partir de {euros(cart.minDonationCents)}</span>
      <span className="cart-bar__go">Fazer o donativo</span>
    </a>
  );
}
