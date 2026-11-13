import { db } from "@/db";
import { dueReminders, markReminded, reminderMailReady, sendMail } from "@/lib/extra";
import { planSettings, isTier } from "@/lib/plans";
import { SITE_URL } from "@/lib/site-url";
import { isLocale } from "@/i18n/locales";
import { getAppName, getT } from "@/i18n/server";

/**
 * Aducerea aminte înainte de expirare (o dată pe an, cu `reminderDays` zile înainte): anul nu se reînnoiește singur, așa că
 * le scriem celor al căror an se termină, cu legătura la /plata. Rulează doar dacă cel care ține site-ul a pus serviciul de email
 * (RESEND_API_KEY, REMINDER_FROM) și cheia de pornire CRON_SECRET; până atunci, lista e în Admin → Manager control.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return new Response("nu", { status: 401 });
  if (!reminderMailReady()) return Response.json({ ok: false, reason: "fără serviciu de email" });
  const s = await planSettings(db);
  let sent = 0;
  for (const r of await dueReminders(db, s.reminderDays)) {
    const locale = isLocale(r.locale) ? r.locale : "ro";
    const [t, app] = await Promise.all([getT("ReminderMail", locale), getAppName(locale)]);
    const date = new Intl.DateTimeFormat(locale, { dateStyle: "long", timeZone: "Europe/Bucharest" }).format(r.paidUntil!);
    const tp = await getT("Plata", locale);
    const plan = tp(`tiers.${isTier(r.tier) ? r.tier : "basic"}.name` as "tiers.basic.name");
    const ok = await sendMail(r.email, t("subject", { app, date }), t("body", { name: r.name, app, date, plan, link: `${SITE_URL}/plata` }));
    if (ok) { await markReminded(db, r.userId, r.paidUntil!); sent++; }
  }
  return Response.json({ ok: true, sent });
}
