import { acceptedDonations, productCategoryLabel, stockOf, WITHDRAWAL_DAYS, type ProductCategory } from "@gn/domain";
import { Container, Grid, Section } from "@gn/ui";
import { CatFilter } from "@/components/client/CatFilter";
import { FormModal } from "@/components/client/FormModal";
import { ItemDonationForm } from "@/components/forms/ItemDonationForm";
import { CartBar } from "@/components/loja/CartBar";
import { ProductCard } from "@/components/loja/ProductCard";
import { ShopTransparency } from "@/components/loja/ShopTransparency";
import { PageHero } from "@/components/PageHero";
import { getPage, getShopSummary, listProducts } from "@/lib/content";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata() {
  const page = await getPage("/loja");
  return buildMetadata({ path: "/loja", title: page.heading, description: page.intro, overrides: page.seo });
}

function DonateItemsButton({ variant = "primary" }: { variant?: "primary" | "secondary" }) {
  return (
    <FormModal label="Doar artigos para a loja" variant={variant} title="Doar artigos para a loja" intro="Diga-nos o que tem. Ligamos-lhe para combinar a entrega.">
      <ItemDonationForm />
    </FormModal>
  );
}

export default async function ShopPage() {
  const [page, products, summary] = await Promise.all([getPage("/loja"), listProducts(), getShopSummary()]);
  // What can be bought comes first; sold-out articles stay visible at the end.
  const sorted = [...products].sort((a, b) => Number(stockOf(b) > 0) - Number(stockOf(a) > 0));
  const categories = (Object.keys(productCategoryLabel) as ProductCategory[])
    .map((c) => ({ value: c, label: productCategoryLabel[c], count: products.filter((p) => p.category === c).length }));
  return (
    <>
      <PageHero heading={page.heading} intro={page.intro} crumbs={[{ href: "/", label: "Início" }, { label: "Loja solidária" }]}>
        <CartBar />
      </PageHero>
      <Section heading={`${products.length} artigos`}>
        <CatFilter total={products.length} options={categories} noun="artigos">
          <div className="shop-grid"><Grid min="14rem">{sorted.map((p) => <div key={p.id} data-f={p.category}><ProductCard product={p} /></div>)}</Grid></div>
        </CatFilter>
      </Section>

      <Section tone="soft" heading="Como comprar">
        <ol className="steps">
          <li><span><strong>Escolha</strong> e ponha no cesto. Não precisa de conta.</span></li>
          <li><span><strong>Faça o pedido</strong> com o seu nome e telemóvel. Os artigos ficam guardados para si.</span></li>
          <li><span><strong>Pague</strong> por MB WAY, transferência ou quando levantar. Dizemos-lhe como no fim do pedido.</span></li>
          <li><span><strong>Levante</strong> no gatil ou numa banca da associação, ou receba pelo correio.</span></li>
        </ol>
        <p className="small">Tem {WITHDRAWAL_DAYS} dias para desistir depois de receber. Leia as <a href="/loja/condicoes">condições da loja</a>.</p>
      </Section>

      <Section id="para-onde-vai" heading="Para onde vai o dinheiro" intro="Mostramos o que cada artigo custou a fazer e em que gastamos o que a loja rende.">
        <ShopTransparency summary={summary.transparency} />
      </Section>

      <section id="doar-artigos" className="gn-section gn-section--soft">
        <Container narrow>
          <div className="gn-stack gn-stack--m">
            <h2>Tem coisas para doar à loja?</h2>
            <p>Vendemos na loja e nas bancas o que nos oferecem. Tudo o que rende vai para os gatos.</p>
            <ul className="gn-stack gn-stack--s">{acceptedDonations.map((a) => <li key={a}>{a}</li>)}</ul>
            <div className="action-row"><DonateItemsButton /></div>
          </div>
        </Container>
      </section>
    </>
  );
}
