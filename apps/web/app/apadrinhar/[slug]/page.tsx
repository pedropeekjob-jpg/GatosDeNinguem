import { notFound } from "next/navigation";
import { Container } from "@gn/ui";
import { FormModal } from "@/components/client/FormModal";
import { SponsorForm } from "@/components/forms/SponsorForm";
import { PageHero } from "@/components/PageHero";
import { getCat, listCats } from "@/lib/content";
import { buildMetadata } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  // Pre-rendering is only a speed-up: if the API is down, the pages are built on request instead.
  return (await listCats().catch(() => [])).filter((c) => c.status !== "adotado").map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props) {
  const cat = await getCat((await params).slug);
  if (!cat) return {};
  return buildMetadata({ path: `/apadrinhar/${cat.slug}`, title: `Apadrinhar ${cat.name}`, overrides: { noindex: true } });
}

export default async function SponsorCatPage({ params }: Props) {
  const cat = await getCat((await params).slug);
  if (!cat || cat.status === "adotado") notFound();
  const pronoun = cat.sex === "femea" ? "a" : "o";
  const photo = cat.photos[0]!;
  return (
    <>
      <PageHero
        heading={`Apadrinhar ${pronoun} ${cat.name}`}
        intro={`Ajude todos os meses com a comida e o veterinário d${pronoun} ${cat.name} e receba notícias. Leva dois minutos.`}
        crumbs={[{ href: "/", label: "Início" }, { href: "/apadrinhar", label: "Apadrinhar" }, { label: cat.name }]}
      />
      <Container narrow>
        <div className="sponsor-cat">
          <img src={photo.url} alt={photo.alt} width={160} height={120} />
          <div>
            <p className="sponsor-cat__name">{cat.name}</p>
            <p>{cat.summary}</p>
            <p><a href={`/adotar/${cat.slug}`}>Conhecer a história d{pronoun} {cat.name}</a></p>
          </div>
        </div>
        <div className="action-row">
          <FormModal label={`Quero apadrinhar ${pronoun} ${cat.name}`} title={`Apadrinhar ${pronoun} ${cat.name}`} intro="Escolha o valor e como quer contribuir. Depois acompanha tudo na sua conta.">
            <SponsorForm catSlug={cat.slug} catName={cat.name} pronoun={pronoun} />
          </FormModal>
        </div>
      </Container>
    </>
  );
}
