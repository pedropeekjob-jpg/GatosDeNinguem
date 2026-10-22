import { createContext, useContext } from "react";
import { patinhasHttp, type PatinhasApi } from "./patinhasApi";
import type { Cat, CatInput, FosterPlacement, Impact, Page, Partner, Post, PostInput, Redirect, SeoFields, SeoIssue, SeoSettings, Shift, ShiftInput, Sponsorship, WeeklyRule } from "./types";

export type AuditItem = { id: string; kind: "pagina" | "gato" | "noticia"; label: string; path: string; title: string; description: string; noindex: boolean };
export type SeoTarget = { kind: AuditItem["kind"]; id: string };

/** Everything the back office can ask the API. Tests pass a fake implementation. */
export interface Api extends PatinhasApi {
  shifts(range: { from: string; to: string }): Promise<Shift[]>;
  createShift(input: ShiftInput): Promise<Shift>;
  createWeekly(rule: WeeklyRule): Promise<{ created: number }>;
  deleteShift(id: string): Promise<void>;
  addSignUp(shiftId: string, v: { name: string; phone: string }): Promise<Shift>;
  removeSignUp(shiftId: string, volunteerId: string): Promise<Shift>;
  markPresent(shiftId: string, volunteerId: string): Promise<Shift>;
  fosterPlacements(): Promise<FosterPlacement[]>;
  saveFosterPlacement(p: Partial<FosterPlacement> & Omit<FosterPlacement, "id">): Promise<FosterPlacement>;
  sponsorships(): Promise<(Sponsorship & { needsUpdate: boolean })[]>;
  saveSponsorship(s: Partial<Sponsorship> & Omit<Sponsorship, "id">): Promise<Sponsorship>;

  cats(): Promise<Cat[]>;
  createCat(input: CatInput): Promise<Cat>;
  updateCat(id: string, changes: Partial<CatInput>): Promise<Cat>;
  posts(): Promise<Post[]>;
  createPost(input: PostInput): Promise<Post>;
  updatePost(id: string, changes: Partial<PostInput>): Promise<Post>;
  pages(): Promise<Page[]>;
  updatePage(id: string, changes: Partial<Pick<Page, "heading" | "intro" | "gallery" | "carousel">>): Promise<Page>;
  /** Stores a photo (already resized) and returns its public address. */
  uploadPhoto(photo: { type: string; data: string }): Promise<{ url: string }>;
  partners(): Promise<Partner[]>;
  partnerApplications(): Promise<{ id: string; businessName: string; contactName: string; email: string; phone?: string; town: string; offer?: string; receivedAt: string }[]>;
  adoptionInterests(): Promise<{ id: string; catSlug?: string; name: string; phone: string; town: string; bestTime: string; message?: string; receivedAt: string }[]>;
  impact(): Promise<Impact>;
  saveImpact(impact: Impact): Promise<Impact>;

  seoAudit(): Promise<{ items: AuditItem[]; issues: SeoIssue[] }>;
  seoSettings(): Promise<SeoSettings>;
  saveSeoSettings(s: SeoSettings): Promise<SeoSettings>;
  saveSeo(target: SeoTarget, seo: SeoFields): Promise<unknown>;
  redirects(): Promise<Redirect[]>;
  addRedirect(r: Omit<Redirect, "id">): Promise<Redirect>;
  deleteRedirect(id: string): Promise<void>;
}

export class ApiError extends Error {
  constructor(message: string, readonly status: number, readonly issues: { path: (string | number)[]; message: string }[] = []) {
    super(message);
  }
}

export function httpApi(baseUrl: string, token: string): Api {
  async function call<T>(method: string, path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${baseUrl}${path}`, {
      method,
      headers: { authorization: `Bearer ${token}`, ...(body !== undefined ? { "content-type": "application/json" } : {}) },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    if (res.status === 204) return undefined as T;
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new ApiError(data.message ?? `Erro ${res.status}`, res.status, data.issues);
    return data as T;
  }
  const seoPath: Record<SeoTarget["kind"], string> = { pagina: "/pages", gato: "/cats", noticia: "/posts" };
  return {
    shifts: (r) => call("GET", `/escalas/turnos?de=${encodeURIComponent(r.from)}&ate=${encodeURIComponent(r.to)}`),
    createShift: (input) => call("POST", "/escalas/turnos", input),
    createWeekly: (rule) => call("POST", "/escalas/turnos/semanais", rule),
    deleteShift: (id) => call("DELETE", `/escalas/turnos/${id}`),
    addSignUp: (id, v) => call("POST", `/escalas/turnos/${id}/inscricoes`, v),
    removeSignUp: (id, vid) => call("DELETE", `/escalas/turnos/${id}/inscricoes/${vid}`),
    markPresent: (id, vid) => call("POST", `/escalas/turnos/${id}/inscricoes/${vid}/presenca`),
    fosterPlacements: () => call("GET", "/escalas/familias-temporarias"),
    saveFosterPlacement: (p) => call("POST", "/escalas/familias-temporarias", p),
    sponsorships: () => call("GET", "/escalas/padrinhos"),
    saveSponsorship: (s) => call("POST", "/escalas/padrinhos", s),
    cats: () => call("GET", "/cats"),
    createCat: (input) => call("POST", "/cats", input),
    updateCat: (id, changes) => call("PATCH", `/cats/${id}`, changes),
    posts: () => call("GET", "/posts"),
    createPost: (input) => call("POST", "/posts", input),
    updatePost: (id, changes) => call("PATCH", `/posts/${id}`, changes),
    pages: () => call("GET", "/pages"),
    updatePage: (id, changes) => call("PATCH", `/pages/${id}`, changes),
    uploadPhoto: (photo) => call("POST", "/uploads", photo),
    partners: () => call("GET", "/partners"),
    partnerApplications: () => call("GET", "/partners/applications"),
    adoptionInterests: () => call("GET", "/adoptions/interest"),
    impact: () => call("GET", "/impact"),
    saveImpact: (i) => call("PUT", "/impact", i),
    seoAudit: () => call("GET", "/seo/audit"),
    seoSettings: () => call("GET", "/seo/settings"),
    saveSeoSettings: (s) => call("PUT", "/seo/settings", s),
    saveSeo: (t, seo) => call("PATCH", `${seoPath[t.kind]}/${t.id}/seo`, seo),
    redirects: () => call("GET", "/seo/redirects"),
    addRedirect: (r) => call("POST", "/seo/redirects", r),
    deleteRedirect: (id) => call("DELETE", `/seo/redirects/${id}`),
    ...patinhasHttp(call),
  };
}

export const ApiContext = createContext<Api | null>(null);
export function useApi(): Api {
  const api = useContext(ApiContext);
  if (!api) throw new Error("ApiContext em falta");
  return api;
}

export function errorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.issues.length ? `${err.message} ${err.issues.map((i) => i.message).join(" ")}` : err.message;
  // fetch reports a lost connection as a TypeError; other errors carry a message written for people.
  if (err instanceof Error && !(err instanceof TypeError)) return err.message;
  return "Não foi possível falar com o servidor. Verifique a ligação.";
}
