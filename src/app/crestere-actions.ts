"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { currentUser } from "@/lib/access";
import { adminReady } from "@/lib/admin-access";
import { markCalendar, type CalStatus } from "@/lib/calendar-continut";
import { GROWTH_DEFAULTS, growthSettings, saveGrowthSettings, type GrowthSettings } from "@/lib/crestere";
import { recomputeHealth } from "@/lib/sanatate-afacere";

async function admin() {
  const me = await currentUser();
  return (await adminReady(me)) ? me : null;
}

/** Un comutator din Admin → Creștere (întrebarea despre email, butoanele invitației, cardurile de distribuit). */
export async function toggleGrowth(form: FormData): Promise<void> {
  const me = await admin();
  if (!me) return;
  const key = String(form.get("key")) as keyof GrowthSettings;
  if (!(key in GROWTH_DEFAULTS)) return;
  const s = await growthSettings(db);
  s[key] = form.get("on") === "1";
  await saveGrowthSettings(db, s, me.id);
  revalidatePath("/admin/crestere");
}

/** Bifa din calendarul de conținut: făcut, sărit sau înapoi la „de făcut”. */
export async function markCalendarItem(form: FormData): Promise<void> {
  const me = await admin();
  if (!me) return;
  const id = String(form.get("id") ?? "").slice(0, 120);
  const st = String(form.get("status") ?? "");
  if (!id) return;
  await markCalendar(db, id, st === "facut" || st === "sarit" ? (st as CalStatus) : null, me.id);
  revalidatePath("/admin/calendar");
}

/** „Recalculează” pe pagina Sănătatea afacerii: scrie scorul de azi (pentru tendință). */
export async function recomputeHealthNow(): Promise<void> {
  const me = await admin();
  if (!me) return;
  await recomputeHealth(db);
  revalidatePath("/admin/sanatate");
}

/** Jurnalul recomandărilor: adaugă o recomandare (din Sănătatea afacerii sau scrisă de mână). */
export async function addRecommendationAction(form: FormData): Promise<void> {
  const me = await admin();
  if (!me) return;
  const text = String(form.get("text") ?? "").trim();
  if (!text) return;
  const { addRecommendation } = await import("@/lib/invatare");
  await addRecommendation(db, { text, source: String(form.get("source") ?? "de mână"), href: String(form.get("href") ?? "") || undefined }, me.id);
  revalidatePath("/admin/invatare");
  revalidatePath("/admin/sanatate");
}

/** Jurnalul recomandărilor: făcută / respinsă / înapoi la propusă, cu o notă scurtă. */
export async function setRecommendationAction(form: FormData): Promise<void> {
  const me = await admin();
  if (!me) return;
  const st = String(form.get("status") ?? "");
  if (st !== "facuta" && st !== "respinsa" && st !== "propusa") return;
  const { setRecommendation } = await import("@/lib/invatare");
  const note = form.get("note");
  await setRecommendation(db, String(form.get("id") ?? ""), st, note == null ? null : String(note), me.id);
  revalidatePath("/admin/invatare");
}

/**
 * „Aproape de plată”: trimite mesajul aprobat (și poate schimbat) de admin unui om din zilele gratuite. Doar dacă omul a spus
 * „Da” la sfaturile pe email, cel mult o dată la 7 zile, cu dezabonare dintr-un clic.
 */
export async function sendLeadMessage(form: FormData): Promise<void> {
  const me = await admin();
  if (!me) return;
  const userId = String(form.get("userId") ?? "");
  const subject = String(form.get("subject") ?? "").trim().slice(0, 140);
  const body = String(form.get("body") ?? "").trim().slice(0, 2000);
  if (!userId || !subject || !body) return;
  const [{ hasConsent }, { sql }, { user, automationMark }, { sendEmail, emailSent }, { renderMail, footerFor }, { unsubscribeToken }, { SITE_URL }, { isLocale }] = await Promise.all([
    import("@/lib/consent"), import("drizzle-orm"), import("@/db/schema"), import("@/lib/email"), import("@/lib/emailuri"), import("@/lib/crestere"), import("@/lib/site-url"), import("@/i18n/locales")]);
  if (!(await hasConsent(db, userId, "news"))) return;
  const recent = await db.select({ at: automationMark.at }).from(automationMark)
    .where(sql`${automationMark.automation} = 'aproape-plata' and ${automationMark.ref} like ${`${userId}:%`} and ${automationMark.at} > now() - interval '7 days'`);
  if (recent.length) return;
  const [u] = await db.select({ email: user.email, locale: user.locale }).from(user).where(sql`${user.id} = ${userId}`);
  if (!u) return;
  const tok = unsubscribeToken(userId);
  const { html, text } = renderMail([
    ...body.split(/\n\s*\n/).map((p) => ({ p })),
    { button: "Deschide arborele", href: `${SITE_URL}/?utm_source=email&utm_medium=email&utm_campaign=aproape-plata` },
    { note: "Primești acest email pentru că ai spus „Da” la sfaturile pe email.", link: "Dezabonează-te dintr-un clic", href: `${SITE_URL}/dezabonare?u=${encodeURIComponent(userId)}&t=${tok}` },
  ], await footerFor(isLocale(u.locale) ? u.locale : "ro"));
  const r = await sendEmail({ to: u.email, subject, html, text, tag: "aproape-plata", replyTo: me.email,
    headers: { "List-Unsubscribe": `<${SITE_URL}/api/vesti/dezabonare?u=${encodeURIComponent(userId)}&t=${tok}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" } });
  if (emailSent(r)) await db.insert(automationMark).values({ automation: "aproape-plata", ref: `${userId}:${new Date().toISOString().slice(0, 10)}` }).onConflictDoNothing();
  revalidatePath("/admin/invatare");
}
