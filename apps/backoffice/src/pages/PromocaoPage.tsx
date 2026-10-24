import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { channelProblem, eventWhen, promotionChannelLabel, promotionChannels, promotionStatusLabel, SOCIAL_TEXT_MAX, type PromotionChannel, type PromotionStatus } from "@gn/domain";
import { Badge, Button, Checkbox, Notice, TextArea, TextField, type Tone } from "@gn/ui";
import { errorMessage, useApi, type PromotionView } from "../lib/api";
import { dayLabel, lisbonDate, lisbonToUtc, timeLabel } from "../lib/dates";
import { photoSrc, preparePhoto } from "../lib/photos";

const tone: Record<PromotionStatus, Tone> = { rascunho: "warning", aprovada: "info", "a-publicar": "info", publicada: "success", "com-erros": "error", cancelada: "neutral" };
const services: { name: string; channels: PromotionChannel[] }[] = [
  { name: "Facebook", channels: ["facebook-post", "facebook-story"] },
  { name: "Instagram", channels: ["instagram-post", "instagram-story"] },
  { name: "email", channels: ["email"] },
];
const list_ = (names: string[]) => (names.length > 1 ? `${names.slice(0, -1).join(", ")} e ${names.at(-1)}` : names[0] ?? "");
const when = (iso: string) => `${dayLabel(iso)}, às ${timeLabel(iso)}`;

/**
 * Each event gets a promotion a week before: Facebook, Instagram and the newsletter.
 * The site writes the draft; a manager checks it once and it goes out on its own.
 */
export function PromocaoPage() {
  const api = useApi();
  const promotions = useQuery({ queryKey: ["promotions"], queryFn: () => api.promotions() });
  const channels = useQuery({ queryKey: ["promotion-channels"], queryFn: () => api.promotionChannels() });
  const [open, setOpen] = useState<string>();
  const list = promotions.data ?? [];
  const toReview = list.filter((p) => p.status === "rascunho");
  const scheduled = list.filter((p) => p.status === "aprovada" || p.status === "a-publicar");
  const done = list.filter((p) => p.status === "publicada" || p.status === "com-erros" || p.status === "cancelada").reverse();
  const notReady = new Set(channels.data?.filter((c) => !c.ready).map((c) => c.channel));
  const missing = services.filter((s) => s.channels.some((c) => notReady.has(c))).map((s) => s.name);

  const section = (title: string, items: PromotionView[], empty: string) => (
    <section className="gn-stack gn-stack--s">
      <h2>{title}</h2>
      {items.length === 0 ? <p className="muted">{empty}</p> : (
        <ul className="bo-list">
          {items.map((p) => <PromotionItem key={p.id} promotion={p} open={open === p.id} onToggle={() => setOpen(open === p.id ? undefined : p.id)} />)}
        </ul>
      )}
    </section>
  );

  return (
    <div className="gn-stack gn-stack--l">
      <div className="gn-stack gn-stack--s">
        <h1>Promoção de eventos</h1>
        <p className="gn-lead">Uma semana antes de cada evento sai uma publicação no Facebook e na Instagram, uma story e um email aos subscritores. Basta rever e aprovar uma vez.</p>
        <p className="small muted">Os eventos são as notícias do tipo Evento com dia e local, em <a href="/noticias">Notícias</a>.</p>
      </div>
      {promotions.isError ? <Notice tone="error" title="Não foi possível carregar">{errorMessage(promotions.error)}</Notice> : null}
      {missing.length > 0 ? (
        <Notice tone="warning" title={`Por ligar: ${list_(missing)}`}>
          <p className="small">Pode aprovar à mesma. O que não estiver ligado no dia fica marcado para tentar de novo.</p>
        </Notice>
      ) : null}
      {section("Por aprovar", toReview, "Nada por aprovar.")}
      {section("Agendadas", scheduled, "Nenhuma promoção agendada.")}
      {done.length ? section("Já saíram", done, "") : null}
    </div>
  );
}

function PromotionItem({ promotion: p, open, onToggle }: { promotion: PromotionView; open: boolean; onToggle: () => void }) {
  const failed = Object.entries(p.results).filter(([, r]) => !r.ok);
  return (
    <li className="shift">
      <div className="shift__head">
        <p className="shift__title">{p.postTitle}</p>
        <Badge tone={tone[p.status]}>{promotionStatusLabel[p.status]}</Badge>
      </div>
      <p className="small">Evento: {eventWhen({ startsAt: p.eventStartsAt })}</p>
      {p.status === "rascunho" || p.status === "aprovada" ? <p className="small">Sai {when(p.scheduledFor)}</p> : null}
      {p.publishedAt ? <p className="small">Saiu {when(p.publishedAt)}</p> : null}
      {p.note ? <p className="small"><strong>{p.note}</strong></p> : null}
      {failed.length && p.status === "com-erros" ? <p className="small">{failed.length === 1 ? "1 canal falhou" : `${failed.length} canais falharam`}: abra para ver porquê e tentar de novo.</p> : null}
      <div>
        <Button variant={p.status === "rascunho" ? "primary" : "secondary"} onClick={onToggle} aria-expanded={open}>
          {open ? "Fechar" : p.status === "rascunho" ? "Rever e aprovar" : "Ver"}<span className="gn-sr-only"> {p.postTitle}</span>
        </Button>
      </div>
      {open ? <PromotionEditor promotion={p} onDone={onToggle} /> : null}
    </li>
  );
}

function PromotionEditor({ promotion: p, onDone }: { promotion: PromotionView; onDone: () => void }) {
  const api = useApi();
  const qc = useQueryClient();
  const editable = p.status === "rascunho" || p.status === "aprovada";
  const [channels, setChannels] = useState<PromotionChannel[]>(p.channels);
  const [text, setText] = useState(p.text);
  const [imageUrl, setImageUrl] = useState(p.imageUrl);
  const [emailSubject, setEmailSubject] = useState(p.emailSubject);
  const [emailBody, setEmailBody] = useState(p.emailBody);
  const [day, setDay] = useState(lisbonDate(p.scheduledFor));
  const [time, setTime] = useState(timeLabel(p.scheduledFor));
  const [photoError, setPhotoError] = useState<string>();
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const id = `promo-${p.id}`;

  const refresh = () => qc.invalidateQueries({ queryKey: ["promotions"] });
  const save = () => api.editPromotion(p.id, { channels, text, imageUrl: imageUrl ?? null, emailSubject, emailBody, scheduledFor: lisbonToUtc(day, time) });
  const run = useMutation({
    mutationFn: async (action: "guardar" | "aprovar" | "rascunho" | "cancelar" | "publicar") => {
      if (editable && action !== "cancelar" && action !== "rascunho") await save();
      if (action !== "guardar") await api.promotionAction(p.id, action);
    },
    onSuccess: async (_d, action) => { await refresh(); if (action !== "guardar") onDone(); },
  });

  async function upload(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setPhotoError(undefined);
    setUploading(true);
    try {
      // Uploads are stored as JPG, which Instagram needs.
      setImageUrl((await api.uploadPhoto(await preparePhoto(file))).url);
    } catch (err) {
      setPhotoError(errorMessage(err));
    } finally {
      setUploading(false);
    }
  }

  const toggle = (c: PromotionChannel, on: boolean) => setChannels((cs) => (on ? promotionChannels.filter((x) => x === c || cs.includes(x)) : cs.filter((x) => x !== c)));
  const blocking = channels.map((c) => [c, channelProblem({ imageUrl }, c)] as const).filter(([, why]) => why);

  return (
    <div className="gn-stack gn-stack--m">
      {Object.keys(p.results).length ? (
        <div className="gn-stack gn-stack--s">
          <h3>Como correu</h3>
          <ul className="bo-list">
            {Object.entries(p.results).map(([c, r]) => (
              <li key={c}><Badge tone={r.ok ? "success" : "error"}>{r.ok ? "Saiu" : "Falhou"}</Badge> {promotionChannelLabel[c as PromotionChannel]}{r.detail ? `: ${r.detail}` : ""}{r.error ? <span className="small">: {r.error}</span> : null}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <fieldset className="bo-plain gn-stack gn-stack--m" disabled={!editable}>
      <fieldset className="bo-fieldset">
        <legend>Onde sai</legend>
        {promotionChannels.map((c) => (
          <Checkbox key={c} id={`${id}-${c}`} label={promotionChannelLabel[c]} checked={channels.includes(c)} onChange={(on) => toggle(c, on)}
            hint={channels.includes(c) ? (channelProblem({ imageUrl }, c) ?? (channelProblem(p, c) ? undefined : p.problems[c])) : undefined} />
        ))}
      </fieldset>

      <div className="gn-stack gn-stack--s">
        <p className="gn-field__label">Fotografia</p>
        {imageUrl ? <img src={photoSrc(imageUrl)} alt="" style={{ maxWidth: "16rem", borderRadius: "0.75rem" }} /> : <p className="small muted">Sem fotografia: só a publicação no Facebook e o email podem sair.</p>}
        <p className="small muted">Uma fotografia ao alto fica melhor nas stories.</p>
        {editable ? (
          <div>
            <input ref={fileInput} id={`${id}-foto`} className="gn-sr-only" type="file" accept="image/*" tabIndex={-1} onChange={(e) => { void upload(e.target.files); e.target.value = ""; }} />
            <Button variant="secondary" onClick={() => fileInput.current?.click()} disabled={uploading}>{uploading ? "A carregar…" : imageUrl ? "Trocar fotografia" : "Carregar fotografia"}</Button>
          </div>
        ) : null}
        {photoError ? <Notice tone="error" title="A fotografia não foi carregada">{photoError}</Notice> : null}
      </div>

      <TextArea id={`${id}-text`} label="Texto das publicações" hint="O mesmo texto vai para o Facebook e a Instagram. Na Instagram as ligações não se podem clicar." rows={10} value={text} onChange={(e) => setText(e.target.value)} recommended={{ min: 80, max: SOCIAL_TEXT_MAX }} />
      <TextField id={`${id}-subject`} label="Assunto do email" value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} />
      <TextArea id={`${id}-email`} label="Texto do email" hint="No fim junta-se sozinha a ligação para deixar de receber." rows={10} value={emailBody} onChange={(e) => setEmailBody(e.target.value)} />
      <div className="gn-stack gn-stack--s">
        <TextField id={`${id}-day`} label="Dia em que sai" type="date" value={day} onChange={(e) => setDay(e.target.value)} />
        <TextField id={`${id}-time`} label="Hora" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
      </div>
      </fieldset>

      {blocking.length && editable ? <Notice tone="warning" title="Antes de aprovar">{blocking.map(([c, why]) => <p key={c}>{promotionChannelLabel[c]}: {why}</p>)}</Notice> : null}
      {run.isError ? <Notice tone="error" title="Não foi possível">{errorMessage(run.error)}</Notice> : null}

      <div className="gn-stack gn-stack--s">
        {p.status === "rascunho" ? <Button onClick={() => run.mutate("aprovar")} disabled={run.isPending || channels.length === 0 || blocking.length > 0}>Aprovar: sai {dayLabel(lisbonToUtc(day, time))}</Button> : null}
        {editable ? <Button variant="secondary" onClick={() => run.mutate("guardar")} disabled={run.isPending}>Guardar alterações</Button> : null}
        {p.status !== "publicada" && p.status !== "cancelada" ? (
          <Button variant="secondary" onClick={() => run.mutate("publicar")} disabled={run.isPending || channels.length === 0 || (editable && blocking.length > 0)}>
            {p.status === "com-erros" || p.status === "a-publicar" ? "Tentar de novo o que falhou" : "Publicar já"}
          </Button>
        ) : null}
        {p.status === "aprovada" ? <Button variant="quiet" onClick={() => run.mutate("rascunho")} disabled={run.isPending}>Suspender (voltar a por aprovar)</Button> : null}
        {editable ? <Button variant="quiet" onClick={() => run.mutate("cancelar")} disabled={run.isPending}>Não promover este evento</Button> : null}
        {p.status === "cancelada" && new Date(p.eventStartsAt) > new Date() ? <Button variant="secondary" onClick={() => run.mutate("rascunho")} disabled={run.isPending}>Voltar a promover</Button> : null}
      </div>
    </div>
  );
}
