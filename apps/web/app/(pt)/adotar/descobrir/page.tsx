import { Container } from "@gn/ui";
import { Discover } from "@/components/client/Discover";
import { PageHero } from "@/components/PageHero";
import { getPage, listCats } from "@/lib/content";
import { localizeCat, localizePage } from "@/lib/i18n/content";
import { crumbs } from "@/lib/i18n/labels";
import { langFrom, type LangProps } from "@/lib/i18n/server";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: LangProps) {
  const { lang } = await langFrom(params);
  const page = localizePage(await getPage("/adotar/descobrir"), lang);
  return buildMetadata({ path: "/adotar/descobrir", title: page.heading, description: page.intro, overrides: page.seo });
}

export default async function DiscoverPage({ params }: LangProps) {
  const { lang, t } = await langFrom(params);
  const [ptPage, cats] = await Promise.all([getPage("/adotar/descobrir"), listCats("para-adocao")]);
  const page = localizePage(ptPage, lang);
  const c = crumbs[lang];
  return (
    <>
      <PageHero heading={page.heading} intro={page.intro} introLang={page.ptOnly ? "pt-PT" : undefined} crumbs={[{ href: "/", label: c.home }, { href: "/adotar", label: c.adopt }, { label: t({ pt: "Descobrir", en: "Find my cat", es: "Descubrir", fr: "Trouver mon chat" }) }]} />
      <Container narrow>
        <Discover cats={cats.map((cat) => localizeCat(cat, lang))} />
      </Container>
    </>
  );
}
