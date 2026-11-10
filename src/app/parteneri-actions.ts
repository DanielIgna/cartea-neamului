"use server";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { user } from "@/db/schema";
import { currentUser } from "@/lib/access";
import { isDemo } from "@/lib/demo";
import { readUnsubscribeToken, setPartnerConsent } from "@/lib/partners";
import { getLocale } from "@/i18n/server";

/** Comutatorul „Beneficii de la parteneri” din „Datele mele”: un clic dă acordul, un clic îl retrage. */
export async function setPartnerBenefits(granted: boolean): Promise<{ ok?: boolean; error?: string }> {
  const me = await currentUser();
  if (!me) return { error: "Intră în cont ca să schimbi acordul." };
  if (granted && isDemo(me.email)) return { error: "Contul de probă e folosit de mai mulți oameni, așa că nu-și poate da acordul." };
  await setPartnerConsent(db, me.id, !!granted, { source: "datele-mele", locale: await getLocale() });
  revalidatePath("/datele-mele");
  return { ok: true };
}

/**
 * Dezabonarea din legătura semnată dintr-un email, fără intrare în cont. Se face la apăsarea butonului (POST), nu la simpla
 * deschidere a legăturii, ca programele care verifică linkurile din emailuri să nu retragă acordul în locul omului.
 */
export async function unsubscribePartner(token: string): Promise<{ ok?: boolean; error?: string }> {
  const t = readUnsubscribeToken(token);
  if (!t) return { error: "bad" };
  const [u] = await db.select({ id: user.id }).from(user).where(eq(user.id, t.userId));
  // Un cont șters nu mai e în nicio listă; îi spunem omului că s-a făcut.
  if (u) await setPartnerConsent(db, u.id, false, { source: "dezabonare", partner: t.partner });
  return { ok: true };
}
