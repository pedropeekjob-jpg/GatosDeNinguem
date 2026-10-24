import { describe, expect, it } from "vitest";
import { allFeatures, noFeatures } from "@gn/domain";
import { switchedOffRedirect } from "./features";

describe("switched-off pages", () => {
  it("sends the Patinhas page to Ajudar while Patinhas are off", () => {
    expect(switchedOffRedirect("/patinhas", noFeatures)).toBe("/ajudar");
    expect(switchedOffRedirect("/patinhas/", noFeatures)).toBe("/ajudar");
    expect(switchedOffRedirect("/ajudar/amigo", noFeatures)).toBe("/ajudar");
  });

  it("leaves pages alone when their part is on, and other pages always", () => {
    expect(switchedOffRedirect("/patinhas", allFeatures)).toBeUndefined();
    expect(switchedOffRedirect("/ajudar", noFeatures)).toBeUndefined();
  });
});
