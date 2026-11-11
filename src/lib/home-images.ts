import { eq } from "drizzle-orm";
import { z } from "zod";
import type { Db } from "@/db";
import { appSetting } from "@/db/schema";

/**
 * Pozele primei pagini, pe locuri („sloturi”). Fiecare loc are poza inițială din public/home (Unsplash, licență liberă,
 * vezi public/home/CREDITS.md); adminul o poate înlocui din Admin → Poze prima pagină. Poza încărcată stă în bucket-ul
 * „assets” și se servește public prin /api/poza-acasa/<loc>; cheia și data ei stau în app_setting („home_images”).
 */
export const HOME_SLOTS = [
  { id: "banner", file: "banner", label: "Bannerul de sus", hint: "Poza mare de pe toată lățimea. Pune una lată (peisaj), cu fețele în jumătatea de sus: panoul cu „Cartea Neamului” acoperă partea de jos.", wide: true },
  { id: "gen1", file: "bunici", label: "Patru generații: Bunicii", hint: "Ramă înaltă (portret)." },
  { id: "gen2", file: "familie", label: "Patru generații: Părinții", hint: "Ramă înaltă (portret)." },
  { id: "gen3", file: "tineri", label: "Patru generații: Tinerii", hint: "Ramă înaltă (portret)." },
  { id: "gen4", file: "copii", label: "Patru generații: Copiii", hint: "Ramă înaltă (portret)." },
  { id: "memories", file: "bunic-nepot", label: "Ce găsești aici: Lada cu amintiri", hint: "Cartonaș lat; jos stă peste poză „Glasul bunicii Ana”." },
  { id: "map", file: "sat", label: "Ce găsești aici: Harta neamului", hint: "Cartonaș lat." },
  { id: "book", file: "album", label: "Ce găsești aici: Cartea neamului", hint: "Cartonaș lat." },
  { id: "sunset", file: "apus", label: "Banda cu citatul (apusul)", hint: "Poză lată, întunecată sau la apus: peste ea stă textul alb.", wide: true },
  { id: "table", file: "masa", label: "Cum începi", hint: "Poză lată, lângă cei trei pași." },
  { id: "hands", file: "maini", label: "Chemarea de la final", hint: "Poză lată; se vede închisă la culoare, sub text.", wide: true },
] as const;
export type HomeSlot = (typeof HOME_SLOTS)[number]["id"];
export const isHomeSlot = (s: unknown): s is HomeSlot => HOME_SLOTS.some((x) => x.id === s);

const KEY = "home_images";
const Entry = z.object({ key: z.string(), type: z.string(), at: z.string(), by: z.string().nullable().default(null) });
const Images = z.record(Entry);
export type HomeImageEntry = z.infer<typeof Entry>;

export async function homeImageEntries(db: Pick<Db, "select">): Promise<Partial<Record<HomeSlot, HomeImageEntry>>> {
  const [row] = await db.select({ value: appSetting.value }).from(appSetting).where(eq(appSetting.key, KEY)).catch(() => []);
  const parsed = Images.safeParse(row?.value ?? {});
  return parsed.success ? (parsed.data as Partial<Record<HomeSlot, HomeImageEntry>>) : {};
}

/** Adresa pozei fiecărui loc: cea încărcată de admin (cu data în adresă, ca browserele să ia poza nouă) sau cea inițială. */
export type HomeImage = { src: string; custom: boolean };
export async function homeImages(db: Pick<Db, "select">): Promise<Record<HomeSlot, HomeImage>> {
  const set = await homeImageEntries(db);
  return Object.fromEntries(HOME_SLOTS.map((s) => {
    const e = set[s.id];
    return [s.id, e ? { src: `/api/poza-acasa/${s.id}?v=${Date.parse(e.at)}`, custom: true } : { src: `/home/${s.file}.jpg`, custom: false }];
  })) as Record<HomeSlot, HomeImage>;
}

/** Pune (`entry`) sau scoate (`null`, înapoi la poza inițială) poza unui loc; întoarce cheia pozei vechi, ca s-o ștergem. */
export async function setHomeImage(db: Pick<Db, "select" | "insert">, slot: HomeSlot, entry: HomeImageEntry | null, by: string, now = new Date()) {
  const cur = await homeImageEntries(db);
  const old = cur[slot]?.key ?? null;
  const next = { ...cur };
  if (entry) next[slot] = entry; else delete next[slot];
  await db.insert(appSetting).values({ key: KEY, value: next, updatedBy: by, updatedAt: now })
    .onConflictDoUpdate({ target: appSetting.key, set: { value: next, updatedBy: by, updatedAt: now } });
  return old;
}
