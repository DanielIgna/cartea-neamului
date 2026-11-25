import Link from "next/link";
import { db } from "@/db";
import { requireAdmin } from "@/lib/admin-access";
import { AdminNav } from "@/components/admin/ui";
import {
  CODE_STATUSES, MAX_LOT, STATUS_LABEL, activareUrl, countCodes, isCodeStatus, listCodes, normalizeActivationCode, normalizeSource, sourceSummary,
  type CodeFilter,
} from "@/lib/coduri-activare";
import { cancelCodesAction, generateLotAction } from "@/app/coduri-activare-actions";
import { probaResult } from "@/lib/coduri-activare-proba";

export const dynamic = "force-dynamic";
export const metadata = { title: "Coduri de activare · Admin" };

const PAGE = 200;
const PLAN: Record<string, string> = { basic: "Basic", familie: "Familie", premium: "Premium" };
const when = (d: Date | null) => d ? new Intl.DateTimeFormat("ro", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Bucharest" }).format(d) : "–";

/**
 * Admin → Coduri de activare (Daniel, 25.11.2026): codurile pentru cardurile cadou vândute pe Trendyol și alte platforme.
 * Generare lot (plan, bucăți, sursă), listă cu filtre după status, sursă și lot, export CSV (cod + link de activare), anulare.
 * Vezi src/lib/coduri-activare.ts. Cardurile din magazine rămân în Admin → Carduri cadou.
 */
export default async function AdminCoduriActivare({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireAdmin("/admin/coduri-activare");
  const q = await searchParams;
  const f: CodeFilter = {
    status: isCodeStatus(q.status) ? q.status : null,
    sursa: normalizeSource(q.sursa ?? ""),
    lot: q.lot && /^[a-z0-9-]{1,80}$/i.test(q.lot) ? q.lot : null,
    cod: normalizeActivationCode(q.cod ?? ""),
  };
  const page = Math.max(0, Math.floor(Number(q.pagina) || 0));
  const [summary, rows, total, proba] = await Promise.all([sourceSummary(db), listCodes(db, f, PAGE, page * PAGE), countCodes(db, f), probaResult(db)]);
  const qs = (extra: Record<string, string | number | null | undefined> = {}) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries({ status: f.status, sursa: f.sursa, lot: f.lot, cod: f.cod, ...extra })) if (v != null && v !== "") p.set(k, String(v));
    const s = p.toString();
    return s ? `?${s}` : "";
  };
  const exportHref = `/admin/coduri-activare/export.csv${qs()}`;
  const tot = summary.reduce((a, s) => ({ n: a.n + s.nefolosit, f: a.f + s.folosit, a: a.a + s.anulat }), { n: 0, f: 0, a: 0 });

  return (
    <section className="stack">
      <AdminNav active="coduri-activare" />
      {q.eroare && <p className="err" role="alert">{q.eroare}</p>}
      {q.ok && <p className="cc-ok" role="status">{q.ok}</p>}

      <div className="card">
        <p className="muted" style={{ marginTop: 0, maxWidth: "80ch" }}>
          Coduri pentru cardurile cadou vândute pe alte platforme (Trendyol…). Clientul scanează QR-ul sau scrie codul pe{" "}
          <a href="/activare" target="_blank">/activare</a> și primește planul codului pe 12 luni, fără plată și fără card. Un cod merge de
          cum e generat și se folosește o singură dată. Cine are un abonament care se reînnoiește singur e rugat să oprească întâi
          reînnoirea, ca să nu plătească de două ori. Cardurile din magazine rămân în <Link href="/admin/carduri">Carduri cadou</Link>.
        </p>
        <p style={{ marginBottom: 0 }}><b>{tot.n}</b> nefolosite · <b>{tot.f}</b> folosite · <b>{tot.a}</b> anulate</p>
      </div>


      {proba && (
        <div className="card" id="proba">
          <h3 style={{ marginTop: 0 }}>Proba de la pornire: {proba.ok ? <span style={{ color: "var(--ok, #2f7a3a)" }}>reușită</span> : <span className="err">cu probleme</span>}</h3>
          <p className="muted" style={{ marginTop: 0 }}>
            Făcută o singură dată, pe {when(new Date(proba.at))}: un cod de test pe fiecare plan, activat pe un cont nou de probă, apoi
            încercat din nou (același cont și alt cont). La final codurile de test s-au anulat și cele {proba.conturiSterse} conturi de probă s-au șters.
          </p>
          {proba.eroare && <p className="err">{proba.eroare}</p>}
          <div className="tbl-wrap">
            <table className="tbl stacked">
              <thead><tr><th>Plan</th><th>Cod</th><th>Activare</th><th>Plan primit</th><th>Valabil până</th><th>A doua oară</th><th>Anulat</th></tr></thead>
              <tbody>
                {proba.rows.map((r) => (
                  <tr key={r.cod}>
                    <td data-label="Plan">{PLAN[r.plan]}</td>
                    <td data-label="Cod" style={{ fontFamily: "monospace" }}>{r.cod}</td>
                    <td data-label="Activare">{r.activare === "ok" ? "✓ activat" : r.activare}</td>
                    <td data-label="Plan primit">{r.planOk ? "✓ " : "✗ "}{PLAN[r.planPrimit ?? ""] ?? "–"}</td>
                    <td data-label="Valabil până">{r.dataOk ? "✓ " : "✗ "}{r.valabilPana ? when(new Date(r.valabilPana)) : "–"}</td>
                    <td data-label="A doua oară">{r.aDouaOaraAltCont === "used" ? "✓ „deja folosit”" : r.aDouaOaraAltCont} · același cont: {r.aDouaOaraAcelasiCont === "used_by_you" ? "„ai activat deja”" : r.aDouaOaraAcelasiCont}</td>
                    <td data-label="Anulat">{r.anulat ? "✓" : "✗"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <div className="card">
        <h3 style={{ marginTop: 0 }}>Generează un lot</h3>
        <form action={generateLotAction} className="form limits-form">
          <div className="limits-row">
            <label>Planul
              <select name="plan" defaultValue="familie"><option value="basic">Basic</option><option value="familie">Familie</option><option value="premium">Premium</option></select>
            </label>
            <label>Număr de coduri<input name="cantitate" type="number" min={1} max={MAX_LOT} defaultValue={50} required /></label>
            <label>Sursa<input name="sursa" defaultValue="trendyol" required maxLength={40} /></label>
          </div>
          <p className="muted" style={{ margin: 0 }}><small>Durata e mereu 12 luni. Codurile arată ca CN-FAM-7K4M-Q9XT (fără 0/O, 1/I/L).</small></p>
          <div className="actions" style={{ marginTop: 0 }}><button className="btn primary">Generează</button></div>
        </form>
      </div>

      {summary.length > 0 && (
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Pe surse</h3>
          <div className="tbl-wrap">
            <table className="tbl stacked">
              <thead><tr><th>Sursa</th><th>Nefolosite</th><th>Folosite</th><th>Anulate</th></tr></thead>
              <tbody>
                {summary.map((s) => (
                  <tr key={s.sursa}>
                    <td data-label="Sursa"><Link href={`/admin/coduri-activare?sursa=${encodeURIComponent(s.sursa)}`}>{s.sursa}</Link></td>
                    <td data-label="Nefolosite">{s.nefolosit}</td><td data-label="Folosite">{s.folosit}</td><td data-label="Anulate">{s.anulat}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Coduri</h3>
        <form method="get" className="form limits-form">
          <div className="limits-row">
            <label>Status
              <select name="status" defaultValue={f.status ?? ""}>
                <option value="">Toate</option>
                {CODE_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
              </select>
            </label>
            <label>Sursa
              <select name="sursa" defaultValue={f.sursa ?? ""}>
                <option value="">Toate</option>
                {summary.map((s) => <option key={s.sursa} value={s.sursa}>{s.sursa}</option>)}
              </select>
            </label>
            <label>Lot<input name="lot" defaultValue={f.lot ?? ""} placeholder="trendyol-20261125-…" /></label>
            <label>Cod<input name="cod" defaultValue={f.cod ?? ""} placeholder="CN-FAM-…" style={{ fontFamily: "monospace" }} /></label>
          </div>
          <div className="actions" style={{ marginTop: 0 }}>
            <button className="btn">Filtrează</button>
            <Link className="btn" href="/admin/coduri-activare">Șterge filtrele</Link>
            <a className="btn primary" href={exportHref}>Descarcă CSV ({total})</a>
          </div>
        </form>

        {rows.length ? (
          <form action={cancelCodesAction}>
            {(["status", "sursa", "lot"] as const).map((k) => f[k] ? <input key={k} type="hidden" name={`f_${k}`} value={f[k]!} /> : null)}
            <p className="muted"><small>{total} {total === 1 ? "cod" : "coduri"}{total > PAGE ? `, pagina ${page + 1} din ${Math.ceil(total / PAGE)}` : ""}. Bifează codurile nefolosite pe care vrei să le anulezi.</small></p>
            <div className="tbl-wrap">
              <table className="tbl stacked">
                <thead><tr><th></th><th>Cod</th><th>Plan</th><th>Sursa · lot</th><th>Status</th><th>Creat</th><th>Folosit</th></tr></thead>
                <tbody>
                  {rows.map((c) => (
                    <tr key={c.id}>
                      <td data-label="Anulează">{c.status === "nefolosit" ? <input type="checkbox" name="id" value={c.id} aria-label={`Anulează ${c.cod}`} /> : null}</td>
                      <td data-label="Cod"><a href={activareUrl(c.cod)} target="_blank" rel="noreferrer" style={{ fontFamily: "monospace" }}>{c.cod}</a></td>
                      <td data-label="Plan">{PLAN[c.plan] ?? c.plan} · {c.durataLuni} luni</td>
                      <td data-label="Sursa · lot">{c.sursa}{c.lot ? <><br /><Link href={`/admin/coduri-activare?lot=${encodeURIComponent(c.lot)}`}><small>{c.lot}</small></Link></> : null}</td>
                      <td data-label="Status">{STATUS_LABEL[c.status as keyof typeof STATUS_LABEL] ?? c.status}{c.status === "anulat" && c.cancelledAt ? <><br /><small className="muted">{when(c.cancelledAt)}</small></> : null}</td>
                      <td data-label="Creat">{when(c.createdAt)}</td>
                      <td data-label="Folosit">{c.usedAt ? <>{when(c.usedAt)}<br /><small className="muted">{c.usedBy ?? "cont șters"}</small></> : "–"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="actions">
              <button className="btn">Anulează codurile bifate</button>
              {page > 0 && <Link className="btn" href={`/admin/coduri-activare${qs({ pagina: page - 1 })}`}>← Înapoi</Link>}
              {(page + 1) * PAGE < total && <Link className="btn" href={`/admin/coduri-activare${qs({ pagina: page + 1 })}`}>Mai departe →</Link>}
            </div>
          </form>
        ) : <p className="muted">Niciun cod{f.status || f.sursa || f.lot || f.cod ? " pentru filtrele alese" : " încă"}.</p>}
      </div>
    </section>
  );
}
