import { db } from "@/db";
import { giftCardsEnabled, lotLabel, partnerBatches, pl, partnerByToken, recentSoldBy } from "@/lib/carduri-cadou";
import { portalLogin, portalLogout, portalMarkSold, portalSignedIn } from "@/app/carduri-actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Carduri cadou · Magazin", robots: { index: false, follow: false } };

const when = (d: Date | null) => d ? new Intl.DateTimeFormat("ro", { dateStyle: "short", timeStyle: "short", timeZone: "Europe/Bucharest" }).format(d) : "";
const MSG: Record<string, [string, boolean]> = {
  vandut: ["Cardul e marcat vândut. Clientul îl poate activa de acum.", true],
  nu: ["Codul nu e al acestui magazin, e scris greșit sau a fost deja marcat / anulat.", false],
  pin: ["PIN greșit.", false],
  prea_multe: ["Prea multe încercări într-o oră. Mai încearcă puțin mai târziu.", false],
};

/**
 * Pagina simplă a unui magazin partener: după PIN, marchează un card ca vândut la casă (abia atunci codul se poate activa).
 * Vede doar cardurile lui vândute recent; nu vede clienți, conturi sau alte magazine.
 */
export default async function Magazin({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ r?: string; cod?: string; nr?: string }> }) {
  const { token } = await params;
  const { r, cod, nr } = await searchParams;
  const p = await partnerByToken(db, token);
  const wrap = (body: React.ReactNode) => <section className="stack" style={{ maxWidth: 560, margin: "0 auto" }}><div className="card">{body}</div></section>;
  if (!p || !p.activ || !p.pinHash || !(await giftCardsEnabled(db))) {
    return wrap(<><h1 style={{ marginTop: 0 }}>Carduri cadou</h1><p>Această pagină nu este disponibilă în acest moment.</p></>);
  }
  const msg = r ? MSG[r] : null;
  const note = msg && <p className={msg[1] ? "cc-ok" : "err"} role={msg[1] ? "status" : "alert"}>{msg[0]}{cod && msg[1] ? <> <code>{cod}</code></> : nr && msg[1] ? <> Nr. {nr}</> : null}</p>;
  if (!(await portalSignedIn(token, p.pinHash))) {
    return wrap(
      <>
        <h1 style={{ marginTop: 0 }}>{p.numeMagazin}</h1>
        <p>Carduri cadou Cartea Neamului. Scrie PIN-ul magazinului ca să marchezi cardurile vândute.</p>
        {note}
        <form action={portalLogin} className="form">
          <input type="hidden" name="token" value={token} />
          <label>PIN<input name="pin" type="password" inputMode="numeric" pattern="\d{6,10}" required autoComplete="off" /></label>
          <div className="actions"><button className="btn primary">Intră</button></div>
        </form>
      </>,
    );
  }
  const [recent, batches] = await Promise.all([recentSoldBy(db, p.id), partnerBatches(db, p.id)]);
  return wrap(
    <>
      <h1 style={{ marginTop: 0 }}>{p.numeMagazin}</h1>
      <p>La fiecare card vândut, marchează-l aici. Un card nemarcat nu se poate activa de client.</p>
      {note}
      {batches.length > 0 && (
        <form action={portalMarkSold} className="form">
          <input type="hidden" name="token" value={token} />
          <p className="muted" style={{ margin: 0 }}>Cu lotul și numărul tipărite jos pe card (de pildă „Lot 3FA2 · Nr. 7”), fără să răzuiești:</p>
          <div className="limits-row">
            <label>Lotul
              <select name="batchId" required defaultValue={batches[0].id}>
                {batches.map((b) => <option key={b.id} value={b.id}>Lot {lotLabel(b.id)} ({pl(b.cantitate, "card", "carduri")}, {when(b.createdAt).split(",")[0]})</option>)}
              </select>
            </label>
            <label>Nr.<input name="seq" type="number" min={1} required inputMode="numeric" /></label>
          </div>
          <div className="actions"><button className="btn primary">Marchează vândut</button></div>
        </form>
      )}
      <details>
        <summary>Sau cu codul cardului</summary>
        <form action={portalMarkSold} className="form">
          <input type="hidden" name="token" value={token} />
          <label>Codul cardului<input name="cod" className="cc-code-input" placeholder="XXXX-XXXX-XXXX" required maxLength={20} autoComplete="off" autoCapitalize="characters" spellCheck={false} /></label>
          <div className="actions"><button className="btn">Marchează vândut</button></div>
        </form>
      </details>
      <h3>Vândute recent</h3>
      {recent.length ? (
        <ul>{recent.map((c) => <li key={c.cod}>Lot {lotLabel(c.batchId)} · Nr. {c.seq} · {when(c.soldAt)}{c.status === "folosit" ? " · activat" : ""}</li>)}</ul>
      ) : <p className="muted">Niciun card marcat încă.</p>}
      <form action={portalLogout}><input type="hidden" name="token" value={token} /><button className="btn">Ieși</button></form>
    </>,
  );
}
