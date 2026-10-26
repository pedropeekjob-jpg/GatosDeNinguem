import type { ShiftType } from "@gn/domain";
import { Badge, Button, Card, Container, Grid, Notice, Section } from "@gn/ui";
import { ShiftSignUp } from "@/components/client/ShiftSignUp";
import { PageHero } from "@/components/PageHero";
import { getPage, listOpenShifts, type PublicShift } from "@/lib/content";
import { localizePage } from "@/lib/i18n/content";
import { crumbs, shiftTypeLabel } from "@/lib/i18n/labels";
import { langFrom, type LangProps } from "@/lib/i18n/server";
import type { I18n } from "@/lib/i18n/t";
import { buildMetadata } from "@/lib/seo";

/** Places fill up, so this page is rebuilt every minute instead of every few minutes. */
export const revalidate = 60;

export async function generateMetadata({ params }: LangProps) {
  const { lang } = await langFrom(params);
  const page = localizePage(await getPage("/ajudar/turnos"), lang);
  return buildMetadata({ path: "/ajudar/turnos", title: page.heading, description: page.intro, overrides: page.seo });
}

const tz = { timeZone: "Europe/Lisbon" } as const;
const dayKey = new Intl.DateTimeFormat("en-CA", { ...tz, year: "numeric", month: "2-digit", day: "2-digit" });

/** "sábado, 7 de novembro" and "das 10:00 às 12:00", in the page's language. */
function formats({ locale, t }: I18n) {
  const dayFormat = new Intl.DateTimeFormat(locale, { ...tz, weekday: "long", day: "numeric", month: "long" });
  const timeFormat = new Intl.DateTimeFormat(locale, { ...tz, hour: "2-digit", minute: "2-digit" });
  const timeRange = (s: PublicShift) => {
    const [a, b] = [timeFormat.format(new Date(s.startsAt)), timeFormat.format(new Date(s.endsAt))];
    return t({ pt: `das ${a} às ${b}`, en: `${a} to ${b}`, es: `de ${a} a ${b}`, fr: `de ${a} à ${b}` });
  };
  return { day: (iso: string) => dayFormat.format(new Date(iso)), timeRange };
}
const typeTone: Record<ShiftType, "info" | "success" | "warning" | "neutral"> = { limpeza: "success", "transporte-vet": "info", evento: "warning", outro: "neutral" };

function groupByDay(shifts: PublicShift[]) {
  const days = new Map<string, PublicShift[]>();
  for (const s of shifts) {
    const key = dayKey.format(new Date(s.startsAt));
    days.set(key, [...(days.get(key) ?? []), s]);
  }
  return [...days.values()];
}

export default async function ShiftsPage({ params }: LangProps) {
  const i18n = await langFrom(params);
  const { lang, t, l } = i18n;
  const [ptPage, shifts] = await Promise.all([getPage("/ajudar/turnos"), listOpenShifts()]);
  const page = localizePage(ptPage, lang);
  const days = groupByDay(shifts);
  const { day: dayName, timeRange } = formats(i18n);
  const c = crumbs[lang];
  // Shift titles, places and notes are written by the team in the back office, in Portuguese.
  const teamText = lang === "pt" ? undefined : "pt-PT";
  return (
    <>
      <PageHero
        heading={page.heading}
        intro={page.intro}
        introLang={page.ptOnly ? "pt-PT" : undefined}
        crumbs={[{ href: "/", label: c.home }, { href: "/ajudar", label: c.help }, { label: t({ pt: "Turnos", en: "Shifts", es: "Turnos", fr: "Créneaux" }) }]}
      />
      {days.length === 0 ? (
        <Section>
          <Notice tone="info" title={t({ pt: "Neste momento todos os turnos estão preenchidos", en: "All shifts are full at the moment", es: "En este momento todos los turnos están completos", fr: "Tous les créneaux sont complets pour le moment" })}>
            {t({ pt: "Obrigado a quem já se inscreveu! Volte daqui a uns dias ou siga-nos no Facebook e Instagram para saber quando abrem novos turnos.", en: "Thank you to everyone who signed up! Come back in a few days or follow us on Facebook and Instagram to hear when new shifts open.", es: "¡Gracias a quienes ya se han inscrito! Vuelva dentro de unos días o síganos en Facebook e Instagram para saber cuándo se abren nuevos turnos.", fr: "Merci à tous ceux qui se sont inscrits ! Revenez dans quelques jours ou suivez-nous sur Facebook et Instagram pour savoir quand de nouveaux créneaux ouvrent." })}
          </Notice>
          <div className="action-row"><Button href={l("/ajudar")} variant="secondary">{t({ pt: "Outras formas de ajudar", en: "Other ways to help", es: "Otras formas de ayudar", fr: "Autres façons d’aider" })}</Button></div>
        </Section>
      ) : (
        days.map((day) => {
          const heading = dayName(day[0]!.startsAt);
          return (
            <Section key={day[0]!.id} heading={heading.charAt(0).toUpperCase() + heading.slice(1)}>
              <Grid min="20rem">
                {day.map((s) => (
                  <Card
                    key={s.id}
                    titleAs="h3"
                    title={<span lang={teamText}>{s.title}</span>}
                    eyebrow={timeRange(s)}
                    badges={
                      <>
                        <Badge tone={typeTone[s.type]}>{shiftTypeLabel[lang][s.type]}</Badge>
                        <Badge tone={s.free === 1 ? "warning" : "neutral"}>{s.free === 1
                          ? t({ pt: "Falta 1 pessoa", en: "1 more person needed", es: "Falta 1 persona", fr: "Il manque 1 personne" })
                          : t({ pt: `Faltam ${s.free} pessoas`, en: `${s.free} more people needed`, es: `Faltan ${s.free} personas`, fr: `Il manque ${s.free} personnes` })}</Badge>
                      </>
                    }
                    meta={[{ label: t({ pt: "Onde", en: "Where", es: "Dónde", fr: "Où" }), value: s.location }, ...(s.eventName ? [{ label: t({ pt: "Evento", en: "Event", es: "Evento", fr: "Événement" }), value: s.eventName }] : [])]}
                    actions={<ShiftSignUp shift={{ id: s.id, title: s.title, startsAt: s.startsAt, endsAt: s.endsAt, location: s.location, when: `${heading}, ${timeRange(s)}` }} />}
                  >
                    {s.type === "transporte-vet" ? <p>{t({ pt: "Precisa de carro. Levamos a transportadora e explicamos tudo.", en: "You need a car. We bring the carrier and explain everything.", es: "Necesita coche. Llevamos el transportín y se lo explicamos todo.", fr: "Il faut une voiture. Nous fournissons la caisse de transport et expliquons tout." })}</p> : null}
                    {s.notes ? <p lang={teamText}>{s.notes}</p> : null}
                  </Card>
                ))}
              </Grid>
            </Section>
          );
        })
      )}
      <section className="gn-section gn-section--soft">
        <Container narrow>
          <div className="gn-stack gn-stack--m">
            <h2>{t({ pt: "Primeira vez?", en: "First time?", es: "¿Primera vez?", fr: "Première fois ?" })}</h2>
            <p>{t({ pt: "Não precisa de experiência. No primeiro turno alguém da equipa explica tudo. Traga roupa confortável que se possa sujar.", en: "No experience needed. On your first shift someone from the team explains everything. Wear comfortable clothes that can get dirty.", es: "No hace falta experiencia. En el primer turno alguien del equipo se lo explica todo. Traiga ropa cómoda que se pueda ensuciar.", fr: "Aucune expérience nécessaire. Lors de votre premier créneau, quelqu’un de l’équipe vous explique tout. Portez des vêtements confortables qui peuvent se salir." })}</p>
          </div>
        </Container>
      </section>
    </>
  );
}
