import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { NestFastifyApplication } from "@nestjs/platform-fastify";
import { createApp } from "../src/app";
import { InMemoryContentRepository } from "../src/content/in-memory.repository";

const TOKEN = "test-admin-token";
let app: NestFastifyApplication;
const revalidate = vi.fn(async () => {});
const auth = { authorization: `Bearer ${TOKEN}` };

beforeAll(async () => {
  app = await createApp({ repository: new InMemoryContentRepository(), adminToken: TOKEN, onContentChanged: revalidate, logger: false });
  await app.init();
  await app.getHttpAdapter().getInstance().ready();
});
afterAll(async () => app.close());

const req = (opts: { method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE"; url: string; payload?: unknown; headers?: Record<string, string> }) =>
  app.inject({ method: opts.method ?? "GET", url: opts.url, payload: opts.payload as object, headers: opts.headers });

describe("public reads", () => {
  it("lists cats looking for a family", async () => {
    const res = await req({ url: "/cats?status=para-adocao" });
    expect(res.statusCode).toBe(200);
    const cats = res.json();
    expect(cats.length).toBeGreaterThan(0);
    expect(cats.every((c: { status: string }) => c.status === "para-adocao")).toBe(true);
  });

  it("hides adopter details without consent in the happy endings list", async () => {
    const res = await req({ url: "/cats/finais-felizes" });
    const items = res.json() as { cat: { slug: string; happyEnding?: unknown }; happyEnding: { adopterName?: string } }[];
    const lua = items.find((i) => i.cat.slug === "lua")!;
    expect(lua.happyEnding.adopterName).toBeUndefined();
    expect(lua.cat.happyEnding).toBeUndefined();
  });

  it("returns 404 in Portuguese for unknown cats", async () => {
    const res = await req({ url: "/cats/nao-existe" });
    expect(res.statusCode).toBe(404);
    expect(res.json().message).toMatch(/não encontr/i);
  });

  it("lists news newest first", async () => {
    const posts = (await req({ url: "/posts" })).json() as { publishedAt: string }[];
    expect(posts[0]!.publishedAt >= posts[1]!.publishedAt).toBe(true);
  });

  it("serves SEO settings and redirects publicly (used by the site)", async () => {
    expect((await req({ url: "/seo/settings" })).json().siteName).toBe("Gatos de Ninguém");
    expect((await req({ url: "/seo/redirects" })).json().length).toBeGreaterThan(0);
  });
});

describe("writes require the admin token", () => {
  it("rejects anonymous writes", async () => {
    const res = await req({ method: "PATCH", url: "/pages/page-home/seo", payload: { title: "x" } });
    expect(res.statusCode).toBe(401);
  });

  it("lets the SEO editor change a page's SEO and triggers a site refresh", async () => {
    const res = await req({ method: "PATCH", url: "/pages/page-adotar/seo", headers: auth, payload: { title: "Adotar gatos em Viana do Castelo", description: "Gatos esterilizados e vacinados à espera de família." } });
    expect(res.statusCode).toBe(200);
    expect(res.json().seo.title).toBe("Adotar gatos em Viana do Castelo");
    expect(revalidate).toHaveBeenCalled();
  });

  it("validates input and explains the problem", async () => {
    const res = await req({ method: "PATCH", url: "/cats/cat-1/seo", headers: auth, payload: { canonicalUrl: "não é url" } });
    expect(res.statusCode).toBe(400);
    expect(res.json().issues[0].path).toEqual(["canonicalUrl"]);
  });

  it("creates a redirect and refuses duplicates", async () => {
    const ok = await req({ method: "POST", url: "/seo/redirects", headers: auth, payload: { from: "/velho", to: "/novo" } });
    expect(ok.statusCode).toBe(201);
    const dup = await req({ method: "POST", url: "/seo/redirects", headers: auth, payload: { from: "/VELHO/", to: "/outro" } });
    expect(dup.statusCode).toBe(409);
  });

  it("publishes a news post with a unique slug", async () => {
    const payload = { slug: "teste", title: "Teste", category: "noticia", summary: "Resumo", body: "Corpo", publishedAt: "2026-10-22T10:00:00.000Z" };
    expect((await req({ method: "POST", url: "/posts", headers: auth, payload })).statusCode).toBe(201);
    expect((await req({ method: "POST", url: "/posts", headers: auth, payload })).statusCode).toBe(409);
  });

  it("marks a cat as adopted and stamps adoptedAt", async () => {
    const res = await req({ method: "PATCH", url: "/cats/cat-2", headers: auth, payload: { status: "adotado" } });
    expect(res.statusCode).toBe(200);
    expect(res.json().adoptedAt).toBeTruthy();
  });

  it("remembers when a cat was first put up for adoption", async () => {
    const res = await req({ method: "PATCH", url: "/cats/cat-5", headers: auth, payload: { status: "para-adocao" } });
    const listedAt = res.json().listedAt;
    expect(listedAt).toBeTruthy();
    await req({ method: "PATCH", url: "/cats/cat-5", headers: auth, payload: { status: "reservado" } });
    const again = await req({ method: "PATCH", url: "/cats/cat-5", headers: auth, payload: { status: "para-adocao" } });
    expect(again.json().listedAt).toBe(listedAt);
  });
});

describe("adoption interest", () => {
  it("accepts a valid request and lets the team read it", async () => {
    const bad = await req({ method: "POST", url: "/adoptions/interest", payload: { name: "A" } });
    expect(bad.statusCode).toBe(400);
    expect(bad.json().issues.some((i: { message: string }) => /telefone/.test(i.message))).toBe(true);
    const ok = await req({ method: "POST", url: "/adoptions/interest", payload: { catSlug: "tobias", name: "Maria Silva", phone: "912345678", town: "Viana do Castelo", consent: true } });
    expect(ok.statusCode).toBe(201);
    expect((await req({ url: "/adoptions/interest" })).statusCode).toBe(401);
    expect((await req({ url: "/adoptions/interest", headers: auth })).json()[0].catSlug).toBe("tobias");
  });
});

describe("engagement", () => {
  it("serves impact numbers and lets the team update them", async () => {
    const impact = (await req({ url: "/impact" })).json();
    expect(impact.campaign.goal).toBe(30);
    const res = await req({ method: "PUT", url: "/impact", headers: auth, payload: { ...impact, adoptionsThisYear: 38 } });
    expect(res.json().adoptionsThisYear).toBe(38);
  });

  it("subscribes to the newsletter only with consent", async () => {
    expect((await req({ method: "POST", url: "/newsletter", payload: { email: "a@b.pt" } })).statusCode).toBe(400);
    expect((await req({ method: "POST", url: "/newsletter", payload: { email: "a@b.pt", consent: true } })).statusCode).toBe(201);
  });
});

describe("partners", () => {
  it("lists active partners and accepts applications", async () => {
    expect((await req({ url: "/partners" })).json().length).toBeGreaterThan(0);
    const bad = await req({ method: "POST", url: "/partners/applications", payload: { businessName: "X" } });
    expect(bad.statusCode).toBe(400);
    const ok = await req({ method: "POST", url: "/partners/applications", payload: { businessName: "Padaria Central", contactName: "Ana", email: "ana@example.pt", town: "Viana do Castelo", consent: true } });
    expect(ok.statusCode).toBe(201);
    const list = await req({ url: "/partners/applications", headers: auth });
    expect(list.json()).toHaveLength(1);
  });

  it("silently drops spam bot submissions", async () => {
    await req({ method: "POST", url: "/partners/applications", payload: { website_url: "http://spam" } });
    expect((await req({ url: "/partners/applications", headers: auth })).json()).toHaveLength(1);
  });
});

describe("SEO audit", () => {
  it("reports issues across pages, cats and posts", async () => {
    const res = await req({ url: "/seo/audit", headers: auth });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.items.length).toBeGreaterThan(5);
    expect(Array.isArray(body.issues)).toBe(true);
  });
});
