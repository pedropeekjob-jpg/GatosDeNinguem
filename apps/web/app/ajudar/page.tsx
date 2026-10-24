import { Card, Grid, Section } from "@gn/ui";
import { HelpQuiz } from "@/components/client/HelpQuiz";
import { LegacyHelpAnchors } from "@/components/client/LegacyHelpAnchors";
import { PageHero } from "@/components/PageHero";
import { getPage } from "@/lib/content";
import { features } from "@/lib/features";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata() {
  const page = await getPage("/ajudar");
  return buildMetadata({ path: "/ajudar", title: page.heading, description: page.intro, overrides: page.seo });
}

export default async function HelpPage() {
  const page = await getPage("/ajudar");
  return (
    <>
      <LegacyHelpAnchors />
      <PageHero heading={page.heading} intro={page.intro} crumbs={[{ href: "/", label: "Início" }, { label: "Ajudar" }]} />
      <Section>
        <Grid>
          <Card title="Adotar" href="/adotar"><p>Dê uma casa para sempre a um gato.</p></Card>
          <Card title="Apadrinhar" href="/apadrinhar"><p>Ajude um gato todos os meses e receba notícias dele.</p></Card>
          <Card title="Fazer um donativo" href="/doar"><p>Qualquer valor ajuda. 35 euros pagam uma esterilização.</p></Card>
          <Card title="Ser voluntário" href="/ajudar/voluntariado"><p>Limpeza, transporte ao veterinário e eventos.</p></Card>
          <Card title="Família temporária" href="/ajudar/familia-temporaria"><p>Acolha um gato por umas semanas.</p></Card>
          <Card title="Comprar na loja solidária" href="/loja"><p>T-shirts, canecas e calendários. Também pode doar coisas para vender.</p></Card>
          {features.amigo ? <Card title="Ser Amigo" href="/ajudar/amigo"><p>24 euros por ano, com descontos nos parceiros.</p></Card> : null}
          {features.patinhas ? (
            <Card title="Ganhar Patinhas" href="/patinhas"><p>{features.trocas ? "Cada ajuda dá Patinhas, que pode trocar por vantagens nos parceiros." : "Cada ajuda dá Patinhas, que sobem o seu nível."}</p></Card>
          ) : null}
        </Grid>
      </Section>

      <Section tone="soft" heading="Não sabe por onde começar?">
        <HelpQuiz />
      </Section>
    </>
  );
}
