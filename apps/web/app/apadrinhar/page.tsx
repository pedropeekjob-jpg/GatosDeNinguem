import { isSenior } from "@gn/domain";
import { Grid, Section } from "@gn/ui";
import { CatCard } from "@/components/CatCard";
import { PageHero } from "@/components/PageHero";
import { listCats, type PublicCat } from "@/lib/content";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata() {
  return buildMetadata({ path: "/apadrinhar", title: "Apadrinhar um gato", description: "A partir de 5 euros por mês ajuda a pagar a comida e o veterinário de um gato do gatil, e recebe notícias dele." });
}

/** Cats who need it most first: still recovering, seniors and those with special care. */
const need = (c: PublicCat) => (c.status === "a-recuperar" ? 2 : 0) + (isSenior(c) || c.specialNeeds ? 1 : 0);

export default async function SponsorPage() {
  const cats = (await listCats()).filter((c) => c.status !== "adotado").sort((a, b) => need(b) - need(a));
  return (
    <>
      <PageHero
        heading="Apadrinhar um gato"
        intro="Escolha um gato e ajude todos os meses com a comida e o veterinário. Recebe fotografias e notícias do seu afilhado. Não precisa de o levar para casa."
        crumbs={[{ href: "/", label: "Início" }, { href: "/ajudar", label: "Ajudar" }, { label: "Apadrinhar" }]}
      />
      <Section heading="Escolha o seu afilhado" intro="Os gatos que estão a recuperar, os seniores e os que precisam de cuidados especiais aparecem primeiro: são os que mais precisam.">
        <Grid>{cats.map((cat) => <CatCard key={cat.id} cat={cat} sponsor />)}</Grid>
      </Section>
      <Section tone="soft" heading="Como funciona">
        <ol className="gn-stack gn-stack--s">
          <li>Escolhe um gato e diz-nos quanto quer dar por mês, a partir de 5 euros.</li>
          <li>Entramos em contacto para combinar a contribuição.</li>
          <li>Todos os meses recebe fotografias e notícias do seu afilhado.</li>
          <li>Pode parar quando quiser, basta avisar-nos.</li>
        </ol>
      </Section>
    </>
  );
}
