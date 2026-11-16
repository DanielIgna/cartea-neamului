import Link from "next/link";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { requireAdmin } from "@/lib/admin-access";
import { automationSwitches } from "@/lib/autonomie";
import { STEPS, STEP_LABEL, convSettings, dueAt } from "@/lib/conversie";
import { runConversion } from "@/lib/conversie-mail";
import { emailReady } from "@/lib/email";
import { planSettings } from "@/lib/plans";
import { stripeReady } from "@/lib/plati";
import { AdminNav, Status, day } from "@/components/admin/ui";
import ConversieStats from "@/components/admin/ConversieStats";
import { saveConversionSettings, sendSimulationToMe } from "./actions";
import { simulatedNow } from "./sim";

export const dynamic = "force-dynamic";
export const metadata = { title: "Din gratuit în plătit · Admin" };

const DAY = 86_400_000;

/**
 * Admin → Din gratuit în plătit (src/lib/conversie.ts): ce e pornit, setările (zilele emailurilor, reducerea, fereastra din ultima
 * zi), cifrele din ultimele 30 de zile și simulatorul: alegi un cont și o zi și vezi emailul pe care l-ar primi, fără să-i trimiți.
 */
export default async function AdminConversie({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const me = await requireAdmin("/admin/conversie");
  const q = await searchParams;
  const [cs, ps, sw] = await Promise.all([convSettings(db), planSettings(db), automationSwitches(db)]);
  const today = new Date();
  const from = new Date(today.getTime() - 29 * DAY).toISOString().slice(0, 10), to = today.toISOString().slice(0, 10);
  // Conturile pentru simulator: cele mai noi 40 (și al adminului).
  const recent = (await db.execute(sql`select id, name, email, created_at from "user" where email not like 'demo@%' order by (id = ${me.id}) desc, created_at desc limit 40`)).rows as { id: string; name: string; email: string; created_at: string }[];
  const simUser = q.u && recent.some((r) => r.id === q.u) ? q.u : null;
  const simDay = Math.min(Math.max(Number(q.zi) || 1, 1), 60);
  const simNow = simUser ? await simulatedNow(simUser, simDay) : null;
  const sim = simUser && simNow ? await runConversion(db, { now: simNow, onlyUserId: simUser, dryRun: true, simulate: true }) : null;
  const preview = sim?.previews[0] ?? null;
  // Calendarul unui cont nou de azi, cu setările de acum.
  const start = today, end = new Date(start.getTime() + ps.trialDays * DAY);
  return (
    <section className="stack">
      <AdminNav active="conversie" />
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Ce e pornit</h2>
        <ul className="plain">
          <li><Status ok={sw.conversie}>Emailurile: {sw.conversie ? "pornite" : "oprite"}</Status> — se pornesc din <Link href="/admin/autonomie">Admin → Autonomie</Link>, „Email: din gratuit în plătit”. Rulează o dată pe zi.</li>
          <li><Status ok={ps.on}>Plățile: {ps.on ? "pornite" : "oprite"}</Status> — fără ele nu există zile gratuite și nu pleacă nimic.</li>
          <li><Status ok={emailReady()}>Resend: {emailReady() ? "cheia e pusă" : "lipsește RESEND_API_KEY"}</Status></li>
          <li><Status ok={stripeReady()}>Stripe: {stripeReady() ? "cheia e pusă" : "lipsește STRIPE_SECRET_KEY"}</Status> — fără ea, emailul cu reducerea (ziua {cs.days.reducere}) nu pleacă.</li>
          <li><Status ok={cs.popup}>Fereastra din ultima zi: {cs.popup ? "pornită" : "oprită"}</Status>. Banda „Mai ai X zile gratuite” apare oricum cât plățile sunt pornite.</li>
        </ul>
        <p className="muted small" style={{ marginBottom: 0 }}>După zilele gratuite nu se șterge nimic: arborele se vede; adăugarea, schimbarea, invitațiile, descărcarea GEDCOM și cartea PDF se deschid cu un plan. „Datele mele” rămâne deschis.</p>
      </div>

      <ConversieStats from={from} to={to} link={false} />

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Setări</h2>
        {q.salvat && <p className="pay-ok" role="status">Salvat.</p>}
        {q.eroare && <p className="err" role="alert">{q.eroare}</p>}
        <form action={saveConversionSettings} className="form">
          <div className="tbl-wrap"><table className="tbl">
            <thead><tr><th>Email</th><th>Ziua</th><th>Pentru un cont făcut azi</th></tr></thead>
            <tbody>{STEPS.map((s) => (
              <tr key={s}><td>{STEP_LABEL[s]}</td>
                <td><input type="number" name={`d_${s}`} min={1} max={60} defaultValue={cs.days[s]} style={{ width: 80 }} /></td>
                <td>{day(dueAt(cs.days[s], start, end, ps.trialDays).toISOString())}</td></tr>
            ))}</tbody>
          </table></div>
          <p className="muted small">Ziua 1 = prima zi gratuită. Zilele gratuite sunt acum {ps.trialDays} (din Manager control). Emailurile de după (ziua ≥ {ps.trialDays}) se mută singure dacă omul a câștigat zile în plus din invitații.</p>
          <label>Reducerea (%) <input type="number" name="percent" min={5} max={90} defaultValue={cs.percent} style={{ width: 90 }} /></label>
          <label>Cât ține reducerea (ore) <input type="number" name="hours" min={1} max={240} defaultValue={cs.hours} style={{ width: 90 }} /></label>
          <label className="check"><input type="checkbox" name="popup" defaultChecked={cs.popup} /> Fereastra „Perioada gratuită se încheie azi” în ultima zi</label>
          <div className="actions"><button className="btn primary">Salvează</button></div>
        </form>
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Simulator</h2>
        <p className="muted" style={{ marginTop: 0 }}>Alege un cont și o zi: vezi emailul pe care l-ar primi atunci, cu numele și arborele lui, ca pentru un cont nou fără plată. Nu i se trimite nimic și nu se scrie nimic la el.</p>
        <form method="get" className="form">
          <label>Contul <select name="u" defaultValue={simUser ?? ""}>
            <option value="">— alege —</option>
            {recent.map((r) => <option key={r.id} value={r.id}>{r.name} ({r.email}){r.id === me.id ? " — tu" : ""}</option>)}
          </select></label>
          <label>Ziua <input type="number" name="zi" min={1} max={60} defaultValue={simDay} style={{ width: 80 }} /></label>
          <div className="actions"><button className="btn">Arată</button></div>
        </form>
        {q.trimis && <p role="status" className={q.trimis === "1" ? "pay-ok" : "err"}>{q.trimis === "1" ? `Trimis la ${me.email}.` : "Nu s-a trimis (nimic de trimis în ziua asta sau Resend lipsește)."}</p>}
        {simUser && !preview && <p>În ziua {simDay} contul ăsta nu primește niciun email{sim?.skipped.length ? ` (${sim.skipped.join("; ")})` : ""}. Încearcă ziua {STEPS.map((s) => cs.days[s]).join(", ")}.</p>}
        {preview && (
          <>
            <p><b>{STEP_LABEL[preview.step]}</b> · subiect: „{preview.mail.subject}”</p>
            <iframe title="Previzualizare email" srcDoc={preview.mail.html} sandbox="" style={{ width: "100%", height: 560, border: "1px solid var(--line, #ddd)", borderRadius: 8, background: "#fff" }} />
            <form action={sendSimulationToMe} className="actions">
              <input type="hidden" name="u" value={simUser!} />
              <input type="hidden" name="zi" value={simDay} />
              <button className="btn">Trimite-mi-l pe email ({me.email})</button>
            </form>
            <p className="muted small">Codul de reducere din previzualizare e de probă (CNXXXXXXXX); cel adevărat se face în Stripe când pleacă emailul.</p>
          </>
        )}
      </div>
    </section>
  );
}
