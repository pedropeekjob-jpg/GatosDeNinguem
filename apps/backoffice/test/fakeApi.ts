import { vi } from "vitest";
import {
  channelProblem, checkIn, draftPromotion, editPromotion, expandWeeklyRule, promotionChannelLabel, promotionChannels, type Promotion, seedCats, seedFosterApplications, seedFosterPlacements, seedImpact, seedPages, seedPosts, seedRedirects, seedSeoSettings, seedShifts, seedSponsorLetters, seedSponsorships, signUp,
  type Shift, type SponsorLetter,
} from "@gn/domain";
import {
  award, balance, defaultPointsRules, earnedTotal, levelFor, seedAccounts, seedBadges, seedChallenges, seedEntries, seedPartners, seedRedemptions,
  type Badge, type Challenge, type PatinhasEntry, type PointsRule, type Redemption,
} from "@gn/domain";
import { auditSeo, resolveSeo } from "@gn/seo";
import type { Api } from "../src/lib/api";
import { fakeCuidados } from "./fakeCuidados";
import { fakeLoja } from "./fakeLoja";

/** In-memory Api for component tests, built on the same demo data and rules as the server. */
export function fakeApi(now = new Date("2026-11-01T09:00:00.000Z")) {
  let shifts: Shift[] = structuredClone(seedShifts);
  let cats = structuredClone(seedCats);
  let letters: SponsorLetter[] = structuredClone(seedSponsorLetters);
  let pages = structuredClone(seedPages);
  let redirects = structuredClone(seedRedirects);
  const fosterApplications = structuredClone(seedFosterApplications);
  // The Open Day promotion, drafted on 24 Oct like the server would.
  let promotions: Promotion[] = seedPosts.flatMap((p) => draftPromotion(p, { siteUrl: "https://gatosdeninguem.pt", now: new Date("2026-10-24T10:00:00.000Z"), id: `promo-${p.id}` }) ?? []);
  const view = (p: Promotion) => ({ ...p, problems: Object.fromEntries(p.channels.flatMap((c) => { const why = channelProblem(p, c); return why ? [[c, why]] : []; })) });
  const setPromotion = (pid: string, change: (p: Promotion) => Promotion) => { promotions = promotions.map((p) => (p.id === pid ? change(p) : p)); return view(promotions.find((p) => p.id === pid)!); };
  let n = 0;
  const id = () => `novo-${++n}`;

  let rules: PointsRule[] = structuredClone(defaultPointsRules);
  let entries: PatinhasEntry[] = structuredClone(seedEntries);
  let badges: Badge[] = structuredClone(seedBadges);
  let challenges: Challenge[] = structuredClone(seedChallenges);
  let redemptions: Redemption[] = structuredClone(seedRedemptions);
  let partners = structuredClone(seedPartners);
  const person = (accountId: string) => {
    const ledger = entries.filter((e) => e.accountId === accountId);
    return { earned: earnedTotal(ledger), balance: balance(ledger), level: levelFor(earnedTotal(ledger)), lastActivity: ledger.map((e) => e.at).sort().at(-1) };
  };

  const api: Api = {
    ...fakeCuidados(now, () => cats),
    ...fakeLoja(now),
    people: async () => seedAccounts.map((a) => ({ ...a, ...person(a.id) })),
    person: async () => { throw new Error("not used"); },
    givePatinhas: vi.fn(async (accountId, input) => {
      if (input.action === "ajuste") { const e = { id: id(), accountId, action: "ajuste" as const, points: input.points!, quantity: 1, at: now.toISOString(), by: "equipa" as const }; entries.push(e); return e; }
      const r = award(rules, entries.filter((e) => e.accountId === accountId), { id: id(), accountId, action: input.action, at: now, quantity: input.quantity, note: input.note, by: "equipa" });
      if (!r.ok) throw new Error(r.error);
      entries.push(r.entry);
      return r.entry;
    }),
    redemptions: async () => redemptions.map((r) => ({ ...r, personName: seedAccounts.find((a) => a.id === r.accountId)?.name })),
    markRedemptionUsed: async (rid) => { redemptions = redemptions.map((r) => (r.id === rid ? { ...r, status: "usada" as const } : r)); return redemptions.find((r) => r.id === rid)!; },
    cancelRedemption: async (rid) => { redemptions = redemptions.map((r) => (r.id === rid ? { ...r, status: "cancelada" as const } : r)); return redemptions.find((r) => r.id === rid)!; },
    pointsRules: async () => rules,
    savePointsRules: vi.fn(async (r) => { rules = r; return r; }),
    badges: async () => badges,
    saveBadge: async (b) => { badges = [...badges.filter((x) => x.id !== b.id), b]; return b; },
    deleteBadge: async (bid) => { badges = badges.filter((b) => b.id !== bid); },
    challenges: async () => challenges.map((c) => ({ ...c, progress: c.extraProgress })),
    saveChallenge: async (c) => { const x = { ...c, id: c.id ?? id() }; challenges = [...challenges.filter((y) => y.id !== x.id), x]; return x; },
    deleteChallenge: async (cid) => { challenges = challenges.filter((c) => c.id !== cid); },
    updatePartner: vi.fn(async (pid, changes) => { partners = partners.map((p) => (p.id === pid ? { ...p, ...changes } : p)); return partners.find((p) => p.id === pid)!; }),
    shifts: async ({ from, to }) => shifts.filter((s) => s.endsAt >= from && s.startsAt <= to),
    createShift: async (input) => { const s = { ...input, id: id(), signups: [] }; shifts.push(s); return s; },
    createWeekly: async (rule) => { const created = expandWeeklyRule(rule, "serie", id); shifts.push(...created); return { created: created.length }; },
    deleteShift: async (sid) => { shifts = shifts.filter((s) => s.id !== sid); },
    addSignUp: async (sid, v) => {
      const s = shifts.find((x) => x.id === sid)!;
      const r = signUp(s, { volunteerId: `v-${v.phone}`, ...v }, now);
      if (!r.ok) throw new Error(r.error);
      shifts = shifts.map((x) => (x.id === sid ? r.shift : x));
      return r.shift;
    },
    removeSignUp: async (sid, vid) => { shifts = shifts.map((x) => (x.id === sid ? { ...x, signups: x.signups.filter((s) => s.volunteerId !== vid) } : x)); return shifts.find((x) => x.id === sid)!; },
    markPresent: async (sid, vid) => { shifts = shifts.map((x) => (x.id === sid ? checkIn(x, vid, now) : x)); return shifts.find((x) => x.id === sid)!; },
    fosterPlacements: async () => seedFosterPlacements,
    saveFosterPlacement: async (p) => ({ ...p, id: p.id ?? id() }),
    fosterApplications: async () => fosterApplications,
    setFosterApplicationStatus: async (aid, status) => {
      const a = fosterApplications.find((x) => x.id === aid)!;
      a.status = status;
      return a;
    },
    sponsorships: async () => seedSponsorships.map((s) => ({ ...s, needsUpdate: s.id === "sp-1" })),
    saveSponsorship: async (s) => ({ ...s, id: s.id ?? id() }),
    sponsorLetters: async (slug) => letters.filter((l) => !slug || l.catSlug === slug),
    sendSponsorLetter: vi.fn(async ({ by, ...input }) => {
      const letter = { ...input, id: id(), catName: cats.find((c) => c.slug === input.catSlug)?.name ?? input.catSlug, by, createdAt: now.toISOString() };
      letters = [letter, ...letters];
      return { letter, sponsors: seedSponsorships.filter((s) => s.catSlug === input.catSlug && s.active).length, emailed: 1 };
    }),
    cats: async () => cats,
    createCat: async (input) => { const c = { ...input, id: id(), updatedAt: now.toISOString() }; cats = [...cats, c]; return c; },
    updateCat: async (cid, changes) => { cats = cats.map((c) => (c.id === cid ? { ...c, ...changes } : c)); return cats.find((c) => c.id === cid)!; },
    posts: async () => seedPosts,
    createPost: async (input) => ({ ...input, id: id(), updatedAt: now.toISOString() }),
    updatePost: async (pid, changes) => ({ ...seedPosts.find((p) => p.id === pid)!, ...changes }),
    promotions: async () => promotions.map(view),
    promotionChannels: async () => promotionChannels.map((c) => ({ channel: c, label: promotionChannelLabel[c], ready: c !== "facebook-story", setup: c === "facebook-story" ? "O Facebook ainda não está ligado." : undefined })),
    editPromotion: vi.fn(async (pid, edit) => setPromotion(pid, (p) => editPromotion(p, edit, now))),
    promotionAction: vi.fn(async (pid, action) => setPromotion(pid, (p) => ({ ...p, status: action === "aprovar" ? "aprovada" : action === "cancelar" ? "cancelada" : action === "publicar" ? "publicada" : "rascunho" }))),
    pages: async () => pages,
    updatePage: async (pid, changes) => { pages = pages.map((p) => (p.id === pid ? { ...p, ...changes } : p)); return pages.find((p) => p.id === pid)!; },
    uploadPhoto: vi.fn(async () => ({ url: `/demo/novo-${++n}.jpg` })),
    partners: async () => partners,
    partnerApplications: async () => [],
    adoptionInterests: async () => [{ id: "i1", catSlug: "tobias", name: "Maria Silva", phone: "912345678", town: "Viana do Castelo", bestTime: "tarde", receivedAt: now.toISOString() }],
    impact: async () => seedImpact,
    saveImpact: async (i) => i,
    seoAudit: async () => {
      const items = pages.map((p) => {
        const seo = resolveSeo(seedSeoSettings, { path: p.path, title: p.heading, description: p.intro, overrides: p.seo });
        return { id: p.id, kind: "pagina" as const, label: p.heading, path: p.path, title: seo.title, description: seo.description, noindex: !seo.robots.index };
      });
      return { items, issues: auditSeo(items) };
    },
    seoSettings: async () => seedSeoSettings,
    saveSeoSettings: async (s) => s,
    saveSeo: vi.fn(async () => ({})),
    redirects: async () => redirects,
    addRedirect: async (r) => { const x = { ...r, id: id() }; redirects = [...redirects, x]; return x; },
    deleteRedirect: async (rid) => { redirects = redirects.filter((r) => r.id !== rid); },
  };
  return api;
}
