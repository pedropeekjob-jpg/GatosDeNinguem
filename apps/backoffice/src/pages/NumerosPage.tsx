import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AnimatedLogo, Button, Notice, TextField } from "@gn/ui";
import { errorMessage, useApi } from "../lib/api";
import type { Impact } from "../lib/types";

/** The numbers and campaign bar on the home page. */
export function NumerosPage() {
  const api = useApi();
  const query = useQuery({ queryKey: ["impact"], queryFn: () => api.impact() });
  const [draft, setDraft] = useState<Impact>();
  useEffect(() => { if (query.data && !draft) setDraft(query.data); }, [query.data, draft]);
  const save = useMutation({ mutationFn: (i: Impact) => api.saveImpact({ ...i, updatedAt: new Date().toISOString() }) });
  if (!draft) return <AnimatedLogo variant="loader" size={110} />;
  const num = (key: "catsInShelter" | "adoptionsThisYear" | "sterilizationsThisYear" | "volunteers", label: string) => (
    <TextField id={`n-${key}`} label={label} type="number" inputMode="numeric" value={String(draft[key])} onChange={(e) => setDraft({ ...draft, [key]: Number(e.target.value) })} />
  );
  const c = draft.campaign;
  return (
    <form className="gn-stack gn-stack--m" onSubmit={(e) => { e.preventDefault(); save.mutate(draft); }}>
      <h1>Números da página inicial</h1>
      {num("catsInShelter", "Gatos no gatil hoje")}
      {num("adoptionsThisYear", "Adoções este ano")}
      {num("sterilizationsThisYear", "Esterilizações este ano")}
      {num("volunteers", "Voluntários ativos")}
      <h2>Campanha em destaque</h2>
      {c ? (
        <>
          <TextField id="c-title" label="Nome da campanha" value={c.title} onChange={(e) => setDraft({ ...draft, campaign: { ...c, title: e.target.value } })} />
          <div className="row-2">
            <TextField id="c-current" label="Já conseguimos" type="number" value={String(c.current)} onChange={(e) => setDraft({ ...draft, campaign: { ...c, current: Number(e.target.value) } })} />
            <TextField id="c-goal" label="Meta" type="number" value={String(c.goal)} onChange={(e) => setDraft({ ...draft, campaign: { ...c, goal: Number(e.target.value) } })} />
          </div>
          <TextField id="c-unit" label="Unidade" hint="Por exemplo: gatos, euros, sacos de ração" value={c.unit} onChange={(e) => setDraft({ ...draft, campaign: { ...c, unit: e.target.value } })} />
          <div><Button variant="quiet" onClick={() => setDraft({ ...draft, campaign: undefined })}>Terminar campanha</Button></div>
        </>
      ) : (
        <div><Button variant="secondary" onClick={() => setDraft({ ...draft, campaign: { title: "", current: 0, goal: 10, unit: "gatos", href: "/doar" } })}>Criar campanha</Button></div>
      )}
      {save.isError ? <Notice tone="error" title="Não foi guardado">{errorMessage(save.error)}</Notice> : null}
      {save.isSuccess ? <Notice tone="success" title="Guardado">A página inicial é atualizada em poucos segundos.</Notice> : null}
      <div><Button type="submit">Guardar números</Button></div>
    </form>
  );
}
