import { buildRobotsTxt } from "@gn/seo";
import { getSeoSettings } from "@/lib/content";

export const revalidate = 3600;
export const dynamic = "force-static";

/** Indexing is off unless ALLOW_INDEXING=true, so preview deploys never reach Google. */
export async function GET() {
  const settings = await getSeoSettings();
  const body = buildRobotsTxt(settings, { allowIndexing: process.env.ALLOW_INDEXING === "true" });
  return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8" } });
}
