import { Card, Grid, Section } from "@gn/ui";
import { HelpQuiz } from "@/components/client/HelpQuiz";
import { LegacyHelpAnchors } from "@/components/client/LegacyHelpAnchors";
import { PageHero } from "@/components/PageHero";
import { getPage } from "@/lib/content";
import { features } from "@/lib/features";
import { localizePage } from "@/lib/i18n/content";
import { crumbs } from "@/lib/i18n/labels";
import { langFrom, type LangProps } from "@/lib/i18n/server";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: LangProps) {
  const { lang } = await langFrom(params);
  const page = localizePage(await getPage("/ajudar"), lang);
  return buildMetadata({ path: "/ajudar", title: page.heading, description: page.intro, overrides: page.seo });
}

export default async function HelpPage({ params }: LangProps) {
  const { lang, t, l } = await langFrom(params);
  const page = localizePage(await getPage("/ajudar"), lang);
  return (
    <>
      <LegacyHelpAnchors />
      <PageHero heading={page.heading} intro={page.intro} introLang={page.ptOnly ? "pt-PT" : undefined} crumbs={[{ href: "/", label: crumbs[lang].home }, { label: crumbs[lang].help }]} />
      <Section>
        <Grid>
          <Card title={t({ pt: "Adotar", en: "Adopt", es: "Adoptar", fr: "Adopter" })} href={l("/adotar")}><p>{t({ pt: "Dê uma casa para sempre a um gato.", en: "Give a cat a home for ever.", es: "Dé un hogar para siempre a un gato.", fr: "Offrez un foyer pour toujours à un chat." })}</p></Card>
          <Card title={t({ pt: "Apadrinhar", en: "Sponsor", es: "Apadrinar", fr: "Parrainer" })} href={l("/apadrinhar")}><p>{t({ pt: "Ajude um gato todos os meses e receba notícias dele.", en: "Help a cat every month and get news of them.", es: "Ayude a un gato cada mes y reciba noticias suyas.", fr: "Aidez un chat chaque mois et recevez de ses nouvelles." })}</p></Card>
          <Card title={t({ pt: "Fazer um donativo", en: "Make a donation", es: "Hacer un donativo", fr: "Faire un don" })} href={l("/doar")}><p>{t({ pt: "Qualquer valor ajuda. 35 euros pagam uma esterilização.", en: "Any amount helps. 35 euros pays for one neutering.", es: "Cualquier cantidad ayuda. 35 euros pagan una esterilización.", fr: "Chaque euro compte. 35 euros paient une stérilisation." })}</p></Card>
          <Card title={t({ pt: "Ser voluntário", en: "Volunteer", es: "Ser voluntario", fr: "Devenir bénévole" })} href={l("/ajudar/voluntariado")}><p>{t({ pt: "Limpeza, transporte ao veterinário e eventos.", en: "Cleaning, trips to the vet and events.", es: "Limpieza, transporte al veterinario y eventos.", fr: "Ménage, trajets chez le vétérinaire et événements." })}</p></Card>
          <Card title={t({ pt: "Família temporária", en: "Foster home", es: "Casa de acogida", fr: "Famille d’accueil" })} href={l("/ajudar/familia-temporaria")}><p>{t({ pt: "Acolha um gato por umas semanas.", en: "Take in a cat for a few weeks.", es: "Acoja un gato unas semanas.", fr: "Accueillez un chat quelques semaines." })}</p></Card>
          <Card title={t({ pt: "Comprar na loja solidária", en: "Shop at the charity shop", es: "Comprar en la tienda solidaria", fr: "Acheter à la boutique solidaire" })} href={l("/loja")}><p>{t({ pt: "T-shirts, canecas e calendários. Também pode doar coisas para vender.", en: "T-shirts, mugs and calendars. You can also give things for us to sell.", es: "Camisetas, tazas y calendarios. También puede donar cosas para vender.", fr: "T-shirts, mugs et calendriers. Vous pouvez aussi donner des objets à vendre." })}</p></Card>
          {features.amigo ? <Card title={t({ pt: "Ser Amigo", en: "Become a Friend", es: "Hacerse Amigo", fr: "Devenir Ami" })} href={l("/ajudar/amigo")}><p>{t({ pt: "24 euros por ano, com descontos nos parceiros.", en: "24 euros a year, with discounts at our partners.", es: "24 euros al año, con descuentos en los colaboradores.", fr: "24 euros par an, avec des réductions chez nos partenaires." })}</p></Card> : null}
          {features.patinhas ? (
            <Card title={t({ pt: "Ganhar Patinhas", en: "Earn Patinhas", es: "Ganar Patinhas", fr: "Gagner des Patinhas" })} href={l("/patinhas")}><p>{features.trocas
              ? t({ pt: "Cada ajuda dá Patinhas, que pode trocar por vantagens nos parceiros.", en: "Every bit of help earns Patinhas, which you can swap for perks at our partners.", es: "Cada ayuda da Patinhas, que puede cambiar por ventajas en los colaboradores.", fr: "Chaque geste rapporte des Patinhas, à échanger contre des avantages chez nos partenaires." })
              : t({ pt: "Cada ajuda dá Patinhas, que sobem o seu nível.", en: "Every bit of help earns Patinhas, which raise your level.", es: "Cada ayuda da Patinhas, que suben su nivel.", fr: "Chaque geste rapporte des Patinhas, qui font monter votre niveau." })}</p></Card>
          ) : null}
        </Grid>
      </Section>

      <Section tone="soft" heading={t({ pt: "Não sabe por onde começar?", en: "Not sure where to start?", es: "¿No sabe por dónde empezar?", fr: "Vous ne savez pas par où commencer ?" })}>
        <HelpQuiz />
      </Section>
    </>
  );
}
