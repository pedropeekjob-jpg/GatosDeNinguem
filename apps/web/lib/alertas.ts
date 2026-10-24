"use client";
import { catAlertSignupSchema, type CatAlertFilters } from "@gn/domain";

/** "Avisem-me quando chegarem gatos": sign-up by email or by notifications on this device. */

const STATIC_DEMO = process.env.NEXT_PUBLIC_STATIC_DEMO === "1";
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const KEY = "gn-avisos-gatos";
/** After "Agora não", the window does not come back for this long. */
const QUIET_DAYS = 60;

type Issue = { path: (string | number)[]; message: string };
export type AlertResult = { ok: true; demoConfirmUrl?: string } | { ok: false; message: string; fieldErrors: Record<string, string> };

const fail = (message: string, issues: Issue[] = []): AlertResult => {
  const fieldErrors: Record<string, string> = {};
  for (const i of issues) fieldErrors[String(i.path[0])] ??= i.message;
  return { ok: false, message, fieldErrors };
};

async function post(path: string, data: unknown): Promise<AlertResult> {
  try {
    const res = await fetch(`/api/alertas${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(data) });
    const body = (await res.json().catch(() => ({}))) as { message?: string; issues?: Issue[]; demoConfirmUrl?: string };
    if (res.ok) return { ok: true, demoConfirmUrl: body.demoConfirmUrl };
    return fail(body.message ?? "Não foi possível enviar. Tente outra vez.", body.issues);
  } catch {
    return fail("Sem ligação à internet. Verifique a ligação e tente outra vez.");
  }
}

export function signUpForAlerts(data: { email: string; filters: CatAlertFilters; consent?: true }): Promise<AlertResult> {
  if (STATIC_DEMO) {
    const parsed = catAlertSignupSchema.safeParse(data);
    return Promise.resolve(parsed.success ? { ok: true } : fail("Alguns campos não estão corretos.", parsed.error.issues));
  }
  return post("", data);
}

/** Whether this browser can get notifications from us, and the key to subscribe with. */
export async function pushSetup(): Promise<{ publicKey: string } | null> {
  if (STATIC_DEMO || typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) return null;
  try {
    const res = await fetch("/api/alertas/config");
    const cfg = (await res.json()) as { push?: boolean; pushPublicKey?: string };
    return cfg.push && cfg.pushPublicKey ? { publicKey: cfg.pushPublicKey } : null;
  } catch {
    return null;
  }
}

function keyBytes(base64url: string) {
  const s = (base64url + "=".repeat((4 - (base64url.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
}

/** Asks the browser for permission (its own prompt), then registers this device. */
export async function subscribeThisDevice(publicKey: string, filters: CatAlertFilters): Promise<AlertResult> {
  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return fail("O navegador não deixou mostrar notificações. Pode mudar isso nas definições do site, ou receber os avisos por email.");
    const reg = await navigator.serviceWorker.register(`${BASE}/sw.js`);
    await navigator.serviceWorker.ready;
    const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(publicKey) }));
    return post("/push", { subscription: sub.toJSON(), filters, consent: true });
  } catch {
    return fail("Não foi possível ligar as notificações neste aparelho. Pode receber os avisos por email.");
  }
}

type Remembered = { estado: "fechado" | "inscrito"; em: string };

function read(): Remembered | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Remembered) : null;
  } catch {
    return null;
  }
}

/** Remembered on this device only, so the window is never shown twice in a row. */
export function rememberAlerts(estado: Remembered["estado"]) {
  if (estado === "fechado" && read()?.estado === "inscrito") return;
  try { localStorage.setItem(KEY, JSON.stringify({ estado, em: new Date().toISOString() })); } catch { /* private mode */ }
}

export function shouldOfferAlerts(now = new Date()): boolean {
  const r = read();
  if (!r) return true;
  if (r.estado === "inscrito") return false;
  return now.getTime() - new Date(r.em).getTime() > QUIET_DAYS * 86_400_000;
}
