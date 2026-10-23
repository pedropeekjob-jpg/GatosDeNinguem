import { Button, Grid, Section } from "@gn/ui";
import { HappyEndingCard } from "@/components/HappyEndingCard";
import { PageHero } from "@/components/PageHero";
import { getPage, listHappyEndings } from "@/lib/content";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata() {
  const page = await getPage("/finais-felizes");
  return buildMetadata({ path: "/finais-felizes", title: page.heading, description: page.intro, overrides: page.seo });
}

export default async function HappyEndingsPage() {
  const [page, items] = await Promise.all([getPage("/finais-felizes"), listHappyEndings()]);
  return (
    <>
      <PageHero heading={page.heading} intro={page.intro} crumbs={[{ href: "/", label: "Início" }, { label: "Finais felizes" }]}>
        <p className="gn-lead"><strong>{items.length}</strong> {items.length === 1 ? "gato encontrou" : "gatos encontraram"} família através do site.</p>
      </PageHero>
      <Section>
        <Grid>
          {items.map((item) => <HappyEndingCard key={item.cat.id} item={item} titleAs="h2" />)}
        </Grid>
      </Section>
      <Section tone="soft" heading="Adotou um dos nossos gatos?" intro="Envie-nos uma fotografia e umas palavras. Os outros gatos agradecem: as histórias felizes ajudam-nos a encontrar mais famílias.">
        <div className="action-row">
          <Button href="/adotar">Conhecer os gatos que esperam família</Button>
        </div>
      </Section>
    </>
  );
}
