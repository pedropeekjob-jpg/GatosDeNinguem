import { Container } from "@gn/ui";
import { ContactForm } from "@/components/forms/ContactForm";
import { PageHero } from "@/components/PageHero";
import { association } from "@/lib/association";
import { crumbs } from "@/lib/i18n/labels";
import { langFrom, type LangProps } from "@/lib/i18n/server";
import { buildMetadata } from "@/lib/seo";

const heading = { pt: "Fale connosco", en: "Contact us", es: "Contacte con nosotros", fr: "Nous contacter" };
const intro = {
  pt: "Escreva-nos por aqui e respondemos para o seu email. Somos voluntários: às vezes demoramos alguns dias.",
  en: "Write to us here and we’ll reply to your email. We are volunteers, so it sometimes takes a few days.",
  es: "Escríbanos aquí y le responderemos a su correo. Somos voluntarios: a veces tardamos unos días.",
  fr: "Écrivez-nous ici et nous répondrons à votre e-mail. Nous sommes bénévoles : il nous faut parfois quelques jours.",
};

export async function generateMetadata({ params }: LangProps) {
  const { t } = await langFrom(params);
  return buildMetadata({ path: "/contactos", title: t(heading), description: t(intro) });
}

/** The association's only public contact point: the site shows no email address. */
export default async function ContactPage({ params }: LangProps) {
  const { lang, t } = await langFrom(params);
  const { gatil } = association;
  return (
    <>
      <PageHero heading={t(heading)} intro={t(intro)} crumbs={[{ href: "/", label: crumbs[lang].home }, { label: t({ pt: "Contactos", en: "Contact", es: "Contacto", fr: "Contact" }) }]} />
      <section className="gn-section">
        <Container narrow>
          <div className="gn-stack gn-stack--l">
            <ContactForm />
            <div className="gn-stack gn-stack--s contact-aside">
              <h2>{t({ pt: "O gatil", en: "The shelter", es: "El refugio", fr: "Le refuge" })}</h2>
              <p>{gatil.lines.join(", ")}. <a href={gatil.mapUrl} rel="noopener" target="_blank">{t({ pt: "Ver no mapa", en: "See on the map", es: "Ver en el mapa", fr: "Voir sur la carte" })}<span className="gn-sr-only"> {t({ pt: "(abre o Google Maps)", en: "(opens Google Maps)", es: "(abre Google Maps)", fr: "(ouvre Google Maps)" })}</span></a></p>
              <p className="small muted">{t({
                pt: `${gatil.visits}: peça a visita nesta página, com o assunto «Adoção» ou «Pergunta geral».`,
                en: "Visits by appointment only: ask for a visit on this page, with the topic “Adoption” or “General question”.",
                es: "Visitas solo con cita previa: pida la visita en esta página, con el asunto «Adopción» o «Pregunta general».",
                fr: "Visites uniquement sur rendez-vous : demandez une visite sur cette page, avec le sujet « Adoption » ou « Question générale ».",
              })}</p>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
