import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { NestFastifyApplication } from "@nestjs/platform-fastify";
import { createApp } from "../src/app";
import { InMemoryContentRepository } from "../src/content/in-memory.repository";

const TOKEN = "test-admin-token";
const auth = { authorization: `Bearer ${TOKEN}` };
// A 1x1 PNG.
const PNG = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
let app: NestFastifyApplication;
let dir: string;

beforeAll(async () => {
  dir = await mkdtemp(join(tmpdir(), "gn-uploads-"));
  app = await createApp({ repository: new InMemoryContentRepository(), adminToken: TOKEN, onContentChanged: async () => {}, logger: false, uploadDir: dir, publicUrl: "https://api.example.pt" });
  await app.init();
  await app.getHttpAdapter().getInstance().ready();
});
afterAll(async () => { await app.close(); await rm(dir, { recursive: true, force: true }); });

describe("photo uploads", () => {
  it("stores a photo and serves it back at the returned address", async () => {
    const res = await app.inject({ method: "POST", url: "/uploads", headers: auth, payload: { type: "image/png", data: PNG } });
    expect(res.statusCode).toBe(201);
    const { url } = res.json() as { url: string };
    expect(url).toMatch(/^https:\/\/api\.example\.pt\/uploads\/[0-9a-f-]{36}\.png$/);
    const file = await app.inject({ url: url.replace("https://api.example.pt", "") });
    expect(file.statusCode).toBe(200);
    expect(file.headers["content-type"]).toBe("image/png");
    expect(file.rawPayload.equals(Buffer.from(PNG, "base64"))).toBe(true);
  });

  it("needs the back office password", async () => {
    const res = await app.inject({ method: "POST", url: "/uploads", payload: { type: "image/png", data: PNG } });
    expect(res.statusCode).toBe(401);
  });

  it("refuses files that are not photos", async () => {
    const res = await app.inject({ method: "POST", url: "/uploads", headers: auth, payload: { type: "image/jpeg", data: Buffer.from("not a photo").toString("base64") } });
    expect(res.statusCode).toBe(400);
  });

  it("never serves files outside the uploads folder", async () => {
    expect((await app.inject({ url: "/uploads/..%2Fpackage.json" })).statusCode).toBe(404);
  });
});

describe.runIf(Boolean(process.env.DATABASE_URL))("photo uploads kept in the database", () => {
  let dbApp: NestFastifyApplication;
  let db: import("@prisma/client").PrismaClient;

  beforeAll(async () => {
    const { PrismaClient } = await import("@prisma/client");
    const { databasePhotoStore } = await import("../src/media/photo-store");
    db = new PrismaClient();
    dbApp = await createApp({ repository: new InMemoryContentRepository(), adminToken: TOKEN, onContentChanged: async () => {}, logger: false, photoStore: databasePhotoStore(db), publicUrl: "https://api.example.pt" });
    await dbApp.init();
    await dbApp.getHttpAdapter().getInstance().ready();
  });
  afterAll(async () => { await dbApp.close(); await db.$disconnect(); });

  it("survives without a disk: the photo is served from Postgres", async () => {
    const res = await dbApp.inject({ method: "POST", url: "/uploads", headers: auth, payload: { type: "image/png", data: PNG } });
    expect(res.statusCode).toBe(201);
    const path = (res.json() as { url: string }).url.replace("https://api.example.pt", "");
    expect(await db.upload.count({ where: { name: path.split("/").pop()! } })).toBe(1);
    const file = await dbApp.inject({ url: path });
    expect(file.statusCode).toBe(200);
    expect(file.headers["content-type"]).toBe("image/png");
    expect(file.rawPayload.equals(Buffer.from(PNG, "base64"))).toBe(true);
  });

  it("answers 404 for a photo that was never uploaded", async () => {
    expect((await dbApp.inject({ url: "/uploads/00000000-0000-0000-0000-000000000000.png" })).statusCode).toBe(404);
  });
});
