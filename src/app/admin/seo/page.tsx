import Link from "next/link";
import { db } from "@/db";
import { requireAdmin } from "@/lib/admin-access";
import { SITE_URL } from "@/lib/site-url";
import { PUBLIC_PAGES } from "@/lib/public-pages";
import {
  activeServiceAccount, inspectUrl, listSitemaps, listSites, matchWatched, mergeKeywords, periods, pickSite, searchAnalytics, seoSettings,
  type GscSite, type Inspection, type KeywordRow, type Row, type Sitemap,
} from "@/lib/seo";
import { AdminNav, Stat, Status, day, num } from "@/components/admin/ui";
import { SeoSetupForm, SubmitSitemapButton } from "@/components/admin/SeoForms";

export const dynamic = "force-dynamic";
export const metadata = { title: "SEO · Admin" };

const PERIODS = [7, 28, 90] as const;
const pos = (v: number) => v.toLocaleString("ro-RO", { maximumFractionDigits: 1 });
const pct = (v: number) => `${(v * 100).toLocaleString("ro-RO", { maximumFractionDigits: 1 })}%`;

/** Săgeata locului: în Google, un loc mai mic e mai bine (1 = primul rezultat). */
function Trend({ now, before }: { now: number; before: number | null }) {
  if (before == null) return <span className="pill ok" title="nu apărea în perioada de dinainte">nou</span>;
  const d = before - now;
  if (Math.abs(d) < 0.5) return <span className="muted">=</span>;
  return <span style={{ color: d > 0 ? "var(--accent)" : "var(--red)", fontWeight: 700 }}>{d > 0 ? "▲" : "▼"} {pos(Math.abs(d))}</span>;
}

const VERDICT: Record<string, { label: string; ok: boolean; warn?: boolean }> = {
  PASS: { label: "indexată", ok: true },
  NEUTRAL: { label: "neindexată încă", ok: false, warn: true },
  PARTIAL: { label: "parțial", ok: false, warn: true },
  FAIL: { label: "cu probleme", ok: false },
  EROARE: { label: "nu am putut verifica", ok: false, warn: true },
};

type Live = {
  sites: GscSite[]; site: string | null; error: string | null;
  keywords: KeywordRow[]; pages: Row[]; totals: { cur: Row | null; prev: Row | null };
  sitemaps: Sitemap[]; inspections: Inspection[];
};

/**
 * Admin → SEO: dacă site-ul e în Google și după ce cuvinte îl găsesc oamenii. Datele vin din Google Search Console, prin cheia
 * unui cont de serviciu; fără cheie, pagina arată pașii de pornire și ce putem verifica singuri (sitemap, robots, verificarea).
 */
export default async function AdminSeo({ searchParams }: { searchParams: Promise<{ zile?: string }> }) {
  await requireAdmin("/admin/seo");
  const zile = Number((await searchParams).zile);
  const days = (PERIODS as readonly number[]).includes(zile) ? zile : 28;
  const s = await seoSettings(db);
  const key = activeServiceAccount(s);
  const verification = process.env.GOOGLE_SITE_VERIFICATION?.trim() || s.verification;

  let live: Live | null = null;
  if (key) {
    live = { sites: [], site: null, error: null, keywords: [], pages: [], totals: { cur: null, prev: null }, sitemaps: [], inspections: [] };
    try {
      live.sites = await listSites(key.account);
      live.site = pickSite(live.sites, s.siteUrl, SITE_URL);
      if (live.site) {
        const p = periods(days);
        const site = live.site;
        const [cur, prev, pages, tCur, tPrev, maps, inspections] = await Promise.all([
          searchAnalytics(key.account, site, p.cur, ["query"], 1000),
          searchAnalytics(key.account, site, p.prev, ["query"], 1000),
          searchAnalytics(key.account, site, p.cur, ["page"], 100),
          searchAnalytics(key.account, site, p.cur, [], 1),
          searchAnalytics(key.account, site, p.prev, [], 1),
          listSitemaps(key.account, site).catch(() => []),
          Promise.all(PUBLIC_PAGES.map((pg) => inspectUrl(key.account, site, `${SITE_URL}${pg.path === "/" ? "/" : pg.path}`))),
        ]);
        live.keywords = mergeKeywords(cur, prev);
        live.pages = pages;
        live.totals = { cur: tCur[0] ?? null, prev: tPrev[0] ?? null };
        live.sitemaps = maps;
        live.inspections = inspections;
      }
    } catch (e) {
      live.error = e instanceof Error ? e.message : String(e);
    }
  }

  const watched = live ? matchWatched(s.watch, live.keywords) : [];
  const indexed = live?.inspections.filter((i) => i.verdict === "PASS").length ?? 0;
  const t = live?.totals;
  const delta = (a?: number, b?: number) => (a != null && b != null && b > 0 ? ` · ${a >= b ? "+" : ""}${Math.round(((a - b) / b) * 100)}% față de înainte` : "");

  return (
    <section className="stack">
      <AdminNav active="seo" />

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Site-ul în Google</h2>
        <div className="tbl-wrap">
          <table className="tbl">
            <tbody>
              <tr><td style={{ width: 1 }}><Status ok>merge</Status></td><td>Adresa principală<small>{SITE_URL}</small></td></tr>
              <tr><td><Status ok>merge</Status></td><td>Harta site-ului (sitemap) cu {PUBLIC_PAGES.length} pagini publice<small><a href="/sitemap.xml" target="_blank">{SITE_URL}/sitemap.xml</a></small></td></tr>
              <tr><td><Status ok>merge</Status></td><td>robots.txt: Google citește paginile publice, nu arborii, mesajele sau datele cuiva<small><a href="/robots.txt" target="_blank">{SITE_URL}/robots.txt</a></small></td></tr>
              <tr>
                <td><Status ok={!!verification} warn>{verification ? "pus" : "lipsește"}</Status></td>
                <td>Codul de verificare Google pe prima pagină<small>{verification ? "Google poate confirma că site-ul e al tău (sau folosește verificarea prin DNS)." : "Nu e nevoie dacă ai verificat domeniul prin DNS în Vercel."}</small></td>
              </tr>
              <tr>
                <td><Status ok={!!key && !live?.error && !!live?.site} warn>{!key ? "lipsește" : live?.error ? "eroare" : live?.site ? "legat" : "fără acces"}</Status></td>
                <td>Legătura cu Google Search Console
                  <small>
                    {!key ? "Pune cheia mai jos ca să vezi cuvintele cheie și paginile indexate."
                      : live?.error ? `Google a răspuns: ${live.error}`
                      : live?.site ? `Proprietatea ${live.site}, prin ${key.account.client_email}`
                      : `Adaugă ${key.account.client_email} ca utilizator în Search Console (Setări → Utilizatori și permisiuni → Complet).`}
                  </small>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {live?.site && (
        <>
          <nav className="chips" aria-label="Perioada" style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {PERIODS.map((d) => (
              <Link key={d} href={d === 28 ? "/admin/seo" : `/admin/seo?zile=${d}`} className={`chip${d === days ? " on" : ""}`} aria-current={d === days ? "page" : undefined}>
                ultimele {d} zile
              </Link>
            ))}
          </nav>

          <div className="stats">
            <Stat label="Pagini indexate" value={`${indexed} din ${PUBLIC_PAGES.length}`} tone={indexed === PUBLIC_PAGES.length ? "ok" : indexed ? "warn" : "bad"} />
            <Stat label="Cuvinte cheie" value={num(live.keywords.length)} hint={`căutări după care ai apărut${live.keywords.filter((k) => k.isNew).length ? ` · ${live.keywords.filter((k) => k.isNew).length} noi` : ""}`} />
            <Stat label="Afișări în Google" value={num(t?.cur?.impressions ?? 0)} hint={delta(t?.cur?.impressions, t?.prev?.impressions).replace(/^ · /, "") || undefined} />
            <Stat label="Clicuri" value={num(t?.cur?.clicks ?? 0)} hint={delta(t?.cur?.clicks, t?.prev?.clicks).replace(/^ · /, "") || undefined} />
            <Stat label="Locul mediu" value={t?.cur ? pos(t.cur.position) : "—"} hint="1 = primul rezultat" />
          </div>

          {s.watch.length > 0 && (
            <div className="card">
              <h2 style={{ marginTop: 0 }}>Cuvintele urmărite</h2>
              <div className="tbl-wrap">
                <table className="tbl">
                  <thead><tr><th>Cuvânt</th><th className="n">Locul</th><th className="n">Schimbare</th><th className="n">Afișări</th><th className="n">Clicuri</th></tr></thead>
                  <tbody>
                    {watched.map((w) => (
                      <tr key={w.word}>
                        <td>{w.word}
                          {w.relatedCount > 0 && <small>și în {w.relatedCount} căutări apropiate: {w.related.map((r) => `„${r.query}” (locul ${pos(r.position)})`).join(", ")}</small>}
                        </td>
                        {w.exact ? (
                          <>
                            <td className="n">{pos(w.exact.position)}</td>
                            <td className="n"><Trend now={w.exact.position} before={w.exact.prevPosition} /></td>
                            <td className="n">{num(w.exact.impressions)}</td>
                            <td className="n">{num(w.exact.clicks)}</td>
                          </>
                        ) : <td className="n muted" colSpan={4}>nu apari încă pentru exact acest cuvânt</td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="card">
            <h2 style={{ marginTop: 0 }}>Toate cuvintele cheie</h2>
            <p className="muted" style={{ marginTop: 0 }}>Ce au căutat oamenii în Google când a apărut Cartea Neamului. Google arată datele cu 2–3 zile întârziere și ascunde căutările foarte rare.</p>
            {live.keywords.length === 0
              ? <p className="muted" style={{ marginBottom: 0 }}>Încă nimic. La un site nou durează de obicei câteva zile până la câteva săptămâni până apar primele căutări.</p>
              : (
                <div className="tbl-wrap">
                  <table className="tbl">
                    <thead><tr><th>Căutare</th><th className="n">Locul</th><th className="n">Schimbare</th><th className="n">Afișări</th><th className="n">Clicuri</th><th className="n">CTR</th></tr></thead>
                    <tbody>
                      {live.keywords.slice(0, 200).map((k) => (
                        <tr key={k.query}>
                          <td>{k.query}</td>
                          <td className="n">{pos(k.position)}</td>
                          <td className="n"><Trend now={k.position} before={k.prevPosition} /></td>
                          <td className="n">{num(k.impressions)}</td>
                          <td className="n">{num(k.clicks)}</td>
                          <td className="n">{pct(k.ctr)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
          </div>

          <div className="card">
            <h2 style={{ marginTop: 0 }}>Paginile publice în index</h2>
            <div className="tbl-wrap">
              <table className="tbl">
                <thead><tr><th>Pagina</th><th>Stare</th><th className="n">Afișări</th><th className="n">Clicuri</th><th>Ultima vizită Google</th></tr></thead>
                <tbody>
                  {PUBLIC_PAGES.map((pg, i) => {
                    const ins = live.inspections[i];
                    const v = VERDICT[ins?.verdict ?? ""] ?? { label: "necunoscut", ok: false, warn: true };
                    const url = `${SITE_URL}${pg.path === "/" ? "/" : pg.path}`;
                    const row = live.pages.find((r) => r.keys[0].replace(/\/$/, "") === url.replace(/\/$/, ""));
                    return (
                      <tr key={pg.path}>
                        <td>{pg.label}<small>{pg.path}</small></td>
                        <td><Status ok={v.ok} warn={v.warn}>{v.label}</Status>{(ins?.coverage || ins?.error) && <small>{ins.error ?? ins.coverage}</small>}</td>
                        <td className="n">{num(row?.impressions ?? 0)}</td>
                        <td className="n">{num(row?.clicks ?? 0)}</td>
                        <td className="tight">{ins?.lastCrawl ? day(ins.lastCrawl) : "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card">
            <h2 style={{ marginTop: 0 }}>Sitemap în Google</h2>
            {live.sitemaps.length === 0
              ? <p className="muted" style={{ marginTop: 0 }}>Google nu are încă sitemap-ul. Trimite-l cu butonul de mai jos.</p>
              : (
                <div className="tbl-wrap">
                  <table className="tbl">
                    <thead><tr><th>Adresa</th><th>Trimis</th><th>Citit de Google</th><th className="n">Pagini</th><th>Probleme</th></tr></thead>
                    <tbody>
                      {live.sitemaps.map((m) => (
                        <tr key={m.path}>
                          <td>{m.path}{m.isPending && <small>în așteptare</small>}</td>
                          <td className="tight">{day(m.lastSubmitted)}</td>
                          <td className="tight">{day(m.lastDownloaded)}</td>
                          <td className="n">{m.contents?.[0]?.submitted ?? "—"}</td>
                          <td>{Number(m.errors ?? 0) || Number(m.warnings ?? 0) ? `${m.errors ?? 0} erori, ${m.warnings ?? 0} avertismente` : "niciuna"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            <SubmitSitemapButton />
          </div>
        </>
      )}

      {!key && (
        <div className="card">
          <h2 style={{ marginTop: 0 }}>Cum legi Google Search Console (o singură dată, cam 15 minute)</h2>
          <ol style={{ paddingLeft: 20, lineHeight: 1.6, marginBottom: 0 }}>
            <li>Deschide <a href="https://search.google.com/search-console" target="_blank" rel="noreferrer">Google Search Console</a> și adaugă proprietatea <b>Domeniu</b> <code>carteaneamului.ro</code>. Google îți dă un rând TXT: pune-l în <a href="https://vercel.com/prop-manage/cartea-neamului/settings/domains" target="_blank" rel="noreferrer">Vercel → Domains</a> → carteaneamului.ro → DNS Records (tip TXT, nume <code>@</code>). Sau alege <b>Prefix URL</b> și lipește eticheta HTML mai jos.</li>
            <li>În Search Console → Sitemaps, scrie <code>sitemap.xml</code> și apasă Trimite.</li>
            <li>În <a href="https://console.cloud.google.com/apis/library/searchconsole.googleapis.com" target="_blank" rel="noreferrer">Google Cloud</a> (același proiect ca la „Continuă cu Google”), pornește <b>Google Search Console API</b>.</li>
            <li>Tot acolo: <a href="https://console.cloud.google.com/iam-admin/serviceaccounts" target="_blank" rel="noreferrer">Service Accounts</a> → Create service account (nume: <code>seo-cartea-neamului</code>, fără roluri) → Keys → Add key → JSON. Se descarcă un fișier .json.</li>
            <li>În Search Console → Setări → Utilizatori și permisiuni → Adaugă utilizator: adresa contului (se termină în <code>.iam.gserviceaccount.com</code>), permisiune <b>Complet</b>.</li>
            <li>Deschide fișierul .json, copiază tot textul și lipește-l mai jos, la „Cheia Search Console”. Gata.</li>
          </ol>
        </div>
      )}

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Setări</h2>
        <SeoSetupForm verification={s.verification} siteUrl={s.siteUrl} sites={(live?.sites ?? []).map((x) => x.siteUrl)} watch={s.watch}
          keySource={key?.source ?? null} keyEmail={key?.account.client_email ?? null} />
      </div>
    </section>
  );
}
