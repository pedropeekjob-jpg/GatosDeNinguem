import { Button, Card, Container, Grid, Notice, Section } from "@gn/ui";
import { CopyIban } from "@/components/client/CopyIban";
import { HelpQuiz } from "@/components/client/HelpQuiz";
import { PageHero } from "@/components/PageHero";
import { getPage } from "@/lib/content";
import { IBAN } from "@/lib/donations";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata() {
  const page = await getPage("/ajudar");
  return buildMetadata({ path: "/ajudar", title: page.heading, description: page.intro, overrides: page.seo });
}

export default async function HelpPage() {
  const page = await getPage("/ajudar");
  return (
    <>
      <PageHero heading={page.heading} intro={page.intro} crumbs={[{ href: "/", label: "Início" }, { label: "Ajudar" }]} />
      <Section>
        <Grid>
          <Card title="Adotar" href="/adotar"><p>Dê uma casa para sempre a um gato.</p></Card>
          <Card title="Apadrinhar" href="#apadrinhar"><p>Ajude um gato todos os meses e receba notícias dele.</p></Card>
          <Card title="Fazer um donativo" href="/doar"><p>Qualquer valor ajuda. 35 euros pagam uma esterilização.</p></Card>
          <Card title="Ser voluntário" href="#voluntariado"><p>Limpeza, transporte ao veterinário e eventos.</p></Card>
          <Card title="Família temporária" href="/ajudar/familia-temporaria"><p>Acolha um gato por umas semanas.</p></Card>
          <Card title="Comprar na loja solidária" href="/loja"><p>T-shirts, canecas e calendários. Também pode doar coisas para vender.</p></Card>
          <Card title="Ser Amigo" href="#amigo"><p>24 euros por ano, com descontos nos parceiros.</p></Card>
          <Card title="Ganhar Patinhas" href="/patinhas"><p>Cada ajuda dá Patinhas, que pode trocar por vantagens nos parceiros.</p></Card>
        </Grid>
      </Section>

      <Section tone="soft" heading="Não sabe por onde começar?">
        <HelpQuiz />
      </Section>

      <section id="doar" className="gn-section">
        <Container narrow>
          <div className="gn-stack gn-stack--m">
            <h2>Fazer um donativo</h2>
            <p>Pode transferir qualquer valor para a conta da associação. Indique o seu NIF na descrição se quiser recibo.</p>
            <CopyIban iban={IBAN} />
            <Notice tone="info" title="Em breve: MB WAY e cartão">Estamos a preparar pagamentos por MB WAY, Multibanco e cartão diretamente no site.</Notice>
            <p><strong>Também aceitamos:</strong> areia, ração seca, ração húmida para gatinhos e mantas. Entregue no gatil aos sábados de manhã.</p>
          </div>
        </Container>
      </section>

      <section id="apadrinhar" className="gn-section gn-section--soft">
        <Container narrow>
          <div className="gn-stack gn-stack--m">
            <h2>Apadrinhar um gato</h2>
            <p>Escolha um gato e contribua todos os meses para a comida e o veterinário. Recebe fotografias e notícias do seu afilhado. Os gatos seniores e com doenças crónicas são os que mais precisam.</p>
            <div className="action-row"><Button href="/apadrinhar">Escolher um gato para apadrinhar</Button></div>
          </div>
        </Container>
      </section>

      <section id="voluntariado" className="gn-section">
        <Container narrow>
          <div className="gn-stack gn-stack--m">
            <h2>Ser voluntário</h2>
            <p>Não precisa de experiência. Escolha o que lhe for mais fácil:</p>
            <ul className="gn-stack gn-stack--s">
              <li><strong>Limpeza e mimos no gatil:</strong> turnos de 2 horas, ao fim de semana ou durante a semana.</li>
              <li><strong>Transporte ao veterinário:</strong> se tem carro, leve gatos às consultas.</li>
              <li><strong>Eventos:</strong> ajude na banca solidária e nos Open Days.</li>
            </ul>
            <div className="action-row"><Button href="/ajudar/turnos">Ver turnos livres e inscrever-me</Button></div>
          </div>
        </Container>
      </section>

      <section id="familia-temporaria" className="gn-section gn-section--soft">
        <Container narrow>
          <div className="gn-stack gn-stack--m">
            <h2>Ser família temporária</h2>
            <p>Acolha em casa um gato que está a recuperar ou gatinhos sem mãe, até encontrarem família. A associação paga a comida, a areia e o veterinário.</p>
            <div className="action-row"><Button href="/ajudar/familia-temporaria">Quero ser família temporária</Button></div>
          </div>
        </Container>
      </section>

      <section id="amigo" className="gn-section">
        <Container narrow>
          <div className="gn-stack gn-stack--m">
            <h2>Ser Amigo da associação</h2>
            <p>Com uma quota mínima de 24 euros por ano ajuda a manter o gatil e tem 10% a 15% de desconto nos nossos parceiros.</p>
            <div className="action-row"><Button href="/parceiros" variant="secondary">Ver parceiros e vantagens</Button></div>
          </div>
        </Container>
      </section>
    </>
  );
}
