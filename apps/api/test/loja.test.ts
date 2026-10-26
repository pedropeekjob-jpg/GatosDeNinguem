import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { NestFastifyApplication } from "@nestjs/platform-fastify";
import { createApp } from "../src/app";
import { InMemoryContentRepository } from "../src/content/in-memory.repository";

const TOKEN = "test-admin-token";
const auth = { authorization: `Bearer ${TOKEN}` };
let app: NestFastifyApplication;
const refreshed: string[] = [];

beforeAll(async () => {
  app = await createApp({
    repository: new InMemoryContentRepository(), adminToken: TOKEN, logger: false, now: () => new Date("2026-11-01T09:00:00.000Z"),
    onContentChanged: async (what) => { refreshed.push(what.type); },
  });
  await app.init();
  await app.getHttpAdapter().getInstance().ready();
});
afterAll(async () => app.close());

const req = (method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE", url: string, payload?: object, admin = false) =>
  app.inject({ method, url, payload, headers: admin ? auth : undefined });
const buyer = { name: "Helena Castro", phone: "912 000 011", delivery: "levantar", payment: "mbway", consent: true };

describe("public shop", () => {
  it("lists the gifts with their minimum donation, cost and stock, so everyone sees where the money goes", async () => {
    const res = await req("GET", "/loja/artigos");
    const caneca = res.json().find((p: { slug: string }) => p.slug === "caneca-gato-a-piscar-o-olho");
    expect(caneca).toMatchObject({ minDonationCents: 900, costCents: 350, stock: 12 });
  });

  it("shows how much the shop raised this year, what it paid for, and where the shop is", async () => {
    const res = await req("GET", "/loja/resumo");
    expect(res.json().transparency).toMatchObject({ year: 2026, donationsCents: 11600, spentCents: 6800 });
    expect(res.json().settings).toEqual({ address: "Rua da Estação 134, Barroselas, Viana do Castelo", landmark: "Em frente à Prio" });
  });

  it("takes no orders online: the site only shows the articles", async () => {
    const res = await req("POST", "/loja/pedidos", { ...buyer, items: [{ productId: "art-caneca", quantity: 1 }], amountCents: 900 });
    expect(res.statusCode).toBe(404);
  });

  it("takes offers of articles to sell", async () => {
    const res = await req("POST", "/loja/doacoes", { what: "Três camisolas de lã, como novas", category: "roupa", condition: "como-novo", handover: "recolha", name: "Rosa", phone: "915000000", town: "Areosa", consent: true });
    expect(res.statusCode).toBe(201);
    const list = (await req("GET", "/loja/gestao/doacoes", undefined, true)).json();
    expect(list[0]).toMatchObject({ name: "Rosa", status: "nova", handover: "recolha" });
    const accepted = await req("PATCH", `/loja/gestao/doacoes/${list[0].id}`, { status: "aceite" }, true);
    expect(accepted.json().status).toBe("aceite");
  });

  it("hides articles the team took off sale", async () => {
    await req("PATCH", "/loja/gestao/artigos/art-livro", { active: false }, true);
    expect((await req("GET", "/loja/artigos/livro-gatos-de-viana")).statusCode).toBe(404);
    expect((await req("GET", "/loja/artigos")).json().some((p: { id: string }) => p.id === "art-livro")).toBe(false);
  });
});

describe("back office", () => {
  it("requires the admin token", async () => {
    expect((await req("GET", "/loja/gestao/pedidos")).statusCode).toBe(401);
    expect((await req("POST", "/loja/gestao/artigos", {})).statusCode).toBe(401);
  });

  it("adds an article and refuses a cost above the price", async () => {
    const article = { slug: "iman-gato", name: "Íman de frigorífico", category: "casa", minDonationCents: 300, costCents: 50, photos: [{ url: "/loja/caneca.svg", alt: "Íman com um gato" }], stock: 20 };
    const res = await req("POST", "/loja/gestao/artigos", article, true);
    expect(res.statusCode).toBe(201);
    expect(res.json()).toMatchObject({ active: true, donated: false, variants: [] });
    expect((await req("POST", "/loja/gestao/artigos", article, true)).statusCode).toBe(409);
    const bad = await req("POST", "/loja/gestao/artigos", { ...article, slug: "outro", costCents: 400 }, true);
    expect(bad.statusCode).toBe(400);
  });

  it("marks an order paid, then cancels another and puts its articles back", async () => {
    const paid = await req("PATCH", "/loja/gestao/pedidos/enc-1", { status: "pago", teamNote: "MB WAY recebido" }, true);
    expect(paid.json()).toMatchObject({ status: "pago", paidAt: "2026-11-01T09:00:00.000Z", teamNote: "MB WAY recebido" });

    const before = (await req("GET", "/loja/artigos/caneca-gato-a-piscar-o-olho")).json().stock;
    const order = (await req("POST", "/loja/gestao/pedidos", { items: [{ productId: "art-caneca", quantity: 3 }], amountCents: 2700 }, true)).json();
    await req("PATCH", `/loja/gestao/pedidos/${order.id}`, { status: "cancelado" }, true);
    expect((await req("GET", "/loja/artigos/caneca-gato-a-piscar-o-olho")).json().stock).toBe(before);
    const revive = await req("PATCH", `/loja/gestao/pedidos/${order.id}`, { status: "pago" }, true);
    expect(revive.statusCode).toBe(409);
  });

  it("records a donation at a stand, which counts in the year's total", async () => {
    const before = (await req("GET", "/loja/resumo")).json().transparency.donationsCents;
    const res = await req("POST", "/loja/gestao/pedidos", { items: [{ productId: "art-calendario", quantity: 2 }] }, true);
    expect(res.json()).toMatchObject({ status: "entregue", inPerson: true, totalCents: 2000 });
    expect((await req("GET", "/loja/resumo")).json().transparency.donationsCents).toBe(before + 2000);
    const more = await req("POST", "/loja/gestao/pedidos", { items: [{ productId: "art-calendario", quantity: 1 }], amountCents: 2500 }, true);
    expect(more.json()).toMatchObject({ totalCents: 2500 });
    const below = await req("POST", "/loja/gestao/pedidos", { items: [{ productId: "art-caneca", quantity: 2 }], amountCents: 1000 }, true);
    expect(below.statusCode).toBe(409);
    expect(below.json().message).toMatch(/donativo mínimo é 18\s€/);
    const tooMany = await req("POST", "/loja/gestao/pedidos", { items: [{ productId: "art-saco", quantity: 5 }] }, true);
    expect(tooMany.json().message).toBe("Só há 2 de Saco de pano «Adote, não compre». Diminua a quantidade, por favor.");
  });

  it("adds and removes what the money paid for", async () => {
    const added = await req("POST", "/loja/gestao/gastos", { date: "2026-10-30", description: "Areia para o contentor Paquito", amountCents: 2400 }, true);
    expect(added.statusCode).toBe(201);
    expect((await req("GET", "/loja/resumo")).json().transparency.spending[0].description).toBe("Areia para o contentor Paquito");
    await req("DELETE", `/loja/gestao/gastos/${added.json().id}`, undefined, true);
    expect((await req("GET", "/loja/resumo")).json().transparency.spentCents).toBe(6800);
  });

  it("saves where the shop is and when it opens, and forgets them when cleared", async () => {
    const res = await req("PUT", "/loja/gestao/definicoes", { address: " Rua da Bandeira 10, Viana do Castelo ", hours: "Sábados, 10h às 13h" }, true);
    expect(res.json()).toEqual({ address: "Rua da Bandeira 10, Viana do Castelo", hours: "Sábados, 10h às 13h" });
    expect((await req("GET", "/loja/resumo")).json().settings.hours).toBe("Sábados, 10h às 13h");
    await req("PUT", "/loja/gestao/definicoes", { address: "", hours: "" }, true);
    expect((await req("GET", "/loja/resumo")).json().settings).toEqual({});
  });
});
