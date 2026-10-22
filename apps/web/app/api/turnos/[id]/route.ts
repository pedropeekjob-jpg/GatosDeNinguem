import { volunteerSignupInputSchema } from "@gn/domain";

/**
 * Same-origin endpoint for signing up to a shift. Validates with the shared schema,
 * then forwards to the API, passing on its plain-Portuguese message when the shift is full.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (body?.website_url) return Response.json({ ok: true }, { status: 201 });
  const parsed = volunteerSignupInputSchema.safeParse(body ?? {});
  if (!parsed.success) {
    return Response.json(
      { message: "Alguns campos não estão corretos.", issues: parsed.error.issues.map((i) => ({ path: i.path, message: i.message })) },
      { status: 400 },
    );
  }
  const api = process.env.API_URL;
  if (!api) return Response.json({ ok: true, demo: true }, { status: 201 });
  const res = await fetch(`${api}/escalas/turnos/${encodeURIComponent(id)}/inscricao`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(parsed.data),
  });
  if (res.ok) return Response.json({ ok: true }, { status: 201 });
  if (res.status === 404 || res.status === 409) {
    const { message } = (await res.json().catch(() => ({}))) as { message?: string };
    return Response.json({ message: message ?? "Este turno já não está disponível." }, { status: res.status });
  }
  return Response.json({ message: "Não foi possível enviar agora. Tente daqui a pouco." }, { status: 502 });
}
