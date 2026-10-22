import { AnimatedLogo, Button, Container } from "@gn/ui";
import { FeaturedCat } from "@/components/FeaturedCat";
import { FavoritesStrip } from "@/components/client/FavoritesStrip";
import { getPage, listCats } from "@/lib/content";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata() {
  const page = await getPage("/");
  return buildMetadata({ path: "/", title: page.heading, description: page.intro, overrides: page.seo });
}

export default async function HomePage() {
  // Kept short on purpose: a welcome with the three main paths, and one cat to meet. Everything else has its own page.
  const [page, cats] = await Promise.all([getPage("/"), listCats("para-adocao")]);
  // Gato da semana: rotates weekly, favouring cats that wait longest for attention (seniors first).
  const week = Math.floor(Date.now() / (7 * 24 * 3600 * 1000));
  const ordered = [...cats].sort((a, b) => b.ageYears - a.ageYears);
  const featured = ordered.length ? ordered[week % ordered.length] : undefined;

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
            <div className="home-hero__art">
              <AnimatedLogo size={380} />
            </div>
          </div>
        </Container>
      </section>

      {featured ? <FeaturedCat cat={featured} /> : null}

    </>
  );
}
