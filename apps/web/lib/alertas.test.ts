import { beforeEach, describe, expect, it } from "vitest";
import { rememberAlerts, shouldOfferAlerts } from "./alertas";

describe("when to offer the cat alerts", () => {
  beforeEach(() => localStorage.clear());

  it("offers to someone who has not answered yet", () => {
    expect(shouldOfferAlerts()).toBe(true);
  });

  it("waits two months after 'Agora não'", () => {
    rememberAlerts("fechado");
    expect(shouldOfferAlerts()).toBe(false);
    expect(shouldOfferAlerts(new Date(Date.now() + 30 * 86_400_000))).toBe(false);
    expect(shouldOfferAlerts(new Date(Date.now() + 61 * 86_400_000))).toBe(true);
  });

  it("never offers again after signing up, even if the window is closed afterwards", () => {
    rememberAlerts("inscrito");
    rememberAlerts("fechado");
    expect(shouldOfferAlerts(new Date(Date.now() + 365 * 86_400_000))).toBe(false);
  });
});
