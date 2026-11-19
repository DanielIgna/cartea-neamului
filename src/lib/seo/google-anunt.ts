import { createHash } from "node:crypto";
import { eq } from "drizzle-orm";
import type { Db } from "@/db";
import { appSetting } from "@/db/schema";
import { SITE_URL } from "@/lib/site-url";
import { currentVersions } from "@/lib/seo/indexnow";

/**
 * Anunță Google în ziua în care se schimbă ceva (Daniel, 19.11.2026: „să le împingă pe Google”).
 *
 * Ce se poate și ce nu, spus drept: Google nu are o „ușă” prin care să-i împingi orice pagină. Indexing API e doar pentru anunțuri
 * de angajare și transmisiuni video live; folosit pentru altceva e împotriva regulilor lor. Bing și Yandex primesc paginile prin
 * IndexNow (src/lib/seo/indexnow.ts, zilnic). La Google, căile corecte sunt:
 * 1. sitemap-ul cu data reală a schimbării (lastmod din src/data/seo-versiuni.json): îl trimitem din nou la Search Console în
 *    aceeași zi în care s-a schimbat ceva, nu doar o dată pe săptămână;
 * 2. verificăm cu URL Inspection API dacă paginile noi sau schimbate au intrat în index (după 3 zile, apoi la 4 zile, de cel mult
 *    4 ori; 25 pe zi din limita Google de 2.000);
 * 3. ce nu intră nici după a patra verificare apare în Admin → SEO → Strateg cu legătura spre „Solicită indexarea”, un buton pe
 *    care Google îl lasă doar omului din Search Console (cel mult ~10 pe zi).
 */
const KEY = "seo_google_anunt";
const DAY = 86_400_000;
export const FIRST_CHECK_DAYS = 3, RECHECK_DAYS = 4, MAX_CHECKS = 4, CHECKS_PER_RUN = 25;

export type Watch = { path: string; added: string; checks: number; lastAt: string | null; verdict: string | null };
export type GoogleState = {
  fingerprint: string | null; versions: Record<string, string>; lastSubmit: string | null; submits: number;
  watch: Watch[]; indexed: number; log: { at: string; note: string }[];
};
const EMPTY: GoogleState = { fingerprint: null, versions: {}, lastSubmit: null, submits: 0, watch: [], indexed: 0, log: [] };

export async function googleState(db: Pick<Db, "select">): Promise<GoogleState> {
  const [row] = await db.select({ value: appSetting.value }).from(appSetting).where(eq(appSetting.key, KEY)).catch(() => []);
  const v = (row?.value ?? {}) as Partial<GoogleState>;
  return { ...EMPTY, ...v, versions: v.versions ?? {}, watch: Array.isArray(v.watch) ? v.watch : [], log: Array.isArray(v.log) ? v.log : [] };
}

export const fingerprintOf = (v: Map<string, string>) =>
  createHash("sha1").update([...v.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([p, x]) => `${p} ${x}`).join("\n")).digest("hex").slice(0, 16);

/** Paginile noi sau schimbate față de ultima rulare. La prima rulare nu se pune nimic la urmărit (ar fi tot site-ul). */
export function changedPaths(now: Map<string, string>, before: Record<string, string>, first: boolean): string[] {
  if (first) return [];
  return [...now.entries()].filter(([p, v]) => before[p] !== v).map(([p]) => p).sort();
}

/** Pune paginile schimbate la urmărit (o pagină deja urmărită o ia de la capăt) și alege ce se verifică azi. */
export function planChecks(watch: Watch[], changed: string[], now: Date): { watch: Watch[]; due: Watch[] } {
  const iso = now.toISOString();
  const ch = new Set(changed);
  const out = watch.filter((w) => !ch.has(w.path));
  for (const p of changed) out.push({ path: p, added: iso, checks: 0, lastAt: null, verdict: null });
  const due = out.filter((w) => w.verdict !== "PASS" && w.checks < MAX_CHECKS
    && now.getTime() - Date.parse(w.added) >= FIRST_CHECK_DAYS * DAY - 2 * 3600_000
    && (!w.lastAt || now.getTime() - Date.parse(w.lastAt) >= RECHECK_DAYS * DAY - 2 * 3600_000))
    .sort((a, b) => Date.parse(a.added) - Date.parse(b.added)).slice(0, CHECKS_PER_RUN);
  return { watch: out, due };
}

/** Ce nu a intrat în Google după toate verificările: de cerut de mână în Search Console. */
export const stuck = (s: GoogleState) => s.watch.filter((w) => w.verdict !== "PASS" && w.checks >= MAX_CHECKS);
export const waiting = (s: GoogleState) => s.watch.filter((w) => w.verdict !== "PASS" && w.checks < MAX_CHECKS);

export type GoogleRun = { status: "fara-cheie" | "fara-acces" | "ok"; submitted: boolean; changed: number; checked: number; indexedNow: number; stuck: number; note: string };

export async function runGoogleAnnounce(db: Db, o: { now?: Date; published?: Map<string, Date> } = {}): Promise<GoogleRun> {
  const now = o.now ?? new Date();
  const { activeServiceAccount, inspectUrl, listSites, pickSite, seoSettings, submitSitemap } = await import("@/lib/seo");
  const s = await seoSettings(db);
  const sa = activeServiceAccount(s);
  if (!sa) return { status: "fara-cheie", submitted: false, changed: 0, checked: 0, indexedNow: 0, stuck: 0, note: "Search Console nu e legat (Admin → SEO → Setări)" };
  const site = pickSite(await listSites(sa.account), s.siteUrl, SITE_URL);
  if (!site) return { status: "fara-acces", submitted: false, changed: 0, checked: 0, indexedNow: 0, stuck: 0, note: "contul de serviciu nu are acces la nicio proprietate din Search Console" };

  const st = await googleState(db);
  const versions = currentVersions(o.published);
  const fp = fingerprintOf(versions);
  const first = st.fingerprint === null;
  const changed = changedPaths(versions, st.versions, first);
  let submitted = false;
  if (fp !== st.fingerprint) {
    await submitSitemap(sa.account, site, `${SITE_URL}/sitemap.xml`);
    submitted = true;
  }
  const plan = planChecks(st.watch, changed, now);
  let indexedNow = 0;
  for (let i = 0; i < plan.due.length; i += 5) {
    const batch = plan.due.slice(i, i + 5);
    const res = await Promise.all(batch.map((w) => inspectUrl(sa.account, site, `${SITE_URL}${w.path === "/" ? "/" : w.path}`)));
    res.forEach((r, j) => {
      const w = batch[j];
      if (r.verdict === "EROARE") return; // o eroare a Google nu consumă o verificare
      w.checks += 1; w.lastAt = now.toISOString(); w.verdict = r.verdict;
      if (r.verdict === "PASS") indexedNow++;
    });
  }
  // Paginile intrate în index ies din listă (se numără); restul rămân, cel mult 2.000.
  const watch = plan.watch.filter((w) => w.verdict !== "PASS").slice(-2000);
  const value: GoogleState = {
    fingerprint: fp, versions: Object.fromEntries(versions), lastSubmit: submitted ? now.toISOString() : st.lastSubmit, submits: st.submits + (submitted ? 1 : 0),
    watch, indexed: st.indexed + indexedNow, log: st.log,
  };
  const stuckN = stuck(value).length;
  const note = first ? `prima rulare: sitemap trimis, de mâine se urmăresc paginile schimbate`
    : `${changed.length} pagini schimbate${submitted ? ", sitemap trimis la Google" : ", nimic nou de trimis"} · ${plan.due.length} verificate, ${indexedNow} intrate în index${stuckN ? ` · ${stuckN} de cerut de mână` : ""}`;
  value.log = [{ at: now.toISOString(), note }, ...st.log].slice(0, 30);
  await db.insert(appSetting).values({ key: KEY, value, updatedBy: null, updatedAt: now })
    .onConflictDoUpdate({ target: appSetting.key, set: { value, updatedAt: now } });
  return { status: "ok", submitted, changed: changed.length, checked: plan.due.length, indexedNow, stuck: stuckN, note };
}
