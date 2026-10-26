import { AnimatedLogo, Button, Carousel, Container } from "@gn/ui";
import { CatRail } from "@/components/CatRail";
import { DonateBand } from "@/components/DonateBand";
import { FeaturedCat } from "@/components/FeaturedCat";
import { HappyEndings } from "@/components/HappyEndings";
import { PatinhasTeaser } from "@/components/PatinhasTeaser";
import { FavoritesStrip } from "@/components/client/FavoritesStrip";
import { getImpact, getPage, listCats, listHappyEndings } from "@/lib/content";
import { features } from "@/lib/features";
import { localizePage } from "@/lib/i18n/content";
import { langFrom, type LangProps } from "@/lib/i18n/server";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: LangProps) {
  const { lang } = await langFrom(params);
  const page = localizePage(await getPage("/"), lang);
  return buildMetadata({ path: "/", title: page.heading, description: page.intro, overrides: page.seo });
}

export default async function HomePage({ params }: LangProps) {
  const { lang, t, l } = await langFrom(params);
  // Adopting and donating come first: the welcome leads to both, then the cats waiting, then how to give.
  // Everything else stays on the page, further down.
  const [ptPage, cats, happy, impact] = await Promise.all([getPage("/"), listCats("para-adocao"), listHappyEndings(), getImpact()]);
  const page = localizePage(ptPage, lang);
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
        <Carousel hero slides={slides} label={t({ pt: "Fotografias do gatil", en: "Photos of the shelter", es: "Fotos del refugio", fr: "Photos du refuge" })} autoplay={page.carousel?.autoplay} intervalSeconds={page.carousel?.intervalSeconds} />
        <div className="home-top__over">
          <Container>
            <div className="home-hero__text">
              <h1 id="boas-vindas">{page.heading}</h1>
              <p className="gn-lead" lang={page.ptOnly ? "pt-PT" : undefined}>{firstSentence}{more.length ? <span className="home-hero__more"> {more.join(" ")}</span> : null}</p>
              <div className="home-actions">
                <Button href={l("/adotar")}>{t({ pt: "Quero adotar", en: "I want to adopt", es: "Quiero adoptar", fr: "Je veux adopter" })}</Button>
                <Button href={l("/doar")} variant="secondary">{t({ pt: "Quero doar", en: "I want to donate", es: "Quiero donar", fr: "Je veux donner" })}</Button>
              </div>
              <p className="home-more"><a href={l("/ajudar")}>{t({ pt: "Outras formas de ajudar", en: "Other ways to help", es: "Otras formas de ayudar", fr: "Autres façons d’aider" })}</a></p>
            </div>
          </Container>
        </div>
      </section>

      {/* Cats a visitor saved earlier, so they can pick up where they left off. */}
      <div className="home-favorites"><Container><FavoritesStrip cats={cats} /></Container></div>

      {/* Every cat looking for a home, one swipe away; the cat of the week has its own section below. */}
      <CatRail cats={ordered.filter((c) => c !== featured)} total={cats.length} />

      {/* For those who can't adopt: donate, or sponsor a cat. */}
      <DonateBand impact={impact} />

      {/* Proof that it works: the newest adoptions, right after the cats still waiting. */}
      <HappyEndings items={happy} />

      {featured ? <FeaturedCat cat={featured} /> : null}

      {features.patinhas ? (
        <section className="home-next">
          <Container>
            <div className="home-next__grid">
              <PatinhasTeaser />
              <div className="home-next__art" aria-hidden="true">
                <AnimatedLogo size={200} />
              </div>
            </div>
          </Container>
        </section>
      ) : null}
    </>
  );
}
