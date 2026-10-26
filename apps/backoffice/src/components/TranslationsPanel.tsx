import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { translationLangs, type TranslationLang } from "@gn/domain";
import { Badge, Button, Notice, TextArea, TextField } from "@gn/ui";
import { useApi } from "../lib/api";

export type TranslationEntry = Record<string, string | string[] | boolean | undefined> & { auto?: boolean };
export type Translations = Partial<Record<TranslationLang, TranslationEntry>>;
export type TranslationField = { key: string; label: string; long?: boolean; list?: boolean };

const langLabel: Record<TranslationLang, string> = { en: "Inglês", es: "Espanhol", fr: "Francês" };

/** Whether the API translates by itself (shared by every form). */
export function useTranslationStatus() {
  const api = useApi();
  return useQuery({ queryKey: ["traducoes"], queryFn: () => api.translationStatus(), staleTime: 60_000 });
}

/**
 * The texts of a cat, a news item… in English, Spanish and French. The API fills them in automatically when the
 * form is saved; the team can read them, correct them (then they are never overwritten) or ask for a fresh one.
 */
export function TranslationsPanel({ id, fields, value, onChange }: { id: string; fields: TranslationField[]; value: Translations | undefined; onChange: (t: Translations) => void }) {
  const status = useTranslationStatus();
  const [lang, setLang] = useState<TranslationLang>("en");
  const all = value ?? {};
  const entry = all[lang];
  const on = status.data?.on;
  const set = (key: string, text: string, list?: boolean) => {
    const v = list ? text.split(",").map((s) => s.trim()).filter(Boolean) : text;
    onChange({ ...all, [lang]: { ...entry, [key]: list ? (v.length ? v : undefined) : text || undefined, auto: false } });
  };
  const retranslate = () => { const { [lang]: _gone, ...rest } = all; onChange(rest); };
  const markChecked = () => onChange({ ...all, [lang]: { ...entry, auto: false } });

  return (
    <fieldset className="bo-fieldset gn-stack gn-stack--s">
      <legend>Noutros idiomas</legend>
      {status.data && !on ? (
        <p className="small muted">A tradução automática ainda não está ligada (falta a chave da DeepL na API). Pode escrever as traduções aqui; o que ficar vazio aparece em português.</p>
      ) : (
        <p className="small muted">Traduzimos automaticamente ao guardar. Leia, corrija o que for preciso, e a sua versão nunca é substituída.</p>
      )}
      <div className="tabs" role="tablist" aria-label="Idioma">
        {translationLangs.map((l) => (
          <button key={l} type="button" role="tab" aria-selected={lang === l} aria-controls={`${id}-${l}`} className="tabs__tab" onClick={() => setLang(l)}>
            {langLabel[l]}{all[l]?.auto ? <span className="tabs__dot" aria-label=" (por rever)" /> : null}
          </button>
        ))}
      </div>
      <div id={`${id}-${lang}`} role="tabpanel" className="gn-stack gn-stack--s">
        <div className="action-row">
          {!entry ? <Badge tone="neutral">{on ? "Traduzido ao guardar" : "Sem tradução"}</Badge>
            : entry.auto ? <Badge tone="info">Tradução automática, por rever</Badge>
            : <Badge tone="success">Revista pela equipa</Badge>}
        </div>
        {fields.map((f) => {
          const raw = entry?.[f.key];
          const text = Array.isArray(raw) ? raw.join(", ") : typeof raw === "string" ? raw : "";
          const props = { id: `${id}-${lang}-${f.key}`, label: `${f.label} (${langLabel[lang].toLowerCase()})`, value: text, lang, onChange: (e: { target: { value: string } }) => set(f.key, e.target.value, f.list) };
          return f.long ? <TextArea key={f.key} rows={4} {...props} /> : <TextField key={f.key} hint={f.list ? "Separadas por vírgulas" : undefined} {...props} />;
        })}
        <div className="action-row">
          {entry?.auto ? <Button variant="secondary" onClick={markChecked}>Está bem assim</Button> : null}
          {entry && on ? <Button variant="quiet" onClick={retranslate}>Voltar a traduzir automaticamente</Button> : null}
        </div>
        {entry && !entry.auto && on ? <p className="small muted">Mudou o texto em português? Carregue em “Voltar a traduzir automaticamente” para a tradução acompanhar.</p> : null}
      </div>
      {status.isError ? <Notice tone="error" title="Não foi possível saber se a tradução está ligada">Tente outra vez mais tarde.</Notice> : null}
    </fieldset>
  );
}
