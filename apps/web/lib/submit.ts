"use client";
import { adoptionInterestSchema, newsletterSignupSchema, partnerApplicationSchema, sponsorshipRequestSchema, volunteerSignupInputSchema } from "@gn/domain";

export type SubmitResult = { ok: true } | { ok: false; message: string; fieldErrors: Record<string, string> };

/** The GitHub Pages demo has no server: forms are checked in the browser and nothing is sent. */
const STATIC_DEMO = process.env.NEXT_PUBLIC_STATIC_DEMO === "1";

const formSchemas = { adocao: adoptionInterestSchema, parceiro: partnerApplicationSchema, newsletter: newsletterSignupSchema, apadrinhar: sponsorshipRequestSchema } as const;

/** Posts a form to our own /api/forms route and turns validation errors into per-field messages. */
export function submitForm(kind: keyof typeof formSchemas, data: unknown): Promise<SubmitResult> {
  return postJson(`/api/forms/${kind}`, data, formSchemas[kind]);
}

export function signUpForShift(shiftId: string, data: unknown): Promise<SubmitResult> {
  return postJson(`/api/turnos/${encodeURIComponent(shiftId)}`, data, volunteerSignupInputSchema);
}

type Issue = { path: (string | number)[]; message: string };
type Schema = { safeParse(data: unknown): { success: true } | { success: false; error: { issues: Issue[] } } };

const toResult = (message: string, issues: Issue[] = []): SubmitResult => {
  const fieldErrors: Record<string, string> = {};
  for (const issue of issues) fieldErrors[String(issue.path[0])] ??= issue.message;
  return { ok: false, message, fieldErrors };
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
