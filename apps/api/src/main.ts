import { createApp } from "./app";
import { InMemoryContentRepository } from "./content/in-memory.repository";
import type { ContentRepository } from "./content/repository";
import { InMemoryPatinhasRepository, type PatinhasRepository } from "./patinhas/repository";
import { lisbonNow, lisbonToUtc, type Account, type CareAlert, type Contact } from "@gn/domain";

async function repositories(): Promise<{ repository: ContentRepository; patinhas: PatinhasRepository }> {
  if (!process.env.DATABASE_URL) {
    console.warn("DATABASE_URL not set: using in-memory demo content (changes are lost on restart).");
    const repository = new InMemoryContentRepository();
    // So the volunteer's "No gatil" page has something to show: Ana (912 000 001) and Rui are on today's shift,
    // João (913 000 002) on next week's.
    const today = lisbonNow(new Date()).date;
    const nextWeek = lisbonNow(new Date(Date.now() + 7 * 86_400_000)).date;
    await repository.saveShifts([{
      id: "demo-hoje", type: "limpeza", title: "Limpeza, comida e medicação", startsAt: lisbonToUtc(today, "08:30"), endsAt: lisbonToUtc(today, "10:30"),
      location: "Gatil, Santa Marta de Portuzelo", capacity: 4,
      signups: [
        { volunteerId: "vol-1", name: "Ana Ribeiro", phone: "912000001", signedUpAt: new Date().toISOString() },
        { volunteerId: "vol-2", name: "Rui Sousa", phone: "912000002", signedUpAt: new Date().toISOString() },
      ],
    }, {
      id: "demo-semana", type: "limpeza", title: "Limpeza, comida e medicação", startsAt: lisbonToUtc(nextWeek, "18:30"), endsAt: lisbonToUtc(nextWeek, "20:30"),
      location: "Gatil, Santa Marta de Portuzelo", capacity: 4,
      signups: [{ volunteerId: "vol-3", name: "João Costa", phone: "913000002", signedUpAt: new Date().toISOString() }],
    }]);
    return { repository, patinhas: new InMemoryPatinhasRepository() };
  }
  const { PrismaClient } = await import("@prisma/client");
  const { PrismaContentRepository } = await import("./content/prisma.repository");
  const { PrismaPatinhasRepository } = await import("./patinhas/prisma.repository");
  const db = new PrismaClient();
  return { repository: new PrismaContentRepository(db), patinhas: new PrismaPatinhasRepository(db) };
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

/**
 * Help requests and their resolution reach volunteers outside the site: by email through Resend when it is set up.
 * Volunteers without email (or without a provider) see them on their page and in the header count.
 */
async function notifyVolunteers(to: Account[], alert: CareAlert) {
  const key = process.env.RESEND_API_KEY;
  const withEmail = to.filter((a) => a.email);
  if (!key || withEmail.length === 0) {
    console.warn(`[gatil] ${alert.message} (to ${to.length} volunteer${to.length === 1 ? "" : "s"}, no email provider or email)`);
    return;
  }
  const site = process.env.PUBLIC_SITE_URL ?? "https://gatosdeninguem.pt";
  for (const person of withEmail) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
      body: JSON.stringify({
        from: process.env.LOGIN_EMAIL_FROM ?? "Gatos de Ninguém <nao-responder@gatosdeninguem.pt>",
        to: [person.email],
        subject: alert.important ? `Gatil: ${alert.catName} precisa de ajuda` : `Gatil: ${alert.catName}`,
        text: `${alert.message}\n\nVer e responder: ${site}/conta/gatil\n\nPode silenciar estas mensagens na mesma página.`,
      }),
    });
    if (!res.ok) console.error("Could not email a volunteer", res.status, await res.text().catch(() => ""));
  }
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
  notifyVolunteers,
  corsOrigins: process.env.CORS_ORIGINS?.split(",").map((s) => s.trim()),
  uploadDir: process.env.UPLOAD_DIR,
  publicUrl: process.env.PUBLIC_API_URL,
});
await app.listen({ port: Number(process.env.PORT ?? 4000), host: "0.0.0.0" });
