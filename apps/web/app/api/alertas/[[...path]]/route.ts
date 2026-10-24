import { catAlertPushSignupSchema, catAlertSignupSchema, pushSubscriptionSchema } from "@gn/domain";

/**
 * Same-origin bridge to the API's "Avisem-me quando chegarem gatos" endpoints.
 * Without API_URL (demo) sign-ups are only checked, and notifications are not offered.
 */
const routes: Record<string, { method: "GET" | "POST"; schema?: { safeParse(d: unknown): { success: true; data: unknown } | { success: false; error: { issues: { path: (string | number)[]; message: string }[] } } } }> = {
  "": { method: "POST", schema: catAlertSignupSchema },
  config: { method: "GET" },
  push: { method: "POST", schema: catAlertPushSignupSchema },
  "push/sair": { method: "POST", schema: pushSubscriptionSchema.pick({ endpoint: true }) },
};

async function forward(request: Request, { params }: { params: Promise<{ path?: string[] }> }) {
  const path = ((await params).path ?? []).join("/");
  const route = routes[path];
  if (!route || route.method !== request.method) return Response.json({ message: "Não encontrado." }, { status: 404 });
  const api = process.env.API_URL;

  if (request.method === "GET") {
    if (!api) return Response.json({ push: false });
    try {
      const res = await fetch(`${api}/alertas/${path}`, { next: { revalidate: 300 } });
      return Response.json(res.ok ? await res.json() : { push: false });
    } catch {
      return Response.json({ push: false });
    }
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (body?.website_url) return Response.json({ ok: true }, { status: 201 });
  const parsed = route.schema!.safeParse(body ?? {});
  if (!parsed.success) {
    return Response.json({ message: "Alguns campos não estão corretos.", issues: parsed.error.issues.map((i) => ({ path: i.path, message: i.message })) }, { status: 400 });
  }
  if (!api) return Response.json({ ok: true, demo: true }, { status: 201 });
  try {
    const res = await fetch(`${api}/alertas${path ? `/${path}` : ""}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(parsed.data) });
    if (!res.ok) return Response.json({ message: "Não foi possível enviar agora. Tente daqui a pouco." }, { status: 502 });
    return Response.json(await res.json().catch(() => ({ ok: true })), { status: res.status });
  } catch {
    return Response.json({ message: "Não foi possível enviar agora. Tente daqui a pouco." }, { status: 502 });
  }
}

export { forward as GET, forward as POST };
