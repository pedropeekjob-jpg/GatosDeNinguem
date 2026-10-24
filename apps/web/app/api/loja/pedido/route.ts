import { orderCode, orderErrorMessage, orderRequestSchema, placeOrder, seedProducts } from "@gn/domain";

/**
 * Same-origin endpoint for shop orders. Validates, then forwards to the API, which reserves the stock
 * and answers with the order code. Without API_URL (demo mode) it prices the cart from the demo
 * articles and saves nothing.
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (body?.website_url) return Response.json({ code: "L-0000", totalCents: 0 }, { status: 201 });
  const parsed = orderRequestSchema.safeParse(body ?? {});
  if (!parsed.success) {
    return Response.json(
      { message: "Alguns campos não estão corretos.", issues: parsed.error.issues.map((i) => ({ path: i.path, message: i.message })) },
      { status: 400 },
    );
  }
  const api = process.env.API_URL;
  if (!api) {
    const result = placeOrder(seedProducts, parsed.data, { id: "demo", code: orderCode(), now: new Date() });
    if (!result.ok) return Response.json({ message: orderErrorMessage(result) }, { status: 409 });
    return Response.json({ code: result.order.code, totalCents: result.order.totalCents, demo: true }, { status: 201 });
  }
  const res = await fetch(`${api}/loja/pedidos`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(parsed.data) });
  const data = (await res.json().catch(() => ({}))) as { code?: string; totalCents?: number; message?: string };
  // 409: an article ran out while the person was choosing. The API's message says which.
  if (res.status === 409) return Response.json({ message: data.message }, { status: 409 });
  if (!res.ok || !data.code) return Response.json({ message: "Não foi possível enviar agora. Tente daqui a pouco." }, { status: 502 });
  return Response.json({ code: data.code, totalCents: data.totalCents }, { status: 201 });
}
