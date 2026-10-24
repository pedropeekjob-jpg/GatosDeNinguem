import { describe, expect, it } from "vitest";
import { durationSince, formatDate, formatDateShort, formatMonthYear, sinceLabel, timeAgo } from "./datas";

const now = new Date("2026-10-24T15:00:00.000Z"); // 16:00 in Lisbon (summer time)

describe("datas", () => {
  it("writes dates in pt-PT, in Lisbon time", () => {
    expect(formatDate("2026-10-12T10:00:00.000Z")).toBe("12 de outubro de 2026");
    // 23:30 UTC is already the next day in Lisbon in summer.
    expect(formatDate("2026-08-31T23:30:00.000Z")).toBe("1 de setembro de 2026");
    expect(formatDate("2024-03-15")).toBe("15 de março de 2024");
    expect(formatMonthYear("2024-03-15")).toBe("março de 2024");
  });

  it("leaves the year out when it is this year", () => {
    expect(formatDateShort("2026-09-14T10:00:00.000Z", now)).toBe("14 de setembro");
    expect(formatDateShort("2025-09-14T10:00:00.000Z", now)).toBe("14 de setembro de 2025");
  });

  it("says how long ago something happened", () => {
    expect(timeAgo("2026-10-24T14:59:40.000Z", now)).toBe("agora mesmo");
    expect(timeAgo("2026-10-24T14:55:00.000Z", now)).toBe("há 5 minutos");
    expect(timeAgo("2026-10-24T08:10:00.000Z", now)).toBe("hoje às 09:10");
    expect(timeAgo("2026-10-23T20:30:00.000Z", now)).toBe("ontem às 21:30");
    expect(timeAgo("2026-10-21T10:00:00.000Z", now)).toBe("há 3 dias");
    expect(timeAgo("2026-10-02T10:00:00.000Z", now)).toBe("2 de outubro");
  });

  it("says for how long", () => {
    expect(durationSince("2026-10-24", now)).toBe("menos de um dia");
    expect(durationSince("2026-10-19", now)).toBe("5 dias");
    expect(durationSince("2026-10-01", now)).toBe("3 semanas");
    expect(durationSince("2026-02-10", now)).toBe("8 meses");
    expect(durationSince("2025-10-01", now)).toBe("1 ano");
    expect(durationSince("2023-06-01", now)).toBe("3 anos");
    expect(sinceLabel("2026-10-24T08:00:00.000Z", now)).toBe("hoje");
    expect(sinceLabel("2026-10-23T08:00:00.000Z", now)).toBe("ontem");
    expect(sinceLabel("2026-10-10T08:00:00.000Z", now)).toBe("há 2 semanas");
  });
});
