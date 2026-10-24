"use client";
import {
  award,
  balance,
  buildPainel,
  canRedeem,
  contactKey,
  defaultPointsRules,
  earnedTotal,
  levelFor,
  parseContact,
  redemptionCode,
  seedAccounts,
  seedBadges,
  seedChallenges,
  seedEntries,
  seedPartners,
  seedRedemptions,
  signInStartSchema,
  signInVerifySchema,
  type Account,
  type AccountUpdate,
  type EarnAction,
  type FeatureFlags,
  type Painel,
  type PatinhasEntry,
  type Redemption,
} from "@gn/domain";
import { features } from "./features";

/** The helper's page as the site shows it, with what is switched on. */
export type MeuPainel = Painel & { account: Account; features: FeatureFlags };

export type CodeResult = { status: "precisa-nome" } | { status: "codigo-enviado"; sentTo: "email" | "telemovel"; newAccount: boolean; demoCode?: string };
export type Failure = { ok: false; message: string; fieldErrors: Record<string, string> };
export type Result<T> = ({ ok: true } & T) | Failure;

/** Everything the account pages need. Two versions: the real API, and an in-browser demo. */
export interface ContaClient {
  readonly demo: boolean;
  requestCode(input: { contact: string; name?: string; consent?: boolean }): Promise<Result<{ data: CodeResult }>>;
  verifyCode(input: { contact: string; code: string }): Promise<Result<{ account: Account; newAccount: boolean }>>;
  painel(): Promise<MeuPainel | null>;
  update(changes: AccountUpdate): Promise<Result<{ account: Account }>>;
  finishQuiz(): Promise<{ counted: boolean; points?: number }>;
  redeem(partnerId: string, perkId: string): Promise<Result<{ redemption: Redemption }>>;
  signOut(): Promise<void>;
  deleteAccount(): Promise<void>;
  /** Demo only: pretend the team confirmed something, to see points, levels and badges move. */
  simulate?(action: EarnAction): Promise<void>;
}

// ----- who is signed in, for the header (the real session is an httpOnly cookie) -----

const WHO_KEY = "gn-conta";
const WHO_EVENT = "gn-conta-change";
export function rememberSignedIn(account: Pick<Account, "name"> | null) {
  try {
    if (account) localStorage.setItem(WHO_KEY, JSON.stringify({ name: account.name }));
    else localStorage.removeItem(WHO_KEY);
  } catch { /* storage unavailable */ }
  window.dispatchEvent(new Event(WHO_EVENT));
}
export function readSignedIn(): { name: string } | null {
  try {
    const raw = localStorage.getItem(WHO_KEY);
    return raw ? (JSON.parse(raw) as { name: string }) : null;
  } catch {
    return null;
  }
}
export const SIGNED_IN_EVENT = WHO_EVENT;

// ----- shared helpers -----

type Issue = { path: (string | number)[]; message: string };
const fail = (message: string, issues: Issue[] = []): Failure => {
  const fieldErrors: Record<string, string> = {};
  for (const issue of issues) fieldErrors[String(issue.path[0])] ??= issue.message;
  return { ok: false, message, fieldErrors };
};
const OFFLINE = "Sem ligação à internet. Verifique a ligação e tente outra vez.";

// ----- real API, through the site's own /api/conta routes -----

function httpClient(): ContaClient {
  async function call(method: string, path: string, body?: unknown): Promise<{ status: number; data: Record<string, unknown> }> {
    const res = await fetch(`/api/conta/${path}`, {
      method,
      headers: body !== undefined ? { "content-type": "application/json" } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      credentials: "same-origin",
    });
    const data = res.status === 204 ? {} : ((await res.json().catch(() => ({}))) as Record<string, unknown>);
    return { status: res.status, data };
  }
  const asFailure = (data: Record<string, unknown>) => fail((data.message as string) ?? "Não foi possível continuar. Tente outra vez.", (data.issues as Issue[]) ?? []);

  return {
    demo: false,
    async requestCode(input) {
      try {
        const { status, data } = await call("POST", "codigo", input);
        return status === 200 ? { ok: true, data: data as CodeResult } : asFailure(data);
      } catch { return fail(OFFLINE); }
    },
    async verifyCode(input) {
      try {
        const { status, data } = await call("POST", "entrar", input);
        if (status !== 200) return asFailure(data);
        rememberSignedIn(data.account as Account);
        return { ok: true, account: data.account as Account, newAccount: Boolean(data.newAccount) };
      } catch { return fail(OFFLINE); }
    },
    async painel() {
      const { status, data } = await call("GET", "eu");
      if (status === 401) { rememberSignedIn(null); return null; }
      if (status !== 200) throw new Error((data.message as string) ?? "Erro");
      rememberSignedIn((data as MeuPainel).account);
      return data as MeuPainel;
    },
    async update(changes) {
      try {
        const { status, data } = await call("PATCH", "eu", changes);
        if (status !== 200) return asFailure(data);
        rememberSignedIn(data as Account);
        return { ok: true, account: data as Account };
      } catch { return fail(OFFLINE); }
    },
    async finishQuiz() {
      try {
        const { status, data } = await call("POST", "eu/questionario");
        return status === 200 ? (data as { counted: boolean; points?: number }) : { counted: false };
      } catch { return { counted: false }; }
    },
    async redeem(partnerId, perkId) {
      try {
        const { status, data } = await call("POST", "eu/trocas", { partnerId, perkId });
        return status === 201 ? { ok: true, redemption: data as Redemption } : asFailure(data);
      } catch { return fail(OFFLINE); }
    },
    async signOut() { await call("POST", "sair").catch(() => undefined); rememberSignedIn(null); },
    async deleteAccount() { await call("DELETE", "eu"); rememberSignedIn(null); },
  };
}

// ----- demo: everything stays in this browser, on example data -----

const DEMO_KEY = "gn-conta-demo";
type DemoState = {
  accounts: Account[];
  entries: PatinhasEntry[];
  redemptions: Redemption[];
  signedIn?: string;
  pending?: { contact: string; code: string; name?: string };
};

function loadDemo(): DemoState {
  try {
    const raw = localStorage.getItem(DEMO_KEY);
    if (raw) return JSON.parse(raw) as DemoState;
  } catch { /* fall through */ }
  return { accounts: structuredClone(seedAccounts), entries: structuredClone(seedEntries), redemptions: structuredClone(seedRedemptions) };
}
function saveDemo(state: DemoState) {
  try { localStorage.setItem(DEMO_KEY, JSON.stringify(state)); } catch { /* storage unavailable */ }
}
const newId = () => (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`);
const findBy = (state: DemoState, contact: string) => {
  const c = parseContact(contact);
  if (!c) return undefined;
  return state.accounts.find((a) => (c.kind === "email" ? a.email === c.value : a.phone === c.value));
};

function demoClient(): ContaClient {
  const me = (state: DemoState) => state.accounts.find((a) => a.id === state.signedIn);
  const give = (state: DemoState, accountId: string, action: EarnAction, extra: { quantity?: number; by?: PatinhasEntry["by"]; sourceId?: string } = {}) => {
    if (!features.patinhas) return { ok: false as const };
    const r = award(defaultPointsRules, state.entries.filter((e) => e.accountId === accountId), { id: newId(), accountId, action, at: new Date(), ...extra });
    if (r.ok) state.entries.push(r.entry);
    return r;
  };

  return {
    demo: true,
    async requestCode(input) {
      const parsed = signInStartSchema.safeParse(input);
      if (!parsed.success) return fail("Alguns campos não estão corretos.", parsed.error.issues);
      const state = loadDemo();
      const existing = findBy(state, input.contact);
      if (!existing && !input.name) return { ok: true, data: { status: "precisa-nome" } };
      if (!existing && !input.consent) return fail("Alguns campos não estão corretos.", [{ path: ["consent"], message: "Precisa de aceitar para criar a conta" }]);
      const code = String(Math.floor(Math.random() * 1_000_000)).padStart(6, "0");
      state.pending = { contact: contactKey(parseContact(input.contact)!), code, name: existing ? undefined : input.name };
      saveDemo(state);
      return { ok: true, data: { status: "codigo-enviado", sentTo: parseContact(input.contact)!.kind, newAccount: !existing, demoCode: code } };
    },
    async verifyCode(input) {
      const parsed = signInVerifySchema.safeParse(input);
      if (!parsed.success) return fail("Alguns campos não estão corretos.", parsed.error.issues);
      const state = loadDemo();
      const c = parseContact(input.contact)!;
      if (!state.pending || state.pending.contact !== contactKey(c) || state.pending.code !== parsed.data.code) {
        return fail("Esse código não está certo. Veja a mensagem outra vez e tente de novo.");
      }
      let account = findBy(state, input.contact);
      const newAccount = !account;
      if (!account) {
        const now = new Date().toISOString();
        account = { id: newId(), name: state.pending.name ?? "Amigo dos gatos", email: c.kind === "email" ? c.value : undefined, phone: c.kind === "telemovel" ? c.value : undefined, showOnWall: false, createdAt: now, consentAt: now };
        state.accounts.push(account);
        give(state, account.id, "perfil", { sourceId: "perfil" });
      }
      state.signedIn = account.id;
      state.pending = undefined;
      saveDemo(state);
      rememberSignedIn(account);
      return { ok: true, account, newAccount };
    },
    async painel() {
      const state = loadDemo();
      const account = me(state);
      if (!account) { rememberSignedIn(null); return null; }
      const now = new Date();
      const ledger = state.entries.filter((e) => e.accountId === account.id);
      const painel = buildPainel({ ledger, rules: defaultPointsRules, badges: seedBadges, challenges: seedChallenges, communityEntries: state.entries, partners: seedPartners, redemptions: state.redemptions.filter((r) => r.accountId === account.id), now });
      // Like the API: perks are only offered while swaps are switched on.
      return { account, features, ...painel, perks: features.trocas ? painel.perks : [] };
    },
    async update(changes) {
      const state = loadDemo();
      const account = me(state);
      if (!account) return fail("A sua sessão terminou. Entre outra vez.");
      Object.assign(account, changes, { nickname: changes.nickname === "" ? undefined : (changes.nickname ?? account.nickname) });
      saveDemo(state);
      rememberSignedIn(account);
      return { ok: true, account };
    },
    async finishQuiz() {
      const state = loadDemo();
      const account = me(state);
      if (!account) return { counted: false };
      const r = give(state, account.id, "questionario", { by: "proprio" });
      saveDemo(state);
      return r.ok ? { counted: true, points: r.entry.points } : { counted: false };
    },
    async redeem(partnerId, perkId) {
      const state = loadDemo();
      const account = me(state);
      const partner = seedPartners.find((p) => p.id === partnerId);
      const perk = partner?.perks.find((p) => p.id === perkId);
      if (!features.trocas || !account || !partner || !perk) return fail("Vantagem não encontrada.");
      const ledger = state.entries.filter((e) => e.accountId === account.id);
      const mine = state.redemptions.filter((r) => r.accountId === account.id);
      const check = canRedeem(partner, perk, { level: levelFor(earnedTotal(ledger)).level, balance: balance(ledger), redemptions: mine }, new Date());
      if (!check.ok) return fail(check.message);
      const redemption: Redemption = { id: newId(), accountId: account.id, partnerId, perkId, partnerName: partner.name, perkDescription: perk.description, cost: perk.patinhasCost!, code: redemptionCode(), status: "ativa", createdAt: new Date().toISOString() };
      state.redemptions.push(redemption);
      state.entries.push({ id: newId(), accountId: account.id, action: "troca", points: -redemption.cost, quantity: 1, at: redemption.createdAt, sourceId: `troca:${redemption.id}`, by: "proprio" });
      saveDemo(state);
      return { ok: true, redemption };
    },
    async signOut() {
      const state = loadDemo();
      state.signedIn = undefined;
      saveDemo(state);
      rememberSignedIn(null);
    },
    async deleteAccount() {
      const state = loadDemo();
      const id = state.signedIn;
      state.accounts = state.accounts.filter((a) => a.id !== id);
      state.entries = state.entries.map((e) => (e.accountId === id ? { ...e, accountId: undefined } : e));
      state.signedIn = undefined;
      saveDemo(state);
      rememberSignedIn(null);
    },
    async simulate(action) {
      const state = loadDemo();
      const account = me(state);
      if (!account) return;
      give(state, account.id, action, { quantity: action === "turno-hora" ? 2 : 1, by: "equipa" });
      saveDemo(state);
    },
  };
}

let client: ContaClient | undefined;
export function contaClient(): ContaClient {
  client ??= process.env.NEXT_PUBLIC_CONTAS_DEMO === "1" ? demoClient() : httpClient();
  return client;
}
