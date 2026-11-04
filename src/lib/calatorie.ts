import { ancestorsOf, type Graph } from "./kinship";
import { isPlaceholder } from "./family";
import { lineRoot } from "./tree-layout";
import { eventsFor, storyFor, type HistEvent, type Origin, type Story } from "./vremuri";

/**
 * Călătoria în timp: nava pleacă din prezent și oprește la fiecare om de pe drumul spre strămoșul ales, cel mai tânăr primul.
 * La fiecare oprire: ce se știe despre el, lumea în care s-a născut, ce a trăit, cine i-a fost contemporan din neam și o întrebare.
 * Fără desen aici: doar drumul, ca să-l putem verifica în teste.
 */
export type Traveller = {
  id: string; name: string; givenName: string; sex: "M" | "F" | "U";
  birthYear: number | null; deathYear: number | null; approx: boolean; living: boolean; discreet: boolean;
  birthPlace: string | null; occupation: string | null; biography: string | null;
};
export type Quiz = { question: string; options: string[]; answer: number; year: number };
export type PersonStop = {
  kind: "person"; year: number; estimated: boolean; person: Traveller; story: Story; contemporaries: Traveller[]; childrenCount: number; quiz: Quiz | null;
};
export type RegimeStop = { kind: "regime"; year: number };
export type Stop = PersonStop | RegimeStop;

const REGIME = { from: 1947, to: 1989 };
/** Cât trăia cineva: când nu știm anul morții, socotim 75 de ani. */
export const lifeEnd = (p: Pick<Traveller, "birthYear" | "deathYear" | "living">, now: number) =>
  p.deathYear ?? (p.living ? now : Math.min(now, (p.birthYear ?? now) + 75));

/** Drumul de la cineva până la un strămoș al lui, din copil în părinte, ocolind persoanele discrete. */
export function pathTo(g: Graph, from: string, to: string, people: Record<string, Traveller>): string[] | null {
  const prev = new Map<string, string | null>([[from, null]]);
  const queue = [from];
  while (queue.length) {
    const cur = queue.shift()!;
    if (cur === to) {
      const out = [cur];
      for (let x = prev.get(cur); x; x = prev.get(x)) out.unshift(x);
      return out;
    }
    for (const p of g.parents.get(cur) ?? []) if (!prev.has(p) && people[p] && !people[p].discreet) { prev.set(p, cur); queue.push(p); }
  }
  return null;
}

/** Pe urmele cui poate porni nava: strămoșii, cei mai apropiați primii; implicit, spița din tată în tată. */
export function destinations(g: Graph, from: string, people: Record<string, Traveller>) {
  const blank = (id: string) => isPlaceholder(people[id]?.givenName ?? "");
  const options = ancestorsOf(g, from).filter(([id, gen]) => gen > 0 && !blank(id) && !!pathTo(g, from, id, people)).sort((a, b) => a[1] - b[1]);
  const top = lineRoot(g, from, blank);
  return { options, preferred: options.some(([id]) => id === top) ? top : options[options.length - 1]?.[0] ?? null };
}

/** Un număr mic din id, ca întrebarea să fie mereu aceeași pentru același om. */
const seed = (id: string) => [...id].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

/** „Pe care a trăit-o?”: una din viața lui și două din afara ei, din același ținut. Fără destule, nu punem întrebare. */
export function quizFor(p: Traveller, year: number, end: number, origin: Origin | null, story: Story): Quiz | null {
  const inLife = story.lived.filter((l) => !l.ongoing).sort((a, b) => (b.event.weight ?? 1) - (a.event.weight ?? 1))[0]?.event;
  if (!inLife) return null;
  const outside = eventsFor(origin).filter((e: HistEvent) => (e.to ?? e.year) < year || e.year > end);
  if (outside.length < 2) return null;
  const s = seed(p.id), wrong = [outside[s % outside.length], outside[(s + 1 + (s % (outside.length - 1))) % outside.length]];
  if (wrong[0] === wrong[1]) return null;
  const answer = s % 3, options = wrong.map((e) => e.text);
  options.splice(answer, 0, inLife.text);
  return { question: `Pe care dintre acestea a apucat-o ${p.givenName}?`, options, answer, year: inLife.year };
}

export function buildJourney(g: Graph, path: string[], people: Record<string, Traveller>, originOf: (id: string) => Origin | null, now = new Date().getFullYear()): Stop[] {
  const stops: Stop[] = [];
  const onPath = new Set(path);
  let childYear = now, regimeShown = false;
  for (const id of path) {
    const p = people[id];
    if (!p || isPlaceholder(p.givenName)) continue;
    // Fără an în fișă: o generație înaintea copilului, și spunem că e o socoteală.
    const estimated = p.birthYear === null;
    const year = p.birthYear ?? childYear - 28;
    childYear = year;
    const end = lifeEnd({ ...p, birthYear: year }, now);
    const origin = originOf(id);
    const story = storyFor({ birthYear: year, deathYear: p.deathYear, living: p.living }, origin, now);
    if (!story) continue;
    // Popasul despre anii comunismului vine la primul om care i-a prins și care s-a născut înainte de sfârșitul lor.
    if (!regimeShown && year <= REGIME.to && end >= REGIME.from) { stops.push({ kind: "regime", year: Math.min(REGIME.to, Math.max(year, REGIME.from)) }); regimeShown = true; }
    const contemporaries = Object.values(people)
      .filter((x) => x.birthYear !== null && !x.discreet && !onPath.has(x.id) && !isPlaceholder(x.givenName) && Math.abs(x.birthYear - year) <= 15 && lifeEnd(x, now) >= year)
      .sort((a, b) => Math.abs(a.birthYear! - year) - Math.abs(b.birthYear! - year)).slice(0, 5);
    stops.push({ kind: "person", year, estimated, person: p, story, contemporaries, childrenCount: (g.children.get(id) ?? []).length, quiz: quizFor(p, year, end, origin, story) });
  }
  return stops;
}
