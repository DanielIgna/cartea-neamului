import { COMMUNES, PLACES } from "@/data/places/ro";
import { COUNTIES, COUNTRY_CENTER, COUNTRY_NAMES, countryCode, parsePlace, plainPlace, plainPlaceOld } from "./place-key";

/**
 * Gazetarul hărții: unde e un loc scris într-o fișă. România are toate cele 13.800 de sate și localități din SIRUTA,
 * cu punctul din OpenStreetMap; pentru străinătate avem orașele de peste 1000 de locuitori din GeoNames.
 * Se încarcă doar pe server (datele au câțiva MB).
 */

export type Spot = {
  id: string; // „RO:55455” (cod SIRUTA), „IT:turin:45.07,7.69”, „country:HU” sau „pin:<cheie>”
  name: string;
  detail: string; // „oraș, jud. Cluj”, „com. Sâncraiu, jud. Cluj”, „Piedmont, Italia”
  lat: number;
  lng: number;
  cc: string;
  group: string; // județul (în România) sau țara: după el grupăm lista de locuri
  how: "found" | "guess" | "pin" | "country"; // găsit sigur / ales dintre mai multe cu același nume / pus de mână / doar țara
  choices?: number;
  area?: string; // comuna, pentru satele din România („CJ:sancraiu”)
};

type Entry = { name: string; lat: number; lng: number; cc: string; group: string; detail: string; id: string; prior: number; county?: string; commune?: string; area?: string; keys: string[] };
type Index = { entries: Entry[]; byKey: Map<string, Entry[]>; byId: Map<string, Entry> };

function add(map: Map<string, Entry[]>, key: string, e: Entry) {
  const list = map.get(key);
  if (!list) map.set(key, [e]);
  else if (!list.includes(e)) list.push(e);
}

const KIND_WORD: Record<string, [string, string]> = { m: ["municipiu", "mun."], o: ["oraș", "orașul"], c: ["comună", "com."], s: ["sector", "sectorul"] };

/** Nume scurte sau vechi (maghiare, germane) ale orașelor, cum apar în acte și în amintiri. [alias, nume SIRUTA, județ] */
const RO_ALIASES: [string, string, string][] = [
  ["Cluj", "Cluj-Napoca", "CJ"], ["Kolozsvár", "Cluj-Napoca", "CJ"], ["Klausenburg", "Cluj-Napoca", "CJ"], ["Bucharest", "București", "B"],
  ["Sighet", "Sighetu Marmației", "MM"], ["Máramarossziget", "Sighetu Marmației", "MM"], ["Turnu Severin", "Drobeta-Turnu Severin", "MH"],
  ["Severin", "Drobeta-Turnu Severin", "MH"], ["Bánffyhunyad", "Huedin", "CJ"], ["Nagyvárad", "Oradea", "BH"], ["Temesvár", "Timișoara", "TM"],
  ["Hermannstadt", "Sibiu", "SB"], ["Nagyszeben", "Sibiu", "SB"], ["Kronstadt", "Brașov", "BV"], ["Brassó", "Brașov", "BV"], ["Orașul Stalin", "Brașov", "BV"],
  ["Marosvásárhely", "Târgu Mureș", "MS"], ["Szatmárnémeti", "Satu Mare", "SM"], ["Nagybánya", "Baia Mare", "MM"], ["Gyulafehérvár", "Alba Iulia", "AB"],
  ["Karlsburg", "Alba Iulia", "AB"], ["Segesvár", "Sighișoara", "MS"], ["Schässburg", "Sighișoara", "MS"], ["Beszterce", "Bistrița", "BN"],
  ["Bistritz", "Bistrița", "BN"], ["Dés", "Dej", "CJ"], ["Torda", "Turda", "CJ"], ["Szamosújvár", "Gherla", "CJ"], ["Déva", "Deva", "HD"],
  ["Zilah", "Zalău", "SJ"], ["Csíkszereda", "Miercurea Ciuc", "HR"], ["Sepsiszentgyörgy", "Sfântu Gheorghe", "CV"], ["Székelyudvarhely", "Odorheiu Secuiesc", "HR"],
  ["Kézdivásárhely", "Târgu Secuiesc", "CV"], ["Lugos", "Lugoj", "TM"], ["Medgyes", "Mediaș", "SB"], ["Mediasch", "Mediaș", "SB"], ["Nagyenyed", "Aiud", "AB"],
  ["Szászrégen", "Reghin", "MS"], ["Fogaras", "Făgăraș", "BV"], ["Zsibó", "Jibou", "SJ"], ["Bánffy-Hunyad", "Huedin", "CJ"], ["Kalotaszentkirály", "Sâncraiu", "CJ"],
];

/** Nume românești ale orașelor din străinătate, așa cum le scriem noi. [cum scriem, cum e în GeoNames, țara] */
const WORLD_ALIASES: [string, string, string][] = [
  ["Torino", "Turin", "IT"], ["Roma", "Rome", "IT"], ["Milano", "Milan", "IT"], ["Napoli", "Naples", "IT"], ["Veneția", "Venice", "IT"], ["Venezia", "Venice", "IT"],
  ["Florența", "Florence", "IT"], ["Firenze", "Florence", "IT"], ["Genova", "Genoa", "IT"], ["Padova", "Padua", "IT"], ["Mantova", "Mantua", "IT"],
  ["Bologna", "Bologna", "IT"], ["Verona", "Verona", "IT"], ["Brescia", "Brescia", "IT"], ["Bergamo", "Bergamo", "IT"],
  ["München", "Munich", "DE"], ["Munchen", "Munich", "DE"], ["Nürnberg", "Nuremberg", "DE"], ["Berlin", "Berlin", "DE"], ["Stuttgart", "Stuttgart", "DE"],
  ["Frankfurt", "Frankfurt am Main", "DE"], ["Viena", "Vienna", "AT"], ["Wien", "Vienna", "AT"], ["Londra", "London", "GB"], ["London", "London", "GB"],
  ["Lisabona", "Lisbon", "PT"], ["Lisboa", "Lisbon", "PT"], ["Atena", "Athens", "GR"], ["Bruxelles", "Brussels", "BE"], ["Praga", "Prague", "CZ"],
  ["Varșovia", "Warsaw", "PL"], ["Budapesta", "Budapest", "HU"], ["Budapest", "Budapest", "HU"], ["Belgrad", "Belgrade", "RS"], ["Kiev", "Kyiv", "UA"],
  ["Cernăuți", "Chernivtsi", "UA"], ["Odesa", "Odesa", "UA"], ["Odessa", "Odesa", "UA"], ["Chișinău", "Chisinau", "MD"], ["Bălți", "Balti", "MD"],
  ["Tiraspol", "Tiraspol", "MD"], ["Haga", "The Hague", "NL"], ["Amsterdam", "Amsterdam", "NL"], ["Copenhaga", "Copenhagen", "DK"], ["Genève", "Geneva", "CH"],
  ["Geneva", "Geneva", "CH"], ["Zürich", "Zurich", "CH"], ["Saragossa", "Zaragoza", "ES"], ["Zaragoza", "Zaragoza", "ES"], ["Castellón", "Castelló de la Plana", "ES"],
  ["Castellon de la Plana", "Castelló de la Plana", "ES"], ["Madrid", "Madrid", "ES"], ["Barcelona", "Barcelona", "ES"], ["Valencia", "Valencia", "ES"],
  ["Sevilla", "Sevilla", "ES"], ["Paris", "Paris", "FR"], ["Marsilia", "Marseille", "FR"], ["Nisa", "Nice", "FR"], ["Lyon", "Lyon", "FR"],
  ["Dublin", "Dublin", "IE"], ["Anvers", "Antwerp", "BE"], ["New York", "New York City", "US"], ["Chicago", "Chicago", "US"], ["Toronto", "Toronto", "CA"],
  ["Montreal", "Montréal", "CA"], ["Sofia", "Sofia", "BG"], ["Stockholm", "Stockholm", "SE"], ["Oslo", "Oslo", "NO"], ["Helsinki", "Helsinki", "FI"],
  ["Dubai", "Dubai", "AE"], ["Tel Aviv", "Tel Aviv", "IL"], ["Ierusalim", "Jerusalem", "IL"],
];
/** Orașe străine scrise fără țară (sau cu țara lăsată pe România): unde să le căutăm. */
const GLOBAL_HINT = new Map(WORLD_ALIASES.map(([a, , cc]) => [plainPlace(a), cc]));

let ro: Index | null = null;
function roIndex(): Index {
  if (ro) return ro;
  const communes = COMMUNES.split("\n").map((l) => { const [name, county, kind, pop] = l.split("\t"); return { name: name.replace(/^Municipiul /, ""), county, kind, pop: Number(pop) }; });
  const entries: Entry[] = [];
  const byKey = new Map<string, Entry[]>();
  const byId = new Map<string, Entry>();
  for (const line of PLACES.split("\n")) {
    const [name, lng, lat, ci, flag, code] = line.split("\t");
    const c = communes[Number(ci)];
    const seat = flag !== "0";
    const own = plainPlace(name) === plainPlace(c.name);
    const [word, short] = KIND_WORD[c.kind] ?? KIND_WORD.c;
    const where = c.county === "B" ? "capitala" : `jud. ${COUNTIES[c.county] ?? c.county}`;
    const detail = c.county === "B" ? "capitala" : own ? `${word}, ${where}` : `${short} ${c.name}, ${where}`;
    const keys = [...new Set([plainPlace(name), plainPlaceOld(name)])];
    const commune = plainPlace(c.name);
    const e: Entry = { name, lat: Number(lat), lng: Number(lng), cc: "RO", group: COUNTIES[c.county] ?? c.county, detail, id: `RO:${code}`,
      prior: seat ? c.pop : Math.max(c.pop / 8, 30), county: c.county, commune, area: `${c.county}:${commune}`, keys };
    entries.push(e);
    if (!byId.has(e.id) || flag !== "2") byId.set(e.id, e);
    for (const k of keys) add(byKey, k, e);
  }
  for (const [alias, target, county] of RO_ALIASES) {
    for (const e of byKey.get(plainPlace(target)) ?? []) if (e.county === county) { add(byKey, plainPlace(alias), e); e.keys.push(plainPlace(alias)); }
  }
  return (ro = { entries, byKey, byId });
}

const WORLD: Record<string, () => Promise<{ REGIONS: string; PLACES: string }>> = {
  MD: () => import("@/data/places/world/MD"), IT: () => import("@/data/places/world/IT"), ES: () => import("@/data/places/world/ES"),
  DE: () => import("@/data/places/world/DE"), FR: () => import("@/data/places/world/FR"), AT: () => import("@/data/places/world/AT"),
  HU: () => import("@/data/places/world/HU"), GB: () => import("@/data/places/world/GB"), IE: () => import("@/data/places/world/IE"),
  BE: () => import("@/data/places/world/BE"), NL: () => import("@/data/places/world/NL"), CH: () => import("@/data/places/world/CH"),
  SE: () => import("@/data/places/world/SE"), DK: () => import("@/data/places/world/DK"), NO: () => import("@/data/places/world/NO"),
  FI: () => import("@/data/places/world/FI"), PT: () => import("@/data/places/world/PT"), GR: () => import("@/data/places/world/GR"),
  CY: () => import("@/data/places/world/CY"), RS: () => import("@/data/places/world/RS"), BG: () => import("@/data/places/world/BG"),
  UA: () => import("@/data/places/world/UA"), CZ: () => import("@/data/places/world/CZ"), PL: () => import("@/data/places/world/PL"),
  IL: () => import("@/data/places/world/IL"), US: () => import("@/data/places/world/US"), CA: () => import("@/data/places/world/CA"),
  AU: () => import("@/data/places/world/AU"), NZ: () => import("@/data/places/world/NZ"), AE: () => import("@/data/places/world/AE"),
  SK: () => import("@/data/places/world/SK"), HR: () => import("@/data/places/world/HR"), SI: () => import("@/data/places/world/SI"),
  LU: () => import("@/data/places/world/LU"), MT: () => import("@/data/places/world/MT"),
};
const world = new Map<string, Promise<Index>>();
function worldIndex(cc: string): Promise<Index> | null {
  if (!WORLD[cc]) return null;
  let p = world.get(cc);
  if (!p) {
    p = WORLD[cc]().then(({ REGIONS, PLACES: rows }) => {
      const regions = REGIONS.split("\n");
      const entries: Entry[] = [];
      const byKey = new Map<string, Entry[]>();
      for (const line of rows.split("\n")) {
        const [name, lng, lat, ri] = line.split("\t");
        const region = regions[Number(ri)];
        const k = plainPlace(name);
        const e: Entry = { name, lat: Number(lat), lng: Number(lng), cc, group: COUNTRY_NAMES[cc], id: `${cc}:${k}:${Number(lat).toFixed(2)},${Number(lng).toFixed(2)}`,
          detail: [region, COUNTRY_NAMES[cc]].filter(Boolean).join(", "), prior: 1, keys: [k] };
        entries.push(e);
        add(byKey, k, e);
      }
      for (const [alias, target, c] of WORLD_ALIASES) {
        if (c !== cc) continue;
        // Orașele mari, cu nume românesc, vin primele în căutare (Torino înaintea lui „Torino di Sangro”)
        // și se arată cum le spunem noi: Torino, nu Turin; Viena, nu Vienna.
        for (const e of byKey.get(plainPlace(target)) ?? []) {
          add(byKey, plainPlace(alias), e);
          e.keys.push(plainPlace(alias));
          if (e.prior < 1000) { e.prior = 1000; e.name = alias; }
        }
      }
      return { entries, byKey, byId: new Map(entries.map((e) => [e.id, e])) };
    });
    world.set(cc, p);
  }
  return p;
}

async function indexFor(cc: string): Promise<Index | null> {
  return cc === "RO" ? roIndex() : await (worldIndex(cc) ?? Promise.resolve(null));
}

const spot = (e: Entry, how: Spot["how"], choices?: number): Spot => ({ id: e.id, name: e.name, detail: e.detail, lat: e.lat, lng: e.lng, cc: e.cc, group: e.group, how,
  ...(choices ? { choices } : {}), ...(e.area ? { area: e.area } : {}) });

/** Comuna unui sat din România după codul lui („RO:59470” → „CJ:sancraiu”), pentru locurile alese de mână din listă. */
export function areaOf(placeId: string | null | undefined): string | undefined {
  return placeId?.startsWith("RO:") ? roIndex().byId.get(placeId)?.area : undefined;
}

/** Toate locurile care s-ar putea potrivi cu ce scrie în fișă; dacă nu găsim localitatea, poate măcar țara. */
export async function candidates(text: string, country: string | null): Promise<{ list: Entry[]; approx: string | null }> {
  const { names, county, commune, country: hint } = parsePlace(text);
  const field = countryCode(country);
  const order = [...new Set([hint, field, "RO"].filter((c): c is string => !!c))];
  for (const cc of order) {
    const idx = await indexFor(cc);
    if (!idx) continue;
    for (const n of names) {
      let list = idx.byKey.get(n) ?? [];
      if (cc === "RO" && list.length > 1 && county) list = list.filter((e) => e.county === county).length ? list.filter((e) => e.county === county) : list;
      if (cc === "RO" && list.length > 1 && commune) list = list.filter((e) => e.commune === commune).length ? list.filter((e) => e.commune === commune) : list;
      if (list.length) return { list, approx: null };
    }
  }
  for (const n of names) {
    const cc = GLOBAL_HINT.get(n);
    const idx = cc && !order.includes(cc) ? await indexFor(cc) : null;
    const list = idx?.byKey.get(n) ?? [];
    if (list.length) return { list, approx: null };
  }
  const named = names.map((n) => countryCode(n)).find(Boolean) ?? null;
  return { list: [], approx: hint ?? named ?? (field && field !== "RO" ? field : null) };
}

const R = 6371;
export function km(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const dLat = ((b.lat - a.lat) * Math.PI) / 180, dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

const median = (xs: number[]) => { const s = [...xs].sort((a, b) => a - b); return s[Math.floor(s.length / 2)]; };

export type PlaceRef = { key: string; text: string; country: string | null; weight: number };
export type Pin = { key: string; placeId: string | null; name: string; detail: string | null; lat: number; lng: number };

/**
 * Pune pe hartă toate locurile unui arbore deodată. Când un nume e purtat de mai multe sate („Valea Mare” sunt 50),
 * alegem satul cel mai probabil: aproape de celelalte locuri ale neamului și, la egalitate, cel mai mare.
 * Ce a ales omul de mână (Pin) are întâietate. Locurile cu greutatea 0 (cele ale amintirilor) se caută la fel,
 * dar nu mută mijlocul neamului.
 */
export async function resolvePlaces(refs: PlaceRef[], pins: Pin[] = []): Promise<Map<string, Spot | null>> {
  const byPin = new Map(pins.map((p) => [p.key, p]));
  const out = new Map<string, Spot | null>();
  const pending: { ref: PlaceRef; list: Entry[] }[] = [];
  const sure: { cc: string; lat: number; lng: number; w: number }[] = [];
  for (const ref of refs) {
    const pin = byPin.get(ref.key);
    if (pin) {
      const cc = pin.placeId?.split(":")[0] ?? "";
      // Grupul (județul sau țara) îl scoatem din descriere: „com. Urmeniș, jud. Bistrița-Năsăud” → Bistrița-Năsăud.
      const group = cc === "RO" ? pin.detail?.match(/jud\. (.+)$/)?.[1] ?? (pin.detail === "capitala" ? "București" : "România")
        : COUNTRY_NAMES[cc] ?? "Puse de mână pe hartă";
      const area = areaOf(pin.placeId);
      out.set(ref.key, { id: pin.placeId ?? `pin:${ref.key}`, name: pin.name, detail: pin.detail ?? "pus de mână pe hartă", lat: pin.lat, lng: pin.lng, cc, group, how: "pin", ...(area ? { area } : {}) });
      if (ref.weight > 0) sure.push({ cc: pin.placeId?.split(":")[0] ?? "RO", lat: pin.lat, lng: pin.lng, w: ref.weight });
      continue;
    }
    const { list, approx } = await candidates(ref.text, ref.country);
    if (list.length === 1) {
      out.set(ref.key, spot(list[0], "found"));
      if (ref.weight > 0) sure.push({ cc: list[0].cc, lat: list[0].lat, lng: list[0].lng, w: ref.weight });
    } else if (list.length > 1) pending.push({ ref, list });
    else if (approx && COUNTRY_CENTER[approx]) {
      const [lat, lng] = COUNTRY_CENTER[approx];
      out.set(ref.key, { id: `country:${approx}`, name: COUNTRY_NAMES[approx] ?? approx, detail: "doar țara, fără localitate", lat, lng, cc: approx, group: COUNTRY_NAMES[approx] ?? approx, how: "country" });
    } else out.set(ref.key, null);
  }
  // Mijlocul neamului în fiecare țară: mediana locurilor sigure, cântărită cu numărul de oameni.
  const centers = new Map<string, { lat: number; lng: number }>();
  for (const cc of new Set(sure.map((s) => s.cc))) {
    const pts = sure.filter((s) => s.cc === cc).flatMap((s) => Array(Math.min(s.w, 20)).fill(s));
    centers.set(cc, { lat: median(pts.map((p) => p.lat)), lng: median(pts.map((p) => p.lng)) });
  }
  for (const { ref, list } of pending) {
    const score = (e: Entry) => Math.log(e.prior + 1) - (centers.has(e.cc) ? km(e, centers.get(e.cc)!) / 80 : 0);
    const best = list.reduce((a, b) => (score(b) > score(a) ? b : a));
    out.set(ref.key, spot(best, "guess", list.length));
  }
  return out;
}

/** Variantele pentru un nume ambiguu, cu cea mai probabilă întâi (pentru „Nu e acesta? Alege”). */
export async function choicesFor(text: string, country: string | null, near?: { lat: number; lng: number }): Promise<Spot[]> {
  const { list } = await candidates(text, country);
  const score = (e: Entry) => Math.log(e.prior + 1) - (near ? km(e, near) / 80 : 0);
  return [...list].sort((a, b) => score(b) - score(a)).slice(0, 30).map((e) => spot(e, "found"));
}

function lev(a: string, b: string, max: number) {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let best = i;
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      best = Math.min(best, cur[j]);
    }
    if (best > max) return max + 1;
    prev = cur;
  }
  return prev[b.length];
}

/** Căutarea din „Pune pe hartă”: potriviri exacte, apoi început de nume, apoi greșeli mici de scriere („Sincrau”). */
export async function searchPlaces(q: string, country: string | null, limit = 8): Promise<Spot[]> {
  const { names, county } = parsePlace(q);
  const k = names[0] ?? "";
  if (k.length < 2) return [];
  const ccs = [...new Set([countryCode(country), GLOBAL_HINT.get(k), "RO"].filter((c): c is string => !!c))];
  const found: { e: Entry; rank: number }[] = [];
  for (const cc of ccs) {
    const idx = await indexFor(cc);
    if (!idx) continue;
    for (const e of idx.entries) {
      if (county && e.county && e.county !== county) continue;
      let rank = 9;
      for (const key of e.keys) {
        const r = key === k ? 0 : key.startsWith(k) ? 1 : key.includes(` ${k}`) ? 2 : key.includes(k) ? 3 : k.length >= 4 && lev(key, k, k.length > 7 ? 2 : 1) <= (k.length > 7 ? 2 : 1) ? 4 : 9;
        rank = Math.min(rank, r);
      }
      if (rank < 9) found.push({ e, rank });
    }
  }
  found.sort((a, b) => a.rank - b.rank || b.e.prior - a.e.prior || a.e.name.localeCompare(b.e.name, "ro"));
  return found.slice(0, limit).map(({ e }) => spot(e, "found"));
}
