import { AnimatedLogo, Button, Carousel, Container } from "@gn/ui";
import { CatRail } from "@/components/CatRail";
import { FeaturedCat } from "@/components/FeaturedCat";
import { PatinhasTeaser } from "@/components/PatinhasTeaser";
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
  // Shelter photos, managed in the back office (Fotos do gatil).
  const slides = (page.gallery ?? []).filter((p) => !p.hidden).map((p) => ({ src: p.url, alt: p.alt, caption: p.caption }));
  // Phones show only the first sentence of the welcome: one idea, then the buttons.
  const [firstSentence, ...more] = page.intro.split(/(?<=[.!?])\s+/);

  return (
    <>
      {/* The page opens on the shelter's own photos, with the welcome laid over them on wide screens and right below them on phones. */}
      <section className={slides.length ? "home-top" : "home-top home-top--plain"} aria-labelledby="boas-vindas">
        <Carousel hero slides={slides} label="Fotografias do gatil" autoplay={page.carousel?.autoplay} intervalSeconds={page.carousel?.intervalSeconds} />
        <div className="home-top__over">
          <Container>
            <div className="home-hero__text">
              <h1 id="boas-vindas">{page.heading}</h1>
              <p className="gn-lead">{firstSentence}{more.length ? <span className="home-hero__more"> {more.join(" ")}</span> : null}</p>
              <div className="home-actions">
                <Button href="/adotar">Quero adotar</Button>
                <Button href="/ajudar" variant="secondary">Quero ajudar</Button>
                <Button href="/sos" variant="urgent">Encontrei um gato</Button>
              </div>
            </div>
          </Container>
        </div>
      </section>

      <section className="home-next">
        <Container>
          <div className="home-next__grid">
            <div className="gn-stack gn-stack--m">
              <PatinhasTeaser />
              <FavoritesStrip cats={cats} />
            </div>
            <div className="home-next__art" aria-hidden="true">
              <AnimatedLogo size={200} />
            </div>
          </div>
        </Container>
      </section>

      {/* Every cat looking for a home, one swipe away; the cat of the week has its own section below. */}
      <CatRail cats={ordered.filter((c) => c !== featured)} total={cats.length} />

      {featured ? <FeaturedCat cat={featured} /> : null}
    </>
  );
}
