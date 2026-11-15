import Link from "next/link";
import { db } from "@/db";
import { requireAdmin } from "@/lib/admin-access";
import { adminInvites, inviteSettings, type Reason } from "@/lib/invitatii";
import { AdminNav, Stat, day, num } from "@/components/admin/ui";
import InviteSettingsForm from "@/components/admin/InviteSettingsForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Invitații · Admin" };

const STATUS: Record<string, string> = { asteapta: "așteaptă dovada", acordat: "zile date", respins: "nu se socotește" };
const REASON: Record<Reason, string> = {
  "acelasi-email": "același email ca al celui care invită", "acelasi-dispozitiv": "același telefon/calculator", "aceeasi-ip": "aceeași adresă IP în aceeași zi",
  "email-temporar": "email de unică folosință", "limita-lunara": "peste limita lunară (doar invitatul a primit)", oprit: "programul era oprit",
};

/**
 * Admin → Invitații (src/lib/invitatii.ts): câte deschideri și conturi au adus legăturile personale, cine a invitat pe cine,
 * top invitatori, zilele date și setările. Conturile venite din invitații apar și în Analiză → Conversii, la sursa „Invitație”.
 */
export default async function AdminInvites() {
  await requireAdmin("/admin/invitatii");
  const [d, s] = await Promise.all([adminInvites(db), inviteSettings(db)]);
  const t = d.totals;
  const share = t.users ? Math.round((100 * t.accounts) / t.users) : 0;
  return (
    <section className="stack">
      <AdminNav active="invitatii" />
      <div className="stats">
        <Stat label="Deschideri ale legăturilor" value={num(t.clicks)} hint={`${num(t.clicksMonth)} luna aceasta`} />
        <Stat label="Conturi venite din invitații" value={num(t.accounts)} hint={`${num(t.accountsMonth)} luna aceasta · ${share}% din toate conturile`} />
        <Stat label="Răsplătite (dovadă primită)" value={num(t.rewarded)} hint={`${num(t.waiting)} așteaptă · ${num(t.rejected)} nu se socotesc`} tone={t.rewarded ? "ok" : undefined} />
        <Stat label="Zile gratuite date" value={num(t.days)} hint="la ambele părți, la un loc" />
        <Stat label="Oameni care au invitat" value={num(t.inviters)} />
        <Stat label="Invitați care au plătit" value={num(t.paid)} />
      </div>
      <p className="muted small">De unde vin conturile, pe canale (WhatsApp, Facebook, SMS…): <Link href="/admin/analiza?t=conversii">Analiză → Conversii</Link>, sursa „Invitație”.</p>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Setări</h2>
        <InviteSettingsForm s={s} />
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Top invitatori</h2>
        {d.top.length === 0 ? <p className="muted">Încă nimeni.</p> : (
          <div className="tbl-wrap"><table className="tbl">
            <thead><tr><th>Om</th><th>Deschideri</th><th>Conturi</th><th>Răsplătite</th><th>Zile câștigate</th><th>Respinse</th></tr></thead>
            <tbody>{d.top.map((r) => (
              <tr key={r.id}><td>{r.name}<br /><span className="muted small">{r.email}</span></td><td>{num(r.clicks)}</td><td>{num(r.accounts)}</td><td>{num(r.rewarded)}</td><td>{num(r.days)}</td><td>{num(r.rejected)}</td></tr>
            ))}</tbody>
          </table></div>
        )}
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Ultimele invitații</h2>
        {d.list.length === 0 ? <p className="muted">Încă niciun cont venit dintr-o invitație.</p> : (
          <div className="tbl-wrap"><table className="tbl">
            <thead><tr><th>Când</th><th>Cine a invitat</th><th>Contul nou</th><th>Prin</th><th>Stare</th><th>Zile</th></tr></thead>
            <tbody>{d.list.map((r) => (
              <tr key={r.referredId}>
                <td>{day(r.at.toISOString(), true)}</td>
                <td>{r.referrer?.name}<br /><span className="muted small">{r.referrer?.email}</span></td>
                <td>{r.referred?.name}<br /><span className="muted small">{r.referred?.email}</span></td>
                <td>{r.via === "arbore" ? "invitație în arbore" : "legătura personală"}</td>
                <td><span className={`pill${r.status === "acordat" ? " ok" : r.status === "respins" ? " warn" : ""}`}>{STATUS[r.status] ?? r.status}</span>
                  {r.reason && <><br /><span className="muted small">{REASON[r.reason as Reason] ?? r.reason}</span></>}</td>
                <td>{r.status === "acordat" ? `${r.daysReferrer} + ${r.daysReferred}` : "—"}</td>
              </tr>
            ))}</tbody>
          </table></div>
        )}
      </div>
    </section>
  );
}
