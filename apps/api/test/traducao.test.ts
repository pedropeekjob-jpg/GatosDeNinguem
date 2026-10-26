import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { NestFastifyApplication } from "@nestjs/platform-fastify";
import { seedCats } from "@gn/domain";
import { createApp } from "../src/app";
import { InMemoryContentRepository } from "../src/content/in-memory.repository";
import { deeplTranslator, protect, unprotect, type Translator } from "../src/traducao/translator";

const TOKEN = "test-admin-token";
const auth = { authorization: `Bearer ${TOKEN}` };
/** Writes "[en] texto", and checks the protected words arrive. */
const calls: { texts: string[]; keep: string[] }[] = [];
let failFor: string | undefined;
const fake: Translator = {
  name: "Teste",
  async translate(texts, to, keep) {
    if (to === failFor) throw new Error("serviço em baixo");
    calls.push({ texts, keep });
    return texts.map((t) => `[${to}] ${t}`);
  },
};

let app: NestFastifyApplication;
let offApp: NestFastifyApplication;
beforeAll(async () => {
  app = await createApp({ repository: new InMemoryContentRepository(), adminToken: TOKEN, onContentChanged: vi.fn(async () => {}), logger: false, translator: fake });
  offApp = await createApp({ repository: new InMemoryContentRepository(), adminToken: TOKEN, onContentChanged: vi.fn(async () => {}), logger: false });
  for (const a of [app, offApp]) { await a.init(); await a.getHttpAdapter().getInstance().ready(); }
});
afterAll(async () => { await app.close(); await offApp.close(); });

const newCat = () => {
  const { id: _id, updatedAt: _u, translations: _t, ...base } = seedCats[0]!;
  return { ...base, slug: `gato-${Math.random().toString(36).slice(2, 8)}`, name: "Estrela", summary: "A Estrela é meiga.", story: "Chegou em março.", traits: ["meiga", "curiosa"], specialNeeds: undefined, happyEnding: undefined };
};

describe("automatic translation when the team saves", () => {
  it("a new cat comes back in English, Spanish and French, marked as machine translated, keeping its name", async () => {
    calls.length = 0;
    const cat = (await app.inject({ method: "POST", url: "/cats", headers: auth, payload: newCat() })).json();
    expect(cat.translations.en).toEqual({ summary: "[en] A Estrela é meiga.", story: "[en] Chegou em março.", traits: ["[en] meiga", "[en] curiosa"], auto: true });
    expect(cat.translations.fr.auto).toBe(true);
    expect(calls[0]!.keep).toContain("Estrela");
    expect(calls[0]!.keep).toContain("Gatos de Ninguém");
  });

  it("an edit retranslates only what changed, and never a translation the team corrected", async () => {
    const cat = (await app.inject({ method: "POST", url: "/cats", headers: auth, payload: newCat() })).json();
    const corrected = { ...cat.translations, es: { ...cat.translations.es, story: "Llegó en marzo (revisado).", auto: false } };
    calls.length = 0;
    const next = (await app.inject({ method: "PATCH", url: `/cats/${cat.id}`, headers: auth, payload: { story: "Chegou em abril.", translations: corrected } })).json();
    expect(next.translations.en.story).toBe("[en] Chegou em abril.");
    expect(next.translations.en.summary).toBe("[en] A Estrela é meiga.");
    expect(next.translations.es.story).toBe("Llegó en marzo (revisado).");
    expect(calls.flatMap((c) => c.texts)).toEqual(["Chegou em abril.", "Chegou em abril."]);
  });

  it("asking for a fresh translation (language removed) fills it again", async () => {
    const cat = (await app.inject({ method: "POST", url: "/cats", headers: auth, payload: newCat() })).json();
    const { fr: _fr, ...rest } = cat.translations;
    const next = (await app.inject({ method: "PATCH", url: `/cats/${cat.id}`, headers: auth, payload: { translations: rest } })).json();
    expect(next.translations.fr.summary).toBe("[fr] A Estrela é meiga.");
  });

  it("saving never fails when the translation service is down", async () => {
    failFor = "es";
    const res = await app.inject({ method: "POST", url: "/cats", headers: auth, payload: newCat() });
    failFor = undefined;
    expect(res.statusCode).toBe(201);
    expect(res.json().translations.es).toBeUndefined();
    expect(res.json().translations.en.summary).toMatch(/^\[en\]/);
  });

  it("news, pages, partners and shop articles are translated too", async () => {
    const posts = (await app.inject({ url: "/posts" })).json();
    const post = (await app.inject({ method: "PATCH", url: `/posts/${posts[0].id}`, headers: auth, payload: { title: "Título novo", translations: {} } })).json();
    expect(post.translations.en.title).toBe("[en] Título novo");
    const pages = (await app.inject({ url: "/pages" })).json();
    const page = (await app.inject({ method: "PATCH", url: `/pages/${pages[0].id}`, headers: auth, payload: { intro: "Uma introdução nova.", translations: {} } })).json();
    expect(page.translations.fr.intro).toBe("[fr] Uma introdução nova.");
  });

  it("the back office can see whether it is on, and fill in everything missing at once", async () => {
    expect((await app.inject({ url: "/traducoes", headers: auth })).json()).toEqual({ on: true, provider: "Teste" });
    expect((await offApp.inject({ url: "/traducoes", headers: auth })).json()).toEqual({ on: false, provider: null });
    const filled = (await app.inject({ method: "POST", url: "/traducoes/preencher", headers: auth })).json();
    expect(filled.updated).toBeGreaterThan(0);
    // Hand-written translations in the example data are kept.
    const tobias = (await app.inject({ url: "/cats/tobias" })).json();
    expect(tobias.translations.en.auto).not.toBe(true);
    expect((await app.inject({ url: "/traducoes" })).statusCode).toBe(401);
  });

  it("without a translator, texts are saved in Portuguese only", async () => {
    const cat = (await offApp.inject({ method: "POST", url: "/cats", headers: auth, payload: newCat() })).json();
    expect(cat.translations).toBeUndefined();
  });
});

describe("DeepL", () => {
  it("keeps names as written and sends the right languages", async () => {
    expect(unprotect(protect("A Estrela & a Lua <3", ["Estrela", "Lua"]))).toBe("A Estrela & a Lua <3");
    expect(protect("Estrelas e Estrela", ["Estrela"])).toBe("Estrelas e <keep>Estrela</keep>");
    const fetchMock = vi.fn(async (_url: string, init: RequestInit) => {
      const body = JSON.parse(String(init.body));
      return new Response(JSON.stringify({ translations: body.text.map((t: string) => ({ text: t.replace("é meiga", "is sweet") })) }), { status: 200 });
    });
    const deepl = deeplTranslator("chave:fx", fetchMock as unknown as typeof fetch);
    expect(await deepl.translate(["A Estrela é meiga"], "en", ["Estrela"])).toEqual(["A Estrela is sweet"]);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe("https://api-free.deepl.com/v2/translate");
    expect(JSON.parse(String(init.body))).toMatchObject({ source_lang: "PT", target_lang: "EN-GB", tag_handling: "xml", ignore_tags: ["keep"] });
  });

  it("reports DeepL errors so the save can carry on without them", async () => {
    const deepl = deeplTranslator("chave", (async () => new Response("quota", { status: 456 })) as unknown as typeof fetch);
    await expect(deepl.translate(["Olá"], "fr", [])).rejects.toThrow("DeepL 456");
  });
});
