import { Button, Card, Container, Grid, Notice, ProgressMeter, Section } from "@gn/ui";
import { CopyIban } from "@/components/client/CopyIban";
import { PageHero } from "@/components/PageHero";
import { getImpact, getPage } from "@/lib/content";
import { IBAN } from "@/lib/donations";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata() {
  const page = await getPage("/doar");
  return buildMetadata({ path: "/doar", title: page.heading, description: page.intro, overrides: page.seo });
}

/** Every way of giving, on one page: money now first, then monthly, yearly, shopping and goods. */
export default async function DonatePage() {
  const [page, impact] = await Promise.all([getPage("/doar"), getImpact()]);
  return (
    <>
      <PageHero heading={page.heading} intro={page.intro} crumbs={[{ href: "/", label: "Início" }, { label: "Doar" }]} />

      <section id="transferencia" className="gn-section">
        <Container narrow>
          <div className="gn-stack gn-stack--m">
            <h2>Transferência bancária</h2>
            <p>Transfira qualquer valor para a conta da associação. Indique o seu NIF na descrição se quiser recibo. 35 euros pagam uma esterilização.</p>
            <CopyIban iban={IBAN} />
            <Notice tone="info" title="Em breve: MB WAY e cartão">Estamos a preparar pagamentos por MB WAY, Multibanco e cartão diretamente no site.</Notice>
          </div>
        </Container>
      </section>

      {impact.campaign ? (
        <Section tone="soft" heading="Campanha a decorrer">
          <ProgressMeter label={impact.campaign.title} value={impact.campaign.current} max={impact.campaign.goal} valueText={`${impact.campaign.current} de ${impact.campaign.goal} ${impact.campaign.unit}`} />
        </Section>
      ) : null}

      <Section heading="Outras formas de doar">
        <Grid min="16rem">
          <Card title="Apadrinhar um gato" href="/apadrinhar"><p>Um valor por mês para a comida e o veterinário de um gato. Recebe fotografias e notícias dele.</p></Card>
          <Card title="Ser Amigo da associação" href="/ajudar#amigo"><p>24 euros por ano, com 10% a 15% de desconto nos parceiros.</p></Card>
          <Card title="Comprar na loja solidária" href="/loja"><p>T-shirts, canecas e calendários. Também pode doar coisas para vender.</p></Card>
          <Card title="Doar comida e mantas" href="#bens"><p>Areia, ração e mantas, entregues no gatil.</p></Card>
        </Grid>
      </Section>

      <section id="bens" className="gn-section gn-section--soft">
        <Container narrow>
          <div className="gn-stack gn-stack--m">
            <h2>Doar comida e mantas</h2>
            <p>Aceitamos areia, ração seca, ração húmida para gatinhos e mantas. Entregue no gatil aos sábados de manhã.</p>
            <div className="action-row"><Button href="/adotar" variant="secondary">Conhecer os gatos que ajuda</Button></div>
          </div>
        </Container>
      </section>
    </>
  );
}
