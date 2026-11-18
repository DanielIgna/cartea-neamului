/**
 * Un email = o singură perioadă de zile gratuite (oferta din 18 noiembrie 2026). Când cineva își șterge contul, ținem minte doar
 * o amprentă a emailului (SHA-256 cu o cheie a site-ului, din care emailul nu se poate citi înapoi), nu emailul. Dacă își face
 * din nou cont cu același email, contul nou nu mai primește zilele gratuite (planul „fara-proba”, src/lib/plan-names.ts); poate
 * plăti anul oricând. Emailul se scrie la fel indiferent de litere mari, puncte la Gmail sau „+ceva” înainte de @.
 * Blocarea emailurilor temporare (src/lib/invitatii.ts, `isDisposable`) rămâne cum era.
 */
import { createHmac } from "node:crypto";
import { eq } from "drizzle-orm";
import type { Db } from "@/db";
import { accountPlan, appSetting } from "@/db/schema";

const PREFIX = "proba_folosita:";

/** Emailul adus la o singură formă: litere mici, fără „+ceva”; la Gmail și fără puncte. */
export function normalEmail(email: string): string {
  const [local = "", domain = ""] = email.trim().toLowerCase().split("@");
  const d = domain === "googlemail.com" ? "gmail.com" : domain;
  let l = local.split("+")[0];
  if (d === "gmail.com") l = l.replace(/\./g, "");
  return `${l}@${d}`;
}

export function emailPrint(email: string): string {
  const key = process.env.BETTER_AUTH_SECRET || "cartea-neamului";
  return createHmac("sha256", key).update(normalEmail(email)).digest("hex");
}

/** La ștergerea contului: ține minte că emailul și-a folosit zilele gratuite. */
export async function markTrialUsed(db: Db, email: string, now = new Date()) {
  await db.insert(appSetting).values({ key: PREFIX + emailPrint(email), value: { at: now.toISOString() }, updatedAt: now }).onConflictDoNothing();
}

export async function trialUsed(db: Db, email: string): Promise<boolean> {
  const [r] = await db.select({ key: appSetting.key }).from(appSetting).where(eq(appSetting.key, PREFIX + emailPrint(email)));
  return !!r;
}

/** La contul nou: dacă emailul și-a folosit deja zilele gratuite, contul pornește fără ele. Întoarce true dacă s-a întâmplat. */
export async function applyUsedTrial(db: Db, userId: string, email: string, now = new Date()): Promise<boolean> {
  if (!(await trialUsed(db, email))) return false;
  await db.insert(accountPlan).values({ userId, plan: "fara-proba", note: "Emailul își folosise zilele gratuite într-un cont șters.", updatedAt: now })
    .onConflictDoNothing();
  return true;
}
