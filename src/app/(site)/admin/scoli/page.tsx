import Link from "next/link";
import { db } from "@/db";
import { requireAdmin } from "@/lib/admin-access";
import { SITE_URL } from "@/lib/site-url";
import { stripeReady } from "@/lib/plati";
import { SCHOOL_DEFAULT_PERCENT, schoolDashboard, schoolYearEnd } from "@/lib/scoli";
import { approveSchoolRequest, newSchoolCode, rejectSchoolRequest, toggleSchoolCode } from "@/app/scoala-actions";
import { AdminNav, Stat, day, lei, num } from "@/components/admin/ui";
import CopyLink from "@/components/admin/CopyLink";

export const dynamic = "force-dynamic";
export const metadata = { title: "Școli · Admin" };

const iso = (d: Date) => d.toISOString().slice(0, 10);

/**
 * Admin → Școli (Daniel, 17.11.2026; src/lib/scoli.ts): cererile „Vreau coduri pentru clasa mea” de pe /scoala, aprobate de mână;
 * la aprobare se face un cod Stripe de reducere pentru clasă (procent, număr de folosiri, dată de expirare). Pe fiecare cod:
 * conturi făcute cu el, plăți și bani. Codurile se pot opri oricând. CRM-ul folosește aceleași tabele.
 */
export default async function Schools() {
  await requireAdmin("/admin/scoli");
  const d = await schoolDashboard(db);
  const end = iso(schoolYearEnd());
  const totals = d.codes.reduce((a, c) => ({ signups: a.signups + c.signups, payments: a.payments + c.payments, paid: a.paid + c.paid }), { signups: 0, payments: 0, paid: 0 });
  const codeUrl = (code: string) => `${SITE_URL}/scoala-cod/${code}`;
  return (
    <section className="stack">
      <AdminNav active="scoli" />
      {!stripeReady() && <div className="card" style={{ borderColor: "var(--ochre)" }}>Cheia Stripe nu e pusă: codurile se fac doar în site, fără reducerea din Stripe.</div>}
      <div className="stats">
        <Stat label="Cereri noi" value={num(d.pending)} tone={d.pending ? "warn" : undefined} hint="de aprobat sau respins" />
        <Stat label="Școli" value={num(d.schools.length)} hint={`${num(d.codes.length)} coduri`} />
        <Stat label="Conturi din școli" value={num(totals.signups)} hint="făcute cu un cod de clasă" />
        <Stat label="Plăți din școli" value={num(totals.payments)} hint={lei(totals.paid / 100)} />
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Cereri de coduri</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          Vin din formularul de pe <Link href="/scoala">/scoala</Link>. Înainte de aprobare, verifică școala (un telefon sau un email de pe site-ul școlii).
          La aprobare se face codul clasei, cu {SCHOOL_DEFAULT_PERCENT}% reducere, atâtea folosiri câți elevi sunt și valabil până la {day(end)}; le poți schimba.
        </p>
        {d.requests.length === 0 ? <p className="muted" style={{ marginBottom: 0 }}>Încă nicio cerere.</p> : (
          <div className="stack" style={{ gap: 10 }}>
            {d.requests.map((r) => (
              <div key={r.id} className="card" style={{ background: "var(--surface-2)", margin: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                  <div>
                    <b>{r.school}</b>, {r.locality}{r.county ? ` (${r.county})` : ""} · clasa {r.classLabel} · {num(r.students)} elevi
                    <small style={{ display: "block" }}>{r.teacher ? `${r.teacher} · ` : ""}{r.email}{r.phone ? ` · ${r.phone}` : ""} · {day(r.createdAt.toISOString(), true)}</small>
                    {r.message && <small style={{ display: "block", whiteSpace: "pre-wrap" }}>„{r.message}”</small>}
                  </div>
                  <span className={`pill ${r.status === "nou" ? "warn" : r.status === "aprobat" ? "ok" : ""}`}>{r.status}</span>
                </div>
                {r.status === "nou" && (
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end", marginTop: 10 }}>
                    <form action={approveSchoolRequest} className="form" style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end" }}>
                      <input type="hidden" name="id" value={r.id} />
                      <label style={{ width: 110 }}>Reducere %<input name="percent" type="number" min={5} max={100} defaultValue={SCHOOL_DEFAULT_PERCENT} /></label>
                      <label style={{ width: 110 }}>Folosiri<input name="maxUses" type="number" min={1} max={500} defaultValue={r.students} /></label>
                      <label style={{ width: 160 }}>Expiră<input name="expiresAt" type="date" defaultValue={end} /></label>
                      <button className="btn primary">Aprobă și fă codul</button>
                    </form>
                    <form action={rejectSchoolRequest}><input type="hidden" name="id" value={r.id} /><button className="btn">Respinge</button></form>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Codurile claselor</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          Trimite profesorului linkul codului: copiii (părinții) care își fac cont pe el primesc reducerea automat la plată. Codul se poate scrie și de mână în pagina de plată Stripe.
        </p>
        {d.codes.length === 0 ? <p className="muted" style={{ marginBottom: 0 }}>Încă niciun cod.</p> : (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>Cod</th><th>Școala, clasa</th><th className="n">Reducere</th><th className="n">Conturi</th><th className="n">Plăți</th><th className="n">Bani</th><th>Expiră</th><th></th></tr></thead>
              <tbody>
                {d.codes.map((c) => (
                  <tr key={c.id} style={c.active ? undefined : { opacity: 0.55 }}>
                    <td><b>{c.code}</b>{!c.stripe_promo_id && <small>fără Stripe</small>}</td>
                    <td>{c.school}<small>{c.locality}{c.class_label ? ` · clasa ${c.class_label}` : ""}</small></td>
                    <td className="n">{c.percent}%</td>
                    <td className="n">{num(c.signups)}</td>
                    <td className="n">{num(c.payments)} / {num(c.max_uses)}</td>
                    <td className="n">{lei(c.paid / 100)}</td>
                    <td className="tight">{day(new Date(c.expires_at).toISOString())}</td>
                    <td className="tight" style={{ display: "flex", gap: 6 }}>
                      <CopyLink url={codeUrl(c.code)} />
                      <form action={toggleSchoolCode}>
                        <input type="hidden" name="id" value={c.id} /><input type="hidden" name="on" value={c.active ? "0" : "1"} />
                        <button className="btn">{c.active ? "Oprește" : "Pornește"}</button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Fă un cod de mână</h2>
        <p className="muted" style={{ marginTop: 0 }}>Pentru o școală cu care ai vorbit direct, fără formular. Clasa poate lipsi (cod pe toată școala).</p>
        <form action={newSchoolCode} className="form" style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end" }}>
          <label style={{ flex: "2 1 220px" }}>Școala<input name="school" required minLength={3} maxLength={160} /></label>
          <label style={{ flex: "1 1 150px" }}>Localitatea<input name="locality" required minLength={2} maxLength={80} /></label>
          <label style={{ flex: "1 1 120px" }}>Județul<input name="county" maxLength={40} /></label>
          <label style={{ width: 110 }}>Clasa<input name="classLabel" maxLength={30} placeholder="a IV-a B" /></label>
          <label style={{ width: 100 }}>Reducere %<input name="percent" type="number" min={5} max={100} defaultValue={SCHOOL_DEFAULT_PERCENT} /></label>
          <label style={{ width: 100 }}>Folosiri<input name="maxUses" type="number" min={1} max={500} defaultValue={30} /></label>
          <label style={{ width: 160 }}>Expiră<input name="expiresAt" type="date" defaultValue={end} /></label>
          <button className="btn primary">Fă codul</button>
        </form>
      </div>

      {d.schools.length > 0 && (
        <div className="card">
          <h2 style={{ marginTop: 0 }}>Școlile</h2>
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>Școala</th><th>Localitatea</th><th className="n">Clase</th><th className="n">Coduri</th></tr></thead>
              <tbody>{d.schools.map((s) => <tr key={s.id}><td>{s.name}</td><td>{s.locality}{s.county ? <small>{s.county}</small> : null}</td><td className="n">{num(s.classes)}</td><td className="n">{num(s.codes)}</td></tr>)}</tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
