import { Button, Container, Notice, Section } from "@gn/ui";
import { CopyIban } from "@/components/client/CopyIban";
import { PageHero } from "@/components/PageHero";
import { buildMetadata } from "@/lib/seo";

const intro = "Qualquer valor ajuda a pagar a comida e o veterinário. 35 euros pagam uma esterilização.";

export async function generateMetadata() {
  return buildMetadata({ path: "/ajudar/doar", title: "Fazer um donativo", description: intro });
}

// IBAN as published on the association's current website.
const IBAN = "PT50 0045 1436 4033 0203 2321 6";

export default function DonatePage() {
  return (
    <>
      <PageHero heading="Fazer um donativo" intro={intro} crumbs={[{ href: "/", label: "Início" }, { href: "/ajudar", label: "Ajudar" }, { label: "Donativo" }]} />
      <Section heading="Por transferência bancária">
        <div className="gn-stack gn-stack--m">
          <p>Pode transferir qualquer valor para a conta da associação. Indique o seu NIF na descrição se quiser recibo.</p>
          <CopyIban iban={IBAN} />
          <Notice tone="info" title="Em breve: MB WAY e cartão">Estamos a preparar pagamentos por MB WAY, Multibanco e cartão diretamente no site.</Notice>
        </div>
      </Section>
      <section className="gn-section gn-section--soft">
        <Container narrow>
          <div className="gn-stack gn-stack--m">
            <h2>Também aceitamos bens</h2>
            <p>Areia, ração seca, ração húmida para gatinhos e mantas. Entregue no gatil aos sábados de manhã.</p>
            <div className="action-row"><Button href="/loja" variant="secondary">Doar artigos para a loja solidária</Button></div>
          </div>
        </Container>
      </section>
    </>
  );
}
