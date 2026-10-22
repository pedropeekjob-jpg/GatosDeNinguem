import { createApp } from "./app";
import { InMemoryContentRepository } from "./content/in-memory.repository";
import type { ContentRepository } from "./content/repository";
import type { PhotoStore } from "./media/photo-store";
import { InMemoryPatinhasRepository, type PatinhasRepository } from "./patinhas/repository";
import type { Contact } from "@gn/domain";

async function repositories(): Promise<{ repository: ContentRepository; patinhas: PatinhasRepository; photoStore?: PhotoStore }> {
  if (!process.env.DATABASE_URL) {
    console.warn("DATABASE_URL not set: using in-memory demo content (changes are lost on restart).");
    return { repository: new InMemoryContentRepository(), patinhas: new InMemoryPatinhasRepository() };
  }
  const { PrismaClient } = await import("@prisma/client");
  const { PrismaContentRepository } = await import("./content/prisma.repository");
  const { PrismaPatinhasRepository } = await import("./patinhas/prisma.repository");
  const db = new PrismaClient();
  // UPLOAD_STORAGE=database keeps photos in Postgres, for hosts whose disk is wiped on every deploy.
  const photoStore = process.env.UPLOAD_STORAGE === "database" ? (await import("./media/photo-store")).databasePhotoStore(db) : undefined;
  return { repository: new PrismaContentRepository(db), patinhas: new PrismaPatinhasRepository(db), photoStore };
}

/** Sign-in codes go by email through Resend when RESEND_API_KEY is set; otherwise they are only written to the log. */
async function sendLoginCode(to: Contact, code: string) {
  const text = `O seu código para entrar no site da Gatos de Ninguém é ${code}. É válido durante 15 minutos.`;
  if (to.kind === "email" && process.env.RESEND_API_KEY) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${process.env.RESEND_API_KEY}`, "content-type": "application/json" },
      body: JSON.stringify({ from: process.env.LOGIN_EMAIL_FROM ?? "Gatos de Ninguém <nao-responder@gatosdeninguem.pt>", to: [to.value], subject: `O seu código: ${code}`, text }),
    });
    if (!res.ok) console.error("Could not send the sign-in email", res.status, await res.text().catch(() => ""));
    return;
  }
  console.warn(`[sign-in code] ${to.kind} ${to.value}: ${code} (no ${to.kind === "email" ? "email" : "SMS"} provider configured)`);
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
  ...(await repositories()),
  sendLoginCode,
  // Demo without a database: the code is shown on screen so anyone can try signing in.
  exposeLoginCodes: !process.env.DATABASE_URL,
  adminToken,
  onContentChanged: revalidateSite,
  corsOrigins: process.env.CORS_ORIGINS?.split(",").map((s) => s.trim()),
  uploadDir: process.env.UPLOAD_DIR,
  // Render sets RENDER_EXTERNAL_URL to the service's public https address.
  publicUrl: process.env.PUBLIC_API_URL ?? process.env.RENDER_EXTERNAL_URL,
});
await app.listen({ port: Number(process.env.PORT ?? 4000), host: "0.0.0.0" });
