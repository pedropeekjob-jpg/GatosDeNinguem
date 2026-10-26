import { acceptedDonations, productCategoryLabel, stockOf, type ProductCategory } from "@gn/domain";
import { Button, Container, Grid, Section } from "@gn/ui";
import { CatFilter } from "@/components/client/CatFilter";
import { FormModal } from "@/components/client/FormModal";
import { ItemDonationForm } from "@/components/forms/ItemDonationForm";
import { ProductCard } from "@/components/loja/ProductCard";
import { ShopTransparency } from "@/components/loja/ShopTransparency";
import { ShopVisit } from "@/components/loja/ShopVisit";
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
  // What is still at the shop comes first; sold-out articles stay visible at the end.
  const sorted = [...products].sort((a, b) => Number(stockOf(b) > 0) - Number(stockOf(a) > 0));
  const categories = (Object.keys(productCategoryLabel) as ProductCategory[])
    .map((c) => ({ value: c, label: productCategoryLabel[c], count: products.filter((p) => p.category === c).length }));
  return (
    <>
      <PageHero heading={page.heading} intro={page.intro} crumbs={[{ href: "/", label: "Início" }, { label: "Loja solidária" }]}>
        <p className="shop-promise">
          <strong className="shop-promise__big">100%</strong>
          <span>Todos os donativos angariados pela loja vão para os gatos.</span>
        </p>
        <div className="action-row"><Button href="#visitar" variant="secondary">Onde fica a loja</Button></div>
      </PageHero>
      <Section heading={`${products.length} artigos`} intro="Alguns dos artigos que esperam por si na loja solidária. Não vendemos pelo site: venha vê-los à loja.">
        <CatFilter total={products.length} options={categories} noun="artigos">
          <div className="shop-grid"><Grid min="14rem">{sorted.map((p) => <div key={p.id} data-f={p.category}><ProductCard product={p} /></div>)}</Grid></div>
        </CatFilter>
      </Section>

      <Section id="visitar" tone="soft" heading="Visite a loja" intro="Venha ver os artigos, conversar connosco e saber mais sobre os gatos do gatil.">
        <ShopVisit settings={summary.settings} />
      </Section>

      <Section id="para-onde-vai" heading="Para onde vai o dinheiro" intro="Mostramos quanto a loja angariou e em que gastamos o dinheiro.">
        <ShopTransparency summary={summary.transparency} />
      </Section>

      <section id="doar-artigos" className="gn-section gn-section--soft">
        <Container narrow>
          <div className="gn-stack gn-stack--m">
            <h2>Tem coisas para doar à loja?</h2>
            <p>Pomos na loja e nas bancas o que nos oferecem. Tudo o que isso angaria vai para os gatos.</p>
            <ul className="gn-stack gn-stack--s">{acceptedDonations.map((a) => <li key={a}>{a}</li>)}</ul>
            <div className="action-row"><DonateItemsButton /></div>
          </div>
        </Container>
      </section>
    </>
  );
}
