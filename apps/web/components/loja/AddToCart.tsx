"use client";
import { useState } from "react";
import { stockOf, type Product } from "@gn/domain";
import { Button, ChoiceList, Notice } from "@gn/ui";
import { useCart } from "@/components/client/cart";

/** Size (when there are sizes), how many, and one big button. Then a clear way to the basket. */
export function AddToCart({ product }: { product: Product }) {
  const cart = useCart();
  const sizes = product.variants;
  const firstAvailable = sizes.find((v) => v.stock > 0)?.label;
  const [variant, setVariant] = useState<string | undefined>(firstAvailable);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const left = stockOf(product, sizes.length ? variant : undefined);
  const soldOut = stockOf(product) === 0;
  const max = Math.min(10, left);

  if (soldOut) {
    return <Notice tone="info" title="Esgotado">Este artigo esgotou. Volte mais tarde ou veja os outros artigos da loja.</Notice>;
  }

  return (
    <div className="gn-stack gn-stack--m">
      {sizes.length > 0 ? (
        <ChoiceList
          name="tamanho"
          legend="Tamanho"
          value={variant}
          onChange={(v) => { setVariant(v); setQuantity(1); setAdded(false); }}
          options={sizes.map((v) => ({ value: v.label, label: v.label, hint: v.stock === 0 ? "Esgotado" : v.stock <= 3 ? `Restam ${v.stock}` : undefined }))}
        />
      ) : null}
      <div className="qty" role="group" aria-label="Quantidade">
        <span className="qty__label" aria-hidden="true">Quantidade</span>
        <button type="button" className="qty__btn" onClick={() => setQuantity((q) => Math.max(1, q - 1))} disabled={quantity <= 1} aria-label="Menos um">−</button>
        <output className="qty__value" aria-live="polite" aria-label={`Quantidade: ${quantity}`}>{quantity}</output>
        <button type="button" className="qty__btn" onClick={() => setQuantity((q) => Math.min(max, q + 1))} disabled={quantity >= max} aria-label="Mais um">+</button>
      </div>
      {left === 0 ? <p className="gn-field__error">Este tamanho esgotou. Escolha outro, por favor.</p> : null}
      <Button
        block
        disabled={left === 0 || !cart.ready}
        onClick={() => {
          const photo = product.photos[0]!;
          cart.add({ productId: product.id, slug: product.slug, name: product.name, ...(sizes.length && variant ? { variant } : {}), unitPriceCents: product.priceCents, photo: photo.url, quantity });
          setAdded(true);
        }}
      >
        Pôr no cesto
      </Button>
      {added ? (
        <div role="status" className="gn-stack gn-stack--s">
          <Notice tone="success" title="Está no cesto">Pode continuar a escolher ou fazer já o pedido.</Notice>
          <div className="action-row">
            <Button href="/loja/cesto">Ver o cesto e fazer o pedido</Button>
            <Button href="/loja" variant="secondary">Continuar a ver</Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
