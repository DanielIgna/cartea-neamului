/**
 * Legăturile de familie dintr-un arbore, calculate în memorie din relații:
 * părinți, copii, soți, frați și gradul de rudenie (Codul civil: numărul de generații
 * până la ascendentul comun și înapoi; în linie dreaptă, numărul de generații dintre cei doi).
 */
export type Sex = "M" | "F" | "U";
export type Rel = { type: "parent_child" | "partnership"; a: string; b: string };
export type Graph = { sex: Map<string, Sex>; parents: Map<string, string[]>; children: Map<string, string[]>; partners: Map<string, string[]> };

const push = (m: Map<string, string[]>, k: string, v: string) => {
  const list = m.get(k);
  if (!list) m.set(k, [v]);
  else if (!list.includes(v)) list.push(v);
};

export function buildGraph(people: { id: string; sex: Sex }[], rels: Rel[]): Graph {
  const g: Graph = { sex: new Map(people.map((p) => [p.id, p.sex])), parents: new Map(), children: new Map(), partners: new Map() };
  for (const r of rels) {
    if (r.type === "parent_child") { push(g.parents, r.b, r.a); push(g.children, r.a, r.b); }
    else { push(g.partners, r.a, r.b); push(g.partners, r.b, r.a); }
  }
  return g;
}

export function family(g: Graph, id: string) {
  const parents = g.parents.get(id) ?? [];
  const siblings = new Set<string>();
  for (const p of parents) for (const c of g.children.get(p) ?? []) if (c !== id) siblings.add(c);
  return { parents, partners: g.partners.get(id) ?? [], children: g.children.get(id) ?? [], siblings: [...siblings] };
}

/** Distanța în generații de la `id` la fiecare ascendent al său (inclusiv el însuși, la 0). */
function ancestorsWithDepth(g: Graph, id: string, max = 30) {
  const out = new Map<string, number>([[id, 0]]);
  let frontier = [id];
  for (let d = 1; d <= max && frontier.length; d++) {
    const next: string[] = [];
    for (const x of frontier) for (const p of g.parents.get(x) ?? []) if (!out.has(p)) { out.set(p, d); next.push(p); }
    frontier = next;
  }
  return out;
}

export type Kinship = { label: string; degree: number | null; up: number; down: number; ancestor?: string };

/** Cum îi este `other` lui `ego`: „bunic”, „văr primar”, „soție”… și gradul de rudenie. */
export function kinship(g: Graph, ego: string, other: string): Kinship | null {
  if (ego === other) return { label: "persoana din centru", degree: 0, up: 0, down: 0 };
  const a = ancestorsWithDepth(g, ego), b = ancestorsWithDepth(g, other);
  let best: { up: number; down: number; ancestor: string } | null = null;
  for (const [anc, up] of a) {
    const down = b.get(anc);
    if (down !== undefined && (!best || up + down < best.up + best.down)) best = { up, down, ancestor: anc };
  }
  const sex = g.sex.get(other) ?? "U";
  if (best) return { label: bloodLabel(best.up, best.down, sex), degree: best.up + best.down, ...best };
  // Fără ascendent comun: poate fi soț/soție sau rudă prin alianță (afin).
  if ((g.partners.get(ego) ?? []).includes(other)) return { label: pick(sex, "soț", "soție", "partener(ă)"), degree: null, up: 0, down: 0 };
  for (const partner of g.partners.get(other) ?? []) {
    const k = kinship(g, ego, partner);
    if (k && k.degree !== null) return { label: `${pick(sex, "soțul", "soția", "partenerul")} unei rude (${k.label})`, degree: null, up: k.up, down: k.down };
  }
  for (const partner of g.partners.get(ego) ?? []) {
    const k = kinship(g, partner, other);
    if (k && k.degree !== null) return { label: `rudă prin alianță (${k.label} al soțului/soției)`, degree: null, up: k.up, down: k.down };
  }
  return null;
}

const pick = (sex: Sex, m: string, f: string, u: string) => (sex === "M" ? m : sex === "F" ? f : u);
const ordinal = (n: number) => (n === 1 ? "primar" : `de-al ${["", "", "doilea", "treilea", "patrulea", "cincilea", "șaselea"][n] ?? `${n}-lea`}`);

export function bloodLabel(up: number, down: number, sex: Sex): string {
  if (down === 0) {
    const names: [string, string, string][] = [["", "", ""], ["tată", "mamă", "părinte"], ["bunic", "bunică", "bunic(ă)"], ["străbunic", "străbunică", "străbunic(ă)"], ["răstrăbunic", "răstrăbunică", "răstrăbunic(ă)"]];
    if (up < names.length) return pick(sex, ...names[up]);
    return `${pick(sex, "strămoș", "strămoașă", "strămoș")} (generația ${up})`;
  }
  if (up === 0) {
    const names: [string, string, string][] = [["", "", ""], ["fiu", "fiică", "copil"], ["nepot", "nepoată", "nepot(oată)"], ["strănepot", "strănepoată", "strănepot(oată)"], ["răstrănepot", "răstrănepoată", "răstrănepot(oată)"]];
    if (down < names.length) return pick(sex, ...names[down]);
    return `urmaș (generația ${down})`;
  }
  if (up === 1 && down === 1) return pick(sex, "frate", "soră", "frate/soră");
  if (up === 1) return down === 2 ? pick(sex, "nepot de frate", "nepoată de frate", "nepot(oată) de frate") : `${pick(sex, "strănepot", "strănepoată", "strănepot(oată)")} de frate`;
  if (down === 1) {
    if (up === 2) return pick(sex, "unchi", "mătușă", "unchi/mătușă");
    if (up === 3) return pick(sex, "frate al bunicului/bunicii", "soră a bunicului/bunicii", "frate/soră a bunicilor");
    return `${pick(sex, "frate", "soră", "frate/soră")} al unui strămoș`;
  }
  if (up === down) return `${pick(sex, "văr", "vară", "văr/vară")} ${ordinal(up - 1)}`;
  const cousin = Math.min(up, down) - 1;
  return `${pick(sex, "văr", "vară", "văr/vară")} ${ordinal(cousin)}, ${up > down ? "dintr-o generație mai veche" : "dintr-o generație mai nouă"}`;
}

/** Gradul în cifre romane, ca în actele de succesiune. */
export function romanDegree(n: number) {
  const r: [number, string][] = [[10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]];
  let out = "";
  for (const [v, s] of r) while (n >= v) { out += s; n -= v; }
  return out;
}

/** Până la gradul VII se vorbește de „neam apropiat”; dincolo, legătura se recunoaște prin ascendentul comun și locul lui. */
export const CLOSE_KIN_DEGREE = 7;

/** Toate rudele de sânge ale lui `ego`, grupate pe grad, plus cele prin alianță. */
export function relativesByDegree(g: Graph, ego: string) {
  const byDegree = new Map<number, { id: string; k: Kinship }[]>();
  const affinity: { id: string; k: Kinship }[] = [];
  for (const id of g.sex.keys()) {
    if (id === ego) continue;
    const k = kinship(g, ego, id);
    if (!k) continue;
    if (k.degree === null) affinity.push({ id, k });
    else byDegree.set(k.degree, [...(byDegree.get(k.degree) ?? []), { id, k }]);
  }
  return { byDegree, affinity };
}

/** Linia de urcare spre cel mai vechi strămoș cunoscut: întâi pe tată, apoi pe orice părinte. */
export function oldestAncestor(g: Graph, id: string) {
  let cur = id;
  const seen = new Set([id]);
  for (;;) {
    const parents = (g.parents.get(cur) ?? []).filter((p) => !seen.has(p));
    if (!parents.length) return cur;
    cur = parents.find((p) => g.sex.get(p) === "M") ?? parents[0];
    seen.add(cur);
  }
}

/** Toți ascendenții lui `id`, cu generația, cei mai vechi primii. */
export function ancestorsOf(g: Graph, id: string) {
  const out = new Map<string, number>([[id, 0]]);
  let frontier = [id];
  for (let d = 1; frontier.length && d < 40; d++) {
    const next: string[] = [];
    for (const x of frontier) for (const p of g.parents.get(x) ?? []) if (!out.has(p)) { out.set(p, d); next.push(p); }
    frontier = next;
  }
  return [...out].sort((a, b) => b[1] - a[1]);
}
