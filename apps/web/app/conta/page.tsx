import { Container } from "@gn/ui";
import { ContaApp } from "@/components/client/conta/ContaApp";
import { PageHero } from "@/components/PageHero";
import { getPage } from "@/lib/content";
import { features } from "@/lib/features";
import { buildMetadata } from "@/lib/seo";

// The page's own intro talks about Patinhas; while they are switched off it says what the account is for now.
const introSemPatinhas = "A sua área pessoal: os turnos no gatil, os gatos a cuidar e as notificações. Para entrar só precisa do email ou do telemóvel.";

async function accountPage() {
  const page = await getPage("/conta");
  return features.patinhas ? page : { ...page, intro: introSemPatinhas };
}

export async function generateMetadata() {
  const page = await accountPage();
  return buildMetadata({ path: "/conta", title: page.heading, description: page.intro, overrides: page.seo });
}

export default async function AccountPage() {
  const page = await accountPage();
  return (
    <>
      <PageHero heading={page.heading} intro={page.intro} crumbs={[{ href: "/", label: "Início" }, { label: "A minha conta" }]} />
      <Container narrow>
        <ContaApp />
        {features.patinhas ? <p className="small muted conta-saber-mais"><a href="/patinhas">Como funcionam as Patinhas</a></p> : null}
      </Container>
    </>
  );
}
