import { Button, Grid, Notice, Section } from "@gn/ui";
import { isSenior } from "@gn/domain";
import { CatCard } from "@/components/CatCard";
import { CatAlertButton } from "@/components/client/CatAlerts";
import { CatFilter } from "@/components/client/CatFilter";
import { FavoritesStrip } from "@/components/client/FavoritesStrip";
import { PageHero } from "@/components/PageHero";
import { getPage, listCats, listHappyEndings, type PublicCat } from "@/lib/content";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata() {
  const page = await getPage("/adotar");
  return buildMetadata({ path: "/adotar", title: page.heading, description: page.intro, overrides: page.seo });
}

/** The words a filter chip matches against: sex, senior, special needs. */
const tags = (cat: PublicCat) => [cat.sex, isSenior(cat) && "senior", cat.specialNeeds && "cuidados"].filter(Boolean).join(" ");

export default async function AdoptPage() {
  const [page, available, recovering, happy] = await Promise.all([getPage("/adotar"), listCats("para-adocao"), listCats("a-recuperar"), listHappyEndings()]);
  return (
    <>
      <PageHero heading={page.heading} intro={page.intro} crumbs={[{ href: "/", label: "Início" }, { label: "Adotar" }]}>
        <div className="action-row">
          <Button href="/adotar/descobrir">Ajude-me a escolher</Button>
          <CatAlertButton />
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
          options={[
            { value: "femea", label: "Fêmeas", count: available.filter((c) => c.sex === "femea").length },
            { value: "macho", label: "Machos", count: available.filter((c) => c.sex === "macho").length },
            { value: "senior", label: "Séniores", count: available.filter(isSenior).length },
            { value: "cuidados", label: "Cuidados especiais", count: available.filter((c) => c.specialNeeds).length },
          ]}
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
        <ol className="gn-stack gn-stack--s">
          <li>Escolhe um gato e carrega em “Quero conhecer”.</li>
          <li>Ligamos-lhe para conversar e marcar uma visita ao gatil.</li>
          <li>Se for o gato certo, assinamos o contrato de adoção e leva-o para casa.</li>
          <li>Ligamos uma semana e um mês depois para saber como estão.</li>
        </ol>
        <Notice tone="info" title="Adotar é para toda a vida">Um gato pode viver 15 a 20 anos. Pense com calma; estamos aqui para ajudar.</Notice>
      </Section>
    </>
  );
}
