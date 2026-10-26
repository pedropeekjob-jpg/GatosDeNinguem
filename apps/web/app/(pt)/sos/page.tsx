import { Container } from "@gn/ui";
import { SosGuide } from "@/components/client/SosGuide";
import { PageHero } from "@/components/PageHero";
import { getPage } from "@/lib/content";
import { localizePage } from "@/lib/i18n/content";
import { crumbs } from "@/lib/i18n/labels";
import { langFrom, type LangProps } from "@/lib/i18n/server";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: LangProps) {
  const { lang } = await langFrom(params);
  const page = localizePage(await getPage("/sos"), lang);
  return buildMetadata({ path: "/sos", title: page.heading, description: page.intro, overrides: page.seo });
}

export default async function SosPage({ params }: LangProps) {
  const { lang, t } = await langFrom(params);
  const page = localizePage(await getPage("/sos"), lang);
  return (
    <>
      <PageHero heading={page.heading} intro={page.intro} introLang={page.ptOnly ? "pt-PT" : undefined} crumbs={[{ href: "/", label: crumbs[lang].home }, { label: t({ pt: "Encontrei um gato", en: "I found a cat", es: "He encontrado un gato", fr: "J’ai trouvé un chat" }) }]} />
      <Container narrow>
        <SosGuide />
      </Container>
    </>
  );
}
