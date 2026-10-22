import { Container } from "@gn/ui";
import { SosGuide } from "@/components/client/SosGuide";
import { PageHero } from "@/components/PageHero";
import { getPage } from "@/lib/content";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata() {
  const page = await getPage("/sos");
  return buildMetadata({ path: "/sos", title: page.heading, description: page.intro, overrides: page.seo });
}

export default async function SosPage() {
  const page = await getPage("/sos");
  return (
    <>
      <PageHero heading={page.heading} intro={page.intro} crumbs={[{ href: "/", label: "Início" }, { label: "Encontrei um gato" }]} />
      <Container narrow>
        <SosGuide />
      </Container>
    </>
  );
}
