import { notFound } from "next/navigation";
import { Container } from "@gn/ui";
import { AdoptionInterestForm } from "@/components/forms/AdoptionInterestForm";
import { PageHero } from "@/components/PageHero";
import { getCat, listCats } from "@/lib/content";
import { crumbs } from "@/lib/i18n/labels";
import { langFrom, type LangProps } from "@/lib/i18n/server";
import { buildMetadata } from "@/lib/seo";

type Props = LangProps<{ slug: string }>;

export async function generateStaticParams() {
  // Pre-rendering is only a speed-up: if the API is down, the pages are built on request instead.
  return (await listCats("para-adocao").catch(() => [])).map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { t } = await langFrom(params);
  const cat = await getCat((await params).slug);
  if (!cat) return {};
  return buildMetadata({ path: `/adotar/${cat.slug}/conhecer`, title: t({ pt: `Conhecer ${cat.name}`, en: `Meet ${cat.name}`, es: `Conocer a ${cat.name}`, fr: `Rencontrer ${cat.name}` }), overrides: { noindex: true } });
}

export default async function MeetCatPage({ params }: Props) {
  const { lang, t } = await langFrom(params);
  const cat = await getCat((await params).slug);
  if (!cat || cat.status !== "para-adocao") notFound();
  const pronoun = cat.sex === "femea" ? "a" : "o";
  const c = crumbs[lang];
  return (
    <>
      <PageHero
        heading={t({ pt: `Quero conhecer ${pronoun} ${cat.name}`, en: `I’d like to meet ${cat.name}`, es: `Quiero conocer a ${cat.name}`, fr: `Je veux rencontrer ${cat.name}` })}
        intro={t({ pt: "Deixe o seu contacto. Ligamos-lhe para conversar e marcar uma visita. Não precisa de decidir nada agora.", en: "Leave your details. We’ll call you for a chat and to arrange a visit. You don’t have to decide anything now.", es: "Deje su contacto. Le llamamos para hablar y concertar una visita. No tiene que decidir nada ahora.", fr: "Laissez vos coordonnées. Nous vous appelons pour discuter et fixer une visite. Vous n’avez rien à décider maintenant." })}
        crumbs={[{ href: "/", label: c.home }, { href: "/adotar", label: c.adopt }, { href: `/adotar/${cat.slug}`, label: cat.name }, { label: t({ pt: "Quero conhecer", en: "Meet", es: "Quiero conocerlo", fr: "Rencontrer" }) }]}
      />
      <Container narrow>
        <AdoptionInterestForm catSlug={cat.slug} catName={cat.name} />
      </Container>
    </>
  );
}
