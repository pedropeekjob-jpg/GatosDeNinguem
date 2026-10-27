"use client";
import { adoptionInterestSchema, contactMessageSchema, fosterApplicationSchema, itemDonationSchema, newsletterSignupSchema, partnerApplicationSchema, sponsorshipRequestSchema, volunteerSignupInputSchema } from "@gn/domain";
import { documentLang } from "@/lib/i18n/client";
import { translateError } from "@/lib/i18n/labels";

export type SubmitResult = { ok: true } | { ok: false; message: string; fieldErrors: Record<string, string> };

/** The GitHub Pages demo has no server: forms are checked in the browser and nothing is sent. */
const STATIC_DEMO = process.env.NEXT_PUBLIC_STATIC_DEMO === "1";

const formSchemas = { adocao: adoptionInterestSchema, parceiro: partnerApplicationSchema, newsletter: newsletterSignupSchema, apadrinhar: sponsorshipRequestSchema, "familia-temporaria": fosterApplicationSchema, "doacao-loja": itemDonationSchema, contacto: contactMessageSchema } as const;

/** Posts a form to our own /api/forms route and turns validation errors into per-field messages. */
export function submitForm(kind: keyof typeof formSchemas, data: unknown): Promise<SubmitResult> {
  return postJson(`/api/forms/${kind}`, data, formSchemas[kind]);
}

export function signUpForShift(shiftId: string, data: unknown): Promise<SubmitResult> {
  return postJson(`/api/turnos/${encodeURIComponent(shiftId)}`, data, volunteerSignupInputSchema);
}

/**
 * "Quero apadrinhar". With automatic debit on, the answer carries the address of the bank details page to go to next.
 * The static demo only checks the form.
 */
export async function requestSponsorship(data: unknown): Promise<SubmitResult & { checkoutUrl?: string }> {
  if (STATIC_DEMO) return postJson("/api/forms/apadrinhar", data, sponsorshipRequestSchema);
  try {
    const res = await fetch("/api/forms/apadrinhar", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(data) });
    const body = (await res.json().catch(() => ({}))) as { checkoutUrl?: string; message?: string; issues?: Issue[] };
    if (res.ok) return { ok: true, checkoutUrl: body.checkoutUrl };
    return toResult(body.message ?? "Não foi possível enviar. Tente outra vez.", body.issues);
  } catch {
    return toResult("Sem ligação à internet. Verifique a ligação e tente outra vez.");
  }
}

type Issue = { path: (string | number)[]; message: string };
type Schema = { safeParse(data: unknown): { success: true } | { success: false; error: { issues: Issue[] } } };

/** The messages come from the shared rules in Portuguese; on the other languages' pages they are shown in that language. */
const toResult = (message: string, issues: Issue[] = []): SubmitResult => {
  const lang = documentLang();
  const fieldErrors: Record<string, string> = {};
  for (const issue of issues) fieldErrors[String(issue.path[0])] ??= translateError(lang, issue.message);
  return { ok: false, message: translateError(lang, message), fieldErrors };
};

async function postJson(url: string, data: unknown, schema: Schema): Promise<SubmitResult> {
  if (STATIC_DEMO) {
    const parsed = schema.safeParse(data);
    return parsed.success ? { ok: true } : toResult("Alguns campos não estão corretos.", parsed.error.issues);
  }
  try {
    const res = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(data) });
    if (res.ok) return { ok: true };
    const body = (await res.json().catch(() => ({}))) as { message?: string; issues?: Issue[] };
    return toResult(body.message ?? "Não foi possível enviar. Tente outra vez.", body.issues);
  } catch {
    return toResult("Sem ligação à internet. Verifique a ligação e tente outra vez.");
  }
}
