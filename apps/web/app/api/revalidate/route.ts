import { revalidatePath, revalidateTag } from "next/cache";
import { CONTENT_TAG } from "@/lib/content";

/** Called by the API after the back office saves, so changes appear within seconds. */
export async function POST(request: Request) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret || request.headers.get("x-revalidate-secret") !== secret) {
    return Response.json({ message: "Não autorizado." }, { status: 401 });
  }
  const body = (await request.json().catch(() => ({}))) as { path?: string };
  revalidateTag(CONTENT_TAG);
  if (body.path) revalidatePath(body.path);
  revalidatePath("/sitemap.xml");
  return Response.json({ revalidated: true });
}
