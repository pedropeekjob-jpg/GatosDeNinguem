import { adoptionInterestSchema, fosterApplicationSchema, itemDonationSchema, newsletterSignupSchema, partnerApplicationSchema, sponsorshipRequestSchema } from "@gn/domain";

/**
 * Same-origin endpoint for the public forms. Validates with the shared schemas,
 * then forwards to the API. Without API_URL (demo mode) it only validates.
 */
const forms = {
  adocao: { schema: adoptionInterestSchema, path: "/adoptions/interest" },
  parceiro: { schema: partnerApplicationSchema, path: "/partners/applications" },
  newsletter: { schema: newsletterSignupSchema, path: "/newsletter" },
  apadrinhar: { schema: sponsorshipRequestSchema, path: "/escalas/padrinhos/pedido" },
  "familia-temporaria": { schema: fosterApplicationSchema, path: "/escalas/familias-temporarias/candidatura" },
  "doacao-loja": { schema: itemDonationSchema, path: "/loja/doacoes" },
} as const;

export async function POST(request: Request, { params }: { params: Promise<{ kind: string }> }) {
  const form = forms[(await params).kind as keyof typeof forms];
  if (!form) return Response.json({ message: "Formulário desconhecido." }, { status: 404 });

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (body?.website_url) return Response.json({ ok: true }, { status: 201 });
  const parsed = form.schema.safeParse(body ?? {});
  if (!parsed.success) {
    return Response.json(
      { message: "Alguns campos não estão corretos.", issues: parsed.error.issues.map((i) => ({ path: i.path, message: i.message })) },
      { status: 400 },
    );
  }
  const api = process.env.API_URL;
  if (!api) return Response.json({ ok: true, demo: true }, { status: 201 });
  const res = await fetch(`${api}${form.path}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(parsed.data) });
  if (!res.ok) return Response.json({ message: "Não foi possível enviar agora. Tente daqui a pouco." }, { status: 502 });
  // Sponsoring with automatic debit: the next step is the provider's secure page.
  const answer = (await res.json().catch(() => ({}))) as { checkoutUrl?: unknown };
  const checkoutUrl = typeof answer.checkoutUrl === "string" && answer.checkoutUrl.startsWith("https://") ? answer.checkoutUrl : undefined;
  return Response.json({ ok: true, ...(checkoutUrl ? { checkoutUrl } : {}) }, { status: 201 });
}
