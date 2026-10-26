import { isSenior } from "@gn/domain";
import { Grid, Section } from "@gn/ui";
import { CatCard } from "@/components/CatCard";
import { PageHero } from "@/components/PageHero";
import { listCats, type PublicCat } from "@/lib/content";
import { crumbs } from "@/lib/i18n/labels";
import { langFrom, type LangProps } from "@/lib/i18n/server";
import { buildMetadata } from "@/lib/seo";

const heading = { pt: "Apadrinhar um gato", en: "Sponsor a cat", es: "Apadrinar un gato", fr: "Parrainer un chat" };

export async function generateMetadata({ params }: LangProps) {
  const { t } = await langFrom(params);
  return buildMetadata({
    path: "/apadrinhar",
    title: t(heading),
    description: t({ pt: "A partir de 5 euros por mês ajuda a pagar a comida e o veterinário de um gato do gatil, e recebe notícias dele.", en: "From 5 euros a month you help pay for a shelter cat’s food and vet care, and get news of them.", es: "Desde 5 euros al mes ayuda a pagar la comida y el veterinario de un gato del refugio, y recibe noticias suyas.", fr: "À partir de 5 euros par mois, vous aidez à payer la nourriture et le vétérinaire d’un chat du refuge, et recevez de ses nouvelles." }),
  });
}

/** Cats who need it most first: still recovering, seniors and those with special care. */
const need = (c: PublicCat) => (c.status === "a-recuperar" ? 2 : 0) + (isSenior(c) || c.specialNeeds ? 1 : 0);

export default async function SponsorPage({ params }: LangProps) {
  const { lang, t } = await langFrom(params);
  const cats = (await listCats()).filter((c) => c.status !== "adotado").sort((a, b) => need(b) - need(a));
  const c = crumbs[lang];
  return (
    <>
      <PageHero
        heading={t(heading)}
        intro={t({ pt: "Escolha um gato e ajude todos os meses com a comida e o veterinário. Recebe fotografias e notícias do seu afilhado. Não precisa de o levar para casa.", en: "Choose a cat and help every month with food and vet care. You get photos and news of your cat. You don’t have to take them home.", es: "Elija un gato y ayude cada mes con la comida y el veterinario. Recibe fotos y noticias de su ahijado. No tiene que llevárselo a casa.", fr: "Choisissez un chat et aidez chaque mois pour la nourriture et le vétérinaire. Vous recevez des photos et des nouvelles de votre filleul. Pas besoin de l’emmener chez vous." })}
        crumbs={[{ href: "/", label: c.home }, { href: "/ajudar", label: c.help }, { label: c.sponsor }]}
      />
      <Section
        heading={t({ pt: "Escolha o seu afilhado", en: "Choose your cat", es: "Elija a su ahijado", fr: "Choisissez votre filleul" })}
        intro={t({ pt: "Os gatos que estão a recuperar, os seniores e os que precisam de cuidados especiais aparecem primeiro: são os que mais precisam.", en: "Cats who are recovering, seniors and those needing special care come first: they need it most.", es: "Los gatos que se están recuperando, los sénior y los que necesitan cuidados especiales aparecen primero: son los que más lo necesitan.", fr: "Les chats en convalescence, les seniors et ceux qui ont besoin de soins particuliers apparaissent en premier : ce sont eux qui en ont le plus besoin." })}
      >
        <Grid>{cats.map((cat) => <CatCard key={cat.id} cat={cat} sponsor />)}</Grid>
      </Section>
      <Section tone="soft" heading={t({ pt: "Como funciona", en: "How it works", es: "Cómo funciona", fr: "Comment ça marche" })}>
        <ol className="gn-stack gn-stack--s">
          {t({
            pt: ["Escolhe um gato e diz-nos quanto quer dar por mês, a partir de 5 euros.", "Entramos em contacto para combinar a contribuição.", "Todos os meses recebe fotografias e notícias do seu afilhado.", "Pode parar quando quiser, basta avisar-nos."],
            en: ["Choose a cat and tell us how much you’d like to give each month, from 5 euros.", "We get in touch to arrange your contribution.", "Every month you get photos and news of your cat.", "You can stop whenever you like; just let us know."],
            es: ["Elige un gato y nos dice cuánto quiere dar al mes, desde 5 euros.", "Nos ponemos en contacto para acordar la aportación.", "Cada mes recibe fotos y noticias de su ahijado.", "Puede dejarlo cuando quiera, basta con avisarnos."],
            fr: ["Choisissez un chat et dites-nous combien vous voulez donner par mois, à partir de 5 euros.", "Nous vous contactons pour organiser votre contribution.", "Chaque mois, vous recevez des photos et des nouvelles de votre filleul.", "Vous pouvez arrêter quand vous voulez, il suffit de nous prévenir."],
          }).map((s) => <li key={s}>{s}</li>)}
        </ol>
      </Section>
    </>
  );
}
