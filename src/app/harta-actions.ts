"use server";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { placePin } from "@/db/schema";
import { currentUser, roleIn, can } from "@/lib/access";
import { choicesFor, searchPlaces, type Spot } from "@/lib/places";

const UUID = z.string().uuid();

/** Căutarea din „Pune pe hartă”: satele și orașele care se potrivesc cu ce scrii. */
export async function findPlaces(q: string, country: string | null): Promise<Spot[]> {
  if (!(await currentUser())) return [];
  return searchPlaces(String(q).slice(0, 120), country ? String(country).slice(0, 60) : null);
}

/** Satele cu același nume, cel mai apropiat de restul neamului întâi (pentru „Nu e acesta?”). */
export async function placeChoices(treeId: string, text: string, country: string | null, near: { lat: number; lng: number } | null): Promise<Spot[]> {
  const me = await currentUser();
  if (!me || !UUID.safeParse(treeId).success || !(await roleIn(db, treeId, me.id))) return [];
  const n = near && Number.isFinite(near.lat) && Number.isFinite(near.lng) ? { lat: near.lat, lng: near.lng } : undefined;
  return choicesFor(String(text).slice(0, 200), country ? String(country).slice(0, 60) : null, n);
}

const Pin = z.object({
  treeId: z.string().uuid(),
  key: z.string().min(1).max(300),
  placeId: z.string().max(120).nullable(),
  name: z.string().trim().min(1).max(120),
  detail: z.string().max(200).nullable(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

/** Leagă textul unui loc (din toate fișele care îl au) de un punct de pe hartă: ales din listă sau pus cu un click. */
export async function pinPlace(input: z.input<typeof Pin>): Promise<{ ok?: boolean; error?: string }> {
  const v = Pin.safeParse(input);
  if (!v.success) return { error: "Locul nu e complet. Alege-l din listă sau dă click pe hartă." };
  const me = await currentUser();
  if (!me) return { error: "Intră în cont." };
  if (!can(await roleIn(db, v.data.treeId, me.id), "contributor")) return { error: "Doar cei care completează arborele pot pune locuri pe hartă." };
  const { treeId, key, ...rest } = v.data;
  await db.insert(placePin).values({ treeId, key, ...rest, createdBy: me.id })
    .onConflictDoUpdate({ target: [placePin.treeId, placePin.key], set: { ...rest, createdBy: me.id, createdAt: new Date() } });
  revalidatePath(`/arbore/${treeId}/harta`);
  return { ok: true };
}

/** Renunță la locul pus de mână: harta îl caută din nou singură, după nume. */
export async function unpinPlace(treeId: string, key: string): Promise<{ ok?: boolean; error?: string }> {
  const me = await currentUser();
  if (!me || !UUID.safeParse(treeId).success) return { error: "Intră în cont." };
  if (!can(await roleIn(db, treeId, me.id), "contributor")) return { error: "Doar cei care completează arborele pot schimba locurile." };
  await db.delete(placePin).where(and(eq(placePin.treeId, treeId), eq(placePin.key, String(key))));
  revalidatePath(`/arbore/${treeId}/harta`);
  return { ok: true };
}
