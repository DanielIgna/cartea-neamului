import Link from "next/link";
import { db } from "@/db";
import { requireAdmin } from "@/lib/admin-access";
import {
  JUDETE, JUDETE_GRID, PERIODS, accountFunnel, business, change, countryName, durationLabel, flagOf, geography, judetName, groupBy, isPeriod, isSearch, observations, pct, rangeOf, retention,
  sessionsOf, sourceLabel, summary, topPages, trafficSeries, uniqueVisitors, weekHeat, type PeriodKey, type Session,
} from "@/lib/analiza";
import { PUBLIC_PAGES } from "@/lib/public-pages";
import { AdminNav, HBars, Stat, day, lei, num } from "@/components/admin/ui";
import { Donut, TrafficChart, WeekHeat } from "@/components/admin/charts";
import { CampaignLink, PrintButton } from "@/components/admin/AnalizaTools";

export const dynamic = "force-dynamic";
export const metadata = { title: "Analiză · Admin · Cartea Neamului" };

const TABS = [
  { key: "prezentare", label: "Prezentare" }, { key: "palnie", label: "Pâlnie" }, { key: "ore", label: "Zile și ore" },
  { key: "bounce", label: "Bounce" }, { key: "retentie", label: "Retenție" }, { key: "pagini", label: "Pagini" },
  { key: "seo", label: "SEO" }, { key: "campanii", label: "Surse și campanii" }, { key: "tari", label: "Țări și zone" },
] as const;
type Tab = (typeof TABS)[number]["key"];

const pageLabel = (p: string) => PUBLIC_PAGES.find((x) => x.path === p)?.label
  ?? ({ "/intrare": "Intrare / cont nou", "/arbore-nou": "Arbore nou", "/arbore/…": "Arborii (pagini private)", "/plata": "Plata", "/a/…": "Amintiri (private)", "/mesaje": "Mesaje", "/datele-mele": "Datele mele" } as Record<string, string>)[p]
  ?? p;

function Trend({ cur, prev, invert = false }: { cur: number; prev: number; invert?: boolean }) {
  const c = change(cur, prev);
  if (c == null) return <span className="muted">fără perioadă de comparat</span>;
  const good = invert ? c < 0 : c > 0;
  return <span><span className={`trend ${c === 0 ? "" : good ? "up" : "down"}`}>{c > 0 ? "▲ +" : c < 0 ? "▼ " : ""}{c}%</span> <span className="muted">față de perioada dinainte</span></span>;
}

export default async function Analiza({ searchParams }: { searchParams: Promise<{ p?: string; t?: string }> }) {
  await requireAdmin("/admin/analiza");
  const sp = await searchParams;
  const period: PeriodKey = isPeriod(sp.p) ? sp.p : "30z";
  const tab: Tab = TABS.some((t) => t.key === sp.t) ? (sp.t as Tab) : "prezentare";
  const { cur, prev } = rangeOf(period);
  const [sessions, prevSessions, uv, prevUv, biz, prevBiz, funnel] = await Promise.all([
    sessionsOf(db, cur), sessionsOf(db, prev), uniqueVisitors(db, cur), uniqueVisitors(db, prev), business(db, cur), business(db, prev), accountFunnel(db, cur),
  ]);
  const sum = summary(sessions), prevSum = summary(prevSessions);
  const sources = groupBy(sessions, (s) => s.source);
  const heat = weekHeat(sessions);
  const href = (o: { p?: string; t?: string }) => `/admin/analiza?p=${o.p ?? period}&t=${o.t ?? tab}`;

  return (
    <section className="stack">
      <AdminNav active="analiza" heading={false} />
      <div className="an-head">
        <div>
          <h1>Analiză și creștere</h1>
          <p className="muted" style={{ margin: "4px 0 0" }}>Trafic, surse, campanii și conversii, numărate anonim: fără cookie-uri și fără firme din afară.</p>
        </div>
        <div className="an-actions" style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <a className="btn" href={`/admin/analiza/csv?p=${period}`} download>⇩ CSV</a>
          <PrintButton />
        </div>
      </div>
      <nav className="an-tabs" aria-label="Părțile analizei">
        {TABS.map((t) => <Link key={t.key} className="btn" href={href({ t: t.key })} aria-current={t.key === tab ? "page" : undefined}>{t.label}</Link>)}
      </nav>
      <nav className="an-periods" aria-label="Perioada">
        {PERIODS.map((p) => <Link key={p.key} className="btn" href={href({ p: p.key })} aria-current={p.key === period ? "true" : undefined}>{p.label}</Link>)}
        <span className="muted" style={{ alignSelf: "center", fontSize: 14 }}>{cur.days === 1 ? day(`${cur.from}T12:00:00Z`) : `${day(`${cur.from}T12:00:00Z`)} – ${day(`${cur.to}T12:00:00Z`)}`}</span>
      </nav>

      {tab === "prezentare" && await Overview({ cur, sessions, uv, prevUv, sum, prevSum, biz, prevBiz, sources, funnel, heat, prevAccounts: prevBiz.accounts })}
      {tab === "palnie" && <Funnel uv={uv.visitors} sessions={sessions} funnel={funnel} biz={biz} />}
      {tab === "ore" && <Hours heat={heat} sessions={sessions} />}
      {tab === "bounce" && <Bounce sessions={sessions} sum={sum} prevSum={prevSum} />}
      {tab === "retentie" && await Retention()}
      {tab === "pagini" && await Pages({ cur, sessions, tariHref: href({ t: "tari" }) })}
      {tab === "seo" && <Seo sessions={sessions} prevSessions={prevSessions} />}
      {tab === "campanii" && <Campaigns sessions={sessions} />}
      {tab === "tari" && await Places({ cur, prev, sessions })}

      <p className="muted" style={{ fontSize: 13 }}>
        Cum numărăm: fiecare pagină deschisă, fără cookie-uri. Vizitatorul e o amprentă care se schimbă zilnic, deci „vizitatori unici” înseamnă
        unici în fiecare zi, adunați. Sesiune = pagini fără o pauză mai mare de 30 de minute. Bounce = sesiuni cu o singură pagină.
        Nu numărăm adminii, contul de probă, roboții și pe cei cu „Do Not Track”. Vizitele se păstrează 13 luni.
      </p>
    </section>
  );
}

async function Overview(o: {
  cur: ReturnType<typeof rangeOf>["cur"]; sessions: Session[]; uv: { visitors: number; views: number }; prevUv: { visitors: number; views: number };
  sum: ReturnType<typeof summary>; prevSum: ReturnType<typeof summary>; biz: Awaited<ReturnType<typeof business>>; prevBiz: Awaited<ReturnType<typeof business>>;
  sources: ReturnType<typeof groupBy>; funnel: Awaited<ReturnType<typeof accountFunnel>>; heat: number[][]; prevAccounts: number;
}) {
  const series = await trafficSeries(db, o.cur, o.sessions);
  const notes = observations({ visitors: o.uv.visitors, prevVisitors: o.prevUv.visitors, sum: o.sum, prevSum: o.prevSum, sources: o.sources, accounts: o.biz.accounts, prevAccounts: o.prevAccounts, funnel: o.funnel, heat: o.heat, days: o.cur.days });
  const money = [o.biz.lei ? lei(o.biz.lei) : "", o.biz.eur ? `${o.biz.eur} €` : ""].filter(Boolean).join(" + ");
  return (
    <>
      <div className="stats">
        <Stat label="Vizitatori unici" value={num(o.uv.visitors)} hint={<Trend cur={o.uv.visitors} prev={o.prevUv.visitors} />} />
        <Stat label="Sesiuni" value={num(o.sum.sessions)} hint={<Trend cur={o.sum.sessions} prev={o.prevSum.sessions} />} />
        <Stat label="Pagini văzute" value={num(o.uv.views)} hint={`${o.sum.pagesPerSession} pe sesiune`} />
        <Stat label="Conturi create" value={num(o.biz.accounts)} hint={<Trend cur={o.biz.accounts} prev={o.prevBiz.accounts} />} />
        <Stat label="Arbori porniți" value={num(o.biz.trees)} hint={<Trend cur={o.biz.trees} prev={o.prevBiz.trees} />} />
        <Stat label="Plăți" value={num(o.biz.payments)} hint={money || "nicio plată"} />
        <Stat label="Bounce" value={`${o.sum.bounceRate}%`} hint={<Trend cur={o.sum.bounceRate} prev={o.prevSum.bounceRate} invert />} tone={o.sum.sessions >= 20 && o.sum.bounceRate >= 70 ? "warn" : undefined} />
        <Stat label="Durata medie" value={durationLabel(o.sum.avgSecs)} hint="la sesiunile cu mai multe pagini" />
      </div>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Ce arată cifrele</h2>
        <ul className="an-notes">{notes.map((x, i) => <li key={i} className={x.tone}>{x.text}</li>)}</ul>
        <p className="muted" style={{ fontSize: 13, marginBottom: 0 }}>Observații calculate după reguli simple din cifrele de mai sus.</p>
      </div>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Trafic {o.cur.days === 1 ? "pe ore" : o.cur.days > 92 ? "pe săptămâni" : "zilnic"}</h2>
        <TrafficChart data={series} />
      </div>
      <div className="an-grid">
        <div className="card">
          <h2 style={{ marginTop: 0 }}>Surse de trafic</h2>
          <Donut label="Sesiunile după sursă" data={o.sources.map((s) => ({ label: sourceLabel(s.key), count: s.count }))} />
        </div>
        <div className="card">
          <h2 style={{ marginTop: 0 }}>Pâlnie de conversie</h2>
          <FunnelBars steps={[
            { label: "Vizitatori unici", count: o.uv.visitors },
            { label: "Au deschis pagina de cont", count: o.sessions.filter((s) => s.signup).length },
            { label: "Conturi create", count: o.funnel.accounts },
            { label: "Au pornit un arbore", count: o.funnel.trees },
            { label: "Au plătit", count: o.funnel.paid },
          ]} />
        </div>
      </div>
    </>
  );
}

function FunnelBars({ steps }: { steps: { label: string; count: number }[] }) {
  const max = Math.max(1, steps[0]?.count ?? 1);
  return (
    <div role="list" aria-label="Pâlnia de conversie">
      {steps.map((s, i) => {
        const prev = i ? steps[i - 1].count : null;
        return (
          <div role="listitem" key={s.label}>
            <div className="funnel-step">
              <span>{s.label}</span>
              <span className="funnel-bar" aria-hidden="true"><span style={{ width: `${s.count ? Math.max(1.5, (100 * s.count) / max) : 0}%` }} /></span>
              <b style={{ fontVariantNumeric: "tabular-nums" }}>{num(s.count)}</b>
            </div>
            {prev != null && <div className="funnel-step"><span /><span className="funnel-drop">{prev ? `${pct(s.count, prev)}% din pasul dinainte` : "—"}</span></div>}
          </div>
        );
      })}
    </div>
  );
}

function Funnel({ uv, sessions, funnel, biz }: { uv: number; sessions: Session[]; funnel: Awaited<ReturnType<typeof accountFunnel>>; biz: Awaited<ReturnType<typeof business>> }) {
  return (
    <>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Vizită → cont → arbore → plată</h2>
        <FunnelBars steps={[
          { label: "Vizitatori unici", count: uv },
          { label: "Sesiuni care au deschis pagina de cont", count: sessions.filter((s) => s.signup).length },
          { label: "Conturi create", count: funnel.accounts },
          { label: "Au pornit sau au intrat într-un arbore", count: funnel.trees },
          { label: "Arbore cu cel puțin 5 persoane", count: funnel.grown },
          { label: "Au plătit (oricând după)", count: funnel.paid },
        ]} />
        <p className="muted" style={{ fontSize: 13, marginBottom: 0 }}>
          Primii doi pași vin din vizitele anonime, ceilalți din conturile făcute în perioadă (fără contul de probă). Vizitele și conturile nu sunt legate între ele,
          așa că procentul dintre pasul 2 și 3 e aproximativ. Plăți în perioadă, de la oricine: {num(biz.payments)}.
        </p>
      </div>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Unde se pierd oamenii, pe surse</h2>
        <SourceTable rows={groupBy(sessions, (s) => s.source).slice(0, 15)} />
      </div>
    </>
  );
}

function SourceTable({ rows, label = "Sursa", name = sourceLabel }: { rows: ReturnType<typeof groupBy>; label?: string; name?: (k: string) => string }) {
  if (!rows.length) return <p className="muted">Nimic în această perioadă.</p>;
  return (
    <div className="an-scroll">
      <table className="an-table">
        <thead><tr><th>{label}</th><th>Sesiuni</th><th>Bounce</th><th>Pagini/sesiune</th><th>Pagina de cont</th><th>Arbori</th><th>Plata</th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key}><td>{name(r.key)}</td><td>{num(r.count)}</td><td>{r.bounceRate}%</td><td>{r.pagesPerSession}</td>
              <td>{pct(r.signup, r.count)}%</td><td>{pct(r.tree, r.count)}%</td><td>{pct(r.pay, r.count)}%</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Hours({ heat, sessions }: { heat: number[][]; sessions: Session[] }) {
  const byDevice = groupBy(sessions, (s) => s.device);
  return (
    <>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Când vin oamenii</h2>
        <p className="muted" style={{ marginTop: 0 }}>Începutul fiecărei sesiuni, după ziua săptămânii și ora din România. Ajută la ales ora postărilor și a emailurilor.</p>
        <WeekHeat grid={heat} />
      </div>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>De pe ce</h2>
        <HBars label="Sesiunile după dispozitiv" total={sessions.length} data={byDevice.map((d) => ({ label: d.key, count: d.count }))} />
      </div>
    </>
  );
}

function Bounce({ sessions, sum, prevSum }: { sessions: Session[]; sum: ReturnType<typeof summary>; prevSum: ReturnType<typeof summary> }) {
  const entries = groupBy(sessions, (s) => s.entry).filter((r) => r.count >= 2).sort((a, b) => b.bounceRate * Math.sqrt(b.count) - a.bounceRate * Math.sqrt(a.count)).slice(0, 15);
  const devices = groupBy(sessions, (s) => s.device);
  return (
    <>
      <div className="stats">
        <Stat label="Bounce" value={`${sum.bounceRate}%`} hint={<Trend cur={sum.bounceRate} prev={prevSum.bounceRate} invert />} />
        <Stat label="Sesiuni de o pagină" value={num(sum.bounces)} hint={`din ${num(sum.sessions)}`} />
        <Stat label="Pagini pe sesiune" value={sum.pagesPerSession} hint={`înainte ${prevSum.pagesPerSession}`} />
      </div>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Paginile de intrare de pe care se pleacă</h2>
        <p className="muted" style={{ marginTop: 0 }}>Ordonate după cât contează: bounce mare și multe sesiuni.</p>
        <div className="an-scroll">
          <table className="an-table">
            <thead><tr><th>Pagina de intrare</th><th>Sesiuni</th><th>Bounce</th><th>Durata medie</th></tr></thead>
            <tbody>{entries.map((r) => <tr key={r.key}><td>{pageLabel(r.key)}</td><td>{num(r.count)}</td><td>{r.bounceRate}%</td><td>{durationLabel(r.avgSecs)}</td></tr>)}</tbody>
          </table>
        </div>
      </div>
      <div className="an-grid">
        <div className="card"><h2 style={{ marginTop: 0 }}>Bounce pe surse</h2>
          <HBars label="Bounce pe surse" total={100} noPct format={(v) => `${v}%`} data={groupBy(sessions, (s) => s.source).slice(0, 8).map((r) => ({ label: `${sourceLabel(r.key)} (${r.count})`, count: Math.round(r.bounceRate) }))} />
        </div>
        <div className="card"><h2 style={{ marginTop: 0 }}>Bounce pe dispozitiv</h2>
          <HBars label="Bounce pe dispozitiv" total={100} noPct format={(v) => `${v}%`} data={devices.map((r) => ({ label: `${r.key} (${r.count})`, count: Math.round(r.bounceRate) }))} />
        </div>
      </div>
    </>
  );
}

async function Retention() {
  const cohorts = await retention(db);
  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>Cât revin cei cu cont</h2>
      <p className="muted" style={{ marginTop: 0 }}>
        Conturile, pe săptămâna în care s-au făcut, și câți dintre ei au mai intrat sau au mai lucrat ceva în fiecare săptămână de după
        (S0 = prima săptămână, fără prima zi). Vizitatorii fără cont nu pot fi urmăriți de la o zi la alta, cu bună știință.
      </p>
      {cohorts.length ? (
        <div className="an-scroll">
          <table className="an-table">
            <thead><tr><th>Săptămâna contului</th><th>Conturi</th>{[0, 1, 2, 3, 4, 5].map((k) => <th key={k}>S{k}</th>)}</tr></thead>
            <tbody>
              {cohorts.map((c) => (
                <tr key={c.cohort}><td>{day(`${c.cohort}T12:00:00Z`)}</td><td>{c.size}</td>
                  {c.weeks.map((w, k) => (
                    <td key={k} style={w == null ? undefined : { background: `color-mix(in srgb, var(--viz-1) ${Math.round((70 * w) / Math.max(1, c.size))}%, transparent)` }}>
                      {w == null ? "" : `${pct(w, c.size)}%`}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <p className="muted">Niciun cont nou în ultimele 10 săptămâni.</p>}
    </div>
  );
}

async function Pages({ cur, sessions, tariHref }: { cur: ReturnType<typeof rangeOf>["cur"]; sessions: Session[]; tariHref: string }) {
  const pages = await topPages(db, cur);
  const entries = new Map(groupBy(sessions, (s) => s.entry).map((r) => [r.key, r]));
  const exits = new Map(groupBy(sessions, (s) => s.exit).map((r) => [r.key, r.count]));
  return (
    <>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Paginile cele mai văzute</h2>
        {pages.length ? (
          <div className="an-scroll">
            <table className="an-table">
              <thead><tr><th>Pagina</th><th>Vizualizări</th><th>Vizitatori</th><th>Intrări</th><th>Bounce la intrare</th><th>Ieșiri</th></tr></thead>
              <tbody>{pages.map((p) => {
                const e = entries.get(p.path);
                return <tr key={p.path}><td>{pageLabel(p.path)}{pageLabel(p.path) !== p.path && <div className="muted" style={{ fontSize: 12 }}>{p.path}</div>}</td>
                  <td>{num(p.views)}</td><td>{num(p.visitors)}</td><td>{num(e?.count ?? 0)}</td><td>{e ? `${e.bounceRate}%` : "—"}</td><td>{num(exits.get(p.path) ?? 0)}</td></tr>;
              })}</tbody>
            </table>
          </div>
        ) : <p className="muted">Nicio pagină văzută în această perioadă.</p>}
      </div>
      <p className="muted" style={{ margin: 0 }}>Țările, județele și orașele vizitatorilor sunt la <Link href={tariHref}>Țări și zone</Link>.</p>
    </>
  );
}

function Seo({ sessions, prevSessions }: { sessions: Session[]; prevSessions: Session[] }) {
  const org = sessions.filter((s) => isSearch(s.source));
  const prevOrg = prevSessions.filter((s) => isSearch(s.source));
  const landing = groupBy(org, (s) => s.entry).slice(0, 15);
  const engines = groupBy(org, (s) => s.source);
  return (
    <>
      <div className="stats">
        <Stat label="Sesiuni din căutări" value={num(org.length)} hint={<Trend cur={org.length} prev={prevOrg.length} />} />
        <Stat label="Din tot traficul" value={`${pct(org.length, sessions.length)}%`} />
        <Stat label="Bounce din căutări" value={`${summary(org).bounceRate}%`} />
        <Stat label="Au deschis pagina de cont" value={num(org.filter((s) => s.signup).length)} />
      </div>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Pe ce pagini intră din Google</h2>
        {landing.length ? <HBars label="Paginile de intrare din căutări" total={org.length} data={landing.map((r) => ({ label: pageLabel(r.key), count: r.count }))} />
          : <p className="muted">Încă nicio vizită din căutări în această perioadă.</p>}
      </div>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Motoare de căutare</h2>
        <HBars label="Sesiunile pe motoare de căutare" total={org.length} data={engines.map((r) => ({ label: sourceLabel(r.key), count: r.count }))} />
        <p style={{ marginBottom: 0 }}>Cuvintele căutate, pozițiile și paginile indexate sunt în <Link href="/admin/seo">Admin → SEO</Link> (din Google Search Console).</p>
      </div>
    </>
  );
}

function Campaigns({ sessions }: { sessions: Session[] }) {
  const camp = groupBy(sessions, (s) => s.campaign);
  const referrers = groupBy(sessions.filter((s) => s.referrer), (s) => s.referrer);
  return (
    <>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Surse</h2>
        <SourceTable rows={groupBy(sessions, (s) => s.source)} />
      </div>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Campanii</h2>
        <p className="muted" style={{ marginTop: 0 }}>Linkurile cu „utm_campaign” (fă-le mai jos). Vezi câte sesiuni a adus fiecare postare sau mesaj și cât au mers mai departe.</p>
        <SourceTable label="Campania" name={(k) => k} rows={camp} />
      </div>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Fă un link de campanie</h2>
        <CampaignLink />
      </div>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Site-urile din care s-a apăsat</h2>
        <HBars label="Site-urile care trimit vizite" total={sessions.length} data={referrers.slice(0, 15).map((r) => ({ label: r.key, count: r.count }))} />
      </div>
    </>
  );
}

/* ---------- Țări și zone (Daniel, 14.11.2026): de unde vin vizitatorii, după IP, fără ca IP-ul să fie păstrat ---------- */
async function Places({ cur, prev, sessions }: { cur: ReturnType<typeof rangeOf>["cur"]; prev: ReturnType<typeof rangeOf>["prev"]; sessions: Session[] }) {
  const [geo, prevGeo] = await Promise.all([geography(db, cur), geography(db, prev)]);
  const total = geo.countries.reduce((a, b) => a + b.visitors, 0);
  const known = geo.countries.filter((c) => c.country !== "?");
  const ro = geo.countries.find((c) => c.country === "RO")?.visitors ?? 0;
  const abroad = known.filter((c) => c.country !== "RO").reduce((a, b) => a + b.visitors, 0);
  const prevBy = new Map(prevGeo.countries.map((c) => [c.country, c.visitors]));
  const prevAbroad = prevGeo.countries.filter((c) => c.country !== "RO" && c.country !== "?").reduce((a, b) => a + b.visitors, 0);
  const byCountry = new Map(groupBy(sessions, (s) => s.country ?? "?").map((r) => [r.key, r]));
  const roRegions = geo.regions.filter((r) => r.country === "RO" && r.region);
  const roByCode = new Map(roRegions.map((r) => [r.region!, r.visitors]));
  const roSessions = new Map(groupBy(sessions.filter((s) => s.country === "RO"), (s) => s.region).map((r) => [r.key, r]));
  const roMax = Math.max(1, ...roRegions.map((r) => r.visitors));
  const roCities = geo.cities.filter((c) => c.country === "RO" && c.city).slice(0, 20);
  const abroadCities = geo.cities.filter((c) => c.country !== "RO" && c.country !== "?" && c.city).slice(0, 20);
  const otherRegions = geo.regions.filter((r) => r.country !== "RO" && r.country !== "?" && r.region).slice(0, 15);

  if (!total) return <div className="card"><p className="muted" style={{ margin: 0 }}>Nicio vizită în această perioadă.</p></div>;
  return (
    <>
      <div className="stats">
        <Stat label="Țări" value={num(known.length)} hint={known[0] ? `cele mai multe: ${countryName(known[0].country)}` : "—"} />
        <Stat label="Din România" value={`${pct(ro, total)}%`} hint={`${num(ro)} vizitatori`} />
        <Stat label="Din afara țării" value={`${pct(abroad, total)}%`} hint={<Trend cur={abroad} prev={prevAbroad} />} />
        <Stat label="Județe din care s-a intrat" value={`${num(roRegions.length)} din 42`} hint={roRegions[0] ? `cele mai multe: ${judetName(roRegions[0].region)}` : "—"} />
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Țările</h2>
        <p className="muted" style={{ marginTop: 0 }}>Vizitatori unici (pe zile, adunați), comparat cu perioada dinainte, și cât au mers mai departe cei din fiecare țară.</p>
        <div className="an-scroll">
          <table className="an-table">
            <thead><tr><th>Țara</th><th>Vizitatori</th><th>Din total</th><th>Față de înainte</th><th>Sesiuni</th><th>Bounce</th><th>Pagina de cont</th><th>Plata</th></tr></thead>
            <tbody>{geo.countries.slice(0, 40).map((c) => {
              const s = byCountry.get(c.country);
              const before = prevBy.get(c.country) ?? 0;
              const ch = change(c.visitors, before);
              return (
                <tr key={c.country}>
                  <td><span aria-hidden="true">{c.country === "?" ? "❔" : flagOf(c.country)}</span> {countryName(c.country)}</td>
                  <td>{num(c.visitors)}</td><td>{pct(c.visitors, total)}%</td>
                  <td>{ch == null ? <span className="muted">nou</span> : <span className={`trend ${ch === 0 ? "" : ch > 0 ? "up" : "down"}`}>{ch > 0 ? "+" : ""}{ch}%</span>}</td>
                  <td>{num(s?.count ?? 0)}</td><td>{s ? `${s.bounceRate}%` : "—"}</td><td>{s ? `${pct(s.signup, s.count)}%` : "—"}</td><td>{s ? `${pct(s.pay, s.count)}%` : "—"}</td>
                </tr>
              );
            })}</tbody>
          </table>
        </div>
      </div>

      <div className="an-grid">
        <div className="card">
          <h2 style={{ marginTop: 0 }}>Harta județelor</h2>
          <p className="muted" style={{ marginTop: 0 }}>Cu cât e mai închisă culoarea, cu atât au venit mai mulți. Ține degetul sau mouse-ul pe un județ pentru cifră.</p>
          <div className="ro-grid" role="list" aria-label="Vizitatorii pe județe">
            {Object.entries(JUDETE_GRID).map(([code, [col, row]]) => {
              const v = roByCode.get(code) ?? 0;
              return (
                <div key={code} role="listitem" className="ro-cell" title={`${JUDETE[code]}: ${num(v)} vizitatori`} aria-label={`${JUDETE[code]}: ${num(v)}`}
                  style={{ gridColumn: col + 1, gridRow: row + 1, background: v ? `color-mix(in srgb, var(--viz-1) ${Math.round(15 + (50 * v) / roMax)}%, var(--surface-2))` : undefined }}>
                  <b>{code}</b><small>{v ? num(v) : ""}</small>
                </div>
              );
            })}
          </div>
        </div>
        <div className="card">
          <h2 style={{ marginTop: 0 }}>Județele</h2>
          {roRegions.length ? (
            <div className="an-scroll">
              <table className="an-table">
                <thead><tr><th>Județul</th><th>Vizitatori</th><th>Sesiuni</th><th>Bounce</th><th>Pagina de cont</th></tr></thead>
                <tbody>{roRegions.map((r) => {
                  const s = roSessions.get(r.region!);
                  return <tr key={r.region}><td>{judetName(r.region)}</td><td>{num(r.visitors)}</td><td>{num(s?.count ?? 0)}</td><td>{s ? `${s.bounceRate}%` : "—"}</td><td>{s ? `${pct(s.signup, s.count)}%` : "—"}</td></tr>;
                })}</tbody>
              </table>
            </div>
          ) : <p className="muted">Încă niciun județ: zona se numără de pe 14 noiembrie 2026, de când a fost adăugată.</p>}
        </div>
      </div>

      <div className="an-grid">
        <div className="card">
          <h2 style={{ marginTop: 0 }}>Orașele din România</h2>
          {roCities.length ? <HBars label="Vizitatorii pe orașe din România" total={ro} data={roCities.map((c) => ({ label: c.city!, count: c.visitors }))} />
            : <p className="muted">Încă niciun oraș în această perioadă.</p>}
        </div>
        <div className="card">
          <h2 style={{ marginTop: 0 }}>Orașele din afara țării</h2>
          <p className="muted" style={{ marginTop: 0 }}>Unde sunt românii plecați care caută neamul.</p>
          {abroadCities.length ? <HBars label="Vizitatorii pe orașe din afara țării" total={abroad} data={abroadCities.map((c) => ({ label: `${flagOf(c.country)} ${c.city}, ${countryName(c.country)}`, count: c.visitors }))} />
            : <p className="muted">Încă niciun oraș din afara țării în această perioadă.</p>}
          {otherRegions.length > 0 && (
            <details style={{ marginTop: 10 }}>
              <summary>Regiunile din alte țări</summary>
              <HBars label="Regiunile din alte țări" total={abroad} data={otherRegions.map((r) => ({ label: `${flagOf(r.country)} ${countryName(r.country)} · ${r.region}`, count: r.visitors }))} />
            </details>
          )}
        </div>
      </div>
      <p className="muted" style={{ fontSize: 13, margin: 0 }}>
        Locul vine de la Vercel, după adresa IP, și e aproximativ (uneori arată orașul furnizorului de internet, nu satul). Păstrăm doar numele țării,
        județului și orașului, niciodată IP-ul. Județele și orașele se numără de pe 14 noiembrie 2026; țările, de la începutul analizei.
      </p>
    </>
  );
}
