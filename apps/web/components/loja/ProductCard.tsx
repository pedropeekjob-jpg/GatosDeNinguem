import { LOW_STOCK, stockOf, type Product } from "@gn/domain";
import { Badge, Card } from "@gn/ui";
import { localizeProduct } from "@/lib/i18n/content";
import { i18n } from "@/lib/i18n/server";

/** Photo-first, like the cat cards: the picture and the name. No prices: the site only shows what waits at the shop. */
export function ProductCard({ product: original }: { product: Product }) {
  const { lang, t, l } = i18n();
  const product = localizeProduct(original, lang);
  const photo = product.photos[0]!;
  const left = stockOf(product);
  return (
    <Card
      className="cat-card product-card"
      title={product.name}
      href={l(`/loja/${product.slug}`)}
      media={{ src: photo.url, alt: photo.alt }}
      badges={
        left === 0 || left <= LOW_STOCK || product.donated ? (
          <>
            {left === 0
              ? <Badge tone="neutral">{t({ pt: "Esgotado", en: "Sold out", es: "Agotado", fr: "Épuisé" })}</Badge>
              : left <= LOW_STOCK ? <Badge tone="warning">{left === 1 ? t({ pt: "Só resta 1", en: "Only 1 left", es: "Solo queda 1", fr: "Plus qu’un" }) : t({ pt: `Restam ${left}`, en: `${left} left`, es: `Quedan ${left}`, fr: `Plus que ${left}` })}</Badge> : null}
            {product.donated ? <Badge tone="info">{t({ pt: "Oferecido por alguém", en: "Given by someone", es: "Donado por alguien", fr: "Offert par quelqu’un" })}</Badge> : null}
          </>
        ) : undefined
      }
    />
  );
}
