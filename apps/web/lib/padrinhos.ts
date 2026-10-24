"use client";
import {
  newsSince,
  seedCareAlerts,
  seedCatCare,
  seedCats,
  seedSponsorLetters,
  seedSponsorships,
  sponsorNews,
  sponsorshipsOf,
  sponsorView,
  type CareAlert,
  type SponsorEmailUpdates,
  type Sponsorship,
  type SponsorView,
} from "@gn/domain";
import type { Failure, Result } from "./conta";

/**
 * "Os meus afilhados" in the godparent's own area: each cat, where it is, the monthly debit and the news.
 * Two versions, like the account: the real API and an in-browser demo.
 */
export type Afilhados = { debitAvailable: boolean; sponsorships: SponsorView[] };

export interface PadrinhosClient {
  readonly demo: boolean;
  list(): Promise<Afilhados | null>;
  /** The provider's secure page where the godparent gives their IBAN. The demo pretends it went well. */
  startDebit(id: string): Promise<Result<{ checkoutUrl?: string }>>;
  cancel(id: string): Promise<Result<object>>;
  setEmailUpdates(id: string, emailUpdates: SponsorEmailUpdates): Promise<Result<object>>;
}

const fail = (message: string): Failure => ({ ok: false, message, fieldErrors: {} });
const OFFLINE = "Sem ligação à internet. Verifique a ligação e tente outra vez.";

function httpClient(): PadrinhosClient {
  async function call(method: string, path: string, body?: unknown): Promise<Result<Record<string, unknown>>> {
    try {
      const res = await fetch(`/api/conta/eu/apadrinhamentos${path}`, {
        method,
        headers: body !== undefined ? { "content-type": "application/json" } : undefined,
        body: body !== undefined ? JSON.stringify(body) : undefined,
        credentials: "same-origin",
      });
      const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      return res.ok ? { ok: true, ...data } : fail((data.message as string) ?? "Não foi possível guardar. Tente outra vez.");
    } catch {
      return fail(OFFLINE);
    }
  }
  return {
    demo: false,
    async list() {
      const res = await fetch("/api/conta/eu/apadrinhamentos", { credentials: "same-origin" });
      if (res.status === 401) return null;
      if (!res.ok) throw new Error("Erro");
      return (await res.json()) as Afilhados;
    },
    startDebit: (id) => call("POST", `/${encodeURIComponent(id)}/debito`),
    cancel: (id) => call("POST", `/${encodeURIComponent(id)}/cancelar`),
    setEmailUpdates: (id, emailUpdates) => call("PUT", `/${encodeURIComponent(id)}/preferencias`, { emailUpdates }),
  };
}

// ----- demo: Ana (ana@exemplo.pt, 912 000 001) godmother of Tobias, kept in this browser -----

const DEMO_KEY = "gn-padrinhos-demo";
const ACCOUNT_KEY = "gn-conta-demo";
const CARE_KEY = "gn-cuidados-demo";
type DemoState = { changes: Record<string, Partial<Sponsorship>> };

/** The example data was written for October 2026: move it so it always reads as recent. */
const delta = () => Math.max(0, Date.now() - Date.parse("2026-10-22T12:00:00.000Z"));
const moved = (iso: string) => new Date(Date.parse(iso) + delta()).toISOString();

function load(): DemoState {
  try {
    const raw = localStorage.getItem(DEMO_KEY);
    if (raw) return JSON.parse(raw) as DemoState;
  } catch { /* fall through */ }
  return { changes: {} };
}
function save(state: DemoState) {
  try { localStorage.setItem(DEMO_KEY, JSON.stringify(state)); } catch { /* storage unavailable */ }
}
function signedIn(): { email?: string; phone?: string } | undefined {
  try {
    const raw = localStorage.getItem(ACCOUNT_KEY);
    if (!raw) return undefined;
    const s = JSON.parse(raw) as { accounts: { id: string; email?: string; phone?: string }[]; signedIn?: string };
    return s.accounts.find((a) => a.id === s.signedIn);
  } catch {
    return undefined;
  }
}
/** What volunteers wrote in the demo's "No gatil" page also reaches the godparent, like on the real site. */
function demoAlerts(): CareAlert[] {
  try {
    const raw = localStorage.getItem(CARE_KEY);
    if (raw) return (JSON.parse(raw) as { alerts: CareAlert[] }).alerts;
  } catch { /* fall through */ }
  return seedCareAlerts.map((a) => ({ ...a, createdAt: moved(a.createdAt) }));
}

function demoClient(): PadrinhosClient {
  const mine = () => {
    const who = signedIn();
    if (!who) return undefined;
    const state = load();
    const list = sponsorshipsOf(seedSponsorships, who).map((s) => ({ ...s, startDate: moved(`${s.startDate}T12:00:00.000Z`).slice(0, 10), ...state.changes[s.id] }) as Sponsorship);
    return { state, list };
  };
  const change = (id: string, patch: Partial<Sponsorship>): Result<object> => {
    const m = mine();
    if (!m?.list.some((s) => s.id === id)) return fail("Apadrinhamento não encontrado.");
    m.state.changes[id] = { ...m.state.changes[id], ...patch };
    save(m.state);
    return { ok: true };
  };
  return {
    demo: true,
    async list() {
      const m = mine();
      if (!m) return null;
      const alerts = demoAlerts();
      const letters = seedSponsorLetters.map((l) => ({ ...l, createdAt: moved(l.createdAt) }));
      const sponsorships = m.list.flatMap((s) => {
        const cat = seedCats.find((c) => c.slug === s.catSlug);
        if (!cat) return [];
        const since = newsSince(s);
        return [sponsorView(s, cat, seedCatCare.find((c) => c.catId === cat.id), sponsorNews({ alerts, letters, catId: cat.id, catSlug: cat.slug, since }))];
      });
      return { debitAvailable: true, sponsorships };
    },
    async startDebit(id) {
      const s = mine()?.list.find((x) => x.id === id);
      if (!s) return fail("Apadrinhamento não encontrado.");
      return change(id, { active: true, pending: false, payment: "debito", debit: { provider: "demo", status: "ativo", startedAt: new Date().toISOString(), paidCents: 0 } });
    },
    async cancel(id) {
      const s = mine()?.list.find((x) => x.id === id);
      if (!s) return fail("Apadrinhamento não encontrado.");
      return change(id, { active: false, pending: false, ...(s.debit ? { debit: { ...s.debit, status: "cancelado" as const, cancelledAt: new Date().toISOString() } } : {}) });
    },
    async setEmailUpdates(id, emailUpdates) { return change(id, { emailUpdates }); },
  };
}

let client: PadrinhosClient | undefined;
export function padrinhosClient(): PadrinhosClient {
  client ??= process.env.NEXT_PUBLIC_CONTAS_DEMO === "1" ? demoClient() : httpClient();
  return client;
}
