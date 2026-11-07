import { eq } from "drizzle-orm";
import type { Db } from "@/db";
import { person, placePin } from "@/db/schema";
import { countryCode, countyCode, placeKey } from "./place-key";
import { resolvePlaces, type PlaceRef } from "./places";
import { areaOfCountry, regionOfCounty, type Origin } from "./vremuri";

/**
 * Din ce ținut istoric e fiecare om, după locul nașterii: satul găsit pe hartă dă județul, județul dă ținutul
 * (Transilvania, Banat, Moldova…). Pentru cei născuți în străinătate, țara. Locurile puse de mână pe hartă au întâietate.
 */
export async function birthOrigins(db: Db, treeId: string): Promise<Record<string, Origin>> {
  const rows = await db.select({ id: person.id, place: person.birthPlace, country: person.birthCountry }).from(person).where(eq(person.treeId, treeId));
  const pins = await db.select().from(placePin).where(eq(placePin.treeId, treeId));
  const refs = new Map<string, PlaceRef>();
  const keyOf = new Map<string, string>();
  for (const r of rows) {
    const key = placeKey(r.place, r.country);
    if (!key) continue;
    keyOf.set(r.id, key);
    const ref = refs.get(key) ?? { key, text: r.place?.trim() || "", country: r.country?.trim() || null, weight: 0 };
    ref.weight++;
    refs.set(key, ref);
  }
  const spots = refs.size ? await resolvePlaces([...refs.values()], pins.map((x) => ({ key: x.key, placeId: x.placeId, name: x.name, detail: x.detail, lat: x.lat, lng: x.lng }))) : new Map();
  const out: Record<string, Origin> = {};
  for (const r of rows) {
    const key = keyOf.get(r.id);
    const spot = key ? spots.get(key) : null;
    const place = r.place?.trim() || "";
    const cc = spot?.cc || countryCode(r.country) || (r.country?.trim() ? "" : "RO");
    if (cc === "RO") {
      const county = spot ? countyCode(spot.group) : null;
      const reg = regionOfCounty(county);
      if (reg) out[r.id] = { area: reg[0], region: reg[1], county: county!, place };
      continue;
    }
    const area = cc ? areaOfCountry(cc) : r.country?.trim() ? "lume" : null;
    // Țara se numește în limba cititorului, după cod; o țară scrisă în fișă și nerecunoscută rămâne cum e scrisă.
    if (area) out[r.id] = cc === "MD" ? { area, region: "basarabia", place } : cc ? { area, cc, place } : { area, country: r.country!.trim(), place };
  }
  return out;
}
