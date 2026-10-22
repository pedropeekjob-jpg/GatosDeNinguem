import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LIMITS } from "@gn/seo";
import { AnimatedLogo, Badge, Button, Checkbox, Notice, SearchPreview, TextArea, TextField } from "@gn/ui";
import { errorMessage, useApi, type AuditItem } from "../lib/api";
import type { Redirect, SeoFields, SeoSettings } from "../lib/types";

type Tab = "paginas" | "redirecionamentos" | "geral";

/** SEO workspace: everything an SEO specialist needs, no code involved. */
export function SeoPage() {
  const [tab, setTab] = useState<Tab>("paginas");
  return (
    <div className="gn-stack gn-stack--m">
      <h1>SEO</h1>
      <p className="gn-lead">Títulos e descrições que aparecem no Google, endereços antigos e definições gerais. As alterações ficam visíveis no site em poucos segundos.</p>
      <div className="tabs" role="tablist" aria-label="Secções de SEO">
        {(
          [
            ["paginas", "Páginas e gatos"],
            ["redirecionamentos", "Redirecionamentos"],
            ["geral", "Definições gerais"],
          ] as const
        ).map(([key, label]) => (
          <button key={key} role="tab" type="button" aria-selected={tab === key} className="tabs__tab" onClick={() => setTab(key)}>
            {label}
          </button>
        ))}
      </div>
      {tab === "paginas" ? <SeoPages /> : tab === "redirecionamentos" ? <Redirects /> : <GeneralSettings />}
    </div>
  );
}

function SeoPages() {
  const api = useApi();
  const audit = useQuery({ queryKey: ["seo-audit"], queryFn: () => api.seoAudit() });
  const settings = useQuery({ queryKey: ["seo-settings"], queryFn: () => api.seoSettings() });
  const [selected, setSelected] = useState<AuditItem>();

  if (audit.isPending || settings.isPending) return <AnimatedLogo variant="loader" size={110} />;
  if (audit.isError || settings.isError) return <Notice tone="error" title="Não foi possível carregar">{errorMessage(audit.error ?? settings.error)}</Notice>;

  const issuesFor = (id: string) => audit.data.issues.filter((i) => i.id === id);
  const errors = audit.data.issues.filter((i) => i.severity === "erro").length;
  const warnings = audit.data.issues.length - errors;

  if (selected) {
    return <SeoEditor item={selected} siteUrl={settings.data.siteUrl} issues={issuesFor(selected.id).map((i) => i.message)} onClose={() => setSelected(undefined)} />;
  }

  return (
    <div className="gn-stack gn-stack--m">
      {audit.data.issues.length === 0 ? (
        <Notice tone="success" title="Tudo em ordem">Todas as páginas têm título e descrição com bom tamanho.</Notice>
      ) : (
        <Notice tone="warning" title={`${errors} erros e ${warnings} avisos`}>Comece pelos erros. Carregue em “Editar” para corrigir.</Notice>
      )}
      <div className="table-wrap">
        <table className="table">
          <caption className="gn-sr-only">Páginas do site e o seu estado de SEO</caption>
          <thead>
            <tr><th scope="col">Página</th><th scope="col">Título no Google</th><th scope="col">Estado</th><th scope="col"><span className="gn-sr-only">Ações</span></th></tr>
          </thead>
          <tbody>
            {audit.data.items.map((item) => {
              const issues = issuesFor(item.id);
              return (
                <tr key={`${item.kind}-${item.id}`}>
                  <td><strong>{item.label}</strong><br /><span className="small muted">{item.path}</span></td>
                  <td>{item.title}</td>
                  <td>
                    {item.noindex ? <Badge tone="neutral">Escondida do Google</Badge> : issues.length === 0 ? <Badge tone="success">Bom</Badge> : <Badge tone={issues.some((i) => i.severity === "erro") ? "error" : "warning"}>{issues.length} {issues.length === 1 ? "problema" : "problemas"}</Badge>}
                  </td>
                  <td><Button variant="secondary" onClick={() => setSelected(item)}>Editar<span className="gn-sr-only"> {item.label}</span></Button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SeoEditor({ item, siteUrl, issues, onClose }: { item: AuditItem; siteUrl: string; issues: string[]; onClose: () => void }) {
  const api = useApi();
  const queryClient = useQueryClient();
  // Start from what is published, so the editor shows the real result.
  const [title, setTitle] = useState(item.title);
  const [description, setDescription] = useState(item.description);
  const [canonicalUrl, setCanonical] = useState("");
  const [ogImage, setOgImage] = useState("");
  const [noindex, setNoindex] = useState(item.noindex);
  const [jsonLd, setJsonLd] = useState("");
  const [jsonError, setJsonError] = useState<string>();

  const save = useMutation({
    mutationFn: (seo: SeoFields) => api.saveSeo({ kind: item.kind, id: item.id }, seo),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["seo-audit"] }),
  });

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    let extra: SeoFields["jsonLd"];
    if (jsonLd.trim()) {
      try {
        const parsed = JSON.parse(jsonLd);
        extra = Array.isArray(parsed) ? parsed : [parsed];
        setJsonError(undefined);
      } catch {
        setJsonError("O JSON-LD não é JSON válido. Verifique vírgulas e aspas.");
        return;
      }
    }
    save.mutate({
      title: title.trim() || undefined,
      description: description.trim() || undefined,
      canonicalUrl: canonicalUrl.trim() || undefined,
      ogImage: ogImage.trim() || undefined,
      noindex: noindex || undefined,
      jsonLd: extra,
    });
  }

  return (
    <form onSubmit={onSubmit} className="gn-stack gn-stack--m" aria-labelledby="seo-editor-title">
      <div className="action-row">
        <Button variant="quiet" onClick={onClose}>← Voltar à lista</Button>
      </div>
      <h2 id="seo-editor-title">SEO de “{item.label}”</h2>
      <p className="muted">{siteUrl.replace(/\/$/, "")}{item.path}</p>
      {issues.length > 0 ? (
        <Notice tone="warning" title="A corrigir">
          <ul>{issues.map((i) => <li key={i}>{i}</li>)}</ul>
        </Notice>
      ) : null}
      <div className="split">
        <div className="gn-stack gn-stack--m">
          <TextField id="seo-title" label="Título no Google" hint="Escrito aqui, aparece exatamente assim. Deixe vazio para usar o título automático." value={title} onChange={(e) => setTitle(e.target.value)} recommended={LIMITS.title} />
          <TextArea id="seo-description" label="Descrição no Google" hint="Uma ou duas frases que convidem a clicar." rows={3} value={description} onChange={(e) => setDescription(e.target.value)} recommended={LIMITS.description} />
          <TextField id="seo-canonical" label="URL canónico (opcional)" hint="Só se esta página for cópia de outra." type="url" value={canonicalUrl} onChange={(e) => setCanonical(e.target.value)} />
          <TextField id="seo-og" label="Imagem para partilhas (opcional)" hint="Endereço de uma imagem 1200×630 para Facebook e WhatsApp." type="url" value={ogImage} onChange={(e) => setOgImage(e.target.value)} />
          <Checkbox id="seo-noindex" label="Esconder esta página do Google" hint="A página continua acessível a quem tiver o link." checked={noindex} onChange={setNoindex} />
          <TextArea id="seo-jsonld" label="Dados estruturados extra (JSON-LD, opcional)" hint="Para especialistas. Juntam-se aos dados automáticos." rows={5} value={jsonLd} onChange={(e) => setJsonLd(e.target.value)} error={jsonError} />
        </div>
        <div className="gn-stack gn-stack--s">
          <p><strong>Pré-visualização no Google</strong></p>
          <SearchPreview title={title || item.title} url={`${siteUrl.replace(/\/$/, "")}${item.path}`} description={description || item.description} />
        </div>
      </div>
      {save.isError ? <Notice tone="error" title="Não foi guardado">{errorMessage(save.error)}</Notice> : null}
      {save.isSuccess ? <Notice tone="success" title="Guardado">O site é atualizado em poucos segundos.</Notice> : null}
      <div className="action-row">
        <Button type="submit" disabled={save.isPending}>{save.isPending ? "A guardar…" : "Guardar"}</Button>
      </div>
    </form>
  );
}

function Redirects() {
  const api = useApi();
  const queryClient = useQueryClient();
  const list = useQuery({ queryKey: ["redirects"], queryFn: () => api.redirects() });
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const add = useMutation({
    mutationFn: (r: Omit<Redirect, "id">) => api.addRedirect(r),
    onSuccess: () => { setFrom(""); setTo(""); return queryClient.invalidateQueries({ queryKey: ["redirects"] }); },
  });
  const remove = useMutation({ mutationFn: (id: string) => api.deleteRedirect(id), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["redirects"] }) });

  return (
    <div className="gn-stack gn-stack--m">
      <p>Use quando uma página muda de endereço, para não perder visitas nem posição no Google.</p>
      <form className="gn-stack gn-stack--s" onSubmit={(e) => { e.preventDefault(); add.mutate({ from: from.trim(), to: to.trim(), permanent: true }); }}>
        <TextField id="redir-from" label="Endereço antigo" hint="Por exemplo: /gatos/resgates" value={from} onChange={(e) => setFrom(e.target.value)} />
        <TextField id="redir-to" label="Novo endereço" hint="Por exemplo: /finais-felizes" value={to} onChange={(e) => setTo(e.target.value)} />
        {add.isError ? <Notice tone="error" title="Não foi adicionado">{errorMessage(add.error)}</Notice> : null}
        <div><Button type="submit" disabled={!from || !to || add.isPending}>Adicionar redirecionamento</Button></div>
      </form>
      {list.data ? (
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th scope="col">De</th><th scope="col">Para</th><th scope="col"><span className="gn-sr-only">Ações</span></th></tr></thead>
            <tbody>
              {list.data.map((r) => (
                <tr key={r.id}>
                  <td>{r.from}</td>
                  <td>{r.to}</td>
                  <td><Button variant="quiet" onClick={() => remove.mutate(r.id)}>Remover<span className="gn-sr-only"> {r.from}</span></Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}

function GeneralSettings() {
  const api = useApi();
  const query = useQuery({ queryKey: ["seo-settings"], queryFn: () => api.seoSettings() });
  const [draft, setDraft] = useState<SeoSettings>();
  useEffect(() => { if (query.data && !draft) setDraft(query.data); }, [query.data, draft]);
  const save = useMutation({ mutationFn: (s: SeoSettings) => api.saveSeoSettings(s) });
  const templateOk = useMemo(() => draft?.titleTemplate.includes("%s") ?? true, [draft]);

  if (!draft) return <AnimatedLogo variant="loader" size={110} />;
  const set = <K extends keyof SeoSettings>(key: K, value: SeoSettings[K]) => setDraft({ ...draft, [key]: value });

  return (
    <form className="gn-stack gn-stack--m" onSubmit={(e) => { e.preventDefault(); save.mutate(draft); }}>
      <TextField id="g-name" label="Nome do site" value={draft.siteName} onChange={(e) => set("siteName", e.target.value)} />
      <TextField id="g-url" label="Endereço do site" type="url" value={draft.siteUrl} onChange={(e) => set("siteUrl", e.target.value)} />
      <TextField id="g-template" label="Modelo de título" hint="%s é substituído pelo título de cada página." value={draft.titleTemplate} onChange={(e) => set("titleTemplate", e.target.value)} error={templateOk ? undefined : "O modelo tem de incluir %s."} />
      <TextArea id="g-desc" label="Descrição por omissão" rows={3} value={draft.defaultDescription} onChange={(e) => set("defaultDescription", e.target.value)} recommended={LIMITS.description} />
      <TextField id="g-og" label="Imagem por omissão para partilhas" type="url" value={draft.defaultOgImage ?? ""} onChange={(e) => set("defaultOgImage", e.target.value || undefined)} />
      <TextField id="g-gsc" label="Código de verificação do Google Search Console" value={draft.googleSiteVerification ?? ""} onChange={(e) => set("googleSiteVerification", e.target.value || undefined)} />
      <TextArea id="g-robots" label="Linhas extra no robots.txt" hint="Por exemplo: Disallow: /rascunhos" rows={3} value={draft.robotsExtra ?? ""} onChange={(e) => set("robotsExtra", e.target.value || undefined)} />
      {save.isError ? <Notice tone="error" title="Não foi guardado">{errorMessage(save.error)}</Notice> : null}
      {save.isSuccess ? <Notice tone="success" title="Guardado">As definições já estão em vigor.</Notice> : null}
      <div><Button type="submit" disabled={!templateOk || save.isPending}>Guardar definições</Button></div>
    </form>
  );
}
