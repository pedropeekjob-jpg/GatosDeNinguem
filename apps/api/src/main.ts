import { createApp } from "./app";
import { InMemoryContentRepository } from "./content/in-memory.repository";
import type { ContentRepository } from "./content/repository";
import type { PhotoStore } from "./media/photo-store";
import { InMemoryPatinhasRepository, type PatinhasRepository } from "./patinhas/repository";
import { stripeSepaDebit } from "./padrinhos/debit";
import { metaPublishers, resendNewsletterPublisher } from "./promocao/publishers";
import { PromotionService } from "./promocao/promotion.service";
import { formatFeatures, lisbonNow, lisbonToUtc, parseFeatures, type Account, type CareAlert, type Contact } from "@gn/domain";

async function repositories(): Promise<{ repository: ContentRepository; patinhas: PatinhasRepository; photoStore?: PhotoStore }> {
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

/** News about a godparent's cat, by email through Resend (the same key as sign-in codes). */
async function sendSponsorEmail(to: { email: string; name: string }, message: { subject: string; text: string }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn(`[padrinhos] ${message.subject} (to ${to.email}, no email provider configured)`);
    return;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({ from: process.env.SPONSOR_EMAIL_FROM ?? process.env.LOGIN_EMAIL_FROM ?? "Gatos de Ninguém <padrinhos@gatosdeninguem.pt>", to: [to.email], subject: message.subject, text: message.text }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${(await res.text().catch(() => "")).slice(0, 200)}`);
}

/** Monthly automatic debit for godparents: SEPA Direct Debit through Stripe once both keys are set (see docs/debito-direto.md). */
function sponsorDebit() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secretKey || !webhookSecret) return undefined;
  return stripeSepaDebit({ secretKey, webhookSecret });
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

/**
 * Event promotion channels. Facebook and Instagram need a long-lived Page token from a Meta app
 * (see docs/promocao-eventos.md); the newsletter email uses the same Resend key as sign-in codes.
 */
function promotionPublishers() {
  const token = process.env.META_PAGE_TOKEN;
  const meta = token ? metaPublishers({ pageId: process.env.META_PAGE_ID, igUserId: process.env.META_IG_USER_ID, pageToken: token, graphVersion: process.env.META_GRAPH_VERSION }) : {};
  const key = process.env.RESEND_API_KEY;
  const from = process.env.NEWSLETTER_EMAIL_FROM ?? process.env.LOGIN_EMAIL_FROM ?? "Gatos de Ninguém <novidades@gatosdeninguem.pt>";
  return { ...meta, ...(key ? { email: resendNewsletterPublisher({ apiKey: key, from }) } : {}) };
}

const adminToken = process.env.ADMIN_TOKEN;
if (!adminToken || adminToken.length < 16) throw new Error("Set ADMIN_TOKEN (16+ characters) before starting the API.");

// Optional parts, all off unless named, e.g. FEATURES=patinhas,trocas,amigo (see docs/funcionalidades.md).
const features = parseFeatures(process.env.FEATURES);
console.log(`Features switched on: ${formatFeatures(features) || "none"}`);

const options = {
  ...(await repositories()),
  features,
  sendLoginCode,
  // Demo without a database: the code is shown on screen so anyone can try signing in.
  exposeLoginCodes: !process.env.DATABASE_URL,
  adminToken,
  onContentChanged: revalidateSite,
  notifyVolunteers,
  sendSponsorEmail,
  sponsorDebit: sponsorDebit(),
  corsOrigins: process.env.CORS_ORIGINS?.split(",").map((s) => s.trim()),
  uploadDir: process.env.UPLOAD_DIR,
  // Render sets RENDER_EXTERNAL_URL to the service's public https address.
  publicUrl: process.env.PUBLIC_API_URL ?? process.env.RENDER_EXTERNAL_URL,
  siteUrl: process.env.PUBLIC_SITE_URL,
  promotionPublishers: promotionPublishers(),
  unsubscribeSecret: process.env.UNSUBSCRIBE_SECRET,
};
const app = await createApp(options);
// Approved promotions go out when their day comes. On hosts that sleep, an external cron also calls POST /promocoes/correr.
const promotions = app.get(PromotionService);
await promotions.draftMissing().catch((err) => console.error("Could not draft event promotions", err));
const runPromotions = () => promotions.runDue().catch((err) => console.error("Could not publish event promotions", err));
setInterval(runPromotions, 10 * 60_000).unref();
setTimeout(runPromotions, 30_000).unref();
await app.listen({ port: Number(process.env.PORT ?? 4000), host: "0.0.0.0" });
