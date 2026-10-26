import { Button, Container, ProgressMeter, Section, StatTile } from "@gn/ui";
import { PageHero } from "@/components/PageHero";
import { getImpact, getPage } from "@/lib/content";
import { When } from "@/components/When";
import { buildMetadata } from "@/lib/seo";
import { TeamBanner } from "@/components/TeamBanner";
import { teamPhoto } from "@/lib/equipa";

export async function generateMetadata() {
  const page = await getPage("/sobre");
  return buildMetadata({ path: "/sobre", title: page.heading, description: page.intro, overrides: page.seo });
}

export default async function AboutPage() {
  const [page, impact] = await Promise.all([getPage("/sobre"), getImpact()]);
  return (
    <>
      <PageHero heading={page.heading} intro={page.intro} crumbs={[{ href: "/", label: "Início" }, { label: "Sobre nós" }]} />
      <Container>
        <TeamBanner photo={teamPhoto} />
      </Container>
      <Container narrow>
        <div className="gn-stack gn-stack--m">
          <h2>A nossa missão</h2>
          <ul className="gn-stack gn-stack--s">
            <li><strong>Sensibilizar</strong> contra o abandono e os maus tratos, que são crime desde a Lei 69/2014.</li>
            <li><strong>Esterilizar:</strong> o programa CED (capturar, esterilizar, devolver) é a forma mais eficaz de controlar as colónias de rua.</li>
            <li><strong>Cuidar das colónias</strong> com abrigos para o frio, alimentação e cuidados de saúde.</li>
            <li><strong>Adoção responsável:</strong> um gato é da família para toda a vida.</li>
            <li><strong>Animais comunitários:</strong> promover a presença responsável de animais em escolas, casas e outros espaços.</li>
          </ul>
          <h2>O nosso percurso</h2>
          <ul className="gn-stack gn-stack--s">
            <li><strong>2013:</strong> um grupo de cidadãos começa a cuidar dos gatos de rua de Viana do Castelo.</li>
            <li><strong>Novembro de 2014:</strong> nasce oficialmente a Associação Gatos de Ninguém.</li>
            <li><strong>Julho de 2022:</strong> abre o gatil em Santa Marta de Portuzelo.</li>
          </ul>
          <div className="action-row">
            <Button href="/ajudar">Como posso ajudar</Button>
            <Button href="/finais-felizes" variant="secondary">Ver finais felizes</Button>
          </div>
        </div>
      </Container>
      <Section tone="ink" heading="O nosso trabalho em números" intro={<>Atualizado a <When iso={impact.updatedAt} />.</>}>
        <div className="stats">
          <StatTile value={impact.catsInShelter} label="gatos no gatil hoje" />
          <StatTile value={impact.adoptionsThisYear} label="adoções este ano" />
          <StatTile value={impact.sterilizationsThisYear} label="esterilizações este ano" />
          <StatTile value={impact.volunteers} label="voluntários ativos" />
        </div>
        {impact.campaign ? (
          <div className="gn-stack gn-stack--s">
            <ProgressMeter label={impact.campaign.title} value={impact.campaign.current} max={impact.campaign.goal} valueText={`${impact.campaign.current} de ${impact.campaign.goal} ${impact.campaign.unit}`} />
            <div><Button href={impact.campaign.href}>Ajudar esta campanha</Button></div>
          </div>
        ) : null}
      </Section>
    </>
  );
}
