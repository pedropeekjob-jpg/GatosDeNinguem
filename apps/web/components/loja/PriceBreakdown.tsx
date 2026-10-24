import { euros, forTheCatsCents, type Product } from "@gn/domain";

/** Where the money of one article goes, as a bar and in words. */
export function PriceBreakdown({ product }: { product: Product }) {
  const cats = forTheCatsCents(product);
  const cost = product.priceCents - cats;
  const share = Math.round((cats / product.priceCents) * 100);
  return (
    <div className="price-split">
      <div className="price-split__bar" aria-hidden="true">
        <span className="price-split__cats" style={{ width: `${share}%` }} />
      </div>
      {cost > 0 ? (
        <p>Dos <strong>{euros(product.priceCents)}</strong>, <strong>{euros(cats)}</strong> vão para os gatos. Os outros {euros(cost)} pagam o que custou fazer o artigo.</p>
      ) : (
        <p>Foi oferecido à loja: os <strong>{euros(product.priceCents)}</strong> vão todos para os gatos.</p>
      )}
    </div>
  );
}
