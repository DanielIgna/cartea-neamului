/**
 * Autonomia site-ului (Daniel, 2026-11-13, Admin → Autonomie): cât din Cartea Neamului merge singură și ce o ajută să meargă
 * și mai singură. Totul e socotit din ce se strânge deja în site (erori, probleme raportate, securitate, plăți, SEO, jurnalul
 * schimbărilor), cu reguli scrise de mână: fără AI și fără cifre inventate. Fiecare punct din scor are o verificare în spate,
 * care se vede în pagină.
 *
 * Automatizările rulează o dată pe zi, din ceasul Vercel (/api/cron/autonomie, cu CRON_SECRET), sau la „Rulează acum”.
 * Trei feluri, după cât de departe ajung:
 * - „singur”: doar citesc, curăță ce a expirat sau îi scriu adminului; pornite din prima;
 * - „cu acordul tău”: le scriu oamenilor (emailurile de aducere aminte); oprite până le pornești tu, după ce vezi textul;
 * - „cu aprobare”: schimbă ceva ce văd oamenii (de ex. închid probleme); pregătesc lista, iar schimbarea se face doar
 *   după ce apeși „Aprobă”. Nimic din ce atinge bani, datele oamenilor sau texte publice nu se aplică singur.
 */
import { sql, type SQL } from "drizzle-orm";
import type { Db } from "@/db";
import { appSetting, automationMark, automationRun, autonomySnapshot } from "@/db/schema";
import { ENV_KEYS, OWNERS, envSet } from "./admin";
import { ERRORS_SEEN_KEY } from "./admin-stats";
import { securityOverviewOnce } from "./admin-securitate";
import { emailReady } from "./email";
import { dueReminders, markReminded, sendMail } from "./extra";
import { accessFor, accessPeople, accountPlans, isTier, planSettings } from "./plans";
import { stripeReady } from "./plati";
import { dropOldResolved } from "./probleme";
import { activeServiceAccount, listSites, pickSite, seoSettings, submitSitemap } from "./seo";
import { SITE_URL } from "./site-url";
import { bucketReachable, deleteObjects, localStorageMode, storageConfigured } from "./storage";
import { cleanupVisits, localDayHour } from "./vizite";
import journal from "../../drizzle/meta/_journal.json";
import { isLocale } from "@/i18n/locales";
import { getAppName, getT } from "@/i18n/server";

type Row = Record<string, unknown>;
async function rows<T = Row>(db: Db, q: SQL): Promise<T[]> {
  const r = await db.execute(q);
  return (r.rows ?? []) as T[];
}
const n = (v: unknown) => Number(v ?? 0) || 0;
const DAY = 86_400_000;

/* ---------- Automatizările ---------- */

export type Risk = "singur" | "acord" | "aprobare";
export const RISK_LABEL: Record<Risk, string> = { singur: "merge singur", acord: "cu acordul tău", aprobare: "cere aprobare" };

export const AUTO_KEYS = ["sanatate", "curatenie", "sitemap", "aminteste-proba", "aminteste-an", "bun-venit", "probleme-vechi"] as const;
export type AutoKey = (typeof AUTO_KEYS)[number];
export const isAutoKey = (v: unknown): v is AutoKey => typeof v === "string" && (AUTO_KEYS as readonly string[]).includes(v);

export type AutoDef = { key: AutoKey; label: string; what: string; everyDays: number; risk: Risk; defaultOn: boolean; needs?: string };
export const AUTOMATIONS: AutoDef[] = [
  { key: "sanatate", label: "Verificarea sănătății", risk: "singur", defaultOn: true, everyDays: 1,
    what: "Baza de date, migrațiile, stocarea pozelor și erorile de pe server. Dacă ceva pică, mai verifică o dată; îți scrie doar dacă se confirmă, și o singură dată până se repară." },
  { key: "curatenie", label: "Curățenie", risk: "singur", defaultOn: true, everyDays: 1,
    what: "Șterge ce a expirat deja: sesiuni închise, coduri de confirmare vechi, jurnalul de securitate peste 90 de zile, vizite peste 13 luni, probleme rezolvate peste 12 luni (după regulile din Confidențialitate)." },
  { key: "sitemap", label: "Sitemap la Google", risk: "singur", defaultOn: true, everyDays: 7, needs: "cheia Search Console (Admin → SEO)",
    what: "O dată pe săptămână trimite din nou sitemap.xml la Google Search Console, ca paginile noi să fie găsite mai repede." },
  { key: "aminteste-proba", label: "Email: zilele gratuite se termină", risk: "acord", defaultOn: false, everyDays: 1, needs: "RESEND_API_KEY și plățile pornite",
    what: "Cu 2 zile înainte de sfârșitul celor 7 zile gratuite, un singur email în limba omului: nu se șterge nimic, nu se iau bani automat, legătura la /plata." },
  { key: "aminteste-an", label: "Email: anul plătit se termină", risk: "acord", defaultOn: false, everyDays: 1, needs: "RESEND_API_KEY",
    what: "Cu câteva zile înainte (cât ai pus în Manager control) le scrie celor al căror an se termină. O dată pe an, pentru fiecare." },
  { key: "bun-venit", label: "Email: sfaturi de bun venit", risk: "acord", defaultOn: false, everyDays: 1, needs: "RESEND_API_KEY",
    what: "Doar celor care au spus „Da” la „Vrei sfaturi pe email?”: 5 emailuri scurte în primele 3 săptămâni (ziua 1, 2, 4, 10, 21), câte unul pe zi, sărind ce omul a făcut deja (a invitat o rudă, a înregistrat un glas, a plătit). Fiecare are dezabonare dintr-un clic. Vezi Admin → Creștere." },
  { key: "probleme-vechi", label: "Închide problemele lămurite", risk: "aprobare", defaultOn: false, everyDays: 1,
    what: "Problemele raportate la care ai răspuns și la care omul n-a mai scris de 21 de zile. Pregătește lista; le trece la „Rezolvată” doar după ce apeși „Aprobă”." },
];
export const autoDef = (k: AutoKey) => AUTOMATIONS.find((a) => a.key === k)!;

/** Comutatoarele: ce e pornit. Ce nu e salvat încă ia valoarea de pornire (sigură). */
export const SWITCHES_KEY = "automatizari";
export type Switches = Record<AutoKey, boolean> & { paused?: Partial<Record<AutoKey, string>> };
export async function automationSwitches(db: Pick<Db, "select">): Promise<Switches> {
  const [r] = await db.select({ value: appSetting.value }).from(appSetting).where(sql`${appSetting.key} = ${SWITCHES_KEY}`);
  const v = (r?.value ?? {}) as Partial<Switches>;
  const out = { paused: v.paused ?? {} } as Switches;
  for (const a of AUTOMATIONS) out[a.key] = typeof v[a.key] === "boolean" ? !!v[a.key] : a.defaultOn;
  return out;
}
export async function saveSwitches(db: Pick<Db, "insert">, value: Switches, by: string | null, now = new Date()) {
  await db.insert(appSetting).values({ key: SWITCHES_KEY, value, updatedBy: by, updatedAt: now })
    .onConflictDoUpdate({ target: appSetting.key, set: { value, updatedBy: by, updatedAt: now } });
}

export type RunResult = { status: "ok" | "nimic" | "asteapta" | "sarit" | "eroare"; observed: number; acted: number; pending?: number; note: string; details?: unknown; verified?: boolean };
type Ctx = { db: Db; now: Date; approved: boolean };

const admins = () => OWNERS.map((o) => o.email);

/** Sănătatea: întâi o verificare, apoi încă una după câteva secunde; emailul pleacă doar la eșec confirmat și o dată. */
export async function healthProbe(db: Db) {
  const fails: string[] = [];
  const t0 = Date.now();
  try { await db.execute(sql`select 1`); } catch (e) { fails.push(`baza de date nu răspunde (${e instanceof Error ? e.message : e})`); }
  const ping = Date.now() - t0;
  if (!fails.length && ping > 3000) fails.push(`baza de date răspunde greu (${ping} ms)`);
  try {
    const [m] = await rows(db, sql`select count(*) as c from drizzle.__drizzle_migrations`);
    if (n(m?.c) < journal.entries.length) fails.push(`migrații neaplicate (${n(m?.c)}/${journal.entries.length})`);
  } catch { /* local, fără tabela migrațiilor */ }
  if (storageConfigured() && !localStorageMode()) {
    try { await bucketReachable(); } catch (e) { fails.push(`stocarea pozelor nu răspunde (${e instanceof Error ? e.message : e})`); }
  }
  const [e] = await rows(db, sql`with seen as (select coalesce((select (value->>'at')::timestamptz from app_setting where key = ${ERRORS_SEEN_KEY}), 'epoch'::timestamptz) as at)
    select count(*) as c from audit_log, seen where entity = 'eroare' and created_at > seen.at and created_at > now() - interval '1 hour'`);
  if (n(e?.c) >= 10) fails.push(`${n(e?.c)} erori pe server în ultima oră`);
  return { fails, ping };
}

const HEALTH_KEY = "autonomie_sanatate";
async function runHealth({ db, now }: Ctx, wait = (ms: number) => new Promise((r) => setTimeout(r, ms))): Promise<RunResult> {
  let p = await healthProbe(db);
  if (p.fails.length) { await wait(4000); p = await healthProbe(db); }
  const [prev] = await db.select({ value: appSetting.value }).from(appSetting).where(sql`${appSetting.key} = ${HEALTH_KEY}`);
  const was = (prev?.value ?? {}) as { down?: boolean; mailedAt?: string };
  const down = p.fails.length > 0;
  let mailed = false;
  if (down && !was.down && emailReady()) {
    const text = `Verificarea de azi a găsit o problemă care s-a confirmat și la a doua încercare:\n\n- ${p.fails.join("\n- ")}\n\nVezi Admin → Infra & Dev: ${SITE_URL}/admin/infra\nNu mai primești alt email pentru asta până nu se repară.`;
    for (const to of admins()) if (await sendMail(to, "Cartea Neamului: o problemă confirmată pe site", text)) mailed = true;
  }
  const value = { down, since: down ? (was.down ? (prev?.value as { since?: string }).since : now.toISOString()) : null, mailedAt: mailed ? now.toISOString() : was.mailedAt ?? null, fails: p.fails };
  await db.insert(appSetting).values({ key: HEALTH_KEY, value, updatedAt: now })
    .onConflictDoUpdate({ target: appSetting.key, set: { value, updatedAt: now } });
  if (!down) return { status: "ok", observed: 4, acted: 0, note: `totul merge · baza de date în ${p.ping} ms${was.down ? " · s-a reparat de la ultima verificare" : ""}`, verified: true };
  return { status: "eroare", observed: 4, acted: mailed ? 1 : 0, note: `${p.fails.join("; ")}${mailed ? " · ți-am scris pe email" : was.down ? " · ți-am scris deja" : emailReady() ? "" : " · fără Resend nu pot trimite email"}`, details: { fails: p.fails } };
}

async function runCleanup({ db, now }: Ctx): Promise<RunResult> {
  const counts: Record<string, number> = {};
  const del = async (label: string, q: SQL) => {
    const r = await rows(db, sql`with d as (${q} returning 1) select count(*) as c from d`);
    counts[label] = n(r[0]?.c);
  };
  await del("sesiuni expirate", sql`delete from session where expires_at < now() - interval '1 day'`);
  await del("coduri de confirmare expirate", sql`delete from verification where expires_at < now() - interval '1 day'`);
  await del("rânduri din jurnalul de securitate peste 90 de zile", sql`delete from security_event where created_at < now() - interval '90 days'`);
  await del("rulări de automatizări peste 180 de zile", sql`delete from automation_run where started_at < now() - interval '180 days'`);
  await del("scoruri peste 400 de zile", sql`delete from autonomy_snapshot where day < current_date - 400`);
  const [v] = await rows(db, sql`select count(*) as c from page_view where day < (current_date - interval '13 months')`);
  await cleanupVisits(db);
  counts["vizite peste 13 luni"] = n(v?.c);
  const [p] = await rows(db, sql`select count(*) as c from problem_report where status = 'rezolvat' and resolved_at < ${new Date(now.getTime() - 365 * DAY).toISOString()}`);
  const keys = await dropOldResolved(db, now);
  if (keys.length) await deleteObjects(keys);
  counts["probleme rezolvate peste 12 luni"] = n(p?.c);
  // Verificare: după ștergere nu mai trebuie să rămână nicio sesiune expirată de peste o zi.
  const [left] = await rows(db, sql`select count(*) as c from session where expires_at < now() - interval '1 day'`);
  const acted = Object.values(counts).reduce((a, b) => a + b, 0);
  const parts = Object.entries(counts).filter(([, c]) => c > 0).map(([l, c]) => `${c} ${l}`);
  return { status: acted ? "ok" : "nimic", observed: Object.keys(counts).length, acted, note: parts.length ? `șterse: ${parts.join(", ")}` : "nimic expirat", details: counts, verified: n(left?.c) === 0 };
}

async function runSitemap({ db }: Ctx): Promise<RunResult> {
  const s = await seoSettings(db);
  const sa = activeServiceAccount(s);
  if (!sa) return { status: "sarit", observed: 0, acted: 0, note: "Search Console nu e legat (Admin → SEO)" };
  const site = pickSite(await listSites(sa.account), s.siteUrl, SITE_URL);
  if (!site) return { status: "eroare", observed: 1, acted: 0, note: "contul de serviciu nu are acces la nicio proprietate din Search Console" };
  await submitSitemap(sa.account, site, `${SITE_URL}/sitemap.xml`);
  return { status: "ok", observed: 1, acted: 1, note: `sitemap.xml trimis la ${site}`, verified: true };
}

/** Cei cu zilele gratuite pe sfârșite (cel mult 2 zile), care n-au primit încă emailul. */
export async function trialEnding(db: Db, now = new Date()) {
  const s = await planSettings(db);
  if (!s.on) return [];
  const [plans, people, marks] = await Promise.all([accountPlans(db), accessPeople(db),
    db.select({ ref: automationMark.ref }).from(automationMark).where(sql`${automationMark.automation} = 'aminteste-proba'`)]);
  const done = new Set(marks.map((m) => m.ref));
  const due: { id: string; until: Date }[] = [];
  for (const p of people) {
    if (done.has(p.id)) continue;
    const ap = plans.get(p.id);
    const a = accessFor({ createdAt: p.createdAt, plan: ap?.plan ?? null, paidUntil: ap?.paidUntil ? new Date(ap.paidUntil) : null, tier: ap?.tier, exempt: p.exempt,
      keepUntil: ap?.keepUntil ? new Date(ap.keepUntil) : null }, s, now);
    if (a.kind === "proba" && a.until.getTime() - now.getTime() <= 2 * DAY) due.push({ id: p.id, until: a.until });
  }
  if (!due.length) return [];
  const info = await rows<{ id: string; name: string; email: string; locale: string }>(db,
    sql`select id, name, email, locale from "user" where id in (${sql.join(due.map((d) => sql`${d.id}`), sql`, `)})`);
  const byId = new Map(info.map((u) => [u.id, u]));
  return due.flatMap((d) => (byId.has(d.id) ? [{ ...byId.get(d.id)!, until: d.until }] : []));
}

async function runTrialMail({ db, now }: Ctx): Promise<RunResult> {
  if (!emailReady()) return { status: "sarit", observed: 0, acted: 0, note: "fără RESEND_API_KEY nu pleacă emailuri" };
  const list = await trialEnding(db, now);
  let sent = 0;
  for (const u of list) {
    const locale = isLocale(u.locale) ? u.locale : "ro";
    const [t, app] = await Promise.all([getT("ReminderMail", locale), getAppName(locale)]);
    const date = new Intl.DateTimeFormat(locale, { dateStyle: "long", timeZone: "Europe/Bucharest" }).format(u.until);
    if (await sendMail(u.email, t("trialSubject", { app, date }), t("trialBody", { name: u.name, app, date, link: `${SITE_URL}/plata` }))) {
      await db.insert(automationMark).values({ automation: "aminteste-proba", ref: u.id, at: now }).onConflictDoNothing();
      sent++;
    }
  }
  return { status: sent ? "ok" : list.length ? "eroare" : "nimic", observed: list.length, acted: sent, note: list.length ? `${sent} din ${list.length} emailuri trimise` : "nimeni nu e la final de zile gratuite", verified: sent === list.length };
}

/** Emailul de sfârșit de an (aceeași logică pe care o folosea /api/cron/aminteste-plata). */
export async function sendYearReminders(db: Db) {
  const s = await planSettings(db);
  const due = await dueReminders(db, s.reminderDays);
  let sent = 0;
  for (const r of due) {
    const locale = isLocale(r.locale) ? r.locale : "ro";
    const [t, app] = await Promise.all([getT("ReminderMail", locale), getAppName(locale)]);
    const date = new Intl.DateTimeFormat(locale, { dateStyle: "long", timeZone: "Europe/Bucharest" }).format(r.paidUntil!);
    const tp = await getT("Plata", locale);
    const plan = tp(`tiers.${isTier(r.tier) ? r.tier : "basic"}.name` as "tiers.basic.name");
    const keep = locale === "ro" ? s.keepLei : s.keepEur;
    const note = keep > 0 ? (await getT("Keep", locale))("mailNote", { price: locale === "ro" ? `${keep} lei` : `${keep} €` }) : "";
    if (await sendMail(r.email, t("subject", { app, date }), t("body", { name: r.name, app, date, plan, link: `${SITE_URL}/plata` }) + note)) { await markReminded(db, r.userId, r.paidUntil!); sent++; }
  }
  return { due: due.length, sent };
}

async function runYearMail({ db }: Ctx): Promise<RunResult> {
  if (!emailReady()) return { status: "sarit", observed: 0, acted: 0, note: "fără RESEND_API_KEY nu pleacă emailuri" };
  const { due, sent } = await sendYearReminders(db);
  return { status: sent ? "ok" : due ? "eroare" : "nimic", observed: due, acted: sent, note: due ? `${sent} din ${due} emailuri trimise` : "niciun an nu se termină în curând", verified: sent === due };
}

/** Problemele la care s-a răspuns, cu omul tăcut de 21 de zile. */
export async function staleProblems(db: Db) {
  return rows<{ id: string; message: string; replied_at: string }>(db, sql`select id, left(message, 80) as message, replied_at from problem_report
    where status <> 'rezolvat' and reply is not null and replied_at < now() - interval '21 days' order by replied_at limit 50`);
}

async function runStaleProblems({ db, approved, now }: Ctx): Promise<RunResult> {
  const list = await staleProblems(db);
  if (!list.length) return { status: "nimic", observed: 0, acted: 0, note: "nicio problemă lămurită și uitată" };
  if (!approved) return { status: "asteapta", observed: list.length, acted: 0, pending: list.length, note: `${list.length} probleme pot fi trecute la „Rezolvată”; așteaptă „Aprobă”`, details: { ids: list.map((r) => r.id) } };
  const ids = list.map((r) => r.id);
  const done = await rows(db, sql`update problem_report set status = 'rezolvat', resolved_at = ${now.toISOString()}
    where id in (${sql.join(ids.map((i) => sql`${i}::uuid`), sql`, `)}) and status <> 'rezolvat' returning id`);
  return { status: "ok", observed: list.length, acted: done.length, note: `${done.length} probleme trecute la „Rezolvată” (le poți redeschide din Probleme raportate)`, details: { ids }, verified: done.length === ids.length };
}

/** Sfaturile pe email (șirul de bun venit, src/lib/crestere.ts): cel mult un email pe zi pentru fiecare om, doar cu acordul lui. */
async function runNews({ db, now }: Ctx): Promise<RunResult> {
  if (!emailReady()) return { status: "sarit", observed: 0, acted: 0, note: "fără RESEND_API_KEY nu pleacă emailuri" };
  const { dueStep, newsCandidates, unsubscribeToken } = await import("./crestere");
  const { footerFor, renderMail } = await import("./emailuri");
  const { giftSeason } = await import("./cadou-sarbatori");
  const s = await planSettings(db);
  const people = await newsCandidates(db, now);
  let due = 0, sent = 0;
  const byStep: Record<string, number> = {};
  for (const u of people) {
    const step = dueStep(new Date(u.created_at), new Set(u.sent ?? []), { invited: !!u.invited, voice: !!u.voice, paid: !!u.paid }, now);
    if (!step) continue;
    due++;
    const locale = isLocale(u.locale) ? u.locale : "ro";
    const [t, app] = await Promise.all([getT("NewsMail", locale), getAppName(locale)]);
    const utm = `utm_source=email&utm_medium=email&utm_campaign=bun-venit`;
    const gift = step === "e5" && giftSeason(now);
    const price = locale === "ro" ? `${s.priceLei} lei` : `${s.priceEur} €`;
    const link = { e1: `/?${utm}`, e2: `/?${utm}`, e3: `/ghid/intrebari-pentru-bunici?${utm}`, e4: `/plata?${utm}`, e5: gift ? `/cadou-de-sarbatori?${utm}` : `/?${utm}` }[step];
    const tt = t as unknown as (k: string, v?: Record<string, string>) => string;
    const body = tt(gift ? "e5GiftBody" : `${step}Body`, { name: u.name.split(" ")[0] || u.name, app, price });
    const tok = unsubscribeToken(u.id);
    const unsub = `${SITE_URL}/dezabonare?u=${encodeURIComponent(u.id)}&t=${tok}`;
    const { html, text } = renderMail([
      ...body.split("\n\n").map((p) => ({ p })),
      { button: t(gift ? "e5GiftButton" : (`${step}Button` as "e1Button")), href: `${SITE_URL}${link}` },
      { note: t("why", { app }), link: t("unsubscribe"), href: unsub },
    ], await footerFor(locale));
    const { sendEmail, emailSent } = await import("./email");
    const r = await sendEmail({ to: u.email, subject: t(`${step}Subject` as "e1Subject"), html, text, tag: `bun-venit-${step}`,
      idempotencyKey: `bun-venit-${u.id}-${step}`,
      headers: { "List-Unsubscribe": `<${SITE_URL}/api/vesti/dezabonare?u=${encodeURIComponent(u.id)}&t=${tok}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" } });
    if (emailSent(r)) {
      await db.insert(automationMark).values({ automation: "bun-venit", ref: `${u.id}:${step}`, at: now }).onConflictDoNothing();
      sent++;
      byStep[step] = (byStep[step] ?? 0) + 1;
    }
  }
  const parts = Object.entries(byStep).map(([k, c]) => `${c}× ${k}`).join(", ");
  return { status: sent ? "ok" : due ? "eroare" : "nimic", observed: people.length, acted: sent,
    note: due ? `${sent} din ${due} emailuri trimise${parts ? ` (${parts})` : ""} · ${people.length} oameni cu acordul dat` : `${people.length} oameni cu acordul dat, niciunul nu are azi un email de primit`,
    details: byStep, verified: sent === due };
}

const RUNNERS: Record<AutoKey, (c: Ctx) => Promise<RunResult>> = {
  sanatate: (c) => runHealth(c),
  curatenie: runCleanup,
  sitemap: runSitemap,
  "aminteste-proba": runTrialMail,
  "aminteste-an": runYearMail,
  "bun-venit": runNews,
  "probleme-vechi": runStaleProblems,
};

/** Rulează o automatizare și o trece în jurnal. După 3 erori la rând se oprește singură și apare la recomandări. */
export async function runAutomation(db: Db, key: AutoKey, trigger: "ceas" | "manual" | "aprobare", actorId: string | null = null, now = new Date()): Promise<RunResult> {
  const started = new Date();
  let r: RunResult;
  try {
    r = await RUNNERS[key]({ db, now, approved: trigger === "aprobare" });
  } catch (e) {
    r = { status: "eroare", observed: 0, acted: 0, note: e instanceof Error ? e.message.slice(0, 300) : String(e).slice(0, 300) };
  }
  await db.insert(automationRun).values({ automation: key, trigger, status: r.status, observed: r.observed, acted: r.acted, pending: r.pending ?? 0,
    note: r.note, details: { ...(r.details && typeof r.details === "object" ? r.details : {}), verified: r.verified ?? null }, actorId, startedAt: started, finishedAt: new Date() });
  if (r.status === "eroare" && key !== "sanatate") {
    const last = await db.select({ status: automationRun.status }).from(automationRun).where(sql`${automationRun.automation} = ${key}`)
      .orderBy(sql`${automationRun.startedAt} desc`).limit(3);
    if (last.length === 3 && last.every((x) => x.status === "eroare")) {
      const sw = await automationSwitches(db);
      sw[key] = false;
      sw.paused = { ...sw.paused, [key]: `oprită singură pe ${now.toISOString().slice(0, 10)}, după 3 erori la rând: ${r.note}` };
      await saveSwitches(db, sw, null, now);
    }
  }
  return r;
}

/** Când a rulat ultima oară fiecare automatizare (orice rezultat) și ultima rulare reușită. */
export async function lastRuns(db: Db) {
  const r = await rows<{ automation: string; last: string | null; last_ok: string | null; status: string | null; note: string | null }>(db, sql`
    select a.automation, max(a.started_at) as last, max(a.started_at) filter (where a.status in ('ok','nimic')) as last_ok,
      (select status from automation_run b where b.automation = a.automation order by started_at desc limit 1) as status,
      (select note from automation_run b where b.automation = a.automation order by started_at desc limit 1) as note
    from automation_run a group by a.automation`);
  return new Map(r.map((x) => [x.automation, x]));
}

/* ---------- Bucla: observă → găsește → hotărăște → face → verifică → notează → învață ---------- */

export type LoopStats = { observed: number; findings: number; ran: number; acted: number; pending: number; verified: number; failed: number; paused: number; score: number };

/** Rularea zilnică (sau „Rulează bucla”): scorul, apoi fiecare automatizare pornită și scadentă, apoi scorul din nou. */
export async function runLoop(db: Db, trigger: "ceas" | "manual", actorId: string | null = null, now = new Date()) {
  const before = await autonomyScore(db, now);
  const sw = await automationSwitches(db);
  const last = await lastRuns(db);
  const stats: LoopStats = { observed: before.checks, findings: before.findings, ran: 0, acted: 0, pending: 0, verified: 0, failed: 0, paused: 0, score: before.score };
  const ran: { key: AutoKey; status: string; note: string }[] = [];
  for (const a of AUTOMATIONS) {
    if (!sw[a.key]) continue;
    const prev = last.get(a.key)?.last;
    // Manual rulează tot ce e pornit; ceasul doar ce e scadent (sitemap-ul o dată pe săptămână).
    if (trigger === "ceas" && prev && now.getTime() - new Date(prev).getTime() < a.everyDays * DAY - 2 * 3600_000) continue;
    const r = await runAutomation(db, a.key, trigger, actorId, now);
    stats.ran++;
    stats.acted += r.acted;
    stats.pending += r.pending ?? 0;
    if (r.verified) stats.verified++;
    if (r.status === "eroare") stats.failed++;
    ran.push({ key: a.key, status: r.status, note: r.note });
  }
  const after = await autonomyScore(db, now);
  stats.paused = Object.keys((await automationSwitches(db)).paused ?? {}).length;
  stats.score = after.score;
  await saveSnapshot(db, after, now);
  // Și scorul Sănătății afacerii pe ziua de azi (pentru tendința din Admin → Sănătatea afacerii).
  await import("./sanatate-afacere").then((m) => m.recomputeHealth(db, now)).catch(() => undefined);
  await db.insert(automationRun).values({ automation: "bucla", trigger, status: stats.failed ? "eroare" : "ok", observed: stats.observed, acted: stats.acted,
    pending: stats.pending, note: `${stats.ran} automatizări rulate · scor ${before.score} → ${after.score}`, details: { stats, ran, before: before.score }, actorId, startedAt: now, finishedAt: new Date() });
  return { stats, ran };
}

export async function saveSnapshot(db: Db, s: Score, now = new Date()) {
  const day = localDayHour(now).day;
  const parts = Object.fromEntries(s.parts.map((p) => [p.key, p.score]));
  await db.insert(autonomySnapshot).values({ day, score: s.score, parts, at: now })
    .onConflictDoUpdate({ target: autonomySnapshot.day, set: { score: s.score, parts, at: now } });
}

/* ---------- Scorul ---------- */

export type Check = { label: string; points: number; max: number; note: string; fix?: { text: string; href?: string } };
export type Part = { key: "operational" | "tehnic" | "securitate" | "dezvoltare" | "om"; label: string; what: string; weight: number; target: number; score: number; checks: Check[] };
export type Score = { score: number; parts: Part[]; checks: number; findings: number };

const PART_META: Record<Part["key"], { label: string; what: string; weight: number; target: number }> = {
  operational: { label: "Operațional", what: "Automatizările pornite, ceasul zilnic, rulările reușite", weight: 25, target: 90 },
  tehnic: { label: "Tehnic", what: "Baza de date, migrații, chei, stocare, erori", weight: 25, target: 90 },
  securitate: { label: "Securitate", what: "Alerte, verificarea în 2 pași a adminilor, plăți", weight: 20, target: 90 },
  dezvoltare: { label: "Dezvoltare", what: "Erori care se repetă, tendința, probleme „nu merge”, harta funcțiilor", weight: 15, target: 80 },
  om: { label: "Dependență de om", what: "Câte lucruri așteaptă acum după tine (100 = niciunul)", weight: 15, target: 80 },
};

/** Scorul unei părți: suma punctelor din verificări, ca procent din maximul lor. Pură, ca să se poată testa. */
export function partScore(checks: Check[]) {
  const max = checks.reduce((a, c) => a + c.max, 0);
  return max ? Math.round((100 * checks.reduce((a, c) => a + Math.max(0, Math.min(c.points, c.max)), 0)) / max) : 100;
}
export function totalScore(parts: { score: number; weight: number }[]) {
  const w = parts.reduce((a, p) => a + p.weight, 0);
  return w ? Math.round(parts.reduce((a, p) => a + p.score * p.weight, 0) / w) : 0;
}
export function tierOf(score: number) {
  if (score >= 90) return { key: "autonom", label: "Autonom", text: "Merge singur; tu vezi doar rapoartele și aprobi ce ține de bani, conturi și texte." };
  if (score >= 75) return { key: "aproape", label: "Aproape singur", text: "Rutinele merg singure; mai sunt câțiva pași de pus la punct." };
  if (score >= 50) return { key: "asistat", label: "Asistat", text: "Site-ul te anunță și te ajută, dar multe încă trec prin mâna ta." };
  return { key: "manual", label: "Manual", text: "Aproape totul se face de mână. Pornește automatizările și pune cheile lipsă." };
}

/** Recomandările: verificările care nu au tot punctajul și au un pas de făcut, cu câte puncte ar urca scorul total. */
export type Recommendation = { part: string; partLabel: string; text: string; href?: string; gain: number; level: "ridicat" | "mediu" | "scăzut"; note: string };
export function recommendations(parts: Part[]): Recommendation[] {
  const totalW = parts.reduce((a, p) => a + p.weight, 0) || 1;
  const out: Recommendation[] = [];
  for (const p of parts) {
    const max = p.checks.reduce((a, c) => a + c.max, 0) || 1;
    for (const c of p.checks) {
      if (!c.fix || c.points >= c.max) continue;
      const gain = Math.round(((c.max - Math.max(0, c.points)) / max) * 100 * (p.weight / totalW) * 10) / 10;
      out.push({ part: p.key, partLabel: p.label, text: c.fix.text, href: c.fix.href, gain, level: gain >= 3 ? "ridicat" : gain >= 1.5 ? "mediu" : "scăzut", note: c.note });
    }
  }
  return out.sort((a, b) => b.gain - a.gain);
}

const chk = (label: string, ok: boolean, max: number, note: string, fix?: Check["fix"], partial?: number): Check =>
  ({ label, points: ok ? max : partial ?? 0, max, note, fix: ok ? undefined : fix });

export async function autonomyScore(db: Db, now = new Date()): Promise<Score> {
  const t0 = Date.now();
  // Totul deodată: ping-ul, citirile, migrațiile și rezumatul Centrului de cunoștințe (înainte veneau în 4 rânduri, unul după altul).
  const pingP = db.execute(sql`select 1`).then(() => Date.now() - t0);
  const migP = rows(db, sql`select count(*) as c from drizzle.__drizzle_migrations`).then((r) => n(r[0]?.c) as number | null).catch(() => null); // local
  const kcP = import("./cunostinte/verificare").then((m) => m.knowledgeSummaryOnce(db)).catch(() => null);
  const [ping, migApplied, kc, sw, last, sec, seo, plans, base] = await Promise.all([pingP, migP, kcP,
    automationSwitches(db), lastRuns(db), securityOverviewOnce(db).catch(() => null), seoSettings(db).catch(() => null), planSettings(db),
    rows(db, sql`with seen as (select coalesce((select (value->>'at')::timestamptz from app_setting where key = ${ERRORS_SEEN_KEY}), 'epoch'::timestamptz) as at)
      select (select count(*) from audit_log, seen where entity = 'eroare' and created_at > seen.at and created_at > now() - interval '1 day') as err1,
        (select count(*) from audit_log where entity = 'eroare' and created_at > now() - interval '7 days') as err7,
        (select count(*) from audit_log where entity = 'eroare' and created_at <= now() - interval '7 days' and created_at > now() - interval '14 days') as errprev,
        (select count(*) from (select entity_id from audit_log where entity = 'eroare' and created_at > now() - interval '7 days' group by entity_id having count(*) >= 3) x) as repeat_routes,
        (select count(*) from problem_report where status = 'nou') as prob_new,
        (select count(*) from problem_report where kind = 'eroare' and status <> 'rezolvat' and created_at < now() - interval '7 days') as bug_old,
        (select count(*) from home_submission where status = 'pending') as photos,
        (select count(*) from dna_request where resolved_at is null) as dna,
        (select count(*) from "user" where lower(email) in (${sql.join(OWNERS.map((o) => sql`${o.email}`), sql`, `)}) and two_factor_enabled) as owners_2fa,
        (select count(*) from "user" where lower(email) in (${sql.join(OWNERS.map((o) => sql`${o.email}`), sql`, `)})) as owners,
        (select coalesce(sum(pending), 0) from (select distinct on (automation) pending from automation_run where automation <> 'bucla' order by automation, started_at desc) p) as approvals,
        (select max(started_at) from automation_run where trigger = 'ceas') as last_cron`).catch(() => [{} as Row]),
  ]);
  const b = base[0] ?? {};
  const missing = ENV_KEYS.filter((k) => k.needed && !envSet(k.key)).map((k) => k.key);

  // Operațional
  const cronSet = !!process.env.CRON_SECRET?.trim();
  const lastCron = b.last_cron ? new Date(b.last_cron as string) : null;
  const cronFresh = !!lastCron && now.getTime() - lastCron.getTime() < 36 * 3600_000;
  const op: Check[] = [
    chk("Ceasul zilnic e pornit", cronSet, 15, cronSet ? "CRON_SECRET e pus" : "lipsește CRON_SECRET în Vercel: automatizările rulează doar când apeși tu",
      { text: "Pune CRON_SECRET în Vercel (orice parolă lungă), ca ceasul zilnic să pornească bucla singur", href: "/admin/infra" }),
    chk("Ceasul a rulat în ultimele 36 h", cronFresh, 15, lastCron ? `ultima rulare: ${lastCron.toISOString().slice(0, 16).replace("T", " ")} UTC` : "nu a rulat încă",
      cronSet ? { text: "Ceasul nu a rulat de peste o zi: verifică în Vercel → Cron Jobs" } : undefined),
  ];
  for (const a of AUTOMATIONS) {
    const on = sw[a.key];
    const l = last.get(a.key);
    const fresh = !!l?.last && now.getTime() - new Date(l.last).getTime() < (a.everyDays + 1.5) * DAY;
    const healthy = on && fresh && (l?.status === "ok" || l?.status === "nimic" || l?.status === "asteapta");
    const paused = sw.paused?.[a.key];
    const note = !on ? (paused ?? "oprită") : !l?.last ? "pornită, n-a rulat încă" : `${l.status === "eroare" ? "ultima rulare a dat eroare" : "ultima rulare"}: ${l.note ?? ""}`;
    // Cele „cu acordul tău” contează doar dacă sunt pornite; altfel recomandarea spune ce trebuie pentru ele.
    op.push(chk(a.label, healthy, a.risk === "aprobare" ? 5 : 10, note,
      { text: !on ? `Pornește „${a.label}”${a.needs ? ` (are nevoie de ${a.needs})` : ""}` : `Vezi de ce „${a.label}” ${l?.status === "eroare" ? "dă eroare" : "n-a rulat"}`, href: "/admin/autonomie#automatizari" },
      on ? 4 : 0));
  }

  // Tehnic
  const expected = journal.entries.length;
  const err1 = n(b.err1);
  const storOk = storageConfigured();
  const tech: Check[] = [
    chk("Baza de date răspunde repede", ping < 1500, 20, `${ping} ms`, { text: "Baza de date răspunde greu: vezi Neon", href: "/admin/infra" }, ping < 4000 ? 10 : 0),
    chk("Migrații aplicate", migApplied == null || migApplied >= expected, 20, migApplied == null ? "local" : `${migApplied}/${expected}`, { text: "Rulează din nou publicarea în Vercel, ca migrațiile să se aplice", href: "/admin/infra" }),
    chk("Chei obligatorii puse", missing.length === 0, 20, missing.length ? `lipsesc: ${missing.join(", ")}` : "toate puse", { text: `Pune în Vercel: ${missing.join(", ")}`, href: "/admin/infra" }),
    chk("Stocarea pozelor e legată", storOk, 15, storOk ? "configurată" : "cheile NEON_STORAGE_* lipsesc", { text: "Pune cheile NEON_STORAGE_* în Vercel", href: "/admin/infra" }),
    chk("Nicio eroare nouă pe server în 24 h", err1 === 0, 25, `${err1} erori noi`, { text: `Vezi cele ${err1} erori noi și marchează-le rezolvate după reparare`, href: "/admin/infra" }, err1 < 5 ? 12 : 0),
  ];

  // Securitate
  const bad = sec ? sec.alerts.filter((a) => a.level === "bad").length : 0;
  const warn = sec ? sec.alerts.filter((a) => a.level === "warn").length : 0;
  const owners = n(b.owners), owners2 = n(b.owners_2fa);
  const webhook = !!process.env.STRIPE_WEBHOOK_SECRET?.trim();
  const secu: Check[] = [
    chk("Fără alerte grave", bad === 0, 40, sec ? `${bad} grave` : "nu s-au putut citi", { text: `Vezi cele ${bad} alerte grave din Securitate`, href: "/admin/securitate" }),
    chk("Fără semne de verificat", warn === 0, 15, `${warn} de verificat`, { text: `Uită-te la cele ${warn} semne din Securitate`, href: "/admin/securitate" }),
    chk("Adminii au verificarea în 2 pași", owners > 0 && owners2 === owners, 25, `${owners2} din ${owners}`, { text: "Pornește verificarea în 2 pași pe conturile de admin", href: "/admin/securitate" }, owners2 ? 12 : 0),
    chk("Plățile sunt confirmate prin webhook semnat", !plans.on || (stripeReady() && webhook), 20, plans.on ? (webhook ? "cheia webhook e pusă" : "lipsește STRIPE_WEBHOOK_SECRET") : "plățile sunt oprite",
      { text: "Pune STRIPE_WEBHOOK_SECRET în Vercel, ca plățile să fie confirmate de Stripe", href: "/admin/control" }),
  ];

  // Dezvoltare
  const err7 = n(b.err7), errPrev = n(b.errprev), repeat = n(b.repeat_routes), bugOld = n(b.bug_old);
  // Harta funcțiilor (Centrul de cunoștințe): legături rupte și funcții cu roșu. Import târziu, fiindcă harta citește și ea automatizările.
  const dev: Check[] = [
    chk("Erorile nu cresc de la o săptămână la alta", err7 <= errPrev || err7 <= 2, 35, `${err7} în ultimele 7 zile, ${errPrev} în cele dinainte`, { text: "Erorile cresc: vezi ce s-a schimbat la ultima publicare", href: "/admin/infra" }),
    chk("Nicio pagină cu aceeași eroare de 3+ ori", repeat === 0, 35, `${repeat} pagini`, { text: `${repeat} pagini dau mereu eroare: încep cu ele`, href: "/admin/infra" }),
    chk("Nicio problemă „nu merge” deschisă de peste 7 zile", bugOld === 0, 30, `${bugOld} deschise`, { text: `Răspunde la cele ${bugOld} probleme „Ceva nu merge” mai vechi de o săptămână`, href: "/admin/probleme" }),
    chk("Harta funcțiilor fără legături rupte", !!kc && kc.broken === 0, 20, kc ? `${kc.broken} funcții cu legături rupte (${kc.files} fișiere, ${kc.routes} adrese verificate)` : "harta nu s-a putut verifica",
      { text: kc ? `Repară cele ${kc.broken} funcții cu legături rupte din Harta funcțiilor` : "Deschide Harta funcțiilor și vezi de ce nu se verifică", href: "/admin/cunostinte/functii" }),
    chk("Funcțiile în lucru sunt sănătoase", !!kc && kc.red === 0 && kc.yellow === 0, 20, kc ? `${kc.green} verzi, ${kc.yellow} galbene, ${kc.red} roșii din ${kc.live}` : "harta nu s-a putut verifica",
      { text: kc ? `${kc.red} funcții roșii și ${kc.yellow} galbene în Harta funcțiilor: începe cu cele roșii` : "Deschide Harta funcțiilor", href: "/admin/cunostinte/functii" },
      kc && kc.live ? Math.round((20 * (kc.green + kc.yellow / 2)) / kc.live) : 0),
  ];

  // Dependență de om: fiecare lucru care așteaptă scade 10 puncte din grupul lui (cel puțin 0).
  const waiting = [
    { label: "Probleme noi, necitite", c: n(b.prob_new), href: "/admin/probleme" },
    { label: "Poze propuse de aprobat", c: n(b.photos), href: "/admin/propuneri" },
    { label: "Cereri de test ADN", c: n(b.dna), href: "/admin/adn" },
    { label: "Aprobări cerute de automatizări", c: n(b.approvals), href: "/admin/autonomie#aprobari" },
    { label: "Erori noi pe server", c: err1, href: "/admin/infra" },
    { label: "Documente de revizuit", c: kc?.review ?? 0, href: "/admin/cunostinte?v=revizuire" },
  ];
  const om: Check[] = waiting.map((w) => ({ label: w.label, max: 20, points: Math.max(0, 20 - 5 * w.c), note: w.c ? `${w.c} așteaptă` : "nimic",
    fix: w.c ? { text: `${w.label}: ${w.c}`, href: w.href } : undefined }));
  void seo;

  const parts: Part[] = (Object.entries({ operational: op, tehnic: tech, securitate: secu, dezvoltare: dev, om }) as [Part["key"], Check[]][])
    .map(([key, checks]) => ({ key, ...PART_META[key], checks, score: partScore(checks) }));
  const all = parts.flatMap((p) => p.checks);
  return { score: totalScore(parts), parts, checks: all.length, findings: all.filter((c) => c.points < c.max).length };
}

/* ---------- Ce se vede în pagină ---------- */

export async function autonomyPage(db: Db) {
  const [score, sw, last, history, recent, week, loop, plansNow] = await Promise.all([
    autonomyScore(db),
    automationSwitches(db),
    lastRuns(db),
    db.select({ day: autonomySnapshot.day, score: autonomySnapshot.score }).from(autonomySnapshot).orderBy(sql`${autonomySnapshot.day} desc`).limit(60),
    rows<{ id: string; automation: string; trigger: string; status: string; observed: number; acted: number; pending: number; note: string | null; started_at: string; details: unknown }>(db,
      sql`select id, automation, trigger, status, observed, acted, pending, note, started_at, details from automation_run where automation <> 'bucla' order by started_at desc limit 30`),
    rows(db, sql`select count(*) filter (where automation <> 'bucla') as runs, count(*) filter (where automation <> 'bucla' and status in ('ok','nimic')) as ok,
      count(*) filter (where status = 'eroare' and automation <> 'bucla') as errors, coalesce(sum(acted) filter (where automation <> 'bucla'), 0) as acted,
      coalesce(sum(acted) filter (where automation in ('aminteste-proba','aminteste-an','bun-venit')), 0) as mails,
      count(*) filter (where trigger = 'aprobare') as approved
      from automation_run where started_at > now() - interval '7 days'`),
    rows<{ status: string; note: string | null; started_at: string; trigger: string; details: { stats?: LoopStats; ran?: { key: string; status: string; note: string }[] } | null }>(db,
      sql`select status, note, started_at, trigger, details from automation_run where automation = 'bucla' order by started_at desc limit 1`),
    planSettings(db),
  ]);
  const pendingApprovals: { key: AutoKey; count: number; note: string; at: string }[] = [];
  const waiting = AUTOMATIONS.filter((x) => x.risk === "aprobare");
  const lastOf = await Promise.all(waiting.map((a) => rows<{ status: string; pending: number; note: string; started_at: string }>(db,
    sql`select status, pending, note, started_at from automation_run where automation = ${a.key} order by started_at desc limit 1`)));
  waiting.forEach((a, i) => {
    const [r] = lastOf[i];
    if (r?.status === "asteapta" && n(r.pending) > 0) pendingApprovals.push({ key: a.key, count: n(r.pending), note: r.note, at: new Date(r.started_at).toISOString() });
  });
  const w = week[0] ?? {};
  return {
    score, switches: sw, last, pendingApprovals,
    recs: recommendations(score.parts),
    history: history.reverse().map((h) => ({ day: String(h.day), score: h.score })),
    recent: recent.map((r) => ({ ...r, at: new Date(r.started_at).toISOString() })),
    week: { runs: n(w.runs), ok: n(w.ok), errors: n(w.errors), acted: n(w.acted), mails: n(w.mails), approved: n(w.approved) },
    loop: loop[0] ? { ...loop[0], at: new Date(loop[0].started_at).toISOString() } : null,
    cron: { secret: !!process.env.CRON_SECRET?.trim(), mail: emailReady(), sales: plansNow.on },
  };
}
