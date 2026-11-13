import { db } from "@/db";
import { requireAdmin } from "@/lib/admin-access";
import { securityOverview } from "@/lib/admin-securitate";
import { KIND_LABEL, LIMITS, type SecurityKind } from "@/lib/securitate";
import { reminderMailReady } from "@/lib/extra";
import { turnstileSiteKey } from "@/lib/auth";
import { AdminNav, Status, ago, day, num } from "@/components/admin/ui";
import OwnerRecovery from "@/components/admin/OwnerRecovery";
import { OWNERS, isOwnerUser } from "@/lib/admin";
import { account, user } from "@/db/schema";
import { and, eq, inArray, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Securitate · Admin" };

const SHOWN: SecurityKind[] = ["recuperare_proprietar", "parola_gresita", "intrare_blocata", "cod_gresit", "cod_rezerva", "dispozitiv_nou", "2pasi_pornit", "2pasi_oprit",
  "plata_semnatura", "plata_disputa", "plata_frauda"];

/**
 * Admin → Securitate (Daniel, 2026-11-13): ce trebuie verificat (încercări de ghicit parole, ștergeri multe, plăți ciudate),
 * numerele pe 24 h și 7 zile, jurnalul ultimelor 100 de întâmplări și ce pază e pornită.
 */
export default async function AdminSecurity() {
  const me = await requireAdmin("/admin/securitate");
  const o = await securityOverview(db);
  // Proprietarii (Daniel și Cristina): dacă au cont, dacă e confirmat, dacă au verificarea în 2 pași și parolă.
  const emails = OWNERS.map((x) => x.email);
  const rows = await db.select({ id: user.id, email: user.email, emailVerified: user.emailVerified, createdAt: user.createdAt, on: user.twoFactorEnabled })
    .from(user).where(inArray(sql`lower(${user.email})`, emails));
  const pw = rows.length ? (await db.select({ userId: account.userId }).from(account).where(and(inArray(account.userId, rows.map((r) => r.id)), eq(account.providerId, "credential")))).map((r) => r.userId) : [];
  const owners = OWNERS.map((x) => ({ ...x, u: rows.find((r) => r.email.toLowerCase() === x.email) ?? null }));
  const iAmOwner = owners.some((x) => x.u?.id === me.id && isOwnerUser(x.u));
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
        <h2 style={{ marginTop: 0 }}>Proprietarii și recuperarea</h2>
        <p className="muted" style={{ maxWidth: "78ch" }}>
          Daniel și Cristina au drepturi depline și sunt adresa de recuperare unul pentru altul. Fiecare devine proprietar doar după ce își
          confirmă adresa (legătura din email sau intrarea cu Google) și pornește verificarea în 2 pași. Dacă unul pierde telefonul și codurile
          de rezervă, celălalt îi resetează de aici verificarea; parola nouă și-o face fiecare cu „Ai uitat parola?”.
        </p>
        <div className="tbl-wrap">
          <table className="tbl stacked">
            <thead><tr><th>Cine</th><th>Cont</th><th>Adresă confirmată</th><th>2 pași</th><th></th></tr></thead>
            <tbody>
              {owners.map((x) => (
                <tr key={x.email}>
                  <td>{x.name} <small className="muted">{x.email}</small></td>
                  <td>{x.u ? <Status ok>are cont</Status> : <Status ok={false} warn>fără cont încă</Status>}</td>
                  <td>{!x.u ? "—" : isOwnerUser(x.u) ? <Status ok>da</Status> : <Status ok={false} warn>încă nu: din /securitate</Status>}</td>
                  <td>{!x.u ? "—" : x.u.on ? <Status ok>pornită</Status> : pw.includes(x.u.id) ? <Status ok={false} warn>oprită</Status> : <span className="muted">intră cu Google</span>}</td>
                  <td>{iAmOwner && x.u && x.u.id !== me.id && x.u.on ? <OwnerRecovery email={x.email} name={x.name} /> : null}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
