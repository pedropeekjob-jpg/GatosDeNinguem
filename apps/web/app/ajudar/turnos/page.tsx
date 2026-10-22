import { shiftTypeLabel, type ShiftType } from "@gn/domain";
import { Badge, Button, Card, Container, Grid, Notice, Section } from "@gn/ui";
import { ShiftSignUp } from "@/components/client/ShiftSignUp";
import { PageHero } from "@/components/PageHero";
import { getPage, listOpenShifts, type PublicShift } from "@/lib/content";
import { buildMetadata } from "@/lib/seo";

/** Places fill up, so this page is rebuilt every minute instead of every few minutes. */
export const revalidate = 60;

export async function generateMetadata() {
  const page = await getPage("/ajudar/turnos");
  return buildMetadata({ path: "/ajudar/turnos", title: page.heading, description: page.intro, overrides: page.seo });
}

const tz = { timeZone: "Europe/Lisbon" } as const;
const dayFormat = new Intl.DateTimeFormat("pt-PT", { ...tz, weekday: "long", day: "numeric", month: "long" });
const timeFormat = new Intl.DateTimeFormat("pt-PT", { ...tz, hour: "2-digit", minute: "2-digit" });
const dayKey = new Intl.DateTimeFormat("en-CA", { ...tz, year: "numeric", month: "2-digit", day: "2-digit" });

const timeRange = (s: PublicShift) => `das ${timeFormat.format(new Date(s.startsAt))} às ${timeFormat.format(new Date(s.endsAt))}`;
const typeTone: Record<ShiftType, "info" | "success" | "warning" | "neutral"> = { limpeza: "success", "transporte-vet": "info", evento: "warning", outro: "neutral" };

function groupByDay(shifts: PublicShift[]) {
  const days = new Map<string, PublicShift[]>();
  for (const s of shifts) {
    const key = dayKey.format(new Date(s.startsAt));
    days.set(key, [...(days.get(key) ?? []), s]);
  }
  return [...days.values()];
}

export default async function ShiftsPage() {
  const [page, shifts] = await Promise.all([getPage("/ajudar/turnos"), listOpenShifts()]);
  const days = groupByDay(shifts);
  return (
    <>
      <PageHero
        heading={page.heading}
        intro={page.intro}
        crumbs={[{ href: "/", label: "Início" }, { href: "/ajudar", label: "Ajudar" }, { label: "Turnos" }]}
      />
      {days.length === 0 ? (
        <Section>
          <Notice tone="info" title="Neste momento todos os turnos estão preenchidos">
            Obrigado a quem já se inscreveu! Volte daqui a uns dias ou siga-nos no Facebook e Instagram para saber quando abrem novos turnos.
          </Notice>
          <div className="action-row"><Button href="/ajudar" variant="secondary">Outras formas de ajudar</Button></div>
        </Section>
      ) : (
        days.map((day) => {
          const heading = dayFormat.format(new Date(day[0]!.startsAt));
          return (
            <Section key={day[0]!.id} heading={heading.charAt(0).toUpperCase() + heading.slice(1)}>
              <Grid min="20rem">
                {day.map((s) => (
                  <Card
                    key={s.id}
                    titleAs="h3"
                    title={s.title}
                    eyebrow={timeRange(s)}
                    badges={
                      <>
                        <Badge tone={typeTone[s.type]}>{shiftTypeLabel[s.type]}</Badge>
                        <Badge tone={s.free === 1 ? "warning" : "neutral"}>{s.free === 1 ? "Falta 1 pessoa" : `Faltam ${s.free} pessoas`}</Badge>
                      </>
                    }
                    meta={[{ label: "Onde", value: s.location }, ...(s.eventName ? [{ label: "Evento", value: s.eventName }] : [])]}
                    actions={<ShiftSignUp shift={{ id: s.id, title: s.title, startsAt: s.startsAt, endsAt: s.endsAt, location: s.location, when: `${heading}, ${timeRange(s)}` }} />}
                  >
                    {s.type === "transporte-vet" ? <p>Precisa de carro. Levamos a transportadora e explicamos tudo.</p> : null}
                    {s.notes ? <p>{s.notes}</p> : null}
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
            <h2>Primeira vez?</h2>
            <p>Não precisa de experiência. No primeiro turno alguém da equipa explica tudo. Traga roupa confortável que se possa sujar.</p>
          </div>
        </Container>
      </section>
    </>
  );
}
