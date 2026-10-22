import { cookies } from "next/headers";

/**
 * Same-origin bridge to the API's /conta endpoints. The session token never reaches
 * the browser's JavaScript: it lives in an httpOnly cookie and is passed on as a Bearer token.
 */
const COOKIE = "gn-sessao";
const MAX_AGE = 180 * 24 * 60 * 60;
const allowed = new Set([
  "codigo", "entrar", "sair", "eu", "eu/questionario", "eu/trocas",
  "eu/cuidados", "eu/cuidados/resumo", "eu/cuidados/tomas", "eu/cuidados/nao-consigo", "eu/cuidados/notas", "eu/cuidados/vistas", "eu/cuidados/preferencias",
]);
const allowedPattern = /^eu\/cuidados\/tarefas\/[A-Za-z0-9-]{1,64}\/(aceitar|devolver)$/;

async function forward(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const path = (await params).path.join("/");
  const api = process.env.API_URL;
  if (!api || !(allowed.has(path) || allowedPattern.test(path))) return Response.json({ message: "Não encontrado." }, { status: 404 });

  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  const body = request.method === "GET" || request.method === "DELETE" ? undefined : await request.text();
  let res: Response;
  try {
    res = await fetch(`${api}/conta/${path}`, {
      method: request.method,
      headers: { ...(body ? { "content-type": "application/json" } : {}), ...(token ? { authorization: `Bearer ${token}` } : {}) },
      body: body || undefined,
      cache: "no-store",
    });
  } catch {
    return Response.json({ message: "Não foi possível falar com o servidor. Tente daqui a pouco." }, { status: 502 });
  }

  const forget = () => jar.set(COOKIE, "", { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 0 });
  if (res.status === 204) {
    if (path === "sair" || (path === "eu" && request.method === "DELETE")) forget();
    return new Response(null, { status: 204 });
  }
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (res.status === 401 && token) forget();
  if (path === "entrar" && res.ok && typeof data.token === "string") {
    jar.set(COOKIE, data.token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: MAX_AGE });
    const { token: _secret, ...rest } = data;
    return Response.json(rest, { status: res.status });
  }
  return Response.json(data, { status: res.status });
}

export { forward as GET, forward as POST, forward as PUT, forward as PATCH, forward as DELETE };
