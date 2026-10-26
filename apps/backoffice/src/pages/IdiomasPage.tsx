import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { uncheckedTranslations } from "@gn/domain";
import { Badge, Button, Notice } from "@gn/ui";
import { useTranslationStatus } from "../components/TranslationsPanel";
import { errorMessage, useApi } from "../lib/api";

/** The site in English, Spanish and French: whether texts are translated by themselves, and what still needs a look. */
export function IdiomasPage() {
  const api = useApi();
  const qc = useQueryClient();
  const status = useTranslationStatus();
  const cats = useQuery({ queryKey: ["cats"], queryFn: () => api.cats() });
  const posts = useQuery({ queryKey: ["posts"], queryFn: () => api.posts() });
  const fill = useMutation({
    mutationFn: () => api.fillTranslations(),
    onSuccess: () => Promise.all([qc.invalidateQueries({ queryKey: ["cats"] }), qc.invalidateQueries({ queryKey: ["posts"] })]),
  });
  const toCheck = [
    ...(cats.data ?? []).map((c) => ({ id: c.id, kind: "Gato", name: c.name, langs: uncheckedTranslations(c), missing: !c.translations })),
    ...(posts.data ?? []).map((p) => ({ id: p.id, kind: "Notícia", name: p.title, langs: uncheckedTranslations(p), missing: !p.translations })),
  ].filter((x) => x.langs.length > 0 || x.missing);

  return (
    <div className="gn-stack gn-stack--m">
      <h1>Idiomas</h1>
      <p>O site também está em inglês, espanhol e francês. Os menus e as páginas fixas já estão traduzidos. Os textos que a equipa escreve (gatos, notícias, páginas, parceiros e loja) são traduzidos automaticamente quando os guarda.</p>
      {status.data?.on ? (
        <Notice tone="success" title="Tradução automática ligada">
          Traduz com {status.data.provider}. As traduções aparecem em cada gato e notícia, em “Noutros idiomas”, para ler e corrigir.
        </Notice>
      ) : status.data ? (
        <Notice tone="info" title="Tradução automática desligada">
          Falta pôr a chave da DeepL na API (DEEPL_API_KEY). O plano gratuito chega bem para a associação. Até lá, os textos sem tradução aparecem em português.
        </Notice>
      ) : null}
      {status.data?.on ? (
        <div className="gn-stack gn-stack--s">
          <div><Button variant="secondary" onClick={() => fill.mutate()} disabled={fill.isPending}>{fill.isPending ? "A traduzir…" : "Traduzir o que falta"}</Button></div>
          {fill.data ? <p className="small" role="status">{fill.data.updated === 0 ? "Já estava tudo traduzido." : `Traduzidos ${fill.data.updated} textos.`}</p> : null}
          {fill.isError ? <Notice tone="error" title="Não foi possível traduzir">{errorMessage(fill.error)}</Notice> : null}
        </div>
      ) : null}
      <h2>Por rever</h2>
      {toCheck.length === 0 ? <p className="muted">Nada por rever.</p> : (
        <ul className="gn-stack gn-stack--s">
          {toCheck.map((x) => (
            <li key={`${x.kind}-${x.id}`} className="shift">
              <div className="shift__head"><p className="shift__title">{x.name}</p><Badge tone="neutral">{x.kind}</Badge></div>
              <p className="small muted">{x.missing ? "Ainda sem tradução." : `Tradução automática por rever: ${x.langs.map((l) => ({ en: "inglês", es: "espanhol", fr: "francês" })[l]).join(", ")}.`}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
