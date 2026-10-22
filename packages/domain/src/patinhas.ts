import { z } from "zod";
import type { Partner, Perk } from "./content";

/**
 * Patinhas: paw points for verified ways of helping. Points add up to levels,
 * levels and points unlock partner perks, and a monthly challenge gives everyone a shared goal.
 *
 * Guardrails: adopting a cat never earns points (only the photo updates after it does),
 * streaks are counted in months, never days, and there are no countdowns or public money rankings.
 */

/** Ways to earn. There is deliberately no "adoption" action. */
export const earnActionSchema = z.enum([
  "perfil",
  "questionario",
  "partilha",
  "sos",
  "donativo",
  "apadrinhamento-mes",
  "turno-hora",
  "transporte",
  "fat-semana",
  "foto-final-feliz-1m",
  "foto-final-feliz-6m",
  "amigo-trazido",
]);
export type EarnAction = z.infer<typeof earnActionSchema>;

/** Ledger lines also record team corrections, perks taken and perks given back. */
export const entryActionSchema = z.union([earnActionSchema, z.enum(["ajuste", "troca", "devolucao"])]);
export type EntryAction = z.infer<typeof entryActionSchema>;

export const pointsRuleSchema = z.object({
  action: earnActionSchema,
  label: z.string().min(3),
  points: z.number().int().min(0).max(1000),
  /** "25 per hour": the points are multiplied by the quantity (hours). */
  perUnit: z.string().optional(),
  /** Most times it can count in one week (Monday to Sunday). */
  weeklyLimit: z.number().int().min(1).optional(),
  /** Only ever counts once per person. */
  once: z.boolean().default(false),
  /** Who confirms it, shown to helpers so they know what to expect. */
  verifiedBy: z.string().optional(),
  active: z.boolean().default(true),
});
export type PointsRule = z.infer<typeof pointsRuleSchema>;
export const pointsRulesSchema = z.array(pointsRuleSchema);

export const entrySchema = z.object({
  id: z.string(),
  /** Empty once the person deleted their account: the line still counts for community challenges. */
  accountId: z.string().optional(),
  action: entryActionSchema,
  points: z.number().int(),
  quantity: z.number().positive().default(1),
  at: z.string().datetime(),
  /** What it was for (a shift, a cat, a perk), so the same thing never counts twice. */
  sourceId: z.string().optional(),
  note: z.string().max(200).optional(),
  by: z.enum(["automatico", "equipa", "proprio"]).default("automatico"),
});
export type PatinhasEntry = z.infer<typeof entrySchema>;

export const badgeSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/, "Use só letras minúsculas, números e hífens"),
  name: z.string().min(2, "Dê um nome à medalha"),
  description: z.string().min(3, "Explique como se ganha"),
  icon: z.string().min(1).max(8),
  action: earnActionSchema,
  count: z.number().int().min(1),
  active: z.boolean().default(true),
});
export type Badge = z.infer<typeof badgeSchema>;

export const challengeSchema = z.object({
  id: z.string(),
  title: z.string().min(3, "Dê um nome ao desafio"),
  description: z.string().max(280).optional(),
  /** Calendar month, "YYYY-MM". No countdowns: the month name is enough. */
  month: z.string().regex(/^\d{4}-\d{2}$/, "Escolha o mês"),
  action: earnActionSchema,
  goal: z.number().int().min(1),
  /** Progress counted outside the site (e.g. sterilisations paid at the clinic). */
  extraProgress: z.number().int().min(0).default(0),
  active: z.boolean().default(true),
});
export type Challenge = z.infer<typeof challengeSchema>;

export const redemptionSchema = z.object({
  id: z.string(),
  accountId: z.string().optional(),
  partnerId: z.string(),
  perkId: z.string(),
  partnerName: z.string(),
  perkDescription: z.string(),
  cost: z.number().int().min(0),
  /** Short code the person shows at the partner. */
  code: z.string(),
  status: z.enum(["ativa", "usada", "cancelada"]),
  createdAt: z.string().datetime(),
  usedAt: z.string().datetime().optional(),
  cancelledAt: z.string().datetime().optional(),
});
export type Redemption = z.infer<typeof redemptionSchema>;

// ---------- levels ----------

export type Level = { level: number; name: string; min: number; reward: string };
export const levels: Level[] = [
  { level: 1, name: "Gatinho", min: 0, reward: "Medalha de boas-vindas e as novidades do gatil" },
  { level: 2, name: "Amigo de Bigodes", min: 150, reward: "O seu nome no mural de agradecimentos, se quiser" },
  { level: 3, name: "Guardião da Colónia", min: 500, reward: "Descontos nos parceiros e convite para o dia aberto do gatil" },
  { level: 4, name: "Anjo do Gatil", min: 1500, reward: "Uma lembrança da loja solidária e uma visita aos bastidores" },
  { level: 5, name: "Lenda dos Sete Fôlegos", min: 4000, reward: "Dar o nome a um gato resgatado e uma placa no gatil" },
];

export function levelFor(earned: number): Level {
  return [...levels].reverse().find((l) => earned >= l.min) ?? levels[0]!;
}

// ---------- defaults (editable in the back office) ----------

export const defaultPointsRules: PointsRule[] = [
  { action: "perfil", label: "Criar a sua conta", points: 10, once: true, verifiedBy: "Automático", active: true },
  { action: "questionario", label: "Fazer o questionário «Como posso ajudar?»", points: 10, once: true, verifiedBy: "Automático", active: true },
  { action: "partilha", label: "Partilhar um gato ou uma campanha", points: 5, weeklyLimit: 10, once: false, verifiedBy: "Automático", active: true },
  { action: "sos", label: "Avisar de um gato em perigo, com foto e local", points: 15, once: false, verifiedBy: "A equipa confirma", active: true },
  { action: "donativo", label: "Fazer um donativo, de qualquer valor", points: 20, once: false, verifiedBy: "A equipa confirma", active: true },
  { action: "apadrinhamento-mes", label: "Cada mês a apadrinhar um gato", points: 30, once: false, verifiedBy: "A equipa confirma", active: true },
  { action: "turno-hora", label: "Turno de voluntariado", points: 25, perUnit: "hora", once: false, verifiedBy: "Presença marcada no turno", active: true },
  { action: "transporte", label: "Levar um gato ao veterinário", points: 60, once: false, verifiedBy: "Presença marcada no turno", active: true },
  { action: "fat-semana", label: "Cada semana como família temporária", points: 100, once: false, verifiedBy: "A equipa confirma", active: true },
  { action: "foto-final-feliz-1m", label: "Fotos do gato adotado, um mês depois", points: 40, once: false, verifiedBy: "A equipa confirma", active: true },
  { action: "foto-final-feliz-6m", label: "Fotos do gato adotado, seis meses depois", points: 60, once: false, verifiedBy: "A equipa confirma", active: true },
  { action: "amigo-trazido", label: "Trazer um amigo que também ajuda", points: 50, once: false, verifiedBy: "A equipa confirma", active: true },
];

export const actionLabel: Record<EntryAction, string> = {
  ...(Object.fromEntries(defaultPointsRules.map((r) => [r.action, r.label])) as Record<EarnAction, string>),
  ajuste: "Acerto feito pela equipa",
  troca: "Troca por uma vantagem",
  devolucao: "Patinhas devolvidas",
};

// ---------- earning ----------

export type AwardError = "regra-inativa" | "ja-registado" | "so-uma-vez" | "limite-semanal";
export const awardErrorMessage: Record<AwardError, string> = {
  "regra-inativa": "Esta forma de ganhar Patinhas está desligada.",
  "ja-registado": "Isto já foi contado.",
  "so-uma-vez": "Isto só conta uma vez por pessoa.",
  "limite-semanal": "Já chegou ao limite desta semana. Obrigado pela energia!",
};

/** Monday 00:00 UTC of the week containing `d`. */
function weekStart(d: Date): number {
  const day = (d.getUTCDay() + 6) % 7;
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - day);
}

/**
 * Turns a verified action into a ledger line, or explains why it does not count.
 * `ledger` is this person's history.
 */
export function award(
  rules: PointsRule[],
  ledger: PatinhasEntry[],
  input: { id: string; accountId: string; action: EarnAction; at: Date; quantity?: number; sourceId?: string; note?: string; by?: PatinhasEntry["by"] },
): { ok: true; entry: PatinhasEntry } | { ok: false; error: AwardError } {
  const rule = rules.find((r) => r.action === input.action);
  if (!rule || !rule.active) return { ok: false, error: "regra-inativa" };
  if (input.sourceId && ledger.some((e) => e.sourceId === input.sourceId)) return { ok: false, error: "ja-registado" };
  const same = ledger.filter((e) => e.action === input.action);
  if (rule.once && same.length > 0) return { ok: false, error: "so-uma-vez" };
  if (rule.weeklyLimit) {
    const start = weekStart(input.at);
    const thisWeek = same.filter((e) => weekStart(new Date(e.at)) === start).length;
    if (thisWeek >= rule.weeklyLimit) return { ok: false, error: "limite-semanal" };
  }
  const quantity = input.quantity ?? 1;
  return {
    ok: true,
    entry: {
      id: input.id,
      accountId: input.accountId,
      action: input.action,
      points: Math.round(rule.points * quantity),
      quantity,
      at: input.at.toISOString(),
      sourceId: input.sourceId,
      note: input.note,
      by: input.by ?? "automatico",
    },
  };
}

const isEarning = (e: PatinhasEntry) => e.action !== "troca" && e.action !== "devolucao";

/** Everything ever earned. Levels use this, so taking a perk never lowers your level. */
export const earnedTotal = (ledger: PatinhasEntry[]) => Math.max(0, ledger.filter(isEarning).reduce((s, e) => s + e.points, 0));
/** What can still be spent on perks. */
export const balance = (ledger: PatinhasEntry[]) => Math.max(0, ledger.reduce((s, e) => s + e.points, 0));

const monthOf = (iso: string) => iso.slice(0, 7);
const previousMonth = (month: string) => {
  const [y, m] = month.split("-").map(Number) as [number, number];
  return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, "0")}`;
};

/**
 * Months in a row with at least one way of helping. The current month only breaks
 * the streak once it is over, so nobody feels pushed to act today.
 */
export function monthStreak(ledger: PatinhasEntry[], now: Date): number {
  const active = new Set(ledger.filter((e) => isEarning(e) && e.action !== "ajuste" && e.points > 0).map((e) => monthOf(e.at)));
  let month = monthOf(now.toISOString());
  if (!active.has(month)) month = previousMonth(month);
  let streak = 0;
  while (active.has(month)) {
    streak++;
    month = previousMonth(month);
  }
  return streak;
}

export function badgeProgress(badges: Badge[], ledger: PatinhasEntry[]) {
  return badges
    .filter((b) => b.active)
    .map((badge) => {
      const have = ledger.filter((e) => e.action === badge.action && e.points > 0).length;
      return { badge, have: Math.min(have, badge.count), earned: have >= badge.count };
    });
}

/** Shared progress for a monthly challenge, counting everyone's actions that month. */
export function challengeProgress(challenge: Challenge, allEntries: PatinhasEntry[]): number {
  const count = allEntries.filter((e) => e.action === challenge.action && e.points > 0 && monthOf(e.at) === challenge.month).length;
  return count + challenge.extraProgress;
}

export const currentChallenges = (challenges: Challenge[], now: Date) => challenges.filter((c) => c.active && c.month === monthOf(now.toISOString()));

const monthNames = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
export const monthLabel = (month: string) => {
  const [y, m] = month.split("-").map(Number) as [number, number];
  return `${monthNames[m - 1]} de ${y}`;
};

// ---------- perks ----------

export type RedeemError = "sem-troca" | "parceiro-inativo" | "nivel" | "saldo" | "limite-mensal";

/** Whether this person can take this perk now. Messages say what to do, not just "no". */
export function canRedeem(
  partner: Pick<Partner, "active">,
  perk: Perk,
  person: { level: number; balance: number; redemptions: Pick<Redemption, "perkId" | "status" | "createdAt">[] },
  now: Date,
): { ok: true } | { ok: false; error: RedeemError; message: string } {
  if (!perk.id || !perk.patinhasCost) return { ok: false, error: "sem-troca", message: "Esta vantagem não se troca por Patinhas." };
  if (!partner.active) return { ok: false, error: "parceiro-inativo", message: "Este parceiro já não está ativo." };
  if (perk.minLevel && person.level < perk.minLevel) {
    return { ok: false, error: "nivel", message: `A partir do nível ${perk.minLevel}, ${levels[perk.minLevel - 1]!.name}.` };
  }
  if (perk.monthlyLimitPerPerson) {
    const month = monthOf(now.toISOString());
    const used = person.redemptions.filter((r) => r.perkId === perk.id && r.status !== "cancelada" && monthOf(r.createdAt) === month).length;
    if (used >= perk.monthlyLimitPerPerson) {
      return { ok: false, error: "limite-mensal", message: perk.monthlyLimitPerPerson === 1 ? "Já usou esta vantagem este mês." : `Já usou esta vantagem ${used} vezes este mês.` };
    }
  }
  if (person.balance < perk.patinhasCost) return { ok: false, error: "saldo", message: `Faltam ${perk.patinhasCost - person.balance} Patinhas.` };
  return { ok: true };
}

/** Easy to read aloud at a counter: no 0/O or 1/I. */
export function redemptionCode(random: () => number = Math.random): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 5; i++) code += alphabet[Math.floor(random() * alphabet.length)];
  return `GN-${code}`;
}

/** Everything the helper's page shows, built the same way by the API and the offline demo. */
export function buildPainel(input: {
  ledger: PatinhasEntry[];
  rules: PointsRule[];
  badges: Badge[];
  challenges: Challenge[];
  /** Everyone's entries for the current month(s), for shared challenge progress. */
  communityEntries: PatinhasEntry[];
  partners: Partner[];
  redemptions: Redemption[];
  now: Date;
}) {
  const { ledger, now } = input;
  const earned = earnedTotal(ledger);
  const level = levelFor(earned);
  const next = levels.find((l) => l.min > earned);
  const spendable = balance(ledger);
  return {
    earned,
    balance: spendable,
    level,
    next: next ? { ...next, missing: next.min - earned } : undefined,
    streakMonths: monthStreak(ledger, now),
    badges: badgeProgress(input.badges, ledger),
    history: [...ledger].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 20).map((e) => ({ ...e, label: actionLabel[e.action] })),
    challenges: currentChallenges(input.challenges, now).map((challenge) => ({ challenge, progress: challengeProgress(challenge, input.communityEntries) })),
    waysToEarn: input.rules.filter((r) => r.active),
    perks: input.partners
      .filter((p) => p.active)
      .flatMap((partner) =>
        partner.perks
          .filter((perk) => perk.patinhasCost && perk.id)
          .map((perk) => {
            const check = canRedeem(partner, perk, { level: level.level, balance: spendable, redemptions: input.redemptions }, now);
            return { partnerId: partner.id, partnerName: partner.name, town: partner.town, perk, available: check.ok, reason: check.ok ? undefined : check.message };
          }),
      )
      .sort((a, b) => (a.perk.patinhasCost ?? 0) - (b.perk.patinhasCost ?? 0)),
    redemptions: [...input.redemptions].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  };
}
export type Painel = ReturnType<typeof buildPainel>;
