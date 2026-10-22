import { postCategoryLabel } from "@gn/domain";
import { Badge, Button, Card, Container, Grid, ProgressMeter, Section, StatTile } from "@gn/ui";
import { FeaturedCat } from "@/components/FeaturedCat";
import { CatCard } from "@/components/CatCard";
import { FavoritesStrip } from "@/components/client/FavoritesStrip";
import { HelpQuiz } from "@/components/client/HelpQuiz";
import { getImpact, getPage, listCats, listHappyEndings, listPartners, listPosts } from "@/lib/content";
import { buildMetadata } from "@/lib/seo";
import { formatDate } from "@/lib/format";

export async function generateMetadata() {
  const page = await getPage("/");
  return buildMetadata({ path: "/", title: page.heading, description: page.intro, overrides: page.seo });
}

export default async function HomePage() {
  const [page, cats, impact, posts, endings, partners] = await Promise.all([
    getPage("/"), listCats("para-adocao"), getImpact(), listPosts(), listHappyEndings(), listPartners(),
  ]);
  // Gato da semana: rotates weekly, favouring cats that wait longest for attention (seniors first).
  const week = Math.floor(Date.now() / (7 * 24 * 3600 * 1000));
  const ordered = [...cats].sort((a, b) => b.ageYears - a.ageYears);
  const featured = ordered.length ? ordered[week % ordered.length] : undefined;
  const others = cats.filter((c) => c.slug !== featured?.slug).slice(0, 3);

  return (
    <>
      <section className="home-hero">
        <Container>
          <div className="home-hero__grid">
            <div className="home-hero__text">
              <h1>{page.heading}</h1>
              <p className="gn-lead">{page.intro}</p>
              <div className="home-actions">
                <Button href="/adotar">Quero adotar</Button>
                <Button href="/ajudar" variant="secondary">Quero ajudar</Button>
                <Button href="/sos" variant="urgent">Encontrei um gato</Button>
              </div>
              <FavoritesStrip cats={cats} />
            </div>
            <div className="home-hero__art" aria-hidden="true">
              {cats.slice(0, 3).map((c) => <img key={c.slug} src={c.photos[0]!.url} alt="" width={400} height={300} />)}
            </div>
          </div>
        </Container>
      </section>

      <Section heading="O nosso trabalho em números" intro={`Atualizado em ${formatDate(impact.updatedAt)}.`}>
        <div className="stats">
          <StatTile value={impact.catsInShelter} label="gatos no gatil hoje" />
          <StatTile value={impact.adoptionsThisYear} label="adoções este ano" />
          <StatTile value={impact.sterilizationsThisYear} label="esterilizações este ano" />
          <StatTile value={impact.volunteers} label="voluntários ativos" />
        </div>
        {impact.campaign ? (
          <div className="gn-stack gn-stack--s">
            <ProgressMeter label={impact.campaign.title} value={impact.campaign.current} max={impact.campaign.goal} valueText={`${impact.campaign.current} de ${impact.campaign.goal} ${impact.campaign.unit}`} />
            <div><Button href={impact.campaign.href}>Ajudar esta campanha</Button></div>
          </div>
        ) : null}
      </Section>

      {featured ? <FeaturedCat cat={featured} /> : null}

      <Section heading="Como posso ajudar?" intro="Responda a três perguntas e sugerimos a forma de ajudar que mais lhe convém.">
        <HelpQuiz />
      </Section>

      {others.length > 0 ? (
        <Section heading="Procuram família" intro="Todos vacinados, esterilizados e com chip.">
          <Grid>{others.map((cat) => <CatCard key={cat.id} cat={cat} />)}</Grid>
          <div className="action-row">
            <Button href="/adotar">Ver todos os gatos</Button>
            <Button href="/adotar/descobrir" variant="secondary">Descobrir o gato certo para mim</Button>
          </div>
        </Section>
      ) : null}

      <Section tone="soft" heading="Notícias">
        <Grid>
          {posts.slice(0, 3).map((post) => (
            <Card key={post.id} title={post.title} href={`/noticias/${post.slug}`} eyebrow={formatDate(post.publishedAt)} badges={<Badge tone={post.category === "urgente" ? "error" : "info"}>{postCategoryLabel[post.category]}</Badge>}>
              <p>{post.summary}</p>
            </Card>
          ))}
        </Grid>
        <div><Button href="/noticias" variant="secondary">Todas as notícias</Button></div>
      </Section>

      {endings.length > 0 ? (
        <Section heading="Finais felizes" intro="Cada adoção abre lugar para resgatarmos outro gato.">
          <Grid>
            {endings.slice(0, 2).map(({ cat, happyEnding }) => (
              <Card key={cat.id} title={cat.name} href={`/adotar/${cat.slug}`} media={{ src: (happyEnding?.photo ?? cat.photos[0]!).url, alt: (happyEnding?.photo ?? cat.photos[0]!).alt }}>
                <p>“{happyEnding?.text ?? cat.summary}”</p>
              </Card>
            ))}
          </Grid>
          <div><Button href="/finais-felizes" variant="secondary">Ver mais finais felizes</Button></div>
        </Section>
      ) : null}

      {partners.length > 0 ? (
        <Section tone="soft" heading="Parceiros que nos apoiam" intro={partners.map((p) => p.name).join(" · ")}>
          <div className="action-row">
            <Button href="/parceiros" variant="secondary">Ver parceiros e vantagens</Button>
            <Button href="/parceiros#seja-parceiro" variant="quiet">Tenho um negócio e quero ajudar</Button>
          </div>
        </Section>
      ) : null}
    </>
  );
}
