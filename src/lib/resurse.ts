/**
 * „Resurse gratuite pentru genealogie” (/resurse-genealogie): legături spre arhive, biblioteci și baze publice, plus cererea
 * „Vreau un test ADN” și lista informativă de laboratoare (din Admin).
 *
 * Ce NU face pagina: nu vinde teste, nu primește comision, nu are linkuri de afiliere, nu preia documente sau căutări de pe
 * site-urile din listă și nu păstrează date genetice (nici fișiere, nici rezultate, nici potriviri). Cererea are doar nume,
 * email, telefon (opțional), oraș și un mesaj, cu acordul dat și data lui; nu se trimite nimic automat la laboratoare.
 */
import { asc, desc, eq } from "drizzle-orm";
import type { Db } from "@/db";
import { dnaLab, dnaRequest } from "@/db/schema";

export type SourceGroup = "archives" | "libraries" | "other" | "dna";
/** Sursele, verificate de Daniel (2026-11-13). Textele (nume și descriere) sunt în catalogul `Resources`, după id. */
export const SOURCES = [
  { id: "fsGuide", url: "https://www.familysearch.org/en/wiki/Romania_Genealogy", group: "archives" },
  { id: "fsChurch", url: "https://www.familysearch.org/en/wiki/Romania_Church_Records", group: "archives" },
  { id: "fsCensus", url: "https://www.familysearch.org/en/wiki/Romania_Census", group: "archives" },
  { id: "anrDiscover", url: "https://descopera.arhivelenationale.ro/", group: "archives" },
  { id: "anrOnline", url: "https://arhivelenationale.ro/site/cercetare/cercetare-online/", group: "archives" },
  { id: "hungaricana", url: "https://www.hungaricana.hu/en/databases/archives/", group: "archives" },
  { id: "bnr", url: "https://bibnat.ro/biblioteca-digitala/", group: "libraries" },
  { id: "anno", url: "https://anno.onb.ac.at/", group: "libraries" },
  { id: "bcuCluj", url: "https://dspace.bcucluj.ro/", group: "libraries" },
  { id: "bcuIasi", url: "https://dspace.bcu-iasi.ro/", group: "libraries" },
  { id: "europeana", url: "https://www.europeana.eu/ro", group: "libraries" },
  { id: "jewishGenDb", url: "https://www.jewishgen.org/databases/Romania/", group: "other" },
  { id: "jewishGenRo", url: "https://romania.jewishgen.org/", group: "other" },
  { id: "genealogica", url: "https://genealogica.ro/surse", group: "other" },
  { id: "gedmatch", url: "https://www.gedmatch.com/", group: "dna" },
] as const satisfies readonly { id: string; url: string; group: SourceGroup }[];
export const SOURCE_GROUPS: SourceGroup[] = ["archives", "libraries", "other", "dna"];

/** Versiunea textului bifat la cerere; se schimbă când se schimbă textul acordului. */
export const DNA_CONSENT_VERSION = "adn-2026-11-13";
export const DNA_LIMITS = { name: 120, email: 200, phone: 40, city: 120, message: 1000 } as const;

export type DnaInput = { name: string; email: string; phone: string | null; city: string; message: string };
export type DnaProblem = "name" | "email" | "city" | "message" | "consent";

/** Verifică cererea: nume, email valid, oraș, mesaj (cel mult 1000 de caractere) și bifa obligatorie. */
export function checkDnaRequest(raw: Record<string, unknown>): { ok: DnaInput } | { problem: DnaProblem } {
  const s = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
  const name = s(raw.name, DNA_LIMITS.name), email = s(raw.email, DNA_LIMITS.email), phone = s(raw.phone, DNA_LIMITS.phone);
  const city = s(raw.city, DNA_LIMITS.city);
  const message = typeof raw.message === "string" ? raw.message.trim() : "";
  if (!name) return { problem: "name" };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return { problem: "email" };
  if (!city) return { problem: "city" };
  if (!message || message.length > DNA_LIMITS.message) return { problem: "message" };
  if (raw.consent !== "on" && raw.consent !== true) return { problem: "consent" };
  return { ok: { name, email, phone: phone || null, city, message } };
}

/** Păstrează cererea, cu acordul și data lui. Nu trimite nimic nicăieri. */
export async function saveDnaRequest(db: Pick<Db, "insert">, v: DnaInput, locale: string | null, now = new Date()) {
  const [r] = await db.insert(dnaRequest).values({ ...v, locale, consentAt: now, consentVersion: DNA_CONSENT_VERSION, createdAt: now }).returning({ id: dnaRequest.id });
  return r.id;
}

/** Cererile, cele noi întâi (doar pentru admin). */
export const dnaRequests = (db: Pick<Db, "select">) => db.select().from(dnaRequest).orderBy(desc(dnaRequest.createdAt));
export async function resolveDnaRequest(db: Pick<Db, "update">, id: string, done: boolean, now = new Date()) {
  await db.update(dnaRequest).set({ resolvedAt: done ? now : null }).where(eq(dnaRequest.id, id));
}
/** Ștergerea la cerere (din Admin). */
export async function deleteDnaRequest(db: Pick<Db, "delete">, id: string) {
  await db.delete(dnaRequest).where(eq(dnaRequest.id, id));
}

/** Laboratoarele: toate (Admin) sau doar cele vizibile (pagina publică), în ordinea aleasă. */
export const dnaLabs = (db: Pick<Db, "select">) => db.select().from(dnaLab).orderBy(asc(dnaLab.position), asc(dnaLab.name));
export async function publicDnaLabs(db: Pick<Db, "select">) {
  return (await dnaLabs(db)).filter((l) => l.visible);
}

export type LabInput = { name: string; city: string | null; url: string; priceNote: string | null; position: number; visible: boolean };
/** Verifică un laborator din formularul din Admin: nume, adresă https fără parametri de urmărire (UTM, afiliere). */
export function checkLab(raw: Record<string, unknown>): { ok: LabInput } | { error: string } {
  const s = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
  const name = s(raw.name, 120), url = s(raw.url, 500);
  if (!name) return { error: "Scrie numele laboratorului." };
  let u: URL;
  try { u = new URL(url); } catch { return { error: "Adresa nu e bună (începe cu https://)." }; }
  if (u.protocol !== "https:") return { error: "Adresa trebuie să înceapă cu https://." };
  for (const k of [...u.searchParams.keys()]) if (/^(utm_|ref$|aff|affiliate|partner|gclid|fbclid)/i.test(k)) u.searchParams.delete(k);
  const position = Number.parseInt(s(raw.position, 6) || "0", 10);
  return { ok: {
    name, url: u.toString(), city: s(raw.city, 120) || null, priceNote: s(raw.priceNote, 200) || null,
    position: Number.isFinite(position) ? position : 0, visible: raw.visible === "on" || raw.visible === true,
  } };
}
export async function saveLab(db: Pick<Db, "insert" | "update">, id: string | null, v: LabInput, now = new Date()) {
  if (id) await db.update(dnaLab).set({ ...v, updatedAt: now }).where(eq(dnaLab.id, id));
  else await db.insert(dnaLab).values({ ...v, updatedAt: now });
}
export async function deleteLab(db: Pick<Db, "delete">, id: string) {
  await db.delete(dnaLab).where(eq(dnaLab.id, id));
}
