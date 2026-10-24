import { Button, Grid, Notice, Section } from "@gn/ui";
import { adoptionSteps, catFilterTags, catFilters } from "@gn/domain";
import { AdoptionSteps } from "@/components/AdoptionSteps";
import { CatCard } from "@/components/CatCard";
import { CatFilter } from "@/components/client/CatFilter";
import { FavoritesStrip } from "@/components/client/FavoritesStrip";
import { PageHero } from "@/components/PageHero";
import { getPage, listCats, listHappyEndings, type PublicCat } from "@/lib/content";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata() {
  const page = await getPage("/adotar");
  return buildMetadata({ path: "/adotar", title: page.heading, description: page.intro, overrides: page.seo });
}

/** The words a filter chip matches against: age, who the cat lives well with, energy, sex, special needs. */
const tags = (cat: PublicCat) => catFilterTags(cat).join(" ");

export default async function AdoptPage() {
  const [page, available, recovering, happy] = await Promise.all([getPage("/adotar"), listCats("para-adocao"), listCats("a-recuperar"), listHappyEndings()]);
  return (
    <>
      <PageHero heading={page.heading} intro={page.intro} crumbs={[{ href: "/", label: "Início" }, { label: "Adotar" }]}>
        <div className="action-row">
          <Button href="/adotar/descobrir">Ajude-me a escolher</Button>
        </div>
        <FavoritesStrip cats={available} />
        {happy.length > 0 ? (
          <a className="happy-link" href="/finais-felizes">
            <span className="happy-link__faces" aria-hidden="true">
              {happy.slice(0, 3).map(({ cat, happyEnding }) => { const p = happyEnding?.photo ?? cat.photos[0]!; return <img key={cat.id} src={p.url} alt="" width={40} height={40} />; })}
            </span>
            <span><strong>{happy.length} {happy.length === 1 ? "gato já encontrou" : "gatos já encontraram"} família.</strong> Ver os finais felizes</span>
          </a>
        ) : null}
      </PageHero>
      <Section heading={`${available.length} gatos procuram família`}>
        <CatFilter
          total={available.length}
          wrap
          options={catFilters.map((f) => ({ value: f.value, label: f.label, count: available.filter(f.test).length }))}
        >
          <Grid>{available.map((cat) => <div key={cat.id} data-f={tags(cat)}><CatCard cat={cat} /></div>)}</Grid>
        </CatFilter>
      </Section>
      {recovering.length > 0 ? (
        <Section tone="soft" heading="Em breve" intro="Estes gatos ainda estão a recuperar. Pode apadrinhá-los enquanto esperam.">
          <div className="action-row"><Button href="/apadrinhar" variant="secondary">Apadrinhar um gato</Button></div>
          <Grid>{recovering.map((cat) => <CatCard key={cat.id} cat={cat} />)}</Grid>
        </Section>
      ) : null}
      <Section heading="Como funciona a adoção">
        <AdoptionSteps steps={adoptionSteps} />
        <Notice tone="info" title="Adotar é para toda a vida">Um gato pode viver 15 a 20 anos. Pense com calma; estamos aqui para ajudar.</Notice>
        <div className="action-row"><Button href="/adotar/perguntas" variant="secondary">Perguntas sobre adotar</Button></div>
      </Section>
    </>
  );
}
