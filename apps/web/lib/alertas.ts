"use client";
import { catAlertSignupSchema, type CatAlertFilters } from "@gn/domain";

/** "Avisem-me quando chegarem gatos": sign-up by email or by notifications on this device. */

const STATIC_DEMO = process.env.NEXT_PUBLIC_STATIC_DEMO === "1";
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const SEEN_KEY = "gn-gatos-vistos";

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

/** Cats this visitor has already seen in the "new cat" pop-up or on their own page. Kept on this device only. */
export function seenCats(): string[] {
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function markCatSeen(slug: string) {
  const seen = seenCats();
  if (seen.includes(slug)) return;
  try { localStorage.setItem(SEEN_KEY, JSON.stringify([...seen, slug].slice(-200))); } catch { /* private mode */ }
}
