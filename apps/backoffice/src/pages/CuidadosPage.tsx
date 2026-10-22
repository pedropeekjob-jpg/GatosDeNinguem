import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { careAlertKindLabel, hasCages, lisbonNow, shelterAreaLabel, shelterAreas, type CareAlert, type ShelterArea } from "@gn/domain";
import { AnimatedLogo, Badge, Button, Notice } from "@gn/ui";
import { errorMessage, useApi } from "../lib/api";
import type { RoundRow, ShelterRow } from "../lib/cuidadosApi";
import { addDays, dayLabel, lisbonToUtc, timeLabel } from "../lib/dates";
import { photoSrc } from "../lib/photos";
import { AuthorField, LocationTag, useAuthor, useUnreadAlerts } from "../lib/equipa";

type Tab = "medicacao" | "gatil" | "consultas" | "novidades";
const tabs: [Tab, string][] = [["medicacao", "Medicação"], ["gatil", "Onde estão"], ["consultas", "Consultas"], ["novidades", "Novidades"]];

/** Daily care for volunteers: which cat gets what, where each cat is, vet visits and what changed. */
export function CuidadosPage({ today = new Date() }: { today?: Date }) {
  const [params, setParams] = useSearchParams();
  const tab = (tabs.find(([k]) => k === params.get("ver"))?.[0] ?? "medicacao") as Tab;
  const { unread } = useUnreadAlerts();
  return (
    <div className="gn-stack gn-stack--m">
      <h1>Cuidados</h1>
      <div className="tabs" role="tablist" aria-label="Cuidados">
        {tabs.map(([key, label]) => (
          <button key={key} type="button" role="tab" aria-selected={tab === key} className="tabs__tab" onClick={() => setParams(key === "medicacao" ? {} : { ver: key })}>
            {label}
            {key === "novidades" && unread.length > 0 ? <span className="gn-nav__count tab-count">{unread.length}<span className="gn-sr-only"> por ver</span></span> : null}
          </button>
        ))}
      </div>
      {tab === "medicacao" ? <Round today={today} /> : tab === "gatil" ? <Shelter /> : tab === "consultas" ? <Appointments /> : <News />}
    </div>
  );
}

// ---------- medication round ----------

function Round({ today }: { today: Date }) {
  const api = useApi();
  const qc = useQueryClient();
  const now = lisbonNow(today);
  const [date, setDate] = useState(now.date);
  const round = useQuery({ queryKey: ["round", date], queryFn: () => api.round(date) });
  const [author] = useAuthor();
  const refresh = () => qc.invalidateQueries({ queryKey: ["round", date] });
  const give = useMutation({ mutationFn: (r: RoundRow) => api.giveDose(r.medication.id, { date, time: r.time }, author!), onSettled: refresh });
  const undo = useMutation({ mutationFn: (doseId: string) => api.undoDose(doseId), onSettled: refresh });

  const items = round.data?.items ?? [];
  const byTime = new Map<string, RoundRow[]>();
  for (const r of items) byTime.set(r.time, [...(byTime.get(r.time) ?? []), r]);
  const isToday = date === now.date;
  const missing = items.filter((r) => !r.given && r.location?.area !== "fora" && (date < now.date || (isToday && r.time <= now.time)));

  return (
    <div className="gn-stack gn-stack--m">
      <div className="action-row" role="group" aria-label="Mudar de dia">
        <Button variant="secondary" onClick={() => setDate(addDays(date, -1))}>← Dia anterior</Button>
        <Button variant="secondary" onClick={() => setDate(now.date)}>Hoje</Button>
        <Button variant="secondary" onClick={() => setDate(addDays(date, 1))}>Dia seguinte →</Button>
      </div>
      <h2 className="day-heading">{isToday ? "Hoje, " : ""}{dayLabel(lisbonToUtc(date, "12:00"))}</h2>
      <AuthorField id="ronda-nome" />
      {round.isPending ? <AnimatedLogo variant="loader" size={110} /> : null}
      {round.isError ? <Notice tone="error" title="Não foi possível carregar">{errorMessage(round.error)}</Notice> : null}
      {round.data && items.length === 0 ? <Notice tone="info" title="Não há medicação marcada para este dia" /> : null}
      {missing.length > 0 ? <Notice tone="warning" title={`${missing.length} ${missing.length === 1 ? "dose ainda não foi dada" : "doses ainda não foram dadas"}`}>Confirme no gatil e marque quando der.</Notice> : null}
      {give.isError ? <Notice tone="error" title="Não foi registado">{errorMessage(give.error)}</Notice> : null}
      {[...byTime.entries()].map(([time, rows]) => (
        <section key={time} className="gn-stack gn-stack--s" aria-labelledby={`hora-${time}`}>
          <h3 id={`hora-${time}`} className="round-time">{time}</h3>
          {rows.map((r) => {
            const late = !r.given && missing.includes(r);
            return (
              <article key={`${r.medication.id}-${time}`} className={r.given ? "care-card care-card--done" : "care-card"} aria-label={`${r.cat.name}, ${r.medication.name} às ${time}`}>
                <div className="care-card__head">
                  <CatName cat={r.cat} />
                  {r.given ? <Badge tone="success">Dada</Badge> : late ? <Badge tone="warning">Por dar</Badge> : null}
                </div>
                <p><LocationTag location={r.location} /></p>
                <p className="care-card__what"><strong>{r.medication.name}</strong> · {r.medication.dose}{r.medication.withFood ? " · com comida" : ""}</p>
                {r.medication.instructions ? <p className="small">{r.medication.instructions}</p> : null}
                {r.given ? (
                  <div className="action-row">
                    <span className="small">Dada por <strong>{r.given.by.name}</strong> às {timeLabel(r.given.givenAt)}.</span>
                    <Button variant="quiet" onClick={() => undo.mutate(r.given!.id)}>Desfazer<span className="gn-sr-only"> {r.medication.name} de {r.cat.name}</span></Button>
                  </div>
                ) : (
                  <div>
                    <Button onClick={() => give.mutate(r)} disabled={!author || give.isPending}>Já dei<span className="gn-sr-only"> {r.medication.name} a {r.cat.name}</span></Button>
                    {!author ? <p className="small muted">Escreva o seu nome em cima para registar.</p> : null}
                  </div>
                )}
              </article>
            );
          })}
        </section>
      ))}
    </div>
  );
}

function CatName({ cat }: { cat: { id: string; name: string; photo?: { url: string } } }) {
  return (
    <a className="cat-name" href={`/cuidados/${cat.id}`}>
      {cat.photo ? <img src={photoSrc(cat.photo.url)} alt="" width={44} height={44} /> : null}
      <span>{cat.name}</span>
    </a>
  );
}

// ---------- where each cat is ----------

function Shelter() {
  const api = useApi();
  const list = useQuery({ queryKey: ["shelter"], queryFn: () => api.shelter() });
  if (list.isPending) return <AnimatedLogo variant="loader" size={110} />;
  if (list.isError) return <Notice tone="error" title="Não foi possível carregar">{errorMessage(list.error)}</Notice>;
  const unknown = list.data.filter((r) => !r.care);
  const inArea = (area: ShelterArea) => list.data.filter((r) => r.care?.location.area === area);

  return (
    <div className="gn-stack gn-stack--l">
      {unknown.length > 0 ? (
        <section className="gn-stack gn-stack--s" aria-labelledby="area-sem">
          <Notice tone="warning" title={`${unknown.length} ${unknown.length === 1 ? "gato sem sítio definido" : "gatos sem sítio definido"}`}>Abra a ficha e escolha onde está.</Notice>
          <h2 id="area-sem" className="gn-sr-only">Sem sítio definido</h2>
          <CatRows rows={unknown} />
        </section>
      ) : null}
      {shelterAreas.map((area) => {
        const rows = inArea(area);
        const caged = rows.filter((r) => r.care?.location.spot === "jaula");
        const loose = rows.filter((r) => r.care?.location.spot !== "jaula");
        return (
          <section key={area} className="area gn-stack gn-stack--s" aria-labelledby={`area-${area}`}>
            <div className="area__head">
              <h2 id={`area-${area}`}>{shelterAreaLabel[area]}</h2>
              <span className="muted">{rows.length} {rows.length === 1 ? "gato" : "gatos"}</span>
            </div>
            {rows.length === 0 ? <p className="muted">Ninguém aqui de momento.</p> : null}
            {hasCages(area) && caged.length > 0 ? <><h3 className="area__sub">Em jaula ({caged.length})</h3><CatRows rows={caged} /></> : null}
            {loose.length > 0 ? <>{hasCages(area) ? <h3 className="area__sub">Soltos ({loose.length})</h3> : null}<CatRows rows={loose} /></> : null}
          </section>
        );
      })}
    </div>
  );
}

function CatRows({ rows }: { rows: ShelterRow[] }) {
  return (
    <ul className="care-list">
      {rows.map((r) => (
        <li key={r.cat.id} className="care-row">
          <CatName cat={r.cat} />
          <div className="care-row__info small">
            {r.care?.location.spot === "jaula" ? <span>Jaula {r.care.location.cage ?? "sem número"}{r.care.location.reason ? ` · ${r.care.location.reason}` : ""}</span> : r.care?.location.reason ? <span>{r.care.location.reason}</span> : null}
            {r.activeMedications.length > 0 ? <span>Medicação: {r.activeMedications.join(", ")}</span> : null}
            {r.nextAppointment ? <span>Consulta {dayLabel(r.nextAppointment.startsAt)}</span> : null}
          </div>
          <Button variant="secondary" href={`/cuidados/${r.cat.id}`}>Abrir ficha<span className="gn-sr-only"> de {r.cat.name}</span></Button>
        </li>
      ))}
    </ul>
  );
}

// ---------- appointments ----------

function Appointments() {
  const api = useApi();
  const list = useQuery({ queryKey: ["appointments"], queryFn: () => api.upcomingAppointments() });
  if (list.isPending) return <AnimatedLogo variant="loader" size={110} />;
  if (list.isError) return <Notice tone="error" title="Não foi possível carregar">{errorMessage(list.error)}</Notice>;
  const noDriver = list.data.filter((a) => a.transport && a.transport.free > 0);
  return (
    <div className="gn-stack gn-stack--m">
      <p className="muted">Para marcar uma consulta, abra a ficha do gato em “Onde estão”.</p>
      {list.data.length === 0 ? <Notice tone="info" title="Não há consultas marcadas" /> : null}
      {noDriver.length > 0 ? <Notice tone="warning" title={`${noDriver.length} ${noDriver.length === 1 ? "consulta precisa" : "consultas precisam"} de quem leve o gato`}>Partilhe o turno de transporte no grupo de voluntários.</Notice> : null}
      {list.data.map((a) => (
        <article key={a.id} className="care-card" aria-label={`Consulta de ${a.cat.name}`}>
          <div className="care-card__head">
            <p className="shift__time day-heading">{dayLabel(a.startsAt)}, {timeLabel(a.startsAt)}</p>
          </div>
          <CatName cat={a.cat} />
          <p><strong>{a.reason}</strong> · {a.clinic}</p>
          {a.notes ? <p className="small">{a.notes}</p> : null}
          <p className="small">
            {a.transport === null ? "Sem transporte marcado nas escalas." : a.transport.volunteers.length > 0 ? <>Leva o gato: <strong>{a.transport.volunteers.join(", ")}</strong></> : <Badge tone="warning">Falta quem leve</Badge>}
            {a.transport ? <> · <a href="/escalas">Ver nas escalas</a></> : null}
          </p>
        </article>
      ))}
    </div>
  );
}

// ---------- news ----------

function News() {
  const { alerts, seen, markSeen } = useUnreadAlerts();
  // Highlight what was new when the tab opened, then count it as seen.
  const seenAtOpen = useRef(seen);
  useEffect(() => { if (alerts.data) markSeen(); }, [alerts.data]); // eslint-disable-line react-hooks/exhaustive-deps
  if (alerts.isPending) return <AnimatedLogo variant="loader" size={110} />;
  if (alerts.isError) return <Notice tone="error" title="Não foi possível carregar">{errorMessage(alerts.error)}</Notice>;
  return <AlertList alerts={alerts.data} newSince={seenAtOpen.current ?? ""} />;
}

export function AlertList({ alerts, newSince }: { alerts: CareAlert[]; newSince?: string }) {
  if (alerts.length === 0) return <p className="muted">Ainda não há alterações registadas.</p>;
  return (
    <ol className="alerts">
      {alerts.map((a) => {
        const fresh = newSince !== undefined && a.createdAt > newSince;
        return (
          <li key={a.id} className={fresh ? "alert alert--new" : "alert"}>
            <div className="action-row">
              {fresh ? <span className="alert__new">Novo</span> : null}
              <Badge tone={a.important ? "warning" : "neutral"}>{careAlertKindLabel[a.kind]}</Badge>
              {a.important ? <span className="small"><strong>Importante</strong></span> : null}
            </div>
            <p>{a.message} <a href={`/cuidados/${a.catId}`}>Ficha de {a.catName}</a></p>
            <p className="small muted"><span className="day-heading">{dayLabel(a.createdAt)}</span>, {timeLabel(a.createdAt)} · {a.by.name}</p>
          </li>
        );
      })}
    </ol>
  );
}

