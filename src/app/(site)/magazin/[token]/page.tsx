import QRCode from "qrcode";
import { db } from "@/db";
import CardShare from "@/components/CardShare";
import {
  CARD_ORIGIN, cardUrl, digitalLeft, giftCardsEnabled, lotLabel, partnerBatches, partnerByToken, partnerCard, pl, recentSoldBy, shareLinks,
} from "@/lib/carduri-cadou";
import { portalStats } from "@/lib/parteneri-crm";
import { portalLogin, portalLogout, portalMarkSold, portalSellDigital, portalSignedIn } from "@/app/carduri-actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Carduri cadou · Partener", robots: { index: false, follow: false } };

const when = (d: Date | null) => d ? new Intl.DateTimeFormat("ro", { dateStyle: "short", timeStyle: "short", timeZone: "Europe/Bucharest" }).format(d) : "";
const lei = (v: number) => `${new Intl.NumberFormat("ro", { maximumFractionDigits: 2 }).format(v)} lei`;
const MSG: Record<string, [string, boolean]> = {
  vandut: ["Cardul e marcat vândut. Clientul îl poate activa de acum.", true],
  nu: ["Codul nu e al acestui magazin, e scris greșit sau a fost deja marcat / anulat.", false],
  pin: ["PIN greșit.", false],
  prea_multe: ["Prea multe încercări într-o oră. Mai încearcă puțin mai târziu.", false],
  plafon: ["Ați ajuns la numărul maxim de carduri digitale pe 24 de ore. Dacă aveți nevoie de mai multe, scrieți-ne și mărim plafonul.", false],
  fara_digitale: ["Nu mai aveți carduri digitale disponibile. Scrieți-ne și vă trimitem un lot nou.", false],
};

/**
 * Pagina unui partener (magazin sau firmă), deschisă cu legătura secretă și PIN-ul:
 * - cardurile digitale se vând și se trimit clientului (sau angajatului) într-un singur pas: WhatsApp, SMS, email sau QR pe ecran;
 * - cardurile tipărite se marchează vândute după lot + număr sau după cod;
 * - cifrele lui: luna asta și de la început, comisionul și conturile aduse prin afiș.
 * Nu vede clienți, conturi sau alte magazine.
 */
export default async function Magazin({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ r?: string; cod?: string; nr?: string; card?: string; via?: string }> }) {
  const { token } = await params;
  const { r, cod, nr, card, via } = await searchParams;
  const p = await partnerByToken(db, token);
  const wrap = (body: React.ReactNode) => <section className="stack" style={{ maxWidth: 600, margin: "0 auto" }}><div className="card">{body}</div></section>;
  if (!p || !p.activ || !p.pinHash || !(await giftCardsEnabled(db))) {
    return wrap(<><h1 style={{ marginTop: 0 }}>Carduri cadou</h1><p>Această pagină nu este disponibilă în acest moment.</p></>);
  }
  const firma = p.tip === "firma";
  const omul = firma ? "angajatul" : "clientul";
  const msg = r ? MSG[r] : null;
  const note = msg && <p className={msg[1] ? "cc-ok" : "err"} role={msg[1] ? "status" : "alert"}>{msg[0]}{cod && msg[1] ? <> <code>{cod}</code></> : nr && msg[1] ? <> Nr. {nr}</> : null}</p>;
  if (!(await portalSignedIn(token, p.pinHash))) {
    return wrap(
      <>
        <h1 style={{ marginTop: 0 }}>{p.numeMagazin}</h1>
        <p>Carduri cadou Cartea Neamului. Scrieți PIN-ul primit de la noi ca să vindeți și să trimiteți carduri.</p>
        {note}
        <form action={portalLogin} className="form">
          <input type="hidden" name="token" value={token} />
          <label>PIN<input name="pin" type="password" inputMode="numeric" pattern="\d{6,10}" required autoComplete="off" /></label>
          <div className="actions"><button className="btn primary">Intră</button></div>
        </form>
      </>,
    );
  }
  const [recent, batches, left, stats] = await Promise.all([recentSoldBy(db, p.id), partnerBatches(db, p.id), digitalLeft(db, p.id), portalStats(db, p.id)]);
  const printed = batches.filter((b) => !b.digital);
  // Ecranul de după vânzare: trimiterea cardului abia vândut (doar un card al acestui partener).
  const sold = card ? await partnerCard(db, p.id, card) : null;
  let share: React.ReactNode = null;
  if (sold?.shareToken) {
    const url = cardUrl(CARD_ORIGIN, sold.shareToken);
    const links = shareLinks(url, sold.durataLuni, sold.pentru);
    const qr = await QRCode.toString(url, { type: "svg", margin: 0, errorCorrectionLevel: "M", color: { dark: "#2a1d17", light: "#fffdf8" } });
    share = (
      <div className="card" style={{ marginBottom: 14 }}>
        <p className="cc-ok" role="status" style={{ marginTop: 0 }}>Card vândut{sold.pentru ? ` pentru ${sold.pentru}` : ""}. Trimiteți-l {firma ? "angajatului" : "clientului"}:</p>
        <CardShare url={url} links={links} qr={qr} auto={via} />
      </div>
    );
  }
  return wrap(
    <>
      <h1 style={{ marginTop: 0 }}>{p.numeMagazin}</h1>
      {share}
      {note}
      <div className="mg-stats">
        <div><b>{stats.luna.vandute}</b><small>vândute luna asta</small></div>
        <div><b>{stats.luna.activate}</b><small>activate luna asta</small></div>
        <div><b>{lei(stats.luna.comision)}</b><small>comision luna asta</small></div>
        <div><b>{stats.total.vandute}</b><small>vândute de la început</small></div>
        {!firma && <div><b>{stats.conturiAduse}</b><small>conturi aduse prin afiș</small></div>}
      </div>

      <h2>{firma ? "Trimite un card unui angajat" : "Vinde un card digital"}</h2>
      {left > 0 ? (
        <form action={portalSellDigital} className="form mg-sell">
          <input type="hidden" name="token" value={token} />
          <p className="muted" style={{ margin: 0 }}>
            Mai aveți {pl(left, "card digital", "carduri digitale")}. Un singur pas: apăsați pe felul în care îl trimiteți, iar cardul se marchează vândut și se deschide mesajul gata scris.
          </p>
          <label>Pentru cine (opțional)<input name="pentru" maxLength={80} placeholder={firma ? "de pildă: Maria" : "de pildă: Mama și tata"} /></label>
          <label>Un mesaj scurt (opțional)<textarea name="mesaj" rows={2} maxLength={400} placeholder={firma ? "de pildă: Mulțumim pentru acest an!" : "de pildă: La mulți ani! Să scriem împreună povestea familiei."} /></label>
          <div className="cs-buttons">
            <button className="btn primary" name="via" value="whatsapp">Vinde și trimite pe WhatsApp</button>
            <button className="btn" name="via" value="sms">… prin SMS</button>
            <button className="btn" name="via" value="email">… pe email</button>
            <button className="btn" name="via" value="qr">… arată QR-ul</button>
          </div>
        </form>
      ) : <p className="muted">Nu aveți carduri digitale disponibile. Scrieți-ne și vă trimitem un lot nou.</p>}

      {printed.length > 0 && (
        <>
          <h2>Carduri tipărite</h2>
          <form action={portalMarkSold} className="form">
            <input type="hidden" name="token" value={token} />
            <p className="muted" style={{ margin: 0 }}>Cu lotul și numărul tipărite jos pe card (de pildă „Lot 3FA2 · Nr. 7”), fără să-l răzuiți:</p>
            <div className="limits-row">
              <label>Lotul
                <select name="batchId" required defaultValue={printed[0].id}>
                  {printed.map((b) => <option key={b.id} value={b.id}>Lot {lotLabel(b.id)} ({pl(b.cantitate, "card", "carduri")}, {when(b.createdAt).split(",")[0]})</option>)}
                </select>
              </label>
              <label>Nr.<input name="seq" type="number" min={1} required inputMode="numeric" /></label>
            </div>
            <div className="actions"><button className="btn primary">Marchează vândut</button></div>
          </form>
          <details>
            <summary>Sau cu codul cardului</summary>
            <form action={portalMarkSold} className="form">
              <input type="hidden" name="token" value={token} />
              <label>Codul cardului<input name="cod" className="cc-code-input" placeholder="XXXX-XXXX-XXXX" required maxLength={20} autoComplete="off" autoCapitalize="characters" spellCheck={false} /></label>
              <div className="actions"><button className="btn">Marchează vândut</button></div>
            </form>
          </details>
        </>
      )}

      <h3>Vândute recent</h3>
      {recent.length ? (
        <ul>
          {recent.map((c) => (
            <li key={c.id}>
              {c.shareToken ? <>Digital{c.pentru ? ` · ${c.pentru}` : ""}</> : <>Lot {lotLabel(c.batchId)} · Nr. {c.seq}</>} · {when(c.soldAt)}{c.status === "folosit" ? " · activat ✓" : ""}
              {c.shareToken && c.status !== "folosit" && <> · <a href={`/magazin/${token}?card=${c.id}`}>retrimite</a></>}
            </li>
          ))}
        </ul>
      ) : <p className="muted">Niciun card vândut încă.</p>}
      <p className="muted"><small>{omul[0].toUpperCase() + omul.slice(1)} activează cardul pe telefon, își face cont și primește abonamentul. Pentru orice problemă, scrieți-ne pe carteaneamului.ro/contact.</small></p>
      <form action={portalLogout}><input type="hidden" name="token" value={token} /><button className="btn">Ieși</button></form>
    </>,
  );
}
