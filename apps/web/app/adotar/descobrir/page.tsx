import { Container } from "@gn/ui";
import { Discover } from "@/components/client/Discover";
import { PageHero } from "@/components/PageHero";
import { getPage, listCats } from "@/lib/content";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata() {
  const page = await getPage("/adotar/descobrir");
  return buildMetadata({ path: "/adotar/descobrir", title: page.heading, description: page.intro, overrides: page.seo });
}

export default async function DiscoverPage() {
  const [page, cats] = await Promise.all([getPage("/adotar/descobrir"), listCats("para-adocao")]);
  return (
    <>
      <PageHero heading={page.heading} intro={page.intro} crumbs={[{ href: "/", label: "Início" }, { href: "/adotar", label: "Adotar" }, { label: "Descobrir" }]} />
      <Container narrow>
        <Discover cats={cats} />
      </Container>
    </>
  );
}
