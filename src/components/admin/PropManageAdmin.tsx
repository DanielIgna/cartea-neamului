import { db } from "@/db";
import { batchList, lotLabel, partnerList, pl } from "@/lib/carduri-cadou";
import { inviteCounts, offerEnabled, propmanageConfig, recentInvites } from "@/lib/propmanage-cont";
import { togglePropmanageOffer } from "@/app/propmanage-actions";

const when = (d: Date) => new Intl.DateTimeFormat("ro", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Bucharest" }).format(d);

/**
 * Admin → Carduri cadou, secțiunea „Oferta PropManage”: comutatorul separat (oprit de la sine), dacă PropManage e legat în
 * Vercel și „Conturi PropManage” pe fiecare magazin și pe fiecare lot. O componentă separată, pusă cu o linie în pagina cardurilor.
 */
export default async function PropManageAdmin() {
  const [on, counts, shops, batches, recent] = await Promise.all([offerEnabled(db), inviteCounts(db), partnerList(db), batchList(db), recentInvites(db, 15)]);
  const ready = !!propmanageConfig();
  const shopName = new Map(shops.map((s) => [s.id, s.numeMagazin]));
  return (
    <div className="card" id="propmanage">
      <h3 style={{ marginTop: 0 }}>
        Oferta PropManage: {on ? <span style={{ color: "var(--ok, #2f7a3a)" }}>Pornită</span> : <span className="muted">Oprită</span>}
      </h3>
      <p className="muted" style={{ maxWidth: "80ch" }}>
        După „Gata! Cardul este activat” (și în Datele mele) apare caseta „Cadou de la partenerul nostru PropManage: cont gratuit pentru
        casa ta”, cu o bifă nebifată. Numele și emailul pleacă la PropManage doar dacă omul bifează și apasă „Vreau contul gratuit”.
        Comutatorul e separat de cel al cardurilor. Dacă PropManage nu răspunde, activarea cardului merge normal și caseta dispare.
      </p>
      {!ready && (
        <p className="err" role="alert">
          PropManage nu e legat încă: lipsesc <code>PROPMANAGE_INVITE_URL</code> și/sau <code>PARTNER_SHARED_SECRET</code> în Vercel. Până atunci
          oferta nu apare nicăieri, chiar dacă e pornită.
        </p>
      )}
      <form action={togglePropmanageOffer}>
        <input type="hidden" name="on" value={on ? "0" : "1"} />
        <button className={`btn ${on ? "" : "primary"}`}>{on ? "Oprește oferta PropManage" : "Pornește oferta PropManage"}</button>
      </form>
      <p style={{ marginTop: 12 }}>
        <b>{pl(counts.trimise, "cont PropManage cerut", "conturi PropManage cerute")}</b>
        {counts.faraCard > 0 && <> (din care {counts.faraCard} fără card, din Datele mele)</>}
        {counts.erori > 0 && <> · <span className="err">{pl(counts.erori, "încercare", "încercări")} la care PropManage n-a răspuns</span></>}
      </p>
      <p className="muted"><small>„Conturi PropManage” = oameni care au bifat acordul și au primit linkul de înregistrare. Câți și-au terminat contul și câți au cerut o ofertă se văd în PropManage, la sursa „cartea-neamului”.</small></p>

      <div className="tbl-wrap">
        <table className="tbl">
          <thead><tr><th>Magazin / firmă</th><th>Conturi PropManage</th></tr></thead>
          <tbody>
            {shops.map((s) => <tr key={s.id}><td>{s.numeMagazin}</td><td>{counts.partner.get(s.id) ?? 0}</td></tr>)}
            {!shops.length && <tr><td colSpan={2} className="muted">Niciun magazin încă.</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="tbl-wrap" style={{ marginTop: 12 }}>
        <table className="tbl">
          <thead><tr><th>Lot</th><th>Magazin</th><th>Conturi PropManage</th></tr></thead>
          <tbody>
            {batches.map((b) => <tr key={b.id}><td>{lotLabel(b.id)}</td><td>{b.partner}</td><td>{counts.batch.get(b.id) ?? 0}</td></tr>)}
            {!batches.length && <tr><td colSpan={3} className="muted">Niciun lot încă.</td></tr>}
          </tbody>
        </table>
      </div>
      {recent.length > 0 && (
        <>
          <h4>Ultimele cereri</h4>
          <ul className="muted">
            {recent.map((r, i) => (
              <li key={i}>
                {when(r.at)} · {r.name ?? "cont șters"} · {r.place === "activare" ? "după activare" : "din Datele mele"}
                {r.partnerId ? ` · ${shopName.get(r.partnerId) ?? "magazin"}` : ""} · {r.status === "trimis" ? "trimis" : `n-a mers (${r.error ?? "eroare"})`}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
