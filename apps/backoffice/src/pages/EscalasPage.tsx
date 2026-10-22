import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { freeSpots, shiftTypeLabel, type ShiftType } from "@gn/domain";
import { AnimatedLogo, Badge, Button, Checkbox, ChoiceList, Notice, TextField } from "@gn/ui";
import { errorMessage, useApi } from "../lib/api";
import { addDays, dayLabel, lisbonDate, lisbonToUtc, timeLabel, weekRange, weekStart } from "../lib/dates";
import type { Shift } from "../lib/types";

type Tab = "calendario" | "novo" | "familias" | "padrinhos";

export function EscalasPage({ today = new Date() }: { today?: Date }) {
  const [tab, setTab] = useState<Tab>("calendario");
  return (
    <div className="gn-stack gn-stack--m">
      <h1>Escalas</h1>
      <div className="tabs" role="tablist" aria-label="Escalas">
        {(
          [
            ["calendario", "Calendário"],
            ["novo", "Criar turnos"],
            ["familias", "Famílias temporárias"],
            ["padrinhos", "Padrinhos"],
          ] as const
        ).map(([key, label]) => (
          <button key={key} type="button" role="tab" aria-selected={tab === key} className="tabs__tab" onClick={() => setTab(key)}>{label}</button>
        ))}
      </div>
      {tab === "calendario" ? <WeekAgenda today={today} /> : tab === "novo" ? <CreateShifts onDone={() => setTab("calendario")} /> : tab === "familias" ? <Fosters /> : <Sponsors />}
    </div>
  );
}

function WeekAgenda({ today }: { today: Date }) {
  const api = useApi();
  const [start, setStart] = useState(weekStart(today));
  const range = weekRange(start);
  const query = useQuery({ queryKey: ["shifts", start], queryFn: () => api.shifts(range) });

  const byDay = new Map<string, Shift[]>();
  for (const s of query.data ?? []) {
    const day = lisbonDate(s.startsAt);
    byDay.set(day, [...(byDay.get(day) ?? []), s]);
  }
  const openPlaces = (query.data ?? []).reduce((n, s) => n + freeSpots(s), 0);

  return (
    <div className="gn-stack gn-stack--m">
      <div className="action-row" role="group" aria-label="Mudar de semana">
        <Button variant="secondary" onClick={() => setStart(addDays(start, -7))}>← Semana anterior</Button>
        <Button variant="secondary" onClick={() => setStart(weekStart(today))}>Esta semana</Button>
        <Button variant="secondary" onClick={() => setStart(addDays(start, 7))}>Semana seguinte →</Button>
      </div>
      <h2>Semana de {dayLabel(lisbonToUtc(start, "12:00"))}</h2>
      {query.isPending ? <AnimatedLogo variant="loader" size={110} /> : null}
      {query.isError ? <Notice tone="error" title="Não foi possível carregar">{errorMessage(query.error)}</Notice> : null}
      {query.data && query.data.length === 0 ? <Notice tone="info" title="Sem turnos nesta semana">Crie turnos no separador “Criar turnos”.</Notice> : null}
      {query.data && openPlaces > 0 ? <Notice tone="warning" title={`${openPlaces} ${openPlaces === 1 ? "vaga por preencher" : "vagas por preencher"} esta semana`}>Partilhe no grupo de voluntários.</Notice> : null}
      {[...byDay.entries()].map(([day, shifts]) => (
        <section key={day} className="gn-stack gn-stack--s" aria-labelledby={`dia-${day}`}>
          <h3 id={`dia-${day}`} className="day-heading">{dayLabel(shifts[0]!.startsAt)}</h3>
          {shifts.map((s) => <ShiftCard key={s.id} shift={s} weekKey={start} />)}
        </section>
      ))}
    </div>
  );
}

function ShiftCard({ shift, weekKey }: { shift: Shift; weekKey: string }) {
  const api = useApi();
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: ["shifts", weekKey] });
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const add = useMutation({ mutationFn: () => api.addSignUp(shift.id, { name, phone }), onSuccess: () => { setAdding(false); setName(""); setPhone(""); return refresh(); } });
  const present = useMutation({ mutationFn: (vid: string) => api.markPresent(shift.id, vid), onSuccess: refresh });
  const remove = useMutation({ mutationFn: (vid: string) => api.removeSignUp(shift.id, vid), onSuccess: refresh });
  const free = freeSpots(shift);

  return (
    <article className="shift" aria-label={`${shift.title}, ${timeLabel(shift.startsAt)}`}>
      <div className="shift__head">
        <p className="shift__time">{timeLabel(shift.startsAt)}–{timeLabel(shift.endsAt)}</p>
        <Badge tone={free === 0 ? "success" : "warning"}>{free === 0 ? "Completo" : `${free} ${free === 1 ? "vaga" : "vagas"}`}</Badge>
      </div>
      <p className="shift__title">{shift.title}</p>
      <p className="small muted">{shiftTypeLabel[shift.type]} · {shift.location}{shift.clinic ? ` · ${shift.clinic}` : ""}{shift.eventName ? ` · ${shift.eventName}` : ""}</p>
      {shift.notes ? <p className="small">{shift.notes}</p> : null}
      {shift.signups.length > 0 ? (
        <ul className="signups">
          {shift.signups.map((s) => (
            <li key={s.volunteerId}>
              <span><strong>{s.name}</strong> · {s.phone}</span>
              <span className="action-row">
                {s.checkedInAt ? <Badge tone="success">Esteve presente</Badge> : <Button variant="secondary" onClick={() => present.mutate(s.volunteerId)}>Marcar presença<span className="gn-sr-only"> de {s.name}</span></Button>}
                <Button variant="quiet" onClick={() => remove.mutate(s.volunteerId)}>Retirar<span className="gn-sr-only"> {s.name}</span></Button>
              </span>
            </li>
          ))}
        </ul>
      ) : null}
      {free > 0 && !adding ? <div><Button variant="secondary" onClick={() => setAdding(true)}>Inscrever voluntário</Button></div> : null}
      {adding ? (
        <form className="gn-stack gn-stack--s" onSubmit={(e) => { e.preventDefault(); add.mutate(); }}>
          <TextField id={`n-${shift.id}`} label="Nome" value={name} onChange={(e) => setName(e.target.value)} />
          <TextField id={`p-${shift.id}`} label="Telefone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          {add.isError ? <Notice tone="error" title="Não foi possível inscrever">{errorMessage(add.error)}</Notice> : null}
          <div className="action-row">
            <Button type="submit">Inscrever</Button>
            <Button variant="quiet" onClick={() => setAdding(false)}>Cancelar</Button>
          </div>
        </form>
      ) : null}
    </article>
  );
}

const typeOptions = (Object.keys(shiftTypeLabel) as ShiftType[]).map((t) => ({ value: t, label: shiftTypeLabel[t] }));
const weekdayOptions = [
  [1, "Segunda"], [2, "Terça"], [3, "Quarta"], [4, "Quinta"], [5, "Sexta"], [6, "Sábado"], [0, "Domingo"],
] as const;

function CreateShifts({ onDone }: { onDone: () => void }) {
  const api = useApi();
  const qc = useQueryClient();
  const [mode, setMode] = useState<"um" | "semanal">("um");
  const [type, setType] = useState<ShiftType>("limpeza");
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("Gatil, Santa Marta de Portuzelo");
  const [date, setDate] = useState("");
  const [until, setUntil] = useState("");
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("12:00");
  const [capacity, setCapacity] = useState("3");
  const [weekdays, setWeekdays] = useState<number[]>([6]);
  const [catSlug, setCatSlug] = useState("");
  const [clinic, setClinic] = useState("");
  const [eventName, setEventName] = useState("");
  const [notes, setNotes] = useState("");

  const create = useMutation({
    mutationFn: async () => {
      const common = { type, title, location, capacity: Number(capacity), notes: notes || undefined };
      if (mode === "semanal") return api.createWeekly({ ...common, weekdays, startTime, endTime, from: date, until });
      return api.createShift({
        ...common,
        startsAt: lisbonToUtc(date, startTime),
        endsAt: lisbonToUtc(date, endTime),
        catSlug: type === "transporte-vet" ? catSlug || undefined : undefined,
        clinic: type === "transporte-vet" ? clinic || undefined : undefined,
        eventName: type === "evento" ? eventName || undefined : undefined,
      });
    },
    onSuccess: async () => { await qc.invalidateQueries({ queryKey: ["shifts"] }); onDone(); },
  });

  return (
    <form className="gn-stack gn-stack--m" onSubmit={(e) => { e.preventDefault(); create.mutate(); }}>
      <ChoiceList name="modo" legend="Que turnos quer criar?" value={mode} onChange={setMode} options={[{ value: "um", label: "Um turno" }, { value: "semanal", label: "Turnos que se repetem todas as semanas", hint: "Por exemplo: limpeza todos os sábados" }]} />
      <ChoiceList name="tipo" legend="Tipo de tarefa" value={type} onChange={setType} options={typeOptions} />
      <TextField id="t-title" label="Nome da tarefa" hint="Aparece aos voluntários." value={title} onChange={(e) => setTitle(e.target.value)} />
      <TextField id="t-location" label="Local" value={location} onChange={(e) => setLocation(e.target.value)} />
      {mode === "semanal" ? (
        <fieldset className="gn-choices">
          <legend className="gn-choices__legend">Em que dias?</legend>
          <div className="weekday-grid">
            {weekdayOptions.map(([n, label]) => (
              <Checkbox key={n} id={`dia-${n}`} label={label} checked={weekdays.includes(n)} onChange={(c) => setWeekdays((w) => (c ? [...w, n] : w.filter((x) => x !== n)))} />
            ))}
          </div>
        </fieldset>
      ) : null}
      <TextField id="t-date" label={mode === "semanal" ? "A partir de" : "Dia"} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      {mode === "semanal" ? <TextField id="t-until" label="Até" hint="No máximo 26 semanas." type="date" value={until} onChange={(e) => setUntil(e.target.value)} /> : null}
      <div className="row-2">
        <TextField id="t-start" label="Começa às" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
        <TextField id="t-end" label="Acaba às" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
      </div>
      <TextField id="t-capacity" label="Quantas pessoas são precisas?" type="number" inputMode="numeric" value={capacity} onChange={(e) => setCapacity(e.target.value)} />
      {type === "transporte-vet" && mode === "um" ? (
        <>
          <TextField id="t-cat" label="Gato (endereço curto, ex.: pimenta)" value={catSlug} onChange={(e) => setCatSlug(e.target.value)} />
          <TextField id="t-clinic" label="Clínica" value={clinic} onChange={(e) => setClinic(e.target.value)} />
        </>
      ) : null}
      {type === "evento" && mode === "um" ? <TextField id="t-event" label="Nome do evento" hint="Junta vários turnos do mesmo evento." value={eventName} onChange={(e) => setEventName(e.target.value)} /> : null}
      <TextField id="t-notes" label="Notas (opcional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
      {create.isError ? <Notice tone="error" title="Não foi criado">{errorMessage(create.error)}</Notice> : null}
      <div><Button type="submit" disabled={!title || !date || (mode === "semanal" && (!until || weekdays.length === 0)) || create.isPending}>{mode === "semanal" ? "Criar série de turnos" : "Criar turno"}</Button></div>
    </form>
  );
}

function Fosters() {
  const api = useApi();
  const qc = useQueryClient();
  const list = useQuery({ queryKey: ["fosters"], queryFn: () => api.fosterPlacements() });
  const save = useMutation({ mutationFn: api.saveFosterPlacement, onSuccess: () => qc.invalidateQueries({ queryKey: ["fosters"] }) });
  const [catSlug, setCatSlug] = useState("");
  const [startDate, setStartDate] = useState("");
  const [notes, setNotes] = useState("");
  const statusLabel = { "procura-familia": "Procura família", ativa: "Em família temporária", terminada: "Terminada" } as const;

  return (
    <div className="gn-stack gn-stack--m">
      {list.data?.map((p) => (
        <article key={p.id} className="shift">
          <div className="shift__head">
            <p className="shift__title">{p.catSlug}</p>
            <Badge tone={p.status === "procura-familia" ? "warning" : p.status === "ativa" ? "success" : "neutral"}>{statusLabel[p.status]}</Badge>
          </div>
          <p className="small muted">Desde {p.startDate}{p.expectedEndDate ? ` até ${p.expectedEndDate}` : ""}{p.familyName ? ` · ${p.familyName}` : ""}</p>
          {p.notes ? <p className="small">{p.notes}</p> : null}
          {p.status === "ativa" ? <div><Button variant="secondary" onClick={() => save.mutate({ ...p, status: "terminada" })}>Terminar acolhimento</Button></div> : null}
        </article>
      ))}
      <form className="gn-stack gn-stack--s" onSubmit={(e) => { e.preventDefault(); save.mutate({ catSlug, startDate, notes: notes || undefined, status: "procura-familia" }); }}>
        <h2>Pedir família temporária</h2>
        <TextField id="f-cat" label="Gato (endereço curto, ex.: estrela)" value={catSlug} onChange={(e) => setCatSlug(e.target.value)} />
        <TextField id="f-start" label="A partir de" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        <TextField id="f-notes" label="O que a família precisa de saber" value={notes} onChange={(e) => setNotes(e.target.value)} />
        {save.isError ? <Notice tone="error" title="Não foi guardado">{errorMessage(save.error)}</Notice> : null}
        <div><Button type="submit" disabled={!catSlug || !startDate}>Publicar pedido</Button></div>
      </form>
    </div>
  );
}

function Sponsors() {
  const api = useApi();
  const list = useQuery({ queryKey: ["sponsors"], queryFn: () => api.sponsorships() });
  const due = list.data?.filter((s) => s.needsUpdate) ?? [];
  return (
    <div className="gn-stack gn-stack--m">
      {due.length > 0 ? <Notice tone="warning" title={`${due.length} ${due.length === 1 ? "padrinho espera" : "padrinhos esperam"} notícias`}>Envie uma fotografia ou novidade do gato este mês.</Notice> : null}
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th scope="col">Padrinho</th><th scope="col">Gato</th><th scope="col">Por mês</th><th scope="col">Últimas notícias</th></tr></thead>
          <tbody>
            {list.data?.map((s) => (
              <tr key={s.id}>
                <td>{s.sponsorName}{s.email ? <><br /><span className="small muted">{s.email}</span></> : null}</td>
                <td>{s.catSlug}</td>
                <td>{s.monthlyAmount.toLocaleString("pt-PT", { style: "currency", currency: "EUR" })}</td>
                <td>{s.needsUpdate ? <Badge tone="warning">Enviar notícias</Badge> : s.lastUpdateSentAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
