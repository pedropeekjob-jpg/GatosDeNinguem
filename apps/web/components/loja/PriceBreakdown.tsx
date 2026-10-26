import { euros, forTheCatsCents, giftCostCents, type Product } from "@gn/domain";

/** Where the minimum donation goes, as a bar and in words. Anything given above it goes to the cats. */
export function PriceBreakdown({ product }: { product: Product }) {
  const cats = forTheCatsCents(product);
  const cost = giftCostCents(product);
  const share = Math.round((cats / product.minDonationCents) * 100);
  return (
    <div className="price-split">
      <div className="price-split__bar" aria-hidden="true">
        <span className="price-split__cats" style={{ width: `${share}%` }} />
      </div>
      {cost > 0 ? (
        <p>A oferta custou-nos <strong>{euros(cost)}</strong>. Tudo o resto do seu donativo vai para os gatos: pelo menos <strong>{euros(cats)}</strong>.</p>
      ) : (
        <p>Alguém nos ofereceu este artigo: o seu donativo vai todo para os gatos.</p>
      )}
    </div>
  );
}
