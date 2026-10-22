import { createApp } from "./app";
import { InMemoryContentRepository } from "./content/in-memory.repository";
import type { ContentRepository } from "./content/repository";

async function repository(): Promise<ContentRepository> {
  if (!process.env.DATABASE_URL) {
    console.warn("DATABASE_URL not set: using in-memory demo content (changes are lost on restart).");
    return new InMemoryContentRepository();
  }
  const { PrismaClient } = await import("@prisma/client");
  const { PrismaContentRepository } = await import("./content/prisma.repository");
  return new PrismaContentRepository(new PrismaClient());
}

async function revalidateSite(what: { type: string; path?: string }) {
  const url = process.env.WEB_REVALIDATE_URL;
  if (!url) return;
  try {
    await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", "x-revalidate-secret": process.env.REVALIDATE_SECRET ?? "" },
      body: JSON.stringify(what),
    });
  } catch (err) {
    console.error("Could not refresh the public site", err);
  }
}

const adminToken = process.env.ADMIN_TOKEN;
if (!adminToken || adminToken.length < 16) throw new Error("Set ADMIN_TOKEN (16+ characters) before starting the API.");

const app = await createApp({
  repository: await repository(),
  adminToken,
  onContentChanged: revalidateSite,
  corsOrigins: process.env.CORS_ORIGINS?.split(",").map((s) => s.trim()),
});
await app.listen({ port: Number(process.env.PORT ?? 4000), host: "0.0.0.0" });
