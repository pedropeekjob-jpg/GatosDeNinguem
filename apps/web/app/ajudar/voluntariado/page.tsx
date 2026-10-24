import { Button, Card, Container, Grid, Section } from "@gn/ui";
import { PageHero } from "@/components/PageHero";
import { buildMetadata } from "@/lib/seo";

const intro = "Não precisa de experiência. Escolha o que lhe for mais fácil e marque o seu turno.";

export async function generateMetadata() {
  return buildMetadata({ path: "/ajudar/voluntariado", title: "Ser voluntário", description: intro });
}

export default function VolunteerPage() {
  return (
    <>
      <PageHero heading="Ser voluntário" intro={intro} crumbs={[{ href: "/", label: "Início" }, { href: "/ajudar", label: "Ajudar" }, { label: "Voluntariado" }]}>
        <div className="action-row"><Button href="/ajudar/turnos">Ver turnos livres e inscrever-me</Button></div>
      </PageHero>
      <Section heading="O que pode fazer">
        <Grid>
          <Card titleAs="h3" title="Limpeza e mimos no gatil"><p>Turnos de 2 horas, ao fim de semana ou durante a semana.</p></Card>
          <Card titleAs="h3" title="Transporte ao veterinário"><p>Se tem carro, leve gatos às consultas. Levamos a transportadora e explicamos tudo.</p></Card>
          <Card titleAs="h3" title="Eventos"><p>Ajude na banca solidária e nos Open Days.</p></Card>
        </Grid>
      </Section>
      <section className="gn-section gn-section--soft">
        <Container narrow>
          <div className="gn-stack gn-stack--m">
            <h2>Primeira vez?</h2>
            <p>No primeiro turno alguém da equipa explica tudo. Traga roupa confortável que se possa sujar.</p>
            <div className="action-row"><Button href="/ajudar/turnos">Ver turnos livres e inscrever-me</Button></div>
          </div>
        </Container>
      </section>
    </>
  );
}
