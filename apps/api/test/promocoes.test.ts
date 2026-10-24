import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { NestFastifyApplication } from "@nestjs/platform-fastify";
import { createApp } from "../src/app";
import type { PromotionMessage } from "../src/common/options";
import { InMemoryContentRepository } from "../src/content/in-memory.repository";
import { PromotionService } from "../src/promocao/promotion.service";
import { metaPublishers, resendNewsletterPublisher, tiktokPublisher } from "../src/promocao/publishers";

const TOKEN = "test-admin-token";
const auth = { authorization: `Bearer ${TOKEN}` };
let clock = new Date("2026-10-24T10:00:00.000Z");
const repo = new InMemoryContentRepository();
const sent: { channel: string; message: PromotionMessage }[] = [];
const fake = (channel: string) => async (message: PromotionMessage) => { sent.push({ channel, message }); return { externalId: `${channel}-1` }; };
const failingStory = vi.fn(async () => { throw new Error("Meta: o token expirou"); });
let app: NestFastifyApplication;

beforeAll(async () => {
  app = await createApp({
    repository: repo,
    adminToken: TOKEN,
    onContentChanged: async () => {},
    logger: false,
    now: () => clock,
    siteUrl: "https://gatosdeninguem.pt",
    publicUrl: "https://api.gatosdeninguem.pt",
    promotionPublishers: { "facebook-post": fake("facebook-post"), "instagram-post": fake("instagram-post"), "instagram-story": failingStory, email: fake("email") },
  });
  await app.init();
  await app.getHttpAdapter().getInstance().ready();
  await repo.saveNewsletterSignup({ email: "ana@exemplo.pt", interests: ["eventos"], consent: true, subscribedAt: clock.toISOString() });
  await repo.saveNewsletterSignup({ email: "rui@exemplo.pt", interests: ["adocao"], consent: true, subscribedAt: clock.toISOString() });
});
afterAll(async () => app.close());

const req = (method: "GET" | "POST" | "PATCH" | "DELETE", url: string, payload?: unknown, headers: Record<string, string> = auth) =>
  app.inject({ method, url, payload: payload as object, headers });

const event = {
  slug: "magusto-solidario",
  title: "Magusto solidário no gatil",
  category: "evento",
  summary: "Castanhas, bolos e a Loja Solidária aberta.",
  body: "Venha passar a tarde connosco.",
  publishedAt: "2026-10-24T09:00:00.000Z",
  event: { startsAt: "2026-11-11T15:00:00.000Z", endsAt: "2026-11-11T19:00:00.000Z", location: "Gatil, Santa Marta de Portuzelo" },
  seo: {},
};

describe("event promotions", () => {
  let id = "";
  let postId = "";

  it("drafts a promotion a week before as soon as the event is saved", async () => {
    const res = await req("POST", "/posts", event);
    expect(res.statusCode).toBe(201);
    postId = res.json().id;
    const list = (await req("GET", "/promocoes")).json() as { id: string; postId: string; status: string; scheduledFor: string; text: string; problems: Record<string, string> }[];
    const p = list.find((x) => x.postId === postId)!;
    id = p.id;
    expect(p.status).toBe("rascunho");
    expect(p.scheduledFor).toBe("2026-11-04T15:00:00.000Z");
    expect(p.text).toContain("Quarta-feira, 11 de novembro, das 15h00 às 19h00");
    expect(p.problems["instagram-post"]).toMatch(/fotografia/);
  });

  it("needs the manager's OK, and a JPG photo for Instagram", async () => {
    const refused = await req("POST", `/promocoes/${id}/aprovar`);
    expect(refused.statusCode).toBe(400);
    expect(refused.json().message).toMatch(/Publicação no Instagram: Precisa de uma fotografia/);
    const edited = await req("PATCH", `/promocoes/${id}`, { imageUrl: "https://api.gatosdeninguem.pt/uploads/0b9f6f4e-0000-4000-8000-000000000000.jpg", channels: ["facebook-post", "instagram-post", "instagram-story", "email"] });
    expect(edited.statusCode).toBe(200);
    const ok = await req("POST", `/promocoes/${id}/aprovar`);
    expect(ok.statusCode).toBe(200);
    expect(ok.json().status).toBe("aprovada");
  });

  it("lists which channels the server is connected to", async () => {
    const channels = (await req("GET", "/promocoes/canais")).json() as { channel: string; ready: boolean; setup?: string }[];
    expect(channels.find((c) => c.channel === "facebook-post")?.ready).toBe(true);
    expect(channels.find((c) => c.channel === "facebook-story")?.setup).toMatch(/Facebook ainda não está ligado/);
  });

  it("waits for the day, then publishes and keeps what failed for a retry", async () => {
    expect((await req("POST", "/promocoes/correr")).json()).toEqual({ published: 0 });
    clock = new Date("2026-11-04T15:05:00.000Z");
    expect((await req("POST", "/promocoes/correr")).json()).toEqual({ published: 1 });
    expect(sent.map((s) => s.channel)).toEqual(["facebook-post", "instagram-post", "email"]);
    const email = sent.find((s) => s.channel === "email")!.message;
    expect(email.recipients.map((r) => r.email)).toEqual(["ana@exemplo.pt"]);
    expect(email.link).toBe("https://gatosdeninguem.pt/noticias/magusto-solidario");

    const p = (await req("GET", "/promocoes")).json().find((x: { id: string }) => x.id === id);
    expect(p.status).toBe("com-erros");
    expect(p.results["instagram-story"].error).toBe("Meta: o token expirou");
    expect(p.results["facebook-post"].externalId).toBe("facebook-post-1");

    failingStory.mockResolvedValueOnce({ externalId: "story-1" } as never);
    sent.length = 0;
    const retry = await req("POST", `/promocoes/${id}/publicar`);
    expect(retry.json().status).toBe("publicada");
    expect(sent).toEqual([]);
    expect((await req("POST", "/promocoes/correr")).json()).toEqual({ published: 0 });
  });

  it("is only for the team", async () => {
    expect((await req("GET", "/promocoes", undefined, {})).statusCode).toBe(401);
  });

  it("goes back for approval when an approved event moves, and cancels when it is deleted", async () => {
    clock = new Date("2026-10-24T10:00:00.000Z");
    const post = (await req("POST", "/posts", { ...event, slug: "feira-de-adocao", title: "Feira de adoção" })).json();
    const promo = () => repo.getPromotionByPost(post.id);
    await req("PATCH", `/promocoes/${(await promo())!.id}`, { channels: ["facebook-post", "email"] });
    await req("POST", `/promocoes/${(await promo())!.id}/aprovar`);
    await req("PATCH", `/posts/${post.id}`, { event: { ...event.event, startsAt: "2026-11-18T15:00:00.000Z", endsAt: "2026-11-18T19:00:00.000Z" } });
    expect((await promo())!.status).toBe("rascunho");
    expect((await promo())!.scheduledFor).toBe("2026-11-11T15:00:00.000Z");
    await req("DELETE", `/posts/${post.id}`);
    expect((await promo())!.status).toBe("cancelada");
  });

  it("refuses an event that ends before it starts", async () => {
    const res = await req("POST", "/posts", { ...event, slug: "ao-contrario", event: { ...event.event, endsAt: "2026-11-11T14:00:00.000Z" } });
    expect(res.statusCode).toBe(400);
  });
});

describe("newsletter unsubscribe", () => {
  it("asks for a click, then removes the address", async () => {
    const service = app.get(PromotionService);
    const url = service.unsubscribeUrl("Ana@Exemplo.pt").replace("https://api.gatosdeninguem.pt", "");
    const ask = await req("GET", url, undefined, {});
    expect(ask.statusCode).toBe(200);
    expect(ask.body).toContain("Deixar de receber");
    expect((await repo.listNewsletterSignups()).some((s) => s.email === "ana@exemplo.pt")).toBe(true);
    const done = await app.inject({ method: "POST", url, payload: "List-Unsubscribe=One-Click", headers: { "content-type": "application/x-www-form-urlencoded" } });
    expect(done.statusCode).toBe(200);
    expect((await repo.listNewsletterSignups()).some((s) => s.email === "ana@exemplo.pt")).toBe(false);
  });

  it("refuses links that were not signed by us", async () => {
    const res = await req("POST", "/newsletter/sair?email=rui%40exemplo.pt&t=0000", undefined, {});
    expect(res.statusCode).toBe(400);
    expect((await repo.listNewsletterSignups()).some((s) => s.email === "rui@exemplo.pt")).toBe(true);
  });
});

describe("publishers", () => {
  const message: PromotionMessage = { text: "Magusto!", imageUrl: "https://x.pt/a.jpg", link: "https://gatosdeninguem.pt/noticias/m", emailSubject: "Olá", emailBody: "Corpo", recipients: [] };
  const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

  it("posts to Instagram in two steps once the photo is ready", async () => {
    const calls: string[] = [];
    const f = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      const u = String(url);
      calls.push(`${init?.method ?? "GET"} ${u.replace(/\?.*/, "")}`);
      if (u.endsWith("/ig1/media")) return reply({ id: "c1" });
      if (u.includes("/c1?")) return reply({ status_code: "FINISHED" });
      return reply({ id: "m1" });
    });
    const p = metaPublishers({ pageId: "pg1", igUserId: "ig1", pageToken: "tok", fetch: f as typeof fetch, pollMs: 0 });
    expect(await p["instagram-story"]!(message)).toEqual({ externalId: "m1" });
    expect(calls).toEqual(["POST https://graph.facebook.com/v23.0/ig1/media", "GET https://graph.facebook.com/v23.0/c1", "POST https://graph.facebook.com/v23.0/ig1/media_publish"]);
    const body = String((f.mock.calls[0]![1] as RequestInit).body);
    expect(body).toContain("media_type=STORIES");
    expect(body).toContain("access_token=tok");
  });

  it("turns Meta errors into readable messages", async () => {
    const f = async () => reply({ error: { message: "Invalid OAuth access token" } }, 400);
    const p = metaPublishers({ pageId: "pg1", pageToken: "tok", fetch: f as typeof fetch });
    await expect(p["facebook-post"]!(message)).rejects.toThrow("Meta: Invalid OAuth access token");
    expect(p["instagram-post"]).toBeUndefined();
  });

  it("refreshes the TikTok token, then posts the photo with the text", async () => {
    const f = vi.fn(async (url: string | URL | Request) => (String(url).includes("/oauth/token/") ? reply({ access_token: "act" }) : reply({ data: { publish_id: "p1" }, error: { code: "ok" } })));
    const send = tiktokPublisher({ clientKey: "ck", clientSecret: "cs", refreshToken: "rt", fetch: f as typeof fetch });
    expect(await send({ ...message, text: "Magusto!\nNo gatil." })).toEqual({ externalId: "p1" });
    const [, init] = f.mock.calls[1] as unknown as [string, RequestInit];
    expect((init.headers as Record<string, string>).authorization).toBe("Bearer act");
    const body = JSON.parse(String(init.body));
    expect(body.media_type).toBe("PHOTO");
    expect(body.post_info.title).toBe("Magusto!");
    expect(body.source_info.photo_images).toEqual(["https://x.pt/a.jpg"]);
  });

  it("says when TikTok refuses the sign-in", async () => {
    const f = async () => reply({ error: "invalid_grant", error_description: "Refresh token is invalid or expired." }, 400);
    const send = tiktokPublisher({ clientKey: "ck", clientSecret: "cs", refreshToken: "rt", fetch: f as typeof fetch });
    await expect(send(message)).rejects.toThrow("TikTok: não foi possível entrar na conta (Refresh token is invalid or expired.).");
  });

  it("emails each subscriber with their own unsubscribe link", async () => {
    const f = vi.fn(async () => reply({ data: [] }));
    const send = resendNewsletterPublisher({ apiKey: "k", from: "GN <n@gn.pt>", fetch: f as typeof fetch });
    const out = await send({ ...message, recipients: [{ email: "a@x.pt", unsubscribeUrl: "https://api/sair?a" }, { email: "b@x.pt", unsubscribeUrl: "https://api/sair?b" }] });
    expect(out.detail).toBe("Enviado a 2 subscritores.");
    const batch = JSON.parse(String((f.mock.calls[0] as unknown as [string, RequestInit])[1].body));
    expect(batch[1].to).toEqual(["b@x.pt"]);
    expect(batch[1].text).toContain("https://api/sair?b");
    expect(batch[1].headers["List-Unsubscribe"]).toBe("<https://api/sair?b>");
  });
});
