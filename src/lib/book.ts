import { where, type PersonView } from "./tree-data";
import { ancestorsOf, buildGraph, oldestAncestor, pairKey, romanDegree, unionsOf, type Graph, type Rel, type Sex } from "./kinship";
import { descendants, isPlaceholder, normName, type DescNode } from "./family";
import { raisedLinks, type Raised } from "./raised";
import { lifeDates, shortDate } from "./person-text";
import { genOf } from "./fan-geometry";

/**
 * Cartea neamului: ce intră în carte și în ce ordine, calculat din arbore (fără bază de date, ca să se poată testa).
 * Oamenii sunt așezați pe generații, de la cei mai vechi la cei mai tineri; în fiecare generație, familie lângă familie:
 * fiecare om cu soțul sau soția alături, frații în ordinea nașterii, ramură după ramură.
 */

export type LivingMode = "tot" | "nume" | "ascunsi";
export type BookFormat = "A4" | "A5";
export type BookOptions = { living: LivingMode; photos: boolean; format: BookFormat };
export type BookText = { title: string; subtitle: string; author: string; preface: string };

type Query = Record<string, string | string[] | undefined>;
const one = (q: Query, k: string) => {
  const v = q[k];
  return Array.isArray(v) ? v[0] : v;
};

/** Alegerile din adresa paginii: `vii` = tot / nume / ascunsi, `poze` = nu, `format` = A5. Implicit: cei în viață doar cu numele, cu poze, pe A4. */
export function bookOptions(q: Query): BookOptions {
  const v = one(q, "vii");
  return { living: v === "tot" || v === "ascunsi" ? v : "nume", photos: one(q, "poze") !== "nu", format: one(q, "format") === "A5" ? "A5" : "A4" };
}

/** Textele scrise de cel care face cartea (titlu, subtitlu, autor, cuvânt înainte), curățate și tăiate la cât încape. */
export function cleanText(t: Partial<Record<keyof BookText, unknown>> | null | undefined): BookText {
  const s = (v: unknown, n: number) => (typeof v === "string" ? v.replace(/\r\n?/g, "\n").replace(/\n{3,}/g, "\n\n").trim().slice(0, n) : "");
  return { title: s(t?.title, 120), subtitle: s(t?.subtitle, 200), author: s(t?.author, 120), preface: s(t?.preface, 12000) };
}

/**
 * Ce se arată în carte despre o persoană. Cei decedați apar cu tot ce s-a scris despre ei; cei în viață, după alegerea
 * celui care face cartea: cu toate datele, doar cu numele (fără date, locuri, poze și povestea lor) sau deloc.
 */
export function shownPerson(p: PersonView, mode: LivingMode): PersonView | null {
  if (!p.living || mode === "tot") return p;
  if (mode === "ascunsi") return null;
  return {
    ...p, birthText: null, birthPlace: null, birthCountry: null, deathText: null, deathPlace: null, deathCountry: null,
    residencePlace: null, residenceCountry: null, birthYear: null, deathYear: null, approx: false,
    occupation: null, biography: null, notes: null, photoId: null, accountImage: null, documents: [],
  };
}

/** Poza de profil: cea încărcată în arbore; altfel cea din contul Google, cerută mai mare (cea obișnuită are 96 de pixeli). */
export function photoUrl(p: Pick<PersonView, "photoId" | "accountImage">) {
  if (p.photoId) return `/api/document/${p.photoId}`;
  return p.accountImage ? p.accountImage.replace(/=s\d+(-c)?$/, "=s600-c") : null;
}

/** Doar ce le trebuie desenelor: fără povești, note și documente (pagina le trimite în browser). */
export const chartPerson = (p: PersonView): PersonView => ({
  ...p, biography: null, notes: null, documents: [], occupation: null, residencePlace: null, residenceCountry: null, createdBy: null, claimedBy: null,
});

export type Ref = { id: string | null; name: string; dates: string };
/** O căsătorie (sau legătură) în fișă: `spouse` = null când celălalt părinte nu se numește (discret, necunoscut sau ascuns). */
export type BookUnion = { spouse: Ref | null; married: string; children: Ref[]; hidden: number };
export type Entry = {
  id: string; name: string; givenName: string; surname: string; birthSurname: string | null; sex: Sex; living: boolean;
  dates: string; born: string; died: string; lives: string; occupation: string; biography: string; photo: string | null;
  parents: Ref[]; unions: BookUnion[]; carers: Ref[]; raised: Ref[]; album: { src: string; caption: string }[];
};
export type Generation = { id: string; title: string; subtitle: string; entries: Entry[] };
export type OutlineLine = { num: string; depth: number; person: Ref; spouses: Ref[]; from: string; hidden: number };
export type IndexLine = { id: string; label: string; dates: string };
export type BookStats = {
  people: number; generations: number; from: number | null; to: number | null; oldest: Ref | null;
  surnames: [string, number][]; places: [string, number][];
};
export type BookModel = {
  centerId: string | null;
  /** Prenumele persoanei din centru, sau null când e ascunsă (în viață, iar cartea nu-i arată pe cei în viață). */
  centerName: string | null;
  trunk: Ref | null;
  generations: Generation[];
  outline: OutlineLine[];
  index: IndexLine[];
  stats: BookStats;
  /** Copacul neamului, de la trunchi, fără cei ascunși; `treePeople` = doar ce trebuie desenului. */
  tree: DescNode | null;
  treePeople: Record<string, PersonView>;
  path: string[];
  /** Evantaiul strămoșilor: locurile Ahnentafel cu persoane care se arată, pe câte generații încap. */
  fan: Record<number, PersonView>;
  fanGenerations: number;
};

const UP = ["", "părinților", "bunicilor", "străbunicilor", "răstrăbunicilor"];
const DOWN = ["", "copiilor", "nepoților", "strănepoților", "răstrănepoților"];

/** „Generația I”, „Generația a II-a”… */
export const generationTitle = (n: number) => (n === 1 ? "Generația I" : `Generația a ${romanDegree(n)}-a`);

/** „Generația bunicilor lui Ioan Daniel”, „Cu 6 generații înaintea lui Ioan Daniel”. */
export function generationOf(level: number, who: string) {
  if (level === 0) return `Generația lui ${who}`;
  if (level < 0) return -level < UP.length ? `Generația ${UP[-level]} lui ${who}` : `Cu ${-level} generații înaintea lui ${who}`;
  return level < DOWN.length ? `Generația ${DOWN[level]} lui ${who}` : `Cu ${level} generații după ${who}`;
}

/** Generația fiecărui om față de persoana din centru: părinții -1, copiii +1, soții la fel ca partenerul lor. */
export function generationLevels(g: Graph, start: string) {
  const level = new Map<string, number>([[start, 0]]);
  for (let queue = [start]; queue.length; ) {
    const next: string[] = [];
    for (const x of queue) {
      const l = level.get(x)!;
      const step = (ids: string[] | undefined, d: number) => {
        for (const y of ids ?? []) if (!level.has(y)) { level.set(y, l + d); next.push(y); }
      };
      step(g.parents.get(x), -1);
      step(g.children.get(x), 1);
      step(g.partners.get(x), 0);
    }
    queue = next;
  }
  return level;
}

/** Ordinea „pe familii”: fiecare om, apoi soțul sau soția, apoi copiii lor în ordinea nașterii, ramură după ramură. */
function familyOrder(g: Graph, roots: string[], all: string[]) {
  const order = new Map<string, number>();
  const visit = (id: string) => {
    if (order.has(id)) return;
    order.set(id, order.size);
    for (const u of unionsOf(g, id)) {
      if (u.spouse) visit(u.spouse);
      for (const c of u.children) visit(c);
    }
  };
  roots.forEach(visit);
  all.forEach(visit);
  return order;
}

const isImage = (d: PersonView["documents"][number]) => d.hasFile && (d.kind === "photo" || !!d.mimeType?.startsWith("image/"));
/** Titlurile care sunt doar numele fișierului („IMG_2034.jpg”) nu sunt bune ca text sub poză. */
const fileLike = (t: string) => /\.(jpe?g|png|gif|webp|heic|heif|tiff?)$/i.test(t) || /^(img|dsc|pxl|photo|wa)[-_ ]?\d/i.test(t);

/** Textul de sub o poză: descrierea, apoi data, dacă descrierea nu o spune deja. */
const caption = (text: string, date: string) => (!date || text.includes(date) ? text : text ? `${text.replace(/[.,;\s]+$/, "")}, ${date}` : date);
const nonNull = <T,>(x: T | null | undefined): x is T => x != null;
/** Anii vieții, ca pe site, dar fără „?–?” când nu se știe nimic: în carte, locul rămâne gol. */
const datesOf = (p: PersonView) => (/^[?–\s]*$/.test(lifeDates(p)) ? "" : lifeDates(p));
const top = (m: Map<string, number>, n: number) => [...m].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "ro")).slice(0, n);
const count = (m: Map<string, number>, k: string) => m.set(k, (m.get(k) ?? 0) + 1);

export function buildBook(input: {
  people: Record<string, PersonView>; rels: Rel[]; raised: Raised[]; centerId: string | null; slots: Record<number, string>; options: BookOptions;
}): BookModel {
  const { people, rels, raised, options } = input;
  const g = buildGraph(Object.values(people), rels);
  const shown: Record<string, PersonView> = {};
  for (const p of Object.values(people)) {
    const s = shownPerson(p, options.living);
    if (s) shown[p.id] = s;
  }
  // Fișă proprie au toți cei care se arată, în afară de părinții puși automat („Tată necunoscut”) și de cei discreți
  // (o fostă soție apare doar în fișele copiilor ei, la „Părinți”).
  const hasEntry = (id: string) => !!shown[id] && !shown[id].discreet && !isPlaceholder(shown[id].givenName);
  const ref = (id: string): Ref | null => {
    const p = shown[id];
    if (!p || isPlaceholder(p.givenName)) return null;
    return { id: hasEntry(id) ? id : null, name: p.name, dates: datesOf(p) };
  };
  const center = input.centerId && people[input.centerId] ? input.centerId : null;
  const centerName = center && shown[center] ? shown[center].givenName || shown[center].name : null;

  const entry = (id: string): Entry => {
    const p = shown[id];
    const unions: BookUnion[] = [];
    const other: BookUnion = { spouse: null, married: "", children: [], hidden: 0 };
    for (const u of unionsOf(g, id)) {
      const spouse = u.spouse && hasEntry(u.spouse) ? ref(u.spouse) : null;
      const target = spouse ? { spouse, married: shortDate(g.unionMeta.get(pairKey(id, u.spouse!))?.start), children: [] as Ref[], hidden: 0 } : other;
      for (const c of u.children) {
        const r = ref(c);
        if (r) target.children.push(r);
        else if (!shown[c]) target.hidden++;
      }
      if (spouse) unions.push(target);
    }
    if (other.children.length || other.hidden) unions.push(other);
    const links = raisedLinks(g, raised, id);
    const photo = options.photos ? photoUrl(p) : null;
    return {
      id, name: p.name, givenName: p.givenName, surname: p.surname, birthSurname: p.birthSurname, sex: p.sex, living: p.living,
      dates: datesOf(p),
      born: [shortDate(p.birthText), where(p.birthPlace, p.birthCountry)].filter(Boolean).join(", "),
      died: [shortDate(p.deathText), where(p.deathPlace, p.deathCountry)].filter(Boolean).join(", "),
      lives: p.living ? where(p.residencePlace, p.residenceCountry) || (p.residenceCountry ?? "") : "",
      occupation: p.occupation?.trim() ?? "", biography: p.biography?.trim() ?? "", photo,
      parents: (g.parents.get(id) ?? []).map(ref).filter(nonNull),
      unions, carers: links.carers.map(ref).filter(nonNull), raised: links.raised.map(ref).filter(nonNull),
      album: options.photos
        ? p.documents.filter((d) => isImage(d) && d.id !== p.photoId).slice(0, 4).map((d) => ({
            src: `/api/document/${d.id}`,
            caption: caption(d.description?.trim() || (fileLike(d.title) ? "" : d.title.trim()), d.dateText?.trim() ?? ""),
          }))
        : [],
    };
  };

  // Generațiile, față de persoana din centru; cine nu e legat de ea ajunge la „Alte persoane din arbore”.
  const ids = Object.keys(shown).filter(hasEntry);
  const levels = center ? generationLevels(g, center) : new Map<string, number>();
  const born = (id: string) => shown[id]?.birthYear ?? people[id]?.birthYear ?? 9999;
  const trunkId = center ? oldestAncestor(g, center) : null;
  const roots = Object.keys(people).filter((id) => !(g.parents.get(id) ?? []).length)
    .sort((a, b) => Number(b === trunkId) - Number(a === trunkId) || (levels.get(a) ?? 99) - (levels.get(b) ?? 99) || born(a) - born(b));
  const order = familyOrder(g, roots, Object.keys(people).sort((a, b) => born(a) - born(b)));
  const byLevel = new Map<number, string[]>();
  const loose: string[] = [];
  for (const id of ids) {
    const l = levels.get(id);
    if (l === undefined) loose.push(id);
    else byLevel.set(l, [...(byLevel.get(l) ?? []), id]);
  }
  const generations: Generation[] = [...byLevel.keys()].sort((a, b) => a - b).map((l, i) => ({
    id: `g-${i + 1}`, title: generationTitle(i + 1), subtitle: centerName ? generationOf(l, centerName) : "",
    entries: byLevel.get(l)!.sort((a, b) => order.get(a)! - order.get(b)!).map(entry),
  }));
  if (loose.length) generations.push({
    id: "g-alte", title: "Alte persoane din arbore", subtitle: "Încă fără o legătură trecută cu restul neamului",
    entries: loose.sort((a, b) => born(a) - born(b) || order.get(a)! - order.get(b)!).map(entry),
  });

  // Urmașii trunchiului, la rând (numerotare d'Aboville: 1, 1.1, 1.2, 1.2.1…), și copacul desenat din aceiași oameni.
  const full = trunkId && hasEntry(trunkId) ? descendants(g, hasEntry, trunkId) : null;
  const prune = (d: DescNode): DescNode => ({ ...d, children: d.children.filter((c) => hasEntry(c.id)).map(prune) });
  const tree = full ? prune(full) : null;
  const outline: OutlineLine[] = [];
  const treePeople: Record<string, PersonView> = {};
  const walk = (d: DescNode, num: string, depth: number, parent: DescNode | null, fullNode: DescNode) => {
    const person = ref(d.id);
    if (!person) return;
    treePeople[d.id] = chartPerson(shown[d.id]);
    for (const s of d.partners) treePeople[s] = chartPerson(shown[s]);
    const from = !parent ? "" : d.apart ? "din altă relație" : parent.partners.length > 1 && d.via && shown[d.via] ? `din căsătoria cu ${shown[d.via].givenName}` : "";
    outline.push({ num, depth, person, spouses: d.partners.map(ref).filter(nonNull), from, hidden: fullNode.children.length - d.children.length });
    d.children.forEach((c, i) => walk(c, `${num}.${i + 1}`, depth + 1, d, fullNode.children.find((x) => x.id === c.id)!));
  };
  if (tree && full) walk(tree, "1", 0, null, full);
  const path = center ? ancestorsOf(g, center).map(([id]) => id).filter((id) => treePeople[id]) : [];

  // Evantaiul: strămoșii adevărați ai persoanei din centru (și mamele discrete), fără „Tată necunoscut” și fără cei ascunși.
  const fan: Record<number, PersonView> = {};
  for (const [n, id] of Object.entries(input.slots)) {
    const p = shown[id];
    if (p && !isPlaceholder(p.givenName)) fan[Number(n)] = chartPerson(p);
  }
  const deepest = Math.max(0, ...Object.keys(fan).map((n) => genOf(Number(n))));
  const fanGenerations = Math.min(deepest, options.format === "A5" ? 4 : 5);

  // Indexul: după numele de familie, cu numele de fată trecut și separat („Pop, Floarea (căs. Igna)”).
  const index: IndexLine[] = [];
  for (const gen of generations) for (const e of gen.entries) {
    const maiden = e.birthSurname && normName(e.birthSurname) !== normName(e.surname) ? e.birthSurname : null;
    const name = (sur: string) => (sur ? `${sur}, ${e.givenName}` : e.givenName || e.name);
    index.push({ id: e.id, label: `${name(e.surname)}${maiden ? ` (n. ${maiden})` : ""}`, dates: e.dates });
    if (maiden) index.push({ id: e.id, label: `${name(maiden)} (căs. ${e.surname || "?"})`, dates: e.dates });
  }
  index.sort((a, b) => a.label.localeCompare(b.label, "ro", { sensitivity: "base" }) || a.dates.localeCompare(b.dates));

  // Neamul pe scurt, doar din ce se arată în carte.
  const all = generations.flatMap((x) => x.entries.map((e) => shown[e.id]));
  const years = all.map((p) => p.birthYear).filter(nonNull);
  const oldest = all.filter((p) => p.birthYear !== null).sort((a, b) => a.birthYear! - b.birthYear!)[0];
  const surnames = new Map<string, number>(), places = new Map<string, number>();
  for (const p of all) {
    if (p.surname.trim()) count(surnames, p.surname.trim());
    if (p.birthSurname?.trim() && normName(p.birthSurname) !== normName(p.surname)) count(surnames, p.birthSurname.trim());
    const w = where(p.birthPlace, p.birthCountry);
    if (w) count(places, w);
  }
  return {
    centerId: center, centerName, trunk: trunkId ? ref(trunkId) : null, generations, outline, index,
    stats: {
      people: all.length, generations: generations.filter((x) => x.id !== "g-alte").length,
      from: years.length ? Math.min(...years) : null, to: years.length ? Math.max(...years) : null,
      oldest: oldest ? ref(oldest.id) : null, surnames: top(surnames, 8), places: top(places, 8),
    },
    tree: tree && outline.length >= 3 ? tree : null, treePeople, path, fan, fanGenerations,
  };
}
