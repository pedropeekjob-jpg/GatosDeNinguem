import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import {
  appointmentStatusLabel, hasCages, isMedicationActive, lisbonNow, shelterAreaLabel, shelterAreas, timesLabel,
  type Appointment, type CatLocation, type Medication, type ShelterArea,
} from "@gn/domain";
import { AnimatedLogo, Badge, Button, Checkbox, ChoiceList, Notice, TextArea, TextField } from "@gn/ui";
import { errorMessage, useApi } from "../lib/api";
import type { CatFile } from "../lib/cuidadosApi";
import { dayLabel, lisbonToUtc, timeLabel } from "../lib/dates";
import { photoSrc } from "../lib/photos";
import { AuthorField, LocationTag, NameNeeded, useAuthor } from "../lib/equipa";
import { AlertList } from "./CuidadosPage";

/** One cat's care page: where it is, medication, vet visits and the team's notes. */
export function CuidadoGatoPage({ today = new Date() }: { today?: Date }) {
  const { catId = "" } = useParams();
  const api = useApi();
  const file = useQuery({ queryKey: ["catFile", catId], queryFn: () => api.catFile(catId) });

  if (file.isPending) return <AnimatedLogo variant="loader" size={110} />;
  if (file.isError) return <Notice tone="error" title="Não foi possível carregar">{errorMessage(file.error)}</Notice>;
  const { cat, care } = file.data;
  return (
    <div className="gn-stack gn-stack--l">
      <div><Button variant="quiet" href="/cuidados?ver=gatil">← Todos os gatos</Button></div>
      <header className="cat-head">
        {cat.photo ? <img src={photoSrc(cat.photo.url)} alt="" width={96} height={96} /> : null}
        <div className="gn-stack gn-stack--s">
          <h1>{cat.name}</h1>
          <p className="cat-head__where"><LocationTag location={care?.location} /></p>
          {care?.location.reason ? <p className="small">{care.location.reason}</p> : null}
          {care ? <p className="small muted">Desde <span className="day-heading">{dayLabel(care.since)}</span> · registado por {care.updatedBy.name}</p> : null}
        </div>
      </header>
      <AuthorField id="ficha-nome" />
      <MoveCat file={file.data} />
      <Medications file={file.data} today={today} />
      <Appointments file={file.data} today={today} />
      <Notes file={file.data} />
      <section className="gn-stack gn-stack--s" aria-labelledby="historico">
        <h2 id="historico">Últimas alterações</h2>
        <AlertList alerts={file.data.alerts} />
      </section>
    </div>
  );
}

function useRefresh(catId: string) {
  const qc = useQueryClient();
  return () => Promise.all(["catFile", "shelter", "round", "appointments", "careAlerts", "shifts"].map((k) => qc.invalidateQueries({ queryKey: k === "catFile" ? [k, catId] : [k] })));
}

const areaOptions = shelterAreas.map((a) => ({ value: a, label: shelterAreaLabel[a], hint: a === "fora" ? "Família temporária, clínica…" : undefined }));

function MoveCat({ file }: { file: CatFile }) {
  const api = useApi();
  const refresh = useRefresh(file.cat.id);
  const [author] = useAuthor();
  const current = file.care?.location;
  const [open, setOpen] = useState(!current);
  const [area, setArea] = useState<ShelterArea | undefined>(current?.area);
  const [spot, setSpot] = useState<"solto" | "jaula">(current?.spot ?? "solto");
  const [cage, setCage] = useState(current?.cage ?? "");
  const [reason, setReason] = useState(current?.reason ?? "");
  const save = useMutation({
    mutationFn: () => {
      const caged = hasCages(area!) && spot === "jaula";
      const location: CatLocation = { area: area!, spot: caged ? "jaula" : "solto", cage: caged && cage ? cage : undefined, reason: reason || undefined };
      return api.moveCat(file.cat.id, location, author!);
    },
    onSuccess: async () => { setOpen(false); await refresh(); },
  });

  if (!open) return <div><Button variant="secondary" onClick={() => setOpen(true)}>Mudar de sítio</Button></div>;
  return (
    <form className="panel gn-stack gn-stack--m" onSubmit={(e) => { e.preventDefault(); save.mutate(); }} aria-labelledby="mudar">
      <h2 id="mudar">Onde está {file.cat.name}?</h2>
      <ChoiceList name="area" legend="Espaço" value={area} onChange={setArea} options={areaOptions} />
      {area && hasCages(area) ? (
        <>
          <ChoiceList name="spot" legend="Como está?" value={spot} onChange={setSpot} options={[{ value: "solto", label: "Solto" }, { value: "jaula", label: "Em jaula", hint: "Quando está doente ou a tomar medicação" }]} />
          {spot === "jaula" ? <TextField id="cage" label="Número da jaula" inputMode="numeric" value={cage} onChange={(e) => setCage(e.target.value)} /> : null}
        </>
      ) : null}
      <TextField id="reason" label="Motivo (opcional)" hint="Ex.: Em jaula enquanto toma antibiótico." value={reason} onChange={(e) => setReason(e.target.value)} />
      <NameNeeded />
      {save.isError ? <Notice tone="error" title="Não foi guardado">{errorMessage(save.error)}</Notice> : null}
      <div className="action-row">
        <Button type="submit" disabled={!area || !author || save.isPending}>Guardar e avisar a equipa</Button>
        {current ? <Button variant="quiet" onClick={() => setOpen(false)}>Cancelar</Button> : null}
      </div>
    </form>
  );
}

// ---------- medication ----------

function Medications({ file, today }: { file: CatFile; today: Date }) {
  const api = useApi();
  const refresh = useRefresh(file.cat.id);
  const [author] = useAuthor();
  const [editing, setEditing] = useState<Medication | "nova">();
  const date = lisbonNow(today).date;
  const active = file.medications.filter((m) => isMedicationActive(m, date) || m.startDate > date);
  const past = file.medications.filter((m) => !active.includes(m));
  const stop = useMutation({ mutationFn: (id: string) => api.stopMedication(id, author!), onSuccess: refresh });

  return (
    <section className="gn-stack gn-stack--s" aria-labelledby="medicacao">
      <h2 id="medicacao">Medicação</h2>
      {active.length === 0 ? <p className="muted">Não está a tomar nada.</p> : null}
      {active.map((m) => (
        <article key={m.id} className="care-card" aria-label={m.name}>
          <div className="care-card__head">
            <p className="care-card__what"><strong>{m.name}</strong> · {m.dose}</p>
            {m.startDate > date ? <Badge tone="info">Começa {m.startDate}</Badge> : null}
          </div>
          <p>{timesLabel(m)}</p>
          <p className="small muted">Desde {m.startDate}{m.endDate ? ` até ${m.endDate}` : ", sem data de fim"}</p>
          {m.instructions ? <p className="small">{m.instructions}</p> : null}
          <div className="action-row">
            <Button variant="secondary" onClick={() => setEditing(m)}>Alterar<span className="gn-sr-only"> {m.name}</span></Button>
            <Button variant="quiet" disabled={!author} onClick={() => { if (window.confirm(`Terminar ${m.name} de ${file.cat.name} hoje?`)) stop.mutate(m.id); }}>Terminar tratamento<span className="gn-sr-only"> {m.name}</span></Button>
          </div>
        </article>
      ))}
      {editing ? <MedicationForm file={file} med={editing === "nova" ? undefined : editing} today={date} onDone={() => setEditing(undefined)} /> : <div><Button onClick={() => setEditing("nova")}>Adicionar medicação</Button></div>}
      {past.length > 0 ? (
        <details>
          <summary>Tratamentos anteriores ({past.length})</summary>
          <ul className="small">
            {past.map((m) => <li key={m.id}>{m.name}, {m.dose}: {m.startDate} a {m.stoppedAt?.slice(0, 10) ?? m.endDate}</li>)}
          </ul>
        </details>
      ) : null}
    </section>
  );
}

function MedicationForm({ file, med, today, onDone }: { file: CatFile; med?: Medication; today: string; onDone: () => void }) {
  const api = useApi();
  const refresh = useRefresh(file.cat.id);
  const [author] = useAuthor();
  const [name, setName] = useState(med?.name ?? "");
  const [dose, setDose] = useState(med?.dose ?? "");
  const [times, setTimes] = useState<string[]>(med?.times.length ? [...med.times].sort() : ["08:00"]);
  const [withFood, setWithFood] = useState(med?.withFood ?? false);
  const [startDate, setStartDate] = useState(med?.startDate ?? today);
  const [endDate, setEndDate] = useState(med?.endDate ?? "");
  const [instructions, setInstructions] = useState(med?.instructions ?? "");
  const save = useMutation({
    mutationFn: () => {
      const input = { catId: file.cat.id, name, dose, times: times.filter(Boolean), withFood, startDate, endDate: endDate || undefined, instructions: instructions || undefined };
      return med ? api.updateMedication(med.id, input, author!) : api.addMedication(input, author!);
    },
    onSuccess: async () => { await refresh(); onDone(); },
  });
  return (
    <form className="panel gn-stack gn-stack--m" onSubmit={(e) => { e.preventDefault(); save.mutate(); }} aria-labelledby="med-form">
      <h3 id="med-form">{med ? `Alterar ${med.name}` : "Nova medicação"}</h3>
      <TextField id="m-name" label="Medicamento" value={name} onChange={(e) => setName(e.target.value)} />
      <TextField id="m-dose" label="Dose" hint="Como a veterinária escreveu: 1/2 comprimido, 0,3 ml…" value={dose} onChange={(e) => setDose(e.target.value)} />
      <fieldset className="bo-fieldset">
        <legend>A que horas?</legend>
        {times.map((t, i) => (
          <div key={i} className="action-row">
            <TextField id={`m-time-${i}`} label={`${i + 1}.ª hora`} type="time" value={t} onChange={(e) => setTimes(times.map((x, j) => (j === i ? e.target.value : x)))} />
            <Button variant="quiet" onClick={() => setTimes(times.filter((_, j) => j !== i))}>Tirar<span className="gn-sr-only"> {i + 1}.ª hora</span></Button>
          </div>
        ))}
        {times.length === 0 ? <p className="small muted">Sem horas fixas: só quando for preciso.</p> : null}
        {times.length < 6 ? <div><Button variant="secondary" onClick={() => setTimes([...times, ""])}>Adicionar outra hora</Button></div> : null}
      </fieldset>
      <Checkbox id="m-food" label="Dar com comida" checked={withFood} onChange={setWithFood} />
      <div className="row-2">
        <TextField id="m-start" label="Começa no dia" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        <TextField id="m-end" label="Último dia (opcional)" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
      </div>
      <TextArea id="m-instructions" label="Instruções (opcional)" rows={2} value={instructions} onChange={(e) => setInstructions(e.target.value)} />
      <NameNeeded />
      {save.isError ? <Notice tone="error" title="Não foi guardado">{errorMessage(save.error)}</Notice> : null}
      <div className="action-row">
        <Button type="submit" disabled={!name || !dose || !author || save.isPending}>Guardar e avisar a equipa</Button>
        <Button variant="quiet" onClick={onDone}>Cancelar</Button>
      </div>
    </form>
  );
}

// ---------- appointments ----------

function Appointments({ file, today }: { file: CatFile; today: Date }) {
  const [adding, setAdding] = useState(false);
  const nowIso = today.toISOString();
  const upcoming = file.appointments.filter((a) => a.status === "marcada");
  const past = file.appointments.filter((a) => a.status !== "marcada").sort((a, b) => b.startsAt.localeCompare(a.startsAt));
  return (
    <section className="gn-stack gn-stack--s" aria-labelledby="consultas">
      <h2 id="consultas">Consultas</h2>
      {upcoming.length === 0 ? <p className="muted">Nenhuma consulta marcada.</p> : null}
      {upcoming.map((a) => <AppointmentCard key={a.id} file={file} a={a} late={a.startsAt < nowIso} />)}
      {adding ? <AppointmentForm file={file} onDone={() => setAdding(false)} /> : <div><Button onClick={() => setAdding(true)}>Marcar consulta</Button></div>}
      {past.length > 0 ? (
        <details>
          <summary>Consultas anteriores ({past.length})</summary>
          <ul className="gn-stack gn-stack--s">
            {past.map((a) => (
              <li key={a.id}><span className="day-heading">{dayLabel(a.startsAt)}</span>: {a.reason}, {a.clinic} · {appointmentStatusLabel[a.status]}{a.outcome ? `. ${a.outcome}` : ""}</li>
            ))}
          </ul>
        </details>
      ) : null}
    </section>
  );
}

function AppointmentCard({ file, a, late }: { file: CatFile; a: Appointment; late: boolean }) {
  const api = useApi();
  const refresh = useRefresh(file.cat.id);
  const [author] = useAuthor();
  const [closing, setClosing] = useState(late);
  const [outcome, setOutcome] = useState("");
  const update = useMutation({ mutationFn: (changes: Parameters<typeof api.updateAppointment>[1]) => api.updateAppointment(a.id, changes, author!), onSuccess: refresh });
  return (
    <article className="care-card" aria-label={`Consulta: ${a.reason}`}>
      <div className="care-card__head">
        <p className="shift__time day-heading">{dayLabel(a.startsAt)}, {timeLabel(a.startsAt)}</p>
        {late ? <Badge tone="warning">Já passou: como correu?</Badge> : null}
      </div>
      <p><strong>{a.reason}</strong> · {a.clinic}</p>
      {a.notes ? <p className="small">{a.notes}</p> : null}
      <p className="small muted">{a.transportShiftId ? "Com turno de transporte nas escalas." : "Sem transporte marcado."}</p>
      {closing ? (
        <form className="gn-stack gn-stack--s" onSubmit={(e) => { e.preventDefault(); update.mutate({ status: "feita", outcome: outcome || undefined }); }}>
          <TextArea id={`out-${a.id}`} label="O que disse a veterinária?" rows={3} value={outcome} onChange={(e) => setOutcome(e.target.value)} />
          <NameNeeded />
          {update.isError ? <Notice tone="error" title="Não foi guardado">{errorMessage(update.error)}</Notice> : null}
          <div className="action-row">
            <Button type="submit" disabled={!author || update.isPending}>Marcar como feita</Button>
            <Button variant="quiet" onClick={() => setClosing(false)}>Cancelar</Button>
          </div>
        </form>
      ) : (
        <div className="action-row">
          <Button variant="secondary" onClick={() => setClosing(true)}>Já foi: registar o resultado</Button>
          <Button variant="quiet" disabled={!author} onClick={() => { if (window.confirm("Cancelar esta consulta? A equipa vai ser avisada.")) update.mutate({ status: "cancelada" }); }}>Cancelar consulta</Button>
        </div>
      )}
    </article>
  );
}

function AppointmentForm({ file, onDone }: { file: CatFile; onDone: () => void }) {
  const api = useApi();
  const refresh = useRefresh(file.cat.id);
  const [author] = useAuthor();
  const [date, setDate] = useState("");
  const [time, setTime] = useState("10:00");
  const [clinic, setClinic] = useState(file.appointments.at(-1)?.clinic ?? "");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [needsTransport, setNeedsTransport] = useState(true);
  const save = useMutation({
    mutationFn: () => api.addAppointment({ catId: file.cat.id, startsAt: lisbonToUtc(date, time), clinic, reason, notes: notes || undefined, needsTransport }, author!),
    onSuccess: async () => { await refresh(); onDone(); },
  });
  return (
    <form className="panel gn-stack gn-stack--m" onSubmit={(e) => { e.preventDefault(); save.mutate(); }} aria-labelledby="con-form">
      <h3 id="con-form">Marcar consulta para {file.cat.name}</h3>
      <div className="row-2">
        <TextField id="c-date" label="Dia" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <TextField id="c-time" label="Hora" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
      </div>
      <TextField id="c-clinic" label="Clínica veterinária" value={clinic} onChange={(e) => setClinic(e.target.value)} />
      <TextField id="c-reason" label="Motivo" hint="Ex.: Revisão da pata, vacinas, análises." value={reason} onChange={(e) => setReason(e.target.value)} />
      <TextArea id="c-notes" label="Notas para quem leva (opcional)" hint="Ex.: Ir em jejum. Levar a transportadora azul." rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
      <Checkbox id="c-transport" label="Precisa de um voluntário para levar o gato" hint="Cria um turno de transporte nas Escalas." checked={needsTransport} onChange={setNeedsTransport} />
      <NameNeeded />
      {save.isError ? <Notice tone="error" title="Não foi marcada">{errorMessage(save.error)}</Notice> : null}
      <div className="action-row">
        <Button type="submit" disabled={!date || !time || !clinic || !reason || !author || save.isPending}>Marcar e avisar a equipa</Button>
        <Button variant="quiet" onClick={onDone}>Cancelar</Button>
      </div>
    </form>
  );
}

// ---------- notes ----------

function Notes({ file }: { file: CatFile }) {
  const api = useApi();
  const refresh = useRefresh(file.cat.id);
  const [author] = useAuthor();
  const [text, setText] = useState("");
  const [important, setImportant] = useState(false);
  const save = useMutation({
    mutationFn: () => api.addNote({ catId: file.cat.id, text, important }, author!),
    onSuccess: async () => { setText(""); setImportant(false); await refresh(); },
  });
  return (
    <section className="gn-stack gn-stack--s" aria-labelledby="notas">
      <h2 id="notas">Comentários das visitas</h2>
      <form className="panel gn-stack gn-stack--s" onSubmit={(e) => { e.preventDefault(); save.mutate(); }}>
        <TextArea id="nota" label={`Como estava ${file.cat.name} hoje?`} hint="Comeu? Bebeu? Usou a caixa? Algo diferente?" rows={3} value={text} onChange={(e) => setText(e.target.value)} />
        <Checkbox id="nota-importante" label="É importante: a equipa deve ver já" checked={important} onChange={setImportant} />
        <NameNeeded />
        {save.isError ? <Notice tone="error" title="Não foi guardado">{errorMessage(save.error)}</Notice> : null}
        <div><Button type="submit" disabled={text.trim().length < 2 || !author || save.isPending}>Guardar comentário</Button></div>
      </form>
      {file.notes.length === 0 ? <p className="muted">Ainda não há comentários.</p> : (
        <ol className="notes">
          {file.notes.map((n) => (
            <li key={n.id} className={n.important ? "note note--important" : "note"}>
              <p>{n.text}</p>
              <p className="small muted"><span className="day-heading">{dayLabel(n.createdAt)}</span>, {timeLabel(n.createdAt)} · {n.by.name}{n.important ? " · Importante" : ""}</p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

