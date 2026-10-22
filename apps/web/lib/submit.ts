"use client";

export type SubmitResult = { ok: true } | { ok: false; message: string; fieldErrors: Record<string, string> };

/** Posts a form to our own /api/forms route and turns validation errors into per-field messages. */
export function submitForm(kind: "adocao" | "parceiro" | "newsletter", data: unknown): Promise<SubmitResult> {
  return postJson(`/api/forms/${kind}`, data);
}

export async function postJson(url: string, data: unknown): Promise<SubmitResult> {
  try {
    const res = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(data) });
    if (res.ok) return { ok: true };
    const body = (await res.json().catch(() => ({}))) as { message?: string; issues?: { path: (string | number)[]; message: string }[] };
    const fieldErrors: Record<string, string> = {};
    for (const issue of body.issues ?? []) fieldErrors[String(issue.path[0])] ??= issue.message;
    return { ok: false, message: body.message ?? "Não foi possível enviar. Tente outra vez.", fieldErrors };
  } catch {
    return { ok: false, message: "Sem ligação à internet. Verifique a ligação e tente outra vez.", fieldErrors: {} };
  }
}
