import { LOW_STOCK, stockOf, type Product } from "@gn/domain";
import { Badge, Card } from "@gn/ui";

/** Photo-first, like the cat cards: the picture and the name. No prices: the site only shows what waits at the shop. */
export function ProductCard({ product }: { product: Product }) {
  const photo = product.photos[0]!;
  const left = stockOf(product);
  return (
    <Card
      className="cat-card product-card"
      title={product.name}
      href={`/loja/${product.slug}`}
      media={{ src: photo.url, alt: photo.alt }}
      badges={
        left === 0 || left <= LOW_STOCK || product.donated ? (
          <>
            {left === 0 ? <Badge tone="neutral">Esgotado</Badge> : left <= LOW_STOCK ? <Badge tone="warning">{left === 1 ? "Só resta 1" : `Restam ${left}`}</Badge> : null}
            {product.donated ? <Badge tone="info">Oferecido por alguém</Badge> : null}
          </>
        ) : undefined
      }
    />
  );
}
