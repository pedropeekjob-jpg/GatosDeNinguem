import { Container } from "@gn/ui";
import { ShopCart } from "@/components/loja/ShopCart";
import { PageHero } from "@/components/PageHero";
import { getShopSummary, listProducts } from "@/lib/content";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata() {
  return buildMetadata({ path: "/loja/cesto", title: "O seu cesto", description: "Os artigos que escolheu na loja solidária.", overrides: { noindex: true } });
}

export default async function CartPage() {
  const [products, summary] = await Promise.all([listProducts(), getShopSummary()]);
  return (
    <>
      <PageHero heading="O seu cesto" crumbs={[{ href: "/", label: "Início" }, { href: "/loja", label: "Loja solidária" }, { label: "Cesto" }]} />
      <Container narrow>
        <ShopCart products={products} settings={summary.settings} />
      </Container>
    </>
  );
}
