"use server";
import { and, eq, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { waitUntil } from "@vercel/functions";
import { db } from "@/db";
import { session, twoFactor, user } from "@/db/schema";
import { currentUser } from "@/lib/access";
import { adminReady } from "@/lib/admin-access";
import { OWNERS, isOwnerEmail, ownerOf } from "@/lib/admin";
import { clientIp, deviceLabel, logSecurity, placeOf } from "@/lib/securitate";

export type OwnerRecoveryState = { ok?: string; error?: string } | null;

/**
 * Recuperarea între proprietari (Daniel, 2026-11-13): Daniel și Cristina pot reseta unul altuia verificarea în 2 pași, dacă
 * unul a pierdut telefonul și codurile de rezervă. Poate face asta doar un proprietar confirmat, intrat cu verificarea în 2 pași
 * (adminReady), și doar pentru celălalt proprietar, nu pentru sine și nu pentru alți oameni. Se închid toate sesiunile celui
 * resetat, se scrie în Admin → Securitate și pleacă un email la amândoi. Parola nu se vede și nu se schimbă de aici: pentru ea
 * rămâne „Ai uitat parola?”, cu legătura trimisă pe emailul fiecăruia.
 */
export async function resetOwnerTwoStep(_prev: OwnerRecoveryState, form: FormData): Promise<OwnerRecoveryState> {
  const me = await currentUser();
  if (!me || !isOwnerEmail(me.email) || !(await adminReady(me))) return { error: "Doar un proprietar, intrat cu verificarea în 2 pași, poate face asta." };
  const target = ownerOf(String(form.get("email") ?? ""));
  if (!target) return { error: "Adresa nu e a unui proprietar." };
  if (target.email === me.email.trim().toLowerCase()) return { error: "Nu-ți poți reseta singur verificarea: o poate face celălalt proprietar." };
  if (form.get("confirm") !== "da") return { error: "Bifează întâi că ai vorbit cu el (ea) și că vrea asta." };
  const [u] = await db.select({ id: user.id, name: user.name, on: user.twoFactorEnabled }).from(user).where(sql`lower(${user.email}) = ${target.email}`);
  if (!u) return { error: `${target.name} nu are încă un cont.` };
  await db.transaction(async (tx) => {
    await tx.delete(twoFactor).where(eq(twoFactor.userId, u.id));
    await tx.update(user).set({ twoFactorEnabled: false, updatedAt: new Date() }).where(eq(user.id, u.id));
    await tx.delete(session).where(and(eq(session.userId, u.id)));
  });
  const h = await headers();
  await logSecurity(db, { kind: "recuperare_proprietar", userId: u.id, email: target.email, ip: clientIp(h), device: deviceLabel(h.get("user-agent")),
    place: placeOf(h), detail: `de ${me.name} (${me.email})` }).catch((e) => console.error("securitate", e));
  const { sendOwnerRecoveryMail } = await import("@/lib/securitate-mail");
  waitUntil(sendOwnerRecoveryMail(OWNERS.map((o) => o.email), me.name || "Un proprietar", u.name || target.name).catch((e) => console.error("mail recuperare", e)));
  revalidatePath("/admin/securitate");
  return { ok: `Gata: verificarea în 2 pași a lui ${target.name} e resetată și i s-au închis sesiunile. Amândoi ați primit un email.` };
}
