import { partnerCategoryLabel, type Perk } from "@gn/domain";
import { Badge, Card, Container, Grid, Section } from "@gn/ui";
import { FormModal } from "@/components/client/FormModal";
import { PartnerApplicationForm } from "@/components/forms/PartnerApplicationForm";
import { PageHero } from "@/components/PageHero";
import { getPage, listPartners } from "@/lib/content";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata() {
  const page = await getPage("/parceiros");
  return buildMetadata({ path: "/parceiros", title: page.heading, description: page.intro, overrides: page.seo });
}

const withPatinhas = (perk: Perk) =>
  perk.patinhasCost ? [{ label: "Com Patinhas", value: [`${perk.patinhasCost} Patinhas`, perk.minLevel ? `a partir do nível ${perk.minLevel}` : null].filter(Boolean).join(", ") }] : [];

const audience: Record<Perk["audience"], string> = { amigos: "Para Amigos da associação", voluntarios: "Para voluntários", todos: "Para todos" };

export default async function PartnersPage() {
  const [page, partners] = await Promise.all([getPage("/parceiros"), listPartners()]);
  return (
    <>
      <PageHero heading={page.heading} intro={page.intro} crumbs={[{ href: "/", label: "Início" }, { label: "Parceiros" }]} />
      <Section>
        <Grid min="20rem">
          {partners.map((p) => (
            <Card
              key={p.id}
              titleAs="h2"
              title={p.name}
              href={p.website}
              eyebrow={`${partnerCategoryLabel[p.category]} · ${p.town}`}
              media={p.logo ? { src: p.logo.url, alt: p.logo.alt } : undefined}
              meta={p.perks.flatMap((perk) => [{ label: audience[perk.audience], value: perk.description }, ...withPatinhas(perk)])}
              badges={p.category === "veterinario" ? <Badge tone="info">Clínica parceira</Badge> : undefined}
            >
              {p.why ? <p>{p.why}</p> : null}
            </Card>
          ))}
        </Grid>
        <p className="small muted">Para usar uma vantagem, mostre o seu cartão de Amigo ou diga que vem da parte da Gatos de Ninguém. Também pode trocar <a href="/patinhas">Patinhas</a> por vantagens na <a href="/conta">sua conta</a>.</p>
      </Section>
      <section id="seja-parceiro" className="gn-section gn-section--soft">
        <Container narrow>
          <div className="gn-stack gn-stack--m">
            <h2>Seja parceiro</h2>
            <p className="gn-lead">Tem um negócio em Viana do Castelo ou arredores? Ofereça uma vantagem a quem ajuda os gatos e nós divulgamos o seu negócio.</p>
            <ul className="gn-stack gn-stack--s">
              <li>O seu negócio nesta página e nas nossas redes sociais</li>
              <li>Um autocolante “Parceiro Gatos de Ninguém” para a montra</li>
              <li>Um resumo anual do que ajudou a conseguir</li>
            </ul>
            <div className="action-row">
              <FormModal label="Quero ser parceiro" title="Seja parceiro" intro="Leva dois minutos. Entramos em contacto para combinar a vantagem.">
                <PartnerApplicationForm />
              </FormModal>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
