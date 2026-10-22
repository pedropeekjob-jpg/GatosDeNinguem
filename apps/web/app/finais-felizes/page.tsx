import { Button, Card, Grid, Section } from "@gn/ui";
import { PageHero } from "@/components/PageHero";
import { getPage, listHappyEndings } from "@/lib/content";
import { formatDate } from "@/lib/format";
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
          {items.map(({ cat, happyEnding }) => {
            const photo = happyEnding?.photo ?? cat.photos[0]!;
            const who = happyEnding?.adopterName ? `${happyEnding.adopterName}${happyEnding.adopterTown ? `, ${happyEnding.adopterTown}` : ""}` : undefined;
            return (
              <Card key={cat.id} titleAs="h2" title={cat.name} href={`/adotar/${cat.slug}`} media={{ src: photo.url, alt: photo.alt }} eyebrow={cat.adoptedAt ? `Adotad${cat.sex === "femea" ? "a" : "o"} em ${formatDate(cat.adoptedAt)}` : undefined}>
                <p>“{happyEnding?.text ?? cat.summary}”</p>
                {who ? <p className="small muted">{who}</p> : null}
              </Card>
            );
          })}
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
