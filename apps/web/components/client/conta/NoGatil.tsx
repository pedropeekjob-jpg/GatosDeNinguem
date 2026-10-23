"use client";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  careAlertKindLabel,
  careAlertKindSchema,
  locationLabel,
  timesLabel,
  type CareAlertKind,
  type CareRoundItem,
  type CareTask,
  type CatGuide,
  type CatLocation,
  type NotificationGroup,
  type VolunteerCare,
} from "@gn/domain";
import { Badge, Button, Checkbox, Notice, TextArea } from "@gn/ui";
import { CUIDADOS_EVENT, cuidadosClient, tryAsDemoVolunteer, type DoseRef } from "@/lib/cuidados";

const dayLong = new Intl.DateTimeFormat("pt-PT", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Lisbon" });
const dayShort = new Intl.DateTimeFormat("pt-PT", { day: "numeric", month: "short", timeZone: "Europe/Lisbon" });
const hour = new Intl.DateTimeFormat("pt-PT", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Lisbon" });
const when = (iso: string) => `${dayShort.format(new Date(iso))}, ${hour.format(new Date(iso))}`;
const kinds = careAlertKindSchema.options;

type Flash = { tone: "success" | "error"; text: string } | null;
type Act = (run: () => Promise<{ ok: boolean; message?: string }>, done: string) => Promise<boolean>;

/** /conta/gatil: everything a volunteer needs on a shift, on one page that is always current. */
export function NoGatil() {
  const client = cuidadosClient();
  const [care, setCare] = useState<VolunteerCare | null | "a-carregar" | "erro">("a-carregar");
  const [flash, setFlash] = useState<Flash>(null);

  const load = useCallback(async () => {
    try { setCare(await client.overview()); } catch { setCare("erro"); }
  }, [client]);
  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 60_000);
    return () => window.clearInterval(timer);
  }, [load]);

  const act: Act = async (run, done) => {
    const r = await run();
    setFlash(r.ok ? { tone: "success", text: done } : { tone: "error", text: r.message ?? "Não foi possível guardar." });
    await load();
    window.dispatchEvent(new Event(CUIDADOS_EVENT));
    return r.ok;
  };

  if (care === "a-carregar") return <p role="status">A abrir o seu turno…</p>;
  if (care === "erro") return <Notice tone="error" title="Não foi possível abrir">Verifique a ligação à internet e recarregue a página.</Notice>;
  if (care === null) return <Notice tone="info" title="Entre na sua conta"><p><a href="/conta">Entrar</a> para ver o seu turno no gatil.</p></Notice>;
  if (!care.volunteer) {
    return (
      <div className="gn-stack gn-stack--l gatil">
        {flash ? <Notice tone={flash.tone} title={flash.text} /> : null}
        <Notice tone="info" title="Ainda não está num turno do gatil">
          <HowToJoin phoneMissing={care.phoneMissing} onTryDemo={() => { tryAsDemoVolunteer(); void load(); }} />
        </Notice>
        <JoinShift care={care} act={act} />
      </div>
    );
  }

  return (
    <div className="gn-stack gn-stack--l gatil">
      {flash ? <Notice tone={flash.tone} title={flash.text} /> : null}
      <ShiftHeader care={care} />
      {care.shift ? null : <JoinShift care={care} act={act} />}
      <HelpRequests care={care} act={act} />
      {care.shift ? (
        <section className="gn-stack gn-stack--m" aria-labelledby="gatil-doses">
          <h2 id="gatil-doses">{care.isToday ? "Medicação durante o seu turno" : "Medicação no dia do seu turno"}</h2>
          {care.during.length === 0 ? <p>Não há doses marcadas para a hora do seu turno.</p> : (
            <ul className="gatil__lista">{care.during.map((r) => <DoseRow key={`${r.medication.id}-${r.time}`} item={r} date={care.today} canAct={care.isToday} act={act} />)}</ul>
          )}
          {care.rest.length > 0 ? (
            <details className="gatil__resto">
              <summary>Mais doses deste dia ({care.rest.length})</summary>
              <ul className="gatil__lista">{care.rest.map((r) => <DoseRow key={`${r.medication.id}-${r.time}`} item={r} date={care.today} canAct={care.isToday} act={act} />)}</ul>
            </details>
          ) : null}
        </section>
      ) : null}
      {care.cats.length > 0 ? (
        <section className="gn-stack gn-stack--m" aria-labelledby="gatil-gatos">
          <h2 id="gatil-gatos">Como tratar de cada gato</h2>
          <p className="small muted">Só os gatos que precisam de algo especial. Os outros: comida, água, limpeza e mimos.</p>
          <div className="gatil__gatos">{care.cats.map((g) => <CatGuideCard key={g.cat.id} guide={g} canComment={care.isToday} act={act} />)}</div>
        </section>
      ) : null}
      {care.transports.length > 0 ? (
        <section className="gn-stack gn-stack--m" aria-labelledby="gatil-transportes">
          <h2 id="gatil-transportes">Idas ao veterinário</h2>
          {care.transports.map((t) => (
            <article key={t.shift.id} className="gatil__cartao">
              <h3>{t.shift.title}</h3>
              <p><strong>{dayLong.format(new Date(t.shift.startsAt))}</strong>, {hour.format(new Date(t.shift.startsAt))} a {hour.format(new Date(t.shift.endsAt))}</p>
              {t.appointment ? <p>Consulta às {hour.format(new Date(t.appointment.startsAt))} em {t.appointment.clinic}. {t.appointment.reason}</p> : null}
              {t.appointment?.notes ? <p className="gatil__importante">{t.appointment.notes}</p> : null}
              {t.shift.notes ? <p>{t.shift.notes}</p> : null}
              {t.guide ? <CatGuideCard guide={t.guide} canComment act={act} nested /> : null}
            </article>
          ))}
        </section>
      ) : null}
      <Notifications care={care} act={act} />
      <MutePrefs care={care} act={act} />
    </div>
  );
}

function ShiftHeader({ care }: { care: VolunteerCare }) {
  if (!care.shift) {
    return (
      <section className="gatil__turno" aria-labelledby="gatil-turno">
        <h2 id="gatil-turno">Sem turno no gatil no próximo mês</h2>
        <p>Continua a receber os pedidos de ajuda. Inscreva-se num turno em baixo para ver os gatos e as doses desse dia.</p>
      </section>
    );
  }
  const s = care.shift;
  const others = s.team.length - 1;
  return (
    <section className="gatil__turno" aria-labelledby="gatil-turno">
      <p className="gatil__quando">{care.isToday ? "Hoje" : "O seu próximo turno"}</p>
      <h2 id="gatil-turno">{dayLong.format(new Date(s.startsAt))}, {hour.format(new Date(s.startsAt))} a {hour.format(new Date(s.endsAt))}</h2>
      <p>{s.location}{others > 0 ? `. Consigo: ${s.team.slice(0, 4).join(", ")}` : ""}</p>
      {!care.isToday ? <p className="small muted">No dia do turno pode marcar aqui as doses que deu.</p> : null}
    </section>
  );
}

function Where({ location }: { location: CatLocation | null }) {
  if (!location) return <span className="loc loc--unknown">Sítio por definir</span>;
  return <span className={location.spot === "jaula" ? "loc loc--cage" : "loc"}>{locationLabel(location)}</span>;
}

/** One dose: who, where, what, and "Já dei" or "Não consigo dar" (with a reason, which asks everyone for help). */
function DoseRow({ item, date, canAct, act }: { item: CareRoundItem; date: string; canAct: boolean; act: Act }) {
  const client = cuidadosClient();
  const [asking, setAsking] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string>();
  const med = item.medication;
  const ref: DoseRef = { medicationId: med.id, date, time: item.time };
  const id = `dose-${med.id}-${item.time.replace(":", "")}`;

  async function ask(e: FormEvent) {
    e.preventDefault();
    if (reason.trim().length < 3) { setError("Diga porque não conseguiu"); return; }
    const okay = await act(() => client.cantGive({ ...ref, comment: reason }), `Pedimos ajuda a todos para ${item.cat.name}. Avisamos quando alguém ficar com a dose.`);
    if (okay) { setAsking(false); setReason(""); setError(undefined); }
  }

  return (
    <li className={item.given ? "gatil__dose gatil__dose--feita" : "gatil__dose"}>
      <p className="gatil__hora">{item.time}</p>
      <div className="gn-stack gn-stack--s">
        <p className="gatil__gato"><strong>{item.cat.name}</strong> <Where location={item.location} /></p>
        <p>{med.name}, {med.dose}{med.withFood ? ", com comida" : ""}</p>
        {med.instructions ? <p className="small">{med.instructions}</p> : null}
        {item.given ? <p className="gatil__ok">Dada por {item.given.by.name} às {hour.format(new Date(item.given.givenAt))}. Não dê outra vez.</p> : null}
        {!item.given && item.task?.status === "aberta" ? <p className="gatil__importante">À espera de quem possa dar. {item.task.createdBy.name}: “{item.task.comment}”</p> : null}
        {!item.given && item.task?.status === "aceite" ? <p>{item.task.acceptedBy!.name} ficou com esta dose.</p> : null}
        {canAct && !item.given ? (
          asking ? (
            <form className="gn-stack gn-stack--s" onSubmit={ask} noValidate>
              <TextArea id={`${id}-porque`} label="Porque não consegue dar?" hint="Fica junto do gato e vai para todos os voluntários, até alguém ficar com a dose." rows={2} value={reason} onChange={(e) => setReason(e.target.value)} error={error} required />
              <div className="action-row">
                <Button type="submit" variant="urgent">Pedir ajuda a todos</Button>
                <Button variant="quiet" onClick={() => setAsking(false)}>Voltar</Button>
              </div>
            </form>
          ) : (
            <div className="action-row">
              <Button onClick={() => act(() => client.giveDose(ref), `Registado: ${med.name} a ${item.cat.name}. Obrigado!`)}>Já dei</Button>
              {item.task?.status !== "aberta" ? <Button variant="secondary" onClick={() => setAsking(true)}>Não consigo dar</Button> : null}
            </div>
          )
        ) : null}
      </div>
    </li>
  );
}

function HelpRequests({ care, act }: { care: VolunteerCare; act: Act }) {
  const client = cuidadosClient();
  const { open, mine } = care.tasks;
  if (open.length === 0 && mine.length === 0) return null;
  const line = (t: CareTask) => `${t.what} a ${t.catName}, ${t.date === care.today ? "hoje" : dayShort.format(new Date(`${t.date}T12:00:00Z`))}${t.time ? ` às ${t.time}` : ""}`;
  return (
    <section className="gn-stack gn-stack--m" aria-labelledby="gatil-pedidos">
      <h2 id="gatil-pedidos">Pedidos de ajuda</h2>
      <ul className="gatil__lista">
        {open.map((t) => (
          <li key={t.id} className="gatil__pedido">
            <p><strong>{line(t)}</strong></p>
            <p className="small">{t.createdBy.name} não conseguiu: “{t.comment}”</p>
            <div className="action-row">
              <Button onClick={() => act(() => client.acceptTask(t.id), `Ficou consigo: ${line(t)}. Avisámos os outros voluntários.`)}>Fico eu com isto</Button>
            </div>
          </li>
        ))}
        {mine.map((t) => (
          <li key={t.id} className="gatil__pedido gatil__pedido--meu">
            <p><strong>{line(t)}</strong></p>
            {t.status === "aceite" ? (
              <>
                <p className="small">Ficou consigo. Quando der, carregue em “Já dei”.</p>
                <div className="action-row">
                  {t.medicationId && t.time ? <Button onClick={() => act(() => client.giveDose({ medicationId: t.medicationId!, date: t.date, time: t.time! }), `Registado. Obrigado por ajudar ${t.catName}!`)}>Já dei</Button> : null}
                  <Button variant="quiet" onClick={() => act(() => client.releaseTask(t.id), "Devolvido. Pedimos outra vez a todos.")}>Já não posso</Button>
                </div>
              </>
            ) : <p className="small">Pediu ajuda. Avisamos assim que alguém ficar com isto.</p>}
          </li>
        ))}
      </ul>
    </section>
  );
}

/** What it needs now first, then appointments and the latest news, then a box to leave a comment. */
function CatGuideCard({ guide, canComment, act, nested }: { guide: CatGuide; canComment: boolean; act: Act; nested?: boolean }) {
  const client = cuidadosClient();
  const [text, setText] = useState("");
  const [important, setImportant] = useState(false);
  const [error, setError] = useState<string>();
  const Heading = nested ? "h4" : "h3";
  const id = `nota-${guide.cat.id}${nested ? "-transporte" : ""}`;

  async function send(e: FormEvent) {
    e.preventDefault();
    if (text.trim().length < 2) { setError("Escreva o comentário"); return; }
    const okay = await act(() => client.addNote({ catId: guide.cat.id, text, important }), `Comentário sobre ${guide.cat.name} guardado. Quem trata dele vai ver.`);
    if (okay) { setText(""); setImportant(false); setError(undefined); }
  }

  return (
    <article className={nested ? "gatil__gato-cartao gatil__gato-cartao--dentro" : "gatil__gato-cartao"} aria-labelledby={`${id}-nome`}>
      <header className="gatil__gato-topo">
        {guide.cat.photo ? <img src={guide.cat.photo.url} alt={guide.cat.photo.alt} width={64} height={64} /> : null}
        <div>
          <Heading id={`${id}-nome`}>{guide.cat.name}</Heading>
          <Where location={guide.location} />
        </div>
      </header>
      {guide.location?.reason ? <p className="small">Porquê: {guide.location.reason}</p> : null}
      <div className="gatil__agora">
        <p className="gatil__rotulo">Precisa agora</p>
        {guide.specialNeeds ? <p>{guide.specialNeeds}</p> : null}
        {guide.medications.map((m) => (
          <p key={m.id}><strong>{m.name}</strong>, {m.dose}. {timesLabel(m)}.{m.instructions ? ` ${m.instructions}` : ""}</p>
        ))}
        {guide.importantNotes.map((n) => <p key={n.id} className="gatil__importante">{n.text} <span className="small">({n.by.name}, {when(n.createdAt)})</span></p>)}
        {!guide.specialNeeds && guide.medications.length === 0 && guide.importantNotes.length === 0 ? <p>Está na jaula: confirme água, comida e areia.</p> : null}
      </div>
      {guide.nextAppointment ? <p className="small">Próxima consulta: {when(guide.nextAppointment.startsAt)}, {guide.nextAppointment.reason}.{guide.nextAppointment.notes ? ` ${guide.nextAppointment.notes}` : ""}</p> : null}
      {guide.latestNotes.length > 0 ? (
        <details>
          <summary>Últimos comentários</summary>
          <ul className="gatil__notas">{guide.latestNotes.map((n) => <li key={n.id}>{n.text} <span className="small muted">({n.by.name}, {when(n.createdAt)})</span></li>)}</ul>
        </details>
      ) : null}
      {canComment ? (
        <form className="gn-stack gn-stack--s" onSubmit={send} noValidate>
          <TextArea id={id} label={`Comentário sobre ${guide.cat.name}`} hint="Por exemplo: comeu tudo, não quis a medicação, vomitou." rows={2} value={text} onChange={(e) => setText(e.target.value)} error={error} />
          <Checkbox id={`${id}-importante`} label="É importante: avisar quem trata deste gato" checked={important} onChange={setImportant} />
          <div className="action-row"><Button type="submit" variant="secondary">Guardar comentário</Button></div>
        </form>
      ) : null}
    </article>
  );
}

function Notifications({ care, act }: { care: VolunteerCare; act: Act }) {
  const client = cuidadosClient();
  const groups = care.notifications.filter((g) => g.alerts.some((a) => !a.muted));
  const silenced = care.notifications.length - groups.length;
  const muteCat = (g: NotificationGroup) => act(() => client.savePrefs({ ...care.prefs, mutedCats: [...care.prefs.mutedCats, g.catId] }), `Deixa de receber notificações sobre ${g.catName}.`);
  return (
    <section className="gn-stack gn-stack--m" aria-labelledby="gatil-notificacoes">
      <div className="gatil__titulo">
        <h2 id="gatil-notificacoes">Notificações</h2>
        {care.unread > 0 ? <Badge tone="warning">{care.unread === 1 ? "1 nova" : `${care.unread} novas`}</Badge> : null}
      </div>
      <p className="small muted">Só o que diz respeito aos gatos do seu turno e aos pedidos de ajuda. Nas últimas duas semanas.</p>
      {groups.length === 0 ? <p>Sem novidades.</p> : (
        <ul className="gatil__lista">
          {groups.map((g) => (
            <li key={g.catId} className={g.important ? "gatil__grupo gatil__grupo--importante" : "gatil__grupo"}>
              <p className="gatil__grupo-nome"><strong>{g.catName}</strong>{g.alerts.length > 1 ? <span className="small muted"> {g.alerts.length} novidades</span> : null}</p>
              <ul className="gatil__notas">
                {g.alerts.filter((a) => !a.muted).map((a) => (
                  <li key={a.id} className={a.unread ? "gatil__nova" : undefined}>
                    {a.unread ? <span className="gn-sr-only">Nova: </span> : null}{a.message} <span className="small muted">{when(a.createdAt)}</span>
                  </li>
                ))}
              </ul>
              {!care.prefs.mutedCats.includes(g.catId) ? <Button variant="quiet" onClick={() => muteCat(g)}>Silenciar {g.catName}</Button> : null}
            </li>
          ))}
        </ul>
      )}
      {silenced > 0 ? <p className="small muted">{silenced === 1 ? "1 gato silenciado" : `${silenced} gatos silenciados`}. Pode mudar isso em baixo.</p> : null}
      {care.unread > 0 ? <div className="action-row"><Button variant="secondary" onClick={() => act(async () => { await client.markSeen(); return { ok: true }; }, "Notificações marcadas como vistas.")}>Marcar todas como vistas</Button></div> : null}
    </section>
  );
}

/** Silence for oneself only: everything, some kinds, or some cats. */
function MutePrefs({ care, act }: { care: VolunteerCare; act: Act }) {
  const client = cuidadosClient();
  const [muteAll, setMuteAll] = useState(care.prefs.muteAll);
  const [mutedKinds, setMutedKinds] = useState<CareAlertKind[]>(care.prefs.mutedKinds);
  const [mutedCats, setMutedCats] = useState<string[]>(care.prefs.mutedCats);
  useEffect(() => { setMuteAll(care.prefs.muteAll); setMutedKinds(care.prefs.mutedKinds); setMutedCats(care.prefs.mutedCats); }, [care.prefs]);
  const catName = (id: string) => care.notifications.find((g) => g.catId === id)?.catName ?? care.cats.find((g) => g.cat.id === id)?.cat.name ?? "Gato";
  const toggleKind = (k: CareAlertKind, on: boolean) => setMutedKinds((list) => (on ? [...list, k] : list.filter((x) => x !== k)));

  return (
    <details className="gatil__silenciar">
      <summary>Silenciar notificações{care.prefs.muteAll ? " (tudo silenciado)" : ""}</summary>
      <form className="gn-stack gn-stack--m" onSubmit={(e) => { e.preventDefault(); void act(() => client.savePrefs({ muteAll, mutedKinds, mutedCats }), "Preferências guardadas. Só mudam para si."); }}>
        <p className="small muted">Só muda para si. Os pedidos e avisos continuam a aparecer nesta página.</p>
        <Checkbox id="silenciar-tudo" label="Silenciar tudo" checked={muteAll} onChange={setMuteAll} />
        {!muteAll ? (
          <fieldset className="gn-stack gn-stack--s">
            <legend>Silenciar só estes tipos</legend>
            {kinds.map((k) => <Checkbox key={k} id={`silenciar-${k}`} label={careAlertKindLabel[k]} checked={mutedKinds.includes(k)} onChange={(on) => toggleKind(k, on)} />)}
          </fieldset>
        ) : null}
        {!muteAll && mutedCats.length > 0 ? (
          <fieldset className="gn-stack gn-stack--s">
            <legend>Gatos silenciados</legend>
            {mutedCats.map((id) => <Checkbox key={id} id={`silenciar-gato-${id}`} label={catName(id)} checked onChange={() => setMutedCats((l) => l.filter((x) => x !== id))} />)}
          </fieldset>
        ) : null}
        <div className="action-row"><Button type="submit" variant="secondary">Guardar</Button></div>
      </form>
    </details>
  );
}

const DEMO = process.env.NEXT_PUBLIC_CONTAS_DEMO === "1";

/** How someone who is not on a gatil shift yet gets their account linked to one. */
function HowToJoin({ phoneMissing, onTryDemo }: { phoneMissing: boolean; onTryDemo?: () => void }) {
  return (
    <>
      <p>
        Quem vai tratar dos gatos ao gatil vê aqui que gatos medicar, onde está cada um e como tratar dele, e marca “Já dei” em cada dose.
        {phoneMissing
          ? " Para isso, entre com o seu telemóvel em vez do email: é por ele que ligamos a conta aos turnos."
          : " Inscreva-se num turno em baixo e a página abre logo com os gatos desse dia."}
      </p>
      {DEMO && onTryDemo ? (
        <div className="action-row">
          <Button variant="secondary" onClick={onTryDemo}>Experimentar como a Ana (com turno hoje)</Button>
        </div>
      ) : DEMO ? (
        <p className="small">Para experimentar: saia e entre com o telemóvel <strong>912 000 001</strong> (a Ana, que tem turno hoje).</p>
      ) : null}
    </>
  );
}

/** Gatil shifts with room, joined in one tap with the account's own name and mobile number. */
function JoinShift({ care, act }: { care: VolunteerCare; act: Act }) {
  const client = cuidadosClient();
  if (care.phoneMissing) return null;
  return (
    <section className="gn-stack gn-stack--m" aria-labelledby="gatil-inscrever">
      <h2 id="gatil-inscrever">Turnos no gatil com lugar</h2>
      {care.gatilShifts.length === 0 ? (
        <p>Não há turnos com lugar no próximo mês. <a href="/ajudar/turnos">Ver todos os turnos</a></p>
      ) : (
        <ul className="gatil__lista">
          {care.gatilShifts.map((s) => (
            <li key={s.id} className="gatil__pedido">
              <p><strong>{dayLong.format(new Date(s.startsAt))}</strong>, {hour.format(new Date(s.startsAt))} a {hour.format(new Date(s.endsAt))}</p>
              <p className="small">{s.title}. {s.free === 1 ? "1 lugar livre" : `${s.free} lugares livres`}</p>
              <div className="action-row">
                <Button onClick={() => act(() => client.joinShift(s.id), "Está inscrito. Já pode ver os gatos e as doses desse turno.")}>Inscrever-me neste turno<span className="gn-sr-only">: {dayLong.format(new Date(s.startsAt))}</span></Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** The card at the top of "A minha conta": what is waiting in the gatil, with the way in. Always shown, so it is easy to find. */
export function GatilResumo() {
  const [care, setCare] = useState<VolunteerCare | null>(null);
  useEffect(() => { cuidadosClient().overview().then(setCare).catch(() => setCare(null)); }, []);
  if (!care) return null;
  if (!care.volunteer) {
    return (
      <section className="gatil__resumo" aria-labelledby="painel-gatil">
        <h2 id="painel-gatil">No gatil</h2>
        <HowToJoin phoneMissing={care.phoneMissing} />
        <a className="gn-btn gn-btn--primary" href="/conta/gatil"><span>Abrir o meu turno no gatil</span></a>
      </section>
    );
  }
  const pending = care.isToday ? care.during.filter((r) => !r.given).length : 0;
  const facts = [
    care.shift ? `${care.isToday ? "Turno hoje" : "Próximo turno"}: ${dayLong.format(new Date(care.shift.startsAt))}, ${hour.format(new Date(care.shift.startsAt))}` : "Sem turno no próximo mês",
    pending > 0 ? (pending === 1 ? "1 dose para dar" : `${pending} doses para dar`) : null,
    care.tasks.open.length > 0 ? (care.tasks.open.length === 1 ? "1 pedido de ajuda" : `${care.tasks.open.length} pedidos de ajuda`) : null,
    care.unread > 0 ? (care.unread === 1 ? "1 notificação nova" : `${care.unread} notificações novas`) : null,
  ].filter(Boolean);
  return (
    <section className="gatil__resumo" aria-labelledby="painel-gatil">
      <h2 id="painel-gatil">No gatil</h2>
      <ul className="painel__factos">{facts.map((f) => <li key={f}>{f}</li>)}</ul>
      <a className="gn-btn gn-btn--primary" href="/conta/gatil"><span>Ver o meu turno e os gatos</span></a>
    </section>
  );
}
