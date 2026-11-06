import { and, desc, eq } from "drizzle-orm";
import type { Db } from "@/db";
import { consent } from "@/db/schema";
import { CONSENT_VERSION, type ConsentPurpose } from "./legal";

export type ConsentState = { granted: boolean; at: Date | null };

/** Ultima alegere a omului pentru un acord: dat sau retras, cu data. Fără niciun rând, acordul nu e dat. */
export async function consentState(db: Pick<Db, "select">, userId: string, purpose: ConsentPurpose): Promise<ConsentState> {
  const [last] = await db.select({ granted: consent.granted, at: consent.createdAt }).from(consent)
    .where(and(eq(consent.userId, userId), eq(consent.purpose, purpose))).orderBy(desc(consent.createdAt)).limit(1);
  return { granted: !!last?.granted, at: last?.at ?? null };
}

export const hasConsent = async (db: Pick<Db, "select">, userId: string, purpose: ConsentPurpose) => (await consentState(db, userId, purpose)).granted;

/** Scrie acordul (sau retragerea lui) cu versiunea textului de atunci, ca să se poată arăta oricând la ce a spus „da”. */
export async function recordConsent(db: Pick<Db, "insert">, userId: string, purpose: ConsentPurpose, granted: boolean, now = new Date()) {
  await db.insert(consent).values({ userId, purpose, textVersion: CONSENT_VERSION[purpose], granted, createdAt: now });
}
