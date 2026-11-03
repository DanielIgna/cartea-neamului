import { unionsOf, type Graph, type Sex } from "./kinship";

/**
 * Un urmaș, pentru desene: `partners` = soții care se desenează, în ordinea căsătoriilor;
 * `via` = celălalt părinte al lui, dacă e unul dintre soții desenați ai părintelui (copilul pornește din nodul căsătoriei lor);
 * `apart` = copil dintr-o altă relație (cu o persoană discretă sau necunoscută) a unui părinte care are soț/soție desenat(ă):
 * ramura lui pornește discret doar din părinte.
 */
export type DescNode = { id: string; partners: string[]; children: DescNode[]; via?: string | null; apart?: boolean };

/**
 * Urmașii unei persoane, pe oricâte generații. Soții apar în ordinea căsătoriilor, iar copiii pe căsătorii (fiecare grup în ordinea nașterii).
 * Soții care nu se desenează (`drawn` = false: persoane discrete) lipsesc din desen, iar copiii lor rămân legați doar de părintele din neam.
 */
export function descendants(g: Graph, drawn: (id: string) => boolean, id: string, depth = 0, seen = new Set<string>(), via: string | null = null, apart = false): DescNode {
  seen.add(id);
  const unions = unionsOf(g, id);
  const partners = unions.map((u) => u.spouse).filter((s): s is string => !!s && drawn(s));
  const children: DescNode[] = [];
  if (depth < 30) for (const u of unions) {
    const through = u.spouse && partners.includes(u.spouse) ? u.spouse : null;
    for (const c of u.children) if (!seen.has(c)) children.push(descendants(g, drawn, c, depth + 1, seen, through, !through && partners.length > 0));
  }
  return { id, partners, children, via, ...(apart ? { apart } : {}) };
}

/** Copiii unei persoane împărțiți pe căsătorii, pentru fișă: soții discreți nu sunt numiți, copiii lor apar „din altă relație”. */
export function childrenByUnion(g: Graph, drawn: (id: string) => boolean, id: string) {
  const unions = unionsOf(g, id);
  const named = unions.filter((u) => u.spouse && drawn(u.spouse) && u.children.length);
  const other = unions.filter((u) => !(u.spouse && drawn(u.spouse))).flatMap((u) => u.children);
  return { named: named.map((u) => ({ spouse: u.spouse!, children: u.children })), other };
}

/* ---------- Fișe trecute de două ori ---------- */

/** Numele fără diacritice și fără majuscule, ca „Onița”, „Oniţa” și „Onita” să fie același nume. */
export const normName = (s: string | null | undefined) => (s ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
const firstName = (s: string) => normName(s).split(/[\s-]+/)[0] ?? "";
/** Părinții fără nume puși automat („Tată necunoscut”, „Mamă necunoscută”): nu sunt dubluri unii ai altora și nu primesc fișă în carte. */
export const isPlaceholder = (given: string) => /^(tata|mama) necunoscut|^necunoscut/.test(normName(given));

export type Lookalike = { id: string; givenName: string; surname: string; birthSurname: string | null; sex: Sex; birthYear: number | null };

/** Arată ca aceeași persoană: același prenume, nume de familie potrivite (sau unul lipsă), ani de naștere apropiați (sau necunoscuți), același sex. */
export function sameLooking(a: Lookalike, b: Lookalike) {
  if (a.sex !== "U" && b.sex !== "U" && a.sex !== b.sex) return false;
  const fa = firstName(a.givenName);
  if (!fa || fa !== firstName(b.givenName) || isPlaceholder(a.givenName) || isPlaceholder(b.givenName)) return false;
  const sa = normName(a.surname), sb = normName(b.surname);
  const surnames = !sa || !sb || sa === sb || sa === normName(b.birthSurname) || sb === normName(a.birthSurname);
  return surnames && (a.birthYear === null || b.birthYear === null || Math.abs(a.birthYear - b.birthYear) <= 3);
}

/** Este `anc` strămoșul lui `id`? */
function isAncestor(g: Graph, anc: string, id: string) {
  const seen = new Set<string>();
  for (let frontier = g.parents.get(id) ?? []; frontier.length; ) {
    if (frontier.includes(anc)) return true;
    const next: string[] = [];
    for (const x of frontier) if (!seen.has(x)) { seen.add(x); next.push(...(g.parents.get(x) ?? [])); }
    frontier = next;
  }
  return false;
}

/** Rudele apropiate ale unei persoane: soți, părinți, copii și ceilalți părinți ai copiilor ei. */
function near(g: Graph, id: string) {
  const out = new Set([...(g.partners.get(id) ?? []), ...(g.parents.get(id) ?? []), ...(g.children.get(id) ?? [])]);
  for (const c of g.children.get(id) ?? []) for (const p of g.parents.get(c) ?? []) if (p !== id) out.add(p);
  return out;
}

/**
 * Perechi de fișe care par aceeași persoană trecută de două ori (de pildă bunica trecută o dată ca mama a 8 copii și încă o dată ca mama altor 3):
 * arată la fel și au o rudă apropiată comună (același soț, aceiași părinți), fără să fie ele însele părinte–copil sau soți.
 * Prima din pereche e fișa cu mai multe legături, cea care se păstrează la unire.
 */
export type Duplicate = { keep: string; drop: string; via: string };
export function likelyDuplicates(g: Graph, people: Record<string, Lookalike>): Duplicate[] {
  const byName = new Map<string, string[]>();
  for (const p of Object.values(people)) { const k = firstName(p.givenName); if (k) byName.set(k, [...(byName.get(k) ?? []), p.id]); }
  const links = (id: string) => near(g, id).size;
  const out: Duplicate[] = [];
  for (const ids of byName.values()) {
    for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) {
      const a = people[ids[i]], b = people[ids[j]];
      if (!sameLooking(a, b)) continue;
      const na = near(g, a.id), nb = near(g, b.id);
      // Bunicul și nepotul cu același nume (des întâlnit) nu sunt dubluri: unul e strămoșul celuilalt.
      if (na.has(b.id) || nb.has(a.id) || isAncestor(g, a.id, b.id) || isAncestor(g, b.id, a.id)) continue;
      const via = [...na].find((x) => nb.has(x));
      if (!via) continue;
      out.push(links(b.id) > links(a.id) ? { keep: b.id, drop: a.id, via } : { keep: a.id, drop: b.id, via });
    }
  }
  return out;
}
