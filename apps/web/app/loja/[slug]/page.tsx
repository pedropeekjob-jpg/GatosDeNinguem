import { notFound } from "next/navigation";
import { euros, productCategoryLabel } from "@gn/domain";
import { Breadcrumbs, Container, ShareBar } from "@gn/ui";
import { JsonLd } from "@/components/JsonLd";
import { AddToCart } from "@/components/loja/AddToCart";
import { CartBar } from "@/components/loja/CartBar";
import { PriceBreakdown } from "@/components/loja/PriceBreakdown";
import { getProduct, getSeoSettings, listProducts } from "@/lib/content";
import { buildMetadata } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  // Pre-rendering is only a speed-up: if the API is down, the pages are built on request instead.
  return (await listProducts().catch(() => [])).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props) {
  const p = await getProduct((await params).slug);
  if (!p) return {};
  return buildMetadata({ path: `/loja/${p.slug}`, title: `${p.name}, loja solidária`, description: `${euros(p.priceCents)}. ${p.description}`.slice(0, 160), image: p.photos[0]?.url });
}

export default async function ProductPage({ params }: Props) {
  const product = await getProduct((await params).slug);
  if (!product) notFound();
  const settings = await getSeoSettings();
  const photo = product.photos[0]!;
  const url = `${settings.siteUrl}/loja/${product.slug}`;
  return (
    <Container>
      <div className="page-hero">
        <Breadcrumbs items={[{ href: "/", label: "Início" }, { href: "/loja", label: "Loja solidária" }, { label: product.name }]} />
      </div>
      <CartBar />
      <div className="cat-profile product">
        <div className="gn-stack gn-stack--s">
          <img className="cat-profile__photo" src={photo.url} alt={photo.alt} width={800} height={600} />
          {product.photos.length > 1 ? (
            <div className="product__more">{product.photos.slice(1).map((p) => <img key={p.url} src={p.url} alt={p.alt} width={200} height={150} loading="lazy" />)}</div>
          ) : null}
        </div>
        <div className="gn-stack gn-stack--m">
          <p className="gn-eyebrow">{productCategoryLabel[product.category]}</p>
          <h1>{product.name}</h1>
          <p className="product__price">{euros(product.priceCents)}</p>
          <PriceBreakdown product={product} />
          {product.description ? <p>{product.description}</p> : null}
          <AddToCart product={product} />
          <ShareBar url={url} text={`${product.name}: cada compra ajuda os gatos da Gatos de Ninguém`} />
        </div>
      </div>
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.name,
        description: product.description,
        image: photo.url.startsWith("/") ? `${settings.siteUrl}${photo.url}` : photo.url,
        offers: { "@type": "Offer", price: (product.priceCents / 100).toFixed(2), priceCurrency: "EUR", url },
      }} />
    </Container>
  );
}
