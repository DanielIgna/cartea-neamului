import { describe, it, expect } from "vitest";
import { layout360, project, yawFacing, angleDiff, SPACING } from "@/lib/tree360";
import type { DescNode } from "@/lib/family";

const leaf = (id: string, partners: string[] = []): DescNode => ({ id, partners, children: [], via: null });
const node = (id: string, children: DescNode[], partners: string[] = []): DescNode => ({ id, partners, children, via: null });

describe("copacul 360°", () => {
  // Un strămoș cu 13 copii, fiecare cu câte 3 copii: lat de tot pe hârtie, strâns pe inele.
  const big = node("r", Array.from({ length: 13 }, (_, i) => node(`c${i}`, [leaf(`g${i}a`), leaf(`g${i}b`), leaf(`g${i}c`)], [`s${i}`])), ["w"]);
  const lay = layout360(big);

  it("trunchiul e jos, la mijloc; fiecare generație e un inel mai sus", () => {
    const r = lay.nodes.find((n) => n.id === "r")!;
    expect([r.x, r.z, r.y]).toEqual([0, 0, 0]);
    const kids = lay.nodes.filter((n) => n.depth === 1 && !n.spouse);
    expect(kids).toHaveLength(13);
    expect(new Set(kids.map((k) => k.y)).size).toBe(1);
    expect(lay.nodes.filter((n) => n.depth === 2)[0].y).toBeGreaterThan(kids[0].y);
  });
  it("vecinii de pe același inel nu se calcă", () => {
    for (const d of [1, 2]) {
      const ring = lay.nodes.filter((n) => n.depth === d);
      for (let i = 0; i < ring.length; i++) for (let j = i + 1; j < ring.length; j++)
        expect(Math.hypot(ring[i].x - ring[j].x, ring[i].z - ring[j].z)).toBeGreaterThan(SPACING * 0.6);
    }
  });
  it("e mai strâns decât un desen pe lățime", () => {
    // 39 de nepoți pe un rând ar cere ~39 × 74 px; pe inel, diametrul e mult mai mic.
    expect(lay.radius * 2).toBeLessThan(39 * SPACING * 0.6);
  });
  it("soții stau lângă om, pe același inel", () => {
    const c0 = lay.nodes.find((n) => n.id === "c0")!, s0 = lay.nodes.find((n) => n.id === "s0")!;
    expect(s0.spouse).toBe(true);
    expect(s0.parent).toBe("c0");
    expect(s0.y).toBe(c0.y);
    expect(Math.hypot(s0.x - c0.x, s0.z - c0.z)).toBeLessThan(SPACING * 1.2);
  });
  it("copiii stau în dreptul părintelui", () => {
    const c3 = lay.nodes.find((n) => n.id === "c3")!, g = lay.nodes.find((n) => n.id === "g3b")!;
    expect(Math.abs(angleDiff(c3.angle, g.angle))).toBeLessThan(0.3);
  });
  it("rotit spre cineva, el ajunge în față, cel mai aproape de privitor", () => {
    const c5 = lay.nodes.find((n) => n.id === "c5")!;
    const cam = { yaw: yawFacing(c5.angle), pitch: 0, cy: 0, dist: 3000 };
    const zs = lay.nodes.filter((n) => n.depth === 1 && !n.spouse).map((n) => ({ id: n.id, z: project(n, cam).z }));
    expect(zs.reduce((a, b) => (b.z < a.z ? b : a)).id).toBe("c5");
    expect(Math.abs(project(c5, cam).x)).toBeLessThan(1e-6);
  });
  it("un singur om: un singur punct", () => {
    expect(layout360(leaf("x")).nodes).toHaveLength(1);
  });
});
