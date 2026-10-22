import { Button, Grid, Notice, Section } from "@gn/ui";
import { CatCard } from "@/components/CatCard";
import { FavoritesStrip } from "@/components/client/FavoritesStrip";
import { PageHero } from "@/components/PageHero";
import { getPage, listCats } from "@/lib/content";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata() {
  const page = await getPage("/adotar");
  return buildMetadata({ path: "/adotar", title: page.heading, description: page.intro, overrides: page.seo });
}

export default async function AdoptPage() {
  const [page, available, recovering] = await Promise.all([getPage("/adotar"), listCats("para-adocao"), listCats("a-recuperar")]);
  return (
    <>
      <PageHero heading={page.heading} intro={page.intro} crumbs={[{ href: "/", label: "Início" }, { label: "Adotar" }]}>
        <div className="action-row">
          <Button href="/adotar/descobrir">Ajude-me a escolher</Button>
        </div>
        <FavoritesStrip cats={available} />
      </PageHero>
      <Section heading={`${available.length} gatos procuram família`}>
        <Grid>{available.map((cat) => <CatCard key={cat.id} cat={cat} />)}</Grid>
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
