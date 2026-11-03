"use server";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { placePin } from "@/db/schema";
import { currentUser, roleIn, can } from "@/lib/access";
import { isDemo } from "@/lib/demo";
import { choicesFor, searchPlaces, type Spot } from "@/lib/places";
import { answerContact, askContact, DEMO_NO, setTreeDiscoverable } from "@/lib/shared-places";

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

/** „Arată neamul celor din aceleași sate”: doar proprietarul arborelui îl pornește sau îl oprește. */
export async function setDiscoverable(treeId: string, on: boolean): Promise<{ ok?: boolean; error?: string }> {
  const me = await currentUser();
  if (!me || !UUID.safeParse(treeId).success) return { error: "Intră în cont." };
  if ((await roleIn(db, treeId, me.id)) !== "owner") return { error: "Doar proprietarul arborelui alege dacă neamul poate fi găsit." };
  if (on && isDemo(me.email)) return { error: DEMO_NO };
  await setTreeDiscoverable(db, treeId, !!on);
  revalidatePath(`/arbore/${treeId}/harta`);
  return { ok: true };
}

const Ask = z.object({
  fromTreeId: z.string().uuid(),
  toTreeId: z.string().uuid(),
  placeId: z.string().min(1).max(120),
  note: z.string().max(500, "Scrie cel mult 500 de caractere.").nullable(),
});

/** „Cere legătura” cu un neam din același sat; proprietarul lui o vede în Mesaje și o acceptă sau o refuză. */
export async function requestContact(input: z.input<typeof Ask>): Promise<{ ok?: boolean; error?: string }> {
  const v = Ask.safeParse(input);
  if (!v.success) return { error: v.error.issues[0]?.message ?? "Cererea nu e completă." };
  const me = await currentUser();
  if (!me) return { error: "Intră în cont." };
  const res = await askContact(db, me, v.data);
  if (res.ok) {
    revalidatePath(`/arbore/${v.data.fromTreeId}/harta`);
    revalidatePath("/mesaje");
  }
  return res;
}

/** Răspunsul proprietarului la o cerere de legătură (și „Încheie legătura”, mai târziu). */
export async function answerLink(id: string, accept: boolean): Promise<{ ok?: boolean; error?: string }> {
  const me = await currentUser();
  if (!me || !UUID.safeParse(id).success) return { error: "Intră în cont." };
  const res = await answerContact(db, me.id, id, !!accept);
  revalidatePath("/mesaje");
  return res;
}
