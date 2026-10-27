import { notFound } from "next/navigation";
import { Container } from "@gn/ui";
import { FormModal } from "@/components/client/FormModal";
import { SponsorForm } from "@/components/forms/SponsorForm";
import { PageHero } from "@/components/PageHero";
import { getCat, listCats } from "@/lib/content";
import { localizeCat } from "@/lib/i18n/content";
import { crumbs } from "@/lib/i18n/labels";
import { langFrom, type LangProps } from "@/lib/i18n/server";
import { buildMetadata } from "@/lib/seo";

type Props = LangProps<{ slug: string }>;

export async function generateStaticParams() {
  // Pre-rendering is only a speed-up: if the API is down, the pages are built on request instead.
  return (await listCats().catch(() => [])).filter((c) => c.status !== "adotado").map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { t } = await langFrom(params);
  const cat = await getCat((await params).slug);
  if (!cat) return {};
  return buildMetadata({ path: `/apadrinhar/${cat.slug}`, title: t({ pt: `Apadrinhar ${cat.name}`, en: `Sponsor ${cat.name}`, es: `Apadrinar a ${cat.name}`, fr: `Parrainer ${cat.name}` }), overrides: { noindex: true } });
}

export default async function SponsorCatPage({ params }: Props) {
  const { lang, t, l } = await langFrom(params);
  const found = await getCat((await params).slug);
  if (!found || found.status === "adotado") notFound();
  const cat = localizeCat(found, lang);
  const pronoun = cat.sex === "femea" ? "a" : "o";
  const photo = cat.photos[0]!;
  const name = cat.name;
  const c = crumbs[lang];
  const title = t({ pt: `Apadrinhar ${pronoun} ${name}`, en: `Sponsor ${name}`, es: `Apadrinar a ${name}`, fr: `Parrainer ${name}` });
  return (
    <>
      <PageHero
        heading={title}
        intro={t({ pt: `Ajude todos os meses com a comida e o veterinário d${pronoun} ${name} e receba notícias. Leva dois minutos.`, en: `Help every month with ${name}’s food and vet care, and get news. It takes two minutes.`, es: `Ayude cada mes con la comida y el veterinario de ${name} y reciba noticias. Son dos minutos.`, fr: `Aidez chaque mois pour la nourriture et le vétérinaire de ${name} et recevez des nouvelles. Cela prend deux minutes.` })}
        crumbs={[{ href: "/", label: c.home }, { href: "/apadrinhar", label: c.sponsor }, { label: name }]}
      />
      <Container narrow>
        <div className="sponsor-cat">
          <img src={photo.url} alt={photo.alt} width={160} height={120} />
          <div>
            <p className="sponsor-cat__name">{name}</p>
            <p lang={cat.ptOnly ? "pt-PT" : undefined}>{cat.summary}</p>
            <p><a href={l(`/adotar/${cat.slug}`)}>{t({ pt: `Conhecer a história d${pronoun} ${name}`, en: `Read ${name}’s story`, es: `Conocer la historia de ${name}`, fr: `Découvrir l’histoire de ${name}` })}</a></p>
          </div>
        </div>
        <div className="action-row">
          <FormModal label={t({ pt: `Quero apadrinhar ${pronoun} ${name}`, en: `I want to sponsor ${name}`, es: `Quiero apadrinar a ${name}`, fr: `Je veux parrainer ${name}` })} title={title} intro={t({ pt: "Escolha o valor e como quer contribuir. Depois acompanha tudo na sua conta.", en: "Choose the amount and how you’d like to give. Then you can follow everything in your account.", es: "Elija la cantidad y cómo quiere contribuir. Después lo sigue todo en su cuenta.", fr: "Choisissez le montant et la façon de contribuer. Ensuite, vous suivez tout dans votre compte." })}>
            <SponsorForm catSlug={cat.slug} catName={name} pronoun={pronoun} />
          </FormModal>
        </div>
      </Container>
    </>
  );
}
