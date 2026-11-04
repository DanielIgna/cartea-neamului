import { describe, it, expect } from "vitest";
import { layout360, twinForest } from "@/lib/tree360";
import type { DescNode } from "@/lib/family";
import type { TwinParts } from "@/lib/tree-layout";

const n = (id: string, children: DescNode[] = [], partners: string[] = []): DescNode => ({ id, partners, children, via: null });

describe("copacul 360° cu amândouă spițele", () => {
  // Tatăl e la a 4-a generație de la Mărjel, mama la a 2-a de la Todea.
  const left = n("marjel", [n("g1", [n("g2", [n("tata", [], [])]), n("unchi")])]);
  const right = n("todea", [n("mama"), n("matusa")]);
  const parts: TwinParts = { left, right, crown: n("tata+mama", [{ ...n("ego"), via: "mama" }, { ...n("frate"), via: "mama" }]), father: "tata", mother: "mama", patRoot: "marjel", matRoot: "todea" };
  const { seeds, links } = twinForest(parts);
  const lay = layout360(seeds);
  const at = (id: string) => lay.nodes.find((x) => x.id === id)!;

  it("ambele neamuri apar, fiecare cu strămoșul lui", () => {
    for (const id of ["marjel", "todea", "tata", "mama", "ego", "frate", "unchi", "matusa"]) expect(at(id)).toBeTruthy();
    expect(new Set(lay.nodes.map((x) => x.id)).size).toBe(lay.nodes.length);
  });
  it("tatăl și mama stau pe același inel, legați prin căsătorie, iar copiii cresc din tată", () => {
    expect(at("tata").y).toBe(at("mama").y);
    expect(links).toEqual([["tata", "mama"]]);
    expect(at("ego").parent).toBe("tata");
    expect(at("ego").y).toBeGreaterThan(at("tata").y);
    expect(at("todea").y).toBeGreaterThan(at("marjel").y);
  });
  it("fiecare neam pe jumătatea lui de cerc", () => {
    const maxLeft = Math.max(...["marjel", "g1", "g2", "tata", "unchi"].map((id) => at(id).angle));
    const minRight = Math.min(...["todea", "mama", "matusa"].map((id) => at(id).angle));
    expect(maxLeft).toBeLessThan(minRight);
  });
});
