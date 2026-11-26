import Link from "next/link";
import { db } from "@/db";
import { rangeOf } from "@/lib/analiza";
import { explainGscError, type GscSnapshot, type SeoSettings } from "@/lib/seo";
import { compareGroups, imageClicks, imageReport, pagesWithImages, perPage, type GroupStats } from "@/lib/seo-imagini";
import { SITE_URL } from "@/lib/site-url";
import { Stat, num } from "@/components/admin/ui";

const pct = (v: number) => `${(v * 100).toLocaleString("ro-RO", { maximumFractionDigits: 1 })}%`;
const pos = (v: number | null) => (v == null ? "—" : v.toLocaleString("ro-RO", { maximumFractionDigits: 1 }));
const diff = (now: number, before: number) => {
  if (!before) return now ? "nou" : "—";
  const d = (now - before) / before;
  return `${d >= 0 ? "▲" : "▼"} ${Math.abs(Math.round(d * 100))}%`;
};

/**
 * Admin → SEO → Imagini (Daniel, 26.11.2026). Testul cinstit: ~10–15 desene pe pagini care au deja afișări, urmărite 3–4 săptămâni.
 * Se uită la Google Imagini, la paginile cu desene față de cele fără și la clicurile pe desene de pe site.
 */
export default async function SeoImagini({ s, gsc, days }: { s: SeoSettings; gsc: GscSnapshot; days: number }) {
  const list = pagesWithImages();
  const rep = await imageReport(s, SITE_URL, days, gsc);
  const { cur } = rangeOf(days <= 7 ? "7z" : days <= 30 ? "30z" : "90z");
  const clicks = await imageClicks(db, cur).catch(() => ({ rows: [], byPage: new Map<string, number>(), total: 0 }));
  const on = rep.state === "legat";
  const cmp = on ? compareGroups(rep.web.cur, rep.web.prev, new Set(list.map((x) => x.path))) : null;
  const pages = perPage(list, rep, clicks.byPage, gsc);
  const files = new Set(list.flatMap((x) => x.images.map((i) => i.src)));
  const err = rep.error ? explainGscError(rep.error) : null;
  const ic = rep.images.cur, ip = rep.images.prev;

  return (
    <div className="stack">
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Imaginile și Google</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          {num(files.size)} desene pe {num(list.length)} pagini. Le măsurăm în trei feluri: ce aduce Google Imagini, cum se descurcă paginile cu desene
          față de celelalte în căutarea obișnuită și câți oameni dau clic pe un desen pe site. Un test cinstit cere 3–4 săptămâni; Google arată datele cu 2–3 zile întârziere.
        </p>
        {!on && (
          <p className="pill warn" style={{ display: "inline-block" }}>
            {rep.state === "fara-cheie" ? "Search Console nu e legat: pune cheia în fila Setări." : rep.state === "fara-acces" ? "Contul de serviciu nu are acces la proprietate." : `${err?.title ?? "Eroare"}: ${err?.fix ?? ""}`}
          </p>
        )}
        <div className="stats" style={{ marginTop: 12 }}>
          <Stat label={`Afișări în Google Imagini (${days} z)`} value={on ? num(ic?.impressions ?? 0) : "—"} hint={on ? `înainte ${num(ip?.impressions ?? 0)} · ${diff(ic?.impressions ?? 0, ip?.impressions ?? 0)}` : undefined} />
          <Stat label={`Clicuri din Google Imagini (${days} z)`} value={on ? num(ic?.clicks ?? 0) : "—"} tone={on && (ic?.clicks ?? 0) > 0 ? "ok" : undefined} hint={on ? `înainte ${num(ip?.clicks ?? 0)}` : undefined} />
          <Stat label={`Clicuri pe desene pe site (${days} z)`} value={num(clicks.total)} hint="anonim, ca butoanele de început; adminii nu se numără" />
          <Stat label="CTR pagini cu desene" value={cmp ? pct(cmp.with.ctr) : "—"} hint={cmp ? `fără desene: ${pct(cmp.without.ctr)}` : undefined} />
        </div>
      </div>

      {cmp && (
        <div className="card">
          <h2 style={{ marginTop: 0 }}>Cu desene față de fără, în căutarea obișnuită</h2>
          <p className="muted" style={{ marginTop: 0 }}>Doar paginile românești văzute în Google în ultimele {days} zile, comparate cu cele {days} zile de dinainte. Locul mediu e ponderat cu afișările.</p>
          <div className="an-scroll">
            <table className="an-table">
              <thead><tr><th>Grupa</th><th>Pagini văzute</th><th>Afișări</th><th>față de înainte</th><th>Clicuri</th><th>față de înainte</th><th>CTR</th><th>CTR înainte</th><th>Loc mediu</th></tr></thead>
              <tbody>
                {([["Cu desene", cmp.with], ["Fără desene", cmp.without]] as [string, GroupStats][]).map(([l, g]) => (
                  <tr key={l}><td>{l}</td><td>{num(g.seen)}</td><td>{num(g.impressions)}</td><td>{diff(g.impressions, g.prevImpressions)}</td><td>{num(g.clicks)}</td><td>{diff(g.clicks, g.prevClicks)}</td><td>{pct(g.ctr)}</td><td>{pct(g.prevCtr)}</td><td>{pos(g.position)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Fiecare pagină cu desene</h2>
        <div className="an-scroll">
          <table className="an-table">
            <thead><tr><th>Pagina</th><th>Desene</th><th>Afișări (web)</th><th>Clicuri (web)</th><th>Loc</th><th>Afișări (Imagini)</th><th>Clicuri (Imagini)</th><th>Clicuri pe desen</th></tr></thead>
            <tbody>
              {pages.map((p) => (
                <tr key={p.path}>
                  <td><Link href={p.path} target="_blank">{p.path}</Link></td>
                  <td>{p.images.map((i) => <div key={i.src}><a href={i.src} target="_blank" rel="noopener">{i.src.replace("/imagini/", "")}</a></div>)}</td>
                  <td>{p.web ? num(p.web.impressions) : "—"}</td><td>{p.web ? num(p.web.clicks) : "—"}</td><td>{p.web ? pos(p.web.position) : "—"}</td>
                  <td>{p.img ? num(p.img.impressions) : "—"}</td><td>{p.img ? num(p.img.clicks) : "—"}</td><td>{num(p.siteClicks)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {on && rep.images.queries.length > 0 && (
        <div className="card">
          <h2 style={{ marginTop: 0 }}>Ce caută oamenii în Google Imagini</h2>
          <div className="an-scroll">
            <table className="an-table">
              <thead><tr><th>Căutarea</th><th>Afișări</th><th>Clicuri</th><th>Loc</th></tr></thead>
              <tbody>{rep.images.queries.slice(0, 50).map((q) => <tr key={q.keys[0]}><td>{q.keys[0]}</td><td>{num(q.impressions)}</td><td>{num(q.clicks)}</td><td>{pos(q.position)}</td></tr>)}</tbody>
            </table>
          </div>
        </div>
      )}

      {clicks.rows.length > 0 && (
        <div className="card">
          <h2 style={{ marginTop: 0 }}>Clicuri pe desene, pe site</h2>
          <p className="muted" style={{ marginTop: 0 }}>Clicul deschide desenul mare. „Din Google” = vizita începuse dintr-o căutare Google.</p>
          <div className="an-scroll">
            <table className="an-table">
              <thead><tr><th>Desenul</th><th>Pagina</th><th>Clicuri</th><th>Din Google</th></tr></thead>
              <tbody>{clicks.rows.map((r) => <tr key={`${r.img}|${r.page}`}><td>{r.img}</td><td>{r.page}</td><td>{num(r.clicks)}</td><td>{num(r.fromGoogle)}</td></tr>)}</tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
