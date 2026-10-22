import type { Account } from "./contas";
import type { Badge, Challenge, EarnAction, PatinhasEntry, Redemption } from "./patinhas";

/** Example badges, challenges and helpers for the demo and tests. The team edits all of it in the back office. */

export const seedBadges: Badge[] = [
  { id: "primeiros-passos", name: "Primeiros passos", description: "Fez o questionário «Como posso ajudar?»", icon: "🐾", action: "questionario", count: 1, active: true },
  { id: "maos-a-obra", name: "Mãos à obra", description: "Fez o primeiro turno no gatil", icon: "🧹", action: "turno-hora", count: 1, active: true },
  { id: "voluntario-fiel", name: "Voluntário fiel", description: "Fez 10 turnos no gatil", icon: "🏅", action: "turno-hora", count: 10, active: true },
  { id: "taxi-felino", name: "Táxi felino", description: "Levou gatos ao veterinário 3 vezes", icon: "🚗", action: "transporte", count: 3, active: true },
  { id: "casa-quente", name: "Casa quente", description: "Acolheu um gato como família temporária", icon: "🏠", action: "fat-semana", count: 1, active: true },
  { id: "coracao-de-padrinho", name: "Coração de padrinho", description: "Apadrinhou um gato", icon: "💛", action: "apadrinhamento-mes", count: 1, active: true },
  { id: "final-feliz", name: "Final feliz", description: "Mandou fotos do gato que adotou", icon: "📸", action: "foto-final-feliz-1m", count: 1, active: true },
  { id: "embaixador", name: "Embaixador", description: "Partilhou gatos e campanhas 10 vezes", icon: "📣", action: "partilha", count: 10, active: true },
];

const themes: { action: EarnAction; title: (m: string) => string; description: string; goal: number; extraProgress: number }[] = [
  { action: "turno-hora", title: (m) => `${m}: 40 turnos no gatil`, description: "Limpeza, mimos e companhia para os 140 gatos. Cada turno feito conta para todos.", goal: 40, extraProgress: 9 },
  { action: "partilha", title: (m) => `${m}: 100 partilhas de gatos para adoção`, description: "Uma partilha pode chegar à família certa.", goal: 100, extraProgress: 31 },
  { action: "donativo", title: (m) => `${m}: 30 donativos para as esterilizações`, description: "Qualquer valor ajuda a pagar as esterilizações do programa CED.", goal: 30, extraProgress: 11 },
];
const monthName = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

/** One community challenge per month from October 2026 to September 2027. */
export const seedChallenges: Challenge[] = Array.from({ length: 12 }, (_, i) => {
  const y = 2026 + Math.floor((9 + i) / 12);
  const m = ((9 + i) % 12) + 1;
  const t = themes[i % themes.length]!;
  return { id: `desafio-${y}-${String(m).padStart(2, "0")}`, title: t.title(monthName[m - 1]!), description: t.description, month: `${y}-${String(m).padStart(2, "0")}`, action: t.action, goal: t.goal, extraProgress: t.extraProgress, active: true };
});

export const seedAccounts: Account[] = [
  { id: "conta-1", name: "Ana Ribeiro", email: "ana@exemplo.pt", phone: "912000001", nickname: "Ana dos Gatos", showOnWall: true, createdAt: "2026-06-02T10:00:00.000Z", consentAt: "2026-06-02T10:00:00.000Z" },
  { id: "conta-2", name: "João Costa", phone: "913000002", showOnWall: false, createdAt: "2026-09-10T18:00:00.000Z", consentAt: "2026-09-10T18:00:00.000Z" },
];

const e = (id: string, accountId: string, action: PatinhasEntry["action"], points: number, at: string, extra: Partial<PatinhasEntry> = {}): PatinhasEntry => ({ id, accountId, action, points, quantity: 1, at, by: "automatico", ...extra });

export const seedEntries: PatinhasEntry[] = [
  e("pt-1", "conta-1", "perfil", 10, "2026-06-02T10:00:00.000Z"),
  e("pt-2", "conta-1", "questionario", 10, "2026-06-02T10:05:00.000Z"),
  e("pt-3", "conta-1", "turno-hora", 50, "2026-07-11T12:00:00.000Z", { quantity: 2, sourceId: "turno:antigo-1" }),
  e("pt-4", "conta-1", "turno-hora", 50, "2026-08-08T12:00:00.000Z", { quantity: 2, sourceId: "turno:antigo-2" }),
  e("pt-5", "conta-1", "transporte", 60, "2026-09-03T16:00:00.000Z", { sourceId: "turno:antigo-3" }),
  e("pt-6", "conta-1", "apadrinhamento-mes", 30, "2026-09-30T09:00:00.000Z", { by: "equipa" }),
  e("pt-7", "conta-1", "apadrinhamento-mes", 30, "2026-10-01T09:00:00.000Z", { by: "equipa" }),
  e("pt-8", "conta-1", "turno-hora", 75, "2026-10-17T12:00:00.000Z", { quantity: 3, sourceId: "turno:antigo-4" }),
  e("pt-9", "conta-1", "troca", -30, "2026-10-18T10:00:00.000Z", { sourceId: "troca:tr-1" }),
  e("pt-10", "conta-2", "perfil", 10, "2026-09-10T18:00:00.000Z"),
  e("pt-11", "conta-2", "donativo", 20, "2026-10-05T20:00:00.000Z", { by: "equipa" }),
];

export const seedRedemptions: Redemption[] = [
  { id: "tr-1", accountId: "conta-1", partnerId: "partner-3", perkId: "cafe-turno", partnerName: "Café da Ribeira (exemplo)", perkDescription: "Um café oferecido por cada turno de voluntariado", cost: 30, code: "GN-K7P2Q", status: "ativa", createdAt: "2026-10-18T10:00:00.000Z" },
];
