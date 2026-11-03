import { eq } from "drizzle-orm";
import type { Db } from "@/db";
import { person, placePin } from "@/db/schema";
import { parseFuzzyDate } from "./dates";
import { placeKey } from "./place-key";
import { resolvePlaces, type PlaceRef, type Spot } from "./places";

export type MapKind = "born" | "died" | "lives";
export type MapPlace = Omit<Spot, "id"> & {
  id: string;
  keys: { key: string; text: string; country: string | null }[]; // cum e scris locul în fișe (pentru „Nu e acesta?”)
  people: { id: string; kind: MapKind }[];
};
export type MapMissing = { key: string; text: string; country: string | null; people: { id: string; kind: MapKind }[] };
export type MapPerson = { id: string; name: string; years: string; sex: "M" | "F" | "U"; living: boolean };
export type MapRoute = { from: string; to: string; people: string[] };
export type TreeMap = { places: MapPlace[]; missing: MapMissing[]; people: Record<string, MapPerson>; routes: MapRoute[] };

/**
 * Locurile unui arbore, cu oamenii lor: unde s-au născut, unde au murit și, pentru cei în viață, unde locuiesc acum.
 * Persoanele discrete (de pildă o fostă soție) nu apar pe hartă, la fel ca în desenele arborelui.
 */
export async function loadTreeMap(db: Db, treeId: string): Promise<TreeMap> {
  const rows = (await db.select().from(person).where(eq(person.treeId, treeId))).filter((p) => !p.discreet);
  const pins = await db.select().from(placePin).where(eq(placePin.treeId, treeId));
  const refs = new Map<string, PlaceRef>();
  const marks: { pid: string; key: string; kind: MapKind }[] = [];
  const people: Record<string, MapPerson> = {};
  for (const p of rows) {
    const b = parseFuzzyDate(p.birthDateText).year, d = parseFuzzyDate(p.deathDateText).year;
    people[p.id] = { id: p.id, name: `${p.givenName} ${p.surname}`.trim() || "Fără nume", sex: p.sex, living: p.living,
      years: b && d ? `${b}–${d}` : b ? (p.living ? `n. ${b}` : `${b}–?`) : d ? `d. ${d}` : "" };
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
    const pl = places.get(s.id) ?? { ...s, keys: [], people: [] };
    if (!pl.keys.some((k) => k.key === m.key)) pl.keys.push({ key: m.key, text: ref.text, country: ref.country });
    if (!pl.people.some((x) => x.id === m.pid && x.kind === m.kind)) pl.people.push({ id: m.pid, kind: m.kind });
    places.set(s.id, pl);
    at.set(m.pid, { ...at.get(m.pid), [m.kind]: s.id });
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
  const byCount = <T extends { people: unknown[] }>(a: T, b: T) => b.people.length - a.people.length;
  return { places: [...places.values()].sort(byCount), missing: [...missing.values()].sort(byCount), people, routes: [...routes.values()] };
}
