import Link from "next/link";
import { db } from "@/db";
import { STEP_LABEL, conversionStats } from "@/lib/conversie";
import { Stat, lei, num } from "@/components/admin/ui";

const pct = (a: number, b: number) => (b ? `${Math.round((100 * a) / b)}%` : "—");
const money = (l: number, e: number) => [l ? lei(l) : "", e ? `${e.toLocaleString("ro-RO")} €` : ""].filter(Boolean).join(" + ") || "—";

/**
 * Din gratuit în plătit (src/lib/conversie.ts), pentru Analiză → Conversii și Admin → Din gratuit în plătit: conturile noi și
 * câte au plătit, fiecare email (trimise, deschise, clicuri, plăți) și codurile de reducere.
 */
export default async function ConversieStats({ from, to, link = true }: { from: string; to: string; link?: boolean }) {
  const d = await conversionStats(db, { from, to });
  const offerMoney = money(d.offers.lei, d.offers.eur);
  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>Din gratuit în plătit</h2>
      <p className="muted" style={{ marginTop: 0 }}>Conturile făcute în perioadă și câte au plătit un an; emailurile din zilele gratuite trimise în perioadă.
        Deschiderile se numără din poza din email (unele programe o blochează, deci sunt mai multe în realitate); o plată se trece la ultimul email pe care omul a apăsat în 7 zile (sau, fără clic, la ultimul primit).
        {link && <> Setări și simulator: <Link href="/admin/conversie">Admin → Din gratuit în plătit</Link>.</>}</p>
      <div className="stats">
        <Stat label="Conturi noi" value={num(d.cohort.accounts)} hint={`${num(d.cohort.mailed)} au primit emailuri`} />
        <Stat label="Au trecut la plătit" value={num(d.cohort.paid)} hint={`rata: ${pct(d.cohort.paid, d.cohort.accounts)}`} tone={d.cohort.paid ? "ok" : undefined} />
        <Stat label="Coduri de reducere" value={num(d.offers.made)} hint={`${num(d.offers.used)} folosite · ${num(d.offers.expired)} expirate`} />
        <Stat label="Venituri din reducere" value={offerMoney} hint={`rata de folosire: ${pct(d.offers.used, d.offers.made)}`} />
        <Stat label="Dezabonați" value={num(d.optOuts)} hint="de la emailurile din zilele gratuite (din totdeauna)" />
      </div>
      <div className="an-scroll">
        <table className="an-table">
          <thead><tr><th>Email</th><th>Trimise</th><th>Deschise</th><th>Rata deschiderii</th><th>Clicuri</th><th>Rata clicului</th><th>Plăți după</th><th>Rata plății</th><th>Bani</th></tr></thead>
          <tbody>{d.steps.map((s) => (
            <tr key={s.step}><td>{STEP_LABEL[s.step]}</td><td>{num(s.sent)}</td><td>{num(s.opened)}</td><td>{pct(s.opened, s.sent)}</td><td>{num(s.clicked)}</td>
              <td>{pct(s.clicked, s.sent)}</td><td>{num(s.paid)}</td><td>{pct(s.paid, s.sent)}</td><td>{money(s.lei, s.eur)}</td></tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}
