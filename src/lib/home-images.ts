import { eq } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import type { Db } from "@/db";
import { appSetting } from "@/db/schema";
import { HOME_VARIANTS } from "@/lib/home-variants";

/**
 * Pozele primei pagini, pe locuri („sloturi”). Fiecare loc are o poză inițială în public/home și câteva variante gata
 * de ales în public/home/variante (toate Unsplash, licență liberă, vezi public/home/CREDITS.md). Din Admin → Poze prima
 * pagină adminul alege ce poză stă pe pagină sau încarcă altele; la banner poate alege mai multe, care se schimbă singure.
 * Pozele încărcate stau în bucket-ul „assets” și se servesc public prin /api/poza-acasa/<id>; alegerile stau în
 * app_setting („home_images”).
 */
export const HOME_SLOTS = [
  { id: "banner", file: "banner", credit: "Marian Strinoiu", label: "Bannerul de sus", hint: "Poze late (peisaj), cu fețele în jumătatea de sus: panoul cu „Cartea Neamului” acoperă partea de jos. Poți bifa mai multe: se schimbă singure, la câteva secunde.", wide: true, multi: true },
  { id: "gen1", file: "bunici", credit: "Daniel Miksha", label: "Patru generații: Bunicii", hint: "Ramă înaltă (portret)." },
  { id: "gen2", file: "familie", credit: "Marian Strinoiu", label: "Patru generații: Părinții", hint: "Ramă înaltă (portret)." },
  { id: "gen3", file: "tineri", credit: "Stefan Vibes", label: "Patru generații: Tinerii", hint: "Ramă înaltă (portret)." },
  { id: "gen4", file: "copii", credit: "Anna Khromova", label: "Patru generații: Copiii", hint: "Ramă înaltă (portret)." },
  { id: "memories", file: "bunic-nepot", credit: "Vitaly Gariev", label: "Ce găsești aici: Lada cu amintiri", hint: "Cartonaș lat; jos stă peste poză „Glasul bunicii Ana”." },
  { id: "map", file: "sat", credit: "The Now Time", label: "Ce găsești aici: Harta neamului", hint: "Cartonaș lat." },
  { id: "book", file: "album", credit: "Laura Fuhrman", label: "Ce găsești aici: Cartea neamului", hint: "Cartonaș lat." },
  { id: "sunset", file: "apus", credit: "Mike Scheid", label: "Banda cu citatul (apusul)", hint: "Poză lată, întunecată sau la apus: peste ea stă textul alb.", wide: true },
  { id: "table", file: "masa", credit: "Jelly Marketing", label: "Cum începi", hint: "Poză lată, lângă cei trei pași." },
  { id: "hands", file: "maini", credit: "Rod Long", label: "Chemarea de la final", hint: "Poză lată; se vede închisă la culoare, sub text.", wide: true },
] as const;
export type HomeSlot = (typeof HOME_SLOTS)[number]["id"];
export const isHomeSlot = (s: unknown): s is HomeSlot => HOME_SLOTS.some((x) => x.id === s);
const slotInfo = (slot: HomeSlot) => HOME_SLOTS.find((s) => s.id === slot)!;
export const isMultiSlot = (slot: HomeSlot) => "multi" in slotInfo(slot);

/** Câte poze pot sta deodată în banner și câte poze încărcate poate avea un loc. */
export const MAX_ACTIVE = 8;
export const MAX_UPLOADS = 12;

const KEY = "home_images";
const Upload = z.object({ id: z.string().regex(/^[\w-]+$/), key: z.string(), type: z.string(), at: z.string(), by: z.string().nullable().default(null) });
const SlotState = z.object({ uploads: z.array(Upload).default([]), active: z.array(z.string()).default([]) });
const State = z.object({ v: z.literal(2), slots: z.record(SlotState) });
/** Forma veche (PR #64): o singură poză încărcată pe loc. */
const Legacy = z.record(z.object({ key: z.string(), type: z.string(), at: z.string(), by: z.string().nullable().default(null) }));
export type HomeUpload = z.infer<typeof Upload>;
export type HomeSlotState = z.infer<typeof SlotState>;
export type HomeImagesState = Partial<Record<HomeSlot, HomeSlotState>>;

/** Citește alegerile salvate; înțelege și forma veche, cu o singură poză încărcată pe loc. */
export function parseHomeState(value: unknown): HomeImagesState {
  const v2 = State.safeParse(value);
  if (v2.success) return Object.fromEntries(Object.entries(v2.data.slots).filter(([k]) => isHomeSlot(k))) as HomeImagesState;
  const old = Legacy.safeParse(value ?? {});
  if (!old.success) return {};
  const out: HomeImagesState = {};
  for (const [slot, e] of Object.entries(old.data)) {
    if (!isHomeSlot(slot)) continue;
    const id = e.key.replace(/^.*\//, "").replace(/\.\w+$/, "").replace(/[^\w-]/g, "");
    out[slot] = { uploads: [{ id, ...e }], active: [`u:${id}`] };
  }
  return out;
}

export async function homeImagesState(db: Pick<Db, "select">): Promise<HomeImagesState> {
  const [row] = await db.select({ value: appSetting.value }).from(appSetting).where(eq(appSetting.key, KEY)).catch(() => []);
  return parseHomeState(row?.value);
}

export async function saveHomeImagesState(db: Pick<Db, "insert">, state: HomeImagesState, by: string, now = new Date()) {
  const value = { v: 2, slots: state };
  await db.insert(appSetting).values({ key: KEY, value, updatedBy: by, updatedAt: now })
    .onConflictDoUpdate({ target: appSetting.key, set: { value, updatedBy: by, updatedAt: now } });
  // Prima pagină ține pozele alese în cache (HOME_IMAGES_TAG); după o schimbare, le citește din nou.
  try { revalidateTag(HOME_IMAGES_TAG); } catch { /* în afara unei cereri Next (teste, scripturi) nu e cache de golit */ }
}

/** Eticheta cache-ului cu pozele primei pagini (vezi components/Landing.tsx). */
export const HOME_IMAGES_TAG = "home-images";

/** O poză de ales pentru un loc: cea inițială, o variantă din public/home/variante sau una încărcată de admin. */
export type HomeImage = { id: string; src: string; custom: boolean; credit?: string };

/** Toate pozele dintre care se poate alege pentru un loc, în ordine: inițiala, variantele, apoi cele încărcate. */
export function slotOptions(slot: HomeSlot, st: HomeSlotState | undefined): HomeImage[] {
  const info = slotInfo(slot);
  const builtIn = [{ file: info.file as string, credit: info.credit as string | undefined }, ...(HOME_VARIANTS[slot] ?? [])]
    .map((v) => ({ id: `b:${v.file}`, src: `/home/${v.file}.jpg`, custom: false, credit: v.credit }));
  const uploads = (st?.uploads ?? []).map((u) => ({ id: `u:${u.id}`, src: `/api/poza-acasa/${u.id}`, custom: true }));
  return [...builtIn, ...uploads];
}

/** Pozele care stau acum pe pagină într-un loc (la banner pot fi mai multe); dacă nu e aleasă niciuna, cea inițială. */
export function activeImages(slot: HomeSlot, st: HomeSlotState | undefined): HomeImage[] {
  const opts = slotOptions(slot, st);
  const picked = (st?.active ?? []).map((id) => opts.find((o) => o.id === id)).filter((o): o is HomeImage => !!o);
  const list = picked.length ? picked : (defaultActive(slot).map((id) => opts.find((o) => o.id === id)).filter(Boolean) as HomeImage[]);
  return isMultiSlot(slot) ? list.slice(0, MAX_ACTIVE) : list.slice(0, 1);
}

/** Ce stă pe pagină când adminul n-a ales nimic: la banner, inițiala și variantele marcate „pornit”. */
function defaultActive(slot: HomeSlot): string[] {
  const info = slotInfo(slot);
  const extra = isMultiSlot(slot) ? (HOME_VARIANTS[slot] ?? []).filter((v) => v.start).map((v) => `b:${v.file}`) : [];
  return [`b:${info.file}`, ...extra];
}

export async function homeImages(db: Pick<Db, "select">): Promise<Record<HomeSlot, HomeImage[]>> {
  const st = await homeImagesState(db);
  return Object.fromEntries(HOME_SLOTS.map((s) => [s.id, activeImages(s.id, st[s.id])])) as Record<HomeSlot, HomeImage[]>;
}

/** Alege pozele de pe pagină ale unui loc (doar dintre cele existente; la locurile simple, doar una). */
export function withActive(state: HomeImagesState, slot: HomeSlot, ids: string[]): HomeImagesState {
  const st = state[slot] ?? { uploads: [], active: [] };
  const valid = new Set(slotOptions(slot, st).map((o) => o.id));
  const clean = [...new Set(ids)].filter((id) => valid.has(id)).slice(0, isMultiSlot(slot) ? MAX_ACTIVE : 1);
  return { ...state, [slot]: { ...st, active: clean } };
}

/** Adaugă o poză încărcată și o pune pe pagină (la banner, alături de celelalte). */
export function withUpload(state: HomeImagesState, slot: HomeSlot, up: HomeUpload): HomeImagesState {
  const st = state[slot] ?? { uploads: [], active: [] };
  const current = activeImages(slot, st).map((i) => i.id);
  const next = { ...state, [slot]: { uploads: [...st.uploads, up], active: st.active } };
  return withActive(next, slot, isMultiSlot(slot) ? [...current, `u:${up.id}`] : [`u:${up.id}`]);
}

/** Scoate o poză încărcată; întoarce și cheia fișierului, ca s-o ștergem din bucket. */
export function withoutUpload(state: HomeImagesState, slot: HomeSlot, id: string): { state: HomeImagesState; key: string | null } {
  const st = state[slot];
  const up = st?.uploads.find((u) => u.id === id);
  if (!st || !up) return { state, key: null };
  return { state: { ...state, [slot]: { uploads: st.uploads.filter((u) => u.id !== id), active: st.active.filter((a) => a !== `u:${id}`) } }, key: up.key };
}

/** Găsește poza încărcată după id, în oricare loc (pentru /api/poza-acasa/<id>). */
export function findUpload(state: HomeImagesState, id: string): HomeUpload | null {
  for (const st of Object.values(state)) {
    const u = st?.uploads.find((x) => x.id === id);
    if (u) return u;
  }
  return null;
}
