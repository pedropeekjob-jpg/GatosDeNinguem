import { describe, expect, it } from "vitest";
import { allFeatures, formatFeatures, noFeatures, parseFeatures } from "./features";

describe("feature flags", () => {
  it("starts with everything off", () => {
    expect(parseFeatures(undefined)).toEqual(noFeatures);
    expect(parseFeatures("")).toEqual(noFeatures);
  });

  it("switches on only what is named, in any case and separator", () => {
    expect(parseFeatures("Amigo")).toEqual({ patinhas: false, trocas: false, amigo: true });
    expect(parseFeatures("patinhas, amigo")).toEqual({ patinhas: true, trocas: false, amigo: true });
    expect(parseFeatures("patinhas trocas")).toEqual({ patinhas: true, trocas: true, amigo: false });
    expect(parseFeatures("todas")).toEqual(allFeatures);
  });

  it("never offers swaps without Patinhas to swap", () => {
    expect(parseFeatures("trocas")).toEqual(noFeatures);
  });

  it("writes the setting back", () => {
    expect(formatFeatures(allFeatures)).toBe("patinhas,trocas,amigo");
    expect(formatFeatures(noFeatures)).toBe("");
  });
});
