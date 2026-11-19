import { eq } from "drizzle-orm";
import type { Db } from "@/db";
import { appSetting } from "@/db/schema";
import { localizedPath, type Locale } from "@/i18n/locales";
import { getEntry } from "@/lib/continut/colectii";
import { REGIONS, regionIndexable } from "@/lib/diaspora/america";
import { regionPath } from "@/lib/diaspora/index";
import type { Region } from "@/lib/diaspora/tipuri";

/**
 * Planul de cereri de indexare pentru SUA și Canada (Daniel, 19.11.2026: „să le prioritizăm în indexare pe Google”).
 * Google primește cam 10 cereri pe zi în Inspectarea adresei, așa că lista e împărțită pe zile, în ordinea în care contează:
 * ghidurile noi și paginile mari, apoi statele și provinciile cu istorie (întâi în engleză, cum caută cei de acolo, apoi în
 * română), apoi orașele. Ce a bifat Daniel se ține în baza de date (app_setting), ca lista să fie aceeași pe orice aparat.
 */
export const PER_DAY = 10;
export const PLAN_KEY = "seo-plan-indexare";

export type PlanItem = { path: string; label: string; kind: "ghid" | "pagina" | "stat" | "oras" };
export type PlanDay = { day: number; items: PlanItem[] };

/** Ghidurile pentru America de Nord, în ordinea în care merită cerute (doar cele publicate intră în plan). */
const GUIDES = [
  "trace-romanian-ancestors-from-us-canada", "romanian-immigration-waves-us-canada", "valurile-de-emigrare-in-america-de-nord",
  "arbore-genealogic-familie-romania-sua-canada", "romanian-surnames-changed-in-america", "preserve-immigrant-parents-stories",
];

/** Statele și provinciile cu cele mai mari comunități românești vin primele; restul urmează în ordinea alfabetică. */
const FIRST_REGIONS = [
  "ohio", "illinois", "california", "new-york", "florida", "michigan", "pennsylvania", "ontario", "quebec", "alberta",
  "british-columbia", "texas", "new-jersey", "washington", "indiana", "minnesota", "saskatchewan", "manitoba",
];

const rank = (slug: string) => { const i = FIRST_REGIONS.indexOf(slug); return i < 0 ? FIRST_REGIONS.length : i; };
const sortRegions = (rs: Region[]) => [...rs].sort((a, b) => rank(a.slug) - rank(b.slug) || a.slug.localeCompare(b.slug));
const loc = (lang: string): Locale => (lang === "ro" ? "ro" : lang === "fr" ? "fr" : "en-US");
const regionLabel = (r: Region, lang: string) => `${r.name.en ?? r.name.ro}${r.country === "ca" ? ", Canada" : ""} (${lang === "ro" ? "română" : lang === "fr" ? "franceză" : "engleză"})`;

/** Toate adresele din plan, în ordinea priorității. Paginile ascunse de Google (fără istorie) nu intră. */
export function planItems(): PlanItem[] {
  const out: PlanItem[] = [];
  const add = (path: string, label: string, kind: PlanItem["kind"]) => { if (!out.some((x) => x.path === path)) out.push({ path, label, kind }); };
  for (const slug of GUIDES) { const e = getEntry("ghid", slug); if (e) add(`/ghid/${slug}`, e.title, "ghid"); }
  add("/en-us/diaspora/america-de-nord", "North America (engleză)", "pagina");
  add("/diaspora/america-de-nord", "America de Nord (română)", "pagina");
  add("/en-us/diaspora/statele-unite", "United States (engleză)", "pagina");
  add("/en-us/diaspora/canada", "Canada (engleză)", "pagina");
  add("/diaspora/statele-unite", "Statele Unite (română)", "pagina");
  add("/diaspora/canada", "Canada (română)", "pagina");
  const na = REGIONS.filter((r) => (r.country === "us" || r.country === "ca") && regionIndexable(r));
  const states = sortRegions(na.filter((r) => r.kind !== "city"));
  const cities = sortRegions(na.filter((r) => r.kind === "city"));
  // Întâi limba de acolo (engleză; Quebec și în franceză), apoi aceleași pagini în română, pentru diaspora.
  for (const r of states) for (const l of r.langs.filter((x) => x !== "ro").sort((a, b) => Number(a !== "en") - Number(b !== "en"))) add(localizedPath(regionPath(r), loc(l)), regionLabel(r, l), "stat");
  for (const r of states) if (r.langs.includes("ro")) add(regionPath(r), regionLabel(r, "ro"), "stat");
  for (const r of cities) for (const l of r.langs) add(localizedPath(regionPath(r), loc(l)), regionLabel(r, l), "oras");
  return out;
}

export function planDays(items = planItems(), perDay = PER_DAY): PlanDay[] {
  const days: PlanDay[] = [];
  for (let i = 0; i < items.length; i += perDay) days.push({ day: days.length + 1, items: items.slice(i, i + perDay) });
  return days;
}

/** Ce a bifat Daniel: adresa → ziua în care a cerut indexarea (AAAA-LL-ZZ). */
export type PlanDone = Record<string, string>;

export async function planDone(db: Pick<Db, "select">): Promise<PlanDone> {
  const [row] = await db.select({ value: appSetting.value }).from(appSetting).where(eq(appSetting.key, PLAN_KEY)).catch(() => []);
  const v = (row?.value ?? {}) as { done?: unknown };
  const done = v.done && typeof v.done === "object" ? (v.done as Record<string, unknown>) : {};
  return Object.fromEntries(Object.entries(done).filter((e): e is [string, string] => typeof e[1] === "string"));
}

export async function setPlanDone(db: Pick<Db, "select" | "insert">, path: string, on: boolean, by: string, now = new Date()) {
  if (!planItems().some((x) => x.path === path)) return false;
  const done = await planDone(db);
  if (on) done[path] = now.toISOString().slice(0, 10); else delete done[path];
  const value = { done };
  await db.insert(appSetting).values({ key: PLAN_KEY, value, updatedBy: by, updatedAt: now })
    .onConflictDoUpdate({ target: appSetting.key, set: { value, updatedBy: by, updatedAt: now } });
  return true;
}

/** Ziua de acum din plan: prima zi cu adrese nebifate. */
export const currentDay = (days: PlanDay[], done: PlanDone) => days.find((d) => d.items.some((x) => !done[x.path]))?.day ?? null;
