import type { DescNode } from "./family";

/**
 * Copacul 360°: urmașii unui strămoș așezați pe inele, unul deasupra altuia, ca o coroană de copac.
 * Strămoșul stă jos, în trunchi; fiecare generație e un inel mai sus, iar copiii stau pe inel în dreptul părintelui.
 * Pentru că inelul se închide de jur împrejur, un neam mare încape într-un desen strâns, pe care îl învârți ca să-l vezi tot.
 * Fără desen aici: doar pozițiile, ca să le putem verifica în teste.
 */
export type Node3 = {
  id: string;
  x: number; y: number; z: number;
  depth: number;
  angle: number;
  /** Părintele din neam (pentru ramură); pentru un soț/o soție, persoana lângă care stă. */
  parent: string | null;
  spouse?: boolean;
  /** Copil dintr-o altă relație: ramură mai subțire, doar din părinte. */
  apart?: boolean;
};
export type Layout3 = { nodes: Node3[]; radius: number; height: number; depth: number };

export const ROW_H = 100;
export const SPACING = 86;

type Flat = { d: DescNode; depth: number; parent: string | null; weight: number; a0: number; a1: number };

export function layout360(root: DescNode, opts: { rowH?: number; spacing?: number } = {}): Layout3 {
  const rowH = opts.rowH ?? ROW_H, spacing = opts.spacing ?? SPACING;
  // Cât loc cere fiecare: un om cu soții lui are nevoie de mai mult loc pe inel; o ramură, cât toți urmașii ei de jos.
  const flat: Flat[] = [];
  const weigh = (d: DescNode, depth: number, parent: string | null): Flat => {
    const f: Flat = { d, depth, parent, weight: 0, a0: 0, a1: 0 };
    flat.push(f);
    const kids = d.children.map((c) => weigh(c, depth + 1, d.id));
    const own = 1 + 0.75 * d.partners.length;
    f.weight = Math.max(own, kids.reduce((s, k) => s + k.weight, 0));
    (f as Flat & { kids: Flat[] }).kids = kids;
    return f;
  };
  const top = weigh(root, 0, null);
  const kidsOf = (f: Flat) => (f as Flat & { kids: Flat[] }).kids;
  // Felia de cerc a fiecăruia: cât greutatea lui din felia părintelui.
  const share = (f: Flat, a0: number, a1: number) => {
    f.a0 = a0; f.a1 = a1;
    const kids = kidsOf(f), sum = kids.reduce((s, k) => s + k.weight, 0) || 1;
    let a = a0;
    for (const k of kids) { const w = ((a1 - a0) * k.weight) / sum; share(k, a, a + w); a += w; }
  };
  share(top, -Math.PI, Math.PI);
  const maxDepth = Math.max(...flat.map((f) => f.depth));
  // Raza fiecărui inel: destul de mare cât vecinii să nu se calce (după cât loc cer), dar nu mai mică decât cea de dedesubt cu un pas.
  const radius: number[] = [0];
  for (let d = 1; d <= maxDepth; d++) {
    const ring = flat.filter((f) => f.depth === d).sort((a, b) => a.a0 - b.a0);
    let need = 0;
    for (let i = 0; i < ring.length; i++) {
      const a = ring[i], b = ring[(i + 1) % ring.length];
      const ca = (a.a0 + a.a1) / 2, cb = (b.a0 + b.a1) / 2;
      let gap = cb - ca;
      if (gap <= 0) gap += 2 * Math.PI;
      if (ring.length === 1) gap = 2 * Math.PI;
      const want = (spacing * ((1 + 0.75 * a.d.partners.length) + (1 + 0.75 * b.d.partners.length))) / 2;
      need = Math.max(need, want / gap);
    }
    // Un singur om pe inel (o linie de strămoși): stă pe axă, ca trunchiul copacului. Mai mulți: inelul nu se strânge sub cel de dedesubt.
    radius[d] = ring.length === 1 ? 0 : Math.max(radius[d - 1], spacing * 0.9, need);
  }
  const nodes: Node3[] = [];
  for (const f of flat) {
    const angle = (f.a0 + f.a1) / 2, r = radius[f.depth], y = f.depth * rowH;
    const x = r * Math.cos(angle), z = r * Math.sin(angle);
    nodes.push({ id: f.d.id, x, y, z, depth: f.depth, angle, parent: f.parent, ...(f.d.apart ? { apart: true } : {}) });
    // Soții stau pe același inel, alături, în sensul acelor de ceasornic; la trunchi (în mijloc), într-o parte.
    f.d.partners.forEach((s, i) => {
      if (r === 0) nodes.push({ id: s, x: spacing * 1.1 * (i + 1), y, z: 0, depth: f.depth, angle: 0, parent: f.d.id, spouse: true });
      else {
        const a = angle + (spacing * 0.95 * (i + 1)) / r;
        nodes.push({ id: s, x: r * Math.cos(a), y, z: r * Math.sin(a), depth: f.depth, angle: a, parent: f.d.id, spouse: true });
      }
    });
  }
  return { nodes, radius: Math.max(spacing, ...radius), height: maxDepth * rowH, depth: maxDepth };
}

/** Unghiul de rotire care aduce un punct (cu unghiul lui pe inel) chiar în fața privitorului. */
export const yawFacing = (angle: number) => -Math.PI / 2 - angle;

/** Cel mai scurt drum între două unghiuri (ca să nu se învârtă copacul degeaba o tură întreagă). */
export function angleDiff(from: number, to: number) {
  let d = (to - from) % (2 * Math.PI);
  if (d > Math.PI) d -= 2 * Math.PI;
  if (d < -Math.PI) d += 2 * Math.PI;
  return d;
}

export type Cam = { yaw: number; pitch: number; cy: number; dist: number };
/** Un punct din copac pe ecran: rotit în jurul trunchiului (yaw), înclinat (pitch), cu perspectivă. `s` = cât de aproape pare (pentru mărime). */
export function project(p: { x: number; y: number; z: number }, cam: Cam) {
  const cy = Math.cos(cam.yaw), sy = Math.sin(cam.yaw);
  const x1 = p.x * cy - p.z * sy, z1 = p.x * sy + p.z * cy;
  const yc = p.y - cam.cy;
  const cp = Math.cos(cam.pitch), sp = Math.sin(cam.pitch);
  const y1 = yc * cp - z1 * sp, z2 = yc * sp + z1 * cp;
  const s = cam.dist / (cam.dist + z2);
  return { x: x1 * s, y: -y1 * s, z: z2, s };
}
