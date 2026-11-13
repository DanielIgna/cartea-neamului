/**
 * „Ai uitat parola?” (Daniel, 2026-11-13): emailul cu legătura pentru o parolă nouă. Legătura e făcută de better-auth
 * (src/lib/auth.ts): e valabilă o oră și merge o singură dată. Emailul pleacă prin Resend (RESEND_API_KEY și MAIL_FROM
 * în Vercel); fără ele nu pleacă nimic, iar pagina îi spune omului doar că, dacă are cont, primește emailul.
 */
import { sendMail } from "./extra";
import { isLocale, localeFromCookieHeader, type Locale } from "@/i18n/locales";
import { getAppName, getT } from "@/i18n/server";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** Limba emailului: cea în care citește omul site-ul acum (cookie), altfel cea din cont, altfel româna. */
export function resetMailLocale(cookieHeader: string | null | undefined, accountLocale: string | null | undefined): Locale {
  return localeFromCookieHeader(cookieHeader) ?? (isLocale(accountLocale) ? accountLocale : "ro");
}

export async function sendResetMail(to: string, name: string, link: string, locale: Locale) {
  const [t, app] = await Promise.all([getT("ResetMail", locale), getAppName(locale)]);
  const hello = t("hello", { name: name || "" }).replace(/\s+,/, ",");
  const lines = [t("intro", { app }), t("valid"), t("ignore")];
  const text = [hello, "", lines[0], "", link, "", lines[1], lines[2], "", app].join("\n");
  const html = `<div style="font-family:Georgia,serif;font-size:16px;line-height:1.5;color:#2b2118;max-width:520px">
<p>${esc(hello)}</p><p>${esc(lines[0])}</p>
<p style="margin:24px 0"><a href="${esc(link)}" style="background:#8a4b2a;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;display:inline-block">${esc(t("button"))}</a></p>
<p style="font-size:14px;color:#6b5a4c">${esc(lines[1])}<br>${esc(lines[2])}</p>
<p style="font-size:13px;color:#6b5a4c;word-break:break-all">${esc(link)}</p>
<p>${esc(app)}</p></div>`;
  const ok = await sendMail(to, t("subject", { app }), text, fetch, html);
  if (!ok) console.warn("Emailul pentru parola nouă nu a plecat (Resend nu e pus sau n-a mers).");
  // Doar pe calculator, la încercări: legătura apare în terminal, ca să poată fi deschisă fără email.
  if (!ok && process.env.NODE_ENV !== "production") console.info("Legătura pentru parola nouă (doar local):", link);
  return ok;
}
