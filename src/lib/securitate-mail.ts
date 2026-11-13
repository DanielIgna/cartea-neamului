/**
 * Emailurile de securitate: intrare de pe un dispozitiv nou și oprirea verificării în 2 pași. Pleacă prin Resend
 * (RESEND_API_KEY și MAIL_FROM în Vercel); fără ele nu pleacă nimic, iar intrarea merge la fel.
 */
import { db } from "@/db";
import { isLocale, localeFromCookieHeader, type Locale } from "@/i18n/locales";
import { getAppName, getFormat, getT } from "@/i18n/server";
import { sendMail } from "./extra";
import { userBasics } from "./securitate";
import { SITE_URL } from "./site-url";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

async function compose(userId: string, cookieHeader: string | null, build: (t: Awaited<ReturnType<typeof getT<"SecurityMail">>>, app: string, locale: Locale) => Promise<{ subject: string; lines: string[] }>) {
  const u = await userBasics(db, userId);
  if (!u) return false;
  const locale = localeFromCookieHeader(cookieHeader) ?? (isLocale(u.locale) ? u.locale : "ro");
  const [t, app] = await Promise.all([getT("SecurityMail", locale), getAppName(locale)]);
  const { subject, lines } = await build(t, app, locale);
  const hello = t("hello", { name: u.name || "" }).replace(/\s+,/, ",");
  const site = SITE_URL;
  const links = [`${t("changePassword")}: ${site}/intrare/parola-uitata`, `${t("securityPage")}: ${site}/securitate`];
  const text = [hello, "", ...lines, "", ...links, "", app].join("\n");
  const html = `<div style="font-family:Georgia,serif;font-size:16px;line-height:1.5;color:#2b2118;max-width:520px">
<p>${esc(hello)}</p>${lines.map((l) => `<p>${esc(l)}</p>`).join("")}
<p><a href="${esc(`${site}/intrare/parola-uitata`)}">${esc(t("changePassword"))}</a><br><a href="${esc(`${site}/securitate`)}">${esc(t("securityPage"))}</a></p>
<p>${esc(app)}</p></div>`;
  return sendMail(u.email, subject, text, fetch, html);
}

export function sendNewDeviceMail(userId: string, device: string, place: string | null, cookieHeader: string | null) {
  return compose(userId, cookieHeader, async (t, app, locale) => {
    const format = await getFormat(locale);
    const when = format.dateTime(new Date(), { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Bucharest" });
    return {
      subject: t("newDeviceSubject", { app }),
      lines: [t("newDeviceIntro", { app }), `${device}${place ? ` · ${place}` : ""} · ${when}`, t("ifYou"), t("ifNotYou")],
    };
  });
}

export function sendTwoStepOffMail(userId: string, cookieHeader: string | null) {
  return compose(userId, cookieHeader, async (t, app) => ({
    subject: t("offSubject", { app }),
    lines: [t("offIntro", { app }), t("ifNotYou")],
  }));
}
