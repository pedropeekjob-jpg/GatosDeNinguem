"use client";
import { useState, type FormEvent } from "react";
import { firstName, monthLabel, type EarnAction } from "@gn/domain";
import { Badge, Button, Checkbox, Notice, ProgressMeter, TextField } from "@gn/ui";
import { contaClient, type MeuPainel } from "@/lib/conta";
import { GatilResumo } from "./NoGatil";

const n = new Intl.NumberFormat("pt-PT");
const day = new Intl.DateTimeFormat("pt-PT", { day: "numeric", month: "long", timeZone: "Europe/Lisbon" });
const statusLabel = { ativa: "Por usar", usada: "Usada", cancelada: "Cancelada" } as const;
const statusTone = { ativa: "success", usada: "neutral", cancelada: "neutral" } as const;

type Perk = MeuPainel["perks"][number];

/**
 * "O meu painel": Patinhas, level, perks to take, badges, the month's challenge and how to earn more.
 * While Patinhas are switched off it is just the gatil card, a greeting and the account settings.
 */
export function Painel({ painel, welcome, onChange, onSignedOut }: { painel: MeuPainel; welcome?: boolean; onChange: () => void; onSignedOut: () => void }) {
  const { account, features } = painel;

  if (!features?.patinhas) {
    return (
      <div className="gn-stack gn-stack--l painel">
        {welcome ? <Notice tone="success" title={`Bem-vindo, ${firstName(account.name)}!`}>A sua conta está criada.</Notice> : null}
        <GatilResumo />
        <section className="painel__resumo" aria-labelledby="painel-ola">
          <h2 id="painel-ola">Olá, {firstName(account.name)}!</h2>
          <p>Obrigado por ajudar os gatos.</p>
          <div className="action-row">
            <Button href="/ajudar/turnos">Ver turnos com vagas</Button>
            <Button href="/ajudar" variant="secondary">Outras formas de ajudar</Button>
          </div>
        </section>
        <Settings painel={painel} onSaved={onChange} onSignedOut={onSignedOut} />
      </div>
    );
  }
  return <PainelPatinhas painel={painel} welcome={welcome} onChange={onChange} onSignedOut={onSignedOut} />;
}

function PainelPatinhas({ painel, welcome, onChange, onSignedOut }: { painel: MeuPainel; welcome?: boolean; onChange: () => void; onSignedOut: () => void }) {
  const client = contaClient();
  const { account, level, next, features } = painel;
  const earnedBadges = painel.badges.filter((b) => b.earned).length;

  return (
    <div className="gn-stack gn-stack--l painel">
      {welcome ? (
        <Notice tone="success" title={`Bem-vindo, ${firstName(account.name)}! Já tem ${painel.earned} Patinhas.`}>
          Ganhou-as por criar a conta. Veja abaixo como ganhar mais{features.trocas ? " e o que pode trocar" : ""}.
        </Notice>
      ) : null}

      <GatilResumo />

      <section className="painel__resumo" aria-labelledby="painel-ola">
        <h2 id="painel-ola">Olá, {firstName(account.name)}!</h2>
        <div className="painel__numeros">
          <p className="painel__saldo">
            <span className="painel__saldo-valor">{n.format(painel.balance)}</span>
            <span>{features.trocas ? "Patinhas para trocar" : "Patinhas"}</span>
          </p>
          <p className="painel__nivel">
            <span className="painel__nivel-num">Nível {level.level}</span>
            <strong>{level.name}</strong>
          </p>
        </div>
        {next ? (
          <ProgressMeter
            label={`Até ao nível ${next.level}, ${next.name}`}
            value={painel.earned - level.min}
            max={next.min - level.min}
            valueText={`Faltam ${n.format(next.missing)} Patinhas`}
          />
        ) : (
          <p>Chegou ao nível mais alto. Obrigado por tudo o que faz pelos gatos!</p>
        )}
        <ul className="painel__factos">
          <li>{n.format(painel.earned)} Patinhas ganhas desde o início</li>
          <li>{earnedBadges === 1 ? "1 medalha" : `${earnedBadges} medalhas`}</li>
          {painel.streakMonths > 1 ? <li>{painel.streakMonths} meses seguidos a ajudar</li> : null}
        </ul>
        <p className="small muted">Ao nível {level.level}: {level.reward}.</p>
      </section>

      {features.trocas ? (
        <section className="gn-stack gn-stack--m" aria-labelledby="painel-trocar">
          <h2 id="painel-trocar">Trocar Patinhas nos parceiros</h2>
          {painel.perks.length === 0 ? <p>Ainda não há vantagens para trocar. Volte em breve.</p> : (
            <ul className="painel__lista">
              {painel.perks.map((p) => <PerkRow key={`${p.partnerId}-${p.perk.id}`} item={p} balance={painel.balance} onDone={onChange} />)}
            </ul>
          )}
          <p className="small muted"><a href="/parceiros">Conheça todos os parceiros</a></p>
        </section>
      ) : null}

      {features.trocas && painel.redemptions.length > 0 ? (
        <section className="gn-stack gn-stack--m" aria-labelledby="painel-trocas">
          <h2 id="painel-trocas">As suas trocas</h2>
          <ul className="painel__lista">
            {painel.redemptions.map((r) => (
              <li key={r.id} className="painel__linha">
                <div>
                  <p><strong>{r.partnerName}</strong>: {r.perkDescription}</p>
                  <p className="small muted"><time dateTime={r.createdAt}>{day.format(new Date(r.createdAt))}</time> · {r.cost} Patinhas</p>
                </div>
                <div className="painel__linha-fim">
                  {r.status === "ativa" ? <span className="codigo" aria-label={`Código ${r.code.split("").join(" ")}`}>{r.code}</span> : null}
                  <Badge tone={statusTone[r.status]}>{statusLabel[r.status]}</Badge>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {painel.challenges.map(({ challenge, progress }) => (
        <section key={challenge.id} className="gn-stack gn-stack--s painel__desafio" aria-labelledby={`desafio-${challenge.id}`}>
          <p className="gn-eyebrow">Desafio de {monthLabel(challenge.month)}</p>
          <h2 id={`desafio-${challenge.id}`}>{challenge.title}</h2>
          {challenge.description ? <p>{challenge.description}</p> : null}
          <ProgressMeter label="Todos juntos" value={progress} max={challenge.goal} valueText={`${progress} de ${challenge.goal}`} />
        </section>
      ))}

      <section className="gn-stack gn-stack--m" aria-labelledby="painel-medalhas">
        <h2 id="painel-medalhas">Medalhas</h2>
        <ul className="medalhas">
          {painel.badges.map(({ badge, earned, have }) => (
            <li key={badge.id} className={earned ? "medalha medalha--ganha" : "medalha"}>
              <span className="medalha__icone" aria-hidden="true">{badge.icon}</span>
              <span className="medalha__nome">{badge.name}</span>
              <span className="medalha__texto">{badge.description}</span>
              <span className="medalha__estado">{earned ? "Ganha" : badge.count > 1 ? `${have} de ${badge.count}` : "Por ganhar"}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="gn-stack gn-stack--m" aria-labelledby="painel-ganhar">
        <h2 id="painel-ganhar">Como ganhar mais Patinhas</h2>
        <ul className="painel__lista">
          {painel.waysToEarn.filter((r) => r.action !== "perfil").map((r) => (
            <li key={r.action} className="painel__linha">
              <span>{r.label}</span>
              <strong className="painel__pontos">{r.points}{r.perUnit ? ` por ${r.perUnit}` : ""}</strong>
            </li>
          ))}
        </ul>
        <p className="small muted">Adotar não dá Patinhas: queremos que cada gato seja adotado por amor. As fotos que nos manda depois já dão.</p>
        <div className="action-row">
          <Button href="/ajudar/turnos">Ver turnos com vagas</Button>
          <Button href="/ajudar" variant="secondary">Outras formas de ajudar</Button>
        </div>
      </section>

      {client.simulate ? <Simulate onDone={onChange} /> : null}

      <section className="gn-stack gn-stack--m" aria-labelledby="painel-historico">
        <h2 id="painel-historico">O que já fez</h2>
        <ul className="painel__lista">
          {painel.history.map((e) => (
            <li key={e.id} className="painel__linha">
              <div>
                <p>{e.label}{e.action === "turno-hora" && e.quantity > 1 ? ` (${n.format(e.quantity)} horas)` : ""}</p>
                <p className="small muted"><time dateTime={e.at}>{day.format(new Date(e.at))}</time></p>
              </div>
              <strong className={e.points < 0 ? "painel__pontos painel__pontos--menos" : "painel__pontos"}>{e.points > 0 ? "+" : ""}{n.format(e.points)}</strong>
            </li>
          ))}
        </ul>
      </section>

      <Settings painel={painel} onSaved={onChange} onSignedOut={onSignedOut} />
    </div>
  );
}

function PerkRow({ item, balance, onDone }: { item: Perk; balance: number; onDone: () => void }) {
  const client = contaClient();
  const [state, setState] = useState<"idle" | "confirm" | "busy" | { code: string } | { error: string }>("idle");
  const cost = item.perk.patinhasCost!;

  async function redeem() {
    setState("busy");
    const r = await client.redeem(item.partnerId, item.perk.id!);
    setState(r.ok ? { code: r.redemption.code } : { error: r.message });
    if (r.ok) onDone();
  }

  return (
    <li className="painel__linha painel__linha--vantagem">
      <div>
        <p><strong>{item.partnerName}</strong> · {item.town}</p>
        <p>{item.perk.description}</p>
        {!item.available && item.reason ? <p className="small muted">{item.reason}</p> : null}
      </div>
      <div className="painel__linha-fim" aria-live="polite">
        {typeof state === "object" && "code" in state ? (
          <div className="gn-stack gn-stack--s">
            <p>Mostre este código em {item.partnerName}:</p>
            <span className="codigo codigo--grande">{state.code}</span>
          </div>
        ) : state === "confirm" || state === "busy" ? (
          <div className="gn-stack gn-stack--s">
            <p>Vai usar {cost} das suas {n.format(balance)} Patinhas.</p>
            <div className="action-row">
              <Button onClick={redeem} disabled={state === "busy"}>{state === "busy" ? "A trocar…" : "Sim, trocar"}</Button>
              <Button variant="quiet" onClick={() => setState("idle")}>Afinal não</Button>
            </div>
          </div>
        ) : (
          <>
            {typeof state === "object" && "error" in state ? <p className="gn-field__error">{state.error}</p> : null}
            <Button variant={item.available ? "primary" : "secondary"} disabled={!item.available} onClick={() => setState("confirm")}>
              Trocar por {cost} Patinhas
            </Button>
          </>
        )}
      </div>
    </li>
  );
}

const simulations: { action: EarnAction; label: string }[] = [
  { action: "turno-hora", label: "Fiz um turno de 2 horas" },
  { action: "partilha", label: "Partilhei um gato" },
  { action: "donativo", label: "Fiz um donativo" },
  { action: "transporte", label: "Levei um gato ao veterinário" },
];

/** Only in the demo: see the points, level and badges move. On the real site the team confirms these. */
function Simulate({ onDone }: { onDone: () => void }) {
  const client = contaClient();
  return (
    <section className="gn-stack gn-stack--s painel__demo" aria-labelledby="painel-demo">
      <h2 id="painel-demo">Experimentar</h2>
      <p>Só na demonstração: carregue para fingir que fez uma destas coisas e veja as Patinhas, o nível e as medalhas a mudar.</p>
      <div className="action-row">
        {simulations.map((s) => (
          <Button key={s.action} variant="secondary" onClick={async () => { await client.simulate!(s.action); onDone(); }}>{s.label}</Button>
        ))}
      </div>
    </section>
  );
}

function Settings({ painel, onSaved, onSignedOut }: { painel: MeuPainel; onSaved: () => void; onSignedOut: () => void }) {
  const client = contaClient();
  const { account } = painel;
  const [name, setName] = useState(account.name);
  const [nickname, setNickname] = useState(account.nickname ?? "");
  const [showOnWall, setShowOnWall] = useState(account.showOnWall);
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function save(e: FormEvent) {
    e.preventDefault();
    const r = await client.update({ name, nickname, showOnWall });
    if (!r.ok) return setErrors(r.fieldErrors);
    setErrors({});
    setSaved(true);
    onSaved();
  }

  return (
    <section className="gn-stack gn-stack--m painel__conta" aria-labelledby="painel-conta">
      <h2 id="painel-conta">A sua conta</h2>
      <p className="muted">{[account.email, account.phone].filter(Boolean).join(" · ")}</p>
      <form className="gn-stack gn-stack--m conta-form" onSubmit={save} noValidate>
        <TextField id="conta-editar-nome" label="O seu nome" autoComplete="name" value={name} onChange={(e) => { setName(e.target.value); setSaved(false); }} error={errors.name} />
        {painel.features?.patinhas ? (
          <Checkbox
            id="conta-mural"
            label="Mostrar o meu nome no mural de agradecimentos"
            hint="A partir do nível 2. Só aparece o primeiro nome, ou a alcunha que escolher."
            checked={showOnWall}
            onChange={(v) => { setShowOnWall(v); setSaved(false); }}
          />
        ) : null}
        {painel.features?.patinhas && showOnWall ? (
          <TextField id="conta-alcunha" label="Alcunha no mural (opcional)" hint="Por exemplo: Ana dos Gatos" value={nickname} onChange={(e) => { setNickname(e.target.value); setSaved(false); }} error={errors.nickname} />
        ) : null}
        <div className="action-row">
          <Button type="submit" variant="secondary">Guardar</Button>
          {saved ? <p role="status">Guardado</p> : null}
        </div>
      </form>
      <div className="action-row">
        <Button variant="secondary" onClick={async () => { await client.signOut(); onSignedOut(); }}>Sair</Button>
        {confirmDelete ? null : <Button variant="quiet" onClick={() => setConfirmDelete(true)}>Apagar a minha conta</Button>}
      </div>
      {confirmDelete ? (
        <Notice tone="warning" title="Quer mesmo apagar a sua conta?">
          <p>{painel.features?.patinhas ? "Apagamos o seu nome, contacto e Patinhas." : "Apagamos o seu nome e contacto."} Não dá para desfazer.</p>
          <div className="action-row">
            <Button variant="urgent" onClick={async () => { await client.deleteAccount(); onSignedOut(); }}>Sim, apagar</Button>
            <Button variant="quiet" onClick={() => setConfirmDelete(false)}>Não, manter</Button>
          </div>
        </Notice>
      ) : null}
    </section>
  );
}
