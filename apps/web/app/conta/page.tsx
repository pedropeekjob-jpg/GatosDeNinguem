import { Container } from "@gn/ui";
import { ContaApp } from "@/components/client/conta/ContaApp";
import { PageHero } from "@/components/PageHero";
import { getPage } from "@/lib/content";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata() {
  const page = await getPage("/conta");
  return buildMetadata({ path: "/conta", title: page.heading, description: page.intro, overrides: page.seo });
}

export default async function AccountPage() {
  const page = await getPage("/conta");
  return (
    <>
      <PageHero heading={page.heading} intro={page.intro} crumbs={[{ href: "/", label: "Início" }, { label: "A minha conta" }]} />
      <Container narrow>
        <ContaApp />
        <p className="small muted conta-saber-mais"><a href="/patinhas">Como funcionam as Patinhas</a></p>
      </Container>
    </>
  );
}
