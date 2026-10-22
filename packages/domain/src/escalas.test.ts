import { describe, expect, it } from "vitest";
import { cancelSignUp, checkIn, expandWeeklyRule, freeSpots, lisbonToUtc, openNeeds, signUp, sponsorsDueUpdate, sponsorshipFromRequest, sponsorshipRequestSchema, volunteerHours, type Shift } from "./escalas";

const shift: Shift = {
  id: "s1",
  type: "limpeza",
  title: "Limpeza",
  startsAt: "2026-11-07T10:00:00.000Z",
  endsAt: "2026-11-07T12:00:00.000Z",
  location: "Gatil",
  capacity: 2,
  signups: [],
};
const ana = { volunteerId: "v1", name: "Ana", phone: "912345678" };
const rui = { volunteerId: "v2", name: "Rui", phone: "913456789" };
const joao = { volunteerId: "v3", name: "João", phone: "914567890" };
const now = new Date("2026-11-01T09:00:00.000Z");

describe("signUp", () => {
  it("adds volunteers until the shift is full", () => {
    const one = signUp(shift, ana, now);
    expect(one.ok).toBe(true);
    const two = one.ok ? signUp(one.shift, rui, now) : one;
    expect(two.ok && freeSpots(two.shift)).toBe(0);
    const three = two.ok ? signUp(two.shift, joao, now) : two;
    expect(three).toEqual({ ok: false, error: "lotado" });
  });

  it("refuses double sign-ups and past shifts", () => {
    const one = signUp(shift, ana, now);
    expect(one.ok && signUp(one.shift, ana, now)).toEqual({ ok: false, error: "ja-inscrito" });
    expect(signUp(shift, ana, new Date("2026-11-08T00:00:00Z"))).toEqual({ ok: false, error: "ja-passou" });
  });

  it("frees a spot when someone cancels", () => {
    const one = signUp(shift, ana, now);
    expect(one.ok && freeSpots(cancelSignUp(one.shift, "v1"))).toBe(2);
  });
});

describe("hours", () => {
  it("counts only shifts the volunteer checked in to", () => {
    const signed = signUp(shift, ana, now);
    if (!signed.ok) throw new Error();
    const other = { ...signed.shift, id: "s2" };
    const done = checkIn(signed.shift, "v1", new Date("2026-11-07T10:05:00Z"));
    expect(volunteerHours([done, other], "v1")).toBe(2);
  });
});

describe("expandWeeklyRule", () => {
  let n = 0;
  const id = () => `id-${++n}`;

  it("creates one shift per matching weekday, in Lisbon time across the DST change", () => {
    const shifts = expandWeeklyRule(
      { type: "limpeza", title: "Limpeza de sábado", location: "Gatil", capacity: 3, weekdays: [6], startTime: "10:00", endTime: "12:00", from: "2026-10-17", until: "2026-11-07" },
      "serie-1",
      id,
    );
    expect(shifts.map((s) => s.startsAt)).toEqual([
      "2026-10-17T09:00:00.000Z", // summer time (UTC+1)
      "2026-10-24T09:00:00.000Z",
      "2026-10-31T10:00:00.000Z", // winter time (UTC+0)
      "2026-11-07T10:00:00.000Z",
    ]);
    expect(shifts.every((s) => s.seriesId === "serie-1")).toBe(true);
  });

  it("limits a series to 26 weeks", () => {
    expect(() => expandWeeklyRule({ type: "limpeza", title: "x x", location: "Gatil", capacity: 1, weekdays: [1], startTime: "10:00", endTime: "11:00", from: "2026-01-01", until: "2027-01-01" }, "s", id)).toThrow(/26 semanas/);
  });
});

describe("lisbonToUtc", () => {
  it("handles winter and summer time", () => {
    expect(lisbonToUtc("2026-01-15", "10:00")).toBe("2026-01-15T10:00:00.000Z");
    expect(lisbonToUtc("2026-07-15", "10:00")).toBe("2026-07-15T09:00:00.000Z");
  });
});

describe("openNeeds", () => {
  it("lists foster requests first, then upcoming shifts with free spots", () => {
    const full: Shift = { ...shift, id: "full", capacity: 1, signups: [{ ...ana, signedUpAt: now.toISOString() }] };
    const later: Shift = { ...shift, id: "later", startsAt: "2026-12-30T10:00:00.000Z", endsAt: "2026-12-30T12:00:00.000Z" };
    const needs = openNeeds([later, full, shift], [{ id: "f1", catSlug: "pimenta", status: "procura-familia", startDate: "2026-11-01" }], now);
    expect(needs.map((n) => (n.kind === "turno" ? n.shift.id : n.placement.id))).toEqual(["f1", "s1"]);
  });
});

describe("sponsorsDueUpdate", () => {
  it("reminds the team about godparents without news for a month", () => {
    const due = sponsorsDueUpdate(
      [
        { id: "a", catSlug: "tobias", sponsorName: "Ana", monthlyAmount: 5, startDate: "2026-01-01", active: true, lastUpdateSentAt: "2026-09-01" },
        { id: "b", catSlug: "tobias", sponsorName: "Rui", monthlyAmount: 5, startDate: "2026-01-01", active: true, lastUpdateSentAt: "2026-10-20" },
        { id: "c", catSlug: "mia", sponsorName: "Eva", monthlyAmount: 5, startDate: "2026-01-01", active: false },
      ],
      "2026-10-22",
    );
    expect(due.map((s) => s.id)).toEqual(["a"]);
  });
});

describe("sponsorship requests from the site", () => {
  const valid = { catSlug: "tobias", name: "Ana Lima", email: "ana@example.pt", monthlyAmount: "10", consent: true };

  it("accepts the amount as typed in the form and an empty phone", () => {
    const r = sponsorshipRequestSchema.parse({ ...valid, phone: "" });
    expect(r.monthlyAmount).toBe(10);
  });

  it("asks for at least 5 euros, an email and consent", () => {
    const r = sponsorshipRequestSchema.safeParse({ ...valid, monthlyAmount: 2, email: "", consent: undefined });
    expect(r.success).toBe(false);
    const fields = r.success ? [] : r.error.issues.map((i) => i.path[0]);
    expect(fields).toEqual(expect.arrayContaining(["monthlyAmount", "email", "consent"]));
  });

  it("becomes an inactive sponsorship waiting for the team", () => {
    const s = sponsorshipFromRequest(sponsorshipRequestSchema.parse(valid), "sp-9", "2026-11-01");
    expect(s).toMatchObject({ id: "sp-9", catSlug: "tobias", sponsorName: "Ana Lima", active: false, pending: true, startDate: "2026-11-01" });
    expect(sponsorsDueUpdate([s], "2026-12-31")).toEqual([]);
  });
});
