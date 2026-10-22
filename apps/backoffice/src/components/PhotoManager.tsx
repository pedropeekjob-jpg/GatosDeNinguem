import { useId, useRef, useState } from "react";
import { Button, Checkbox, Notice, TextField } from "@gn/ui";
import { errorMessage, useApi } from "../lib/api";
import { photoSrc, preparePhoto } from "../lib/photos";

export interface ManagedPhoto { url: string; alt: string; caption?: string; hidden?: boolean }

interface Props {
  photos: ManagedPhoto[];
  onChange: (photos: ManagedPhoto[]) => void;
  /** Suggested description for a new photo, e.g. "Mia, foto 2". */
  altFor: (position: number) => string;
  /** Show a caption field and a show/hide switch on each photo (used by the shelter carousel). */
  withCaption?: boolean;
  /** Label of the first photo, e.g. "Foto principal". */
  firstLabel?: string;
}

/**
 * Add, replace, reorder and remove photos. Works with a phone camera: the file picker
 * offers "Tirar fotografia", and photos are resized before upload.
 */
export function PhotoManager({ photos, onChange, altFor, withCaption, firstLabel = "Foto principal" }: Props) {
  const api = useApi();
  const id = useId();
  const addInput = useRef<HTMLInputElement>(null);
  const replaceInput = useRef<HTMLInputElement>(null);
  const [replacing, setReplacing] = useState<number>();
  const [busy, setBusy] = useState<string>();
  const [error, setError] = useState<string>();

  async function upload(file: File) {
    const { url } = await api.uploadPhoto(await preparePhoto(file));
    return url;
  }

  async function add(files: FileList | null) {
    if (!files?.length) return;
    setError(undefined);
    const added: ManagedPhoto[] = [];
    try {
      for (const [i, file] of [...files].entries()) {
        setBusy(`A carregar ${i + 1} de ${files.length}…`);
        added.push({ url: await upload(file), alt: altFor(photos.length + added.length + 1) });
      }
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      if (added.length) onChange([...photos, ...added]);
      setBusy(undefined);
    }
  }

  async function replace(files: FileList | null) {
    const index = replacing;
    if (!files?.[0] || index === undefined) return;
    setError(undefined);
    setBusy("A trocar a fotografia…");
    try {
      const url = await upload(files[0]);
      onChange(photos.map((p, i) => (i === index ? { ...p, url } : p)));
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(undefined);
      setReplacing(undefined);
    }
  }

  const move = (from: number, to: number) => {
    const next = [...photos];
    const [p] = next.splice(from, 1);
    next.splice(to, 0, p!);
    onChange(next);
  };
  const patch = (index: number, changes: Partial<ManagedPhoto>) => onChange(photos.map((p, i) => (i === index ? { ...p, ...changes } : p)));

  return (
    <div className="photos gn-stack gn-stack--s">
      {photos.length === 0 ? <p className="muted">Ainda não há fotografias.</p> : null}
      <ol className="photos__list">
        {photos.map((p, i) => {
          const n = i + 1;
          return (
            <li key={`${p.url}-${i}`} className={p.hidden ? "photos__item photos__item--hidden" : "photos__item"} aria-label={`Fotografia ${n}`}>
              <div className="photos__media">
                <img src={photoSrc(p.url)} alt="" />
                {p.hidden ? <span className="photos__badge photos__badge--quiet">Escondida</span> : i === 0 ? <span className="photos__badge">{firstLabel}</span> : <span className="photos__badge photos__badge--quiet">{n}</span>}
              </div>
              <div className="gn-stack gn-stack--s">
                <TextField id={`${id}-alt-${i}`} label={`Descrição da fotografia ${n}`} hint={i === 0 ? "Para quem não vê a imagem e para o Google." : undefined} value={p.alt} onChange={(e) => patch(i, { alt: e.target.value })} />
                {withCaption ? <TextField id={`${id}-cap-${i}`} label={`Legenda da fotografia ${n} (opcional)`} value={p.caption ?? ""} onChange={(e) => patch(i, { caption: e.target.value || undefined })} /> : null}
                {withCaption ? <Checkbox id={`${id}-show-${i}`} label={`Mostrar no site (fotografia ${n})`} checked={!p.hidden} onChange={(v) => patch(i, { hidden: v ? undefined : true })} /> : null}
                <div className="photos__actions">
                  {i > 0 ? <Button variant="secondary" onClick={() => move(i, 0)}>Tornar principal<span className="gn-sr-only"> (fotografia {n})</span></Button> : null}
                  {i > 0 ? <Button variant="quiet" onClick={() => move(i, i - 1)} aria-label={`Mover fotografia ${n} para cima`}>↑</Button> : null}
                  {i < photos.length - 1 ? <Button variant="quiet" onClick={() => move(i, i + 1)} aria-label={`Mover fotografia ${n} para baixo`}>↓</Button> : null}
                  <Button variant="quiet" disabled={!!busy} onClick={() => { setReplacing(i); replaceInput.current?.click(); }}>Trocar<span className="gn-sr-only"> fotografia {n}</span></Button>
                  <Button variant="quiet" onClick={() => onChange(photos.filter((_, j) => j !== i))}>Apagar<span className="gn-sr-only"> fotografia {n}</span></Button>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      <label className="gn-sr-only" htmlFor={`${id}-add`}>Escolher fotografias para adicionar</label>
      <input ref={addInput} id={`${id}-add`} className="gn-sr-only" type="file" accept="image/*" multiple tabIndex={-1} onChange={(e) => { void add(e.target.files); e.target.value = ""; }} />
      <label className="gn-sr-only" htmlFor={`${id}-replace`}>Escolher fotografia para trocar</label>
      <input ref={replaceInput} id={`${id}-replace`} className="gn-sr-only" type="file" accept="image/*" tabIndex={-1} onChange={(e) => { void replace(e.target.files); e.target.value = ""; }} />
      <div className="action-row">
        <Button variant="secondary" disabled={!!busy} onClick={() => addInput.current?.click()}>Adicionar fotografias</Button>
        {busy ? <span className="muted" role="status">{busy}</span> : null}
      </div>
      <p className="small muted">Pode escolher várias de uma vez ou tirar uma fotografia com o telemóvel. A primeira é a que aparece nos cartões e no Google.</p>
      {error ? <Notice tone="error" title="A fotografia não foi carregada">{error}</Notice> : null}
    </div>
  );
}
