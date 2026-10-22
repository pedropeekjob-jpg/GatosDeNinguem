import { notFound } from "next/navigation";
import { Container } from "@gn/ui";
import { AdoptionInterestForm } from "@/components/forms/AdoptionInterestForm";
import { PageHero } from "@/components/PageHero";
import { getCat, listCats } from "@/lib/content";
import { buildMetadata } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return (await listCats("para-adocao")).map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props) {
  const cat = await getCat((await params).slug);
  if (!cat) return {};
  return buildMetadata({ path: `/adotar/${cat.slug}/conhecer`, title: `Conhecer ${cat.name}`, overrides: { noindex: true } });
}

export default async function MeetCatPage({ params }: Props) {
  const cat = await getCat((await params).slug);
  if (!cat || cat.status !== "para-adocao") notFound();
  const pronoun = cat.sex === "femea" ? "a" : "o";
  return (
    <>
      <PageHero
        heading={`Quero conhecer ${pronoun} ${cat.name}`}
        intro="Deixe o seu contacto. Ligamos-lhe para conversar e marcar uma visita. Não precisa de decidir nada agora."
        crumbs={[{ href: "/", label: "Início" }, { href: "/adotar", label: "Adotar" }, { href: `/adotar/${cat.slug}`, label: cat.name }, { label: "Quero conhecer" }]}
      />
      <Container narrow>
        <AdoptionInterestForm catSlug={cat.slug} catName={cat.name} />
      </Container>
    </>
  );
}
