import type { PromotionChannel } from "@gn/domain";
import type { PromotionMessage, PromotionPublisher } from "../common/options";

type Fetch = typeof fetch;

export type MetaConfig = {
  /** The association's Facebook Page. */
  pageId?: string;
  /** Instagram professional account linked to that Page. */
  igUserId?: string;
  /** Long-lived Page access token with pages_manage_posts, pages_read_engagement, instagram_basic and instagram_content_publish. */
  pageToken: string;
  graphVersion?: string;
  fetch?: Fetch;
  /** Waits between checks on an Instagram upload (tests pass 0). */
  pollMs?: number;
};

/**
 * Facebook Page and Instagram publishing through the Meta Graph API.
 * Only the channels whose account ids are set are returned.
 */
export function metaPublishers(cfg: MetaConfig): Partial<Record<PromotionChannel, PromotionPublisher>> {
  const f = cfg.fetch ?? fetch;
  const base = `https://graph.facebook.com/${cfg.graphVersion ?? "v23.0"}`;
  const pollMs = cfg.pollMs ?? 3000;

  async function graph<T>(method: "GET" | "POST", path: string, params: Record<string, string>): Promise<T> {
    const body = new URLSearchParams({ ...params, access_token: cfg.pageToken });
    const res = method === "GET" ? await f(`${base}/${path}?${body}`) : await f(`${base}/${path}`, { method, body });
    const data = (await res.json().catch(() => ({}))) as T & { error?: { message?: string } };
    if (!res.ok || data.error) throw new Error(`Meta: ${data.error?.message ?? `erro ${res.status}`}`);
    return data;
  }

  const needsPhoto = (m: PromotionMessage) => {
    if (!m.imageUrl) throw new Error("Precisa de uma fotografia.");
    return m.imageUrl;
  };

  /** Instagram fetches the photo itself; publish once it says the upload is ready. */
  async function instagram(params: Record<string, string>) {
    const { id } = await graph<{ id: string }>("POST", `${cfg.igUserId}/media`, params);
    for (let i = 0; i < 10; i++) {
      const { status_code } = await graph<{ status_code?: string }>("GET", id, { fields: "status_code" });
      if (status_code === "FINISHED" || status_code === undefined) break;
      if (status_code === "ERROR" || status_code === "EXPIRED") throw new Error("Meta: a Instagram não conseguiu usar a fotografia.");
      await new Promise((r) => setTimeout(r, pollMs));
    }
    const published = await graph<{ id: string }>("POST", `${cfg.igUserId}/media_publish`, { creation_id: id });
    return { externalId: published.id };
  }

  const out: Partial<Record<PromotionChannel, PromotionPublisher>> = {};
  if (cfg.pageId) {
    out["facebook-post"] = async (m) => {
      if (m.imageUrl) {
        const r = await graph<{ id: string; post_id?: string }>("POST", `${cfg.pageId}/photos`, { url: m.imageUrl, caption: m.text });
        return { externalId: r.post_id ?? r.id };
      }
      const r = await graph<{ id: string }>("POST", `${cfg.pageId}/feed`, { message: m.text, link: m.link });
      return { externalId: r.id };
    };
    out["facebook-story"] = async (m) => {
      const photo = await graph<{ id: string }>("POST", `${cfg.pageId}/photos`, { url: needsPhoto(m), published: "false" });
      const r = await graph<{ post_id?: string }>("POST", `${cfg.pageId}/photo_stories`, { photo_id: photo.id });
      return { externalId: r.post_id };
    };
  }
  if (cfg.igUserId) {
    out["instagram-post"] = (m) => instagram({ image_url: needsPhoto(m), caption: m.text });
    out["instagram-story"] = (m) => instagram({ image_url: needsPhoto(m), media_type: "STORIES" });
  }
  return out;
}

export type EmailConfig = { apiKey: string; from: string; fetch?: Fetch };

/** Newsletter email through Resend's batch endpoint (100 per call), one message per person so each has their own unsubscribe link. */
export function resendNewsletterPublisher(cfg: EmailConfig): PromotionPublisher {
  const f = cfg.fetch ?? fetch;
  return async (m) => {
    if (m.recipients.length === 0) return { detail: "Ainda não há subscritores para eventos." };
    for (let i = 0; i < m.recipients.length; i += 100) {
      const batch = m.recipients.slice(i, i + 100).map((r) => ({
        from: cfg.from,
        to: [r.email],
        subject: m.emailSubject,
        text: `${m.emailBody}\n\n—\nRecebe este email porque subscreveu as novidades da Gatos de Ninguém.\nDeixar de receber: ${r.unsubscribeUrl}`,
        headers: { "List-Unsubscribe": `<${r.unsubscribeUrl}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
      }));
      const res = await f("https://api.resend.com/emails/batch", {
        method: "POST",
        headers: { authorization: `Bearer ${cfg.apiKey}`, "content-type": "application/json" },
        body: JSON.stringify(batch),
      });
      if (!res.ok) throw new Error(`Email: erro ${res.status} ao enviar${i > 0 ? ` (já tinham saído ${i})` : ""}. ${(await res.text().catch(() => "")).slice(0, 200)}`);
    }
    const n = m.recipients.length;
    return { detail: `Enviado a ${n} subscritor${n === 1 ? "" : "es"}.` };
  };
}
