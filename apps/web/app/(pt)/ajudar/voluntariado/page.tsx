import { Button, Card, Container, Grid, Section } from "@gn/ui";
import { PageHero } from "@/components/PageHero";
import { crumbs } from "@/lib/i18n/labels";
import { langFrom, type LangProps } from "@/lib/i18n/server";
import { buildMetadata } from "@/lib/seo";

const heading = { pt: "Ser voluntário", en: "Volunteer", es: "Ser voluntario", fr: "Devenir bénévole" };
const intro = {
  pt: "Não precisa de experiência. Escolha o que lhe for mais fácil e marque o seu turno.",
  en: "No experience needed. Choose whatever suits you best and book your shift.",
  es: "No hace falta experiencia. Elija lo que le resulte más fácil y reserve su turno.",
  fr: "Aucune expérience nécessaire. Choisissez ce qui vous convient et réservez votre créneau.",
};

export async function generateMetadata({ params }: LangProps) {
  const { t } = await langFrom(params);
  return buildMetadata({ path: "/ajudar/voluntariado", title: t(heading), description: t(intro) });
}

export default async function VolunteerPage({ params }: LangProps) {
  const { lang, t, l } = await langFrom(params);
  const c = crumbs[lang];
  const book = t({ pt: "Ver turnos livres e inscrever-me", en: "See free shifts and sign up", es: "Ver turnos libres e inscribirme", fr: "Voir les créneaux libres et m’inscrire" });
  return (
    <>
      <PageHero heading={t(heading)} intro={t(intro)} crumbs={[{ href: "/", label: c.home }, { href: "/ajudar", label: c.help }, { label: t({ pt: "Voluntariado", en: "Volunteering", es: "Voluntariado", fr: "Bénévolat" }) }]}>
        <div className="action-row"><Button href={l("/ajudar/turnos")}>{book}</Button></div>
      </PageHero>
      <Section heading={t({ pt: "O que pode fazer", en: "What you can do", es: "Qué puede hacer", fr: "Ce que vous pouvez faire" })}>
        <Grid>
          <Card titleAs="h3" title={t({ pt: "Limpeza e mimos no gatil", en: "Cleaning and cuddles at the shelter", es: "Limpieza y mimos en el refugio", fr: "Ménage et câlins au refuge" })}><p>{t({ pt: "Turnos de 2 horas, ao fim de semana ou durante a semana.", en: "2-hour shifts, at weekends or during the week.", es: "Turnos de 2 horas, el fin de semana o entre semana.", fr: "Créneaux de 2 heures, le week-end ou en semaine." })}</p></Card>
          <Card titleAs="h3" title={t({ pt: "Transporte ao veterinário", en: "Trips to the vet", es: "Transporte al veterinario", fr: "Trajets chez le vétérinaire" })}><p>{t({ pt: "Se tem carro, leve gatos às consultas. Levamos a transportadora e explicamos tudo.", en: "If you have a car, take cats to their appointments. We bring the carrier and explain everything.", es: "Si tiene coche, lleve gatos a sus citas. Llevamos el transportín y se lo explicamos todo.", fr: "Si vous avez une voiture, emmenez les chats à leurs rendez-vous. Nous fournissons la caisse de transport et expliquons tout." })}</p></Card>
          <Card titleAs="h3" title={t({ pt: "Eventos", en: "Events", es: "Eventos", fr: "Événements" })}><p>{t({ pt: "Ajude na banca solidária e nos Open Days.", en: "Help at the charity stall and on Open Days.", es: "Ayude en el puesto solidario y en las jornadas de puertas abiertas.", fr: "Aidez au stand solidaire et lors des portes ouvertes." })}</p></Card>
        </Grid>
      </Section>
      <section className="gn-section gn-section--soft">
        <Container narrow>
          <div className="gn-stack gn-stack--m">
            <h2>{t({ pt: "Primeira vez?", en: "First time?", es: "¿Primera vez?", fr: "Première fois ?" })}</h2>
            <p>{t({ pt: "No primeiro turno alguém da equipa explica tudo. Traga roupa confortável que se possa sujar.", en: "On your first shift someone from the team explains everything. Wear comfortable clothes that can get dirty.", es: "En el primer turno alguien del equipo se lo explica todo. Traiga ropa cómoda que se pueda ensuciar.", fr: "Lors de votre premier créneau, quelqu’un de l’équipe vous explique tout. Portez des vêtements confortables qui peuvent se salir." })}</p>
            <div className="action-row"><Button href={l("/ajudar/turnos")}>{book}</Button></div>
          </div>
        </Container>
      </section>
    </>
  );
}
