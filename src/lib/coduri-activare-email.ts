/**
 * Emailul de după activarea unui cod (Daniel, 25.11.2026): confirmă planul și data de expirare, fără reclame, oferte sau prețuri.
 * Pleacă o singură dată pe cod (cheia Resend e codul). O greșeală la trimitere nu strică activarea.
 */
import { eq } from "drizzle-orm";
import type { Db } from "@/db";
import { user } from "@/db/schema";
import { isLocale, type Locale } from "@/i18n/locales";
import { getAppName, getT } from "@/i18n/server";
import { sendEmail, siteInbox, type EmailResult } from "./email";
import { footerFor, renderMail } from "./emailuri";
import type { Tier } from "./plans";
import { SITE_URL } from "./site-url";

export const HELP_EMAIL = "contact@carteaneamului.ro";

export async function sendActivationMail(db: Pick<Db, "select">, a: { userId: string; cod: string; plan: Tier; until: Date }): Promise<EmailResult | null> {
  const [u] = await db.select({ name: user.name, email: user.email, locale: user.locale }).from(user).where(eq(user.id, a.userId));
  if (!u?.email) return null;
  const l: Locale = isLocale(u.locale) ? u.locale : "ro";
  const [t, tp, app] = await Promise.all([getT("CodActivare", l), getT("Plata", l), getAppName(l)]);
  const date = new Intl.DateTimeFormat(l, { dateStyle: "long", timeZone: "Europe/Bucharest" }).format(a.until);
  const { html, text } = renderMail([
    { p: u.name ? t("mailHello", { name: u.name }) : t("mailHelloNoName") },
    { p: t("mailBody") },
    { rows: [[t("mailPlan"), tp(`tiers.${a.plan}.name`)], [t("mailUntil"), date], [t("mailCode"), a.cod]] },
    { p: t("mailEnd") },
    { button: t("mailButton"), href: `${SITE_URL}/` },
    { p: t("mailHelp", { email: HELP_EMAIL }) },
  ], await footerFor(l));
  return sendEmail({ to: u.email, subject: t("mailSubject", { app }), html, text, replyTo: siteInbox(), idempotencyKey: `cod-activare/${a.cod}`, tag: "cod-activare" });
}
