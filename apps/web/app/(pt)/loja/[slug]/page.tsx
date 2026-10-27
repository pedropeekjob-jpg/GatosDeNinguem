import { notFound } from "next/navigation";
import { stockOf } from "@gn/domain";
import { Breadcrumbs, Container, Notice, ShareBar } from "@gn/ui";
import { JsonLd } from "@/components/JsonLd";
import { ShopVisit } from "@/components/loja/ShopVisit";
import { getProduct, getSeoSettings, getShopSummary, listProducts } from "@/lib/content";
import { localize } from "@/lib/i18n/config";
import { localizeProduct } from "@/lib/i18n/content";
import { crumbs, productCategoryLabel } from "@/lib/i18n/labels";
import { langFrom, type LangProps } from "@/lib/i18n/server";
import { buildMetadata } from "@/lib/seo";

type Props = LangProps<{ slug: string }>;

export async function generateStaticParams() {
  // Pre-rendering is only a speed-up: if the API is down, the pages are built on request instead.
  return (await listProducts().catch(() => [])).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { lang, t } = await langFrom(params);
  const found = await getProduct((await params).slug);
  if (!found) return {};
  const p = localizeProduct(found, lang);
  return buildMetadata({
    path: `/loja/${p.slug}`,
    title: t({ pt: `${p.name}, loja solidária`, en: `${p.name}, charity shop`, es: `${p.name}, tienda solidaria`, fr: `${p.name}, boutique solidaire` }),
    description: t({ pt: `${p.description} Venha vê-lo à loja solidária da Gatos de Ninguém.`, en: `${p.description} Come and see it at the Gatos de Ninguém charity shop.`, es: `${p.description} Venga a verlo a la tienda solidaria de Gatos de Ninguém.`, fr: `${p.description} Venez le voir à la boutique solidaire de Gatos de Ninguém.` }).slice(0, 160),
    image: p.photos[0]?.url,
  });
}

export default async function ProductPage({ params }: Props) {
  const { lang, t, l } = await langFrom(params);
  const found = await getProduct((await params).slug);
  if (!found) notFound();
  const product = localizeProduct(found, lang);
  const [settings, shop] = await Promise.all([getSeoSettings(), getShopSummary()]);
  const photo = product.photos[0]!;
  const url = `${settings.siteUrl}${localize(`/loja/${product.slug}`, lang)}`;
  return (
    <Container>
      <div className="page-hero">
        <Breadcrumbs items={[{ href: l("/"), label: crumbs[lang].home }, { href: l("/loja"), label: crumbs[lang].shop }, { label: product.name }]} />
      </div>
      <div className="cat-profile product">
        <div className="gn-stack gn-stack--s">
          <img className="cat-profile__photo" src={photo.url} alt={photo.alt} width={800} height={600} />
          {product.photos.length > 1 ? (
            <div className="product__more">{product.photos.slice(1).map((p) => <img key={p.url} src={p.url} alt={p.alt} width={200} height={150} loading="lazy" />)}</div>
          ) : null}
        </div>
        <div className="gn-stack gn-stack--m">
          <p className="gn-eyebrow">{productCategoryLabel[lang][product.category]}</p>
          <h1>{product.name}</h1>
          {product.description ? <p lang={product.ptOnly ? "pt-PT" : undefined}>{product.description}</p> : null}
          {stockOf(product) === 0 ? <Notice tone="info" title={t({ pt: "Esgotado", en: "Sold out", es: "Agotado", fr: "Épuisé" })}>{t({ pt: "Já não temos este artigo. Venha ver os outros à loja.", en: "We no longer have this item. Come and see the others at the shop.", es: "Ya no tenemos este artículo. Venga a ver los demás a la tienda.", fr: "Nous n’avons plus cet article. Venez voir les autres à la boutique." })}</Notice> : null}
          <section className="gn-stack gn-stack--s" aria-labelledby="visite">
            <h2 id="visite">{t({ pt: "Venha vê-lo à loja", en: "Come and see it at the shop", es: "Venga a verlo a la tienda", fr: "Venez le voir à la boutique" })}</h2>
            <p>{t({ pt: "Não vendemos pelo site. Este e outros artigos esperam por si na loja solidária, e tudo o que lá se angaria vai para os gatos.", en: "We don’t sell online. This and other items are waiting for you at the charity shop, and everything raised there goes to the cats.", es: "No vendemos por la web. Este y otros artículos le esperan en la tienda solidaria, y todo lo que allí se recauda va para los gatos.", fr: "Nous ne vendons pas en ligne. Cet article et d’autres vous attendent à la boutique solidaire, et tout ce qui y est récolté va aux chats." })}</p>
            <ShopVisit settings={shop.settings} />
          </section>
          <ShareBar url={url} text={t({ pt: `${product.name}: está na loja solidária da Gatos de Ninguém`, en: `${product.name}: at the Gatos de Ninguém charity shop`, es: `${product.name}: en la tienda solidaria de Gatos de Ninguém`, fr: `${product.name} : à la boutique solidaire de Gatos de Ninguém` })} />
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
