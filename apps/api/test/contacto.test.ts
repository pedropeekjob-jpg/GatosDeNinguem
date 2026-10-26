import { afterEach, describe, expect, it, vi } from "vitest";
import type { NestFastifyApplication } from "@nestjs/platform-fastify";
import { createApp } from "../src/app";
import type { ApiOptions, OutgoingEmail } from "../src/common/options";
import { InMemoryContentRepository } from "../src/content/in-memory.repository";

let app: NestFastifyApplication | undefined;
afterEach(async () => { await app?.close(); app = undefined; });

async function start(extra: Partial<ApiOptions> = {}) {
  app = await createApp({ repository: new InMemoryContentRepository(), adminToken: "t", onContentChanged: async () => {}, logger: false, ...extra });
  await app.init();
  await app.getHttpAdapter().getInstance().ready();
  return (payload: unknown) => app!.inject({ method: "POST", url: "/contacto", payload: payload as object });
}

const valid = { name: "Ana Silva", email: "ana@example.pt", topic: "adocao", message: "Olá! Gostava de saber como visitar o gatil.", consent: true };

describe("contact form", () => {
  it("emails the association's main address, copies the backup and replies to the sender", async () => {
    const sent: OutgoingEmail[] = [];
    const post = await start({ sendEmail: async (emails) => { sent.push(...emails); } });
    expect((await post(valid)).statusCode).toBe(201);
    expect(sent).toHaveLength(1);
    expect(sent[0]).toMatchObject({ to: "gatosninguem@gmail.com", cc: ["gatosdeninguemvc@gmail.com"], replyTo: "ana@example.pt" });
    expect(sent[0]!.subject).toBe("[Contacto · Adoção] Ana Silva");
    expect(sent[0]!.text).toContain("Gostava de saber como visitar o gatil.");
  });

  it("uses the configured recipients", async () => {
    const sendEmail = vi.fn(async () => {});
    const post = await start({ sendEmail, contactRecipients: { to: "geral@gatosdeninguem.pt" } });
    await post({ ...valid, topic: "loja", orderCode: "L-123" });
    const [email] = (sendEmail.mock.calls[0] as unknown as [OutgoingEmail[]])[0];
    expect(email).toMatchObject({ to: "geral@gatosdeninguem.pt", cc: undefined });
    expect(email!.text).toContain("Pedido da loja: L-123");
  });

  it("rejects incomplete messages with per-field errors", async () => {
    const sendEmail = vi.fn(async () => {});
    const post = await start({ sendEmail });
    const res = await post({ name: "Ana", email: "não", topic: "geral", message: "oi" });
    expect(res.statusCode).toBe(400);
    const fields = (res.json().issues as { path: string[] }[]).map((i) => i.path[0]);
    expect(fields).toEqual(expect.arrayContaining(["email", "message", "consent"]));
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("drops spam bots without sending anything", async () => {
    const sendEmail = vi.fn(async () => {});
    const post = await start({ sendEmail });
    expect((await post({ ...valid, website_url: "http://spam" })).statusCode).toBe(201);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("tells the visitor to try later when the email service fails", async () => {
    const post = await start({ sendEmail: async () => { throw new Error("Resend 500"); } });
    const res = await post(valid);
    expect(res.statusCode).toBe(503);
    expect(res.json().message).toMatch(/Tente daqui a pouco/);
  });
});
