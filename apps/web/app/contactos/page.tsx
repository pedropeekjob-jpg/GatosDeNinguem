import { Container } from "@gn/ui";
import { ContactForm } from "@/components/forms/ContactForm";
import { PageHero } from "@/components/PageHero";
import { association } from "@/lib/association";
import { buildMetadata } from "@/lib/seo";

const heading = "Fale connosco";
const intro = "Escreva-nos por aqui e respondemos para o seu email. Somos voluntários: às vezes demoramos alguns dias.";

export async function generateMetadata() {
  return buildMetadata({ path: "/contactos", title: heading, description: intro });
}

/** The association's only public contact point: the site shows no email address. */
export default function ContactPage() {
  const { gatil } = association;
  return (
    <>
      <PageHero heading={heading} intro={intro} crumbs={[{ href: "/", label: "Início" }, { label: "Contactos" }]} />
      <section className="gn-section">
        <Container narrow>
          <div className="gn-stack gn-stack--l">
            <ContactForm />
            <div className="gn-stack gn-stack--s contact-aside">
              <h2>O gatil</h2>
              <p>{gatil.lines.join(", ")}. <a href={gatil.mapUrl} rel="noopener" target="_blank">Ver no mapa<span className="gn-sr-only"> (abre o Google Maps)</span></a></p>
              <p className="small muted">{gatil.visits}: peça a visita nesta página, com o assunto «Adoção» ou «Pergunta geral».</p>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
