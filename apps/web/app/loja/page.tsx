import { acceptedDonations, productCategoryLabel, stockOf, type ProductCategory } from "@gn/domain";
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
  // What is available comes first; sold-out gifts stay visible at the end.
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
        <CartBar />
      </PageHero>
      <Section heading={`${products.length} ofertas`} intro="A associação não vende. Cada artigo é o nosso obrigado por um donativo, a partir do valor indicado.">
        <CatFilter total={products.length} options={categories} noun="ofertas">
          <div className="shop-grid"><Grid min="14rem">{sorted.map((p) => <div key={p.id} data-f={p.category}><ProductCard product={p} /></div>)}</Grid></div>
        </CatFilter>
      </Section>

      <Section tone="soft" heading="Como funciona">
        <ol className="steps">
          <li><span><strong>Escolha</strong> a oferta que quer receber. Não precisa de conta.</span></li>
          <li><span><strong>Diga quanto quer doar</strong>, a partir do mínimo, com o seu nome e telemóvel. A oferta fica guardada para si.</span></li>
          <li><span><strong>Faça o donativo</strong> por MB WAY, transferência ou quando levantar. Dizemos-lhe como no fim.</span></li>
          <li><span><strong>Receba o nosso obrigado</strong> no gatil, numa banca da associação ou pelo correio.</span></li>
        </ol>
        <p className="small">Leia <a href="/loja/condicoes">como funcionam os donativos com oferta</a>.</p>
      </Section>

      <Section id="para-onde-vai" heading="Para onde vai o dinheiro" intro="Mostramos o que cada oferta nos custou e em que gastamos os donativos.">
        <ShopTransparency summary={summary.transparency} />
      </Section>

      <section id="doar-artigos" className="gn-section gn-section--soft">
        <Container narrow>
          <div className="gn-stack gn-stack--m">
            <h2>Tem coisas para doar à loja?</h2>
            <p>Damos o que nos oferecem como agradecimento a quem faz um donativo, aqui e nas bancas. Esses donativos vão todos para os gatos.</p>
            <ul className="gn-stack gn-stack--s">{acceptedDonations.map((a) => <li key={a}>{a}</li>)}</ul>
            <div className="action-row"><DonateItemsButton /></div>
          </div>
        </Container>
      </section>
    </>
  );
}
