import Link from "next/link";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { automationMark } from "@/db/schema";
import { requireAdmin } from "@/lib/admin-access";
import { emailReady } from "@/lib/email";
import { SCORE_RULES, TIER_LABEL, ledger, marketingInsights, outcomes, trialLeads, type Window } from "@/lib/invatare";
import { addRecommendationAction, sendLeadMessage, setRecommendationAction } from "@/app/crestere-actions";
import { AdminNav, HBars, num } from "@/components/admin/ui";
import { WeekHeat } from "@/components/admin/charts";

export const dynamic = "force-dynamic";
export const metadata = { title: "Învățare și conversii · Admin" };

const TABS = [{ k: "jurnal", label: "Jurnalul recomandărilor" }, { k: "aproape", label: "Aproape de plată" }, { k: "perspective", label: "Perspective de marketing" }] as const;
const day = (iso: string) => new Intl.DateTimeFormat("ro", { day: "numeric", month: "short", timeZone: "Europe/Bucharest" }).format(new Date(iso));
const diff = (a: number, b: number) => { const d = b - a; return <b className={d > 0 ? "t-ok" : d < 0 ? "t-bad" : ""}>{d > 0 ? `+${d}` : d}</b>; };

/**
 * Admin → Învățare și conversii: jurnalul recomandărilor cu efectul măsurat, conturile din zilele gratuite aproape de plată
 * (cu mesaj de aprobat) și perspectivele din Analiză. Totul cu reguli scrise în src/lib/invatare.ts, fără AI.
 */
export default async function Invatare({ searchParams }: { searchParams: Promise<{ v?: string }> }) {
  await requireAdmin("/admin/invatare");
  const want = (await searchParams).v;
  const v = TABS.some((t) => t.k === want) ? want! : "jurnal";
  return (
    <section className="stack">
      <AdminNav active="invatare" />
      <nav className="actions" aria-label="Părți">{TABS.map((t) => <Link key={t.k} className={`btn${v === t.k ? " primary" : ""}`} href={`/admin/invatare?v=${t.k}`}>{t.label}</Link>)}</nav>
      {v === "jurnal" ? <Jurnal /> : v === "aproape" ? <Aproape /> : <Perspective />}
    </section>
  );
}

async function Jurnal() {
  const items = await ledger(db);
  const out = await outcomes(db, items);
  const row = (w: Window) => `${w.accounts} conturi · ${w.trees} arbori · ${w.payments} plăți · ${num(w.lei)} lei`;
  return (
    <>
      <div className="card">
        <p style={{ marginTop: 0 }}>Ce s-a propus, ce ai făcut și ce s-a schimbat după. Efectul compară cele <b>14 zile dinainte</b> de „Făcut” cu cele <b>14 de după</b>
          (conturi noi, arbori, plăți). Arată o schimbare, nu dovedește cauza: pot lucra mai multe lucruri deodată.</p>
        <form action={addRecommendationAction} className="actions" style={{ alignItems: "center" }}>
          <input name="text" required maxLength={300} placeholder="Ce ai de gând să încerci (de ex. „Postare în 5 grupuri de diaspora”)" style={{ flex: 1, minWidth: 240 }} />
          <input type="hidden" name="source" value="de mână" />
          <button className="btn primary">Adaugă</button>
        </form>
        <p className="muted small" style={{ marginBottom: 0 }}>Recomandările din <Link href="/admin/sanatate">Sănătatea afacerii</Link> se adaugă cu „+ în jurnal”.</p>
      </div>
      {items.length === 0 && <p className="muted">Jurnalul e gol.</p>}
      {items.map((it) => {
        const o = out.get(it.id);
        return (
          <div key={it.id} className="card" style={{ opacity: it.status === "respinsa" ? 0.55 : 1 }}>
            <div className="muted small">{day(it.at)} · {it.source} · {it.status === "propusa" ? "propusă" : it.status === "facuta" ? `făcută pe ${day(it.doneAt!)}` : "respinsă"}</div>
            <p style={{ margin: "4px 0" }}><b>{it.href ? <Link href={it.href}>{it.text}</Link> : it.text}</b></p>
            {it.note && <p className="small" style={{ margin: "4px 0" }}>Notă: {it.note}</p>}
            {o && (
              <div className="small" style={{ margin: "6px 0" }}>
                <div>Înainte (14 zile): {row(o.before)}</div>
                <div>După ({o.days} {o.days === 1 ? "zi" : "zile"}{o.complete ? "" : ", încă se măsoară"}): {row(o.after)}</div>
                <div>Schimbare: {diff(o.before.accounts, o.after.accounts)} conturi · {diff(o.before.trees, o.after.trees)} arbori · {diff(o.before.payments, o.after.payments)} plăți
                  <span className="muted"> · calculat din date</span></div>
              </div>
            )}
            <form action={setRecommendationAction} className="actions" style={{ marginTop: 6, alignItems: "center" }}>
              <input type="hidden" name="id" value={it.id} />
              <input name="note" defaultValue={it.note ?? ""} maxLength={300} placeholder="Notă (ce ai făcut exact)" style={{ flex: 1, minWidth: 200 }} />
              {it.status !== "facuta" && <button className="btn primary" name="status" value="facuta">Făcut</button>}
              {it.status === "propusa" && <button className="btn" name="status" value="respinsa">Nu o fac</button>}
              {it.status !== "propusa" && <button className="btn" name="status" value="propusa">Înapoi la propusă</button>}
            </form>
          </div>
        );
      })}
    </>
  );
}

async function Aproape() {
  const [leads, sent] = await Promise.all([trialLeads(db),
    db.select({ ref: automationMark.ref, at: automationMark.at }).from(automationMark).where(sql`${automationMark.automation} = 'aproape-plata' and ${automationMark.at} > now() - interval '7 days'`)]);
  const recent = new Set(sent.map((s) => s.ref.split(":")[0]));
  const count = (t: string) => leads.filter((l) => l.tier === t).length;
  return (
    <>
      <div className="stats">
        <div className="stat"><div className="stat-label">Aproape de plată</div><div className="stat-value">{count("aproape")}</div></div>
        <div className="stat"><div className="stat-label">Interesați</div><div className="stat-value">{count("interesat")}</div></div>
        <div className="stat"><div className="stat-label">La început</div><div className="stat-value">{count("inceput")}</div></div>
      </div>
      <div className="card">
        <p style={{ marginTop: 0 }}>Doar conturile aflate acum în zilele gratuite, din ce fac ele în cont. Scorul e o sumă de reguli simple (calculat din date):</p>
        <ul className="small">{SCORE_RULES.map((r) => <li key={r.label}>{r.label}: <b>+{r.points}</b></li>)}</ul>
        <p className="muted small" style={{ marginBottom: 0 }}>Nu se trimite nimic singur. Mesajul îl citești, îl schimbi dacă vrei și îl trimiți tu; butonul apare doar la cei care au spus „Da” la sfaturile pe email,
          cel mult o dată la 7 zile. Vizitele anonime din Analiză nu se leagă de conturi. {emailReady() ? "" : "Fără RESEND_API_KEY emailul nu pleacă."}</p>
      </div>
      {leads.length === 0 && <p className="muted">Nimeni nu e acum în zilele gratuite (sau plățile sunt oprite).</p>}
      {leads.map((l) => (
        <details key={l.id} className="card">
          <summary style={{ cursor: "pointer" }}>
            <b>{l.score}</b> · {l.name} <span className={`pill ${l.tier === "aproape" ? "ok" : l.tier === "interesat" ? "warn" : ""}`}>{TIER_LABEL[l.tier]}</span>{" "}
            <span className="muted small">{l.daysLeft} {l.daysLeft === 1 ? "zi rămasă" : "zile rămase"} · {l.persons} persoane · {l.invites} invitații · {l.photos} poze · {l.memories} amintiri</span>
          </summary>
          <div className="chips" style={{ margin: "8px 0" }}>{l.chips.map((c) => <span key={c} className="chip">{c}</span>)}</div>
          {l.news ? (recent.has(l.id) ? <p className="muted small">I-ai scris în ultimele 7 zile.</p> : (
            <form action={sendLeadMessage} className="form">
              <input type="hidden" name="userId" value={l.id} />
              <label>Subiect<input name="subject" defaultValue={l.message.subject} maxLength={140} required /></label>
              <label>Mesaj (propus din semnalele de mai sus; schimbă-l cum vrei{l.locale !== "ro" ? `; omul are limba ${l.locale}` : ""})
                <textarea name="body" rows={5} defaultValue={l.message.body} maxLength={2000} required /></label>
              <button className="btn primary">Aprob și trimit</button>
            </form>
          )) : <p className="muted small">N-a spus „Da” la sfaturile pe email, așa că nu-i scriem. Va primi doar emailul de sfârșit al zilelor gratuite, dacă e pornit.</p>}
        </details>
      ))}
    </>
  );
}

async function Perspective() {
  const m = await marketingInsights(db);
  return (
    <>
      <div className="card">
        <p style={{ marginTop: 0 }}>Din <Link href="/admin/analiza">Analiză</Link>, ultimele 30 de zile: {num(m.sessions)} sesiuni numărate anonim (fără cookie-uri, fără legătură cu conturile).
          {m.enough ? "" : " Sunt încă puține date: ce scrie „ipoteză” e doar un indiciu."}</p>
        {m.insights.map((i) => (
          <div key={i.title} style={{ margin: "12px 0" }}>
            <b>{i.title}</b> <span className={`pill ${i.basis === "calculat din date" ? "ok" : "warn"}`}>{i.basis}</span>
            <div className="small">{i.text}</div>
          </div>
        ))}
      </div>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Canalele, după pașii făcuți</h2>
        <div className="tbl-wrap"><table className="tbl">
          <thead><tr><th>Canal</th><th>Sesiuni</th><th>Au ajuns la cont, arbore sau plată</th></tr></thead>
          <tbody>{m.bySource.map((s) => <tr key={s.source}><td>{s.label}</td><td>{num(s.sessions)}</td><td>{num(s.good)} ({Math.round(s.rate * 100)}%)</td></tr>)}</tbody>
        </table></div>
      </div>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Când intră oamenii</h2>
        <WeekHeat grid={m.heat} />
      </div>
      {m.exits.length > 0 && (
        <div className="card">
          <h2 style={{ marginTop: 0 }}>Paginile din care pleacă fără niciun pas</h2>
          <HBars data={m.exits.map((e) => ({ label: e.key, count: e.count }))} total={Math.max(1, m.sessions)} label="Pagini de ieșire" />
        </div>
      )}
    </>
  );
}
