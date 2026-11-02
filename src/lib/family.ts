import { unionsOf, type Graph } from "./kinship";

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
