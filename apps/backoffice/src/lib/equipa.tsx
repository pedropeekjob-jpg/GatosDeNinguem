import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { locationLabel, unreadAlerts, type Author, type CatLocation } from "@gn/domain";
import { Button, TextField } from "@gn/ui";
import { useApi } from "./api";

/**
 * Who is making changes. Until each volunteer has a login, the back office uses one
 * shared code, so each phone remembers the name of the person using it.
 */
const NAME_KEY = "gn-o-meu-nome";
const SEEN_KEY = "gn-novidades-vistas";

function read(key: string) {
  try { return localStorage.getItem(key) ?? undefined; } catch { return undefined; }
}
function write(key: string, value: string) {
  try { localStorage.setItem(key, value); } catch { /* private mode: keep it for this visit only */ }
}

const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());
function useStored(key: string): [string | undefined, (v: string) => void] {
  const [value, setValue] = useState(() => read(key));
  useEffect(() => {
    const update = () => setValue(read(key));
    listeners.add(update);
    return () => { listeners.delete(update); };
  }, [key]);
  return [value, (v) => { write(key, v); setValue(v); notify(); }];
}

export function useAuthor(): [Author | undefined, (name: string) => void] {
  const [name, setName] = useStored(NAME_KEY);
  return [name && name.trim().length >= 2 ? { name: name.trim() } : undefined, setName];
}

/** Shown on every form that changes something: asks the name once, then just says who is recorded. */
export function AuthorField({ id }: { id: string }) {
  const [author, setName] = useAuthor();
  const [editing, setEditing] = useState(!author);
  const [draft, setDraft] = useState(author?.name ?? "");
  if (author && !editing) {
    return (
      <p className="small muted">
        Fica registado como <strong>{author.name}</strong>.{" "}
        <Button variant="quiet" onClick={() => { setDraft(author.name); setEditing(true); }}>Não sou eu</Button>
      </p>
    );
  }
  return (
    <TextField
      id={id}
      label="O seu nome"
      hint="Fica guardado neste aparelho e aparece junto das suas alterações."
      autoComplete="name"
      value={draft}
      onChange={(e) => { setDraft(e.target.value); if (e.target.value.trim().length >= 2) setName(e.target.value); }}
    />
  );
}

/** Care alerts, refreshed every minute so changes reach everyone without reloading. */
export function useCareAlerts() {
  const api = useApi();
  return useQuery({ queryKey: ["careAlerts"], queryFn: () => api.careAlerts(), refetchInterval: 60_000 });
}

export function useUnreadAlerts() {
  const alerts = useCareAlerts();
  const [seen, setSeen] = useStored(SEEN_KEY);
  const unread = unreadAlerts(alerts.data ?? [], seen);
  return { alerts, unread, seen, markSeen: () => setSeen(new Date().toISOString()) };
}

export function LocationTag({ location }: { location: CatLocation | null | undefined }) {
  if (!location) return <span className="loc loc--unknown">Sítio por definir</span>;
  return <span className={location.spot === "jaula" ? "loc loc--cage" : "loc"}>{locationLabel(location)}</span>;
}

/** Explains a disabled save button to someone who has not written their name yet. */
export function NameNeeded() {
  const [author] = useAuthor();
  return author ? null : <p className="small muted">Para guardar, escreva o seu nome no topo da página.</p>;
}
