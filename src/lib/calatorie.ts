/**
 * Călătoria în timp: o navă pleacă din prezent și coboară prin ani pe urmele neamului, oprindu-se la fiecare om de pe cele două spițe
 * (din tată în tată, la tatăl și la mama celui din centru). La fiecare oprire: cine era, ce lume era atunci în ținutul lui, ce a trăit
 * și cine mai trăia în anul acela din familie. Totul se calculează în memorie, din fișe, fără servicii plătite.
 */
import { isAncestor } from "./family";
import { kinship, type Graph, type Sex } from "./kinship";
import { storyFor, type HistEvent, type Origin, type Story } from "./vremuri";

export type Line = "ego" | "father" | "mother";
export type Person = { id: string; givenName: string; name: string; sex: Sex; birthSurname?: string | null; birthYear: number | null; deathYear: number | null; living: boolean; discreet?: boolean };

/** Cine mai trăia în anul opririi, cu vârsta de atunci și cum îi era omului de la oprire. */
export type Contemporary = { id: string; age: number; relation: string };
export type Stop = {
  id: string;
  line: Line;
  /** Anul în care aterizează nava: anul nașterii. */
  year: number;
  /** Anul nu e trecut în fișă: l-am socotit după copil (cu vreo 28 de ani înainte). */
  estimated: boolean;
  /** „tată”, „bunic”, „străbunic”: cum îi e celui din centru. */
  relation: string;
  /** A câta generație în urmă (0 = cel din centru). */
  gen: number;
  story: Story | null;
  contemporaries: Contemporary[];
};

/** Cu câți ani înainte de copil îl punem pe părintele fără an trecut. */
export const GEN_YEARS = 28;
const MAX_LIFE = 95;

/**
 * Drumul unei spițe, de la părinte în sus: din tată în tată până la strămoșul de unde pornește spița.
 * Când cineva și-a ales alt strămoș (`root`, din alegerile lui din Copac), urcăm pe drumul spre el, oricare ar fi.
 * Un „Tată necunoscut” fără părinți nu e o treaptă; dintre doi tați trecuți, urcăm prin cel cu strămoși.
 */
export function lineUp(g: Graph, from: string, root: string | null, placeholder: (id: string) => boolean = () => false): string[] {
  const path = [from];
  if (root && root !== from && isAncestor(g, root, from)) {
    for (let cur = from; cur !== root; ) {
      const next = (g.parents.get(cur) ?? []).find((p) => p === root || isAncestor(g, root, p));
      if (!next) break;
      path.push(next);
      cur = next;
    }
    return path;
  }
  const seen = new Set([from]);
  for (let cur = from; ; ) {
    const dads = (g.parents.get(cur) ?? []).filter((p) => g.sex.get(p) === "M" && !seen.has(p) && !(placeholder(p) && !(g.parents.get(p) ?? []).length));
    if (!dads.length) return path;
    cur = dads.find((p) => (g.parents.get(p) ?? []).length) ?? dads[0];
    seen.add(cur);
    path.push(cur);
  }
}

/** Tatăl și mama cuiva, cei adevărați: nu un „Tată necunoscut” rămas lângă tatăl trecut, nu o persoană discretă. */
function parentOf(g: Graph, id: string, sex: Sex, people: Record<string, Person>, placeholder: (id: string) => boolean) {
  const xs = (g.parents.get(id) ?? []).filter((p) => g.sex.get(p) === sex && people[p] && !people[p].discreet);
  return [...xs].sort((a, b) => Number(placeholder(a)) - Number(placeholder(b)) || (g.parents.get(b) ?? []).length - (g.parents.get(a) ?? []).length)[0] ?? null;
}

/** A trăit în anul `year`? Fără an al morții, socotim cel mult 95 de ani de viață (afară de cei vii). */
function aliveIn(p: Person, year: number, now: number) {
  if (p.birthYear === null || p.birthYear > year) return false;
  const end = p.deathYear ?? (p.living ? now : p.birthYear + MAX_LIFE);
  return end >= year;
}

/**
 * Opririle călătoriei, de la prezent spre trecut: cel din centru, apoi oamenii de pe cele două spițe, în ordinea anilor
 * (cel mai tânăr întâi). `patRoot`/`matRoot` = de unde pornește fiecare spiță, cum a ales fiecare în Copac (sau din tată în tată).
 */
export function journeyStops(opts: {
  g: Graph; people: Record<string, Person>; ego: string; origins?: (id: string) => Origin | null;
  patRoot?: string | null; matRoot?: string | null; placeholder?: (id: string) => boolean; now?: number; maxContemporaries?: number;
}): Stop[] {
  const { g, people, ego, patRoot = null, matRoot = null, placeholder = () => false, now = new Date().getFullYear(), maxContemporaries = 8 } = opts;
  const origin = opts.origins ?? (() => null);
  if (!people[ego]) return [];
  const father = parentOf(g, ego, "M", people, placeholder), mother = parentOf(g, ego, "F", people, placeholder);
  const lines: [Line, string[]][] = [["ego", [ego]]];
  if (father && !placeholder(father)) lines.push(["father", lineUp(g, father, patRoot, placeholder)]);
  if (mother && !placeholder(mother)) lines.push(["mother", lineUp(g, mother, matRoot, placeholder)]);
  // Cine e pe drum (pe oricare spiță) nu apare și ca „trăia atunci”: are oprirea lui.
  const onRoad = new Set(lines.flatMap(([, ids]) => ids));
  const stops: Stop[] = [];
  const seen = new Set<string>();
  const egoYear = people[ego].birthYear ?? now - 30;
  for (const [line, ids] of lines) {
    let childYear = line === "ego" ? egoYear + GEN_YEARS : egoYear;
    ids.forEach((id, i) => {
      const p = people[id];
      if (!p || seen.has(id) || placeholder(id)) return;
      seen.add(id);
      const estimated = p.birthYear === null;
      const year = p.birthYear ?? childYear - GEN_YEARS;
      childYear = year;
      const gen = line === "ego" ? 0 : i + 1;
      const relation = line === "ego" ? "" : kinship(g, ego, id)?.label ?? "strămoș";
      const story = storyFor({ birthYear: year, deathYear: p.deathYear, living: p.living }, origin(id), now);
      const contemporaries = Object.values(people)
        .filter((x) => !onRoad.has(x.id) && !x.discreet && !placeholder(x.id) && aliveIn(x, year, now))
        .map((x) => ({ x, k: kinship(g, id, x.id) }))
        .filter((c): c is { x: Person; k: NonNullable<typeof c.k> } => !!c.k)
        .sort((a, b) => (a.k.degree ?? 3.5) - (b.k.degree ?? 3.5) || (b.x.birthYear ?? 0) - (a.x.birthYear ?? 0))
        .slice(0, maxContemporaries)
        .map(({ x, k }) => ({ id: x.id, age: year - x.birthYear!, relation: k.label }));
      stops.push({ id, line, year, estimated, relation, gen, story, contemporaries });
    });
  }
  // Din prezent spre trecut; la același an, întâi spița tatălui, apoi a mamei, cei mai apropiați întâi.
  const order: Record<Line, number> = { ego: 0, father: 1, mother: 2 };
  return stops.sort((a, b) => (a.line === "ego" ? -1 : b.line === "ego" ? 1 : 0) || b.year - a.year || a.gen - b.gen || order[a.line] - order[b.line]);
}

/** „acum 94 de ani”, „acum un an”, „anul acesta”. */
export function agoWords(year: number, now = new Date().getFullYear()) {
  const n = now - year;
  if (n <= 0) return "anul acesta";
  if (n === 1) return "acum un an";
  return n < 20 ? `acum ${n} ani` : `acum ${n} de ani`;
}

/** „un an”, „7 ani”, „25 de ani”, „nou-născut”. */
export function yearsWords(n: number) {
  if (n <= 0) return "nou-născut";
  if (n === 1) return "un an";
  return n % 100 === 0 || n % 100 >= 20 ? `${n} de ani` : `${n} ani`;
}

/** Anii comunismului în România: nava face un popas când drumul trece prin ei. */
export const REGIME = { from: 1947, to: 1989 };
export type Leg = { kind: "person"; year: number; stop: Stop } | { kind: "regime"; year: number };

/**
 * Drumul navei: opririle la oameni, plus popasul „Anii minciunii și ai fricii” când cineva de pe drum a trăit în anii comunismului.
 * Popasul vine după cel din centru, la intrarea în acei ani (1989, venind dinspre prezent) sau la anul opririi de dinainte, dacă e mai vechi.
 */
export function journeyLegs(stops: Stop[], people: Record<string, Person>, now = new Date().getFullYear()): Leg[] {
  const legs: Leg[] = stops.map((stop) => ({ kind: "person", year: stop.year, stop }));
  const lived = stops.some((s) => {
    const p = people[s.id];
    const end = p?.deathYear ?? (p?.living ? now : s.year + MAX_LIFE);
    return s.year <= REGIME.to && end >= REGIME.from;
  });
  if (!lived) return legs;
  let at = legs.findIndex((l, i) => i > 0 && l.year <= REGIME.to);
  if (at < 0) at = legs.length;
  at = Math.max(1, at);
  legs.splice(at, 0, { kind: "regime", year: Math.min(REGIME.to, legs[at - 1]?.year ?? REGIME.to) });
  return legs;
}

/** Un număr mic din id, ca întrebarea și răspunsurile să fie mereu aceleași pentru același om. */
const seed = (id: string) => [...id].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
export type Quiz = { question: string; options: string[]; answer: number; year: number };

/**
 * Jocul de la fiecare oprire: „Pe care dintre acestea a apucat-o?” Una din ce a trăit omul și două din afara vieții lui,
 * din același ținut. Când nu sunt destule, nu punem întrebare.
 */
export function quizFor(stop: Stop, p: Person, events: HistEvent[], now = new Date().getFullYear()): Quiz | null {
  const s = stop.story;
  const inLife = s?.lived.filter((l) => !l.ongoing).sort((a, b) => (b.event.weight ?? 1) - (a.event.weight ?? 1))[0]?.event;
  if (!s || !inLife) return null;
  const end = p.deathYear ?? (p.living ? now : Math.min(now, stop.year + 75));
  const outside = events.filter((e) => (e.to ?? e.year) < stop.year || e.year > end);
  if (outside.length < 2) return null;
  const k = seed(p.id);
  const a = outside[k % outside.length], b = outside[(k + 1 + (k % (outside.length - 1))) % outside.length];
  if (a === b) return null;
  const answer = k % 3, options = [a.text, b.text];
  options.splice(answer, 0, inLife.text);
  return { question: `Pe care dintre acestea a apucat-o ${p.givenName || p.name}?`, options, answer, year: inLife.year };
}
