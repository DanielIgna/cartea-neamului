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

/** Legătura care confirmă adresa de email a contului (cerută din „Siguranța contului”). */
export async function sendVerifyMail(userId: string, url: string, cookieHeader: string | null) {
  const u = await userBasics(db, userId);
  if (!u) return false;
  const locale = localeFromCookieHeader(cookieHeader) ?? (isLocale(u.locale) ? u.locale : "ro");
  const [t, app] = await Promise.all([getT("SecurityMail", locale), getAppName(locale)]);
  const hello = t("hello", { name: u.name || "" }).replace(/\s+,/, ",");
  const text = [hello, "", t("verifyIntro", { app }), "", url, "", t("verifyIgnore"), "", app].join("\n");
  const html = `<div style="font-family:Georgia,serif;font-size:16px;line-height:1.5;color:#2b2118;max-width:520px">
<p>${esc(hello)}</p><p>${esc(t("verifyIntro", { app }))}</p>
<p style="margin:24px 0"><a href="${esc(url)}" style="background:#8a4b2a;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;display:inline-block">${esc(t("verifyButton"))}</a></p>
<p style="font-size:14px;color:#6b5a4c">${esc(t("verifyIgnore"))}</p><p>${esc(app)}</p></div>`;
  const ok = await sendMail(u.email, t("verifySubject", { app }), text, fetch, html);
  if (!ok && process.env.NODE_ENV !== "production") console.info("Legătura de confirmare a emailului (doar local):", url);
  return ok;
}

/**
 * Recuperarea între proprietari (Admin → Securitate): amândoi primesc un email că unul a resetat verificarea în 2 pași a
 * celuilalt. Panoul și emailurile pentru proprietari sunt în română.
 */
export async function sendOwnerRecoveryMail(to: string[], byName: string, targetName: string) {
  const site = SITE_URL;
  const lines = [
    `${byName} a resetat verificarea în 2 pași pentru contul lui ${targetName} pe Cartea Neamului (Admin → Securitate). Toate sesiunile acelui cont au fost închise.`,
    `${targetName}: intră din nou cu emailul și parola (dacă ai uitat-o, „Ai uitat parola?”: ${site}/intrare/parola-uitata), apoi pornește iar verificarea în 2 pași: ${site}/securitate`,
    "Dacă nu ați cerut voi asta, schimbați imediat parolele amândoi și scrieți-vă unul altuia.",
  ];
  const html = `<div style="font-family:Georgia,serif;font-size:16px;line-height:1.5;color:#2b2118;max-width:520px">${lines.map((l) => `<p>${esc(l)}</p>`).join("")}<p>Cartea Neamului</p></div>`;
  const results = await Promise.all(to.map((addr) => sendMail(addr, "Cartea Neamului: verificarea în 2 pași a fost resetată", [...lines, "", "Cartea Neamului"].join("\n\n"), fetch, html)));
  return results.every(Boolean);
}
