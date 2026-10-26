import { notFound } from "next/navigation";
import { productCategoryLabel, stockOf } from "@gn/domain";
import { Breadcrumbs, Container, Notice, ShareBar } from "@gn/ui";
import { JsonLd } from "@/components/JsonLd";
import { ShopVisit } from "@/components/loja/ShopVisit";
import { getProduct, getSeoSettings, getShopSummary, listProducts } from "@/lib/content";
import { buildMetadata } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  // Pre-rendering is only a speed-up: if the API is down, the pages are built on request instead.
  return (await listProducts().catch(() => [])).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props) {
  const p = await getProduct((await params).slug);
  if (!p) return {};
  return buildMetadata({ path: `/loja/${p.slug}`, title: `${p.name}, loja solidária`, description: `${p.description} Venha vê-lo à loja solidária da Gatos de Ninguém.`.slice(0, 160), image: p.photos[0]?.url });
}

export default async function ProductPage({ params }: Props) {
  const product = await getProduct((await params).slug);
  if (!product) notFound();
  const [settings, shop] = await Promise.all([getSeoSettings(), getShopSummary()]);
  const photo = product.photos[0]!;
  const url = `${settings.siteUrl}/loja/${product.slug}`;
  return (
    <Container>
      <div className="page-hero">
        <Breadcrumbs items={[{ href: "/", label: "Início" }, { href: "/loja", label: "Loja solidária" }, { label: product.name }]} />
      </div>
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
          {product.description ? <p>{product.description}</p> : null}
          {stockOf(product) === 0 ? <Notice tone="info" title="Esgotado">Já não temos este artigo. Venha ver os outros à loja.</Notice> : null}
          <section className="gn-stack gn-stack--s" aria-labelledby="visite">
            <h2 id="visite">Venha vê-lo à loja</h2>
            <p>Não vendemos pelo site. Este e outros artigos esperam por si na loja solidária, e tudo o que lá se angaria vai para os gatos.</p>
            <ShopVisit settings={shop.settings} />
          </section>
          <ShareBar url={url} text={`${product.name}: está na loja solidária da Gatos de Ninguém`} />
        </div>
      </div>
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.name,
        description: product.description,
        image: photo.url.startsWith("/") ? `${settings.siteUrl}${photo.url}` : photo.url,
        url,
      }} />
    </Container>
  );
}
