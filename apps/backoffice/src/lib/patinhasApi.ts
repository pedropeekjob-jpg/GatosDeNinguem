import type { Account, Badge, Challenge, EarnAction, Level, Painel, Partner, PatinhasEntry, PointsRule, Redemption } from "@gn/domain";

export type PersonRow = Account & { earned: number; balance: number; level: Level; lastActivity?: string };
export type RedemptionRow = Redemption & { personName?: string };
export type ChallengeRow = Challenge & { progress: number };

/** What the back office asks the API about helper accounts and Patinhas. */
export interface PatinhasApi {
  people(): Promise<PersonRow[]>;
  person(id: string): Promise<Painel & { account: Account }>;
  givePatinhas(accountId: string, input: { action: EarnAction | "ajuste"; quantity?: number; points?: number; note?: string }): Promise<PatinhasEntry>;
  redemptions(): Promise<RedemptionRow[]>;
  markRedemptionUsed(id: string): Promise<Redemption>;
  cancelRedemption(id: string): Promise<Redemption>;
  pointsRules(): Promise<PointsRule[]>;
  savePointsRules(rules: PointsRule[]): Promise<PointsRule[]>;
  badges(): Promise<Badge[]>;
  saveBadge(badge: Badge): Promise<Badge>;
  deleteBadge(id: string): Promise<void>;
  challenges(): Promise<ChallengeRow[]>;
  saveChallenge(c: Omit<Challenge, "id"> & { id?: string }): Promise<Challenge>;
  deleteChallenge(id: string): Promise<void>;
  updatePartner(id: string, changes: Partial<Omit<Partner, "id">>): Promise<Partner>;
}

type Call = <T>(method: string, path: string, body?: unknown) => Promise<T>;

export function patinhasHttp(call: Call): PatinhasApi {
  return {
    people: () => call("GET", "/patinhas/contas"),
    person: (id) => call("GET", `/patinhas/contas/${id}`),
    givePatinhas: (id, input) => call("POST", `/patinhas/contas/${id}/registos`, input),
    redemptions: () => call("GET", "/patinhas/trocas"),
    markRedemptionUsed: (id) => call("POST", `/patinhas/trocas/${id}/usada`),
    cancelRedemption: (id) => call("POST", `/patinhas/trocas/${id}/cancelar`),
    pointsRules: () => call("GET", "/patinhas/regras"),
    savePointsRules: (rules) => call("PUT", "/patinhas/regras", rules),
    badges: () => call("GET", "/patinhas/medalhas"),
    saveBadge: (b) => call("POST", "/patinhas/medalhas", b),
    deleteBadge: (id) => call("DELETE", `/patinhas/medalhas/${id}`),
    challenges: () => call("GET", "/patinhas/desafios"),
    saveChallenge: (c) => call("POST", "/patinhas/desafios", c),
    deleteChallenge: (id) => call("DELETE", `/patinhas/desafios/${id}`),
    updatePartner: (id, changes) => call("PATCH", `/partners/${id}`, changes),
  };
}
