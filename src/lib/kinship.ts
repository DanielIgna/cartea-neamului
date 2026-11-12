/**
 * Legăturile de familie dintr-un arbore, calculate în memorie din relații:
 * părinți, copii, soți, frați și gradul de rudenie (Codul civil: numărul de generații
 * până la ascendentul comun și înapoi; în linie dreaptă, numărul de generații dintre cei doi).
 */
import { kinLabel, romanDegree } from "./kin-words";

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
  const partners = new Set(g.partners.get(id) ?? []);
  for (const c of g.children.get(id) ?? []) {
    // Cu trei părinți trecuți (de pildă și un „Tată necunoscut” rămas lângă tatăl adevărat), copilul e al căsătoriei, nu al celui rămas.
    const others = (g.parents.get(c) ?? []).filter((p) => p !== id);
    const other = others.find((p) => partners.has(p)) ?? others.find((p) => g.sex.get(p) !== g.sex.get(id)) ?? others[0] ?? null;
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

/**
 * Legătura, fără cuvinte: din ea se scrie numele rudeniei în fiecare limbă (src/lib/kin-words.ts).
 * `blood`: `up` generații urcate de la ego până la ascendentul comun, `down` coborâte până la rudă; `half` = sexul singurului
 * părinte comun, la frații doar după un părinte. Celelalte sunt legături prin căsătorie.
 */
export type KinTerm =
  | { t: "self" }
  | { t: "blood"; up: number; down: number; half?: Sex }
  | { t: "spouse" }
  /** Soțul/soția unui părinte, care nu e și părintele lui ego: după (vitreg), înainte (a câta soție/soț) sau fără ani știuți. */
  | { t: "parentSpouse"; parent: Sex; when: "after" | "before" | "unknown"; order: number }
  | { t: "childSpouse" }
  | { t: "siblingInLaw" }
  | { t: "stepGrandparent" }
  | { t: "piblingByMarriage" }
  /** Soțul/soția unei rude de sânge mai depărtate; `kin` e ruda, cu sexul ei. */
  | { t: "kinSpouse"; kin: KinTerm; kinSex: Sex }
  | { t: "parentInLaw" }
  | { t: "stepChild" }
  | { t: "stepGrandchild" }
  /** Ruda de sânge a soțului/soției lui ego; `kin` e cum îi este soțului/soției, `spouse` sexul acestuia. */
  | { t: "spouseKin"; kin: KinTerm; spouse: Sex };

/** `label` e numele în română; în celelalte limbi se scrie din `term` și `sex` cu kinLabel (src/lib/kin-words.ts). */
export type Kinship = { label: string; term: KinTerm; sex: Sex; degree: number | null; up: number; down: number; ancestor?: string };

/**
 * Frați doar după un părinte: sexul părintelui comun („după tată” = M), sau null dacă sunt frați buni ori nu se știe.
 * Au un singur părinte comun, iar fiecare are trecut și un alt părinte (de celălalt sex), diferit de al celuilalt.
 * Un „Tată necunoscut” rămas în plus lângă tatăl adevărat nu strică socoteala.
 */
export function halfBy(g: Graph, a: string, b: string): Sex | null {
  const mine = g.parents.get(a) ?? [], theirs = g.parents.get(b) ?? [];
  const shared = mine.filter((x) => theirs.includes(x));
  if (shared.length !== 1) return null;
  const sx = g.sex.get(shared[0]) ?? "U";
  const others = (xs: string[]) => xs.filter((x) => x !== shared[0] && (sx === "U" || g.sex.get(x) !== sx));
  return others(mine).length && others(theirs).length ? sx : null;
}

/** Cum îi este `other` lui `ego`: „bunic”, „văr primar”, „soție”… și gradul de rudenie. */
export function kinship(g: Graph, ego: string, other: string): Kinship | null {
  return relate(g, ego, other, true);
}

const made = (term: KinTerm, sex: Sex, rest: Omit<Kinship, "label" | "term" | "sex">): Kinship => ({ label: kinLabel(term, sex, "ro"), term, sex, ...rest });

/** `affinity` = încearcă și legăturile prin căsătorie; la pasul următor doar de sânge, ca socrii socrilor să nu cicleze la nesfârșit. */
function relate(g: Graph, ego: string, other: string, affinity: boolean): Kinship | null {
  const sex = g.sex.get(other) ?? "U";
  if (ego === other) return made({ t: "self" }, sex, { degree: 0, up: 0, down: 0 });
  const a = ancestorsWithDepth(g, ego), b = ancestorsWithDepth(g, other);
  let best: { up: number; down: number; ancestor: string } | null = null;
  for (const [anc, up] of a) {
    const down = b.get(anc);
    if (down !== undefined && (!best || up + down < best.up + best.down)) best = { up, down, ancestor: anc };
  }
  if (best) {
    const term: KinTerm = { t: "blood", up: best.up, down: best.down };
    // Frați doar după un părinte (din altă căsătorie): „frate după tată”, „soră după mamă”.
    if (best.up === 1 && best.down === 1) {
      const h = halfBy(g, ego, other);
      if (h) term.half = h;
    }
    return made(term, sex, { degree: best.up + best.down, ...best });
  }
  if (!affinity) return null;
  // Fără ascendent comun: poate fi soț/soție sau rudă prin alianță (afin).
  if ((g.partners.get(ego) ?? []).includes(other)) return made({ t: "spouse" }, sex, { degree: null, up: 0, down: 0 });
  for (const partner of g.partners.get(other) ?? []) {
    const k = relate(g, ego, partner, false);
    if (k && k.degree !== null) return made(spouseOfKin(g, ego, other, partner, k), sex, { degree: null, up: k.up, down: k.down });
  }
  for (const partner of g.partners.get(ego) ?? []) {
    const k = relate(g, partner, other, false);
    if (k && k.degree !== null) return made(kinOfSpouse(k, g.sex.get(partner) ?? "U"), sex, { degree: null, up: k.up, down: k.down });
  }
  return null;
}

/** Soțul/soția unei rude de sânge: mamă vitregă, noră, ginere, cumnat(ă)… */
function spouseOfKin(g: Graph, ego: string, other: string, kin: string, k: Kinship): KinTerm {
  if (k.up === 1 && k.down === 0) {
    // Soția tatălui (soțul mamei) care nu e și părintele meu: după ani, căsătoria ei a fost după cea din care sunt eu (vitregă) sau înainte (prima soție).
    const unions = unionsOf(g, kin), theirs = unions.find((u) => u.spouse === other), mine = unions.find((u) => u.children.includes(ego));
    const parent = g.sex.get(kin) ?? "U";
    if (theirs && mine && theirs.year !== null && mine.year !== null && theirs.year !== mine.year)
      return { t: "parentSpouse", parent, when: theirs.year > mine.year ? "after" : "before", order: theirs.order };
    return { t: "parentSpouse", parent, when: "unknown", order: theirs?.order ?? 0 };
  }
  if (k.up === 0 && k.down === 1) return { t: "childSpouse" };
  if (k.up === 1 && k.down === 1) return { t: "siblingInLaw" };
  if (k.up === 2 && k.down === 0) return { t: "stepGrandparent" };
  if (k.up === 2 && k.down === 1) return { t: "piblingByMarriage" };
  return { t: "kinSpouse", kin: k.term, kinSex: k.sex };
}

/** Ruda de sânge a soțului/soției: socru, soacră, cumnat(ă), fiu/fiică vitreg(ă)… */
function kinOfSpouse(k: Kinship, spouseSex: Sex): KinTerm {
  if (k.up === 1 && k.down === 0) return { t: "parentInLaw" };
  if (k.up === 1 && k.down === 1) return { t: "siblingInLaw" };
  if (k.up === 0 && k.down === 1) return { t: "stepChild" };
  if (k.up === 0 && k.down === 2) return { t: "stepGrandchild" };
  return { t: "spouseKin", kin: k.term, spouse: spouseSex };
}

/** „prima”, „a doua”… (sau „primul”, „al doilea”…) pentru căsătorii. */
export function ordinalOf(n: number, sex: Sex = "F") {
  const f = ["", "prima", "a doua", "a treia", "a patra", "a cincea"], m = ["", "primul", "al doilea", "al treilea", "al patrulea", "al cincilea"];
  return sex === "M" ? m[n] ?? `al ${n}-lea` : f[n] ?? `a ${n}-a`;
}

/** Numele rudeniei de sânge în română: „bunic”, „văr primar”… (vezi kinLabel pentru celelalte limbi). */
export const bloodLabel = (up: number, down: number, sex: Sex) => kinLabel({ t: "blood", up, down }, sex, "ro");

/** Gradul în cifre romane, ca în actele de succesiune (stă în kin-words, lângă celelalte feluri de a-l scrie). */
export { romanDegree };

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

/** Cel mai vechi strămoș pe linia bărbătească, din tată în tată. Cine nu are tată trecut pornește din părintele pe care îl are. */
export function oldestAncestor(g: Graph, id: string) {
  const climb = (from: string) => {
    let cur = from;
    const seen = new Set([from]);
    for (;;) {
      const dad = (g.parents.get(cur) ?? []).find((p) => g.sex.get(p) === "M" && !seen.has(p));
      if (!dad) return cur;
      cur = dad;
      seen.add(cur);
    }
  };
  const top = climb(id), first = (g.parents.get(id) ?? [])[0];
  return top === id && first ? climb(first) : top;
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
