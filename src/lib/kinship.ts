/**
 * Legăturile de familie dintr-un arbore, calculate în memorie din relații:
 * părinți, copii, soți, frați și gradul de rudenie (Codul civil: numărul de generații
 * până la ascendentul comun și înapoi; în linie dreaptă, numărul de generații dintre cei doi).
 */
export type Sex = "M" | "F" | "U";
/** O legătură; la căsătorii, `start` e data căsătoriei scrisă de om și `created` momentul în care a fost trecută în arbore. */
export type Rel = { type: "parent_child" | "partnership"; a: string; b: string; start?: string | null; created?: number };
export type Graph = {
  sex: Map<string, Sex>; parents: Map<string, string[]>; children: Map<string, string[]>; partners: Map<string, string[]>;
  birth: Map<string, number | null>; unionMeta: Map<string, { start: string | null; created: number }>;
};
export const pairKey = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`);

const push = (m: Map<string, string[]>, k: string, v: string) => {
  const list = m.get(k);
  if (!list) m.set(k, [v]);
  else if (!list.includes(v)) list.push(v);
};

export function buildGraph(people: { id: string; sex: Sex; birthYear?: number | null }[], rels: Rel[]): Graph {
  const g: Graph = {
    sex: new Map(people.map((p) => [p.id, p.sex])), parents: new Map(), children: new Map(), partners: new Map(),
    birth: new Map(people.map((p) => [p.id, p.birthYear ?? null])), unionMeta: new Map(),
  };
  for (const r of rels) {
    if (r.type === "parent_child") { push(g.parents, r.b, r.a); push(g.children, r.a, r.b); }
    else {
      push(g.partners, r.a, r.b); push(g.partners, r.b, r.a);
      g.unionMeta.set(pairKey(r.a, r.b), { start: r.start ?? null, created: r.created ?? Number.MAX_SAFE_INTEGER });
    }
  }
  return g;
}

/**
 * O căsătorie (sau legătură) a unei persoane și copiii din ea. `spouse` = null adună copiii fără celălalt părinte trecut.
 * `year` = anul căsătoriei, dacă e scris, altfel anul nașterii primului copil; `order` = a câta căsătorie e (1, 2…).
 */
export type Union = { spouse: string | null; children: string[]; year: number | null; created: number; order: number };

export const yearOf = (t?: string | null) => {
  const m = t?.match(/\b(1[0-9]{3}|20[0-9]{2})\b/);
  return m ? Number(m[1]) : null;
};

/** Căsătoriile unei persoane în ordinea în care au fost: după an, când se știe; altfel după ordinea în care au fost trecute în arbore. */
export function unionsOf(g: Graph, id: string): Union[] {
  const groups = new Map<string | null, string[]>();
  for (const sp of g.partners.get(id) ?? []) groups.set(sp, []);
  for (const c of g.children.get(id) ?? []) {
    const other = (g.parents.get(c) ?? []).find((p) => p !== id) ?? null;
    groups.set(other, [...(groups.get(other) ?? []), c]);
  }
  const born = (c: string) => g.birth.get(c) ?? 9999;
  const list: Union[] = [...groups].map(([spouse, children]) => {
    const meta = spouse ? g.unionMeta.get(pairKey(id, spouse)) : undefined;
    const years = children.map((c) => g.birth.get(c) ?? null).filter((y): y is number => y !== null);
    return {
      spouse, children: [...children].sort((a, b) => born(a) - born(b)), order: 0,
      year: yearOf(meta?.start) ?? (years.length ? Math.min(...years) : null), created: meta?.created ?? Number.MAX_SAFE_INTEGER,
    };
  });
  list.sort((a, b) => (a.year !== null && b.year !== null && a.year !== b.year ? a.year - b.year : a.created - b.created));
  let n = 0;
  for (const u of list) if (u.spouse) u.order = ++n;
  return list;
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
  return relate(g, ego, other, true);
}

/** `affinity` = încearcă și legăturile prin căsătorie; la pasul următor doar de sânge, ca socrii socrilor să nu cicleze la nesfârșit. */
function relate(g: Graph, ego: string, other: string, affinity: boolean): Kinship | null {
  if (ego === other) return { label: "persoana din centru", degree: 0, up: 0, down: 0 };
  const a = ancestorsWithDepth(g, ego), b = ancestorsWithDepth(g, other);
  let best: { up: number; down: number; ancestor: string } | null = null;
  for (const [anc, up] of a) {
    const down = b.get(anc);
    if (down !== undefined && (!best || up + down < best.up + best.down)) best = { up, down, ancestor: anc };
  }
  const sex = g.sex.get(other) ?? "U";
  if (best) {
    let label = bloodLabel(best.up, best.down, sex);
    // Frați doar după un părinte (din altă căsătorie): „frate după tată”, „soră după mamă”.
    if (best.up === 1 && best.down === 1) {
      const mine = g.parents.get(ego) ?? [], theirs = g.parents.get(other) ?? [];
      const shared = mine.filter((x) => theirs.includes(x));
      if (shared.length === 1 && mine.length === 2 && theirs.length === 2)
        label += g.sex.get(shared[0]) === "M" ? " după tată" : g.sex.get(shared[0]) === "F" ? " după mamă" : " după un părinte";
    }
    return { label, degree: best.up + best.down, ...best };
  }
  if (!affinity) return null;
  // Fără ascendent comun: poate fi soț/soție sau rudă prin alianță (afin).
  if ((g.partners.get(ego) ?? []).includes(other)) return { label: pick(sex, "soț", "soție", "partener(ă)"), degree: null, up: 0, down: 0 };
  for (const partner of g.partners.get(other) ?? []) {
    const k = relate(g, ego, partner, false);
    if (k && k.degree !== null) return { label: spouseOfKin(g, ego, other, partner, k, sex), degree: null, up: k.up, down: k.down };
  }
  for (const partner of g.partners.get(ego) ?? []) {
    const k = relate(g, partner, other, false);
    if (k && k.degree !== null) return { label: kinOfSpouse(k, sex, g.sex.get(partner) ?? "U"), degree: null, up: k.up, down: k.down };
  }
  return null;
}

/** Soțul/soția unei rude de sânge: mamă vitregă, noră, ginere, cumnat(ă)… */
function spouseOfKin(g: Graph, ego: string, other: string, kin: string, k: Kinship, sex: Sex): string {
  if (k.up === 1 && k.down === 0) {
    // Soția tatălui (soțul mamei) care nu e și părintele meu: după ani, căsătoria ei a fost după cea din care sunt eu (vitregă) sau înainte (prima soție).
    const unions = unionsOf(g, kin), theirs = unions.find((u) => u.spouse === other), mine = unions.find((u) => u.children.includes(ego));
    const of = pick(g.sex.get(kin) ?? "U", "tatălui", "mamei", "părintelui");
    if (theirs && mine && theirs.year !== null && mine.year !== null && theirs.year !== mine.year) {
      if (theirs.year > mine.year) return pick(sex, "tată vitreg", "mamă vitregă", "părinte vitreg");
      const nth = ordinalOf(theirs.order, sex);
      return pick(sex, `${nth} soț al ${of}`, `${nth} soție a ${of}`, `${nth} partener al ${of}`);
    }
    return pick(sex, `soțul ${of}`, `soția ${of}`, `partenerul ${of}`);
  }
  if (k.up === 0 && k.down === 1) return pick(sex, "ginere", "noră", "soțul/soția copilului");
  if (k.up === 1 && k.down === 1) return pick(sex, "cumnat", "cumnată", "cumnat(ă)");
  if (k.up === 2 && k.down === 0) return pick(sex, "bunic vitreg", "bunică vitregă", "bunic(ă) vitreg(ă)");
  if (k.up === 2 && k.down === 1) return pick(sex, "unchi prin alianță", "mătușă prin alianță", "unchi/mătușă prin alianță");
  return `${pick(sex, "soțul", "soția", "partenerul")} unei rude (${k.label})`;
}

/** Ruda de sânge a soțului/soției: socru, soacră, cumnat(ă), fiu/fiică vitreg(ă)… */
function kinOfSpouse(k: Kinship, sex: Sex, spouseSex: Sex): string {
  if (k.up === 1 && k.down === 0) return pick(sex, "socru", "soacră", "socru/soacră");
  if (k.up === 1 && k.down === 1) return pick(sex, "cumnat", "cumnată", "cumnat(ă)");
  if (k.up === 0 && k.down === 1) return pick(sex, "fiu vitreg", "fiică vitregă", "copil vitreg");
  if (k.up === 0 && k.down === 2) return pick(sex, "nepot vitreg", "nepoată vitregă", "nepot(oată) vitreg(ă)");
  return `rudă prin alianță: ${k.label}, din neamul ${pick(spouseSex, "soțului", "soției", "soțului/soției")}`;
}

/** „prima”, „a doua”… (sau „primul”, „al doilea”…) pentru căsătorii. */
export function ordinalOf(n: number, sex: Sex = "F") {
  const f = ["", "prima", "a doua", "a treia", "a patra", "a cincea"], m = ["", "primul", "al doilea", "al treilea", "al patrulea", "al cincilea"];
  return sex === "M" ? m[n] ?? `al ${n}-lea` : f[n] ?? `a ${n}-a`;
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
