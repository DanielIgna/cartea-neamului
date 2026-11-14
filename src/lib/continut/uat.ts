import { COMMUNES, PLACES } from "@/data/places/ro";
import { COUNTIES } from "@/lib/place-key";
import { plainPlace } from "@/lib/place-key";
import { slugify } from "./markdown";
import { loadCounties, type County } from "./localitati";

/**
 * Comunele, orașele și municipiile României (3.181 de unități din nomenclatorul SIRUTA al INS), fiecare cu satele ei,
 * populația de la recensământul din 2021 și punctul satului de reședință (din OpenStreetMap). Din ele se fac paginile
 * /localitati/<județ>/<localitate>. Datele vin din gazetarul hărții (src/data/places, licențele în README-ul de acolo);
 * nu se editează aici. Bucureștiul are pagina lui de județ, deci nu apare ca localitate.
 */
export type Kind = "m" | "o" | "c";
export type Village = { name: string; siruta: number; seat: boolean; lat: number; lng: number };
export type Uat = {
  slug: string; name: string; kind: Kind; pop: number; code: string; countySlug: string;
  lat: number; lng: number; siruta: number; villages: Village[];
  /** Cheia comunei în „Din aceleași locuri” (tree_place.area), ca „CJ:sancraiu”. */
  area: string;
};

export const KIND_NAME: Record<Kind, { one: string; many: string; title: string }> = {
  m: { one: "municipiu", many: "municipii", title: "Municipiul" },
  o: { one: "oraș", many: "orașe", title: "Orașul" },
  c: { one: "comună", many: "comune", title: "Comuna" },
};

/** Data la care s-au adăugat paginile (pentru sitemap); se schimbă când se regenerează gazetarul. */
export const UATS_UPDATED = new Date("2026-11-14T00:00:00Z");

let cache: { all: Uat[]; byCounty: Map<string, Uat[]>; bySlug: Map<string, Uat> } | null = null;

function build() {
  if (cache) return cache;
  const countyByCode = new Map<string, County>();
  for (const [code, name] of Object.entries(COUNTIES)) {
    const c = loadCounties().find((x) => x.slug === slugify(name));
    if (c) countyByCode.set(code, c);
  }
  const communes = COMMUNES.split("\n").map((l) => {
    const [name, code, kind, pop] = l.split("\t");
    return { name: name.replace(/^Municipiul /, ""), code, kind: kind as Kind, pop: Number(pop), villages: [] as Village[] };
  });
  for (const line of PLACES.split("\n")) {
    const [name, lng, lat, ci, flag, siruta] = line.split("\t");
    if (flag === "2") continue; // numele comunei pus peste satul de reședință, doar pentru căutare
    communes[Number(ci)].villages.push({ name, siruta: Number(siruta), seat: flag === "1", lat: Number(lat), lng: Number(lng) });
  }
  const all: Uat[] = [];
  const byCounty = new Map<string, Uat[]>();
  for (const c of communes) {
    const county = countyByCode.get(c.code);
    if (!county || c.code === "B" || !c.villages.length) continue;
    const seat = c.villages.find((v) => v.seat) ?? c.villages.find((v) => plainPlace(v.name) === plainPlace(c.name)) ?? c.villages[0];
    const list = byCounty.get(county.slug) ?? [];
    let slug = slugify(c.name);
    if (list.some((u) => u.slug === slug)) slug = `${slug}-${c.kind === "c" ? "comuna" : "oras"}`;
    const villages = [...c.villages].sort((a, b) => Number(b.seat) - Number(a.seat) || a.name.localeCompare(b.name, "ro"));
    const u: Uat = { slug, name: c.name, kind: c.kind, pop: c.pop, code: c.code, countySlug: county.slug, lat: seat.lat, lng: seat.lng, siruta: seat.siruta, villages, area: `${c.code}:${plainPlace(c.name)}` };
    list.push(u);
    byCounty.set(county.slug, list);
    all.push(u);
  }
  for (const l of byCounty.values()) l.sort((a, b) => a.name.localeCompare(b.name, "ro"));
  cache = { all, byCounty, bySlug: new Map(all.map((u) => [`${u.countySlug}/${u.slug}`, u])) };
  return cache;
}

export const loadUats = () => build().all;
export const uatsOf = (countySlug: string) => build().byCounty.get(countySlug) ?? [];
export const getUat = (countySlug: string, slug: string) => build().bySlug.get(`${countySlug}/${slug}`) ?? null;
export const uatPath = (u: Uat) => `/localitati/${u.countySlug}/${u.slug}`;
/** Reședința județului e și ea o localitate: pagina ei rămâne la aceeași adresă. */
export const isSeatOf = (u: Uat, c: County) => c.seatSlug === u.slug;

const R = 6371;
export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const dLat = ((b.lat - a.lat) * Math.PI) / 180, dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

const DIRS = ["nord", "nord-est", "est", "sud-est", "sud", "sud-vest", "vest", "nord-vest"];
/** În ce parte e „a” față de „b” (nord, sud-est…). */
export function direction(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const y = a.lat - b.lat, x = (a.lng - b.lng) * Math.cos((b.lat * Math.PI) / 180);
  const deg = ((Math.atan2(x, y) * 180) / Math.PI + 360) % 360;
  return DIRS[Math.round(deg / 45) % 8];
}

/** Cele mai apropiate localități (din orice județ), după satul de reședință. */
export function neighbours(u: Uat, n = 8) {
  return loadUats().filter((x) => x !== u).map((x) => ({ u: x, km: distanceKm(u, x) })).sort((a, b) => a.km - b.km).slice(0, n);
}

/** Cel mai apropiat oraș sau municipiu (pentru o comună). */
export function nearestTown(u: Uat) {
  return loadUats().filter((x) => x !== u && x.kind !== "c").map((x) => ({ u: x, km: distanceKm(u, x) })).sort((a, b) => a.km - b.km)[0] ?? null;
}

/** Locul după numărul de locuitori între unitățile de același fel din județ (1 = cea mai mare). */
export function rankInCounty(u: Uat) {
  const same = uatsOf(u.countySlug).filter((x) => x.kind === u.kind).sort((a, b) => b.pop - a.pop);
  return { rank: same.indexOf(u) + 1, of: same.length };
}

/** Reședința județului ca localitate (pentru distanțe), dacă există. */
export function countySeatUat(c: County) {
  return c.seatSlug ? getUat(c.slug, c.seatSlug) : null;
}
