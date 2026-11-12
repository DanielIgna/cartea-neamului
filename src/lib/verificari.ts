/**
 * „De verificat în arbore”: legături care par greșite sau neclare, puse ca întrebări cu răspunsuri de bifat.
 * Cine are drept de editare alege un răspuns; acela rămâne „adevărul” arborelui (nu se mai întreabă), iar schimbarea
 * se face singură (de pildă soția trece la fiul cu același nume, sau copilul primește mama aleasă).
 * Funcții pure, fără bază de date: aceleași întrebări se calculează în pagină și, la răspuns, din nou pe server.
 */
import type { Graph, Sex } from "./kinship";
import { isPlaceholder, normName } from "./family";

export type CheckPerson = { id: string; givenName: string; surname: string; birthSurname: string | null; sex: Sex; birthYear: number | null; discreet?: boolean };

/** Un răspuns posibil: `id` se trimite înapoi, `person` (dacă e) e omul ales. */
export type CheckOption = { id: string; person?: string };
export type Check =
  /** `who` (soție/soț) stă lângă `older`, dar după ani pare a fi a omonimului lui mai tânăr, `namesake` (fiul cu același nume). */
  | { kind: "sotGeneratie"; key: string; older: string; namesake: string; who: string; kids: string[]; options: CheckOption[] }
  /** Copilul `who` e trecut la `older`, dar după ani pare al lui `namesake`. */
  | { kind: "copilGeneratie"; key: string; older: string; namesake: string; who: string; options: CheckOption[] }
  /** Copilul are doar un părinte (`parent`); frații lui după acel părinte au și celălalt părinte, deci nu se știe dacă sunt frați buni. */
  | { kind: "parinteLipsa"; key: string; child: string; parent: string; role: "father" | "mother"; options: CheckOption[] }
  /** Femeia are alt nume decât tatăl ei și nu are nume de fată trecut: probabil e numele după căsătorie. */
  | { kind: "numeDeFata"; key: string; who: string; father: string; maiden: string; options: CheckOption[] };

/** Răspunsurile date până acum, pe cheia întrebării. */
export type Decisions = Record<string, { choice: string; by: string | null; at: string }>;

/** Cheia unei perechi de fișe la „Persoane trecute de două ori?”: răspunsul „nu sunt aceeași persoană” se ține aici. */
export const duplicateKey = (a: string, b: string) => `dublura:${[a, b].sort().join("|")}`;

const first = (s: string) => normName(s).split(/[\s-]+/)[0] ?? "";
const surnames = (p: CheckPerson) => new Set([normName(p.surname), normName(p.birthSurname)].filter(Boolean));
/** Același prenume și același nume de familie: tatăl și fiul cu același nume (Iosif Todea și Iosif Todea). */
const namesakes = (a: CheckPerson, b: CheckPerson) =>
  a.sex === b.sex && !!first(a.givenName) && first(a.givenName) === first(b.givenName) && [...surnames(a)].some((s) => surnames(b).has(s));

/** Vârsta peste care e greu de crezut că un om mai are copii (sau o soție cu atât mai tânără): de acolo întrebăm. */
const LATE_CHILD = { M: 55, F: 47, U: 55 } as const;
const SPOUSE_GAP = 20;

export function findChecks(g: Graph, people: Record<string, CheckPerson>, decided: Decisions = {}): Check[] {
  const out: Check[] = [];
  const P = (id: string) => people[id];
  const real = (id: string) => !!P(id) && !isPlaceholder(P(id).givenName);
  const yr = (id: string) => P(id)?.birthYear ?? null;
  const parents = (id: string) => g.parents.get(id) ?? [];
  const kids = (id: string) => g.children.get(id) ?? [];
  const partners = (id: string) => g.partners.get(id) ?? [];

  /* 1. Tatăl și fiul cu același nume: soția sau copiii fiului trecuți din greșeală la tată (des întâlnit la „Iosif Todea” și „Iosif Todea”). */
  for (const older of Object.keys(people)) {
    if (!real(older)) continue;
    for (const namesake of kids(older).filter((k) => real(k) && namesakes(P(older), P(k)))) {
      const yO = yr(older), yN = yr(namesake);
      // Mama fiului (soția tatălui din care e fiul) rămâne la tată.
      const nsParents = new Set(parents(namesake));
      for (const w of partners(older)) {
        if (nsParents.has(w) || !P(w) || partners(namesake).includes(w)) continue;
        const theirKids = kids(older).filter((c) => c !== namesake && parents(c).includes(w));
        const kidYears = theirKids.map(yr).filter((y): y is number => y !== null);
        const yW = yr(w);
        const fitsSon = (y: number, lo: number, hi: number) => yN === null || (y - yN >= lo && y - yN <= hi);
        const byWife = yW !== null && yO !== null && yW - yO >= SPOUSE_GAP && fitsSon(yW, -15, 15);
        const byKids = kidYears.length > 0 && yO !== null && Math.min(...kidYears) - yO >= LATE_CHILD[P(older).sex] && fitsSon(Math.min(...kidYears), 16, 50);
        // Fără ani: fiul nu are soție trecută, iar tatăl are două; o întrebăm, ca să hotărască omul.
        const noYears = yW === null && !kidYears.length && !partners(namesake).length && partners(older).length >= 2;
        if (!byWife && !byKids && !noYears) continue;
        const key = `sotGeneratie:${older}:${w}`;
        if (decided[key]) continue;
        out.push({ kind: "sotGeneratie", key, older, namesake, who: w, kids: theirKids,
          options: [{ id: "muta", person: namesake }, { id: "corect", person: older }] });
      }
      // Copiii trecuți doar la tată (fără mamă, sau cu o mamă care nu e soția lui), născuți când tatăl ar fi fost prea în vârstă.
      for (const c of kids(older)) {
        if (c === namesake || !P(c) || parents(c).includes(namesake)) continue;
        const others = parents(c).filter((p) => p !== older);
        if (others.some((p) => partners(older).includes(p))) continue;
        const yC = yr(c);
        if (yC === null || yO === null || yC - yO < LATE_CHILD[P(older).sex]) continue;
        if (yN !== null && (yC - yN < 16 || yC - yN > 50)) continue;
        const key = `copilGeneratie:${older}:${c}`;
        if (decided[key]) continue;
        out.push({ kind: "copilGeneratie", key, older, namesake, who: c, options: [{ id: "muta", person: namesake }, { id: "corect", person: older }] });
      }
    }
  }

  /* 2. Copil cu un singur părinte, într-o familie în care frații lui după acel părinte au și celălalt părinte: frate bun sau „după tată”? */
  for (const child of Object.keys(people)) {
    const ps = parents(child).filter((p) => P(p));
    if (ps.length !== 1) continue;
    const parent = ps[0], sex = P(parent).sex;
    if (sex === "U") continue;
    const want: Sex = sex === "M" ? "F" : "M";
    const siblings = kids(parent).filter((s) => s !== child);
    const theirOthers = new Set(siblings.flatMap((s) => parents(s).filter((p) => p !== parent && P(p)?.sex === want)));
    if (!theirOthers.size) continue;
    const key = `parinteLipsa:${child}`;
    if (decided[key]) continue;
    // Pe cine putem propune: soții părintelui și ceilalți părinți ai fraților (fără locurile goale „necunoscut”).
    const cands = [...new Set([...partners(parent).filter((p) => P(p)?.sex === want), ...theirOthers])].filter(real)
      .sort((a, b) => Number(!!P(b)?.discreet) - Number(!!P(a)?.discreet));
    out.push({ kind: "parinteLipsa", key, child, parent, role: want === "M" ? "father" : "mother",
      options: [...cands.map((c) => ({ id: `p:${c}`, person: c })), { id: "alta" }] });
  }

  /* 3. Nume după căsătorie trecut ca nume de familie, fără numele de fată. */
  for (const who of Object.keys(people)) {
    const w = P(who);
    if (w.sex !== "F" || !real(who) || normName(w.birthSurname)) continue;
    const father = parents(who).find((p) => P(p)?.sex === "M" && real(p));
    if (!father) continue;
    const maiden = (P(father).birthSurname?.trim() || P(father).surname || "").trim();
    if (!maiden || !normName(w.surname) || normName(w.surname) === normName(maiden)) continue;
    const key = `numeDeFata:${who}`;
    if (decided[key]) continue;
    out.push({ kind: "numeDeFata", key, who, father, maiden, options: [{ id: "da" }, { id: "corect" }] });
  }
  return out;
}

/** Ce schimbă în arbore un răspuns: o listă de pași mici, ușor de aplicat pe server și de verificat în teste. */
export type Step =
  | { op: "moveSpouse"; from: string; to: string; spouse: string }
  | { op: "moveChild"; from: string; to: string; child: string }
  | { op: "setParent"; child: string; parent: string; role: "father" | "mother" }
  | { op: "unknownParent"; child: string; role: "father" | "mother"; other: string }
  | { op: "birthSurname"; who: string; value: string };

export function stepsFor(c: Check, choice: string): Step[] | null {
  if (!c.options.some((o) => o.id === choice)) return null;
  switch (c.kind) {
    case "sotGeneratie":
      return choice === "muta"
        ? [{ op: "moveSpouse", from: c.older, to: c.namesake, spouse: c.who }, ...c.kids.map((k) => ({ op: "moveChild" as const, from: c.older, to: c.namesake, child: k }))]
        : [];
    case "copilGeneratie":
      return choice === "muta" ? [{ op: "moveChild", from: c.older, to: c.namesake, child: c.who }] : [];
    case "parinteLipsa": {
      if (choice === "alta") return [{ op: "unknownParent", child: c.child, role: c.role, other: c.parent }];
      const person = c.options.find((o) => o.id === choice)?.person;
      return person ? [{ op: "setParent", child: c.child, parent: person, role: c.role }] : null;
    }
    case "numeDeFata":
      return choice === "da" ? [{ op: "birthSurname", who: c.who, value: c.maiden }] : [];
  }
}
