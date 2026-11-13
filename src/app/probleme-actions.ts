"use server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { problemReport, user } from "@/db/schema";
import { currentUser } from "@/lib/access";
import { isAdminUser } from "@/lib/admin";
import { answerReport, notifyReply, PROBLEM_STATUSES, type ProblemStatus } from "@/lib/probleme";
import { deleteObjects } from "@/lib/storage";
import { SITE_URL } from "@/lib/site-url";
import { isLocale } from "@/i18n/locales";
import { getT } from "@/i18n/server";

const UUID = /^[0-9a-f-]{36}$/i;

/**
 * Admin → Probleme: răspunsul pentru om și starea (nouă, văzută, rezolvată). Un răspuns nou îl vede omul pe /problema, cu „nou”
 * și cu un semn în meniu; dacă e pus Resend, îi pleacă și un email scurt în limba lui.
 */
export async function answerProblem(id: string, reply: string, status: string): Promise<{ ok?: string; error?: string }> {
  const me = await currentUser();
  if (!isAdminUser(me) || !me) return { error: "Nu ai voie aici." };
  if (!UUID.test(id)) return { error: "Problema nu există." };
  const st = PROBLEM_STATUSES.includes(status as ProblemStatus) ? (status as ProblemStatus) : undefined;
  const r = await answerReport(db, id, { reply, status: st });
  if (!r) return { error: "Problema nu există." };
  let mailed = false;
  if (r.replyChanged) {
    const [who] = await db.select({ name: user.name, email: user.email, locale: problemReport.locale, reply: problemReport.reply })
      .from(problemReport).innerJoin(user, eq(user.id, problemReport.userId)).where(eq(problemReport.id, id));
    if (who?.reply) {
      const t = await getT("Problem", isLocale(who.locale) ? who.locale : "ro");
      mailed = await notifyReply(who.email, {
        subject: t("mailSubject"), body: t("mailBody", { name: who.name || "" }).replace(/\s+!/, "!"), link: t("mailLink", { link: `${SITE_URL}/problema#p-${id}` }),
      }, who.reply).catch(() => false);
    }
  }
  revalidatePath("/admin/probleme");
  revalidatePath("/problema");
  return { ok: r.replyChanged ? (mailed ? "Răspunsul e trimis: îl vede pe pagina lui și l-a primit pe email." : "Răspunsul e salvat: îl vede pe pagina lui, cu un semn în meniu (emailul nu e pornit).") : "Gata, am salvat." };
}

/** Șterge de tot o problemă (de pildă una trimisă din greșeală), cu pozele ei. */
export async function deleteProblem(id: string): Promise<{ ok?: string; error?: string }> {
  const me = await currentUser();
  if (!isAdminUser(me) || !me) return { error: "Nu ai voie aici." };
  if (!UUID.test(id)) return { error: "Problema nu există." };
  const [r] = await db.delete(problemReport).where(eq(problemReport.id, id)).returning({ images: problemReport.images });
  if (r) await deleteObjects(r.images.map((i) => i.key));
  revalidatePath("/admin/probleme");
  return { ok: "Am șters-o." };
}
