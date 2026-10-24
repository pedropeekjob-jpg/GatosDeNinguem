import { describe, expect, it } from "vitest";
import { ORDER_BUTTON_LABEL, withdrawalDeadline } from "./legal";

describe("withdrawalDeadline", () => {
  it("gives 14 days from the day the articles arrive", () => {
    expect(withdrawalDeadline(new Date("2026-11-02T15:30:00Z"))).toBe("2026-11-16");
  });

  it("crosses months and years", () => {
    expect(withdrawalDeadline(new Date("2026-12-25T09:00:00Z"))).toBe("2027-01-08");
  });
});

describe("ORDER_BUTTON_LABEL", () => {
  it("says that ordering means paying", () => {
    expect(ORDER_BUTTON_LABEL).toMatch(/obrigação de pagar/);
  });
});
