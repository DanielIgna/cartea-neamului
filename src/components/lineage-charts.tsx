"use client";
import type { PersonView } from "@/lib/tree-data";
import { clip, years, genOf, fillFor, type DescNode, type Slots } from "./charts";

/**
 * Desenele „de la trunchi în sus”: copacul neamului și evantaiul urmașilor.
 * Fiecare persoană primește loc pe orizontală (sau un unghi) proporțional cu câți urmași fără copii are sub ea,
 * ca o familie cu 13 frați să-și facă loc fără să se suprapună.
 */
type Props = {
  root: DescNode; people: Record<string, PersonView>; selectedId: string | null; egoPath: Set<string>; parentsOf?: Map<string, string[]>;
  onSelectPerson: (id: string) => void; onCenter: (id: string) => void;
};

type Placed = { node: DescNode; depth: number; a: number; b: number; parent?: Placed };

/** Împarte intervalul [0, 1) între urmași, după numărul de „frunze” din fiecare ramură. */
function place(root: DescNode) {
  const leaves = new Map<DescNode, number>();
  const count = (d: DescNode): number => {
    const n = d.children.length ? d.children.reduce((s, c) => s + count(c), 0) : 1;
    leaves.set(d, n);
    return n;
  };
  count(root);
  const out: Placed[] = [];
  const walk = (d: DescNode, depth: number, a: number, b: number, parent?: Placed) => {
    const me: Placed = { node: d, depth, a, b, parent };
    out.push(me);
    let x = a;
    const total = leaves.get(d)!;
    for (const c of d.children) {
      const w = ((b - a) * leaves.get(c)!) / total;
      walk(c, depth + 1, x, x + w, me);
      x += w;
    }
  };
  walk(root, 0, 0, 1);
  return { placed: out, leaves: leaves.get(root)!, depth: Math.max(...out.map((p) => p.depth)) };
}

const keyAct = (fn: () => void) => (e: React.KeyboardEvent) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fn(); } };
const kids = (d: DescNode) => (d.children.length === 1 ? "1 copil" : d.children.length ? `${d.children.length} copii` : "");

/* ---------- Copacul adevărat ---------- */

/** Un număr „aleator” dar mereu același pentru aceeași persoană, ca frunzișul să nu sară la fiecare desen. */
function seeded(id: string) {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  return () => { h = Math.imul(h ^ (h >>> 15), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); return ((h ^= h >>> 16) >>> 0) / 4294967296; };
}

type Pt = [number, number];
/** O ramură plină care se subțiază: o curbă Bézier cu grosime w0 la bază și w1 la vârf. */
function taper(p0: Pt, p1: Pt, p2: Pt, p3: Pt, w0: number, w1: number, n = 18) {
  const L: Pt[] = [], R: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, u = 1 - t;
    const x = u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0];
    const y = u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1];
    const dx = 3 * u * u * (p1[0] - p0[0]) + 6 * u * t * (p2[0] - p1[0]) + 3 * t * t * (p3[0] - p2[0]);
    const dy = 3 * u * u * (p1[1] - p0[1]) + 6 * u * t * (p2[1] - p1[1]) + 3 * t * t * (p3[1] - p2[1]);
    const len = Math.hypot(dx, dy) || 1, w = (w0 + (w1 - w0) * t) / 2;
    L.push([x - (dy / len) * w, y + (dx / len) * w]);
    R.push([x + (dy / len) * w, y - (dx / len) * w]);
  }
  const f = (p: Pt) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`;
  return `M${L.map(f).join("L")}L${R.reverse().map(f).join("L")}Z`;
}

/** Forma unei frunze (lentilă cu vârf), cu centrul în (x, y). */
const leafPath = (x: number, y: number, w: number, h: number, tilt = 0) => {
  const c = Math.cos(tilt), s = Math.sin(tilt);
  const P = (dx: number, dy: number) => `${(x + dx * c - dy * s).toFixed(1)} ${(y + dx * s + dy * c).toFixed(1)}`;
  return `M${P(-w / 2, 0)}Q${P(0, -h)} ${P(w / 2, 0)}Q${P(0, h)} ${P(-w / 2, 0)}Z`;
};

type TNode = { node: DescNode; depth: number; x: number; y: number; parent?: TNode; trunk: boolean; size: number; side: -1 | 0 | 1 };

/**
 * Așezarea copacului: trunchiul e linia neamului (de la cel mai vechi strămoș, prin persoana din centru, mai departe pe urmașul cu cei mai mulți urmași),
 * drept în sus. Din fiecare om de pe trunchi ies, la stânga și la dreapta, ramurile fraților și ale copiilor lui; ramurile de jos ies mai lungi, spre margine,
 * cele de sus mai aproape de trunchi, ca la un copac adevărat. În fiecare ramură, fiecare urmaș primește loc cât frunzele (urmașii fără copii) de sub el.
 */
function growTree(root: DescNode, egoPath: Set<string>, colW: number, own: (d: DescNode) => number, trunkPad = 0, prefer: (t: DescNode, c: DescNode) => -1 | 0 | 1 = () => 0) {
  const leaves = new Map<DescNode, number>(), size = new Map<DescNode, number>();
  const count = (d: DescNode): void => {
    d.children.forEach(count);
    leaves.set(d, Math.max(own(d), d.children.reduce((s, c) => s + leaves.get(c)!, 0)));
    size.set(d, 1 + d.children.reduce((s, c) => s + size.get(c)!, 0));
  };
  count(root);
  const trunk: DescNode[] = [root];
  for (let cur = root; cur.children.length; ) {
    cur = cur.children.find((c) => egoPath.has(c.id)) ?? [...cur.children].sort((a, b) => size.get(b)! - size.get(a)!)[0];
    trunk.push(cur);
  }
  // Ramurile fiecărui om de pe trunchi, împărțite stânga/dreapta ca să fie copacul cât mai echilibrat.
  const left: { d: DescNode; level: number }[] = [], right: { d: DescNode; level: number }[] = [];
  let lw = 0, rw = 0;
  trunk.forEach((t, level) => {
    const side = t.children.filter((c) => c !== trunk[level + 1]).sort((a, b) => leaves.get(b)! - leaves.get(a)!);
    for (const d of side) {
      const want = prefer(t, d);
      if (want === -1) { left.push({ d, level }); lw += leaves.get(d)!; }
      else if (want === 1) { right.push({ d, level }); rw += leaves.get(d)!; }
      else if (lw <= rw) { left.push({ d, level }); lw += leaves.get(d)!; } else { right.push({ d, level }); rw += leaves.get(d)!; }
    }
  });
  const trunkX = lw * colW + colW + colW * 0.3 + trunkPad;
  const out: TNode[] = [];
  const tnodes: TNode[] = [];
  trunk.forEach((d, i) => {
    const t: TNode = { node: d, depth: i, x: trunkX, y: 0, parent: tnodes[i - 1], trunk: true, size: size.get(d)!, side: 0 };
    tnodes.push(t); out.push(t);
  });
  const lay = (d: DescNode, depth: number, a: number, b: number, parent: TNode, side: -1 | 1) => {
    const me: TNode = { node: d, depth, x: (a + b) / 2, y: 0, parent, trunk: false, size: size.get(d)!, side };
    out.push(me);
    let x = a;
    for (const c of d.children) { const w = ((b - a) * leaves.get(c)!) / leaves.get(d)!; lay(c, depth + 1, x, x + w, me, side); x += w; }
  };
  // Stânga: de la margine spre trunchi, ramurile de jos primele (cele mai lungi stau la margine).
  let x = 0;
  for (const { d, level } of [...left].sort((a, b) => a.level - b.level)) { const w = leaves.get(d)! * colW; lay(d, level + 1, x, x + w, tnodes[level], -1); x += w; }
  // Dreapta: de la trunchi spre margine, ramurile de sus primele.
  x = trunkX + colW + colW * 0.3;
  for (const { d, level } of [...right].sort((a, b) => b.level - a.level)) { const w = leaves.get(d)! * colW; lay(d, level + 1, x, x + w, tnodes[level], 1); x += w; }
  return { nodes: out, width: x, depth: Math.max(...out.map((n) => n.depth)), trunkX };
}

/** Copacul neamului: trunchiul e linia de la cel mai vechi la cel mai tânăr; fiecare familie e o ramură, din ea ramuri mai subțiri și lăstari. */
export function LineageTree({ root: root0, people, parentsOf, selectedId, egoPath, onSelectPerson, onCenter }: Props) {
  const colW = 108, rowH = 116, half = 58;
  const otherParent = (child: string, parent: string) => (parentsOf?.get(child) ?? []).find((x) => x !== parent);
  // Soții unei persoane, cel mult doi pe desen: primul (în dreapta) e cel cu care are cei mai mulți copii (pe trunchi: părintele următorului om de pe linie).
  const spousesOf = (d: DescNode, next?: DescNode) => {
    const count = (sp: string) => d.children.filter((c) => otherParent(c.id, d.id) === sp).length;
    const list = d.partners.filter((id) => people[id]).sort((a, b) => count(b) - count(a));
    const lead = next ? otherParent(next.id, d.id) : undefined;
    if (lead && list.includes(lead)) list.sort((a, b) => (a === lead ? -1 : b === lead ? 1 : 0));
    return list.slice(0, 2).map((id) => people[id]);
  };
  // Copiii fiecărei familii stau împreună: întâi cei cu a doua soție (stânga), apoi cei fără celălalt părinte, apoi cei cu prima soție (dreapta).
  const regroup = (d: DescNode): DescNode => {
    const sp = spousesOf(d).map((x) => x.id);
    const rank = (c: DescNode) => { const o = otherParent(c.id, d.id); return o === sp[1] ? 0 : o === sp[0] ? 2 : 1; };
    return { ...d, children: [...d.children].sort((a, b) => rank(a) - rank(b)).map(regroup) };
  };
  const root = regroup(root0);
  const trunkHas2 = (() => { for (let d: DescNode | undefined = root; d; d = d.children.find((c) => egoPath.has(c.id)) ?? d.children[0]) if (spousesOf(d).length > 1) return true; return false; })();
  // Pe trunchi, copiii celei de-a doua soții cresc pe stânga (unde stă ea), ai primei soții pe dreapta.
  const grown = growTree(root, egoPath, colW, (d) => 1 + spousesOf(d).length, trunkHas2 ? colW * 1.2 : 0, (t, c) => {
    const sps = spousesOf(t);
    if (sps.length < 2) return 0;
    const o = otherParent(c.id, t.id);
    return o === sps[1].id ? -1 : o === sps[0].id ? 1 : 0;
  });
  const W0 = grown.width, W = Math.max(W0, 680), shift = (W - W0) / 2;
  const trunkH = 130, top = 70, H = top + grown.depth * rowH + trunkH + 70;
  const baseY = H - 46;
  for (const n of grown.nodes) { n.x += shift + (!n.trunk && spousesOf(n.node).length > 1 ? half : 0); n.y = baseY - trunkH - n.depth * rowH; }
  const tx = grown.trunkX + shift;
  const thick = (s: number) => Math.min(5 + 3.4 * Math.sqrt(s), 46);
  const trunkNodes = grown.nodes.filter((n) => n.trunk);
  const rootN = trunkNodes[0];
  // Familia de pe desen: persoana, soții ei și nodul fiecărei căsătorii (de unde pornesc copiii lor).
  const famOf = new Map(grown.nodes.map((n) => {
    const next = n.trunk ? trunkNodes[n.depth + 1]?.node : undefined;
    const sps = spousesOf(n.node, next);
    const px = sps.length ? n.x - half : n.x;
    const unions = sps.map((sp, i) => ({ sp, x: i === 0 ? n.x + half : n.x - 3 * half, knot: i === 0 ? n.x : n.x - 2 * half }));
    return [n.node.id, { px, unions }];
  }));
  const branchFrom = (p: TNode, childId: string) => {
    const f = famOf.get(p.node.id)!, o = otherParent(childId, p.node.id);
    const u = f.unions.find((x) => x.sp.id === o);
    return u ? { x: u.knot, y: p.y + 6 } : { x: f.unions.length ? f.px : p.x, y: p.y - 10 };
  };

  // Coroana: pâlcuri de frunziș în jurul fiecărui om, mai dese la vârfuri (cei fără copii).
  const foliage = grown.nodes.flatMap((n) => {
    const rnd = seeded(n.node.id), k = n.node.children.length ? 3 : 5;
    return Array.from({ length: k }, (_, i) => ({ key: `${n.node.id}f${i}`, cx: n.x + (rnd() - 0.5) * (famOf.get(n.node.id)!.unions.length ? 180 : 80) - (famOf.get(n.node.id)!.unions.length > 1 ? half : 0), cy: n.y - 6 + (rnd() - 0.5) * 56, r: 22 + rnd() * 20, tone: 1 + Math.floor(rnd() * 3) }));
  });
  // Lăstari: rămurele cu frunze la cei fără copii (vârfurile copacului).
  const shoots = grown.nodes.filter((n) => !n.node.children.length && n.depth > 0).flatMap((n) => {
    const rnd = seeded(`${n.node.id}s`);
    return [-1, 0, 1].map((dir, i) => {
      const ang = -Math.PI / 2 + dir * (0.55 + rnd() * 0.3), len = 30 + rnd() * 14;
      const sx = n.x + dir * 6, sy = n.y - (famOf.get(n.node.id)!.unions.length ? 18 : 16), ex = sx + Math.cos(ang) * len, ey = sy + Math.sin(ang) * len;
      return { key: `${n.node.id}s${i}`, d: taper([sx, sy], [sx + (ex - sx) * 0.2, sy - len * 0.4], [ex - (ex - sx) * 0.3, ey + 4], [ex, ey], 3, 1, 8), leaf: leafPath(ex, ey, 16, 7, ang) };
    });
  });

  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Copacul neamului" style={{ width: W, maxWidth: "none", display: "block", margin: "0 auto" }}>
      <defs>
        <linearGradient id="bark" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="var(--tree-bark-dark)" /><stop offset="0.45" stopColor="var(--tree-bark)" /><stop offset="1" stopColor="var(--tree-bark-dark)" />
        </linearGradient>
      </defs>
      {/* Pământul și rădăcinile */}
      <ellipse cx={tx} cy={baseY + 14} rx={Math.max(Math.min(tx - 10, W - tx - 10, 360), 120)} ry={26} fill="var(--tree-ground)" />
      {[-1, 1].flatMap((s) => [0.6, 1.3].map((k) => (
        <path key={`r${s}${k}`} d={taper([tx + s * 10, baseY - 6], [tx + s * 40 * k, baseY], [tx + s * 70 * k, baseY + 10], [tx + s * 110 * k, baseY + 18], 16 / k, 2)} fill="var(--tree-bark-dark)" />
      )))}
      {/* Coroana */}
      <g opacity={0.55}>{foliage.map((f) => <circle key={f.key} cx={f.cx} cy={f.cy} r={f.r} fill={`var(--foliage-${f.tone})`} />)}</g>
      {/* Trunchiul: din pământ până la ultimul om de pe linie, tot mai subțire */}
      <path d={taper([tx, baseY + 4], [tx, baseY - trunkH * 0.4], [tx, rootN.y + trunkH * 0.3], [tx, rootN.y], thick(rootN.size) * 1.7, thick(rootN.size))} fill="url(#bark)" />
      {trunkNodes.slice(1).map((n) => (
        <path key={`t${n.node.id}`} d={taper([tx, n.parent!.y + 2], [tx, n.parent!.y - rowH * 0.4], [tx, n.y + rowH * 0.4], [tx, n.y], thick(n.parent!.size), thick(n.size))}
          fill="url(#bark)" stroke={egoPath.has(n.node.id) ? "var(--accent)" : "none"} strokeWidth={1.2} />
      ))}
      {/* Ramurile: ies din părinte în lături, apoi urcă spre copil; groase cât urmașii pe care îi poartă */}
      {grown.nodes.filter((n) => !n.trunk && n.parent).map((n) => {
        const p = n.parent!, from = branchFrom(p, n.node.id), sy = from.y, dx = n.x - from.x;
        const onPath = egoPath.has(n.node.id) && egoPath.has(p.node.id);
        return <path key={`b${n.node.id}`} d={taper([from.x + Math.sign(dx) * (p.trunk && from.x === tx ? thick(p.size) * 0.3 : 0), sy], [from.x + dx * 0.55, sy - rowH * 0.12], [n.x, n.y + rowH * 0.55], [n.x, n.y + 8], Math.min(thick(n.size) * 1.15, thick(p.size)), thick(n.size) * 0.7)}
          fill="url(#bark)" stroke={onPath ? "var(--accent)" : "none"} strokeWidth={1.2} />;
      })}
      {shoots.map((s) => <g key={s.key}><path d={s.d} fill="var(--tree-bark)" /><path d={s.leaf} fill="var(--foliage-2)" stroke="var(--leaf-edge)" strokeWidth={0.6} /></g>)}
      {/* Oamenii: fiecare familie e o pereche de frunze (pe trunchi, plăcuțe) legate printr-un nod; din nod pornesc ramurile copiilor */}
      {grown.nodes.map((n) => {
        const person = people[n.node.id];
        if (!person) return null;
        const { x, y } = n, { px, unions } = famOf.get(n.node.id)!, partner = unions[0]?.sp;
        const card = (who: PersonView, cx: number, blood: boolean) => {
          const sel = selectedId === who.id, ego = egoPath.has(who.id);
          const fill = n.trunk ? (n.depth === 0 && blood ? "var(--accent-soft)" : "var(--surface)") : blood ? (ego ? "var(--leaf-pat)" : "var(--leaf-mat)") : "var(--leaf-spouse)";
          const kidsTxt = kids(n.node);
          return (
            <g key={who.id} className={`sector${sel ? " sel" : ""}`} tabIndex={0} role="button" aria-label={blood ? who.name : `Soț/soție: ${who.name}`}
              onClick={() => onSelectPerson(who.id)} onDoubleClick={() => onCenter(who.id)} onKeyDown={keyAct(() => onSelectPerson(who.id))}>
              <title>{`${blood ? "" : "⚭ "}${who.name} ${years(who)}${kidsTxt ? ` · ${kidsTxt}` : ""}`}</title>
              {n.trunk
                ? <rect x={cx - 50} y={y - 24} width={100} height={46} rx={10} fill={fill} stroke={ego ? "var(--accent)" : "var(--tree-bark-dark)"} strokeWidth={ego ? 2 : 1.2} strokeDasharray={blood ? undefined : "4 3"} />
                : <path d={leafPath(cx, y, 102, 36, (cx < px ? 1 : cx > px ? 1 : -1) * (partner ? 0.06 : 0))} fill={fill} stroke={ego ? "var(--accent)" : "var(--leaf-edge)"} strokeWidth={ego ? 2 : 1} />}
              <text x={cx} y={y - 6} textAnchor="middle" fill="var(--ink)" fontSize={11} fontWeight={700}>{blood ? "" : "⚭ "}{clip(who.givenName, 12)}</text>
              <text x={cx} y={y + 6} textAnchor="middle" fill="var(--ink)" fontSize={9.5}>{clip(who.birthSurname && !blood ? `${who.surname} (n. ${who.birthSurname})` : who.surname, 15)}</text>
              <text x={cx} y={y + 17} textAnchor="middle" fill="var(--muted)" fontSize={9}>{years(who)}</text>
            </g>
          );
        };
        return (
          <g key={n.node.id}>
            {unions.map((u) => { const l = Math.min(px, u.x) + 30, r = Math.max(px, u.x) - 30;
              return <path key={`u${u.sp.id}`} d={taper([l, y + 4], [u.knot - 10, y + 10], [u.knot + 10, y + 10], [r, y + 4], 5, 5, 12)} fill="var(--tree-bark)" />; })}
            {card(person, px, true)}
            {unions.map((u) => card(u.sp, u.x, false))}
            {unions.map((u) => {
              const n2 = n.node.children.filter((c) => otherParent(c.id, n.node.id) === u.sp.id).length;
              return <circle key={`k${u.sp.id}`} cx={u.knot} cy={y + 9} r={7} fill="var(--tree-bark-dark)" stroke="var(--surface)" strokeWidth={1.2}>
                <title>{`Familia ${person.givenName} și ${u.sp.givenName}${n2 ? `: ${n2 === 1 ? "1 copil" : `${n2} copii`}` : ""}`}</title></circle>;
            })}
            {!partner && n.node.children.length > 0 && <text x={n.trunk ? x + 56 : x} y={y + (n.trunk ? 4 : 36)} textAnchor={n.trunk ? "start" : "middle"} fill="var(--muted)" fontSize={9} fontWeight={600}>{kids(n.node)}</text>}
            {unions.map((u, i) => {
              // Câți copii are cu fiecare soț/soție (cei fără celălalt părinte trecut se numără la prima familie).
              const n2 = n.node.children.filter((c) => { const o = otherParent(c.id, n.node.id); return o === u.sp.id || (i === 0 && !unions.some((v) => v.sp.id === o)); }).length;
              return n2 > 0 && <text key={`c${u.sp.id}`} x={u.x} y={y + 36} textAnchor="middle" fill="var(--muted)" fontSize={9} fontWeight={600}>{n2 === 1 ? "1 copil" : `${n2} copii`}</text>;
            })}
          </g>
        );
      })}
      <text x={tx} y={baseY + 36} textAnchor="middle" fill="var(--muted)" fontSize={11} style={{ fontFamily: "var(--display)" }}>
        {people[root.id] ? `Neamul ${people[root.id].surname} · rădăcina: ${people[root.id].name}` : ""}
      </text>
    </svg>
  );
}

/** Evantaiul urmașilor: trunchiul în mijloc, fiecare generație un inel, fiecare ramură o felie cât urmașii ei. */
export function DescendantFan({ root, people, selectedId, egoPath, onSelectPerson, onCenter }: Props) {
  const { placed, depth } = place(root);
  const r0 = 70, ring = depth > 7 ? 62 : 74, maxR = r0 + depth * ring;
  const cx = maxR + 20, cy = maxR + 10, A0 = -210, SPAN = 240;
  const W = 2 * cx, H = cy + maxR * 0.5 + 20;
  const pt = (r: number, a: number) => [cx + r * Math.cos((a * Math.PI) / 180), cy + r * Math.sin((a * Math.PI) / 180)];
  const arc = (r1: number, r2: number, a1: number, a2: number) => {
    const [x1, y1] = pt(r2, a1), [x2, y2] = pt(r2, a2), [x3, y3] = pt(r1, a2), [x4, y4] = pt(r1, a1);
    const lg = a2 - a1 > 180 ? 1 : 0;
    return `M${x1} ${y1}A${r2} ${r2} 0 ${lg} 1 ${x2} ${y2}L${x3} ${y3}A${r1} ${r1} 0 ${lg} 0 ${x4} ${y4}Z`;
  };
  const rootP = people[root.id];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Evantaiul urmașilor" style={depth >= 6 ? { width: W, maxWidth: "none", display: "block", margin: "0 auto" } : { width: "100%", maxWidth: 820, display: "block", margin: "0 auto" }}>
      {placed.filter((p) => p.depth > 0).map((p) => {
        const person = people[p.node.id];
        if (!person) return null;
        const a1 = A0 + SPAN * p.a, a2 = A0 + SPAN * p.b, mid = (a1 + a2) / 2;
        const r1 = r0 + (p.depth - 1) * ring, r2 = r1 + ring, rm = (r1 + r2) / 2;
        const [tx, ty] = pt(rm, mid);
        const wide = (a2 - a1) * (Math.PI / 180) * rm > 90; // felie destul de lată pentru text de-a curmezișul
        const rot = wide ? mid + 90 : mid < -90 ? mid + 180 : mid;
        const ego = egoPath.has(p.node.id);
        return (
          <g key={p.node.id} className={`sector${selectedId === p.node.id ? " sel" : ""}`} tabIndex={0} role="button" aria-label={person.name}
            onClick={() => onSelectPerson(p.node.id)} onDoubleClick={() => onCenter(p.node.id)} onKeyDown={keyAct(() => onSelectPerson(p.node.id))}>
            <title>{`${person.name} ${years(person)}${kids(p.node) ? ` · ${kids(p.node)}` : ""}`}</title>
            <path d={arc(r1, r2, a1, a2)} fill={ego ? "var(--accent-soft)" : `var(--pat-${Math.min(1 + (p.depth % 4), 4)})`} stroke={ego ? "var(--accent)" : "var(--line)"} strokeWidth={ego ? 1.6 : 0.8} />
            <text x={tx} y={ty} textAnchor="middle" transform={`rotate(${rot} ${tx} ${ty})`} fill="var(--ink)" fontSize={wide ? 11 : 9}>
              <tspan x={tx} dy={-2} fontWeight={700}>{clip(person.givenName, wide ? 16 : 10)}</tspan>
              <tspan x={tx} dy={11} fill="var(--muted)">{person.birthYear ?? ""}</tspan>
            </text>
          </g>
        );
      })}
      {rootP && (
        <g className={`sector${selectedId === root.id ? " sel" : ""}`} tabIndex={0} role="button" aria-label={rootP.name} onClick={() => onSelectPerson(root.id)} onKeyDown={keyAct(() => onSelectPerson(root.id))}>
          <circle cx={cx} cy={cy} r={r0 - 2} fill="var(--accent-soft)" stroke="var(--accent)" strokeWidth={1.5} />
          <text x={cx} y={cy - 4} textAnchor="middle" fill="var(--ink)" fontSize={14} fontWeight={700} style={{ fontFamily: "var(--display)" }}>
            <tspan x={cx}>{rootP.givenName}</tspan><tspan x={cx} dy={16}>{rootP.surname}</tspan>
          </text>
          <text x={cx} y={cy + 30} textAnchor="middle" fill="var(--muted)" fontSize={11}>{years(rootP)}</text>
        </g>
      )}
    </svg>
  );
}

/**
 * Clepsidra: persoana aleasă la mijloc, strămoșii ei deasupra (tatăl spre stânga, mama spre dreapta)
 * și urmașii dedesubt, cu soții alături. Forma se lărgește singură în sus sau în jos, după câte generații sunt.
 */
export function Hourglass({ slots, generations, down, people, selectedId, onSelectPerson, onSelectSlot, onCenter }: {
  slots: Slots; generations: number; down: DescNode; people: Record<string, PersonView>; selectedId: string | null;
  onSelectPerson: (id: string) => void; onSelectSlot: (n: number) => void; onCenter: (id: string) => void;
}) {
  const bw = 118, bh = 40, rowH = 74, colW = bw + 10;
  const upGens = Math.min(generations, 3); // părinți, bunici, străbunici: destul cât să rămână lizibil pe un ecran
  // Strămoșii ca un arbore „întors”: fiecare are loc doar cât îi trebuie, ca să nu rămână găuri pentru părinți necunoscuți.
  const toNode = (n: number): DescNode => ({ id: String(n), partners: [], children: [2 * n, 2 * n + 1].filter((c) => slots[c] && genOf(c) <= upGens).map(toNode) });
  const upTree = place(toNode(1));
  const topGen = upTree.depth;
  const { placed, leaves, depth } = place(down);
  const W = Math.max(upTree.leaves * colW, leaves * colW, 520) + 20;
  const midY = 30 + topGen * rowH;
  const H = midY + depth * rowH + bh + 60;
  const upAt = new Map(upTree.placed.map((p) => [Number(p.node.id), p]));
  // Fiecare jumătate își ia doar lățimea de care are nevoie, centrată pe persoana din mijloc.
  const upW = upTree.leaves * colW, downW = leaves * colW;
  const upPos = (n: number) => { const p = upAt.get(n)!; return { x: (W - upW) / 2 + ((p.a + p.b) / 2) * upW, y: midY - p.depth * rowH }; };
  const downPos = (p: Placed) => ({ x: (W - downW) / 2 + ((p.a + p.b) / 2) * downW, y: midY + p.depth * rowH });
  const ups = [...upAt.keys()].filter((n) => n > 1);
  const box = (x: number, y: number, p: PersonView, key: string, fill: string, sel: boolean, onClick: () => void, onDbl?: () => void) => (
    <g key={key} className={`sector${sel ? " sel" : ""}`} tabIndex={0} role="button" aria-label={p.name} onClick={onClick} onDoubleClick={onDbl} onKeyDown={keyAct(onClick)}>
      <title>{`${p.name} ${years(p)}`}</title>
      <rect x={x - bw / 2} y={y - bh / 2} width={bw} height={bh} rx={6} fill={fill} stroke="var(--line)" />
      <text x={x} y={y - 3} textAnchor="middle" fill="var(--ink)" fontSize={11.5} fontWeight={700}>{clip(p.name, 17)}</text>
      <text x={x} y={y + 12} textAnchor="middle" fill="var(--muted)" fontSize={10}>{years(p)}</text>
    </g>
  );
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Clepsidra: strămoși deasupra, urmași dedesubt" style={{ width: W, maxWidth: "none", display: "block", margin: "0 auto" }}>
      <text x={14} y={20} fill="var(--muted)" fontSize={12}>▲ Înaintea lui {people[down.id]?.givenName}</text>
      <text x={14} y={midY + rowH / 2 + 4} fill="var(--muted)" fontSize={12}>▼ După {people[down.id]?.givenName}</text>
      {ups.map((n) => {
        const a = upPos(n), b = upPos(Math.floor(n / 2));
        if (!b) return null;
        return <path key={`u${n}`} d={`M${b.x} ${b.y - bh / 2}V${(a.y + b.y) / 2}H${a.x}V${a.y + bh / 2}`} fill="none" stroke="var(--line)" strokeWidth={1.2} />;
      })}
      {placed.filter((p) => p.parent).map((p) => {
        const a = downPos(p.parent!), b = downPos(p);
        return <path key={`d${p.node.id}`} d={`M${a.x} ${a.y + bh / 2}V${(a.y + b.y) / 2}H${b.x}V${b.y - bh / 2}`} fill="none" stroke="var(--line)" strokeWidth={1.2} />;
      })}
      {ups.map((n) => { const { x, y } = upPos(n); return box(x, y, slots[n], `n${n}`, fillFor(n), selectedId === slots[n].id, () => onSelectSlot(n), () => onCenter(slots[n].id)); })}
      {placed.map((p) => {
        const person = people[p.node.id];
        if (!person) return null;
        const { x, y } = downPos(p);
        const partner = p.node.partners.map((id) => people[id]).find(Boolean);
        return (
          <g key={`p${p.node.id}`}>
            {box(x, y, person, `b${p.node.id}`, p.depth === 0 ? "var(--accent-soft)" : "var(--desc)", selectedId === p.node.id, () => onSelectPerson(p.node.id), () => onCenter(p.node.id))}
            {partner && (
              <g className={`sector${selectedId === partner.id ? " sel" : ""}`} tabIndex={0} role="button" aria-label={partner.name} onClick={() => onSelectPerson(partner.id)} onKeyDown={keyAct(() => onSelectPerson(partner.id))}>
                <text x={x} y={y + bh / 2 + 12} textAnchor="middle" fill="var(--muted)" fontSize={10}>⚭ {clip(partner.name, 20)}</text>
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
}
