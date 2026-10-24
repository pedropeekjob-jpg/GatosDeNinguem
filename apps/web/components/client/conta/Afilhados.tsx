"use client";
import { useCallback, useEffect, useState } from "react";
import { debitStatusLabel, debitStatusTone, sponsorEmailUpdatesLabel, sponsorEmailUpdatesSchema, type SponsorEmailUpdates, type SponsorView } from "@gn/domain";
import { Badge, Button, ChoiceList, Notice } from "@gn/ui";
import { padrinhosClient, type Afilhados as AfilhadosData } from "@/lib/padrinhos";
import { SignIn } from "./SignIn";

const day = new Intl.DateTimeFormat("pt-PT", { day: "numeric", month: "long", timeZone: "Europe/Lisbon" });
const dayYear = new Intl.DateTimeFormat("pt-PT", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Lisbon" });
const euros = (n: number) => n.toLocaleString("pt-PT", { style: "currency", currency: "EUR", minimumFractionDigits: Number.isInteger(n) ? 0 : 2 });
const MONTH_MS = 31 * 86_400_000;

type Flash = { tone: "success" | "error"; text: string } | null;

/** The card on /conta: only for people who sponsor a cat. */
export function AfilhadosResumo() {
  const [data, setData] = useState<AfilhadosData | null>(null);
  useEffect(() => { padrinhosClient().list().then(setData).catch(() => setData(null)); }, []);
  const current = data?.sponsorships.filter((s) => s.state !== "terminado") ?? [];
  if (current.length === 0) return null;
  const recent = (s: SponsorView) => s.news.filter((n) => Date.now() - Date.parse(n.at) < MONTH_MS).length;
  const one = current.length === 1 ? current[0]! : undefined;
  return (
    <section className="gatil__resumo afilhados__resumo" aria-labelledby="painel-afilhados">
      <h2 id="painel-afilhados">{one ? `${one.cat.pronoun === "a" ? "A minha afilhada" : "O meu afilhado"}: ${one.cat.name}` : "Os meus afilhados"}</h2>
      <ul className="painel__factos">
        {current.map((s) => (
          <li key={s.id}>
            {one ? "" : `${s.cat.name}: `}
            {recent(s) === 0 ? "sem novidades este mês" : recent(s) === 1 ? "1 novidade este mês" : `${recent(s)} novidades este mês`}
            {s.debit ? ` · ${debitStatusLabel[s.debit.status].toLowerCase()}` : ""}
          </li>
        ))}
      </ul>
      <a className="gn-btn gn-btn--primary" href="/conta/afilhados"><span>{one ? `Ver as notícias d${one.cat.pronoun} ${one.cat.name}` : "Ver as notícias"}</span></a>
    </section>
  );
}

/** /conta/afilhados: each sponsored cat, where it is, the monthly debit and everything that happened. */
export function Afilhados() {
  const client = padrinhosClient();
  const [data, setData] = useState<AfilhadosData | null | "a-carregar" | "erro">("a-carregar");
  const [flash, setFlash] = useState<Flash>(null);

  const load = useCallback(async () => {
    try { setData(await client.list()); } catch { setData("erro"); }
  }, [client]);
  useEffect(() => {
    void load();
    // Back from the bank details page.
    const debito = new URLSearchParams(window.location.search).get("debito");
    if (debito === "ativo") setFlash({ tone: "success", text: "Obrigado! O débito mensal ficou pedido. O seu banco confirma-o nos próximos dias." });
  }, [load]);

  if (data === "a-carregar") return <p role="status">A abrir…</p>;
  if (data === "erro") return <Notice tone="error" title="Não foi possível abrir">Verifique a ligação à internet e recarregue a página.</Notice>;
  if (data === null) {
    return (
      <div className="gn-stack gn-stack--m">
        <p>Entre com o email que nos deu quando apadrinhou. Recebe um código, sem palavras-passe.</p>
        <SignIn onSignedIn={() => void load()} />
      </div>
    );
  }
  if (data.sponsorships.length === 0) {
    return (
      <div className="gn-stack gn-stack--m">
        <p>Ainda não encontrámos nenhum gato apadrinhado com este email ou telemóvel. Se já apadrinha, entre com o contacto que nos deu.</p>
        <div className="action-row">
          <Button href="/apadrinhar">Escolher um gato para apadrinhar</Button>
          <Button href="/conta" variant="secondary">Voltar à minha conta</Button>
        </div>
      </div>
    );
  }

  async function act(run: () => Promise<{ ok: boolean; message?: string }>, done: string) {
    const r = await run();
    setFlash(r.ok ? { tone: "success", text: done } : { tone: "error", text: r.message ?? "Não foi possível guardar." });
    await load();
  }

  return (
    <div className="gn-stack gn-stack--l afilhados">
      {flash ? <Notice tone={flash.tone} title={flash.text} /> : null}
      {client.demo ? (
        <p className="small muted painel__demo">Demonstração: os dados ficam só neste navegador. No site a sério, o débito é feito na página segura do banco e as novidades também chegam por email.</p>
      ) : null}
      {data.sponsorships.map((s) => <Afilhado key={s.id} s={s} debitAvailable={data.debitAvailable} act={act} />)}
    </div>
  );
}

function Afilhado({ s, debitAvailable, act }: { s: SponsorView; debitAvailable: boolean; act: (run: () => Promise<{ ok: boolean; message?: string }>, done: string) => Promise<void> }) {
  const client = padrinhosClient();
  const { cat } = s;
  const d = cat.pronoun === "a" ? "da" : "do";
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  async function startDebit() {
    setBusy(true);
    const r = await client.startDebit(s.id);
    if (r.ok && r.checkoutUrl) {
      window.location.assign(r.checkoutUrl);
      return;
    }
    setBusy(false);
    await act(async () => r, "Débito ativo (demonstração). Obrigado!");
  }

  return (
    <article className="afilhado gn-stack gn-stack--m" aria-labelledby={`afilhado-${s.id}`}>
      <header className="afilhado__topo">
        {cat.photo ? <img src={cat.photo.url} alt={cat.photo.alt} width={120} height={90} /> : null}
        <div className="gn-stack gn-stack--s">
          <h2 id={`afilhado-${s.id}`}>{cat.name}</h2>
          {cat.whereNow && s.state !== "terminado" ? <p>Onde está agora: <span className="loc">{cat.whereNow}</span></p> : null}
          <p className="small muted">
            {s.state === "terminado" ? "Apadrinhamento terminado" : `${cat.pronoun === "a" ? "Afilhada" : "Afilhado"} desde ${dayYear.format(new Date(`${s.startDate}T12:00:00Z`))}`} · {euros(s.monthlyAmount)} por mês
          </p>
        </div>
      </header>

      <Payment s={s} debitAvailable={debitAvailable} busy={busy} onStart={startDebit} />

      <section className="gn-stack gn-stack--s" aria-labelledby={`novidades-${s.id}`}>
        <h3 id={`novidades-${s.id}`}>Novidades {d} {cat.name}</h3>
        {s.news.length === 0 ? <p className="muted">Ainda não há novidades. Quando houver, aparecem aqui{s.emailUpdates !== "nenhuma" ? " e no seu email" : ""}.</p> : (
          <ol className="afilhado__novidades">
            {s.news.map((n) => (
              <li key={n.id} className={n.kind === "carta" ? "novidade novidade--carta" : "novidade"}>
                <p className="novidade__quando"><span className="novidade__tipo">{n.label}</span> {day.format(new Date(n.at))}</p>
                <p>{n.text}</p>
                {n.photoUrl ? <img className="novidade__foto" src={n.photoUrl} alt={`Fotografia ${d} ${cat.name}`} loading="lazy" /> : null}
                {n.by ? <p className="small muted">{n.by}, da equipa</p> : null}
              </li>
            ))}
          </ol>
        )}
        <p className="small"><a href={`/adotar/${cat.slug}`}>A história {d} {cat.name}</a></p>
      </section>

      {s.state !== "terminado" ? (
        <details className="afilhado__definicoes">
          <summary>Emails e débito</summary>
          <div className="gn-stack gn-stack--m">
            <ChoiceList
              name={`emails-${s.id}`}
              legend="O que quer receber por email?"
              value={s.emailUpdates}
              onChange={(v) => void act(() => client.setEmailUpdates(s.id, v as SponsorEmailUpdates), "Guardado.")}
              options={sponsorEmailUpdatesSchema.options.map((v) => ({ value: v, label: sponsorEmailUpdatesLabel[v] }))}
            />
            {confirming ? (
              <Notice tone="warning" title={`Deixar de apadrinhar ${cat.pronoun} ${cat.name}?`}>
                <p>{s.debit && s.debit.status !== "cancelado" ? "O débito para já e não há mais pagamentos. " : ""}Pode voltar a apadrinhar quando quiser.</p>
                <div className="action-row">
                  <Button variant="urgent" onClick={() => void act(() => client.cancel(s.id), `Terminado. Obrigado por tudo o que fez pel${cat.pronoun} ${cat.name}!`)}>Sim, terminar</Button>
                  <Button variant="secondary" onClick={() => setConfirming(false)}>Não, continuar</Button>
                </div>
              </Notice>
            ) : (
              <Button variant="quiet" onClick={() => setConfirming(true)}>{s.debit && s.debit.status !== "cancelado" ? "Cancelar o débito e o apadrinhamento" : "Terminar o apadrinhamento"}</Button>
            )}
          </div>
        </details>
      ) : (
        <div className="action-row"><Button href={`/apadrinhar/${cat.slug}`} variant="secondary">Apadrinhar outra vez</Button></div>
      )}
    </article>
  );
}

function Payment({ s, debitAvailable, busy, onStart }: { s: SponsorView; debitAvailable: boolean; busy: boolean; onStart: () => void }) {
  if (s.state === "terminado") return null;
  const debit = s.debit;
  if (debit?.status === "ativo") {
    return (
      <div className="afilhado__pagamento">
        <Badge tone={debitStatusTone.ativo}>{debitStatusLabel.ativo}</Badge>
        <span className="small">
          {debit.paidCents > 0 ? `Já contribuiu com ${euros(debit.paidCents / 100)}` : "O primeiro débito sai nos próximos dias"}
          {debit.lastPaymentAt ? ` · último a ${day.format(new Date(debit.lastPaymentAt))}` : ""}
        </span>
      </div>
    );
  }
  const button = debitAvailable ? <Button onClick={onStart} disabled={busy}>{busy ? "A abrir…" : debit?.status === "falhou" ? "Ativar com outra conta" : "Ativar débito mensal"}</Button> : null;
  if (debit?.status === "falhou") {
    return <Notice tone="warning" title="O último débito não passou">O banco volta a tentar. Se mudou de conta, ative o débito outra vez. {button}</Notice>;
  }
  if (s.state === "a-aguardar" && s.payment === "combinar") {
    return <Notice tone="info" title="Pedido recebido">A equipa vai contactá-lo para combinar a contribuição. {button ? <>Se preferir, pode já ativar o débito mensal. {button}</> : null}</Notice>;
  }
  if (!debitAvailable) return s.state === "a-aguardar" ? <Notice tone="info" title="Pedido recebido">A equipa vai contactá-lo para combinar a contribuição.</Notice> : null;
  // Already giving another way (transfer, MB WAY): only offer the debit, quietly.
  if (s.state === "ativo" && !debit) {
    return (
      <div className="afilhado__pagamento">
        <span className="small">Contribui por transferência ou MB WAY. Prefere que saia sozinho todos os meses?</span>
        <Button variant="secondary" onClick={onStart} disabled={busy}>{busy ? "A abrir…" : "Passar a débito direto"}</Button>
      </div>
    );
  }
  return (
    <Notice tone="info" title={debit?.status === "a-configurar" ? "Falta terminar o débito mensal" : "Contribuir por débito direto"}>
      <p>Indica o IBAN uma vez, numa página segura, e a contribuição sai sozinha todos os meses. Pode cancelar aqui quando quiser.</p>
      {button}
    </Notice>
  );
}
