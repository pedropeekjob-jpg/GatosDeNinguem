import { euros, forTheCatsCents, LOW_STOCK, stockOf, type Product } from "@gn/domain";
import { Badge, Card } from "@gn/ui";

/** Photo-first, like the cat cards: the picture, the name, the minimum donation and how much of it goes to the cats. */
export function ProductCard({ product }: { product: Product }) {
  const photo = product.photos[0]!;
  const left = stockOf(product);
  return (
    <Card
      className="cat-card product-card"
      title={product.name}
      href={`/loja/${product.slug}`}
      media={{ src: photo.url, alt: photo.alt }}
      subtitle={<span className="product-card__price">Donativo a partir de {euros(product.minDonationCents)}</span>}
      badges={
        left === 0 || left <= LOW_STOCK || product.donated ? (
          <>
            {left === 0 ? <Badge tone="neutral">Esgotado</Badge> : left <= LOW_STOCK ? <Badge tone="warning">{left === 1 ? "Só resta 1" : `Restam ${left}`}</Badge> : null}
            {product.donated ? <Badge tone="info">Oferecido por alguém</Badge> : null}
          </>
        ) : undefined
      }
    >
      <p><strong>{euros(forTheCatsCents(product))}</strong> {product.donated ? "vão todos" : "vão"} para os gatos</p>
    </Card>
  );
}
