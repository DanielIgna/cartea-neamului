import { descendants, isAncestor, type DescNode } from "./family";
import type { Graph } from "./kinship";

/**
 * Așezarea copacului neamului, fără desen: unde stă fiecare om, pe unde trece trunchiul și cât de gros e.
 * Copacul obișnuit are o singură rădăcină (un strămoș și urmașii lui). Copacul cu două rădăcini pune neamul tatălui în stânga
 * și neamul mamei în dreapta; cele două trunchiuri se apleacă unul spre altul și se unesc în părinți, iar de acolo crește
 * o singură coroană: copiii lor și urmașii acestora.
 */

export type Pt = [number, number];
/** Un om pe desen: `depth` = generația față de rădăcina lui, `size` = câți oameni poartă ramura lui (pentru grosime). */
export type TNode = { node: DescNode; depth: number; x: number; y: number; parent?: TNode; trunk: boolean; size: number; side: -1 | 0 | 1 };
/** Familia unui om pe desen: unde stă el (P), unde stau soții lui și nodul fiecărei căsătorii, de unde pornesc copiii. */
export type Fam = { P: number; unions: { sp: string; x: number; knot: number }[]; mid: number; alone?: { x: number; dy: number; anchor: "start" | "end" } };
/** O bucată de trunchi: o curbă cu patru puncte, groasă w0 la bază și w1 sus; `root` = bucata care iese din pământ. */
export type Seg = { p: [Pt, Pt, Pt, Pt]; w0: number; w1: number; root: boolean; onPath: boolean };
export type Scene = {
  W: number; H: number; baseY: number;
  nodes: TNode[];
  fam: Map<string, Fam>;
  trunk: Seg[];
  /** Unde iese fiecare trunchi din pământ și a cui e rădăcina (una sau două). */
  bases: { x: number; root: string }[];
  /** Copacul cu două rădăcini: căsătoria părinților, în care se unesc trunchiurile. */
  couple?: { father: string; mother: string; P: number; x: number; knot: number; y: number; kids: number };
  roots: Set<string>;
  noShoots: Set<string>;
};

export const TREE = { colW: 108, rowH: 116, half: 58, leafHalf: 51, trunkH: 130, top: 70 };
const { colW, rowH, half, leafHalf, trunkH, top } = TREE;
export const thick = (s: number) => Math.min(5 + 3.4 * Math.sqrt(s), 46);

/**
 * Trunchiul e linia neamului (de la rădăcină, prin persoana din centru, mai departe pe urmașul cu cei mai mulți urmași), drept în sus.
 * Din fiecare om de pe trunchi ies, la stânga și la dreapta, ramurile fraților și ale copiilor lui; ramurile de jos ies mai lungi, spre margine,
 * cele de sus mai aproape de trunchi, ca la un copac adevărat. În fiecare ramură, fiecare urmaș primește loc cât frunzele (urmașii fără copii) de sub el.
 * `stop` = omul la care se oprește trunchiul (în copacul cu două rădăcini, tatăl sau mama).
 */
export function growTree(root: DescNode, egoPath: Set<string>, cw: number, own: (d: DescNode) => number,
  pads: (trunk: DescNode[]) => { l: number; r: number } = () => ({ l: cw * 1.3, r: cw * 1.3 }),
  prefer: (t: DescNode, c: DescNode, next?: DescNode) => -1 | 0 | 1 = () => 0, stop?: string, compact = false) {
  const leaves = new Map<DescNode, number>(), size = new Map<DescNode, number>();
  const count = (d: DescNode): void => {
    d.children.forEach(count);
    leaves.set(d, Math.max(own(d), d.children.reduce((s, c) => s + leaves.get(c)!, 0)));
    size.set(d, 1 + d.children.reduce((s, c) => s + size.get(c)!, 0));
  };
  count(root);
  const trunk: DescNode[] = [root];
  for (let cur = root; cur.children.length && cur.id !== stop; ) {
    cur = cur.children.find((c) => egoPath.has(c.id)) ?? [...cur.children].sort((a, b) => size.get(b)! - size.get(a)!)[0];
    trunk.push(cur);
  }
  // Ramurile fiecărui om de pe trunchi, împărțite stânga/dreapta ca să fie copacul cât mai echilibrat.
  const left: { d: DescNode; level: number }[] = [], right: { d: DescNode; level: number }[] = [];
  let lw = 0, rw = 0;
  trunk.forEach((t, level) => {
    const side = t.children.filter((c) => c !== trunk[level + 1]).sort((a, b) => leaves.get(b)! - leaves.get(a)!);
    for (const d of side) {
      const want = prefer(t, d, trunk[level + 1]);
      if (want === -1) { left.push({ d, level }); lw += leaves.get(d)!; }
      else if (want === 1) { right.push({ d, level }); rw += leaves.get(d)!; }
      else if (lw <= rw) { left.push({ d, level }); lw += leaves.get(d)!; } else { right.push({ d, level }); rw += leaves.get(d)!; }
    }
  });
  const pad = pads(trunk);
  if (compact) return packed(trunk, left, right, pad, cw, leaves, size);
  const trunkX = lw * cw + pad.l;
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
  for (const { d, level } of [...left].sort((a, b) => a.level - b.level)) { const w = leaves.get(d)! * cw; lay(d, level + 1, x, x + w, tnodes[level], -1); x += w; }
  // Dreapta: de la trunchi spre margine, ramurile de sus primele.
  x = trunkX + pad.r;
  for (const { d, level } of [...right].sort((a, b) => b.level - a.level)) { const w = leaves.get(d)! * cw; lay(d, level + 1, x, x + w, tnodes[level], 1); x += w; }
  return { nodes: out, width: x, depth: Math.max(...out.map((n) => n.depth)), trunkX };
}

/**
 * Copacul strâns: ramurile se așază pe rânduri, nu doar una lângă alta. Pornim cu ramurile de sus, lângă trunchi; o ramură de mai jos
 * se apropie de trunchi cât îi lasă rândurile pe care stă ea (și drumul ramurilor de deasupra), așa că o ramură scurtă de jos nu mai
 * pleacă tocmai la margine, ci stă sub celelalte. Ramurile nu se încrucișează: ramura de jos trece pe sub cele de sus.
 */
function packed(trunk: DescNode[], left: { d: DescNode; level: number }[], right: { d: DescNode; level: number }[],
  pad: { l: number; r: number }, cw: number, leaves: Map<DescNode, number>, size: Map<DescNode, number>) {
  type Local = { nodes: TNode[]; w: number; rows: Map<number, [number, number]>; rootX: number };
  const local = (d: DescNode, level: number): Local => {
    const nodes: TNode[] = [], rows = new Map<number, [number, number]>();
    const lay = (n: DescNode, depth: number, a: number, b: number, parent: TNode | undefined) => {
      const me: TNode = { node: n, depth, x: (a + b) / 2, y: 0, parent, trunk: false, size: size.get(n)!, side: 0 };
      nodes.push(me);
      const r = rows.get(depth);
      rows.set(depth, r ? [Math.min(r[0], a), Math.max(r[1], b)] : [a, b]);
      let x = a;
      for (const c of n.children) { const w = ((b - a) * leaves.get(c)!) / leaves.get(n)!; lay(c, depth + 1, x, x + w, me); x += w; }
    };
    const w = leaves.get(d)! * cw;
    lay(d, level + 1, 0, w, undefined);
    return { nodes, w, rows, rootX: nodes[0].x };
  };
  // Pe fiecare parte: cât e ocupat pe fiecare rând, măsurat de la trunchi spre margine.
  const place = (items: { d: DescNode; level: number }[], dir: -1 | 1) => {
    const used = new Map<number, number>(), out: { l: Local; o: number; level: number }[] = [];
    for (const { d, level } of [...items].sort((a, b) => b.level - a.level)) {
      const l = local(d, level);
      // dist(x) = cât de departe de trunchi stă punctul x al ramurii, dacă ramura începe la distanța o.
      const inner = (lo: number, hi: number) => (dir === 1 ? lo : l.w - hi);
      const outer = (lo: number, hi: number) => (dir === 1 ? hi : l.w - lo);
      let o = 0;
      for (const [r, [lo, hi]] of l.rows) o = Math.max(o, (used.get(r) ?? 0) - inner(lo, hi));
      for (const [r, [lo, hi]] of l.rows) used.set(r, Math.max(used.get(r) ?? 0, o + outer(lo, hi)));
      // Drumul ramurii: pe rândul părintelui, de la trunchi până sub omul ei.
      used.set(level, Math.max(used.get(level) ?? 0, o + (dir === 1 ? l.rootX : l.w - l.rootX) + cw / 2));
      out.push({ l, o, level });
    }
    return { out, extent: Math.max(0, ...out.map(({ l, o }) => o + l.w)) };
  };
  const L = place(left, -1), R = place(right, 1);
  const trunkX = L.extent + pad.l;
  const res: TNode[] = [], tnodes: TNode[] = [];
  trunk.forEach((d, i) => {
    const t: TNode = { node: d, depth: i, x: trunkX, y: 0, parent: tnodes[i - 1], trunk: true, size: size.get(d)!, side: 0 };
    tnodes.push(t); res.push(t);
  });
  for (const [P, dir] of [[L, -1], [R, 1]] as const) {
    for (const { l, o, level } of P.out) {
      const base = dir === 1 ? trunkX + pad.r + o : trunkX - pad.l - o - l.w;
      for (const n of l.nodes) { n.x += base; n.side = dir; if (!n.parent) n.parent = tnodes[level]; res.push(n); }
    }
  }
  return { nodes: res, width: trunkX + pad.r + R.extent, depth: Math.max(...res.map((n) => n.depth)), trunkX };
}

/**
 * Regulile de desen ale unei familii: cel mult două căsătorii pe desen, soții de o parte și de alta, copiii grupați sub căsătoria lor.
 * `mirror` = desenul oglindit (neamul tatălui în copacul cu două rădăcini): soțul/soția stă în stânga, spre margine.
 */
function geometry(known: (id: string) => boolean, mirror = false) {
  // Pe desen, cel mult două căsătorii (cele mai recente). Cu una: soțul/soția în dreapta. Cu două: prima în stânga persoanei, a doua în dreapta.
  const shown = (d: DescNode) => d.partners.filter(known).slice(-2);
  const sideOf = (d: DescNode, sp: string | null | undefined): -1 | 0 | 1 => {
    const sh = shown(d);
    if (!sp || !sh.includes(sp)) return 0;
    const s = sh.length === 2 && sp === sh[0] ? -1 : 1;
    return mirror ? (-s as -1 | 1) : s;
  };
  /** Cât se mută persoana față de mijlocul locului ei, ca perechea (ea și soțul/soția) să stea centrată. */
  const shift = (d: DescNode) => { const sh = shown(d); return sh.length === 1 ? sideOf(d, sh[0]) * half : 0; };
  // Copiii fiecărei familii stau împreună, sub căsătoria lor: întâi cei din căsătoria din stânga, apoi cei fără celălalt părinte desenat, apoi cei din dreapta.
  const regroup = (d: DescNode): DescNode => ({ ...d, children: [...d.children].sort((a, b) => sideOf(d, a.via) - sideOf(d, b.via)).map(regroup) });
  // Pe trunchi, nodul căsătoriei din care coboară următorul om de pe linie stă pe trunchi.
  const leadSide = (t: DescNode, next?: DescNode) => (next ? sideOf(t, next.via) : 0);
  const footprint = (d: DescNode, P: number) => {
    const xs = shown(d).map((sp) => P + sideOf(d, sp) * 2 * half);
    return { l: Math.min(P, ...xs) - leafHalf, r: Math.max(P, ...xs) + leafHalf };
  };
  const own = (d: DescNode) => 1 + shown(d).length;
  const pads = (trunk: DescNode[]) => {
    let l = colW * 1.3, r = colW * 1.3;
    trunk.forEach((t, i) => { const f = footprint(t, -leadSide(t, trunk[i + 1]) * half); l = Math.max(l, -f.l + 14); r = Math.max(r, f.r + 14); });
    return { l, r };
  };
  // Pe trunchi, dacă un om are copii din mai multe căsătorii, fiecare grup crește pe partea soțului/soției lui; altfel ramurile se împart echilibrat.
  const prefer = (t: DescNode, c: DescNode, next?: DescNode): -1 | 0 | 1 => {
    const groups = new Set([...t.children.map((x) => (shown(t).includes(x.via ?? "") ? x.via : null))]);
    if (groups.size < 2) return 0;
    const s = sideOf(t, c.via);
    return s !== 0 ? s : shown(t).length === 2 ? 0 : leadSide(t, next) === 1 ? -1 : 0;
  };
  /** Familia unui om așezat cu persoana în P: soții la stânga/dreapta, nodul fiecărei căsătorii între ei. */
  const famAt = (d: DescNode, P: number): Fam => {
    const unions = shown(d).map((id) => { const s = sideOf(d, id); return { sp: id, x: P + s * 2 * half, knot: P + s * half }; });
    const f = footprint(d, P);
    return { P, unions, mid: (f.l + f.r) / 2 };
  };
  return { shown, sideOf, shift, regroup, leadSide, footprint, own, pads, prefer, famAt };
}

/** Copacul cu o singură rădăcină: trunchiul de la strămoșul ales, prin persoana din centru, până la cel mai tânăr. */
export function layoutSingle(root0: DescNode, known: (id: string) => boolean, egoPath: Set<string>, compact = false): Scene {
  const G = geometry(known);
  const root = G.regroup(root0);
  const grown = growTree(root, egoPath, colW, G.own, G.pads, G.prefer, undefined, compact);
  const W0 = grown.width, W = Math.max(W0, 680), shift = (W - W0) / 2;
  const H = top + grown.depth * rowH + trunkH + 70;
  const baseY = H - 46;
  for (const n of grown.nodes) { n.x += shift; n.y = baseY - trunkH - n.depth * rowH; }
  const tx = grown.trunkX + shift;
  const trunkNodes = grown.nodes.filter((n) => n.trunk);
  const rootN = trunkNodes[0];
  const fam = new Map(grown.nodes.map((n) => {
    const P = n.trunk ? tx - G.leadSide(n.node, trunkNodes[n.depth + 1]?.node) * half : n.x - G.shift(n.node);
    return [n.node.id, G.famAt(n.node, P)] as const;
  }));
  const trunk: Seg[] = [
    { p: [[tx, baseY + 4], [tx, baseY - trunkH * 0.4], [tx, rootN.y + trunkH * 0.3], [tx, rootN.y]], w0: thick(rootN.size) * 1.7, w1: thick(rootN.size), root: true, onPath: false },
    ...trunkNodes.slice(1).map((n): Seg => ({
      p: [[tx, n.parent!.y + 2], [tx, n.parent!.y - rowH * 0.4], [tx, n.y + rowH * 0.4], [tx, n.y]], w0: thick(n.parent!.size), w1: thick(n.size), root: false, onPath: egoPath.has(n.node.id),
    })),
  ];
  return { W, H, baseY, nodes: grown.nodes, fam, trunk, bases: [{ x: tx, root: root.id }], roots: new Set([root.id]), noShoots: new Set() };
}

/* ---------- Copacul cu două rădăcini ---------- */

export type TwinParts = {
  /** Neamul tatălui, fără familia comună a părinților. */
  left: DescNode;
  /** Neamul mamei, fără familia comună a părinților. */
  right: DescNode;
  /** Familia comună: un nod închipuit (căsătoria părinților) cu copiii lor dedesubt. */
  crown: DescNode;
  father: string; mother: string; patRoot: string; matRoot: string;
};

const findNode = (d: DescNode, id: string): DescNode | null => (d.id === id ? d : d.children.reduce<DescNode | null>((f, c) => f ?? findNode(c, id), null));
const idsOf = (d: DescNode, out = new Set<string>()) => { out.add(d.id); d.children.forEach((c) => idsOf(c, out)); return out; };

/** Taie din copac familia comună a părinților (copiii lor și pe celălalt părinte), care se desenează o singură dată, în coroană. */
function cut(d: DescNode, at: string, other: string): DescNode {
  if (d.id === at) return { ...d, partners: d.partners.filter((p) => p !== other), children: d.children.filter((c) => c.via !== other) };
  return { ...d, children: d.children.map((c) => cut(c, at, other)) };
}
/** Scoate ramurile care au fost deja desenate în celălalt neam (de pildă când un frate al tatălui s-a căsătorit cu o soră a mamei). */
function without(d: DescNode, drawn: Set<string>): DescNode {
  return { ...d, children: d.children.filter((c) => !drawn.has(c.id)).map((c) => without(c, drawn)) };
}

/**
 * Cel mai vechi strămoș pe linia bărbătească: spița urcă doar din tată în tată, și la tatăl tău, și la mama ta (prin tatăl ei).
 * Nu trece niciodată pe la o femeie: fără tată legat, spița se oprește acolo, iar cine vrea alt strămoș îl alege din „Trunchiul”.
 * Un „Tată necunoscut” fără părinți nu e o rădăcină bună; dintre doi tați trecuți, urcăm prin cel cu strămoși.
 */
export function lineRoot(g: Graph, id: string, placeholder: (id: string) => boolean = () => false) {
  let cur = id;
  const seen = new Set([id]);
  for (;;) {
    const dads = (g.parents.get(cur) ?? []).filter((p) => g.sex.get(p) === "M" && !seen.has(p) && !(placeholder(p) && !(g.parents.get(p) ?? []).length));
    if (!dads.length) return cur;
    cur = dads.find((p) => (g.parents.get(p) ?? []).length) ?? dads[0];
    seen.add(cur);
  }
}

/**
 * Cele două spițe ale cuiva: neamul tatălui (de la `patRoot`) și neamul mamei (de la `matRoot`), legate prin părinți.
 * Nu se poate (null) când nu are ambii părinți desenați (unul lipsește sau e o persoană discretă), sau când neamurile
 * se întâlnesc deja mai jos (mama e și ea urmașă a rădăcinii tatălui): atunci un singur copac le arată pe amândouă.
 */
export function twinParts(g: Graph, drawn: (id: string) => boolean, ego: string, patRoot?: string | null, matRoot?: string | null,
  placeholder: (id: string) => boolean = () => false): TwinParts | null {
  const parents = g.parents.get(ego) ?? [];
  // Cu doi tați trecuți (de pildă și un „Tată necunoscut” rămas pe lângă tatăl adevărat), spița urcă prin cel adevărat.
  // La fel cu doi tați adevărați (o a doua fișă a lui): întâi cel care e soțul mamei, apoi cel cu strămoși.
  const pick = (sex: string) => {
    const xs = parents.filter((p) => g.sex.get(p) === sex);
    const partnerOfOther = (p: string) => parents.some((q) => q !== p && g.sex.get(q) !== sex && (g.partners.get(p) ?? []).includes(q));
    const score = (p: string) => (placeholder(p) ? 0 : 4) + (partnerOfOther(p) ? 2 : 0) + ((g.parents.get(p) ?? []).length ? 1 : 0);
    return [...xs].sort((a, b) => score(b) - score(a))[0];
  };
  const father = pick("M"), mother = pick("F");
  if (!father || !mother || !drawn(father) || !drawn(mother)) return null;
  const pr = patRoot && (patRoot === father || isAncestor(g, patRoot, father)) ? patRoot : lineRoot(g, father, placeholder);
  const mr = matRoot && (matRoot === mother || isAncestor(g, matRoot, mother)) ? matRoot : lineRoot(g, mother, placeholder);
  const P = descendants(g, drawn, pr), M = descendants(g, drawn, mr);
  if (findNode(P, mother) || findNode(M, father)) return null;
  const f = findNode(P, father);
  if (!f || !findNode(M, mother)) return null;
  const shared = f.children.filter((c) => c.via === mother);
  if (!shared.some((c) => c.id === ego)) return null;
  const left = cut(P, father, mother);
  const right = without(cut(M, mother, father), idsOf(P));
  return { left, right, crown: { id: `${father}+${mother}`, partners: [], children: shared }, father, mother, patRoot: pr, matRoot: mr };
}

/** Linia de pe trunchiul unei spițe: de la rădăcină până la tată (sau mamă), pe drumul strămoșilor persoanei din centru, ca în `growTree`. */
function lineTo(root: DescNode, stop: string, egoPath: Set<string>) {
  const line = [root];
  for (let cur = root; cur.children.length && cur.id !== stop; ) { cur = cur.children.find((c) => egoPath.has(c.id)) ?? cur.children[0]; line.push(cur); }
  return line;
}

/**
 * Pe ce parte crește fiecare ramură de pe trunchiul unei spițe: spre margine sau spre mijloc, spre celălalt neam. Spre mijloc merg doar
 * ramurile care se termină cu cel puțin două rânduri sub părinți, ca trunchiurile să se poată apleca liber unul spre altul deasupra lor;
 * dintre ele, câte trebuie ca cele două părți ale trunchiului să fie cam la fel de late. `first` = rândul rădăcinii, `inner` = partea dinspre mijloc.
 */
function sides(line: DescNode[], first: number, gen: number, own: (d: DescNode) => number, inner: -1 | 1) {
  const height = (d: DescNode): number => d.children.reduce((h, c) => Math.max(h, 1 + height(c)), 0);
  const leaves = (d: DescNode): number => Math.max(own(d), d.children.reduce((s, c) => s + leaves(c), 0));
  const outer = -inner as -1 | 1, side = new Map<string, -1 | 1>(), free: [string, number][] = [];
  let out = 0, inn = 0;
  line.forEach((t, i) => {
    for (const c of t.children) {
      if (c === line[i + 1]) continue;
      if (first + i + 1 + height(c) <= gen - 3) free.push([c.id, leaves(c)]);
      else { side.set(c.id, outer); out += leaves(c); }
    }
  });
  for (const [id, w] of free) if (inn < out) { side.set(id, inner); inn += w; } else { side.set(id, outer); out += w; }
  return side;
}

/**
 * Copacul cu două rădăcini, așezat. Neamul tatălui stă în stânga și e oglindit (soțiile spre margine), neamul mamei în dreapta,
 * așa că la mijloc cele două linii de sânge stau față în față. Ramurile cresc mai ales spre margini; cele scurte de jos pot crește
 * și spre mijloc, sub coroană. Trunchiurile se apleacă unul spre altul (bunicii se apropie, părinții se unesc), iar coroana comună
 * crește din nodul părinților, la mijloc între ele. Bucățile se apropie rând cu rând cât pot, fără ca vreo familie să calce peste alta.
 */
export function layoutTwin(parts: TwinParts, known: (id: string) => boolean, egoPath: Set<string>, compact = false): Scene {
  const GL = geometry(known, true), G = geometry(known);
  const left = GL.regroup(parts.left), right = G.regroup(parts.right);
  const lineL = lineTo(left, parts.father, egoPath), lineR = lineTo(right, parts.mother, egoPath);
  // Rândurile, numărate de jos: rădăcina cea mai veche stă pe primul rând, părinții pe rândul gen − 1.
  const gen = Math.max(lineL.length, lineR.length);
  const sL = sides(lineL, gen - lineL.length, gen, GL.own, 1), sR = sides(lineR, gen - lineR.length, gen, G.own, -1);
  const L = growTree(left, egoPath, colW, GL.own, GL.pads, (_t, c) => sL.get(c.id) ?? -1, parts.father, compact);
  const R = growTree(right, egoPath, colW, G.own, G.pads, (_t, c) => sR.get(c.id) ?? 1, parts.mother, compact);
  const C = growTree(G.regroup(parts.crown), egoPath, colW, G.own, G.pads, G.prefer, undefined, compact);
  type Grown = typeof L;
  const geo = (B: Grown) => (B === L ? GL : G);
  const trunkOf = (B: Grown) => B.nodes.filter((n) => n.trunk);
  const tL = trunkOf(L), tR = trunkOf(R), tC = trunkOf(C);
  const fatherN = tL[tL.length - 1], motherN = tR[tR.length - 1], coupleN = tC[0];
  const first = new Map<Grown, number>([[L, gen - tL.length], [R, gen - tR.length], [C, gen - 1]]);
  const row = (B: Grown, n: TNode) => first.get(B)! + n.depth;
  // Unde stă fiecare om în bucata lui, cu trunchiul în `x` (înainte de a muta bucățile).
  const placeIn = (B: Grown, n: TNode, x = B.trunkX) => {
    const g = geo(B);
    return n.trunk ? x - g.leadSide(n.node, trunkOf(B)[n.depth + 1]?.node) * half : n.x - g.shift(n.node);
  };
  // Tatăl și mama mai pot avea câte o altă căsătorie desenată: a tatălui în stânga lui, a mamei în dreapta ei.
  const otherF = GL.shown(fatherN.node).slice(-1), otherM = G.shown(motherN.node).slice(-1);
  type Contour = Map<number, [number, number]>;
  const widen = (m: Contour, r: number, a: number, b: number) => { const c = m.get(r); m.set(r, c ? [Math.min(c[0], a), Math.max(c[1], b)] : [a, b]); };
  // Locul ocupat pe fiecare rând: oamenii cu soții lor, plus drumul ramurilor, care pleacă în lături pe rândul părintelui și abia apoi urcă.
  const contour = (B: Grown, skip: TNode) => {
    const m: Contour = new Map(), g = geo(B);
    for (const n of B.nodes) {
      const f = g.footprint(n.node, placeIn(B, n)), r = row(B, n);
      if (n !== skip) widen(m, r, f.l, f.r);
      if (n.parent && !n.trunk) widen(m, r - 1, f.l, f.r);
    }
    return m;
  };
  const cL = contour(L, fatherN), cR = contour(R, motherN), cC = contour(C, coupleN);
  // Căsătoria părinților: tatăl la stânga nodului, mama la dreapta, plus celelalte căsătorii ale lor.
  widen(cC, gen - 1, C.trunkX - half - leafHalf - (otherF.length ? 2 * half : 0), C.trunkX + half + leafHalf + (otherM.length ? 2 * half : 0));
  const gap = 26, minSep = 420;
  /** Cât trebuie mutată bucata B ca să stea, pe fiecare rând comun, la dreapta bucății A (mutată cu oA). */
  const need = (A: Contour, oA: number, B: Contour) => {
    let o = -Infinity;
    for (const [r, [, amax]] of A) { const b = B.get(r); if (b) o = Math.max(o, amax + oA + gap - b[0]); }
    return o;
  };
  // Neamul tatălui rămâne pe loc. Coroana: la dreapta lui pe fiecare rând, iar tatăl nu mai la stânga de trunchiul lui.
  // Neamul mamei: la dreapta celorlalte două, cu trunchiul la cel puțin `minSep` de al tatălui, iar mama nu mai la dreapta de trunchiul ei.
  // Părinții stau la mijloc între cele două trunchiuri: coroana se mută spre mijloc, iar neamul mamei se dă la o parte cât e nevoie.
  const oL = 0, oC0 = Math.max(need(cL, oL, cC), L.trunkX + 6 + half - C.trunkX);
  let oC = oC0, oR = 0;
  for (let i = 0; i < 16; i++) {
    oR = Math.max(need(cL, oL, cR), need(cC, oC, cR), L.trunkX + oL + minSep - R.trunkX, C.trunkX + oC + half + 6 - R.trunkX,
      2 * (C.trunkX + oC) - (L.trunkX + oL) - R.trunkX);
    const centred = Math.max(oC0, (L.trunkX + oL + R.trunkX + oR) / 2 - C.trunkX);
    if (Math.abs(centred - oC) < 0.5) break;
    oC = centred;
  }
  const spans: [number, number][] = [];
  for (const [c, o] of [[cL, oL], [cC, oC], [cR, oR]] as const) for (const [, [a, b]] of c) spans.push([a + o, b + o]);
  spans.push([L.trunkX + oL - leafHalf, L.trunkX + oL + leafHalf], [R.trunkX + oR - leafHalf, R.trunkX + oR + leafHalf]);
  const minX = Math.min(...spans.map((s) => s[0])), maxX = Math.max(...spans.map((s) => s[1]));
  const W0 = maxX - minX + 48, W = Math.max(W0, 680), sx = 24 - minX + (W - W0) / 2;
  const off = new Map<Grown, number>([[L, oL + sx], [C, oC + sx], [R, oR + sx]]);
  const depth = Math.max(...[L, C, R].flatMap((B) => B.nodes.map((n) => row(B, n))));
  const H = top + depth * rowH + trunkH + 70;
  const baseY = H - 46;
  const Lx = L.trunkX + off.get(L)!, Rx = R.trunkX + off.get(R)!, mergeX = C.trunkX + off.get(C)!;
  const fx = mergeX - half, mx = mergeX + half;
  const nodes: TNode[] = [];
  for (const B of [L, C, R]) for (const n of B.nodes) { n.x += off.get(B)!; n.y = baseY - trunkH - row(B, n) * rowH; nodes.push(n); }

  // Bunicii se apropie unul de altul, ca trunchiurile să se aplece pe două rânduri, nu dintr-odată; doar dacă sub ei, la mijloc, nu stă nimeni.
  const gpL = tL.length > 1 ? tL[tL.length - 2] : null, gpR = tR.length > 1 ? tR[tR.length - 2] : null;
  const crowded = [...L.nodes.map((n) => [L, n] as const), ...R.nodes.map((n) => [R, n] as const)]
    .some(([B, n]) => !n.trunk && row(B, n) >= gen - 3 && row(B, n) <= gen - 2 && (B === L ? n.x > Lx : n.x < Rx));
  let leanL = gpL ? (fx - Lx) / 2 : 0, leanR = gpR ? (Rx - mx) / 2 : 0;
  if (crowded) leanL = leanR = 0;
  else {
    // Cât loc e între ei pe rândul bunicilor: până la familia celuilalt bunic, sau până la trunchiul celuilalt părinte, dacă acolo e rădăcina.
    const fl = gpL && GL.footprint(gpL.node, placeIn(L, gpL, Lx)), fr = gpR && G.footprint(gpR.node, placeIn(R, gpR, Rx));
    const room = (fr ? fr.l : mx - 40) - (fl ? fl.r : fx + 40) - gap, want = leanL + leanR;
    if (want > room) { const k = Math.max(room, 0) / want; leanL *= k; leanR *= k; }
  }
  const trunkXs = (t: TNode[], x: number, lean: number, end: number) => t.map((_, i) => (i === t.length - 1 ? end : i === t.length - 2 ? x + lean : x));
  const xsL = trunkXs(tL, Lx, leanL, fx), xsR = trunkXs(tR, Rx, -leanR, mx);

  const fam = new Map<string, Fam>();
  fam.set(coupleN.node.id, { P: fx, unions: [{ sp: parts.mother, x: mx, knot: mergeX }], mid: mergeX });
  coupleN.x = mergeX;
  {
    const unions = otherF.map((sp) => ({ sp, x: fx - 2 * half, knot: fx - half }));
    fam.set(fatherN.node.id, { P: fx, unions, mid: fx - (unions.length ? half : 0), ...(unions.length ? {} : { alone: { x: fx - 56, dy: 4, anchor: "end" as const } }) });
    fatherN.x = fx;
  }
  {
    const unions = otherM.map((sp) => ({ sp, x: mx + 2 * half, knot: mx + half }));
    fam.set(motherN.node.id, { P: mx, unions, mid: mx + (unions.length ? half : 0), ...(unions.length ? {} : { alone: { x: mx + 56, dy: 4, anchor: "start" as const } }) });
    motherN.x = mx;
  }
  // Ceilalți de pe trunchiuri: nodul căsătoriei din care coboară următorul om de pe linie stă pe trunchi; acolo se oprește și bucata de trunchi.
  const ends = (B: Grown, t: TNode[], xs: number[]) => t.map((n, i) => {
    if (i === t.length - 1) return xs[i];
    const g = geo(B), P = placeIn(B, n, xs[i]), f = g.famAt(n.node, P);
    // De partea tatălui, „k copii” fără soț pe desen stă spre margine, în stânga.
    fam.set(n.node.id, B === L && !f.unions.length ? { ...f, alone: { x: P - 56, dy: 4, anchor: "end" } } : f);
    n.x = xs[i];
    return f.unions.find((u) => u.sp === t[i + 1].node.via)?.knot ?? P;
  });
  const endL = ends(L, tL, xsL), endR = ends(R, tR, xsR);
  for (const B of [L, C, R]) for (const n of B.nodes) if (!n.trunk) fam.set(n.node.id, geo(B).famAt(n.node, n.x - geo(B).shift(n.node)));
  for (const n of tC.slice(1)) fam.set(n.node.id, G.famAt(n.node, n.x - G.leadSide(n.node, tC[n.depth + 1]?.node) * half));

  // Grosimea: cele două trunchiuri duc fiecare și coroana comună, ca să se vadă că din ele crește familia părinților.
  const crownSize = coupleN.size - 1;
  const sz = (n: TNode) => n.size + crownSize;
  const side = (t: TNode[], xs: number[]): Seg[] => [
    { p: [[xs[0], baseY + 4], [xs[0], baseY - trunkH * 0.4], [xs[0], t[0].y + trunkH * 0.3], [xs[0], t[0].y]], w0: thick(sz(t[0])) * 1.7, w1: thick(sz(t[0])), root: true, onPath: false },
    ...t.slice(1).map((n, i): Seg => {
      const a = xs[i], b = xs[i + 1], k = a === b ? 0.4 : 0.5, p = n.parent!;
      return { p: [[a, p.y + 2], [a, p.y - rowH * k], [b, n.y + rowH * k], [b, n.y]], w0: thick(sz(p)), w1: thick(sz(n)), root: false, onPath: egoPath.has(n.node.id) };
    }),
  ];
  const trunk: Seg[] = [
    ...side(tL, endL),
    ...side(tR, endR),
    ...tC.slice(1).map((n): Seg => ({
      p: [[mergeX, n.parent!.y + 2], [mergeX, n.parent!.y - rowH * 0.4], [mergeX, n.y + rowH * 0.4], [mergeX, n.y]], w0: thick(n.parent!.size), w1: thick(n.size), root: false, onPath: egoPath.has(n.node.id),
    })),
  ];
  return {
    W, H, baseY, nodes, fam, trunk,
    bases: [{ x: endL[0], root: tL[0].node.id }, { x: endR[0], root: tR[0].node.id }],
    couple: { father: parts.father, mother: parts.mother, P: fx, x: mx, knot: mergeX, y: coupleN.y, kids: parts.crown.children.length },
    roots: new Set([tL[0].node.id, tR[0].node.id]),
    noShoots: new Set([parts.father, parts.mother, coupleN.node.id]),
  };
}

/**
 * Copacul strâns: trunchiul (linia neamului, aleasă ca în `growTree`) își păstrează toți copiii, iar ramurile din lături (frații celor de pe
 * trunchi) apar doar cu omul lor; urmașii lor stau strânși până îi desfaci (`open`). `hidden` = câți urmași are fiecare ramură strânsă.
 * Așa copacul nu se mai întinde în lături cât toate frunzele verilor, ci cât oamenii de pe linie și frații lor.
 */
/** Frunza care ține locul fraților strânși ai cuiva de pe linie: `more:` + id-ul părintelui. */
export const MORE = "more:";

export function fold(root: DescNode, egoPath: Set<string>, open: Set<string>, stop?: string) {
  const size = new Map<DescNode, number>();
  const count = (d: DescNode): number => { const n = 1 + d.children.reduce((s, c) => s + count(c), 0); size.set(d, n); return n; };
  count(root);
  const trunk = new Set<string>([root.id]);
  for (let cur = root; cur.children.length && cur.id !== stop; ) {
    cur = cur.children.find((c) => egoPath.has(c.id)) ?? [...cur.children].sort((a, b) => size.get(b)! - size.get(a)!)[0];
    trunk.add(cur.id);
  }
  const hidden = new Map<string, number>();
  const cut = (d: DescNode): DescNode => {
    if (trunk.has(d.id) && !open.has(MORE + d.id)) {
      // O familie mare pe linie (8–13 frați): pe desen rămân cei de pe linie și primii trei frați; ceilalți stau într-o frunză „+N”.
      const side = d.children.filter((c) => !trunk.has(c.id) && !egoPath.has(c.id));
      if (side.length > 4) {
        const rest = side.slice(3), drop = new Set(rest);
        const more: DescNode = { id: MORE + d.id, partners: [], children: [], via: rest[0].via ?? null };
        hidden.set(more.id, rest.length);
        const kept = d.children.filter((c) => !drop.has(c)).map(cut);
        const at = kept.reduce((i, c, k) => (c.via === more.via ? k + 1 : i), kept.length);
        return { ...d, children: [...kept.slice(0, at), more, ...kept.slice(at)] };
      }
    }
    if (trunk.has(d.id) || egoPath.has(d.id) || open.has(d.id) || !d.children.length) return { ...d, children: d.children.map(cut) };
    hidden.set(d.id, size.get(d)! - 1);
    return { ...d, children: [] };
  };
  return { root: cut(root), hidden };
}

/** Același lucru pentru copacul cu două rădăcini: fiecare spiță până la părinte, plus coroana cu copiii părinților. */
export function foldTwin(parts: TwinParts, egoPath: Set<string>, open: Set<string>) {
  const L = fold(parts.left, egoPath, open, parts.father), R = fold(parts.right, egoPath, open, parts.mother), C = fold(parts.crown, egoPath, open);
  return { parts: { ...parts, left: L.root, right: R.root, crown: C.root }, hidden: new Map([...L.hidden, ...R.hidden, ...C.hidden]) };
}
