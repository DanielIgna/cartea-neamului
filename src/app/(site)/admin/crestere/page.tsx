import Link from "next/link";
import { db } from "@/db";
import { requireAdmin } from "@/lib/admin-access";
import { automationSwitches } from "@/lib/autonomie";
import { GROWTH_LABELS, NEWS_STEPS, growthDashboard, growthSettings, type GrowthSettings } from "@/lib/crestere";
import { toggleGrowth } from "@/app/crestere-actions";
import { AdminNav, Stat, num } from "@/components/admin/ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "Creștere și recomandări · Admin" };

const CAMPAIGN: Record<string, string> = { invitatie: "Invitații de la rude", "card-nume": "Carduri de nume", "card-localitate": "Carduri de localitate", "bun-venit": "Sfaturi pe email", calendar: "Calendarul de conținut" };
const STEP: Record<string, string> = { e1: "Ziua 1 · primii 3 pași", e2: "Ziua 2 · cheamă o rudă", e3: "Ziua 4 · glasul bunicilor", e4: "Ziua 10 · cartea și planurile", e5: "Ziua 21 · ce ai aflat / darul" };

/**
 * Admin → Creștere și recomandări: motorul fără reclame. Rudele aduse (invitații, zilele în plus), darurile, acordurile pentru
 * sfaturile pe email și vizitele aduse de distribuiri (din Analiză), plus comutatoarele creșterii. Vezi src/lib/crestere.ts.
 */
export default async function Crestere() {
  await requireAdmin("/admin/crestere");
  const [d, g, sw] = await Promise.all([growthDashboard(db), growthSettings(db), automationSwitches(db)]);
  const accRate = d.invitations.all ? Math.round((100 * d.invitations.accepted) / d.invitations.all) : 0;
  return (
    <section className="stack">
      <AdminNav active="crestere" />
      <div className="stats">
        <Stat label="Invitații făcute (30 z)" value={num(d.invitations.last30)} hint={`${num(d.invitations.all)} în total`} />
        <Stat label="Rude intrate (30 z)" value={num(d.invitations.accepted30)} hint={`${accRate}% din toate invitațiile au fost primite`} />
        <Stat label="Conturi noi venite prin rude" value={`${d.viralShare}%`} hint={`${num(d.users.last30)} conturi noi în 30 de zile · ținta 50%`} tone={d.viralShare >= 50 ? "ok" : d.viralShare >= 20 ? "warn" : "bad"} />
        <Stat label="Rude aduse de un om care invită" value={String(d.perInviter).replace(".", ",")} hint={`${num(d.invitations.inviters)} oameni au invitat pe cineva`} />
        <Stat label="Rude care și-au plătit anul" value={num(d.referrals.all)} hint={`${num(d.referrals.days)} zile în plus date celor care le-au adus`} />
        <Stat label="Ani dăruiți" value={num(d.gifts.all)} hint={`${num(d.gifts.used)} primiți`} />
        <Stat label="„Da” la sfaturi pe email" value={num(d.news.yes)} hint={`${num(d.news.no)} au spus „Nu”`} />
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Comutatoarele creșterii</h2>
        <ul className="plain" style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {(Object.keys(GROWTH_LABELS) as (keyof GrowthSettings)[]).map((k) => (
            <li key={k} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "10px 0", borderTop: "1px solid var(--line, #e6dccf)" }}>
              <form action={toggleGrowth}>
                <input type="hidden" name="key" value={k} />
                <input type="hidden" name="on" value={g[k] ? "0" : "1"} />
                <button className={`switch${g[k] ? " on" : ""}`} role="switch" aria-checked={g[k]} aria-label={GROWTH_LABELS[k].label}><span className="switch-knob" aria-hidden /></button>
              </form>
              <div><b>{GROWTH_LABELS[k].label}</b> <span className={`pill ${g[k] ? "ok" : "warn"}`}>{g[k] ? "pornit" : "oprit"}</span><br /><span className="muted small">{GROWTH_LABELS[k].what}</span></div>
            </li>
          ))}
          <li style={{ display: "flex", gap: 12, padding: "10px 0", borderTop: "1px solid var(--line, #e6dccf)" }}>
            <div><b>Emailurile de bun venit</b> <span className={`pill ${sw["bun-venit"] ? "ok" : "warn"}`}>{sw["bun-venit"] ? "pornite" : "oprite"}</span><br />
              <span className="muted small">Se pornesc din <Link href="/admin/autonomie#automatizari">Autonomie</Link> („Email: sfaturi de bun venit”), după ce citești textele. Pleacă doar celor care au spus „Da”.</span></div>
          </li>
        </ul>
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Sfaturile pe email trimise</h2>
        <div className="tbl-wrap"><table className="tbl">
          <thead><tr><th>Email</th><th>Trimise</th></tr></thead>
          <tbody>{NEWS_STEPS.map((s) => <tr key={s.key}><td>{STEP[s.key]}</td><td>{num(d.news.sent[s.key] ?? 0)}</td></tr>)}</tbody>
        </table></div>
        <p className="muted small" style={{ marginBottom: 0 }}>Textele sunt în src/i18n/messages/crestere (9 limbi). Fiecare email se sare dacă omul a făcut deja pasul (a invitat, a înregistrat un glas, a plătit).</p>
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Vizite aduse de distribuiri (30 de zile)</h2>
        {d.campaigns.length ? (
          <div className="tbl-wrap"><table className="tbl">
            <thead><tr><th>Campanie</th><th>Sursa</th><th>Vizitatori</th><th>Pagini</th></tr></thead>
            <tbody>{d.campaigns.map((c) => <tr key={`${c.campaign}-${c.source}`}><td>{CAMPAIGN[c.campaign] ?? c.campaign}</td><td>{c.source}</td><td>{num(c.visitors)}</td><td>{num(c.views)}</td></tr>)}</tbody>
          </table></div>
        ) : <p className="muted">Încă nicio vizită din linkurile distribuite. Apar aici după primele trimiteri pe WhatsApp sau Facebook.</p>}
        <p className="muted small" style={{ marginBottom: 0 }}>Numărate anonim, ca toată <Link href="/admin/analiza?t=campanii">Analiza</Link>: nu se leagă de nicio adresă de email.</p>
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Cine aduce cele mai multe rude</h2>
        {d.top.length ? (
          <div className="tbl-wrap"><table className="tbl">
            <thead><tr><th>Om</th><th>Invitații</th><th>Primite</th><th>Rude care au plătit</th></tr></thead>
            <tbody>{d.top.map((t, i) => <tr key={i}><td>{t.name}</td><td>{num(t.made)}</td><td>{num(t.accepted)}</td><td>{num(t.bonus)}</td></tr>)}</tbody>
          </table></div>
        ) : <p className="muted">Nimeni n-a invitat încă pe cineva.</p>}
        <p className="muted small" style={{ marginBottom: 0 }}>Doar ce se întâmplă în cont (invitații făcute și primite), cum scrie în Politica de confidențialitate. Un mulțumesc personal celor din capul listei aduce de obicei încă câteva rude.</p>
      </div>

      {d.weeks.length > 0 && (
        <div className="card">
          <h2 style={{ marginTop: 0 }}>Invitațiile pe săptămâni</h2>
          <div className="tbl-wrap"><table className="tbl">
            <thead><tr><th>Săptămâna din</th><th>Făcute</th><th>Primite</th></tr></thead>
            <tbody>{d.weeks.map((w) => <tr key={w.week}><td>{w.week}</td><td>{num(w.made)}</td><td>{num(w.accepted)}</td></tr>)}</tbody>
          </table></div>
        </div>
      )}
    </section>
  );
}
