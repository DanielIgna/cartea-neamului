import Link from "next/link";
import { db } from "@/db";
import { requireAdmin } from "@/lib/admin-access";
import { AdminNav } from "@/components/admin/ui";
import { batchList, cardLog, giftCardsEnabled, partnerList, partnerReport, pl, STATUS_LABEL, type CardStatus } from "@/lib/carduri-cadou";
import { cardAction, createBatchAction, toggleGiftCards } from "@/app/carduri-actions";

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
  const [on, partners, batches, report, log] = await Promise.all([giftCardsEnabled(db), partnerList(db), batchList(db), partnerReport(db), cardLog(db, 40)]);
  const total = report.reduce((a, r) => ({ vandute: a.vandute + r.vandute, activate: a.activate + r.activate, comision: a.comision + r.comisionLei }), { vandute: 0, activate: 0, comision: 0 });
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
          <b>{pl(total.vandute, "card vândut", "carduri vândute")}</b> · <b>{pl(total.activate, "activat", "activate")}</b> · comision datorat în total <b>{lei(total.comision)}</b>
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
                  {partners.filter((p) => p.etapa !== "respins").map((p) => <option key={p.id} value={p.id}>{p.numeMagazin}{p.oras ? ` (${p.oras})` : ""}{p.activ ? "" : " · inactiv"}</option>)}
                </select>
              </label>
              <label>Cantitate<input name="cantitate" type="number" min={1} max={1000} defaultValue={50} required /></label>
              <label>Planul
                <select name="plan" defaultValue="basic"><option value="basic">Basic</option><option value="familie">Familie</option><option value="premium">Premium</option></select>
              </label>
              <label>Durata (luni)<input name="durataLuni" type="number" min={1} max={60} defaultValue={12} /></label>
              <label>Preț de raft (lei)<input name="pretRaftLei" inputMode="decimal" defaultValue="49" /></label>
              <label className="check"><input type="checkbox" name="digital" defaultChecked /> Digital (fără tipar: magazinul trimite cardul pe telefonul clientului)</label>
            </div>
            <div className="actions" style={{ marginTop: 0 }}><button className="btn primary">Generează lotul</button></div>
          </form>
        ) : <p className="muted">Adaugă întâi un partener, în <Link href="/admin/parteneri/nou">City Partners</Link>.</p>}
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
                  <td>{b.digital ? "Digital · " : ""}{PLAN[b.plan] ?? b.plan}<small>{b.durataLuni} luni · {lei(b.pretRaftLei)}</small></td>
                  <td>{b.cantitate}</td>
                  <td><small>{[pl(b.generat, "generat", "generate"), pl(b.livrat, "livrat", "livrate"), pl(b.vandut, "vândut", "vândute"), pl(b.folosit, "folosit", "folosite"), pl(b.anulat, "anulat", "anulate")].join(" · ")}</small></td>
                  <td>
                    <Link className="btn" href={`/admin/carduri/lot/${b.id}`}>Codurile</Link>{" "}
                    <a className="btn" href={`/admin/carduri/lot/${b.id}/csv`}>CSV</a>{" "}
                    {!b.digital && <Link className="btn" href={`/admin/carduri/lot/${b.id}/tipar`}>PDF de tipar</Link>}
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
        <h3 style={{ marginTop: 0 }}>Partenerii</h3>
        <p className="muted" style={{ marginTop: 0 }}>
          Magazinele și firmele, cu datele lor, etapa, PIN-ul paginii lor, kitul de tipar și raportul lunar de plată, sunt în{" "}
          <Link href="/admin/parteneri">City Partners</Link>.
        </p>
        <div className="actions" style={{ marginTop: 0 }}>
          <Link className="btn primary" href="/admin/parteneri">Deschide City Partners</Link>
          <Link className="btn" href="/admin/parteneri/nou">+ Adaugă partener</Link>
        </div>
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
                const bits = [d.carduri ? pl(Number(d.carduri), "card", "carduri") : "", d.via === "magazin" ? "de magazin" : "", d.plan ? `plan ${PLAN[String(d.plan)] ?? d.plan}` : "", d.cantitate ? pl(Number(d.cantitate), "cod", "coduri") : "", d.prelungit ? "prelungire" : ""].filter(Boolean);
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
