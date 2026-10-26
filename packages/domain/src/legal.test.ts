import { describe, expect, it } from "vitest";
import { DONATE_BUTTON_LABEL } from "./legal";

describe("DONATE_BUTTON_LABEL", () => {
  it("says that it is a donation, not a purchase", () => {
    expect(DONATE_BUTTON_LABEL).toMatch(/donativo/);
    expect(DONATE_BUTTON_LABEL).not.toMatch(/compra|pagar/i);
  });
});
