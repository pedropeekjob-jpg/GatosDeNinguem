import type { PrismaClient } from "@prisma/client";
import { accountSchema, badgeSchema, challengeSchema, defaultPointsRules, entrySchema, pointsRulesSchema, redemptionSchema, type Account, type Badge, type Challenge, type LoginCode, type PatinhasEntry, type PointsRule, type Redemption } from "@gn/domain";
import type { PatinhasRepository, Session } from "./repository";

const RULES_KEY = "patinhas-regras";
const json = (v: unknown) => v as object;

/** PostgreSQL storage for accounts and Patinhas. Documents are re-validated on read. */
export class PrismaPatinhasRepository implements PatinhasRepository {
  constructor(private readonly db: PrismaClient) {}

  async listAccounts() { return (await this.db.account.findMany({ orderBy: { createdAt: "desc" } })).map((r) => accountSchema.parse(r.data)); }
  async getAccount(id: string) { const r = await this.db.account.findUnique({ where: { id } }); return r ? accountSchema.parse(r.data) : undefined; }
  async findAccount(c: { email?: string; phone?: string }) {
    const r = await this.db.account.findFirst({ where: { OR: [...(c.email ? [{ email: c.email }] : []), ...(c.phone ? [{ phone: c.phone }] : [])] } });
    return r && (c.email || c.phone) ? accountSchema.parse(r.data) : undefined;
  }
  async saveAccount(a: Account) {
    const data = { email: a.email ?? null, phone: a.phone ?? null, createdAt: new Date(a.createdAt), data: json(a) };
    await this.db.account.upsert({ where: { id: a.id }, create: { id: a.id, ...data }, update: data });
    return a;
  }
  async deleteAccount(id: string) {
    await this.db.$transaction([
      this.db.session.deleteMany({ where: { accountId: id } }),
      this.db.$executeRaw`UPDATE "PatinhasEntry" SET "accountId" = NULL, "data" = "data" - 'accountId' - 'note' WHERE "accountId" = ${id}`,
      this.db.$executeRaw`UPDATE "Redemption" SET "accountId" = NULL, "data" = "data" - 'accountId' WHERE "accountId" = ${id}`,
      this.db.account.deleteMany({ where: { id } }),
    ]);
  }

  async getLoginCode(contact: string) { const r = await this.db.loginCode.findUnique({ where: { contact } }); return r ? (r.data as LoginCode) : undefined; }
  async saveLoginCode(code: LoginCode) { await this.db.loginCode.upsert({ where: { contact: code.contact }, create: { contact: code.contact, data: json(code) }, update: { data: json(code) } }); }
  async deleteLoginCode(contact: string) { await this.db.loginCode.deleteMany({ where: { contact } }); }

  async getSession(tokenHash: string) {
    const r = await this.db.session.findUnique({ where: { tokenHash } });
    return r ? { tokenHash: r.tokenHash, accountId: r.accountId, expiresAt: r.expiresAt.toISOString() } : undefined;
  }
  async saveSession(s: Session) { await this.db.session.create({ data: { tokenHash: s.tokenHash, accountId: s.accountId, expiresAt: new Date(s.expiresAt) } }); }
  async deleteSession(tokenHash: string) { await this.db.session.deleteMany({ where: { tokenHash } }); }

  async listEntries(f: { accountId?: string; from?: string; to?: string } = {}) {
    const rows = await this.db.patinhasEntry.findMany({
      where: { ...(f.accountId ? { accountId: f.accountId } : {}), at: { ...(f.from ? { gte: new Date(f.from) } : {}), ...(f.to ? { lt: new Date(f.to) } : {}) } },
      orderBy: { at: "asc" },
    });
    return rows.map((r) => ({ ...entrySchema.parse(r.data), accountId: r.accountId ?? undefined }));
  }
  async addEntry(e: PatinhasEntry) {
    await this.db.patinhasEntry.create({ data: { id: e.id, accountId: e.accountId ?? null, action: e.action, points: e.points, at: new Date(e.at), sourceId: e.sourceId ?? null, data: json(e) } });
  }

  async getRules(): Promise<PointsRule[]> {
    const r = await this.db.setting.findUnique({ where: { key: RULES_KEY } });
    return r ? pointsRulesSchema.parse(r.value) : defaultPointsRules;
  }
  async saveRules(rules: PointsRule[]) {
    await this.db.setting.upsert({ where: { key: RULES_KEY }, create: { key: RULES_KEY, value: json(rules) }, update: { value: json(rules) } });
    return rules;
  }

  async listBadges() { return (await this.db.badge.findMany()).map((r) => badgeSchema.parse(r.data)); }
  async saveBadge(b: Badge) { await this.db.badge.upsert({ where: { id: b.id }, create: { id: b.id, data: json(b) }, update: { data: json(b) } }); return b; }
  async deleteBadge(id: string) { await this.db.badge.deleteMany({ where: { id } }); }

  async listChallenges() { return (await this.db.challenge.findMany({ orderBy: { month: "asc" } })).map((r) => challengeSchema.parse(r.data)); }
  async saveChallenge(c: Challenge) {
    const data = { month: c.month, data: json(c) };
    await this.db.challenge.upsert({ where: { id: c.id }, create: { id: c.id, ...data }, update: data });
    return c;
  }
  async deleteChallenge(id: string) { await this.db.challenge.deleteMany({ where: { id } }); }

  async listRedemptions(f: { accountId?: string } = {}) {
    const rows = await this.db.redemption.findMany({ where: f.accountId ? { accountId: f.accountId } : {}, orderBy: { createdAt: "desc" } });
    return rows.map((r) => ({ ...redemptionSchema.parse(r.data), accountId: r.accountId ?? undefined }));
  }
  async getRedemption(id: string) {
    const r = await this.db.redemption.findUnique({ where: { id } });
    return r ? { ...redemptionSchema.parse(r.data), accountId: r.accountId ?? undefined } : undefined;
  }
  async saveRedemption(x: Redemption) {
    const data = { accountId: x.accountId ?? null, status: x.status, createdAt: new Date(x.createdAt), data: json(x) };
    await this.db.redemption.upsert({ where: { id: x.id }, create: { id: x.id, ...data }, update: data });
    return x;
  }
}
