import { adoptionFaq, adoptionSteps } from "@gn/domain";
import { breadcrumbJsonLd, faqJsonLd } from "@gn/seo";
import { Button, Container } from "@gn/ui";
import { AdoptionSteps } from "@/components/AdoptionSteps";
import { JsonLd } from "@/components/JsonLd";
import { PageHero } from "@/components/PageHero";
import { getPage, getSeoSettings } from "@/lib/content";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata() {
  const page = await getPage("/adotar/perguntas");
  return buildMetadata({ path: "/adotar/perguntas", title: page.heading, description: page.intro, overrides: page.seo });
}

export default async function AdoptionQuestionsPage() {
  const [page, settings] = await Promise.all([getPage("/adotar/perguntas"), getSeoSettings()]);
  return (
    <>
      <PageHero heading={page.heading} intro={page.intro} crumbs={[{ href: "/", label: "Início" }, { href: "/adotar", label: "Adotar" }, { label: "Perguntas" }]} />
      <Container>
        <div className="gn-stack gn-stack--l">
          <div className="faq">
            {adoptionFaq.map(({ q, a }) => (
              <details key={q}>
                <summary>{q}</summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
          <h2>Como funciona a adoção</h2>
          <AdoptionSteps steps={adoptionSteps} />
          <div className="action-row">
            <Button href="/adotar">Ver os gatos</Button>
            <Button href="/adotar/descobrir" variant="secondary">Ajude-me a escolher</Button>
          </div>
        </div>
      </Container>
      <JsonLd data={[breadcrumbJsonLd(settings, [{ name: "Início", path: "/" }, { name: "Adotar", path: "/adotar" }, { name: "Perguntas", path: "/adotar/perguntas" }]), faqJsonLd(adoptionFaq)]} />
    </>
  );
}
