import { db } from "@/db";
import { requireAdmin } from "@/lib/admin-access";
import { securityOverview } from "@/lib/admin-securitate";
import { KIND_LABEL, LIMITS, type SecurityKind } from "@/lib/securitate";
import { reminderMailReady } from "@/lib/extra";
import { turnstileSiteKey } from "@/lib/auth";
import { AdminNav, Status, ago, day, num } from "@/components/admin/ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "Securitate · Admin" };

const SHOWN: SecurityKind[] = ["parola_gresita", "intrare_blocata", "cod_gresit", "cod_rezerva", "dispozitiv_nou", "2pasi_pornit", "2pasi_oprit",
  "plata_semnatura", "plata_disputa", "plata_frauda"];

/**
 * Admin → Securitate (Daniel, 2026-11-13): ce trebuie verificat (încercări de ghicit parole, ștergeri multe, plăți ciudate),
 * numerele pe 24 h și 7 zile, jurnalul ultimelor 100 de întâmplări și ce pază e pornită.
 */
export default async function AdminSecurity() {
  await requireAdmin("/admin/securitate");
  const o = await securityOverview(db);
  return (
    <section className="stack">
      <AdminNav active="securitate" />
      <div className="card">
        <h2 style={{ marginTop: 0 }}>De verificat</h2>
        {o.alerts.length === 0
          ? <p style={{ marginBottom: 0 }}><Status ok>Nimic ciudat în ultimele 24 de ore.</Status></p>
          : <ul style={{ paddingLeft: 18, marginBottom: 0 }}>{o.alerts.map((a, i) => (
            <li key={i}><Status ok={false} warn={a.level === "warn"}>{a.level === "bad" ? "atenție" : "de urmărit"}</Status> {a.text}{a.who ? <> · <code>{a.who}</code></> : null}</li>
          ))}</ul>}
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>În cifre</h2>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>Ce</th><th>24 de ore</th><th>7 zile</th></tr></thead>
            <tbody>
              {SHOWN.map((k) => <tr key={k}><td>{KIND_LABEL[k]}</td><td>{num(o.day[k] ?? 0)}</td><td>{num(o.week[k] ?? 0)}</td></tr>)}
              <tr><td>Intrări reușite</td><td>{num(o.day.intrare ?? 0)}</td><td>{num(o.week.intrare ?? 0)}</td></tr>
            </tbody>
          </table>
        </div>
        <p className="muted" style={{ marginBottom: 0 }}>Conturi cu verificarea în 2 pași pornită: <b>{num(o.twoStep)}</b> (e la alegerea fiecăruia; pentru panoul de admin e cerută).</p>
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Ce pază e pornită</h2>
        <ul style={{ paddingLeft: 18, marginBottom: 0 }}>
          <li><Status ok>pornit</Status> După {LIMITS.perEmail} parole greșite pe un email (sau {LIMITS.perIp} de la aceeași adresă), intrarea se oprește {LIMITS.windowMin} minute. La pasul 2: după {LIMITS.codesPerIp} coduri greșite.</li>
          <li><Status ok>pornit</Status> Verificarea în 2 pași, la alegerea fiecăruia, din „Siguranța contului” (/securitate).</li>
          <li>{reminderMailReady() ? <Status ok>pornit</Status> : <Status ok={false} warn>așteaptă Resend</Status>} Email când cineva intră de pe un dispozitiv nou și când se oprește verificarea în 2 pași.</li>
          <li>{turnstileSiteKey() ? <Status ok>pornit</Status> : <Status ok={false} warn>neconfigurat (opțional)</Status>} „Nu sunt robot” (Cloudflare Turnstile, gratuit) la contul nou: cheile NEXT_PUBLIC_TURNSTILE_SITE_KEY și TURNSTILE_SECRET_KEY în Vercel.</li>
          <li><Status ok>la Stripe</Status> Stripe Radar oprește singur plățile cu carduri furate (gratuit). Ca să apară aici și contestările, în Stripe → Webhooks adaugi și evenimentele <code>charge.dispute.created</code> și <code>radar.early_fraud_warning.created</code>.</li>
        </ul>
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Jurnal (ultimele 100, fără intrările obișnuite)</h2>
        <p className="muted">Se păstrează 90 de zile. Orașul e aproximativ, după adresa IP.</p>
        {o.recent.length === 0 ? <p className="muted" style={{ marginBottom: 0 }}>Încă nimic.</p> : (
          <div className="tbl-wrap">
            <table className="tbl stacked">
              <thead><tr><th>Când</th><th>Ce</th><th>Cine</th><th>De unde</th></tr></thead>
              <tbody>
                {o.recent.map((r, i) => (
                  <tr key={i}>
                    <td title={day(r.at.toISOString(), true)}>{ago(r.at.toISOString())}</td>
                    <td>{KIND_LABEL[r.kind as SecurityKind] ?? r.kind}{r.detail ? <small className="muted"> · {r.detail}</small> : null}</td>
                    <td>{r.name ?? ""}{r.email ? <small className="muted"> {r.email}</small> : null}</td>
                    <td>{[r.device, r.place].filter(Boolean).join(" · ")}{r.ip ? <small className="muted"> {r.ip}</small> : null}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
