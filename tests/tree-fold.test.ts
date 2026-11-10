import { describe, it, expect } from "vitest";
import type { DescNode } from "@/lib/family";
import { MORE, TREE, fold, layoutSingle } from "@/lib/tree-layout";

/** Un neam mic: rădăcina are 8 copii; pe linie e „linie”, iar „frate” are urmași. */
const leaf = (id: string): DescNode => ({ id, partners: [], children: [] });
const tree: DescNode = {
  id: "rad", partners: [], children: [
    { id: "linie", partners: [], children: [leaf("eu")] },
    { id: "frate", partners: [], children: [{ id: "var", partners: [], children: [leaf("var-fiu")] }] },
    ...["a", "b", "c", "d", "e", "f"].map(leaf),
  ],
};
const ego = new Set(["rad", "linie", "eu"]);
const ids = (d: DescNode): string[] => [d.id, ...d.children.flatMap(ids)];

describe("copacul strâns", () => {
  it("păstrează linia, strânge urmașii verilor și frații mulți", () => {
    const { root, hidden } = fold(tree, ego, new Set());
    expect(ids(root)).toEqual(["rad", "linie", "eu", "frate", "a", "b", MORE + "rad"]);
    expect(hidden.get("frate")).toBe(2);
    expect(hidden.get(MORE + "rad")).toBe(4);
  });
  it("desface ce alegi", () => {
    const { root } = fold(tree, ego, new Set(["frate", "var", MORE + "rad"]));
    expect(ids(root)).toHaveLength(ids(tree).length);
  });
  it("e mai îngust decât copacul întreg și fără suprapuneri pe rând", () => {
    const big = layoutSingle(tree, () => true, ego);
    const s = layoutSingle(fold(tree, ego, new Set()).root, () => true, ego, true);
    expect(s.W).toBeLessThanOrEqual(big.W);
    const rows = new Map<number, number[]>();
    for (const n of s.nodes) rows.set(n.y, [...(rows.get(n.y) ?? []), n.x]);
    for (const xs of rows.values()) { xs.sort((a, b) => a - b); xs.slice(1).forEach((x, i) => expect(x - xs[i]).toBeGreaterThanOrEqual(TREE.colW - 1)); }
  });
});
