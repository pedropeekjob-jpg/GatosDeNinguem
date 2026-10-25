import { beforeEach, describe, expect, it } from "vitest";
import { markCatSeen, seenCats } from "./alertas";

describe("cats this visitor has seen", () => {
  beforeEach(() => localStorage.clear());

  it("remembers each cat once", () => {
    expect(seenCats()).toEqual([]);
    markCatSeen("mimi");
    markCatSeen("mimi");
    markCatSeen("tom");
    expect(seenCats()).toEqual(["mimi", "tom"]);
  });
});
