import Link from "next/link";
import { db } from "@/db";
import { requireAdmin } from "@/lib/admin-access";
import { ASSUMED, STATUS_LABEL, businessHealth, healthHistory, saveHealthDay } from "@/lib/sanatate-afacere";
import { addRecommendationAction, recomputeHealthNow } from "@/app/crestere-actions";
import type { Action } from "@/lib/sanatate-afacere";
import { AdminNav, HBars, num } from "@/components/admin/ui";
import Ring from "@/components/admin/Ring";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sănătatea afacerii · Admin" };

const tone = (s: string) => (s === "sanatos" ? "ok" : s === "atentie" ? "warn" : "bad");
const pctx = (v: number) => `${Math.round(v * 1000) / 10}%`;

/** Un pas recomandat, cu „+ în jurnal” (Învățare și conversii), ca să i se măsoare efectul după ce îl faci. */
function Step({ a, domain }: { a: Action; domain: string }) {
  return (
    <li>
      {a.href ? <Link href={a.href}>{a.text}</Link> : a.text}{a.points > 0 && <b className="t-ok"> +{a.points} p</b>}{" "}
      <form action={addRecommendationAction} style={{ display: "inline" }}>
        <input type="hidden" name="text" value={a.text} /><input type="hidden" name="source" value={`Sănătatea afacerii · ${domain}`} />
        {a.href && <input type="hidden" name="href" value={a.href} />}
        <button className="linkish small" title="Adaugă în Jurnalul recomandărilor, ca să-i vezi efectul">+ în jurnal</button>
      </form>
    </li>
  );
}

/**
 * Admin → Sănătatea afacerii: scorul general și câte un scor pe departament, fiecare cu formula lui pe datele din baza de date.
 * Tendința vine din istoricul zilnic (bucla de autonomie sau „Recalculează”). Vezi src/lib/sanatate-afacere.ts.
 */
export default async function Sanatate() {
  await requireAdmin("/admin/sanatate");
  const [h, hist] = await Promise.all([businessHealth(db), healthHistory(db)]);
  const today = new Date().toISOString().slice(0, 10);
  if (!hist[today]) await saveHealthDay(db, h).catch(() => undefined);
  const days = Object.keys(hist).filter((d) => d < today).sort();
  const prev = days.length ? hist[days[days.length - 1]] : null;
  const delta = (key: string, cur: number) => {
    const p = key === "_" ? prev?.overall : prev?.d[key];
    if (p == null) return <span className="muted small">tendința apare din a doua zi</span>;
    const d = cur - p;
    return <span className={`trend ${d > 0 ? "up" : d < 0 ? "down" : ""}`}>{d > 0 ? `▲ +${d}` : d < 0 ? `▼ ${d}` : "= 0"} față de {days[days.length - 1]}</span>;
  };
  const alerts = h.domains.filter((d) => d.status === "critic").sort((a, b) => a.score - b.score);
  const g = h.goal;
  return (
    <section className="stack">
      <AdminNav active="sanatate" />
      <div className="card">
        <div style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
          <Ring score={h.overall} size={110} />
          <div style={{ flex: 1, minWidth: 240 }}>
            <span className={`pill ${tone(h.status)}`}>{STATUS_LABEL[h.status]}</span>
            <h2 style={{ margin: "6px 0" }}>Scorul general: media celor {h.domains.length} departamente</h2>
            <p className="muted" style={{ margin: 0 }}>Fiecare scor e o formulă pe datele din baza de date, scrisă sub el. Verde de la 80, galben de la 50, roșu sub 50. {delta("_", h.overall)}</p>
          </div>
          <form action={recomputeHealthNow}><button className="btn">↻ Recalculează</button></form>
        </div>
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Ținta: {num(g.paidPerMonth)} de abonamente noi pe lună</h2>
        <p style={{ maxWidth: "80ch" }}>Basic costă <b>{g.price} lei pe an</b>, deci ținta înseamnă <b>{num(g.revenueMonth)} lei pe lună</b> în medie ({num(g.revenueYear)} lei pe an).
          Ca să vină {num(g.paidPerMonth)} de plătitori pe lună trebuie ~<b>{num(g.accountsNeeded)} de conturi noi</b> și ~<b>{num(g.visitsNeeded)} de vizite</b> pe lună.</p>
        <p className="muted small" style={{ marginBottom: 0 }}>
          Conversia probă → plată: <b>{pctx(g.conv)}</b> {g.realConv ? "(calculat din date)" : `(ipoteză: ${pctx(ASSUMED.trialToPaid)}, până avem 30 de conturi trecute de zilele gratuite)`} ·
          vizită → cont: <b>{pctx(g.signup)}</b> {g.realSignup ? "(calculat din date)" : `(ipoteză: ${pctx(ASSUMED.visitToAccount)}, până la 1000 de vizite pe lună)`}.
          Acum: {g.payers30} plătitori și {num(g.lei30)} lei în ultimele 30 de zile. Planul întreg: <Link href="/admin/cunostinte?q=reclame">Clienți fără reclame plătite</Link>.
        </p>
      </div>

      {alerts.length > 0 && (
        <div className="card" style={{ borderColor: "var(--bad, #b8432f)" }}>
          <h2 style={{ marginTop: 0 }}>⚠ Sub pragul de sănătate</h2>
          {alerts.map((d) => (
            <div key={d.key} style={{ marginBottom: 16 }}>
              <h3 style={{ margin: "0 0 4px" }}>{d.label} <span className="pill bad">critic · {d.score}</span></h3>
              <p style={{ margin: "2px 0" }}><span className="muted">Cauza:</span> {d.cause}</p>
              <p style={{ margin: "2px 0" }}><span className="muted">Impact:</span> {d.impact}</p>
              <ol style={{ margin: "6px 0 0" }}>
                {d.actions.map((a) => <Step key={a.text} a={a} domain={d.label} />)}
              </ol>
            </div>
          ))}
        </div>
      )}

      <div className="health-grid" style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 320px), 1fr))" }}>
        {h.domains.map((d) => (
          <details key={d.key} className="card" style={{ margin: 0 }}>
            <summary style={{ display: "flex", gap: 14, alignItems: "center", cursor: "pointer", listStyle: "none" }}>
              <Ring score={d.score} size={72} />
              <div style={{ flex: 1 }}>
                <b>{d.label}</b><br />
                <span className={`pill ${tone(d.status)}`}>{STATUS_LABEL[d.status]}</span>{" "}
                <span className="muted small">{d.confidence === "mare" ? "calculat din date" : "ipoteză (puține date)"}</span><br />
                {delta(d.key, d.score)}
              </div>
            </summary>
            <p className="small" style={{ marginBottom: 4 }}><b>Acum:</b> {d.value}</p>
            <p className="small muted" style={{ margin: "4px 0" }}><b>Formula:</b> {d.formula}</p>
            <p className="small" style={{ margin: "4px 0" }}><b>Cauza:</b> {d.cause}</p>
            <p className="small" style={{ margin: "4px 0" }}><b>Impact:</b> {d.impact}</p>
            {d.actions.length > 0 && <ol className="small" style={{ margin: "6px 0 0" }}>
              {d.actions.map((a) => <Step key={a.text} a={a} domain={d.label} />)}
            </ol>}
          </details>
        ))}
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>De unde vin oamenii (30 de zile, fără reclame)</h2>
        <HBars data={h.channels.map((c) => ({ label: c.label, count: c.value }))} total={Math.max(1, h.allVisits)} label="Vizite pe canal" />
        <p className="muted small" style={{ marginBottom: 0 }}>Vizite numărate anonim (un vizitator pe zi), din Admin → Analiză. Detaliile pe sursă și campanie: <Link href="/admin/analiza?t=campanii">Surse și campanii</Link>.</p>
      </div>
    </section>
  );
}
