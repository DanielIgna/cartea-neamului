/**
 * Emailurile conversiei (src/lib/conversie.ts): cine primește azi ce pas, textul în limba lui și trimiterea prin Resend, cu
 * deschiderile și clicurile numărate. Rulat o dată pe zi de automatizarea „conversie” din Admin → Autonomie (oprită implicit)
 * și, fără trimitere, de simulatorul din Admin → Conversie (zilele „mutate” pe un cont de test).
 */
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import type { Db } from "@/db";
import { conversionMail } from "@/db/schema";
import { isAdminUser } from "./admin";
import { isDemo } from "./demo";
import { sendEmail, emailSent, type EmailMessage, type EmailResult } from "./email";
import { footerFor, renderMail, type MailBlock } from "./emailuri";
import { ensureInviteCode, firstName, inviteSettings } from "./invitatii";
import { money } from "./plati";
import { accessFor, isTier, periodPrice, planSettings, type Access, type PlanSettings } from "./plans";
import { isPlan } from "./plan-names";
import { stripeReady } from "./plati";
import { SITE_URL } from "./site-url";
import {
  candidates, clickUrl, convSettings, ensureOffer, openUrl, personCount, pickStep, unsubPostUrl, unsubUrl, withUtm,
  type Candidate, type ConvSettings, type Offer, type Step,
} from "./conversie";
import { isLocale, type Locale } from "@/i18n/locales";
import { getAppName, getT } from "@/i18n/server";

const DAY = 86_400_000;

/** Accesul omului și unde îi încep și i se termină zilele gratuite. */
export function trialOf(c: Candidate, ps: PlanSettings, now: Date, simulate = false): { access: Access; start: Date; trialEnd: Date } {
  // În simulator, contul adminului e socotit ca al unui om obișnuit, ca să-și poată vedea șirul pe propriul cont.
  const exempt = !simulate && (isDemo(c.email) || isAdminUser({ email: c.email, emailVerified: c.emailVerified, createdAt: c.createdAt }));
  const access = accessFor({ createdAt: c.createdAt, plan: isPlan(c.plan) ? c.plan : null, paidUntil: c.paidUntil, tier: isTier(c.tier) ? c.tier : null,
    exempt, keepUntil: c.keepUntil, freeUntil: c.freeUntil }, ps, now);
  const started = ps.startedAt ? new Date(ps.startedAt).getTime() : now.getTime();
  const start = new Date(Math.max(c.createdAt.getTime(), started));
  const trialEnd = access.kind === "proba" ? access.until : access.kind === "expirat" ? access.since : new Date(start.getTime() + ps.trialDays * DAY);
  return { access, start, trialEnd };
}

const priceOf = (ps: PlanSettings, locale: Locale, t: "basic" | "familie" | "premium") => {
  const ro = locale === "ro";
  const v = t === "familie" ? (ro ? ps.familieLei : ps.familieEur) : t === "premium" ? (ro ? ps.premiumLei : ps.premiumEur) : (ro ? ps.priceLei : ps.priceEur);
  return ro ? `${v} lei` : `${v} €`;
};

export type BuiltMail = { subject: string; html: string; text: string; headers: Record<string, string> };

/** Textul unui pas pentru un om, cu legăturile urmărite prin `mailId`. */
export async function buildMail(o: {
  step: Step; mailId: string; userId: string; name: string; locale: Locale; ps: PlanSettings; cs: ConvSettings;
  persons: number; daysLeft: number; inviteLink: string | null; inviteDays: number; offer: Offer | null; site?: string;
}): Promise<BuiltMail> {
  const site = o.site ?? SITE_URL;
  const [t, app, tpr, tsub] = await Promise.all([getT("ConversionMail", o.locale), getAppName(o.locale), getT("Preturi", o.locale), getT("Sub", o.locale)]);
  const tt = t as unknown as (k: string, v?: Record<string, string | number>) => string;
  const link = (path: string) => clickUrl(site, o.mailId, withUtm(path, o.step));
  const basic = priceOf(o.ps, o.locale, "basic");
  const P: MailBlock[] = [{ p: tt("hello", { name: firstName(o.name) || o.name }) }];
  let subject = "";
  const add = (...keys: (string | [string, Record<string, string | number>])[]) => {
    for (const k of keys) P.push({ p: typeof k === "string" ? tt(k, { app }) : tt(k[0], { app, ...k[1] }) });
  };
  if (o.step === "bunvenit") {
    subject = tt("bunvenitSubject", { app });
    add(["bunvenitIntro", { days: o.ps.trialDays }], "bunvenitStep1", "bunvenitStep2", "bunvenitStep3");
    P.push({ button: tt("bunvenitButton"), href: link("/") });
  } else if (o.step === "progres") {
    subject = o.persons > 1 ? tt("progresSubject", { count: o.persons }) : tt("progresSubjectEmpty");
    add(o.persons > 1 ? ["progresIntro", { count: o.persons }] : "progresIntroEmpty", "progresTip");
    add(o.inviteLink && o.inviteDays > 0 ? ["progresInvite", { inviteDays: o.inviteDays }] : "progresInviteOff");
    P.push({ button: tt("progresButton"), href: link(o.inviteLink && o.inviteDays > 0 ? "/invitatii" : "/") });
  } else if (o.step === "planuri") {
    subject = tt("planuriSubject", { app });
    // Cu abonamentele (25.11.2026): planul se plătește și lunar sau trimestrial, deci nu „un plan pe un an”.
    if (o.ps.subs) P.push({ p: tpr("mailPlans") });
    else add(["planuriIntro", { daysLeft: Math.max(1, o.daysLeft) }]);
    const monthly = (x: "familie" | "premium") => {
      const m = o.ps.subs ? periodPrice(x, "luna", true, o.ps) : null;
      return m ? ` ${tsub("orMonthly", { price: money(o.locale === "ro" ? m.lei : m.eur, o.locale).label })}` : "";
    };
    P.push({ rows: [
      [tt("planuriBasic"), tt("planuriBasicWhat", { price: basic })],
      [tt("planuriFamilie"), tt("planuriFamilieWhat", { price: priceOf(o.ps, o.locale, "familie") }) + monthly("familie")],
      [tt("planuriPremium"), tt("planuriPremiumWhat", { price: priceOf(o.ps, o.locale, "premium") }) + monthly("premium")],
    ] });
    if (o.ps.subs) P.push({ p: tsub("autoNote", { days: 7 }) });
    add("planuriBook", "planuriNote");
    P.push({ button: tt("planuriButton"), href: link("/plata") });
  } else if (o.step === "ultimazi") {
    subject = tt("ultimaziSubject");
    add("ultimaziIntro", ["ultimaziPrice", { price: basic }]);
    P.push({ button: tt("ultimaziButton"), href: link("/plata") });
  } else if (o.step === "reducere") {
    const off = o.offer!;
    const until = new Intl.DateTimeFormat(o.locale, { dateStyle: "long", timeStyle: "short", timeZone: "Europe/Bucharest" }).format(off.expiresAt);
    subject = tt("reducereSubject", { percent: off.percent, hours: o.cs.hours });
    add("reducereIntro", ["reducereOffer", { percent: off.percent, code: off.code, until }]);
    P.push({ button: tt("reducereButton"), href: link("/plata") });
  } else {
    subject = tt("asteaptaSubject");
    add(o.persons > 0 ? ["asteaptaIntro", { count: o.persons }] : "asteaptaIntroEmpty", ["asteaptaPlans", { price: basic }], "asteaptaLast");
    P.push({ button: tt("asteaptaButton"), href: link("/") });
  }
  P.push({ note: tt("why", { app }), link: tt("unsubscribe"), href: unsubUrl(site, o.userId) });
  const { html, text } = renderMail(P, await footerFor(o.locale));
  const pixel = `<img src="${openUrl(site, o.mailId)}" width="1" height="1" alt="" style="display:block;width:1px;height:1px;border:0">`;
  return {
    subject, text, html: html.replace("</body>", `${pixel}</body>`),
    headers: { "List-Unsubscribe": `<${unsubPostUrl(site, o.userId)}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
  };
}

export type ConvRun = {
  /** Câți oameni s-au uitat, câți aveau azi un email, câte au plecat, pe pași. */
  observed: number; due: number; sent: number; failed: number; skipped: string[];
  byStep: Partial<Record<Step, number>>;
  /** La simulare (`dryRun`): ce ar pleca, cu textul gata făcut. */
  previews: { userId: string; email: string; step: Step; mail: BuiltMail }[];
};

/**
 * Trece prin oameni și trimite fiecăruia pasul de azi (cel mult unul). `dryRun`: nu trimite și nu scrie nimic, doar arată ce ar
 * pleca (simulatorul din Admin). `localOffer`: codul de reducere se face fără Stripe (teste și simulare).
 */
export async function runConversion(db: Db, o: {
  now?: Date; onlyUserId?: string; dryRun?: boolean; localOffer?: boolean; mailer?: (m: EmailMessage) => Promise<EmailResult>; site?: string;
  /** Simulatorul din Admin: plățile socotite pornite (și cu ele oprite) și fără să țină seama de ce a primit deja omul. */
  simulate?: boolean;
} = {}): Promise<ConvRun> {
  const now = o.now ?? new Date();
  const mailer = o.mailer ?? sendEmail;
  const [real, cs, inv] = await Promise.all([planSettings(db), convSettings(db), inviteSettings(db)]);
  const ps: PlanSettings = o.simulate && !real.on ? { ...real, on: true, startedAt: new Date(0).toISOString() } : real;
  const out: ConvRun = { observed: 0, due: 0, sent: 0, failed: 0, skipped: [], byStep: {}, previews: [] };
  if (!ps.on) { out.skipped.push("plățile sunt oprite: nu există zile gratuite"); return out; }
  const people = await candidates(db, now, o.onlyUserId);
  out.observed = people.length;
  for (const real of people) {
    // În simulator contul e luat ca al unui om nou, fără an plătit: se văd emailurile cu numele și arborele lui.
    const c: Candidate = o.simulate ? { ...real, plan: null, paidUntil: null, tier: null, keepUntil: null } : real;
    if (c.optOut && !o.simulate) continue;
    const { access, start, trialEnd } = trialOf(c, ps, now, !!o.simulate);
    const step = pickStep({ access, start, trialEnd, trialDays: ps.trialDays, sent: new Set(o.simulate ? [] : c.sent), s: cs, now });
    if (!step) continue;
    out.due++;
    const locale: Locale = isLocale(c.locale) ? c.locale : "ro";
    let offer: Offer | null = null;
    if (step === "reducere") {
      const useStripe = !o.localOffer && !o.dryRun;
      if (useStripe && !stripeReady()) { out.skipped.push(`${c.id}: reducerea cere cheia Stripe`); continue; }
      try {
        offer = o.dryRun ? { code: "CNXXXXXXXX", percent: cs.percent, expiresAt: new Date(now.getTime() + cs.hours * 3_600_000), stripePromoId: null, usedAt: null }
          : await ensureOffer(db, c.id, cs, now, { stripe: useStripe });
      } catch (e) {
        out.failed++;
        out.skipped.push(`${c.id}: ${e instanceof Error ? e.message.slice(0, 120) : "Stripe"}`);
        continue;
      }
    }
    const persons = step === "progres" || step === "asteapta" ? await personCount(db, c.id) : 0;
    const inviteLink = step === "progres" && inv.on && !o.dryRun ? `${o.site ?? SITE_URL}/i/${await ensureInviteCode(db, c.id)}` : step === "progres" && inv.on ? `${o.site ?? SITE_URL}/i/XXXXXXX` : null;
    const mailId = randomUUID();
    const daysLeft = access.kind === "proba" ? access.daysLeft : 0;
    const mail = await buildMail({ step, mailId, userId: c.id, name: c.name, locale, ps, cs, persons, daysLeft, inviteLink, inviteDays: inv.daysReferrer, offer, site: o.site });
    if (o.dryRun) { out.previews.push({ userId: c.id, email: c.email, step, mail }); continue; }
    // Rândul se scrie înainte de trimitere (legăturile din email îl caută); dacă emailul nu pleacă, se șterge.
    await db.insert(conversionMail).values({ id: mailId, userId: c.id, step, locale, sentAt: now }).onConflictDoNothing();
    const r = await mailer({ to: c.email, subject: mail.subject, html: mail.html, text: mail.text, headers: mail.headers, tag: `conversie-${step}`,
      idempotencyKey: `conversie-${c.id}-${step}` });
    if (emailSent(r)) {
      out.sent++;
      out.byStep[step] = (out.byStep[step] ?? 0) + 1;
    } else {
      await db.delete(conversionMail).where(eq(conversionMail.id, mailId));
      out.failed++;
    }
  }
  return out;
}
