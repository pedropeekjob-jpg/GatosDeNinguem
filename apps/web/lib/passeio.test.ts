import { describe, expect, it } from "vitest";
import { nextWalkIn, pickCat, STROLL } from "./passeio";

const start = 1_000_000;
const visit = { visitStart: start, walks: 0, newCatShown: false };

describe("strolling cat timing", () => {
  it("waits for the first seconds of a visit", () => {
    expect(nextWalkIn(visit, start)).toBe(STROLL.firstAfterMs);
    expect(nextWalkIn(visit, start + STROLL.firstAfterMs + 5)).toBe(0);
  });

  it("leaves a long gap between walks and stops after a few", () => {
    const now = start + 60_000;
    expect(nextWalkIn({ ...visit, walks: 1, lastWalk: now }, now)).toBe(STROLL.gapMs);
    expect(nextWalkIn({ ...visit, walks: STROLL.perVisit, lastWalk: start }, now + STROLL.gapMs)).toBeNull();
  });

  it("stays away after 'Agora não' and in a visit that already showed the new-cat pop-up", () => {
    expect(nextWalkIn({ ...visit, pausedUntil: start + STROLL.pauseMs }, start + 60_000)).toBeNull();
    expect(nextWalkIn({ ...visit, pausedUntil: start - 1 }, start)).toBe(STROLL.firstAfterMs);
    expect(nextWalkIn({ ...visit, newCatShown: true }, start + 60_000)).toBeNull();
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
