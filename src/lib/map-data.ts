import { eq } from "drizzle-orm";
import type { Db } from "@/db";
import { person, placePin } from "@/db/schema";
import { parseFuzzyDate } from "./dates";
import { COUNTRY_NAMES, countryName, placeKey } from "./place-key";
import { COUNTRY_ONLY, PIN_DETAIL, PIN_GROUP, resolvePlaces, type PlaceRef, type Spot } from "./places";
import type { Locale } from "@/i18n/locales";
import { placedMemories, type PlaceMemory } from "./lada-db";
import type { Viewer } from "./lada";

export type MapKind = "born" | "died" | "lives";
export type MapPlace = Omit<Spot, "id"> & {
  id: string;
  keys: { key: string; text: string; country: string | null; memory?: boolean }[]; // cum e scris locul în fișe sau, `memory`, doar în amintiri
  people: { id: string; kind: MapKind }[];
  memories: PlaceMemory[]; // amintirile petrecute aici, doar cele pe care le vede cine se uită
};
export type MapMissing = { key: string; text: string; country: string | null; people: { id: string; kind: MapKind }[] };
export type MapPerson = { id: string; name: string; years: string; sex: "M" | "F" | "U"; living: boolean };
export type MapRoute = { from: string; to: string; people: string[] };
/** Un sat al strămoșilor, cum îl văd celelalte neamuri (doar cei decedați: câți, anii și numele de familie). */
export type SharedPlace = { placeId: string; area: string | null; name: string; detail: string | null; people: number; fromYear: number | null; toYear: number | null; surnames: string };
/** Locul unei amintiri pe care harta nu l-a găsit („la moara bunicului”, un sat scris altfel). */
export type MemoryMissing = { key: string; text: string; memories: PlaceMemory[] };
export type TreeMap = {
  places: MapPlace[]; missing: MapMissing[]; people: Record<string, MapPerson>; routes: MapRoute[]; shared: SharedPlace[]; memoryMissing: MemoryMissing[];
};

/** Cuvintele hărții în limba cititorului (din catalogul „Map”): anii oamenilor, țările și locurile puse de mână. */
export type MapWords = {
  locale: Locale; born: (year: number, sex: MapPerson["sex"]) => string; died: (year: number, sex: MapPerson["sex"]) => string;
  countryOnly: string; pinned: string; pinnedGroup: string;
  /** Titlul unei amintiri fără titlu: întrebarea, între ghilimelele limbii, sau „Amintire (spusă cu glasul)”. */
  memory: { quoted: (text: string) => string; voice: string; plain: string };
};

/**
 * Numele țărilor (grupul din listă, locul trecut doar cu țara, finalul descrierii „Piedmont, Italia”) și ce am scris noi
 * despre un loc („pus de mână pe hartă”), în limba cititorului. Descrierile satelor din România rămân ca în registre.
 */
export function localizePlace<T extends Omit<Spot, "id">>(s: T, w: MapWords): T {
  if (w.locale === "ro") return s;
  const ro = COUNTRY_NAMES[s.cc], country = ro ? countryName(s.cc, w.locale) : null;
  const group = s.group === PIN_GROUP ? w.pinnedGroup : country && s.group === ro ? country : s.group;
  const detail = s.how === "country" || s.detail === COUNTRY_ONLY ? w.countryOnly : s.detail === PIN_DETAIL ? w.pinned
    : country && s.cc !== "RO" && s.detail?.endsWith(ro) ? `${s.detail.slice(0, -ro.length)}${country}` : s.detail;
  return { ...s, group, detail, name: s.how === "country" && country ? country : s.name };
}

/**
 * Locurile unui arbore, cu oamenii lor: unde s-au născut, unde au murit și, pentru cei în viață, unde locuiesc acum.
 * Persoanele discrete (de pildă o fostă soție) nu apar pe hartă, la fel ca în desenele arborelui.
 * Cu `viewer`, și amintirile din lăzi pe care le vede el, la locul unde s-au petrecut. Ele nu schimbă nimic din rest:
 * nici satele alese pentru oameni, nici drumurile, nici ce văd celelalte neamuri.
 * Cu `words`, textele pentru cititor sunt în limba lui; satele pe care le văd celelalte neamuri (`shared`) rămân în română.
 */
export async function loadTreeMap(db: Db, treeId: string, viewer?: Viewer, words?: MapWords): Promise<TreeMap> {
  const rows = (await db.select().from(person).where(eq(person.treeId, treeId))).filter((p) => !p.discreet);
  const pins = await db.select().from(placePin).where(eq(placePin.treeId, treeId));
  const refs = new Map<string, PlaceRef>();
  const marks: { pid: string; key: string; kind: MapKind }[] = [];
  const people: Record<string, MapPerson> = {};
  for (const p of rows) {
    const b = parseFuzzyDate(p.birthDateText).year, d = parseFuzzyDate(p.deathDateText).year;
    people[p.id] = { id: p.id, name: `${p.givenName} ${p.surname}`.trim() || "Fără nume", sex: p.sex, living: p.living,
      years: b && d ? `${b}–${d}` : b ? (p.living ? (words ? words.born(b, p.sex) : `n. ${b}`) : `${b}–?`) : d ? (words ? words.died(d, p.sex) : `d. ${d}`) : "" };
    const spots: [string | null, string | null, MapKind][] = [[p.birthPlace, p.birthCountry, "born"]];
    if (p.living) spots.push([p.residencePlace, p.residenceCountry, "lives"]);
    else spots.push([p.deathPlace, p.deathCountry, "died"]);
    for (const [text, country, kind] of spots) {
      const key = placeKey(text, country);
      if (!key) continue;
      const ref = refs.get(key) ?? { key, text: text?.trim() || "", country: country?.trim() || null, weight: 0 };
      ref.weight++;
      refs.set(key, ref);
      marks.push({ pid: p.id, key, kind });
    }
  }
  const memories = viewer ? await placedMemories(db, treeId, viewer, words?.memory) : [];
  const memMarks: { key: string; m: PlaceMemory }[] = [];
  for (const m of memories) {
    const key = placeKey(m.place, null);
    if (!key) continue;
    if (!refs.has(key)) refs.set(key, { key, text: m.place, country: null, weight: 0 });
    memMarks.push({ key, m });
  }
  const spots = await resolvePlaces([...refs.values()], pins.map((x) => ({ key: x.key, placeId: x.placeId, name: x.name, detail: x.detail, lat: x.lat, lng: x.lng })));
  const places = new Map<string, MapPlace>();
  const missing = new Map<string, MapMissing>();
  const at = new Map<string, Partial<Record<MapKind, string>>>(); // persoana → locul fiecărui fel
  for (const m of marks) {
    const s = spots.get(m.key);
    const ref = refs.get(m.key)!;
    if (!s) {
      const x = missing.get(m.key) ?? { key: m.key, text: ref.text || ref.country || "", country: ref.country, people: [] };
      x.people.push({ id: m.pid, kind: m.kind });
      missing.set(m.key, x);
      continue;
    }
    const pl = places.get(s.id) ?? { ...s, keys: [], people: [], memories: [] };
    if (!pl.keys.some((k) => k.key === m.key)) pl.keys.push({ key: m.key, text: ref.text, country: ref.country });
    if (!pl.people.some((x) => x.id === m.pid && x.kind === m.kind)) pl.people.push({ id: m.pid, kind: m.kind });
    places.set(s.id, pl);
    at.set(m.pid, { ...at.get(m.pid), [m.kind]: s.id });
  }
  const memoryMissing = new Map<string, MemoryMissing>();
  for (const { key, m } of memMarks) {
    const s = spots.get(key);
    const ref = refs.get(key)!;
    if (!s) {
      const x = memoryMissing.get(key) ?? { key, text: ref.text, memories: [] };
      x.memories.push(m);
      memoryMissing.set(key, x);
      continue;
    }
    const pl = places.get(s.id) ?? { ...s, keys: [], people: [], memories: [] };
    if (!pl.keys.some((k) => k.key === key)) pl.keys.push({ key, text: ref.text, country: ref.country, memory: true });
    pl.memories.push(m);
    places.set(s.id, pl);
  }
  // Drumurile neamului: de unde a plecat fiecare (locul nașterii) și unde a ajuns (locul morții sau unde trăiește acum).
  const routes = new Map<string, MapRoute>();
  for (const [pid, k] of at) {
    const to = k.lives ?? k.died;
    if (!k.born || !to || k.born === to) continue;
    const r = routes.get(`${k.born}>${to}`) ?? { from: k.born, to, people: [] };
    r.people.push(pid);
    routes.set(`${k.born}>${to}`, r);
  }
  // Ce pot vedea alte neamuri: doar satele celor decedați (nașterea și moartea lor), niciodată ale celor în viață.
  const dead = new Map(rows.filter((p) => !p.living).map((p) => [p.id, {
    surnames: [p.surname, p.birthSurname].map((x) => x?.trim()).filter((x): x is string => !!x),
    years: [parseFuzzyDate(p.birthDateText).year, parseFuzzyDate(p.deathDateText).year].filter((y): y is number => !!y),
  }]));
  const shared = new Map<string, { s: Spot; who: Set<string>; years: number[]; names: Map<string, number> }>();
  for (const m of marks) {
    const s = spots.get(m.key), who = dead.get(m.pid);
    if (!s || !who || s.how === "country" || s.id.startsWith("pin:")) continue;
    const x = shared.get(s.id) ?? { s, who: new Set<string>(), years: [], names: new Map<string, number>() };
    if (!x.who.has(m.pid)) {
      x.who.add(m.pid);
      x.years.push(...who.years);
      for (const n of who.surnames) x.names.set(n, (x.names.get(n) ?? 0) + 1);
    }
    shared.set(s.id, x);
  }
  const sharedRows: SharedPlace[] = [...shared.values()].map(({ s, who, years, names }) => ({
    placeId: s.id, area: s.area ?? null, name: s.name, detail: s.detail, people: who.size,
    fromYear: years.length ? Math.min(...years) : null, toYear: years.length ? Math.max(...years) : null,
    surnames: [...names.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([n]) => n).join(", "),
  }));
  const byCount = <T extends { people: unknown[] }>(a: T, b: T) => b.people.length - a.people.length;
  const placeList = [...places.values()].sort((a, b) => byCount(a, b) || b.memories.length - a.memories.length);
  return {
    places: words ? placeList.map((p) => localizePlace(p, words)) : placeList, missing: [...missing.values()].sort(byCount),
    people, routes: [...routes.values()], shared: sharedRows, memoryMissing: [...memoryMissing.values()].sort((a, b) => b.memories.length - a.memories.length),
  };
}
