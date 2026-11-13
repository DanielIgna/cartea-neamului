import { readFileSync } from "node:fs";
import path from "node:path";
import { isRegion, type RegionKey } from "./regiuni";

/**
 * Județele (și Bucureștiul) cu reședințele lor, pentru paginile /localitati, din content/localitati/judete.json
 * (scris de mână). Istoricul e scurt și general; registrele și sfaturile vin din regiuni.ts, după regiunea istorică.
 */
export type County = {
  slug: string; name: string; seat: string | null; seatSlug: string | null; regions: RegionKey[];
  history: string; seatHistory: string | null; archive: string;
};

let cache: County[] | null = null;
export function loadCounties(): County[] {
  if (cache) return cache;
  const raw = JSON.parse(readFileSync(path.join(process.cwd(), "content", "localitati", "judete.json"), "utf8")) as { judete: County[] };
  cache = raw.judete.map((c) => ({ ...c, regions: c.regions.filter(isRegion) })).sort((a, b) => a.name.localeCompare(b.name, "ro"));
  return cache;
}
export const getCounty = (slug: string) => loadCounties().find((c) => c.slug === slug) ?? null;
export const isCapital = (c: County) => c.slug === "bucuresti";
export const countyLabel = (c: County) => (isCapital(c) ? "municipiul București" : `județul ${c.name}`);
export const countyPath = (c: County) => `/localitati/${c.slug}`;
export const seatPath = (c: County) => (c.seatSlug ? `/localitati/${c.slug}/${c.seatSlug}` : null);

/** Data ultimei schimbări a fișierului (pentru sitemap). */
export const COUNTIES_UPDATED = new Date("2026-11-13T00:00:00Z");
