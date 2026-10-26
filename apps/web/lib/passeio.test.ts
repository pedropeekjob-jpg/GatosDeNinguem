import { describe, expect, it } from "vitest";
import { nextWalkIn, pickCat, STROLL } from "./passeio";

const start = 1_000_000;
const visit = { visitStart: start };

describe("strolling cat timing", () => {
  it("comes a few seconds into a visit", () => {
    expect(STROLL.firstAfterMs).toBe(8_000);
    expect(nextWalkIn(visit, start)).toBe(STROLL.firstAfterMs);
    expect(nextWalkIn(visit, start + STROLL.firstAfterMs + 5)).toBe(0);
  });

  it("comes back a minute after the last one left, or as often as the back office says", () => {
    const left = start + 60_000;
    expect(nextWalkIn({ ...visit, lastWalk: left }, left)).toBe(60_000);
    expect(nextWalkIn({ ...visit, lastWalk: left }, left + 20_000, 120_000)).toBe(100_000);
    expect(nextWalkIn({ ...visit, lastWalk: left }, left + 61_000)).toBe(0);
  });

  it("stays away for the rest of the visit after 'Agora não'", () => {
    expect(nextWalkIn({ ...visit, declined: true }, start + 600_000)).toBeNull();
  });
});

describe("which cat walks", () => {
  const cats = [
    { slug: "mia", listedAt: "2026-09-01T00:00:00Z" },
    { slug: "tobias", listedAt: "2026-03-01T00:00:00Z" },
    { slug: "nina", listedAt: "2026-06-01T00:00:00Z" },
  ];
  it("starts with the cat waiting longest, then takes turns", () => {
    expect(pickCat(cats)?.slug).toBe("tobias");
    expect(pickCat(cats, "tobias")?.slug).toBe("nina");
    expect(pickCat(cats, "mia")?.slug).toBe("tobias");
    expect(pickCat([], "mia")).toBeUndefined();
  });
});
