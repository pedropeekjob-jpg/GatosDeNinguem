import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { actionLabel, defaultPointsRules, earnActionSchema, levels, monthLabel, type Badge, type EarnAction, type Partner, type PointsRule } from "@gn/domain";
import { AnimatedLogo, Badge as Tag, Button, Checkbox, Notice, ProgressMeter, TextField } from "@gn/ui";
import { errorMessage, useApi, useFeatures } from "../lib/api";
import type { ChallengeRow, PersonRow } from "../lib/patinhasApi";
import { slugify } from "../lib/slug";

type Tab = "pessoas" | "trocas" | "regras" | "medalhas" | "desafios" | "vantagens";
const tabs: [Tab, string][] = [
  ["pessoas", "Pessoas"],
  ["trocas", "Trocas"],
  ["regras", "Pontos"],
  ["medalhas", "Medalhas"],
  ["desafios", "Desafios"],
  ["vantagens", "Vantagens"],
];
/** Swaps and partner perks wait for the "trocas" switch. */
const swapTabs: Tab[] = ["trocas", "vantagens"];

const n = new Intl.NumberFormat("pt-PT");
const when = (iso?: string) => (iso ? new Intl.DateTimeFormat("pt-PT", { dateStyle: "medium", timeZone: "Europe/Lisbon" }).format(new Date(iso)) : "—");
const earnActions = earnActionSchema.options;

/** Patinhas: confirm helpers' actions, hand over perks, and tune points, badges, challenges and partner perks. */
export function PatinhasPage() {
  const [tab, setTab] = useState<Tab>("pessoas");
  const { features, loaded } = useFeatures();
  if (!loaded) return <AnimatedLogo variant="loader" size={110} />;
  if (!features.patinhas) {
    return (
      <div className="gn-stack gn-stack--m">
        <h1>Patinhas</h1>
        <Notice tone="info" title="As Patinhas estão desligadas">
          Ainda não aparecem no site nem contam pontos. Para as ligar, junte "patinhas" à definição FEATURES do servidor (e "trocas" para as trocas nos parceiros).
        </Notice>
      </div>
    );
  }
  const shown = tabs.filter(([key]) => features.trocas || !swapTabs.includes(key));
  return (
    <div className="gn-stack gn-stack--m">
      <h1>Patinhas</h1>
      <div className="tabs" role="tablist" aria-label="Patinhas">
        {shown.map(([key, label]) => (
          <button key={key} type="button" role="tab" aria-selected={tab === key} className="tabs__tab" onClick={() => setTab(key)}>{label}</button>
        ))}
      </div>
      {tab === "pessoas" ? <People /> : tab === "trocas" ? <Redemptions /> : tab === "regras" ? <Rules /> : tab === "medalhas" ? <Badges /> : tab === "desafios" ? <Challenges /> : <Perks />}
    </div>
  );
}

function Loading({ pending, error }: { pending: boolean; error: unknown }) {
  if (pending) return <AnimatedLogo variant="loader" size={110} />;
  if (error) return <Notice tone="error" title="Não foi possível carregar">{errorMessage(error)}</Notice>;
  return null;
}

function SelectField({ id, label, value, onChange, options }: { id: string; label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div className="gn-field">
      <label htmlFor={id} className="gn-field__label">{label}</label>
      <select id={id} className="gn-input" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

// ----- people -----

function People() {
  const api = useApi();
  const people = useQuery({ queryKey: ["patinhas-people"], queryFn: () => api.people() });
  const [search, setSearch] = useState("");
  const [giving, setGiving] = useState<string>();
  // Ignores accents, spaces and dashes, so "913 000" finds 913000002 and "joao" finds João.
  const plain = (text: string) => slugify(text).replace(/-/g, "");
  const q = plain(search);
  const list = (people.data ?? []).filter((p) => !q || plain(`${p.name} ${p.email ?? ""} ${p.phone ?? ""}`).includes(q));

  return (
    <div className="gn-stack gn-stack--m">
      <p>Quando alguém faz algo fora do site (um donativo, uma semana de família temporária, fotos do gato adotado), confirme aqui para lhe dar as Patinhas. Os turnos contam sozinhos quando marca a presença.</p>
      <TextField id="pessoas-procurar" label="Procurar pessoa" hint="Nome, email ou telemóvel" value={search} onChange={(e) => setSearch(e.target.value)} />
      <Loading pending={people.isPending} error={people.error} />
      {people.data && list.length === 0 ? <Notice tone="info" title="Ninguém encontrado">Experimente outro nome ou número.</Notice> : null}
      <ul className="bo-list">
        {list.map((p) => (
          <li key={p.id} className="shift" aria-label={p.name}>
            <div className="shift__head">
              <p className="shift__title">{p.name}</p>
              <Tag tone="info">Nível {p.level.level} · {p.level.name}</Tag>
            </div>
            <p className="small muted">{[p.email, p.phone].filter(Boolean).join(" · ")} · desde {when(p.createdAt)}</p>
            <p><strong>{n.format(p.balance)}</strong> Patinhas para trocar · {n.format(p.earned)} ganhas no total · última ajuda {when(p.lastActivity)}</p>
            {giving === p.id ? <GiveForm person={p} onDone={() => setGiving(undefined)} /> : (
              <div><Button variant="secondary" onClick={() => setGiving(p.id)}>Dar Patinhas<span className="gn-sr-only"> a {p.name}</span></Button></div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function GiveForm({ person, onDone }: { person: PersonRow; onDone: () => void }) {
  const api = useApi();
  const qc = useQueryClient();
  const rules = useQuery({ queryKey: ["patinhas-rules"], queryFn: () => api.pointsRules() });
  const [action, setAction] = useState<EarnAction | "ajuste">("donativo");
  const [quantity, setQuantity] = useState("1");
  const [points, setPoints] = useState("");
  const [note, setNote] = useState("");
  const rule = (rules.data ?? defaultPointsRules).find((r) => r.action === action);
  const give = useMutation({
    mutationFn: () => api.givePatinhas(person.id, action === "ajuste" ? { action, points: Number(points), note } : { action, quantity: rule?.perUnit ? Number(quantity) : undefined, note: note || undefined }),
    onSuccess: async () => { await qc.invalidateQueries({ queryKey: ["patinhas-people"] }); onDone(); },
  });
  const options = [
    ...earnActions.filter((a) => a !== "perfil" && a !== "questionario").map((a) => {
      const r = (rules.data ?? defaultPointsRules).find((x) => x.action === a);
      return { value: a, label: `${r?.label ?? actionLabel[a]} (${r?.points ?? 0}${r?.perUnit ? ` por ${r.perUnit}` : ""})` };
    }),
    { value: "ajuste", label: "Acerto (somar ou tirar Patinhas)" },
  ];

  return (
    <form className="gn-stack gn-stack--s" onSubmit={(e: FormEvent) => { e.preventDefault(); give.mutate(); }}>
      <SelectField id={`acao-${person.id}`} label="O que fez" value={action} onChange={(v) => setAction(v as EarnAction | "ajuste")} options={options} />
      {action === "ajuste" ? (
        <TextField id={`pontos-${person.id}`} label="Patinhas" hint="Use um número negativo para tirar, por exemplo -20" inputMode="numeric" value={points} onChange={(e) => setPoints(e.target.value)} />
      ) : rule?.perUnit ? (
        <TextField id={`qtd-${person.id}`} label={`Quantas (${rule.perUnit}s)`} inputMode="numeric" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
      ) : null}
      <TextField id={`nota-${person.id}`} label="Nota (opcional)" hint="Por exemplo: transferência de 10 € a 3 de novembro" value={note} onChange={(e) => setNote(e.target.value)} />
      {give.isError ? <Notice tone="error" title="Não foi possível dar as Patinhas">{errorMessage(give.error)}</Notice> : null}
      <div className="action-row">
        <Button type="submit" disabled={give.isPending}>Confirmar</Button>
        <Button variant="quiet" onClick={onDone}>Cancelar</Button>
      </div>
    </form>
  );
}

// ----- perks taken -----

const statusLabel = { ativa: "Por usar", usada: "Usada", cancelada: "Cancelada" } as const;

function Redemptions() {
  const api = useApi();
  const qc = useQueryClient();
  const list = useQuery({ queryKey: ["patinhas-redemptions"], queryFn: () => api.redemptions() });
  const refresh = () => qc.invalidateQueries({ queryKey: ["patinhas-redemptions"] });
  const used = useMutation({ mutationFn: (id: string) => api.markRedemptionUsed(id), onSuccess: refresh });
  const cancel = useMutation({ mutationFn: (id: string) => api.cancelRedemption(id), onSuccess: refresh });
  const active = (list.data ?? []).filter((r) => r.status === "ativa").length;

  return (
    <div className="gn-stack gn-stack--m">
      <p>Quando um parceiro lhe disser que alguém usou um código, marque-o como usado. Se a troca não se fizer, cancele: as Patinhas voltam para a pessoa.</p>
      <Loading pending={list.isPending} error={list.error} />
      {list.data ? <p><strong>{active}</strong> {active === 1 ? "troca por usar" : "trocas por usar"}</p> : null}
      {used.isError || cancel.isError ? <Notice tone="error" title="Não foi possível">{errorMessage(used.error ?? cancel.error)}</Notice> : null}
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th scope="col">Código</th><th scope="col">Pessoa</th><th scope="col">Vantagem</th><th scope="col">Pedida</th><th scope="col">Estado</th></tr></thead>
          <tbody>
            {list.data?.map((r) => (
              <tr key={r.id}>
                <td><strong className="bo-code">{r.code}</strong></td>
                <td>{r.personName ?? <span className="muted">Conta apagada</span>}</td>
                <td><strong>{r.partnerName}</strong><br />{r.perkDescription}<br /><span className="small muted">{r.cost} Patinhas</span></td>
                <td>{when(r.createdAt)}</td>
                <td>
                  {r.status === "ativa" ? (
                    <div className="gn-stack gn-stack--s">
                      <Button variant="secondary" onClick={() => used.mutate(r.id)}>Marcar como usada<span className="gn-sr-only"> {r.code}</span></Button>
                      <Button variant="quiet" onClick={() => cancel.mutate(r.id)}>Cancelar e devolver<span className="gn-sr-only"> {r.code}</span></Button>
                    </div>
                  ) : <Tag tone="neutral">{statusLabel[r.status]}</Tag>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ----- points per action -----

function Rules() {
  const api = useApi();
  const rules = useQuery({ queryKey: ["patinhas-rules"], queryFn: () => api.pointsRules() });
  return rules.data ? <RulesForm initial={rules.data} /> : <Loading pending={rules.isPending} error={rules.error} />;
}

function RulesForm({ initial }: { initial: PointsRule[] }) {
  const api = useApi();
  const qc = useQueryClient();
  const [rules, setRules] = useState(initial);
  const save = useMutation({ mutationFn: () => api.savePointsRules(rules), onSuccess: (saved) => qc.setQueryData(["patinhas-rules"], saved) });
  const set = (i: number, changes: Partial<PointsRule>) => { save.reset(); setRules((rs) => rs.map((r, j) => (j === i ? { ...r, ...changes } : r))); };

  return (
    <form className="gn-stack gn-stack--m" onSubmit={(e) => { e.preventDefault(); save.mutate(); }}>
      <p>Quantas Patinhas vale cada forma de ajudar. Adotar não aparece aqui de propósito: só contam as fotos que mandam depois.</p>
      <ul className="bo-list">
        {rules.map((r, i) => (
          <li key={r.action} className="shift">
            <TextField id={`regra-${r.action}-nome`} label="Descrição" value={r.label} onChange={(e) => set(i, { label: e.target.value })} />
            <div className="row-2">
              <TextField id={`regra-${r.action}-pontos`} label={r.perUnit ? `Patinhas por ${r.perUnit}` : "Patinhas"} inputMode="numeric" value={String(r.points)} onChange={(e) => set(i, { points: Number(e.target.value.replace(/\D/g, "")) || 0 })} />
              <TextField id={`regra-${r.action}-limite`} label="Máximo por semana" hint="Vazio: sem limite" inputMode="numeric" value={r.weeklyLimit ? String(r.weeklyLimit) : ""} onChange={(e) => set(i, { weeklyLimit: Number(e.target.value.replace(/\D/g, "")) || undefined })} />
            </div>
            <Checkbox id={`regra-${r.action}-ativa`} label="Ativa" checked={r.active} onChange={(v) => set(i, { active: v })} />
          </li>
        ))}
      </ul>
      {save.isError ? <Notice tone="error" title="Não foi possível guardar">{errorMessage(save.error)}</Notice> : null}
      <div className="action-row">
        <Button type="submit" disabled={save.isPending}>Guardar pontos</Button>
        {save.isSuccess ? <p role="status">Guardado</p> : null}
      </div>
    </form>
  );
}

// ----- badges -----

const actionOptions = earnActions.map((a) => ({ value: a, label: actionLabel[a] }));
const emptyBadge: Badge = { id: "", name: "", description: "", icon: "🏅", action: "turno-hora", count: 1, active: true };

function Badges() {
  const api = useApi();
  const qc = useQueryClient();
  const badges = useQuery({ queryKey: ["patinhas-badges"], queryFn: () => api.badges() });
  const [editing, setEditing] = useState<Badge>();
  const refresh = () => qc.invalidateQueries({ queryKey: ["patinhas-badges"] });
  const remove = useMutation({ mutationFn: (id: string) => api.deleteBadge(id), onSuccess: refresh });

  return (
    <div className="gn-stack gn-stack--m">
      <p>Cada medalha ganha-se ao fazer uma ação um certo número de vezes.</p>
      {editing ? <BadgeForm initial={editing} onDone={() => { setEditing(undefined); void refresh(); }} /> : <div><Button onClick={() => setEditing(emptyBadge)}>Nova medalha</Button></div>}
      <Loading pending={badges.isPending} error={badges.error} />
      <ul className="bo-list">
        {badges.data?.map((b) => (
          <li key={b.id} className="shift" aria-label={b.name}>
            <div className="shift__head">
              <p className="shift__title"><span aria-hidden="true">{b.icon}</span> {b.name}</p>
              {b.active ? null : <Tag tone="neutral">Desligada</Tag>}
            </div>
            <p>{b.description}</p>
            <p className="small muted">{actionLabel[b.action]}: {b.count} {b.count === 1 ? "vez" : "vezes"}</p>
            <div className="action-row">
              <Button variant="secondary" onClick={() => setEditing(b)}>Editar<span className="gn-sr-only"> {b.name}</span></Button>
              <Button variant="quiet" onClick={() => remove.mutate(b.id)}>Apagar<span className="gn-sr-only"> {b.name}</span></Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function BadgeForm({ initial, onDone }: { initial: Badge; onDone: () => void }) {
  const api = useApi();
  const [b, setB] = useState(initial);
  const isNew = !initial.id;
  const save = useMutation({ mutationFn: () => api.saveBadge({ ...b, id: b.id || slugify(b.name) }), onSuccess: onDone });
  return (
    <form className="gn-stack gn-stack--s shift" onSubmit={(e) => { e.preventDefault(); save.mutate(); }} aria-label={isNew ? "Nova medalha" : `Editar ${initial.name}`}>
      <div className="row-2">
        <TextField id="medalha-nome" label="Nome" value={b.name} onChange={(e) => setB({ ...b, name: e.target.value })} />
        <TextField id="medalha-icone" label="Símbolo" hint="Um emoji, por exemplo 🏅" value={b.icon} onChange={(e) => setB({ ...b, icon: e.target.value })} />
      </div>
      <TextField id="medalha-texto" label="Como se ganha" value={b.description} onChange={(e) => setB({ ...b, description: e.target.value })} />
      <div className="row-2">
        <SelectField id="medalha-acao" label="Ação" value={b.action} onChange={(v) => setB({ ...b, action: v as EarnAction })} options={actionOptions} />
        <TextField id="medalha-vezes" label="Quantas vezes" inputMode="numeric" value={String(b.count)} onChange={(e) => setB({ ...b, count: Number(e.target.value.replace(/\D/g, "")) || 1 })} />
      </div>
      <Checkbox id="medalha-ativa" label="Ativa" checked={b.active} onChange={(v) => setB({ ...b, active: v })} />
      {save.isError ? <Notice tone="error" title="Não foi possível guardar">{errorMessage(save.error)}</Notice> : null}
      <div className="action-row">
        <Button type="submit" disabled={save.isPending}>Guardar medalha</Button>
        <Button variant="quiet" onClick={onDone}>Cancelar</Button>
      </div>
    </form>
  );
}

// ----- monthly challenges -----

function thisMonth() {
  return new Date().toISOString().slice(0, 7);
}

function Challenges() {
  const api = useApi();
  const qc = useQueryClient();
  const list = useQuery({ queryKey: ["patinhas-challenges"], queryFn: () => api.challenges() });
  const [editing, setEditing] = useState<Partial<ChallengeRow>>();
  const refresh = () => qc.invalidateQueries({ queryKey: ["patinhas-challenges"] });
  const remove = useMutation({ mutationFn: (id: string) => api.deleteChallenge(id), onSuccess: refresh });

  return (
    <div className="gn-stack gn-stack--m">
      <p>Um objetivo comum por mês, com uma barra que todos veem. Sem contagens decrescentes: basta o nome do mês.</p>
      {editing ? <ChallengeForm initial={editing} onDone={() => { setEditing(undefined); void refresh(); }} /> : <div><Button onClick={() => setEditing({ month: thisMonth(), action: "turno-hora", goal: 30, extraProgress: 0, active: true })}>Novo desafio</Button></div>}
      <Loading pending={list.isPending} error={list.error} />
      <ul className="bo-list">
        {list.data?.map((c) => (
          <li key={c.id} className="shift" aria-label={c.title}>
            <p className="small muted">{monthLabel(c.month)}{c.active ? "" : " · desligado"}</p>
            <p className="shift__title">{c.title}</p>
            <ProgressMeter label={`Progresso de ${c.title}`} value={c.progress} max={c.goal} valueText={`${c.progress} de ${c.goal}`} />
            <div className="action-row">
              <Button variant="secondary" onClick={() => setEditing(c)}>Editar<span className="gn-sr-only"> {c.title}</span></Button>
              <Button variant="quiet" onClick={() => remove.mutate(c.id)}>Apagar<span className="gn-sr-only"> {c.title}</span></Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ChallengeForm({ initial, onDone }: { initial: Partial<ChallengeRow>; onDone: () => void }) {
  const api = useApi();
  const [c, setC] = useState({ title: "", description: "", month: thisMonth(), action: "turno-hora" as EarnAction, goal: 30, extraProgress: 0, active: true, ...initial });
  const save = useMutation({
    mutationFn: () => api.saveChallenge({ id: c.id, title: c.title, description: c.description || undefined, month: c.month, action: c.action, goal: c.goal, extraProgress: c.extraProgress, active: c.active }),
    onSuccess: onDone,
  });
  const num = (v: string) => Number(v.replace(/\D/g, "")) || 0;
  return (
    <form className="gn-stack gn-stack--s shift" onSubmit={(e) => { e.preventDefault(); save.mutate(); }} aria-label={c.id ? `Editar ${initial.title}` : "Novo desafio"}>
      <TextField id="desafio-titulo" label="Nome do desafio" hint="Por exemplo: Novembro: 40 turnos no gatil" value={c.title} onChange={(e) => setC({ ...c, title: e.target.value })} />
      <TextField id="desafio-texto" label="Explicação (opcional)" value={c.description ?? ""} onChange={(e) => setC({ ...c, description: e.target.value })} />
      <div className="row-2">
        <TextField id="desafio-mes" label="Mês" type="month" value={c.month} onChange={(e) => setC({ ...c, month: e.target.value })} />
        <SelectField id="desafio-acao" label="O que conta" value={c.action} onChange={(v) => setC({ ...c, action: v as EarnAction })} options={actionOptions} />
      </div>
      <div className="row-2">
        <TextField id="desafio-objetivo" label="Objetivo" inputMode="numeric" value={String(c.goal)} onChange={(e) => setC({ ...c, goal: num(e.target.value) })} />
        <TextField id="desafio-extra" label="Já feito fora do site" hint="Some aqui o que não passa pelo site" inputMode="numeric" value={String(c.extraProgress)} onChange={(e) => setC({ ...c, extraProgress: num(e.target.value) })} />
      </div>
      <Checkbox id="desafio-ativo" label="Mostrar no site" checked={c.active} onChange={(v) => setC({ ...c, active: v })} />
      {save.isError ? <Notice tone="error" title="Não foi possível guardar">{errorMessage(save.error)}</Notice> : null}
      <div className="action-row">
        <Button type="submit" disabled={save.isPending}>Guardar desafio</Button>
        <Button variant="quiet" onClick={onDone}>Cancelar</Button>
      </div>
    </form>
  );
}

// ----- partner perks -----

function Perks() {
  const api = useApi();
  const partners = useQuery({ queryKey: ["partners"], queryFn: () => api.partners() });
  return (
    <div className="gn-stack gn-stack--m">
      <p>Defina quantas Patinhas custa cada vantagem, o nível mínimo e quantas vezes por mês cada pessoa a pode usar. Sem custo, a vantagem não se troca por Patinhas.</p>
      <Loading pending={partners.isPending} error={partners.error} />
      {partners.data?.map((p) => <PartnerPerks key={p.id} partner={p} />)}
    </div>
  );
}

function PartnerPerks({ partner }: { partner: Partner }) {
  const api = useApi();
  const qc = useQueryClient();
  const [perks, setPerks] = useState(partner.perks);
  const save = useMutation({
    mutationFn: () => api.updatePartner(partner.id, { perks: perks.map((p) => ({ ...p, id: p.id ?? slugify(p.description).slice(0, 40) })) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["partners"] }),
  });
  const set = (i: number, changes: Partial<Partner["perks"][number]>) => { save.reset(); setPerks((ps) => ps.map((p, j) => (j === i ? { ...p, ...changes } : p))); };
  const num = (v: string) => Number(v.replace(/\D/g, "")) || undefined;

  return (
    <form className="gn-stack gn-stack--s shift" onSubmit={(e) => { e.preventDefault(); save.mutate(); }} aria-label={partner.name}>
      <p className="shift__title">{partner.name}</p>
      {perks.length === 0 ? <p className="muted">Este parceiro ainda não tem vantagens.</p> : null}
      {perks.map((perk, i) => {
        const id = `${partner.id}-${i}`;
        return (
          <fieldset key={id} className="bo-fieldset">
            <legend>{perk.description}</legend>
            <div className="row-2">
              <TextField id={`${id}-custo`} label="Custo em Patinhas" inputMode="numeric" value={perk.patinhasCost ? String(perk.patinhasCost) : ""} onChange={(e) => set(i, { patinhasCost: num(e.target.value) })} />
              <SelectField id={`${id}-nivel`} label="Nível mínimo" value={String(perk.minLevel ?? "")} onChange={(v) => set(i, { minLevel: v ? Number(v) : undefined })} options={[{ value: "", label: "Qualquer nível" }, ...levels.slice(1).map((l) => ({ value: String(l.level), label: `${l.level}, ${l.name}` }))]} />
              <TextField id={`${id}-limite`} label="Vezes por mês" hint="Vazio: sem limite" inputMode="numeric" value={perk.monthlyLimitPerPerson ? String(perk.monthlyLimitPerPerson) : ""} onChange={(e) => set(i, { monthlyLimitPerPerson: num(e.target.value) })} />
            </div>
          </fieldset>
        );
      })}
      {save.isError ? <Notice tone="error" title="Não foi possível guardar">{errorMessage(save.error)}</Notice> : null}
      {perks.length > 0 ? (
        <div className="action-row">
          <Button type="submit" variant="secondary" disabled={save.isPending}>Guardar<span className="gn-sr-only"> vantagens de {partner.name}</span></Button>
          {save.isSuccess ? <p role="status">Guardado</p> : null}
        </div>
      ) : null}
    </form>
  );
}
