import { useQuery } from "@tanstack/react-query";
import { freeSpots, lisbonNow } from "@gn/domain";
import { Button, Grid, Notice, StatTile } from "@gn/ui";
import { useApi } from "../lib/api";
import { addDays, dayLabel, lisbonToUtc, timeLabel } from "../lib/dates";
import { useUnreadAlerts } from "../lib/equipa";

/** First screen: what needs attention, in plain words. */
export function HojePage({ today = new Date() }: { today?: Date }) {
  const api = useApi();
  const todayStr = today.toISOString().slice(0, 10);
  const shifts = useQuery({ queryKey: ["shifts", "next7", todayStr], queryFn: () => api.shifts({ from: today.toISOString(), to: lisbonToUtc(addDays(todayStr, 7), "23:59") }) });
  const interests = useQuery({ queryKey: ["interests"], queryFn: () => api.adoptionInterests() });
  const sponsors = useQuery({ queryKey: ["sponsors"], queryFn: () => api.sponsorships() });
  const fosters = useQuery({ queryKey: ["fosters"], queryFn: () => api.fosterPlacements() });
  const now = lisbonNow(today);
  const round = useQuery({ queryKey: ["round", now.date], queryFn: () => api.round(now.date) });
  const { unread } = useUnreadAlerts();
  const dosesLeft = (round.data?.items ?? []).filter((r) => !r.given && r.location?.area !== "fora");
  const dosesLate = dosesLeft.filter((r) => r.time <= now.time);

  const open = (shifts.data ?? []).filter((s) => freeSpots(s) > 0);
  const needFamily = (fosters.data ?? []).filter((f) => f.status === "procura-familia");

  return (
    <div className="gn-stack gn-stack--l">
      <h1>Olá! Isto é o que precisa de atenção</h1>
      {unread.length > 0 ? (
        <Notice tone="warning" title={`${unread.length} ${unread.length === 1 ? "mudança nos cuidados" : "mudanças nos cuidados"} desde a sua última visita`}>
          <p>{unread[0]!.message}</p>
          <p><a href="/cuidados?ver=novidades">Ver todas as novidades</a></p>
        </Notice>
      ) : null}
      <div className="stats">
        <StatTile value={round.data ? dosesLeft.length : "…"} label={dosesLate.length > 0 ? `doses de medicação por dar hoje (${dosesLate.length} já na hora)` : "doses de medicação por dar hoje"} />
        <StatTile value={open.reduce((n, s) => n + freeSpots(s), 0)} label="vagas por preencher nos próximos 7 dias" />
        <StatTile value={interests.data?.length ?? "…"} label="pedidos para conhecer gatos" />
        <StatTile value={needFamily.length} label="gatos à espera de família temporária" />
        <StatTile value={sponsors.data?.filter((s) => s.needsUpdate).length ?? "…"} label="padrinhos à espera de notícias" />
      </div>
      <div className="action-row">
        <Button href="/cuidados">Medicação de hoje</Button>
        <Button href="/cuidados?ver=gatil" variant="secondary">Onde estão os gatos</Button>
      </div>
      <section className="gn-stack gn-stack--s">
        <h2>Vagas por preencher</h2>
        {open.length === 0 ? <p>Todos os turnos da próxima semana estão completos. 🎉</p> : (
          <ul className="gn-stack gn-stack--s">
            {open.map((s) => (
              <li key={s.id}><strong>{dayLabel(s.startsAt)}, {timeLabel(s.startsAt)}</strong>: {s.title} ({freeSpots(s)} {freeSpots(s) === 1 ? "vaga" : "vagas"})</li>
            ))}
          </ul>
        )}
        <div><Button href="/escalas" variant="secondary">Abrir escalas</Button></div>
      </section>
      <section className="gn-stack gn-stack--s">
        <h2>Últimos pedidos de adoção</h2>
        <Grid>
          {(interests.data ?? []).slice(0, 4).map((i) => (
            <div key={i.id} className="shift">
              <p className="shift__title">{i.name}</p>
              <p>{i.phone} · {i.town}</p>
              <p className="small muted">Gato: {i.catSlug ?? "não indicado"} · ligar {i.bestTime === "qualquer" ? "a qualquer hora" : `de ${i.bestTime}`}</p>
            </div>
          ))}
        </Grid>
        <div><Button href="/pedidos" variant="secondary">Ver todos os pedidos</Button></div>
      </section>
    </div>
  );
}
