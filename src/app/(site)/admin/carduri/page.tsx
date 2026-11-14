import Link from "next/link";
import { db } from "@/db";
import { requireAdmin } from "@/lib/admin-access";
import { AdminNav } from "@/components/admin/ui";
import { siteOrigin } from "@/lib/site";
import { batchList, cardLog, giftCardsEnabled, partnerList, partnerReport, STATUS_LABEL, type CardStatus } from "@/lib/carduri-cadou";
import { cardAction, createBatchAction, savePartnerAction, setPinAction, toggleGiftCards, togglePartnerAction } from "@/app/carduri-actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Carduri cadou · Admin" };

const when = (d: Date) => new Intl.DateTimeFormat("ro", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Bucharest" }).format(d);
const lei = (v: number) => `${new Intl.NumberFormat("ro", { maximumFractionDigits: 2 }).format(v)} lei`;
const PLAN: Record<string, string> = { basic: "Basic", familie: "Familie", premium: "Premium" };
const ACTION: Record<string, string> = {
  pornit: "Funcția pornită", oprit: "Funcția oprită", partener_nou: "Magazin nou", partener_schimbat: "Magazin schimbat",
  partener_activat: "Magazin activat", partener_dezactivat: "Magazin dezactivat", pin_magazin: "PIN magazin schimbat",
  lot_generat: "Lot generat", livrat: "Livrat magazinului", vandut: "Marcat vândut", activat: "Activat de client", anulat: "Anulat",
};

/**
 * Admin → Carduri cadou (Daniel, 2026-11-14): magazinele partenere, loturile de coduri tipărite pe carduri, marcarea „vândut”
 * (abia atunci codul merge), anularea, raportul cu comisionul și comutatorul general. Vezi src/lib/carduri-cadou.ts.
 */
export default async function AdminCarduri({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireAdmin("/admin/carduri");
  const q = await searchParams;
  const [on, partners, batches, report, log, origin] = await Promise.all([giftCardsEnabled(db), partnerList(db), batchList(db), partnerReport(db), cardLog(db, 40), siteOrigin()]);
  const total = report.reduce((a, r) => ({ vandute: a.vandute + r.vandute, activate: a.activate + r.activate, comision: a.comision + r.comisionLei }), { vandute: 0, activate: 0, comision: 0 });
  const partnerForm = (p?: (typeof partners)[number]) => (
    <form action={savePartnerAction} className="form limits-form" key={p?.id ?? "nou"}>
      {p && <input type="hidden" name="id" value={p.id} />}
      <div className="limits-row">
        <label>Numele magazinului<input name="numeMagazin" defaultValue={p?.numeMagazin} required maxLength={160} /></label>
        <label>Oraș<input name="oras" defaultValue={p?.oras ?? ""} maxLength={120} /></label>
        <label>Adresa<input name="adresa" defaultValue={p?.adresa ?? ""} maxLength={300} /></label>
      </div>
      <div className="limits-row">
        <label>Persoana de contact<input name="persoanaContact" defaultValue={p?.persoanaContact ?? ""} maxLength={160} /></label>
        <label>Telefon<input name="telefon" defaultValue={p?.telefon ?? ""} maxLength={40} /></label>
        <label>Email<input name="email" type="email" defaultValue={p?.email ?? ""} maxLength={200} /></label>
        <label>Comision %<input name="comisionProcent" inputMode="decimal" defaultValue={String(p?.comisionProcent ?? 25)} /></label>
      </div>
      <label>Note<textarea name="note" defaultValue={p?.note ?? ""} rows={2} maxLength={2000} /></label>
      <label className="check"><input type="checkbox" name="activ" defaultChecked={p ? p.activ : true} /> Magazin activ</label>
      <div className="actions" style={{ marginTop: 0 }}><button className="btn primary">{p ? "Salvează" : "Adaugă magazinul"}</button></div>
    </form>
  );
  return (
    <section className="stack">
      <AdminNav active="carduri" />
      {q.eroare && <p className="err" role="alert">{q.eroare}</p>}
      {q.ok && <p className="cc-ok" role="status">{q.ok}</p>}

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Funcția: {on ? <span style={{ color: "var(--ok, #2f7a3a)" }}>Activă</span> : <span className="muted">Inactivă</span>}</h2>
        <p className="muted" style={{ maxWidth: "80ch" }}>
          Cardurile se vând în magazine (librării, cadouri, studiouri foto). Clientul scanează QR-ul sau scrie codul pe{" "}
          <a href="/activeaza" target="_blank">/activeaza</a> și primește planul din lot, fără plată în site. Un cod merge doar după ce e
          marcat <b>vândut</b> (aici sau de magazin, pe pagina lui cu PIN). Cât timp funcția e <b>inactivă</b>, pagina de activare arată un
          mesaj neutru și niciun cod nu merge; magazinele nu pot marca nimic. Plata cu cardul și codurile promoționale nu sunt atinse.
        </p>
        <form action={toggleGiftCards}>
          <input type="hidden" name="on" value={on ? "0" : "1"} />
          <button className={`btn ${on ? "" : "primary"}`}>{on ? "Oprește funcția (Inactiv)" : "Pornește funcția (Activ)"}</button>
        </form>
        <p style={{ marginTop: 12 }}>
          <b>{total.vandute}</b> carduri vândute · <b>{total.activate}</b> activate · comision datorat în total <b>{lei(total.comision)}</b>
        </p>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Raport pe magazine</h3>
        <p className="muted" style={{ marginTop: 0 }}>Vândute = marcate vândute (inclusiv cele deja folosite), fără anulate. Comision = suma prețurilor de raft ale cardurilor vândute × comision%.</p>
        <div className="tbl-wrap">
          <table className="tbl stacked">
            <thead><tr><th>Magazin</th><th>Generate</th><th>Livrate</th><th>Vândute</th><th>Activate</th><th>Anulate</th><th>Încasări raft</th><th>Comision</th></tr></thead>
            <tbody>
              {report.map((r) => (
                <tr key={r.partnerId} style={r.activ ? undefined : { opacity: 0.6 }}>
                  <td>{r.nume}<small>{r.oras ?? ""}{r.activ ? "" : " · inactiv"}</small></td>
                  <td>{r.generate}</td><td>{r.livrate}</td><td>{r.vandute}</td><td>{r.activate}</td><td>{r.anulate}</td>
                  <td>{lei(r.incasariLei)}</td><td>{lei(r.comisionLei)}<small>{r.comisionProcent}%</small></td>
                </tr>
              ))}
              {!report.length && <tr><td colSpan={8} className="muted">Niciun magazin încă.</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="actions"><a className="btn" href="/admin/carduri/raport.csv">Descarcă raportul (CSV)</a></div>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Generează un lot de coduri</h3>
        {partners.length ? (
          <form action={createBatchAction} className="form limits-form">
            <div className="limits-row">
              <label>Magazinul
                <select name="partnerId" required defaultValue={partners.find((p) => p.activ)?.id}>
                  {partners.map((p) => <option key={p.id} value={p.id}>{p.numeMagazin}{p.oras ? ` (${p.oras})` : ""}{p.activ ? "" : " · inactiv"}</option>)}
                </select>
              </label>
              <label>Cantitate<input name="cantitate" type="number" min={1} max={1000} defaultValue={50} required /></label>
              <label>Planul
                <select name="plan" defaultValue="basic"><option value="basic">Basic</option><option value="familie">Familie</option><option value="premium">Premium</option></select>
              </label>
              <label>Durata (luni)<input name="durataLuni" type="number" min={1} max={60} defaultValue={12} /></label>
              <label>Preț de raft (lei)<input name="pretRaftLei" inputMode="decimal" defaultValue="49" /></label>
            </div>
            <div className="actions" style={{ marginTop: 0 }}><button className="btn primary">Generează lotul</button></div>
          </form>
        ) : <p className="muted">Adaugă întâi un magazin, mai jos.</p>}
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Loturile</h3>
        <div className="tbl-wrap">
          <table className="tbl stacked">
            <thead><tr><th>Data</th><th>Magazin</th><th>Plan</th><th>Carduri</th><th>Stare</th><th></th></tr></thead>
            <tbody>
              {batches.map((b) => (
                <tr key={b.id}>
                  <td>{when(b.createdAt)}</td>
                  <td>{b.partner}</td>
                  <td>{PLAN[b.plan] ?? b.plan}<small>{b.durataLuni} luni · {lei(b.pretRaftLei)}</small></td>
                  <td>{b.cantitate}</td>
                  <td><small>generate {b.generat} · livrate {b.livrat} · vândute {b.vandut} · folosite {b.folosit} · anulate {b.anulat}</small></td>
                  <td>
                    <Link className="btn" href={`/admin/carduri/lot/${b.id}`}>Codurile</Link>{" "}
                    <a className="btn" href={`/admin/carduri/lot/${b.id}/csv`}>CSV</a>{" "}
                    <Link className="btn" href={`/admin/carduri/lot/${b.id}/tipar`}>PDF de tipar</Link>
                  </td>
                </tr>
              ))}
              {!batches.length && <tr><td colSpan={6} className="muted">Niciun lot încă.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Marchează sau anulează un cod</h3>
        <p className="muted" style={{ marginTop: 0 }}>Scrie codul de pe card. Pentru un lot întreg sau un interval, deschide lotul („Codurile”).</p>
        <form action={cardAction} className="form limits-form">
          <input type="hidden" name="back" value="/admin/carduri" />
          <div className="limits-row">
            <label>Codul<input name="cod" placeholder="XXXX-XXXX-XXXX" required maxLength={20} autoComplete="off" style={{ fontFamily: "monospace", textTransform: "uppercase" }} /></label>
          </div>
          <div className="actions" style={{ marginTop: 0 }}>
            <button className="btn primary" name="what" value="vandut">Marchează vândut</button>
            <button className="btn" name="what" value="anulat">Anulează</button>
          </div>
        </form>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Magazinele partenere</h3>
        {partners.map((p) => (
          <details key={p.id} className="card" style={{ marginBottom: 10 }}>
            <summary><b>{p.numeMagazin}</b> {p.oras ? `· ${p.oras}` : ""} · comision {p.comisionProcent}% · {p.activ ? "activ" : <span className="muted">inactiv</span>}</summary>
            {partnerForm(p)}
            <form action={togglePartnerAction} style={{ display: "inline" }}>
              <input type="hidden" name="id" value={p.id} /><input type="hidden" name="activ" value={p.activ ? "0" : "1"} />
              <button className="btn">{p.activ ? "Dezactivează magazinul" : "Activează magazinul"}</button>
            </form>
            <h4>Pagina magazinului (opțional)</h4>
            <p className="muted" style={{ marginTop: 0 }}>
              Magazinul își marchează singur cardurile vândute, cu un PIN. Vede doar cardurile lui și nu vede alte date.
              {p.portalToken ? <> Legătura: <code style={{ wordBreak: "break-all" }}>{`${origin}/magazin/${p.portalToken}`}</code></> : " Legătura apare după ce pui un PIN."}
            </p>
            <form action={setPinAction} className="form limits-form">
              <input type="hidden" name="id" value={p.id} />
              <div className="limits-row">
                <label>{p.pinHash ? "PIN nou (6–10 cifre)" : "PIN (6–10 cifre)"}<input name="pin" inputMode="numeric" pattern="\d{6,10}" required autoComplete="off" /></label>
              </div>
              <div className="actions" style={{ marginTop: 0 }}><button className="btn">{p.pinHash ? "Schimbă PIN-ul" : "Pune PIN-ul"}</button></div>
            </form>
          </details>
        ))}
        <h4>Adaugă un magazin</h4>
        {partnerForm()}
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Jurnal</h3>
        <p className="muted" style={{ marginTop: 0 }}>Generări, livrări, vânzări, activări și anulări (ultimele 40).</p>
        <div className="tbl-wrap">
          <table className="tbl stacked">
            <thead><tr><th>Când</th><th>Ce</th><th>Cod / lot / magazin</th><th>Detalii</th></tr></thead>
            <tbody>
              {log.map((l, i) => {
                const d = (l.diff ?? {}) as Record<string, unknown>;
                const bits = [d.carduri ? `${d.carduri} carduri` : "", d.via === "magazin" ? "de magazin" : "", d.plan ? `plan ${PLAN[String(d.plan)] ?? d.plan}` : "", d.cantitate ? `${d.cantitate} coduri` : "", d.prelungit ? "prelungire" : ""].filter(Boolean);
                return (
                  <tr key={i}>
                    <td>{when(l.at)}</td><td>{ACTION[l.action] ?? l.action}</td>
                    <td><code style={{ fontSize: 12 }}>{l.entityId.length > 20 ? `${l.entityId.slice(0, 8)}…` : l.entityId}</code></td>
                    <td><small>{bits.join(" · ")}</small></td>
                  </tr>
                );
              })}
              {!log.length && <tr><td colSpan={4} className="muted">Nimic încă.</td></tr>}
            </tbody>
          </table>
        </div>
        <p className="muted"><small>Stări: {(Object.keys(STATUS_LABEL) as CardStatus[]).map((s) => STATUS_LABEL[s]).join(" → ")}</small></p>
      </div>
    </section>
  );
}
