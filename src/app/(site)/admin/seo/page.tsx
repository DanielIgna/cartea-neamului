import Link from "next/link";
import { db } from "@/db";
import { requireAdmin } from "@/lib/admin-access";
import { SITE_URL } from "@/lib/site-url";
import { PUBLIC_PAGES, PRIVATE_PREFIXES } from "@/lib/public-pages";
import { explainGscError, gscByPath, gscSnapshot, inspectUrl, listSitemaps, matchWatched, seoSettings, activeServiceAccount, type Inspection, type Sitemap } from "@/lib/seo";
import { auditAlerts, auditPages, sitemapCheck, type AuditPage } from "@/lib/seo-audit";
import { inspectOwnPage, ownPath } from "@/lib/seo-inspector";
import { TARGET_KEYWORDS, matchTarget } from "@/lib/seo-cuvinte";
import { KEYWORDS_APPROVED, seoKeywords } from "@/data/seo-keywords";
import { NAME_MIN_WORDS } from "@/lib/continut/prag";
import { TARGET_MAX_COMMON, TARGET_OWN_WORDS } from "@/lib/seo/quality";
import { conversionsBy } from "@/lib/conversii";
import { rangeOf } from "@/lib/analiza";
import { sql } from "drizzle-orm";
import { AdminNav, Stat, Status, day, num } from "@/components/admin/ui";
import { SeoEngineForm, SeoSetupForm, SubmitSitemapButton } from "@/components/admin/SeoForms";
import { STATUS_LABEL, publishedMap, engineSettings, engineStats, runBatch, syncQueue } from "@/lib/motor-seo/motor";
import { MAX_SIMILARITY, MIN_FACTS, MIN_UNIQUE_WORDS } from "@/lib/motor-seo/calitate";
import { automationSwitches } from "@/lib/autonomie";
import { COUNTRIES, entries as diasporaEntries, type Entry as DiasporaEntry } from "@/lib/diaspora";
import { DEMO_EMAIL } from "@/lib/demo";
import { buildWeeklyReport, reportHistory, saveWeek, type WeekTotals } from "@/lib/seo-raport";
import { seoQueue } from "@/db/schema";
import LINKS from "@/data/seo-legaturi.json";
import { indexRequests, inspectLink, linkReport, type LinkData } from "@/lib/seo/legaturi";
import { versionEntries } from "@/lib/seo/versiuni";

export const dynamic = "force-dynamic";
export const metadata = { title: "SEO · Admin" };

/**
 * Admin → SEO, centrul de control (Daniel, 12.11 și 14.11.2026, după modelul din PropManage): ce pagini are site-ul, care intră în
 * Google și de ce, sitemap-ul, inspectorul de adrese, alertele, cuvintele cheie țintă și ce aduce fiecare pagină (vizite din căutări
 * și conversii, din Analiză). Partea din Google Search Console se aprinde singură după ce cheia e pusă în Setări.
 */
const TABS = [
  { key: "prezentare", label: "Prezentare" }, { key: "raport", label: "Raport săptămânal" }, { key: "cuvinte", label: "Cuvinte cheie" }, { key: "pagini", label: "Pagini" },
  { key: "indexare", label: "Indexare" }, { key: "sectiuni", label: "Secțiuni" }, { key: "diaspora", label: "Diaspora" }, { key: "inspector", label: "Inspector URL" },
  { key: "motor", label: "Motor" }, { key: "sitemap", label: "Sitemap" }, { key: "alerte", label: "Alerte" }, { key: "setari", label: "Setări" },
] as const;
type Tab = (typeof TABS)[number]["key"];
const PERIODS = [7, 28, 90] as const;
const pos = (v: number) => v.toLocaleString("ro-RO", { maximumFractionDigits: 1 });
const pctF = (v: number) => `${(v * 100).toLocaleString("ro-RO", { maximumFractionDigits: 1 })}%`;

function Trend({ now, before }: { now: number; before: number | null }) {
  if (before == null) return <span className="pill ok" title="nu apărea în perioada de dinainte">nou</span>;
  const d = before - now;
  if (Math.abs(d) < 0.5) return <span className="muted">=</span>;
  return <span style={{ color: d > 0 ? "var(--accent)" : "var(--red)", fontWeight: 700 }}>{d > 0 ? "▲" : "▼"} {pos(Math.abs(d))}</span>;
}

const VERDICT: Record<string, { label: string; ok: boolean; warn?: boolean }> = {
  PASS: { label: "indexată", ok: true }, NEUTRAL: { label: "neindexată încă", ok: false, warn: true }, PARTIAL: { label: "parțial", ok: false, warn: true },
  FAIL: { label: "cu probleme", ok: false }, EROARE: { label: "nu am putut verifica", ok: false, warn: true },
};

type SP = { t?: string; zile?: string; q?: string; grupa?: string; stare?: string; url?: string; proba?: string };

export default async function AdminSeo({ searchParams }: { searchParams: Promise<SP> }) {
  await requireAdmin("/admin/seo");
  const sp = await searchParams;
  const tab: Tab = TABS.some((t) => t.key === sp.t) ? (sp.t as Tab) : "prezentare";
  const zile = Number(sp.zile);
  const days = (PERIODS as readonly number[]).includes(zile) ? zile : 28;
  const s = await seoSettings(db);
  const gsc = await gscSnapshot(s, SITE_URL, days);
  const gscErr = gsc.error ? explainGscError(gsc.error) : null;
  const gscPages = gsc.state === "legat" ? gscByPath(gsc) : undefined;
  const pages = auditPages(await publishedMap(db));
  const alerts = auditAlerts(pages, { gscState: gsc.state, gscError: gscErr, gscPages });
  const href = (o: Partial<SP>) => {
    const q = new URLSearchParams();
    const m = { t: tab, zile: days === 28 ? undefined : String(days), ...o };
    for (const [k, v] of Object.entries(m)) if (v) q.set(k, v);
    return `/admin/seo?${q}`;
  };

  return (
    <section className="stack">
      <AdminNav active="seo" heading={false} />
      <div className="an-head">
        <div>
          <h1>Centrul SEO</h1>
          <p className="muted" style={{ margin: "4px 0 0" }}>Ce pagini are site-ul, care intră în Google și de ce, ce caută oamenii și ce aduce fiecare pagină.</p>
        </div>
        <div className="an-actions" style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <a className="btn" href="/admin/seo/csv" download>⇩ Matricea de indexare (CSV)</a>
          <a className="btn" href="/admin/seo/csv?ce=alerte" download>⇩ Alerte (CSV)</a>
        </div>
      </div>
      <nav className="an-tabs" aria-label="Părțile centrului SEO">
        {TABS.map((t) => <Link key={t.key} className="btn" href={href({ t: t.key, q: undefined, grupa: undefined, stare: undefined, url: undefined })} aria-current={t.key === tab ? "page" : undefined}>
          {t.label}{t.key === "alerte" && alerts.some((a) => a.level !== "info") ? ` (${alerts.filter((a) => a.level !== "info").length})` : ""}
        </Link>)}
      </nav>
      {["prezentare", "cuvinte", "pagini", "sectiuni", "diaspora"].includes(tab) && gsc.state === "legat" && (
        <nav className="an-periods" aria-label="Perioada din Google">
          {PERIODS.map((d) => <Link key={d} className="btn" href={href({ zile: d === 28 ? undefined : String(d) })} aria-current={d === days ? "true" : undefined}>{d} zile</Link>)}
          <span className="muted" style={{ alignSelf: "center", fontSize: 14 }}>Google arată datele cu 2–3 zile întârziere.</span>
        </nav>
      )}

      {tab === "prezentare" && await Overview({ pages, gsc, gscErr, alerts, days, href })}
      {tab === "raport" && await WeeklyTab({ s, pages })}
      {tab === "cuvinte" && <Keywords gsc={gsc} watch={s.watch} pages={pages} />}
      {tab === "pagini" && await Pages({ pages, gscPages, sp, href })}
      {tab === "indexare" && <Indexing pages={pages} href={href} sp={sp} gscPages={gscPages} />}
      {tab === "sectiuni" && await Sections({ pages, gscPages, gscOn: gsc.state === "legat", days })}
      {tab === "diaspora" && await Diaspora({ pages, gscPages, gscOn: gsc.state === "legat", days })}
      {tab === "inspector" && await Inspector({ sp, pages, gscOn: gsc.state === "legat" })}
      {tab === "motor" && await Engine({ sp, href })}
      {tab === "sitemap" && await SitemapTab({ gscOn: gsc.state === "legat" })}
      {tab === "alerte" && <Alerts alerts={alerts} />}
      {tab === "setari" && <Settings gsc={gsc} gscErr={gscErr} s={s} />}
    </section>
  );
}

/* ---------------------------------- Prezentare ---------------------------------- */

async function Overview({ pages, gsc, gscErr, alerts, days, href }: {
  pages: AuditPage[]; gsc: Awaited<ReturnType<typeof gscSnapshot>>; gscErr: ReturnType<typeof explainGscError> | null; alerts: ReturnType<typeof auditAlerts>; days: number; href: (o: Partial<SP>) => string;
}) {
  const indexable = pages.filter((p) => p.indexable).length;
  const sm = sitemapCheck();
  const t = gsc.totals;
  const delta = (a?: number, b?: number) => (a != null && b != null && b > 0 ? `${a >= b ? "+" : ""}${Math.round(((a - b) / b) * 100)}% față de înainte` : undefined);
  // Vizitele din căutări de pe site (Analiză), pentru aceeași perioadă, ca să se vadă și fără Search Console.
  const { cur } = rangeOf(days <= 7 ? "7z" : days <= 30 ? "30z" : "90z");
  const [org] = ((await db.execute(sql`select count(distinct visitor) as v, count(*) as p from page_view where day between ${cur.from} and ${cur.to} and source in ('google','bing','duckduckgo','yahoo','yandex','ecosia','brave')`)).rows ?? []) as { v?: number; p?: number }[];
  const conv = await conversionsBy(db, cur, "source");
  const orgAccounts = [...conv.entries()].filter(([k]) => ["google", "bing", "duckduckgo", "yahoo", "yandex", "ecosia", "brave"].includes(k)).reduce((a, [, c]) => a + c.cont, 0);
  const crit = alerts.filter((a) => a.level === "critic").length, warn = alerts.filter((a) => a.level === "avertisment").length;
  return (
    <>
      <div className="stats">
        <Stat label="Pagini publice cunoscute" value={num(pages.length)} hint={`plus ${PRIVATE_PREFIXES.length} zone private oprite în robots.txt`} />
        <Stat label="Indexabile (în sitemap)" value={num(indexable)} tone="ok" hint={`${num(sm.total)} adrese în sitemap`} />
        <Stat label="Ținute afară (noindex)" value={num(pages.length - indexable)} tone={pages.length - indexable ? "warn" : undefined} hint={`sub pragul de ${NAME_MIN_WORDS} cuvinte proprii`} />
        <Stat label="Alerte" value={`${crit} critice · ${warn}`} tone={crit ? "bad" : warn ? "warn" : "ok"} hint={<Link href={href({ t: "alerte" })}>vezi alertele</Link>} />
        <Stat label={`Vizitatori din căutări (${days} z)`} value={num(Number(org?.v ?? 0))} hint="numărați pe site, anonim" />
        <Stat label={`Conturi venite din căutări (${days} z)`} value={num(orgAccounts)} hint={<Link href="/admin/analiza?t=conversii">Analiză → Conversii</Link>} />
      </div>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Google Search Console</h2>
        <GscState gsc={gsc} gscErr={gscErr} />
        {gsc.state === "legat" && (
          <div className="stats" style={{ marginTop: 12 }}>
            <Stat label="Afișări în Google" value={num(t.cur?.impressions ?? 0)} hint={delta(t.cur?.impressions, t.prev?.impressions)} />
            <Stat label="Clicuri" value={num(t.cur?.clicks ?? 0)} hint={delta(t.cur?.clicks, t.prev?.clicks)} />
            <Stat label="Clicuri pe zi" value={num(Math.round((t.cur?.clicks ?? 0) / days))} hint="ținta: 300 pe zi" tone={(t.cur?.clicks ?? 0) / days >= 300 ? "ok" : undefined} />
            <Stat label="Locul mediu" value={t.cur ? pos(t.cur.position) : "—"} hint="1 = primul rezultat" />
            <Stat label="Cuvinte cheie" value={num(gsc.queries.length)} hint={`${gsc.queries.filter((k) => k.isNew).length} noi`} />
            <Stat label="Pagini văzute în Google" value={num(gsc.pages.length)} hint={`din ${num(indexable)} indexabile`} />
          </div>
        )}
      </div>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Drumul spre 300 de vizite pe zi din Google</h2>
        <ol style={{ paddingLeft: 20, lineHeight: 1.6, marginBottom: 0 }}>
          <li><b>Indexarea</b> (săptămânile 1–4): Google a citit sitemap-ul; urmărește aici câte pagini ajung „indexate”.</li>
          <li><b>Primele afișări</b> (lunile 1–3): paginile de nume, localități și ghiduri încep să apară pe locurile 20–50.</li>
          <li><b>Urcarea</b> (lunile 3–6): paginile cu cele mai multe afișări primesc text mai bogat și legături (fila Alerte arată care sunt aproape de prima pagină).</li>
          <li><b>Ținta</b> (lunile 4–9): 300 de clicuri pe zi înseamnă, la un loc mediu de 5–8, cam 6.000–10.000 de afișări pe zi, adică sute de pagini bine poziționate.</li>
        </ol>
      </div>
    </>
  );
}

function GscState({ gsc, gscErr }: { gsc: Awaited<ReturnType<typeof gscSnapshot>>; gscErr: ReturnType<typeof explainGscError> | null }) {
  if (gsc.state === "legat") return <p style={{ margin: 0 }}><Status ok>legat</Status> Proprietatea <b>{gsc.site}</b>, prin {gsc.email} ({gsc.source === "vercel" ? "cheia din Vercel" : "cheia din panou"}). Datele se reîmprospătează la 30 de minute.</p>;
  if (gsc.state === "eroare") return (<>
    <p style={{ margin: 0 }}><Status ok={false}>eroare</Status> <b>{gscErr?.title}</b></p>
    <p style={{ margin: "6px 0 0" }}>{gscErr?.fix}</p>
    <p className="muted" style={{ margin: "6px 0 0", fontSize: 13 }}>Răspunsul exact de la Google: {gsc.error}</p>
  </>);
  if (gsc.state === "fara-acces") return <p style={{ margin: 0 }}><Status ok={false} warn>fără acces</Status> Adaugă <b>{gsc.email}</b> ca utilizator în Search Console (Setări → Utilizatori și permisiuni → Complet).</p>;
  return <p style={{ margin: 0 }}><Status ok={false} warn>nelegat</Status> Sitemap-ul e deja trimis din contul tău Google, dar panoul nu are încă cheia. Pașii sunt în <Link href="/admin/seo?t=setari">Setări</Link>; după aceea, cuvintele, afișările și indexarea apar singure aici și în Analiză.</p>;
}

/* ---------------------------------- Raport săptămânal ---------------------------------- */

async function WeeklyTab({ s, pages }: { s: Awaited<ReturnType<typeof seoSettings>>; pages: AuditPage[] }) {
  const gsc = await gscSnapshot(s, SITE_URL, 7);
  const [pub] = await db.select({ n: sql<number>`count(*)::int` }).from(seoQueue)
    .where(sql`${seoQueue.status} = 'publicat' and ${seoQueue.publishedAt} > now() - interval '7 days'`).catch(() => [{ n: 0 }]);
  const published = Number(pub?.n ?? 0);
  if (gsc.state !== "legat") {
    return (
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Raportul săptămânal</h2>
        <p style={{ margin: 0 }}>Raportul se face din datele Google Search Console, care nu e încă legat la panou (pașii sunt în <Link href="/admin/seo?t=setari">Setări</Link>). Până atunci: motorul a publicat <b>{num(published)}</b> pagini noi în ultimele 7 zile.</p>
      </div>
    );
  }
  const r = buildWeeklyReport(gsc, new Set(pages.map((p) => p.path)));
  const history = await saveWeek(db, r, published).catch(() => reportHistory(db));
  const change = (a: number, b: number) => (b > 0 ? `${a >= b ? "+" : ""}${Math.round(((a - b) / b) * 100)}% față de săptămâna dinainte` : "prima săptămână cu date");
  const posHint = (c: WeekTotals, p: WeekTotals) => (c.position != null && p.position != null ? `${c.position <= p.position ? "mai bine" : "mai slab"} cu ${pos(Math.abs(c.position - p.position))} locuri` : undefined);
  return (
    <>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Săptămâna în Google (ultimele 7 zile)</h2>
        <div className="stats">
          <Stat label="Clicuri" value={num(r.cur.clicks)} hint={change(r.cur.clicks, r.prev.clicks)} tone={r.cur.clicks >= r.prev.clicks ? "ok" : "warn"} />
          <Stat label="Afișări" value={num(r.cur.impressions)} hint={change(r.cur.impressions, r.prev.impressions)} />
          <Stat label="CTR" value={pctF(r.cur.ctr)} hint={`înainte ${pctF(r.prev.ctr)}`} />
          <Stat label="Locul mediu" value={r.cur.position != null ? pos(r.cur.position) : "—"} hint={posHint(r.cur, r.prev)} />
          <Stat label="Cuvinte țintă pe prima pagină" value={`${r.targets.top10} din ${r.targets.total}`} hint={`${r.targets.top3} în primele 3 · ${r.targets.seen} apar deloc`} />
          <Stat label="Pagini noi publicate" value={num(published)} hint="de motorul SEO, în 7 zile" />
        </div>
        <p className="muted" style={{ margin: "10px 0 0", fontSize: 13 }}>Google arată datele cu 2–3 zile întârziere. Cifrele principale se păstrează în istoricul de mai jos o dată pe săptămână.</p>
      </div>
      {r.todo.length > 0 && (
        <div className="card">
          <h2 style={{ marginTop: 0 }}>De făcut săptămâna asta</h2>
          <ol style={{ paddingLeft: 20, lineHeight: 1.6, margin: 0 }}>{r.todo.map((t) => <li key={t}>{t}</li>)}</ol>
        </div>
      )}
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Pe secțiuni</h2>
        <div className="an-scroll"><table className="an-table">
          <thead><tr><th>Secțiunea</th><th>Pagini văzute</th><th>Afișări</th><th>Clicuri</th></tr></thead>
          <tbody>{r.sections.map((x) => <tr key={x.key}><td>{x.label}</td><td>{num(x.pages)}</td><td>{num(x.impressions)}</td><td>{num(x.clicks)}</td></tr>)}</tbody>
        </table></div>
      </div>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Căutările care aduc cele mai multe clicuri</h2>
        <div className="an-scroll"><table className="an-table">
          <thead><tr><th>Căutare</th><th>Locul</th><th>Schimbare</th><th>Afișări</th><th>Clicuri</th></tr></thead>
          <tbody>{r.topQueries.map((k) => <tr key={k.query}><td>{k.query}</td><td>{pos(k.position)}</td><td><Trend now={k.position} before={k.prevPosition} /></td><td>{num(k.impressions)}</td><td>{num(k.clicks)}</td></tr>)}</tbody>
        </table></div>
      </div>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Ce a urcat și ce a coborât</h2>
        {r.up.length + r.down.length === 0 ? <p className="muted" style={{ margin: 0 }}>Nicio mișcare de cel puțin un loc la căutările cu minim 5 afișări.</p> : (
          <div className="an-scroll"><table className="an-table">
            <thead><tr><th>Căutare</th><th>Acum</th><th>Înainte</th><th>Afișări</th></tr></thead>
            <tbody>
              {r.up.map((m) => <tr key={`u${m.query}`}><td>▲ {m.query}</td><td>{pos(m.position)}</td><td>{pos(m.before)}</td><td>{num(m.impressions)}</td></tr>)}
              {r.down.map((m) => <tr key={`d${m.query}`}><td>▼ {m.query}</td><td>{pos(m.position)}</td><td>{pos(m.before)}</td><td>{num(m.impressions)}</td></tr>)}
            </tbody>
          </table></div>
        )}
        {r.fresh.length > 0 && <p style={{ marginBottom: 0 }}><b>Căutări noi:</b> {r.fresh.map((k) => `„${k.query}”`).join(", ")}.</p>}
      </div>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Istoricul săptămânilor</h2>
        <div className="an-scroll"><table className="an-table">
          <thead><tr><th>Săptămâna (luni)</th><th>Clicuri</th><th>Afișări</th><th>Locul mediu</th><th>Cuvinte țintă în top 10</th><th>Pagini publicate</th></tr></thead>
          <tbody>{[...history].reverse().map((h) => <tr key={h.week}><td>{h.week}</td><td>{num(h.clicks)}</td><td>{num(h.impressions)}</td><td>{h.position != null ? pos(h.position) : "—"}</td><td>{h.top10}</td><td>{num(h.published)}</td></tr>)}</tbody>
        </table></div>
      </div>
    </>
  );
}

/* ---------------------------------- Cuvinte cheie ---------------------------------- */

function Keywords({ gsc, watch, pages }: { gsc: Awaited<ReturnType<typeof gscSnapshot>>; watch: string[]; pages: AuditPage[] }) {
  const on = gsc.state === "legat";
  const known = new Map(pages.map((p) => [p.path, p]));
  const watched = on ? matchWatched(watch, gsc.queries) : [];
  return (
    <>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Planul de cuvinte cheie</h2>
        <p className="muted" style={{ marginTop: 0 }}>Căutările pe care vrem să le câștigăm și pagina care răspunde la fiecare (lista e în src/lib/seo-cuvinte.ts). „Cerere” e o estimare relativă, nu un număr din Google.</p>
        <div className="an-scroll">
          <table className="an-table">
            <thead><tr><th>Cuvântul</th><th>Pagina</th><th>Tip</th><th>Cerere</th><th>Locul</th><th>Afișări</th><th>Clicuri</th></tr></thead>
            <tbody>
              {TARGET_KEYWORDS.map((k) => {
                const page = known.get(k.path);
                const m = on ? matchTarget(k, gsc.queries) : null;
                return (
                  <tr key={k.keyword}>
                    <td>{k.keyword}{m && !m.exact && m.best && <small className="muted"> · cel mai aproape: „{m.best.query}”</small>}</td>
                    <td style={{ textAlign: "start" }}>{page ? <a href={k.path} target="_blank">{k.path}</a> : <span style={{ color: "var(--red)" }}>lipsește pagina</span>}{page && !page.indexable ? " (noindex)" : ""}</td>
                    <td>{k.intent}</td><td>{k.demand}</td>
                    <td>{m?.best ? pos(m.best.position) : on ? "nu apare încă" : "—"}</td>
                    <td>{m?.best ? num(m.best.impressions) : "—"}</td><td>{m?.best ? num(m.best.clicks) : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <KeywordDraft />
      {watch.length > 0 && on && (
        <div className="card">
          <h2 style={{ marginTop: 0 }}>Cuvintele urmărite (din Setări)</h2>
          <div className="an-scroll">
            <table className="an-table">
              <thead><tr><th>Cuvânt</th><th>Locul</th><th>Schimbare</th><th>Afișări</th><th>Clicuri</th></tr></thead>
              <tbody>
                {watched.map((w) => (
                  <tr key={w.word}><td>{w.word}{w.relatedCount > 0 && <small> · în {w.relatedCount} căutări apropiate</small>}</td>
                    {w.exact ? <><td>{pos(w.exact.position)}</td><td><Trend now={w.exact.position} before={w.exact.prevPosition} /></td><td>{num(w.exact.impressions)}</td><td>{num(w.exact.clicks)}</td></>
                      : <td colSpan={4} className="muted">nu apari încă pentru exact acest cuvânt</td>}</tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Ce caută oamenii (toate căutările din Google)</h2>
        {!on ? <p className="muted" style={{ margin: 0 }}>Fără date: Search Console nu e legat la panou. Căutările reale apar aici după legare. Nu arătăm cifre estimate.</p>
          : gsc.queries.length === 0 ? <p className="muted" style={{ margin: 0 }}>Încă nimic. La un site nou durează câteva zile până la câteva săptămâni până apar primele căutări.</p>
          : (
            <div className="an-scroll">
              <table className="an-table">
                <thead><tr><th>Căutare</th><th>Locul</th><th>Schimbare</th><th>Afișări</th><th>Clicuri</th><th>CTR</th></tr></thead>
                <tbody>
                  {gsc.queries.slice(0, 300).map((k) => (
                    <tr key={k.query}><td>{k.query}</td><td>{pos(k.position)}</td><td><Trend now={k.position} before={k.prevPosition} /></td><td>{num(k.impressions)}</td><td>{num(k.clicks)}</td><td>{pctF(k.ctr)}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </div>
    </>
  );
}

/* ---------------------------------- Pagini ---------------------------------- */

async function Pages({ pages, gscPages, sp, href }: { pages: AuditPage[]; gscPages?: ReturnType<typeof gscByPath>; sp: SP; href: (o: Partial<SP>) => string }) {
  const q = (sp.q ?? "").trim().toLowerCase();
  const groups = [...new Map(pages.map((p) => [p.cluster.key, p.cluster.label])).entries()];
  const list = pages.filter((p) => (!sp.grupa || p.cluster.key === sp.grupa) && (!sp.stare || (sp.stare === "index" ? p.indexable : !p.indexable))
    && (!q || p.path.includes(q) || p.title.toLowerCase().includes(q)));
  const { cur } = rangeOf("30z");
  const rows = ((await db.execute(sql`select path, count(*) as s from page_view where day between ${cur.from} and ${cur.to} and source in ('google','bing','duckduckgo','yahoo','yandex','ecosia','brave') group by path`)).rows ?? []) as { path: string; s: number }[];
  const org = new Map(rows.map((r) => [r.path, Number(r.s)]));
  const conv = await conversionsBy(db, cur, "landing");
  return (
    <>
      <div className="stats">
        <Stat label="Total pagini" value={num(pages.length)} />
        <Stat label="Indexabile" value={num(pages.filter((p) => p.indexable).length)} tone="ok" />
        <Stat label="Noindex" value={num(pages.filter((p) => !p.indexable).length)} tone="warn" />
        <Stat label="Găsite cu filtrul" value={num(list.length)} />
      </div>
      <form className="card" method="get" action="/admin/seo" style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "end" }}>
        <input type="hidden" name="t" value="pagini" />
        <label style={{ flex: "1 1 220px" }}>Caută adresa sau titlul<input name="q" defaultValue={sp.q ?? ""} placeholder="ex. todea, cluj, registre" /></label>
        <label>Grupa<select name="grupa" defaultValue={sp.grupa ?? ""}><option value="">Toate grupele</option>{groups.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>
        <label>Starea<select name="stare" defaultValue={sp.stare ?? ""}><option value="">Toate</option><option value="index">Indexabile</option><option value="noindex">Noindex</option></select></label>
        <button className="btn primary" type="submit">Arată</button>
      </form>
      <div className="card">
        <div className="an-scroll">
          <table className="an-table">
            <thead><tr><th>Pagina</th><th>Grupa</th><th>Stare</th><th>Cuvinte</th><th>Afișări</th><th>Clicuri</th><th>Locul</th><th>Cuvântul principal</th><th>Vizite din căutări (30 z)</th><th>Conturi (30 z)</th><th></th></tr></thead>
            <tbody>
              {list.slice(0, 400).map((p) => {
                const g = gscPages?.get(p.path); const c = conv.get(p.path);
                return (
                  <tr key={p.path}>
                    <td><a href={p.path} target="_blank">{p.path}</a><small className="muted" style={{ display: "block" }}>{p.title.replace(" | Cartea Neamului", "")}</small></td>
                    <td>{p.cluster.label}</td>
                    <td>{p.indexable ? <Status ok>index</Status> : <Status ok={false} warn>noindex</Status>}</td>
                    <td>{p.words ?? "—"}</td>
                    <td>{g ? num(g.impressions) : "—"}</td><td>{g ? num(g.clicks) : "—"}</td><td>{g ? pos(g.position) : "—"}</td><td>{g?.topQuery ?? "—"}</td>
                    <td>{num(org.get(p.path) ?? 0)}</td><td>{num(c?.cont ?? 0)}</td>
                    <td><Link href={href({ t: "inspector", url: p.path, q: undefined, grupa: undefined, stare: undefined })}>inspectează</Link></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {list.length > 400 && <p className="muted" style={{ marginBottom: 0 }}>Se văd primele 400 din {list.length}. Restrânge cu filtrul sau descarcă matricea CSV.</p>}
      </div>
    </>
  );
}

/* ---------------------------------- Indexare (pragul) ---------------------------------- */

function Indexing({ pages, href, sp, gscPages }: { pages: AuditPage[]; href: (o: Partial<SP>) => string; sp: SP; gscPages?: ReturnType<typeof gscByPath> }) {
  const byCluster = [...new Map(pages.map((p) => [p.cluster.key, p.cluster.label])).entries()].map(([k, label]) => {
    const ps = pages.filter((p) => p.cluster.key === k);
    return { k, label, total: ps.length, index: ps.filter((p) => p.indexable).length, inSitemap: ps.filter((p) => p.inSitemap).length };
  });
  const gated = pages.filter((p) => !p.indexable);
  const show = sp.stare === "index" ? pages.filter((p) => p.indexable) : sp.stare === "toate" ? pages : gated;
  return (
    <>
      <div className="stats">
        <Stat label="Indexabile" value={num(pages.filter((p) => p.indexable).length)} tone="ok" />
        <Stat label="Ținute afară" value={num(gated.length)} tone={gated.length ? "warn" : undefined} />
        <Stat label="Pragul la nume" value={`${NAME_MIN_WORDS} cuvinte proprii`} hint={`ținta din plan: ${TARGET_OWN_WORDS} cuvinte proprii și sub ${TARGET_MAX_COMMON}% fraze comune`} />
        <Stat label="Ating ținta" value={num(pages.filter((p) => p.quality?.meetsTarget).length)} hint={`din ${num(pages.filter((p) => p.quality).length)} pagini cu scor`} />
      </div>
      <IndexRequests pages={pages} gscPages={gscPages} />
      <InternalLinks pages={pages} />
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Cum hotărâm ce intră în Google</h2>
        <p style={{ marginTop: 0 }}>O pagină intră în Google doar dacă are destul conținut propriu. Paginile subțiri sau aproape la fel cu altele trag în jos tot site-ul, așa că rămân deschise oamenilor, dar au „noindex” și nu intră în sitemap. Pragul e în src/lib/continut/prag.ts. Ghidurile, glosarul, județele și orașele sunt scrise de mână, deci intră toate.</p>
        <p>„Cuvinte proprii” înseamnă cuvintele din frazele care nu se repetă pe alte pagini de același fel (o frază care diferă doar prin nume e tot comună). „% comun” e partea din text repetată, iar scorul (0–100) le cântărește pe amândouă. Paginile de nume cu scor mic sunt „paginile subțiri”: au nevoie de text scris anume.</p>
        <div className="an-scroll">
          <table className="an-table">
            <thead><tr><th>Grupa</th><th>Pagini</th><th>Indexabile</th><th>În sitemap</th><th>Ținute afară</th></tr></thead>
            <tbody>{byCluster.map((c) => <tr key={c.k}><td>{c.label}</td><td>{num(c.total)}</td><td>{num(c.index)}</td><td>{num(c.inSitemap)}</td><td>{num(c.total - c.index)}</td></tr>)}</tbody>
          </table>
        </div>
      </div>
      <nav className="an-periods" aria-label="Ce pagini">
        {[["", "Ținute afară"], ["index", "Indexabile"], ["toate", "Toate"]].map(([k, l]) => <Link key={k} className="btn" href={href({ stare: k || undefined })} aria-current={(sp.stare ?? "") === k ? "true" : undefined}>{l}</Link>)}
      </nav>
      <div className="card">
        <div className="an-scroll">
          <table className="an-table">
            <thead><tr><th>Pagina</th><th>Grupa</th><th>Cuvinte</th><th>% comun</th><th>Scor</th><th>Stare</th><th>De ce</th></tr></thead>
            <tbody>
              {show.slice(0, 500).map((p) => <tr key={p.path}><td><a href={p.path} target="_blank">{p.path}</a></td><td>{p.cluster.label}</td><td>{p.words ?? "—"}</td><td>{p.quality ? `${p.quality.commonPct}%` : "—"}</td><td>{p.quality?.score ?? "—"}</td>
                <td>{p.indexable ? <Status ok>index</Status> : <Status ok={false} warn>noindex</Status>}</td><td style={{ textAlign: "start" }}>{p.gate ?? "conținut propriu suficient"}</td></tr>)}
              {!show.length && <tr><td colSpan={7} className="muted">Nicio pagină.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

/* ---------------------------------- Secțiuni (clustere) ---------------------------------- */

async function Sections({ pages, gscPages, gscOn, days }: { pages: AuditPage[]; gscPages?: ReturnType<typeof gscByPath>; gscOn: boolean; days: number }) {
  const { cur } = rangeOf(days <= 7 ? "7z" : days <= 30 ? "30z" : "90z");
  const rows = ((await db.execute(sql`select path, count(*) as s from page_view where day between ${cur.from} and ${cur.to} and source in ('google','bing','duckduckgo','yahoo','yandex','ecosia','brave') group by path`)).rows ?? []) as { path: string; s: number }[];
  const org = new Map(rows.map((r) => [r.path, Number(r.s)]));
  const conv = await conversionsBy(db, cur, "landing");
  // Grupele, și în ghiduri: pe categorii (Regiuni istorice, Românii din străinătate…), ca să se vadă ce temă aduce.
  const keyOf = (p: AuditPage) => (p.cluster.key === "ghid" && p.category && p.category !== "hub" ? `ghid:${p.category}` : p.cluster.key);
  const labelOf = (p: AuditPage) => (p.cluster.key === "ghid" && p.category && p.category !== "hub" ? `Ghiduri · ${p.category}` : p.cluster.label);
  const clusters = [...new Map(pages.map((p) => [keyOf(p), labelOf(p)])).entries()].map(([k, label]) => {
    const ps = pages.filter((p) => keyOf(p) === k);
    const g = ps.map((p) => gscPages?.get(p.path)).filter((x) => !!x);
    return {
      k, label, total: ps.length, index: ps.filter((p) => p.indexable).length, seen: g.length,
      impressions: g.reduce((a, b) => a + b!.impressions, 0), clicks: g.reduce((a, b) => a + b!.clicks, 0),
      org: ps.reduce((a, p) => a + (org.get(p.path) ?? 0), 0), cont: ps.reduce((a, p) => a + (conv.get(p.path)?.cont ?? 0), 0), plata: ps.reduce((a, p) => a + (conv.get(p.path)?.plata ?? 0), 0),
    };
  });
  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>Secțiunile site-ului (clustere)</h2>
      <p className="muted" style={{ marginTop: 0 }}>„Văzute în Google” = pagini care au apărut cel puțin o dată în rezultate în ultimele {days} zile, deci sigur sunt indexate. Vizitele și conturile sunt numărate pe site (prima pagină a vizitei).</p>
      <div className="an-scroll">
        <table className="an-table">
          <thead><tr><th>Secțiunea</th><th>Pagini</th><th>Indexabile</th><th>Văzute în Google</th><th>Afișări</th><th>Clicuri</th><th>Vizite din căutări</th><th>Conturi</th><th>Plăți</th></tr></thead>
          <tbody>
            {clusters.map((c) => <tr key={c.k}><td>{c.label}</td><td>{num(c.total)}</td><td>{num(c.index)}</td><td>{gscOn ? num(c.seen) : "—"}</td><td>{gscOn ? num(c.impressions) : "—"}</td><td>{gscOn ? num(c.clicks) : "—"}</td><td>{num(c.org)}</td><td>{num(c.cont)}</td><td>{num(c.plata)}</td></tr>)}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------------------------------- Diaspora ---------------------------------- */

/**
 * Filtrul „Diaspora” (Daniel, 17.11.2026): pe fiecare țară și pe fiecare stat, provincie sau oraș, afișările, clicurile și poziția
 * din Google (toate limbile paginii la un loc), vizitele din căutări și conturile: cele venite pe pagină și cele cu eticheta
 * ?src=diaspora-<pagină> (butonul de cont nou și linkul de WhatsApp). Conturile de test și cel demo nu se numără.
 */
async function Diaspora({ pages, gscPages, gscOn, days }: { pages: AuditPage[]; gscPages?: ReturnType<typeof gscByPath>; gscOn: boolean; days: number }) {
  const { cur } = rangeOf(days <= 7 ? "7z" : days <= 30 ? "30z" : "90z");
  const dia = pages.filter((p) => p.path === "/diaspora" || p.path.includes("/diaspora/") || p.path.endsWith("/diaspora"));
  const base = (path: string) => path.slice(path.indexOf("/diaspora"));
  const [orgRows, srcRows] = await Promise.all([
    db.execute(sql`select path, count(*) as s from page_view where day between ${cur.from} and ${cur.to} and path like '%/diaspora%' and source in ('google','bing','duckduckgo','yahoo','yandex','ecosia','brave') group by path`),
    db.execute(sql`select coalesce(s.first_src, s.last_src) as k, count(*) as c from account_source s join "user" u on u.id = s.user_id
      where s.analytics and (s.first_src like 'diaspora%' or s.last_src like 'diaspora%') and u.email not like '%@example.com' and u.email <> ${DEMO_EMAIL}
        and coalesce(s.first_at, u.created_at) >= ${cur.from}::date group by 1`),
  ]);
  const org = new Map<string, number>();
  for (const r of (orgRows.rows ?? []) as { path: string; s: number }[]) org.set(base(r.path), (org.get(base(r.path)) ?? 0) + Number(r.s));
  const src = new Map(((srcRows.rows ?? []) as { k: string; c: number }[]).map((r) => [String(r.k), Number(r.c)]));
  const conv = await conversionsBy(db, cur, "landing");
  type Row = { key: string; label: string; depth: number; total: number; index: number; imp: number; clk: number; posW: number; org: number; cont: number; src: number };
  const rowOf = (key: string, label: string, depth: number, es: DiasporaEntry[]): Row => {
    const paths = new Set(es.map((e) => e.path));
    const ps = dia.filter((p) => paths.has(base(p.path)));
    const g = ps.map((p) => gscPages?.get(p.path)).filter((x) => !!x);
    const imp = g.reduce((a, b) => a + b!.impressions, 0);
    return {
      key, label, depth, total: ps.length, index: ps.filter((p) => p.indexable).length, imp, clk: g.reduce((a, b) => a + b!.clicks, 0),
      posW: imp ? g.reduce((a, b) => a + b!.position * b!.impressions, 0) / imp : 0,
      org: [...paths].reduce((a, p) => a + (org.get(p) ?? 0), 0),
      cont: ps.reduce((a, p) => a + (conv.get(p.path)?.cont ?? 0), 0),
      src: [...paths].reduce((a, p) => a + (src.get(p === "/diaspora" ? "diaspora" : `diaspora-${p.split("/").pop()}`) ?? 0), 0),
    };
  };
  const all = diasporaEntries();
  const rows: Row[] = [rowOf("hub", "Pagina principală /diaspora", 0, all.filter((e) => e.kind === "hub"))];
  for (const c of COUNTRIES) {
    const own = all.filter((e) => (e.kind === "country" && e.country === c) || (e.kind === "region" && e.country === c));
    rows.push(rowOf(c.slug, `${c.flag} ${c.name.ro ?? c.slug}`, 0, own));
    for (const e of own) if (e.kind === "region") {
      const r = rowOf(e.path, e.region.name.ro ?? e.region.slug, 1, [e]);
      if (r.imp || r.org || r.cont || r.src || e.indexable) rows.push(r);
    }
  }
  rows.push(rowOf("teme", "Paginile speciale", 0, all.filter((e) => e.kind === "theme")));
  const totalSrc = [...src.values()].reduce((a, b) => a + b, 0);
  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>Diaspora: țări și orașe</h2>
      <p className="muted" style={{ marginTop: 0 }}>Toate limbile unei pagini sunt adunate. „Conturi (?src)” = conturi noi cu eticheta diaspora-… în ultimele {days} zile (doar cine a acceptat cookie-urile de analiză; fără conturile de test și demo). În total: {num(totalSrc)}.</p>
      <div className="an-scroll">
        <table className="an-table">
          <thead><tr><th>Țara / orașul</th><th>Pagini</th><th>Indexabile</th><th>Afișări</th><th>Clicuri</th><th>Poziția medie</th><th>Vizite din căutări</th><th>Conturi (pagina de intrare)</th><th>Conturi (?src)</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key}>
                <td style={r.depth ? { paddingLeft: 24 } : { fontWeight: 600 }}>{r.label}</td><td>{num(r.total)}</td><td>{num(r.index)}</td>
                <td>{gscOn ? num(r.imp) : "—"}</td><td>{gscOn ? num(r.clk) : "—"}</td><td>{gscOn && r.imp ? pos(r.posW) : "—"}</td>
                <td>{num(r.org)}</td><td>{num(r.cont)}</td><td>{num(r.src)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------------------------------- Inspector URL ---------------------------------- */

async function Inspector({ sp, pages, gscOn }: { sp: SP; pages: AuditPage[]; gscOn: boolean }) {
  const path = ownPath(sp.url);
  const page = path ? pages.find((p) => p.path === path.split("?")[0]) : null;
  const res = path ? await inspectOwnPage(path, { inSitemap: !!page?.inSitemap, gate: page?.gate ?? null }) : null;
  let google: Inspection | null = null;
  if (path && gscOn) {
    const s = await seoSettings(db); const key = activeServiceAccount(s);
    const snap = await gscSnapshot(s, SITE_URL, 28);
    if (key && snap.site) google = await inspectUrl(key.account, snap.site, `${SITE_URL}${path === "/" ? "/" : path}`);
  }
  const examples = ["/", "/ghid/cum-incepi-arborele-genealogic", "/nume/popescu", "/localitati/cluj", "/ghid/registrele-de-stare-civila", "/glosar/spita-neamului"];
  return (
    <>
      <form className="card" method="get" action="/admin/seo" style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "end" }}>
        <input type="hidden" name="t" value="inspector" />
        <label style={{ flex: "1 1 300px" }}>Adresa de verificat<input name="url" defaultValue={sp.url ?? ""} placeholder="/ghid/... sau adresa întreagă" /></label>
        <button className="btn primary" type="submit">Inspectează</button>
        <div className="chips" style={{ flexBasis: "100%" }}>{examples.map((e) => <Link key={e} className="chip" href={`/admin/seo?t=inspector&url=${encodeURIComponent(e)}`}>{e}</Link>)}</div>
      </form>
      {sp.url && !path && <p className="muted">Adresa nu e de pe carteaneamului.ro.</p>}
      {res && (
        <div className="card">
          <h2 style={{ marginTop: 0 }}>{res.url}</h2>
          <p className="muted" style={{ marginTop: 0 }}>Grupa: {page?.cluster.label ?? "pagină necunoscută în inventar"} · {page ? (page.indexable ? "trebuie să fie în Google" : "trebuie ținută afară") : "nu e în lista paginilor publice"}</p>
          <div className="tbl-wrap">
            <table className="tbl">
              <tbody>
                {res.checks.map((c) => <tr key={c.label}><td style={{ width: 1 }}><Status ok={c.ok} warn={c.warn}>{c.ok ? "bine" : c.warn ? "de văzut" : "problemă"}</Status></td><td>{c.label}<small>{c.detail}</small></td></tr>)}
                {google && (() => { const v = VERDICT[google.verdict] ?? { label: google.verdict, ok: false, warn: true }; return (
                  <tr><td><Status ok={v.ok} warn={v.warn}>{v.label}</Status></td><td>Starea în Google (Search Console)<small>{google.error ?? google.coverage}{google.lastCrawl ? ` · citită de Google ${day(google.lastCrawl)}` : ""}</small></td></tr>
                ); })()}
                {!gscOn && <tr><td><Status ok={false} warn>—</Status></td><td>Starea în Google<small>Apare aici după legarea Search Console (fila Setări). Până atunci, o vezi în Search Console → Verificarea adresei URL.</small></td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}

/* ---------------------------------- Sitemap ---------------------------------- */

async function SitemapTab({ gscOn }: { gscOn: boolean }) {
  const sm = sitemapCheck();
  let maps: Sitemap[] = [];
  if (gscOn) {
    const s = await seoSettings(db); const key = activeServiceAccount(s); const snap = await gscSnapshot(s, SITE_URL, 28);
    if (key && snap.site) maps = await listSitemaps(key.account, snap.site).catch(() => []);
  }
  const ok = !sm.duplicates.length && !sm.privateIn.length && !sm.badSlugs.length && !sm.overLimit.length;
  return (
    <>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Structura sitemap-ului</h2>
        <p style={{ marginTop: 0 }}><a href="/sitemap.xml" target="_blank">{SITE_URL}/sitemap.xml</a> · {sm.isIndex ? `index cu ${sm.groups.length} fișiere` : "un singur fișier"} · {num(sm.total)} adrese · robots.txt trimite spre el</p>
        <div className="stats">
          {sm.groups.map((g) => <Stat key={g.name} label={g.file.replace("/sitemaps/", "")} value={num(g.count)} hint={g.label} />)}
        </div>
        <h3>Verificarea</h3>
        <div className="tbl-wrap"><table className="tbl"><tbody>
          <tr><td style={{ width: 1 }}><Status ok={!sm.duplicates.length}>{sm.duplicates.length ? "problemă" : "bine"}</Status></td><td>Fără adrese duble<small>{sm.duplicates.slice(0, 10).join(", ") || "niciuna"}</small></td></tr>
          <tr><td><Status ok={!sm.privateIn.length}>{sm.privateIn.length ? "problemă" : "bine"}</Status></td><td>Nicio pagină privată (arbori, cont, plată)<small>{sm.privateIn.slice(0, 10).join(", ") || "niciuna"}</small></td></tr>
          <tr><td><Status ok={!sm.badSlugs.length} warn>{sm.badSlugs.length ? "de văzut" : "bine"}</Status></td><td>Adrese curate (litere mici, cifre, liniuțe)<small>{sm.badSlugs.slice(0, 10).join(", ") || "toate"}</small></td></tr>
          <tr><td><Status ok={!sm.overLimit.length}>{sm.overLimit.length ? "problemă" : "bine"}</Status></td><td>Sub limita de 50.000 de adrese pe fișier</td></tr>
          <tr><td><Status ok>bine</Status></td><td>Paginile sub pragul de conținut lăsate afară<small>vezi fila Indexare</small></td></tr>
        </tbody></table></div>
        <p className="muted" style={{ marginBottom: 0 }}>{ok ? "Sitemap-ul e în regulă." : "Sunt lucruri de reparat mai sus."}</p>
      </div>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Sitemap-ul în Google</h2>
        {!gscOn ? <p className="muted" style={{ marginTop: 0 }}>Din pozele tale din Search Console (14.11.2026): indexul a fost citit cu succes, 496 de pagini descoperite. Aici apare singur după legarea cheii.</p>
          : maps.length === 0 ? <p className="muted" style={{ marginTop: 0 }}>Google nu are încă sitemap-ul. Trimite-l cu butonul de mai jos.</p>
          : (
            <div className="an-scroll">
              <table className="an-table">
                <thead><tr><th>Adresa</th><th>Trimis</th><th>Citit</th><th>Pagini</th><th>Probleme</th></tr></thead>
                <tbody>{maps.map((m) => <tr key={m.path}><td>{m.path}{m.isPending && <small> · în așteptare</small>}</td><td>{day(m.lastSubmitted)}</td><td>{day(m.lastDownloaded)}</td><td>{m.contents?.[0]?.submitted ?? "—"}</td>
                  <td>{Number(m.errors ?? 0) || Number(m.warnings ?? 0) ? `${m.errors ?? 0} erori, ${m.warnings ?? 0} avertismente` : "niciuna"}</td></tr>)}</tbody>
              </table>
            </div>
          )}
        {gscOn && <SubmitSitemapButton />}
      </div>
    </>
  );
}

/* ---------------------------------- Alerte ---------------------------------- */

function Alerts({ alerts }: { alerts: ReturnType<typeof auditAlerts> }) {
  const tone = { critic: "var(--red)", avertisment: "var(--ochre, #b7791f)", info: "var(--muted)" } as const;
  return (
    <>
      <div className="stats">
        <Stat label="Critice" value={num(alerts.filter((a) => a.level === "critic").length)} tone={alerts.some((a) => a.level === "critic") ? "bad" : "ok"} />
        <Stat label="Avertismente" value={num(alerts.filter((a) => a.level === "avertisment").length)} tone={alerts.some((a) => a.level === "avertisment") ? "warn" : "ok"} />
        <Stat label="Informări" value={num(alerts.filter((a) => a.level === "info").length)} />
      </div>
      {alerts.map((a) => (
        <div key={a.code} className="card" style={{ borderLeft: `4px solid ${tone[a.level]}` }}>
          <h2 style={{ marginTop: 0, fontSize: 18 }}>{a.title} <small className="muted" style={{ fontWeight: 400, fontSize: 12 }}>{a.code}</small></h2>
          <p style={{ margin: 0 }}>{a.text}</p>
          {a.fix && <p style={{ margin: "6px 0 0" }}><b>Ce faci:</b> {a.fix}</p>}
          {a.paths && a.paths.length > 0 && (
            <details style={{ marginTop: 6 }}><summary>{a.paths.length} pagini</summary>
              <ul className="hub-list hub-cols">{a.paths.slice(0, 200).map((p) => <li key={p}><Link href={`/admin/seo?t=inspector&url=${encodeURIComponent(p)}`}>{p}</Link></li>)}</ul>
            </details>
          )}
        </div>
      ))}
      {!alerts.length && <p className="muted">Nicio alertă.</p>}
    </>
  );
}

/* ---------------------------------- Setări ---------------------------------- */

function Settings({ gsc, gscErr, s }: { gsc: Awaited<ReturnType<typeof gscSnapshot>>; gscErr: ReturnType<typeof explainGscError> | null; s: Awaited<ReturnType<typeof seoSettings>> }) {
  const verification = process.env.GOOGLE_SITE_VERIFICATION?.trim() || s.verification;
  return (
    <>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Starea legăturilor</h2>
        <div className="tbl-wrap"><table className="tbl"><tbody>
          <tr><td style={{ width: 1 }}><Status ok>merge</Status></td><td>Adresa principală<small>{SITE_URL}</small></td></tr>
          <tr><td><Status ok>merge</Status></td><td>robots.txt: Google citește paginile publice, nu arborii, mesajele sau datele cuiva<small><a href="/robots.txt" target="_blank">{SITE_URL}/robots.txt</a></small></td></tr>
          <tr><td><Status ok={!!verification} warn>{verification ? "pus" : "prin DNS"}</Status></td><td>Verificarea proprietății în Google<small>{verification ? "Eticheta HTML e pe prima pagină." : "Proprietatea „Domeniu” carteaneamului.ro e verificată prin DNS (din pozele tale), deci eticheta nu mai e necesară."}</small></td></tr>
          <tr><td><Status ok={gsc.state === "legat"} warn>{gsc.state === "legat" ? "legat" : gsc.state === "eroare" ? "eroare" : gsc.state === "fara-acces" ? "fără acces" : "lipsește cheia"}</Status></td><td>Cheia pentru Search Console în panou<small><GscState gsc={gsc} gscErr={gscErr} /></small></td></tr>
        </tbody></table></div>
      </div>
      {gsc.state !== "legat" && (
        <div className="card">
          <h2 style={{ marginTop: 0 }}>Cum legi Search Console de panou (o singură dată, cam 10 minute)</h2>
          <p style={{ marginTop: 0 }}>Proprietatea și sitemap-ul le ai deja. Mai trebuie doar o cheie, ca panoul să poată citi datele:</p>
          <ol style={{ paddingLeft: 20, lineHeight: 1.6, marginBottom: 0 }}>
            <li>În <a href="https://console.cloud.google.com/apis/library/searchconsole.googleapis.com" target="_blank" rel="noreferrer">Google Cloud</a> (același proiect ca la „Continuă cu Google”), apasă <b>Enable</b> la <b>Google Search Console API</b>.</li>
            <li><a href="https://console.cloud.google.com/iam-admin/serviceaccounts" target="_blank" rel="noreferrer">Service Accounts</a> → Create service account (nume: <code>seo-cartea-neamului</code>, fără roluri) → intră în el → Keys → Add key → JSON. Se descarcă un fișier .json.</li>
            <li>În <a href="https://search.google.com/search-console/users?resource_id=sc-domain%3Acarteaneamului.ro" target="_blank" rel="noreferrer">Search Console → Setări → Utilizatori și permisiuni</a> → Adaugă utilizator: adresa contului (se termină în <code>.iam.gserviceaccount.com</code>), permisiune <b>Complet</b>.</li>
            <li>Deschide fișierul .json, copiază tot textul și lipește-l mai jos, la „Cheia Search Console”. Gata: Prezentarea, Cuvintele, Paginile și Analiză → Conversii se umplu singure.</li>
          </ol>
          <p className="muted" style={{ marginBottom: 0 }}>Dacă apare „invalid_grant” (ca la PropManage): cheia a fost ștearsă sau revocată. Fă o cheie nouă la pasul 2 și lipește-o din nou.</p>
        </div>
      )}
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Setări</h2>
        <SeoSetupForm verification={s.verification} siteUrl={s.siteUrl} sites={gsc.sites.map((x) => x.siteUrl)} watch={s.watch} keySource={gsc.source} keyEmail={gsc.email} />
      </div>
      <p className="muted" style={{ fontSize: 13 }}>Paginile principale: {PUBLIC_PAGES.length}. Zonele private oprite în robots.txt: {PRIVATE_PREFIXES.join(", ")}.</p>
    </>
  );
}

/* ------------------------------ Motorul de publicare ------------------------------ */

async function Engine({ sp, href }: { sp: SP; href: (o: Partial<SP>) => string }) {
  const [settings, switches] = await Promise.all([engineSettings(db), automationSwitches(db)]);
  let stats: Awaited<ReturnType<typeof engineStats>> | null = null, err: string | null = null;
  try { await syncQueue(db); stats = await engineStats(db); } catch (e) { err = e instanceof Error ? e.message : String(e); }
  const probe = sp.proba === "1" && stats ? await runBatch(db, { limit: 20, dryRun: true }) : null;
  const count = (status: string) => stats?.byStatus.filter((r) => r.status === status).reduce((n, r) => n + Number(r.n), 0) ?? 0;
  const idx = stats?.indexed.reduce((a, r) => ({ yes: a.yes + Number(r.yes), no: a.no + Number(r.no) }), { yes: 0, no: 0 }) ?? { yes: 0, no: 0 };
  const rate = idx.yes + idx.no ? Math.round((idx.yes / (idx.yes + idx.no)) * 100) : null;
  return (
    <div className="stack">
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Motorul de publicare</h2>
        <p className="muted">Paginile de localități sunt deja în site; motorul hotărăște când intră fiecare în Google. Zilnic ia următoarele {settings.perDay} comune (cele mai mari întâi), adună datele publice din Wikipedia (rescrise de noi, cu atribuire), le trece prin control și le publică sau le lasă noindex cu motivul. Control: cel puțin {MIN_UNIQUE_WORDS} de cuvinte unice, {MIN_FACTS} date proprii și cel mult {MAX_SIMILARITY}% asemănare cu paginile vecine.</p>
        <p style={{ marginBottom: 0 }}>
          <Status ok={!!switches["motor-seo"]} warn={!switches["motor-seo"]}>{switches["motor-seo"] ? "Pornit: rulează zilnic la 7:15" : "Oprit: nu publică nimic singur"}</Status>{" "}
          <Link href="/admin/autonomie">{switches["motor-seo"] ? "Oprește-l" : "Pornește-l"} din Autonomie →</Link>
        </p>
        {err && <p style={{ color: "var(--red)" }}>Coada nu poate fi citită: {err}</p>}
      </div>
      <div className="an-stats">
        <Stat label="Publicate" value={num(count("publicat"))} hint="în Google și în sitemap" tone="ok" />
        <Stat label="În așteptare" value={num(count("asteptare"))} hint={`cam ${Math.ceil(count("asteptare") / Math.max(1, settings.perDay))} zile la ritmul de acum`} />
        <Stat label="Noindex" value={num(count("noindex"))} hint="n-au trecut controlul" tone={count("noindex") ? "warn" : undefined} />
        <Stat label="Indexate la Google" value={rate == null ? "—" : `${rate}%`} hint={rate == null ? "se verifică după 7 zile de la publicare" : `${num(idx.yes)} din ${num(idx.yes + idx.no)} verificate`} tone={rate == null ? undefined : rate < 50 ? "bad" : rate < 70 ? "warn" : "ok"} />
      </div>
      {rate != null && rate < 50 && <div className="card" style={{ borderColor: "var(--red)" }}><b>Google ia mai puțin de jumătate din pagini.</b> Ritmul a scăzut singur la jumătate; merită îmbogățite paginile înainte de a publica mai multe.</div>}
      <div className="card">
        <h3 style={{ marginTop: 0 }}>Ritmul</h3>
        <SeoEngineForm perDay={settings.perDay} min={settings.min} max={settings.max} autoRamp={settings.autoRamp} />
        {settings.lastRamp && <p className="muted small" style={{ marginBottom: 0 }}>Ultima schimbare: {settings.lastRamp}</p>}
      </div>
      {stats && stats.perDay.length > 0 && (
        <div className="card"><h3 style={{ marginTop: 0 }}>Publicate pe zi (30 de zile)</h3>
          <table className="table"><tbody>{stats.perDay.map((d) => <tr key={d.day}><td>{day(d.day)}</td><td>{num(Number(d.n))}</td></tr>)}</tbody></table></div>
      )}
      <div className="card">
        <h3 style={{ marginTop: 0 }}>Probă pe 20 de pagini</h3>
        <p className="muted">Generează următoarele 20 de comune din coadă exact ca motorul, dar fără să publice nimic.</p>
        <Link className="btn" href={href({ proba: "1" })}>Rulează proba</Link>
        {probe && <EngineTable rows={probe.map((p) => ({ path: p.path, name: `${p.name} (${p.county})`, status: p.status, words: p.quality.words, unique: p.quality.unique, facts: p.quality.facts, similarity: p.quality.similarity, reasons: p.wikiError ? `Wikipedia: ${p.wikiError}` : p.quality.reasons.join("; "), wiki: p.wiki }))} />}
      </div>
      {stats && stats.recent.length > 0 && (
        <div className="card"><h3 style={{ marginTop: 0 }}>Ultimele generate</h3>
          <EngineTable rows={stats.recent.map((r) => ({ path: r.path, name: r.path.split("/").pop()!, status: r.status, words: r.words, unique: r.uniqueWords, facts: r.facts, similarity: r.similarity, reasons: r.reasons, wiki: (r.data as { wiki?: { title?: string } } | null)?.wiki?.title ?? null }))} /></div>
      )}
    </div>
  );
}

function EngineTable({ rows }: { rows: { path: string; name: string; status: string; words: number | null; unique: number | null; facts: number | null; similarity: number | null; reasons: string | null; wiki: string | null }[] }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table className="table">
        <thead><tr><th>Pagina</th><th>Stare</th><th>Cuvinte / unice</th><th>Date proprii</th><th>Asemănare</th><th>Wikipedia</th><th>De ce</th></tr></thead>
        <tbody>{rows.map((r) => (
          <tr key={r.path}>
            <td><a href={r.path} target="_blank" rel="noreferrer">{r.name}</a></td>
            <td><Status ok={r.status === "publicat"} warn={r.status !== "publicat"}>{STATUS_LABEL[r.status] ?? r.status}</Status></td>
            <td>{r.words ?? "—"} / {r.unique ?? "—"}</td><td>{r.facts ?? "—"}</td><td>{r.similarity == null ? "—" : `${r.similarity}%`}</td>
            <td className="small">{r.wiki ?? "—"}</td><td className="small muted">{r.reasons ?? ""}</td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
}

/** Lista mare de cuvinte cheie (src/data/seo-keywords.ts): ciornă de aprobat, cu numărătoarea pe grupe și stări. */
function KeywordDraft() {
  const rows = seoKeywords();
  const count = <T extends string>(f: (r: (typeof rows)[number]) => T) => [...rows.reduce((m, r) => m.set(f(r), (m.get(f(r)) ?? 0) + 1), new Map<T, number>())].sort((a, b) => b[1] - a[1]);
  const todo = rows.filter((r) => r.status === "de-creat" && r.prioritate === 1);
  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>Lista mare de cuvinte cheie {KEYWORDS_APPROVED ? "" : <small className="muted" style={{ fontWeight: 400, fontSize: 13 }}>· ciornă, de aprobat</small>}</h2>
      <p className="muted" style={{ marginTop: 0 }}>{rows.length} căutări, fiecare cu pagina care îi răspunde. Nu schimbă nimic pe site până nu o aprobi; tabelul de mai sus rămâne lista urmărită. Fără volume inventate: prioritatea e 1 (cumpărare sau sezon apropiat), 2 (școală, cum faci) sau 3 (informare).</p>
      <p style={{ margin: "4px 0" }}><b>Pe grupe:</b> {count((r) => r.cluster).map(([k, n]) => `${k} ${n}`).join(" · ")}</p>
      <p style={{ margin: "4px 0" }}><b>Pe stări:</b> {count((r) => r.status).map(([k, n]) => `${k === "exista" ? "pagina există" : k === "de-creat" ? "pagină de scris" : "pagină de îmbogățit"} ${n}`).join(" · ")}</p>
      {todo.length > 0 && <p style={{ margin: "4px 0" }}><b>Pagini de scris cu prioritate 1:</b> {[...new Set(todo.map((r) => r.targetUrl))].join(", ")}</p>}
      <p style={{ marginBottom: 0 }}><a className="btn ghost" href="/admin/seo/csv?ce=cuvinte">Descarcă lista (CSV)</a></p>
    </div>
  );
}

/** „De cerut indexare”: primele 15 pagini care nu apar încă în Google, cu legătura spre Inspectarea adresei. */
function IndexRequests({ pages, gscPages }: { pages: AuditPage[]; gscPages?: ReturnType<typeof gscByPath> }) {
  const v = versionEntries();
  const list = indexRequests(pages, { gscPages, lastmod: (p) => (v[p] ? new Date(`${v[p].split(" ")[1]}T00:00:00Z`) : null) });
  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>De cerut indexare (primele 15)</h2>
      <p className="muted" style={{ marginTop: 0 }}>Pagini bune care {gscPages ? "nu au apărut încă în Google în perioada aleasă" : "încă nu le putem verifica în Google (Search Console nu e legat), deci le luăm pe toate"}. Întâi paginile-hub, apoi cadourile, paginile principale și uneltele, cele schimbate recent primele. Google primește cam 10 cereri pe zi: apasă „Cere în Google”, apoi în Search Console „Solicită indexarea”.</p>
      <div className="an-scroll">
        <table className="an-table">
          <thead><tr><th>Pagina</th><th>Grupa</th><th>Schimbată</th><th></th></tr></thead>
          <tbody>
            {list.map((p) => <tr key={p.path}><td><a href={p.path} target="_blank">{p.path}</a></td><td>{p.cluster.label}</td><td>{p.lastmod ? p.lastmod.toISOString().slice(0, 10) : "—"}</td>
              <td><a className="btn ghost" href={inspectLink(`${SITE_URL}${p.path === "/" ? "/" : p.path}`)} target="_blank" rel="noreferrer">Cere în Google</a></td></tr>)}
            {!list.length && <tr><td colSpan={4} className="muted">Toate paginile bune apar deja în Google.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Legăturile interne: paginile pe care nu le leagă nicio altă pagină (orfane) și cele legate doar de 1–2 pagini. */
function InternalLinks({ pages }: { pages: AuditPage[] }) {
  const r = linkReport(LINKS as LinkData, pages);
  const data = (LINKS as LinkData).pages;
  if (!r) return null;
  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>Legăturile interne</h2>
      <p className="muted" style={{ marginTop: 0 }}>Câte pagini leagă fiecare pagină, din textul paginii (fără meniul de sus și subsol). O pagină pe care n-o leagă nimeni („orfană”) e greu de găsit pentru Google. Numărătoare din {r.generated}, pe {num(r.measured)} pagini{r.missing ? `; ${num(r.missing)} pagini noi încă nenumărate` : ""}. Se reface cu scripts/seo-legaturi.ts.</p>
      <div className="stats">
        <Stat label="Orfane" value={num(r.orphans.length)} tone={r.orphans.length ? "bad" : "ok"} />
        <Stat label="Slab legate (1–2)" value={num(r.weak.length)} tone={r.weak.length ? "warn" : "ok"} />
      </div>
      {(r.orphans.length > 0 || r.weak.length > 0) && (
        <div className="an-scroll">
          <table className="an-table">
            <thead><tr><th>Pagina</th><th>Grupa</th><th>Legături primite</th><th>De la</th></tr></thead>
            <tbody>
              {[...r.orphans, ...r.weak].slice(0, 100).map((p) => <tr key={p.path}><td><a href={p.path} target="_blank">{p.path}</a></td><td>{p.cluster.label}</td><td>{data[p.path].in}</td>
                <td style={{ textAlign: "start" }}>{data[p.path].from.join(", ") || "—"}</td></tr>)}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
