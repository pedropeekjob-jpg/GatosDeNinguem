import {
  defaultPointsRules,
  seedAccounts,
  seedBadges,
  seedChallenges,
  seedEntries,
  seedRedemptions,
  type Account,
  type Badge,
  type Challenge,
  type LoginCode,
  type PatinhasEntry,
  type PointsRule,
  type Redemption,
} from "@gn/domain";

export type Session = { tokenHash: string; accountId: string; expiresAt: string };

/** Storage for helper accounts and Patinhas. Kept apart from the content so each can change on its own. */
export interface PatinhasRepository {
  listAccounts(): Promise<Account[]>;
  getAccount(id: string): Promise<Account | undefined>;
  findAccount(contact: { email?: string; phone?: string }): Promise<Account | undefined>;
  saveAccount(account: Account): Promise<Account>;
  /** RGPD: removes the person and their sessions; their ledger lines stay, without a name, for community totals. */
  deleteAccount(id: string): Promise<void>;

  getLoginCode(contact: string): Promise<LoginCode | undefined>;
  saveLoginCode(code: LoginCode): Promise<void>;
  deleteLoginCode(contact: string): Promise<void>;

  getSession(tokenHash: string): Promise<Session | undefined>;
  saveSession(session: Session): Promise<void>;
  deleteSession(tokenHash: string): Promise<void>;

  listEntries(filter?: { accountId?: string; from?: string; to?: string }): Promise<PatinhasEntry[]>;
  addEntry(entry: PatinhasEntry): Promise<void>;

  getRules(): Promise<PointsRule[]>;
  saveRules(rules: PointsRule[]): Promise<PointsRule[]>;
  listBadges(): Promise<Badge[]>;
  saveBadge(badge: Badge): Promise<Badge>;
  deleteBadge(id: string): Promise<void>;
  listChallenges(): Promise<Challenge[]>;
  saveChallenge(challenge: Challenge): Promise<Challenge>;
  deleteChallenge(id: string): Promise<void>;

  listRedemptions(filter?: { accountId?: string }): Promise<Redemption[]>;
  getRedemption(id: string): Promise<Redemption | undefined>;
  saveRedemption(redemption: Redemption): Promise<Redemption>;
}

const clone = <T>(v: T): T => structuredClone(v);

/** Process-local storage with example helpers, for the demo and tests. */
export class InMemoryPatinhasRepository implements PatinhasRepository {
  private accounts = new Map<string, Account>(seedAccounts.map((a) => [a.id, clone(a)]));
  private codes = new Map<string, LoginCode>();
  private sessions = new Map<string, Session>();
  private entries: PatinhasEntry[] = clone(seedEntries);
  private rules: PointsRule[] = clone(defaultPointsRules);
  private badges = new Map<string, Badge>(seedBadges.map((b) => [b.id, clone(b)]));
  private challenges = new Map<string, Challenge>(seedChallenges.map((c) => [c.id, clone(c)]));
  private redemptions = new Map<string, Redemption>(seedRedemptions.map((r) => [r.id, clone(r)]));

  async listAccounts() { return [...this.accounts.values()].map(clone); }
  async getAccount(id: string) { const a = this.accounts.get(id); return a && clone(a); }
  async findAccount(c: { email?: string; phone?: string }) {
    const a = [...this.accounts.values()].find((x) => (c.email && x.email === c.email) || (c.phone && x.phone === c.phone));
    return a && clone(a);
  }
  async saveAccount(a: Account) { this.accounts.set(a.id, clone(a)); return clone(a); }
  async deleteAccount(id: string) {
    this.accounts.delete(id);
    for (const [k, s] of this.sessions) if (s.accountId === id) this.sessions.delete(k);
    this.entries = this.entries.map((e) => (e.accountId === id ? { ...e, accountId: undefined, note: undefined } : e));
    for (const r of this.redemptions.values()) if (r.accountId === id) r.accountId = undefined;
  }

  async getLoginCode(contact: string) { const c = this.codes.get(contact); return c && clone(c); }
  async saveLoginCode(code: LoginCode) { this.codes.set(code.contact, clone(code)); }
  async deleteLoginCode(contact: string) { this.codes.delete(contact); }

  async getSession(tokenHash: string) { const s = this.sessions.get(tokenHash); return s && clone(s); }
  async saveSession(s: Session) { this.sessions.set(s.tokenHash, clone(s)); }
  async deleteSession(tokenHash: string) { this.sessions.delete(tokenHash); }

  async listEntries(f: { accountId?: string; from?: string; to?: string } = {}) {
    return this.entries
      .filter((e) => (!f.accountId || e.accountId === f.accountId) && (!f.from || e.at >= f.from) && (!f.to || e.at < f.to))
      .map(clone);
  }
  async addEntry(entry: PatinhasEntry) { this.entries.push(clone(entry)); }

  async getRules() { return clone(this.rules); }
  async saveRules(rules: PointsRule[]) { this.rules = clone(rules); return clone(rules); }
  async listBadges() { return [...this.badges.values()].map(clone); }
  async saveBadge(b: Badge) { this.badges.set(b.id, clone(b)); return clone(b); }
  async deleteBadge(id: string) { this.badges.delete(id); }
  async listChallenges() { return [...this.challenges.values()].sort((a, b) => a.month.localeCompare(b.month)).map(clone); }
  async saveChallenge(c: Challenge) { this.challenges.set(c.id, clone(c)); return clone(c); }
  async deleteChallenge(id: string) { this.challenges.delete(id); }

  async listRedemptions(f: { accountId?: string } = {}) {
    return [...this.redemptions.values()].filter((r) => !f.accountId || r.accountId === f.accountId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(clone);
  }
  async getRedemption(id: string) { const r = this.redemptions.get(id); return r && clone(r); }
  async saveRedemption(r: Redemption) { this.redemptions.set(r.id, clone(r)); return clone(r); }
}
