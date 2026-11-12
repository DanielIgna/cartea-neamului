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

/**
 * Părinții pe care îi au frații cuiva, dar el nu. Se întâmplă când frații au fost legați de părinții lor, iar persoana a rămas fără mamă
 * (sau fără tată), ori cu „Tată necunoscut” pus automat când i s-au adăugat frații. Pentru fiecare rol propunem doar un părinte pe care
 * îl au toți frații care au unul. Un loc gol discret (ales cu „Nu, are altă mamă”) înseamnă că s-a hotărât deja: nu mai propunem nimic.
 */
export function parentsFromSiblings(g: Graph, id: string, placeholder: (id: string) => boolean, discreet: (id: string) => boolean) {
  const mine = g.parents.get(id) ?? [];
  const siblings = new Set(mine.flatMap((p) => g.children.get(p) ?? []).filter((c) => c !== id));
  const out: { role: "father" | "mother"; id: string; current?: string }[] = [];
  for (const [role, sex] of [["father", "M"], ["mother", "F"]] as const) {
    const current = mine.find((p) => g.sex.get(p) === sex);
    if (current && !(placeholder(current) && !discreet(current) && !(g.parents.get(current) ?? []).length)) continue;
    const found = new Set([...siblings].flatMap((s) => (g.parents.get(s) ?? []).filter((p) => g.sex.get(p) === sex && p !== current && !placeholder(p))));
    if (found.size === 1) out.push({ role, id: [...found][0], ...(current ? { current } : {}) });
  }
  return out;
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
/** Părinții fără nume puși automat, în fiecare limbă a site-ului (în baza de date rămân așa cum au fost puși, de obicei în română). */
const UNKNOWN_PARENT: Record<string, { M: string; F: string }> = {
  ro: { M: "Tată necunoscut", F: "Mamă necunoscută" }, "en-GB": { M: "Unknown father", F: "Unknown mother" }, "en-US": { M: "Unknown father", F: "Unknown mother" },
  fr: { M: "Père inconnu", F: "Mère inconnue" }, es: { M: "Padre desconocido", F: "Madre desconocida" }, nl: { M: "Onbekende vader", F: "Onbekende moeder" },
  de: { M: "Unbekannter Vater", F: "Unbekannte Mutter" }, it: { M: "Padre sconosciuto", F: "Madre sconosciuta" }, hu: { M: "Ismeretlen apa", F: "Ismeretlen anya" },
};
const UNKNOWN_PARENT_NAME = /^(tata|mama) necunoscut|^unknown (father|mother)|^(pere|mere) inconnu|^(padre|madre) (desconocid|sconosciut)|^onbekende (vader|moeder)|^unbekannter? (vater|mutter)|^ismeretlen (apa|anya)/;

/** Părinții fără nume puși automat („Tată necunoscut”, „Mamă necunoscută”): nu sunt dubluri unii ai altora și nu primesc fișă în carte. */
export const isPlaceholder = (given: string) => UNKNOWN_PARENT_NAME.test(normName(given)) || /^necunoscut/.test(normName(given));

/** „Tată necunoscut” scris în limba celui care citește; orice alt nume rămâne cum e. */
export function placeholderLabel(given: string, sex: "M" | "F" | "U", locale?: string): string {
  if (!locale || sex === "U" || !UNKNOWN_PARENT_NAME.test(normName(given))) return given;
  return (UNKNOWN_PARENT[locale] ?? UNKNOWN_PARENT.ro)[sex];
}

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
export function isAncestor(g: Graph, anc: string, id: string) {
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

/** Una e părintele cuiva, cealaltă e soțul/soția aceluiași om (sau ale copiilor lor): generații diferite, nu dubluri. */
export function inLaws(g: Graph, a: string, b: string) {
  const kids = (x: string) => new Set(g.children.get(x) ?? []);
  const spouses = (x: string) => new Set(g.partners.get(x) ?? []);
  const ka = kids(a), kb = kids(b), sa = spouses(a), sb = spouses(b);
  for (const x of ka) if (sb.has(x)) return true;
  for (const x of kb) if (sa.has(x)) return true;
  return false;
}

/**
 * Perechi de fișe care par aceeași persoană trecută de două ori (de pildă bunica trecută o dată ca mama a 8 copii și încă o dată ca mama altor 3):
 * arată la fel și au o rudă apropiată comună (`via`: același soț, aceiași părinți), fără să fie ele însele părinte–copil sau soți.
 * Prima din pereche e fișa cu mai multe legături, cea care se păstrează la unire.
 * Al doilea fel (`born`): aceeași persoană trecută o dată ca soție (fără părinți) și încă o dată ca fiica părinților ei, de pildă
 * când îi treci pe frații mamei și pe părinții lor. Atunci `born` e părintele fișei de fiică, ca să știi care e.
 */
export type Duplicate = { keep: string; drop: string; via?: string; born?: string };
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
      // Soacra și nora cu același nume (mama lui Mihai și soția lui Mihai, amândouă „Ana Todea”) nu sunt aceeași persoană:
      // una e părintele omului comun, cealaltă îi e soție. La fel socrul și ginerele.
      if (inLaws(g, a.id, b.id)) continue;
      const via = [...na].find((x) => nb.has(x));
      if (via) out.push(links(b.id) > links(a.id) ? { keep: b.id, drop: a.id, via } : { keep: a.id, drop: b.id, via });
      else {
        const twice = marriedAndBorn(g, people, a, b) ?? marriedAndBorn(g, people, b, a);
        if (twice) out.push(twice);
      }
    }
  }
  return out;
}

/**
 * `wed` e trecută ca soție sau mamă, fără părinți (sau doar cu un „Tată necunoscut”), iar `born` ca fiica unor părinți, fără soț și fără copii.
 * Sunt aceeași persoană dacă numele de fată al soției e numele fiicei, ori dacă amândouă au același an al nașterii.
 * Se păstrează fișa de soție (cu soțul și copiii ei) și primește părinții de la cealaltă.
 */
function marriedAndBorn(g: Graph, people: Record<string, Lookalike>, wed: Lookalike, born: Lookalike): Duplicate | null {
  const ph = (id: string) => isPlaceholder(people[id]?.givenName ?? "");
  const real = (id: string) => (g.parents.get(id) ?? []).filter((p) => !ph(p) || (g.parents.get(p) ?? []).length);
  const family = (id: string) => (g.partners.get(id) ?? []).length + (g.children.get(id) ?? []).length;
  if (real(wed.id).length || !family(wed.id) || !real(born.id).length || family(born.id)) return null;
  const maiden = normName(wed.birthSurname);
  const sameName = !!maiden && maiden !== normName(wed.surname) && (maiden === normName(born.surname) || maiden === normName(born.birthSurname));
  const sameYear = wed.birthYear !== null && born.birthYear !== null && Math.abs(wed.birthYear - born.birthYear) <= 1;
  if (!sameName && !sameYear) return null;
  const parents = real(born.id);
  return { keep: wed.id, drop: born.id, born: parents.find((p) => g.sex.get(p) === "M") ?? parents[0] };
}
