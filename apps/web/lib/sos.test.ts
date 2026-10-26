import { describe, expect, it } from "vitest";
import { nextNode, sosTree, sosTreeIn } from "./sos";

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

  it("is fully translated: every node has its own words in English, Spanish and French", () => {
    for (const lang of ["en", "es", "fr"] as const) {
      const tree = sosTreeIn(lang);
      for (const [id, node] of Object.entries(sosTree)) {
        const other = tree[id]!;
        if (node.kind === "question" && other.kind === "question") {
          expect(other.question, `${lang} ${id}`).not.toBe(node.question);
          other.options.forEach((o, i) => expect(o.label, `${lang} ${id} ${i}`).not.toBe(node.options[i]!.label));
        } else if (node.kind === "answer" && other.kind === "answer") {
          expect(other.title, `${lang} ${id}`).not.toBe(node.title);
          expect(other.steps.length, `${lang} ${id}`).toBe(node.steps.length);
        }
      }
    }
  });
});
