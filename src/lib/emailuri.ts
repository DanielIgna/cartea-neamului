/**
 * Ce emailuri trimite site-ul prin Resend (src/lib/email.ts) și cum arată (Daniel, 13 noiembrie 2026):
 * - notificarea către noi pentru un mesaj din Contact sau o cerere „Vreau un test ADN”, cu Reply-To = omul care a scris;
 * - confirmarea scurtă către cel care ne-a scris (fără textul lui, ca formularul să nu poată fi folosit ca să trimită altcuiva
 *   ce vrea cineva);
 * - confirmarea plății, după ce Stripe a confirmat-o.
 * Șabloane simple, HTML + text, fără imagini sau fișiere de pe alte site-uri. Textele sunt în src/i18n/messages/emailuri.
 */
import { eq } from "drizzle-orm";
import type { Db } from "@/db";
import { accountPlan, user } from "@/db/schema";
import { isLocale, type Locale } from "@/i18n/locales";
import { adminMailRo as A } from "@/i18n/messages/emailuri/ro";
import { getAppName, getT } from "@/i18n/server";
import { sendEmail, siteInbox, type EmailResult } from "./email";
import { operator } from "./legal";
import { isTier } from "./plans";
import type { PaidSession } from "./plati";
import { SITE_URL } from "./site-url";

const SITE_LINK = "https://carteaneamului.ro";
const OPERATOR_SHORT = "IGNA IOAN DANIEL PFA";

export const escHtml = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export type MailBlock =
  | { p: string }
  | { rows: [label: string, value: string][] }
  | { quote: string }
  | { button: string; href: string }
  | { note: string; link: string; href: string };

/** Un email simplu: paragrafe, un tabel mic, un citat și un buton, cu subsolul firmei. Întoarce HTML-ul și textul simplu. */
export function renderMail(blocks: MailBlock[], footer: string): { html: string; text: string } {
  const html: string[] = [];
  const text: string[] = [];
  for (const b of blocks) {
    if ("p" in b) {
      html.push(`<p style="margin:0 0 16px">${escHtml(b.p)}</p>`);
      text.push(b.p);
    } else if ("rows" in b) {
      html.push(`<table role="presentation" style="border-collapse:collapse;margin:0 0 16px">${b.rows.map(([k, v]) =>
        `<tr><td style="padding:4px 16px 4px 0;color:#6b5a4c;vertical-align:top">${escHtml(k)}</td><td style="padding:4px 0">${escHtml(v)}</td></tr>`).join("")}</table>`);
      text.push(b.rows.map(([k, v]) => `${k}: ${v}`).join("\n"));
    } else if ("quote" in b) {
      html.push(`<div style="margin:0 0 16px;padding:12px 16px;border-left:3px solid #c9a27a;background:#faf5ee;white-space:pre-wrap">${escHtml(b.quote)}</div>`);
      text.push(b.quote);
    } else if ("note" in b) {
      html.push(`<p style="margin:0 0 16px;font-size:13px;color:#6b5a4c">${escHtml(b.note)} <a href="${escHtml(b.href)}" style="color:#8a4b2a">${escHtml(b.link)}</a></p>`);
      text.push(`${b.note} ${b.link}: ${b.href}`);
    } else {
      html.push(`<p style="margin:24px 0"><a href="${escHtml(b.href)}" style="background:#8a4b2a;color:#ffffff;padding:12px 20px;border-radius:8px;text-decoration:none;display:inline-block">${escHtml(b.button)}</a></p>`);
      text.push(`${b.button}: ${b.href}`);
    }
  }
  html.push(`<hr style="border:0;border-top:1px solid #e6dccf;margin:24px 0 12px"><p style="margin:0;font-size:13px;color:#6b5a4c">${escHtml(footer)}<br><a href="${SITE_LINK}" style="color:#8a4b2a">carteaneamului.ro</a></p>`);
  text.push("--", footer, SITE_LINK);
  return {
    html: `<!doctype html><html><body style="margin:0;padding:24px;background:#ffffff"><div style="font-family:Georgia,serif;font-size:16px;line-height:1.5;color:#2b2118;max-width:560px">${html.join("")}</div></body></html>`,
    text: text.join("\n\n"),
  };
}

export async function footerFor(locale: Locale) {
  const t = await getT("Emails", locale);
  return t("footer", { operator: OPERATOR_SHORT, cui: operator().cui });
}

export type InboundMessage = { kind: "contact" | "adn"; name: string; email: string; message: string; phone?: string | null; city?: string | null; page?: string | null; locale?: string | null };

/** Notificarea către adresa site-ului. Reply-To e omul care a scris, ca răspunsul din Gmail să ajungă direct la el. */
export async function notifyInbound(m: InboundMessage): Promise<EmailResult> {
  const t = (k: keyof typeof A, v: Record<string, string> = {}) => A[k].replace(/\{(\w+)\}/g, (_, n: string) => v[n] ?? "");
  const rows: [string, string][] = [[t("name"), m.name], [t("email"), m.email]];
  if (m.phone) rows.push([t("phone"), m.phone]);
  if (m.city) rows.push([t("city"), m.city]);
  if (m.page) rows.push([t("page"), m.page]);
  if (m.locale) rows.push([t("language"), m.locale]);
  const { html, text } = renderMail([
    { p: t(m.kind === "adn" ? "dnaIntro" : "contactIntro") },
    { rows },
    { quote: m.message },
    { p: t("replyHint", { email: m.email }) },
  ], await footerFor("ro"));
  return sendEmail({ to: siteInbox(), subject: t(m.kind === "adn" ? "dnaSubject" : "contactSubject", { name: m.name }), html, text, replyTo: m.email, tag: m.kind });
}

/** „Am primit mesajul tău, revenim în curând.”, în limba omului. */
export async function ackInbound(to: string, locale: string | null | undefined): Promise<EmailResult> {
  const l: Locale = isLocale(locale) ? locale : "ro";
  const [t, app] = await Promise.all([getT("Emails", l), getAppName(l)]);
  const { html, text } = renderMail([{ p: t("ackHello") }, { p: t("ackBody") }, { p: t("ackIgnore") }, { p: app }], await footerFor(l));
  return sendEmail({ to, subject: t("ackSubject", { app }), html, text, replyTo: siteInbox(), tag: "confirmare-mesaj" });
}

/** Suma din Stripe (în bani / cenți), scrisă ca pe site: „50 lei”, „10 €”. */
export function formatPaid(amountMinor: number, currency: string, locale: Locale) {
  const n = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(amountMinor / 100);
  const c = currency.toLowerCase();
  return c === "ron" ? `${n} lei` : c === "eur" ? `${n} €` : `${n} ${currency.toUpperCase()}`;
}

/**
 * Confirmarea plății către client: ce a plătit (planul), suma, data și legătura spre cont. Se cheamă doar când plata a fost
 * trecută acum în bază (applyPayment întoarce true o singură dată pe sesiune Stripe); cheia de idempotență a sesiunii o
 * oprește și la Resend dacă tot ar pleca de două ori.
 */
export async function sendPaymentMail(db: Pick<Db, "select">, paid: PaidSession, now = new Date()): Promise<EmailResult | null> {
  if (!paid.userId) return null;
  const [u] = await db.select({ name: user.name, email: user.email, locale: user.locale, paidUntil: accountPlan.paidUntil, keepUntil: accountPlan.keepUntil })
    .from(user).leftJoin(accountPlan, eq(accountPlan.userId, user.id)).where(eq(user.id, paid.userId));
  if (!u?.email) return null;
  const l: Locale = isLocale(u.locale) ? u.locale : "ro";
  const [t, tp, app] = await Promise.all([getT("Emails", l), getT("Plata", l), getAppName(l)]);
  const plan = tp(`tiers.${isTier(paid.tier) ? paid.tier : "basic"}.name`);
  let what = t(`payKinds.${paid.kind}`, { app, plan });
  if (paid.extra === "carte") what = t("payWithBook", { what });
  const date = (d: Date) => new Intl.DateTimeFormat(l, { dateStyle: "long", timeZone: "Europe/Bucharest" }).format(d);
  const rows: [string, string][] = [[t("payWhat"), what], [t("payAmount"), formatPaid(paid.amount, paid.currency, l)], [t("payDate"), date(now)]];
  const until = paid.kind === "an" ? u.paidUntil : paid.kind === "pastrare" ? u.keepUntil : null;
  if (until) rows.push([t("payUntil"), date(until)]);
  const { html, text } = renderMail([
    { p: u.name ? t("payHello", { name: u.name }) : t("payHelloNoName") },
    { p: t("payBody") },
    { rows },
    { button: t("payButton"), href: `${SITE_URL}/plata` },
    { p: t("payThanks") },
  ], await footerFor(l));
  return sendEmail({ to: u.email, subject: t("paySubject", { app }), html, text, replyTo: siteInbox(), idempotencyKey: `plata/${paid.id}`, tag: "plata" });
}
