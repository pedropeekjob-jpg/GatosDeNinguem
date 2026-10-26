import { describe, expect, it } from "vitest";
import { nextNode, sosTree } from "./sos";

describe("SOS decision tree", () => {
  it("has no broken links and every path ends in an answer", () => {
    const visit = (id: string, seen: Set<string>): void => {
      const node = sosTree[id];
      expect(node, `missing node ${id}`).toBeDefined();
      expect(seen.has(id), `cycle at ${id}`).toBe(false);
      if (node!.kind === "question") node!.options.forEach((o) => visit(o.next, new Set([...seen, id])));
    };
    visit("inicio", new Set());
  });

  it("sends injured cats straight to the vet as urgent", () => {
    const node = nextNode("inicio", 0);
    expect(node?.kind).toBe("answer");
    expect(node && node.kind === "answer" && node.urgent).toBe(true);
  });

  it("sends people to vets and public services, never to the association", () => {
    for (const node of Object.values(sosTree)) {
      if (node.kind !== "answer") continue;
      const text = [node.title, ...node.steps].join(" ");
      expect(text, node.id).not.toMatch(/associa|contacte-nos|indique-nos|ajudamos|podemos/i);
    }
  });

  it("never asks more than three questions", () => {
    const depth = (id: string): number => {
      const n = sosTree[id]!;
      return n.kind === "answer" ? 0 : 1 + Math.max(...n.options.map((o) => depth(o.next)));
    };
    expect(depth("inicio")).toBeLessThanOrEqual(3);
  });
});
