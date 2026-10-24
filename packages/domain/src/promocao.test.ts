import { describe, expect, it } from "vitest";
import type { Post } from "./content";
import { channelProblem, draftPromotion, editPromotion, eventSubscribers, eventWhen, isDue, pendingChannels, promotionTime, statusAfterRun, syncPromotion } from "./promocao";

const site = "https://gatosdeninguem.pt";
const now = new Date("2026-10-24T10:00:00.000Z");
const openDay: Post = {
  id: "p1",
  slug: "open-day",
  title: "Open Day no gatil",
  category: "evento",
  summary: "Visitas guiadas e banca solidária.",
  body: "…",
  publishedAt: "2026-10-20T09:00:00.000Z",
  event: { startsAt: "2026-11-15T10:00:00.000Z", endsAt: "2026-11-15T17:00:00.000Z", location: "Gatil" },
  seo: {},
  updatedAt: "2026-10-20T09:00:00.000Z",
};
const draft = () => draftPromotion(openDay, { siteUrl: site, now, id: "pr1" })!;

describe("event dates", () => {
  it("reads like a person wrote it, in Lisbon time", () => {
    expect(eventWhen(openDay.event!)).toBe("domingo, 15 de novembro, das 10h00 às 17h00");
    expect(eventWhen({ startsAt: "2026-07-04T17:30:00.000Z" })).toBe("sábado, 4 de julho, às 18h30");
  });

  it("schedules a week before, or now when the event is closer than that", () => {
    expect(promotionTime(openDay.event!, now)).toBe("2026-11-08T10:00:00.000Z");
    expect(promotionTime({ startsAt: "2026-10-27T10:00:00.000Z" }, now)).toBe(now.toISOString());
    expect(promotionTime({ startsAt: "2026-10-01T10:00:00.000Z" }, now)).toBeUndefined();
  });
});

describe("draftPromotion", () => {
  it("prepares posts, a story and the email, waiting for approval", () => {
    const p = draft();
    expect(p.status).toBe("rascunho");
    expect(p.channels).toEqual(["facebook-post", "instagram-post", "instagram-story", "email"]);
    expect(p.text).toContain("📍 Gatil");
    expect(p.text).toContain("https://gatosdeninguem.pt/noticias/open-day");
    expect(p.emailSubject).toBe("Daqui a uma semana: Open Day no gatil");
  });

  it("does nothing for news or past events", () => {
    expect(draftPromotion({ ...openDay, category: "noticia" }, { siteUrl: site, now, id: "x" })).toBeUndefined();
    expect(draftPromotion({ ...openDay, event: undefined }, { siteUrl: site, now, id: "x" })).toBeUndefined();
    expect(draftPromotion(openDay, { siteUrl: site, now: new Date("2026-12-01T00:00:00Z"), id: "x" })).toBeUndefined();
  });
});

describe("syncPromotion", () => {
  const later = new Date("2026-10-25T10:00:00.000Z");
  const moved: Post = { ...openDay, event: { ...openDay.event!, startsAt: "2026-11-22T10:00:00.000Z", endsAt: "2026-11-22T17:00:00.000Z" } };

  it("follows the event and asks again when an approved event moves", () => {
    const approved = { ...draft(), status: "aprovada" as const, approvedAt: now.toISOString() };
    const next = syncPromotion(approved, moved, { siteUrl: site, now: later });
    expect(next.status).toBe("rascunho");
    expect(next.scheduledFor).toBe("2026-11-15T10:00:00.000Z");
    expect(next.text).toContain("22 de novembro");
    expect(next.note).toMatch(/aprove de novo/);
  });

  it("keeps the manager's own words", () => {
    const mine = editPromotion(draft(), { text: "Venham todos!" }, now);
    expect(mine.edited).toBe(true);
    expect(syncPromotion(mine, moved, { siteUrl: site, now: later }).text).toBe("Venham todos!");
  });

  it("keeps an approval when nothing that matters changed", () => {
    const approved = { ...draft(), status: "aprovada" as const };
    expect(syncPromotion(approved, openDay, { siteUrl: site, now: later }).status).toBe("aprovada");
  });

  it("cancels when the post stops being an event, and leaves published ones alone", () => {
    expect(syncPromotion(draft(), { ...openDay, category: "noticia" }, { siteUrl: site, now }).status).toBe("cancelada");
    const published = { ...draft(), status: "publicada" as const };
    expect(syncPromotion(published, moved, { siteUrl: site, now })).toBe(published);
  });
});

describe("publishing", () => {
  it("is due only once approved, on the day, before the event", () => {
    const p = { ...draft(), status: "aprovada" as const };
    expect(isDue(p, now)).toBe(false);
    expect(isDue(p, new Date("2026-11-08T10:00:00.000Z"))).toBe(true);
    expect(isDue(p, new Date("2026-11-15T10:00:00.000Z"))).toBe(false);
    expect(isDue(draft(), new Date("2026-11-08T10:00:00.000Z"))).toBe(false);
  });

  it("retries only what failed", () => {
    const p = { ...draft(), results: { "facebook-post": { ok: true, at: now.toISOString() }, email: { ok: false, at: now.toISOString(), error: "x" } } };
    expect(pendingChannels(p)).toEqual(["instagram-post", "instagram-story", "email"]);
    expect(statusAfterRun(p)).toBe("com-erros");
    expect(statusAfterRun({ ...p, channels: ["facebook-post"] })).toBe("publicada");
  });

  it("explains photo needs per channel", () => {
    expect(channelProblem({}, "facebook-post")).toBeUndefined();
    expect(channelProblem({}, "instagram-story")).toMatch(/fotografia/);
    expect(channelProblem({ imageUrl: "/fotos/gato.webp" }, "instagram-post")).toMatch(/JPG/);
    expect(channelProblem({ imageUrl: "https://api/uploads/a.jpg" }, "instagram-post")).toBeUndefined();
    expect(channelProblem({ imageUrl: "/fotos/gato.webp" }, "facebook-story")).toBeUndefined();
  });

  it("emails people who want events or did not choose", () => {
    const list = [{ email: "a@x.pt", interests: [] }, { email: "b@x.pt", interests: ["eventos" as const] }, { email: "c@x.pt", interests: ["adocao" as const] }];
    expect(eventSubscribers(list).map((s) => s.email)).toEqual(["a@x.pt", "b@x.pt"]);
  });
});
