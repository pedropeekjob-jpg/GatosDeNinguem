import { vi } from "vitest";
import {
  checkIn, expandWeeklyRule, seedCats, seedFosterPlacements, seedImpact, seedPages, seedPosts, seedRedirects, seedSeoSettings, seedShifts, seedSponsorships, signUp,
  type Shift,
} from "@gn/domain";
import { auditSeo, resolveSeo } from "@gn/seo";
import type { Api } from "../src/lib/api";

/** In-memory Api for component tests, built on the same demo data and rules as the server. */
export function fakeApi(now = new Date("2026-11-01T09:00:00.000Z")) {
  let shifts: Shift[] = structuredClone(seedShifts);
  let cats = structuredClone(seedCats);
  const pages = structuredClone(seedPages);
  let redirects = structuredClone(seedRedirects);
  let n = 0;
  const id = () => `novo-${++n}`;

  const api: Api = {
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
    sponsorships: async () => seedSponsorships.map((s) => ({ ...s, needsUpdate: s.id === "sp-1" })),
    saveSponsorship: async (s) => ({ ...s, id: s.id ?? id() }),
    cats: async () => cats,
    createCat: async (input) => { const c = { ...input, id: id(), updatedAt: now.toISOString() }; cats = [...cats, c]; return c; },
    updateCat: async (cid, changes) => { cats = cats.map((c) => (c.id === cid ? { ...c, ...changes } : c)); return cats.find((c) => c.id === cid)!; },
    posts: async () => seedPosts,
    createPost: async (input) => ({ ...input, id: id(), updatedAt: now.toISOString() }),
    updatePost: async (pid, changes) => ({ ...seedPosts.find((p) => p.id === pid)!, ...changes }),
    pages: async () => pages,
    partners: async () => [],
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
