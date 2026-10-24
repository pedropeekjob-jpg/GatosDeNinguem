import { BadRequestException, ConflictException, NotFoundException, UnauthorizedException } from "@nestjs/common";
import {
  LOGIN_CODE_MINUTES,
  award,
  awardErrorMessage,
  balance,
  buildPainel,
  canRedeem,
  challengeProgress,
  checkLoginCode,
  contactKey,
  currentChallenges,
  earnedTotal,
  levelFor,
  levels,
  nextCodeWindow,
  normalizePhone,
  parseContact,
  redemptionCode,
  signInErrorMessage,
  wallName,
  type Account,
  type Contact,
  type EarnAction,
  type PatinhasEntry,
  type Redemption,
  type Shift,
  type SignInStart,
  type SignInVerify,
} from "@gn/domain";
import { createHash, randomBytes, randomInt, randomUUID, timingSafeEqual } from "node:crypto";
import { featuresOf } from "../common/feature.guard";
import type { ApiOptions } from "../common/options";
import type { PatinhasRepository } from "./repository";

const SESSION_DAYS = 180;
const sha256 = (text: string) => createHash("sha256").update(text).digest("hex");
const sameHash = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));
const monthRange = (now: Date) => {
  const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const to = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  return { from: from.toISOString(), to: to.toISOString() };
};

/** Accounts, sign-in codes and Patinhas, shared by the helper area, the back office and shift check-ins. */
export class PatinhasService {
  constructor(private readonly options: ApiOptions, readonly repo: PatinhasRepository) {}
  private get content() { return this.options.repository; }
  private now() { return this.options.now?.() ?? new Date(); }
  get features() { return featuresOf(this.options); }

  // ----- signing in -----

  async requestCode(input: SignInStart): Promise<{ status: "precisa-nome" } | { status: "codigo-enviado"; sentTo: Contact["kind"]; newAccount: boolean; demoCode?: string }> {
    const contact = parseContact(input.contact)!;
    const existing = await this.repo.findAccount(contact.kind === "email" ? { email: contact.value } : { phone: contact.value });
    if (!existing && !input.name) return { status: "precisa-nome" };
    if (!existing && !input.consent) {
      throw new BadRequestException({ message: "Alguns campos não estão corretos.", issues: [{ path: ["consent"], message: "Precisa de aceitar para criar a conta" }] });
    }
    const now = this.now();
    const key = contactKey(contact);
    const window = nextCodeWindow(await this.repo.getLoginCode(key), now);
    if (!window.ok) throw new ConflictException(signInErrorMessage["muitos-codigos"]);
    const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
    await this.repo.saveLoginCode({
      contact: key,
      codeHash: sha256(`${key}:${code}`),
      expiresAt: new Date(now.getTime() + LOGIN_CODE_MINUTES * 60_000).toISOString(),
      attempts: 0,
      windowStart: window.windowStart,
      sentInWindow: window.sentInWindow,
      pending: existing ? undefined : { name: input.name!, consentAt: now.toISOString() },
    });
    await this.options.sendLoginCode?.(contact, code);
    return { status: "codigo-enviado", sentTo: contact.kind, newAccount: !existing, demoCode: this.options.exposeLoginCodes ? code : undefined };
  }

  async verifyCode(input: SignInVerify): Promise<{ token: string; account: Account; newAccount: boolean }> {
    const contact = parseContact(input.contact)!;
    const key = contactKey(contact);
    const stored = await this.repo.getLoginCode(key);
    const now = this.now();
    const check = checkLoginCode(stored, (hash) => sameHash(hash, sha256(`${key}:${input.code}`)), now);
    if (!check.ok) {
      if (stored && check.attempts) await this.repo.saveLoginCode({ ...stored, attempts: check.attempts });
      throw new UnauthorizedException(signInErrorMessage[check.error]);
    }
    await this.repo.deleteLoginCode(key);
    let account = await this.repo.findAccount(contact.kind === "email" ? { email: contact.value } : { phone: contact.value });
    const newAccount = !account;
    if (!account) {
      const pending = stored!.pending ?? { name: "Amigo dos gatos", consentAt: now.toISOString() };
      account = await this.repo.saveAccount({
        id: randomUUID(),
        name: pending.name,
        email: contact.kind === "email" ? contact.value : undefined,
        phone: contact.kind === "telemovel" ? contact.value : undefined,
        showOnWall: false,
        createdAt: now.toISOString(),
        consentAt: pending.consentAt,
      });
      await this.give(account.id, "perfil", { sourceId: "perfil" });
      await this.syncShiftPoints(account);
    }
    const token = randomBytes(32).toString("base64url");
    await this.repo.saveSession({ tokenHash: sha256(token), accountId: account.id, expiresAt: new Date(now.getTime() + SESSION_DAYS * 86_400_000).toISOString() });
    return { token, account, newAccount };
  }

  async accountFromHeader(header: string | undefined): Promise<Account> {
    const token = header?.replace(/^Bearer\s+/i, "");
    const session = token ? await this.repo.getSession(sha256(token)) : undefined;
    const account = session && new Date(session.expiresAt) > this.now() ? await this.repo.getAccount(session.accountId) : undefined;
    if (!account) throw new UnauthorizedException("A sua sessão terminou. Entre outra vez.");
    return account;
  }

  async signOut(header: string | undefined) {
    const token = header?.replace(/^Bearer\s+/i, "");
    if (token) await this.repo.deleteSession(sha256(token));
  }

  // ----- earning -----

  /** Records a verified action. Returns the reason in plain words when it does not count. */
  async give(accountId: string, action: EarnAction, extra: { quantity?: number; sourceId?: string; note?: string; by?: PatinhasEntry["by"]; at?: Date } = {}) {
    // While Patinhas are switched off nothing is counted, as if every way to earn were off.
    if (!this.features.patinhas) return { ok: false as const, error: "regra-inativa" as const };
    const result = award(await this.repo.getRules(), await this.repo.listEntries({ accountId }), {
      id: randomUUID(),
      accountId,
      action,
      at: extra.at ?? this.now(),
      quantity: extra.quantity,
      sourceId: extra.sourceId,
      note: extra.note,
      by: extra.by,
    });
    if (result.ok) await this.repo.addEntry(result.entry);
    return result;
  }

  /** A volunteer was marked present: their account (matched by mobile) gets the shift's Patinhas. */
  async awardShift(shift: Shift, volunteerId: string) {
    const signup = shift.signups.find((s) => s.volunteerId === volunteerId && s.checkedInAt);
    if (!signup) return;
    const account = await this.repo.findAccount({ phone: normalizePhone(signup.phone) });
    if (account) await this.awardShiftTo(account, shift, signup.checkedInAt!);
  }

  private async awardShiftTo(account: Account, shift: Shift, checkedInAt: string) {
    const hours = Math.max(0.5, Math.round(((new Date(shift.endsAt).getTime() - new Date(shift.startsAt).getTime()) / 3_600_000) * 2) / 2);
    const isTransport = shift.type === "transporte-vet";
    await this.give(account.id, isTransport ? "transporte" : "turno-hora", { quantity: isTransport ? 1 : hours, sourceId: `turno:${shift.id}`, at: new Date(checkedInAt), note: shift.title });
  }

  /** Shifts done before the account existed still count. */
  async syncShiftPoints(account: Account) {
    if (!account.phone) return;
    for (const shift of await this.content.listShifts()) {
      const mine = shift.signups.find((s) => s.checkedInAt && normalizePhone(s.phone) === account.phone);
      if (mine) await this.awardShiftTo(account, shift, mine.checkedInAt!);
    }
  }

  // ----- the helper's page -----

  async painel(account: Account) {
    const now = this.now();
    const [ledger, rules, badges, challenges, communityEntries, partners, redemptions] = await Promise.all([
      this.repo.listEntries({ accountId: account.id }),
      this.repo.getRules(),
      this.repo.listBadges(),
      this.repo.listChallenges(),
      this.repo.listEntries(monthRange(now)),
      this.content.listPartners(),
      this.repo.listRedemptions({ accountId: account.id }),
    ]);
    const painel = buildPainel({ ledger, rules, badges, challenges, communityEntries, partners, redemptions, now });
    // The site shows only what is switched on; perks are not even sent while swaps are off.
    return { account, features: this.features, ...painel, perks: this.features.trocas ? painel.perks : [] };
  }

  async redeem(account: Account, partnerId: string, perkId: string): Promise<Redemption> {
    const partner = await this.content.getPartner(partnerId);
    const perk = partner?.perks.find((p) => p.id === perkId);
    if (!partner || !perk) throw new NotFoundException("Vantagem não encontrada.");
    const now = this.now();
    const [ledger, redemptions] = await Promise.all([this.repo.listEntries({ accountId: account.id }), this.repo.listRedemptions({ accountId: account.id })]);
    const check = canRedeem(partner, perk, { level: levelFor(earnedTotal(ledger)).level, balance: balance(ledger), redemptions }, now);
    if (!check.ok) throw new ConflictException(check.message);
    const redemption: Redemption = {
      id: randomUUID(),
      accountId: account.id,
      partnerId,
      perkId,
      partnerName: partner.name,
      perkDescription: perk.description,
      cost: perk.patinhasCost!,
      code: redemptionCode((() => { const b = randomBytes(5); let i = 0; return () => b[i++]! / 256; })()),
      status: "ativa",
      createdAt: now.toISOString(),
    };
    await this.repo.saveRedemption(redemption);
    await this.repo.addEntry({ id: randomUUID(), accountId: account.id, action: "troca", points: -redemption.cost, quantity: 1, at: redemption.createdAt, sourceId: `troca:${redemption.id}`, note: `${partner.name}: ${perk.description}`, by: "proprio" });
    return redemption;
  }

  // ----- public page -----

  async publicSummary() {
    const now = this.now();
    const [rules, badges, challenges, monthEntries, accounts, allEntries] = await Promise.all([
      this.repo.getRules(),
      this.repo.listBadges(),
      this.repo.listChallenges(),
      this.repo.listEntries(monthRange(now)),
      this.repo.listAccounts(),
      this.repo.listEntries(),
    ]);
    const wall = accounts
      .filter((a) => a.showOnWall)
      .map((a) => ({ name: wallName(a), level: levelFor(earnedTotal(allEntries.filter((e) => e.accountId === a.id))) }))
      .filter((w) => w.level.level >= 2)
      .sort((a, b) => a.name.localeCompare(b.name, "pt"));
    return {
      levels,
      waysToEarn: rules.filter((r) => r.active),
      badges: badges.filter((b) => b.active),
      challenges: currentChallenges(challenges, now).map((challenge) => ({ challenge, progress: challengeProgress(challenge, monthEntries) })),
      wall: wall.map((w) => ({ name: w.name, levelName: w.level.name })),
    };
  }

  // ----- back office -----

  async overview() {
    const [accounts, entries] = await Promise.all([this.repo.listAccounts(), this.repo.listEntries()]);
    return accounts
      .map((account) => {
        const ledger = entries.filter((e) => e.accountId === account.id);
        return { ...account, earned: earnedTotal(ledger), balance: balance(ledger), level: levelFor(earnedTotal(ledger)), lastActivity: ledger.map((e) => e.at).sort().at(-1) };
      })
      .sort((a, b) => (b.lastActivity ?? "").localeCompare(a.lastActivity ?? ""));
  }

  async teamAward(accountId: string, input: { action: EarnAction | "ajuste"; quantity?: number; points?: number; note?: string }) {
    if (!(await this.repo.getAccount(accountId))) throw new NotFoundException("Pessoa não encontrada.");
    if (input.action === "ajuste") {
      if (!input.points) throw new BadRequestException("Indique quantas Patinhas acrescentar ou tirar.");
      const entry: PatinhasEntry = { id: randomUUID(), accountId, action: "ajuste", points: input.points, quantity: 1, at: this.now().toISOString(), note: input.note, by: "equipa" };
      await this.repo.addEntry(entry);
      return entry;
    }
    const result = await this.give(accountId, input.action, { quantity: input.quantity, note: input.note, by: "equipa" });
    if (!result.ok) throw new ConflictException(awardErrorMessage[result.error]);
    return result.entry;
  }

  async markRedemptionUsed(id: string) {
    const r = await this.repo.getRedemption(id);
    if (!r) throw new NotFoundException("Troca não encontrada.");
    if (r.status !== "ativa") throw new ConflictException("Esta troca já não está ativa.");
    return this.repo.saveRedemption({ ...r, status: "usada", usedAt: this.now().toISOString() });
  }

  /** Cancelling gives the Patinhas back. */
  async cancelRedemption(id: string) {
    const r = await this.repo.getRedemption(id);
    if (!r) throw new NotFoundException("Troca não encontrada.");
    if (r.status !== "ativa") throw new ConflictException("Esta troca já não está ativa.");
    const now = this.now().toISOString();
    if (r.accountId) {
      await this.repo.addEntry({ id: randomUUID(), accountId: r.accountId, action: "devolucao", points: r.cost, quantity: 1, at: now, sourceId: `devolucao:${r.id}`, note: `${r.partnerName}: ${r.perkDescription}`, by: "equipa" });
    }
    return this.repo.saveRedemption({ ...r, status: "cancelada", cancelledAt: now });
  }
}
