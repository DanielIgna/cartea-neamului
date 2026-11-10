"use server";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { user } from "@/db/schema";
import { currentUser } from "@/lib/access";
import { isDemo } from "@/lib/demo";
import { LOCALE_COOKIE, isLocale } from "@/i18n/locales";
import { getT } from "@/i18n/server";

/**
 * Limba aleasă din listă (sau din întrebarea „Citești în …?”): se ține pe acest telefon un an și, pentru cine are cont, și în
 * cont, ca să-l urmeze pe alt telefon. Contul de probă îl folosesc mai mulți, așa că acolo limba rămâne doar pe telefon.
 */
export async function chooseLanguage(locale: string): Promise<{ ok?: boolean; error?: string }> {
  if (!isLocale(locale)) return { error: (await getT("Errors"))("language") };
  (await cookies()).set(LOCALE_COOKIE, locale, { path: "/", maxAge: 31_536_000, sameSite: "lax", secure: process.env.NODE_ENV === "production" && !!process.env.VERCEL });
  const me = await currentUser();
  if (me && !isDemo(me.email)) await db.update(user).set({ locale }).where(eq(user.id, me.id));
  return { ok: true };
}
