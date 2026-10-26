import { stockOf, type ProductCategory } from "@gn/domain";
import { Button, Container, Grid, Section } from "@gn/ui";
import { CatFilter } from "@/components/client/CatFilter";
import { FormModal } from "@/components/client/FormModal";
import { ItemDonationForm } from "@/components/forms/ItemDonationForm";
import { ProductCard } from "@/components/loja/ProductCard";
import { ShopTransparency } from "@/components/loja/ShopTransparency";
import { ShopVisit } from "@/components/loja/ShopVisit";
import { PageHero } from "@/components/PageHero";
import { getPage, getShopSummary, listProducts } from "@/lib/content";
import { localizePage } from "@/lib/i18n/content";
import { crumbs, productCategoryLabel } from "@/lib/i18n/labels";
import { i18n, langFrom, type LangProps } from "@/lib/i18n/server";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: LangProps) {
  const { lang } = await langFrom(params);
  const page = localizePage(await getPage("/loja"), lang);
  return buildMetadata({ path: "/loja", title: page.heading, description: page.intro, overrides: page.seo });
}

/** What the shop accepts (acceptedDonations in the domain), in every language. */
const accepted = {
  pt: ["Roupa e calçado limpos e em bom estado", "Livros, discos e jogos", "Loiça, decoração e pequenos objetos para a casa", "Artesanato feito por si", "Brinquedos completos"],
  en: ["Clean clothes and shoes in good condition", "Books, records and games", "Crockery, decorations and small household items", "Crafts you made yourself", "Complete toys"],
  es: ["Ropa y calzado limpios y en buen estado", "Libros, discos y juegos", "Vajilla, decoración y pequeños objetos para la casa", "Artesanía hecha por usted", "Juguetes completos"],
  fr: ["Vêtements et chaussures propres et en bon état", "Livres, disques et jeux", "Vaisselle, décoration et petits objets pour la maison", "Artisanat fait par vous", "Jouets complets"],
};

function DonateItemsButton({ variant = "primary" }: { variant?: "primary" | "secondary" }) {
  const { t } = i18n();
  const label = t({ pt: "Doar artigos para a loja", en: "Give items to the shop", es: "Donar artículos a la tienda", fr: "Donner des objets à la boutique" });
  return (
    <FormModal label={label} variant={variant} title={label} intro={t({ pt: "Diga-nos o que tem. Ligamos-lhe para combinar a entrega.", en: "Tell us what you have. We’ll call you to arrange how to get it.", es: "Díganos qué tiene. Le llamamos para acordar la entrega.", fr: "Dites-nous ce que vous avez. Nous vous appelons pour organiser la remise." })}>
      <ItemDonationForm />
    </FormModal>
  );
}

export default async function ShopPage({ params }: LangProps) {
  const { lang, t } = await langFrom(params);
  const [ptPage, products, summary] = await Promise.all([getPage("/loja"), listProducts(), getShopSummary()]);
  const page = localizePage(ptPage, lang);
  // What is still at the shop comes first; sold-out articles stay visible at the end.
  const sorted = [...products].sort((a, b) => Number(stockOf(b) > 0) - Number(stockOf(a) > 0));
  const labels = productCategoryLabel[lang];
  const categories = (Object.keys(labels) as ProductCategory[])
    .map((c) => ({ value: c, label: labels[c], count: products.filter((p) => p.category === c).length }));
  const n = products.length;
  return (
    <>
      <PageHero heading={page.heading} intro={page.intro} introLang={page.ptOnly ? "pt-PT" : undefined} crumbs={[{ href: "/", label: crumbs[lang].home }, { label: crumbs[lang].shop }]}>
        <p className="shop-promise">
          <strong className="shop-promise__big">100%</strong>
          <span>{t({ pt: "Todos os donativos angariados pela loja vão para os gatos.", en: "Every donation the shop raises goes to the cats.", es: "Todos los donativos que recauda la tienda van para los gatos.", fr: "Tous les dons récoltés par la boutique vont aux chats." })}</span>
        </p>
        <div className="action-row"><Button href="#visitar" variant="secondary">{t({ pt: "Onde fica a loja", en: "Where the shop is", es: "Dónde está la tienda", fr: "Où se trouve la boutique" })}</Button></div>
      </PageHero>
      <Section
        heading={t({ pt: `${n} artigos`, en: `${n} items`, es: `${n} artículos`, fr: `${n} articles` })}
        intro={t({ pt: "Alguns dos artigos que esperam por si na loja solidária. Não vendemos pelo site: venha vê-los à loja.", en: "Some of the items waiting for you at the charity shop. We don’t sell online: come and see them at the shop.", es: "Algunos de los artículos que le esperan en la tienda solidaria. No vendemos por la web: venga a verlos a la tienda.", fr: "Quelques-uns des articles qui vous attendent à la boutique solidaire. Nous ne vendons pas en ligne : venez les voir à la boutique." })}
      >
        <CatFilter total={n} options={categories} noun={t({ pt: "artigos", en: "items", es: "artículos", fr: "articles" })}>
          <div className="shop-grid"><Grid min="14rem">{sorted.map((p) => <div key={p.id} data-f={p.category}><ProductCard product={p} /></div>)}</Grid></div>
        </CatFilter>
      </Section>

      <Section id="visitar" tone="soft" heading={t({ pt: "Visite a loja", en: "Visit the shop", es: "Visite la tienda", fr: "Venez à la boutique" })} intro={t({ pt: "Venha ver os artigos, conversar connosco e saber mais sobre os gatos do gatil.", en: "Come and see the items, have a chat with us and find out more about the shelter cats.", es: "Venga a ver los artículos, a charlar con nosotros y a conocer mejor a los gatos del refugio.", fr: "Venez voir les articles, discuter avec nous et en savoir plus sur les chats du refuge." })}>
        <ShopVisit settings={summary.settings} />
      </Section>

      <Section id="para-onde-vai" heading={t({ pt: "Para onde vai o dinheiro", en: "Where the money goes", es: "Adónde va el dinero", fr: "Où va l’argent" })} intro={t({ pt: "Mostramos quanto a loja angariou e em que gastamos o dinheiro.", en: "We show how much the shop has raised and what we spend the money on.", es: "Mostramos cuánto ha recaudado la tienda y en qué gastamos el dinero.", fr: "Nous montrons combien la boutique a récolté et à quoi nous dépensons l’argent." })}>
        <ShopTransparency summary={summary.transparency} />
      </Section>

      <section id="doar-artigos" className="gn-section gn-section--soft">
        <Container narrow>
          <div className="gn-stack gn-stack--m">
            <h2>{t({ pt: "Tem coisas para doar à loja?", en: "Got things to give to the shop?", es: "¿Tiene cosas para donar a la tienda?", fr: "Vous avez des objets à donner à la boutique ?" })}</h2>
            <p>{t({ pt: "Pomos na loja e nas bancas o que nos oferecem. Tudo o que isso angaria vai para os gatos.", en: "We put what people give us in the shop and on our stalls. Everything it raises goes to the cats.", es: "Ponemos en la tienda y en los puestos lo que nos regalan. Todo lo que se recauda va para los gatos.", fr: "Nous mettons à la boutique et sur nos stands ce qu’on nous donne. Tout ce que cela rapporte va aux chats." })}</p>
            <ul className="gn-stack gn-stack--s">{accepted[lang].map((a) => <li key={a}>{a}</li>)}</ul>
            <div className="action-row"><DonateItemsButton /></div>
          </div>
        </Container>
      </section>
    </>
  );
}
