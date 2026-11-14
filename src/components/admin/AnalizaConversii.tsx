import Link from "next/link";
import { db } from "@/db";
import { attributedShare, conversionsBy, totalOf, type ConvCounts } from "@/lib/conversii";
import { groupBy, isSearch, pct, sourceLabel, type Range, type Session } from "@/lib/analiza";
import { clusterOf, pageLabel } from "@/lib/seo-clustere";
import { gscByPath, gscSnapshot, seoSettings } from "@/lib/seo";
import { SITE_URL } from "@/lib/site-url";
import { HBars, Stat, lei, num } from "@/components/admin/ui";

/**
 * Admin → Analiză → Conversii (Daniel, 14.11.2026): de unde vin cei care fac ceva pe site, nu doar cei care se uită.
 * Sesiunile vin din page_view; conturile, arborii, clicurile pe butoane și plățile din `conversion` (src/lib/conversii.ts),
 * fiecare cu sursa și prima pagină a vizitei. Afișările și clicurile din Google vin din Search Console, dacă e legat.
 */
const money = (c: ConvCounts) => [c.lei ? lei(c.lei) : "", c.eur ? `${c.eur.toLocaleString("ro-RO")} €` : ""].filter(Boolean).join(" + ") || "—";
const rate = (a: number, b: number) => (b ? `${pct(a, b)}%` : "—");

export async function Conversions({ cur, sessions }: { cur: Range; sessions: Session[] }) {
  const [bySource, byLanding, byCampaign, byPage, byLabel, share, settings] = await Promise.all([
    conversionsBy(db, cur, "source"), conversionsBy(db, cur, "landing"), conversionsBy(db, cur, "campaign"),
    conversionsBy(db, cur, "page"), conversionsBy(db, cur, "label"), attributedShare(db, cur), seoSettings(db),
  ]);
  const gscDays = cur.days <= 7 ? 7 : cur.days <= 28 ? 28 : 90;
  const gsc = await gscSnapshot(settings, SITE_URL, gscDays);
  const gscPages = gsc.state === "legat" ? gscByPath(gsc) : null;
  const total = totalOf(bySource);
  const org = sessions.filter((s) => isSearch(s.source));
  const orgConv = [...bySource.entries()].filter(([k]) => isSearch(k)).reduce((t, [, c]) => ({
    cta: t.cta + c.cta, cont: t.cont + c.cont, arbore: t.arbore + c.arbore, plata: t.plata + c.plata,
  }), { cta: 0, cont: 0, arbore: 0, plata: 0 });

  const sources = groupBy(sessions, (s) => s.source);
  const sourceKeys = [...new Set([...sources.map((s) => s.key), ...bySource.keys()])];
  const landing = groupBy(sessions, (s) => s.entry);
  const landingKeys = [...new Set([...landing.map((s) => s.key), ...byLanding.keys()])].filter((k) => k !== "—");
  const clusters = new Map<string, { label: string; sessions: number; search: number; c: ConvCounts }>();
  for (const k of landingKeys) {
    const cl = clusterOf(k);
    const row = clusters.get(cl.key) ?? { label: cl.label, sessions: 0, search: 0, c: { cta: 0, cont: 0, arbore: 0, "plata-start": 0, plata: 0, lei: 0, eur: 0 } };
    const l = landing.find((x) => x.key === k);
    row.sessions += l?.count ?? 0;
    row.search += sessions.filter((s) => s.entry === k && isSearch(s.source)).length;
    const c = byLanding.get(k);
    if (c) for (const key of Object.keys(row.c) as (keyof ConvCounts)[]) row.c[key] += c[key];
    clusters.set(cl.key, row);
  }
  const zero: ConvCounts = { cta: 0, cont: 0, arbore: 0, "plata-start": 0, plata: 0, lei: 0, eur: 0 };

  return (
    <>
      <div className="stats">
        <Stat label="Clicuri pe butoane de început" value={num(total.cta)} hint="„Începe arborele”, „Plătește”, „Dăruiește”…" />
        <Stat label="Conturi noi" value={num(total.cont)} hint={`${rate(total.cont, sessions.length)} din sesiuni`} />
        <Stat label="Arbori porniți" value={num(total.arbore)} />
        <Stat label="Au deschis plata" value={num(total["plata-start"])} />
        <Stat label="Plăți încheiate" value={num(total.plata)} hint={money(total)} />
        <Stat label="Cu sursa găsită" value={share.total ? `${pct(share.attributed, share.total)}%` : "—"} hint="restul: vizita începuse altă zi sau „Do Not Track”" />
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Pâlnia din Google, până la plată</h2>
        <div className="stats">
          <Stat label={`Afișări în Google (${gscDays} zile)`} value={gsc.state === "legat" ? num(gsc.totals.cur?.impressions ?? 0) : "—"} hint={gsc.state === "legat" ? "din Search Console" : <Link href="/admin/seo?t=setari">leagă Search Console</Link>} />
          <Stat label={`Clicuri din Google (${gscDays} zile)`} value={gsc.state === "legat" ? num(gsc.totals.cur?.clicks ?? 0) : "—"} />
          <Stat label="Sesiuni din căutări" value={num(org.length)} hint={`${rate(org.length, sessions.length)} din tot traficul`} />
          <Stat label="Clic pe buton" value={num(orgConv.cta)} />
          <Stat label="Conturi" value={num(orgConv.cont)} hint={rate(orgConv.cont, org.length)} />
          <Stat label="Arbori" value={num(orgConv.arbore)} />
          <Stat label="Plăți" value={num(orgConv.plata)} />
        </div>
        {gsc.state !== "legat" && <p className="muted" style={{ marginBottom: 0 }}>Afișările și clicurile din Google apar singure după ce legi Search Console în Admin → SEO → Setări. Nu arătăm cifre estimate.</p>}
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Trafic pe sursă și ce face fiecare</h2>
        <div className="an-scroll">
          <table className="an-table">
            <thead><tr><th>Sursa</th><th>Sesiuni</th><th>Bounce</th><th>Clic buton</th><th>Conturi</th><th>Arbori</th><th>Plăți</th><th>Bani</th><th>Cont / sesiune</th></tr></thead>
            <tbody>
              {sourceKeys.map((k) => {
                const s = sources.find((x) => x.key === k); const c = bySource.get(k) ?? zero;
                return <tr key={k}><td>{k === "necunoscut" ? "Necunoscut (vizită din altă zi)" : sourceLabel(k)}</td><td>{num(s?.count ?? 0)}</td><td>{s ? `${s.bounceRate}%` : "—"}</td>
                  <td>{num(c.cta)}</td><td>{num(c.cont)}</td><td>{num(c.arbore)}</td><td>{num(c.plata)}</td><td>{money(c)}</td><td>{rate(c.cont, s?.count ?? 0)}</td></tr>;
              })}
              {!sourceKeys.length && <tr><td colSpan={9} className="muted">Nimic în această perioadă.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Ce conținut aduce oameni: pagina pe care au intrat</h2>
        <p className="muted" style={{ marginTop: 0 }}>Prima pagină a vizitei. „Din căutări” = intrați din Google, Bing etc. Afișările, clicurile și cuvântul principal vin din Search Console ({gscDays} zile).</p>
        <div className="an-scroll">
          <table className="an-table">
            <thead><tr><th>Pagina</th><th>Grupa</th><th>Sesiuni</th><th>Din căutări</th><th>Afișări</th><th>Clicuri Google</th><th>Cuvântul principal</th><th>Clic buton</th><th>Conturi</th><th>Plăți</th></tr></thead>
            <tbody>
              {landingKeys.sort((a, b) => (landing.find((x) => x.key === b)?.count ?? 0) - (landing.find((x) => x.key === a)?.count ?? 0)).slice(0, 80).map((k) => {
                const l = landing.find((x) => x.key === k); const c = byLanding.get(k) ?? zero; const g = gscPages?.get(k);
                return <tr key={k}><td>{clusterOf(k).indexable ? <a href={k} target="_blank">{pageLabel(k)}</a> : pageLabel(k)}</td><td>{clusterOf(k).label}</td>
                  <td>{num(l?.count ?? 0)}</td><td>{num(sessions.filter((s) => s.entry === k && isSearch(s.source)).length)}</td>
                  <td>{g ? num(g.impressions) : "—"}</td><td>{g ? num(g.clicks) : "—"}</td><td>{g?.topQuery ?? "—"}</td>
                  <td>{num(c.cta)}</td><td>{num(c.cont)}</td><td>{num(c.plata)}</td></tr>;
              })}
              {!landingKeys.length && <tr><td colSpan={10} className="muted">Nimic în această perioadă.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Pe grupe de pagini</h2>
        <div className="an-scroll">
          <table className="an-table">
            <thead><tr><th>Grupa</th><th>Sesiuni</th><th>Din căutări</th><th>Clic buton</th><th>Conturi</th><th>Arbori</th><th>Plăți</th><th>Cont / sesiune</th></tr></thead>
            <tbody>
              {[...clusters.entries()].sort((a, b) => b[1].sessions - a[1].sessions).map(([k, r]) => (
                <tr key={k}><td>{r.label}</td><td>{num(r.sessions)}</td><td>{num(r.search)}</td><td>{num(r.c.cta)}</td><td>{num(r.c.cont)}</td><td>{num(r.c.arbore)}</td><td>{num(r.c.plata)}</td><td>{rate(r.c.cont, r.sessions)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="an-grid">
        <div className="card">
          <h2 style={{ marginTop: 0 }}>Pe ce pagini se apasă butoanele</h2>
          <HBars label="Clicurile pe butoane, după pagina pe care erau" total={total.cta} data={[...byPage.entries()].filter(([, c]) => c.cta).sort((a, b) => b[1].cta - a[1].cta).slice(0, 15).map(([k, c]) => ({ label: pageLabel(k), count: c.cta }))} />
        </div>
        <div className="card">
          <h2 style={{ marginTop: 0 }}>Ce butoane</h2>
          <HBars label="Clicurile după unde duce butonul" total={total.cta} data={[...byLabel.entries()].filter(([, c]) => c.cta).sort((a, b) => b[1].cta - a[1].cta).slice(0, 15).map(([k, c]) => ({ label: k, count: c.cta }))} />
        </div>
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Campanii (linkuri cu utm_campaign)</h2>
        <div className="an-scroll">
          <table className="an-table">
            <thead><tr><th>Campania</th><th>Sesiuni</th><th>Clic buton</th><th>Conturi</th><th>Arbori</th><th>Plăți</th><th>Bani</th></tr></thead>
            <tbody>
              {[...new Set([...groupBy(sessions, (s) => s.campaign).map((x) => x.key), ...[...byCampaign.keys()].filter((k) => k !== "—")])].map((k) => {
                const c = byCampaign.get(k) ?? zero;
                return <tr key={k}><td>{k}</td><td>{num(sessions.filter((s) => s.campaign === k).length)}</td><td>{num(c.cta)}</td><td>{num(c.cont)}</td><td>{num(c.arbore)}</td><td>{num(c.plata)}</td><td>{money(c)}</td></tr>;
              })}
            </tbody>
          </table>
        </div>
        <p className="muted" style={{ marginBottom: 0 }}>Fă linkuri de campanie în fila „Surse și campanii”.</p>
      </div>

      <p className="muted" style={{ fontSize: 13 }}>
        Conversiile se numără fără să fie legate de cont: păstrăm doar „încă un cont / o plată, venit din sursa X pe pagina Y”. Sursa se găsește
        după amprenta anonimă a zilei, deci un cont făcut a doua zi după vizită apare la „Necunoscut”. Numărarea conversiilor a pornit pe 14.11.2026.
      </p>
    </>
  );
}
