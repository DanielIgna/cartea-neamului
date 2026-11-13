import Link from "next/link";
import { db } from "@/db";
import { requireAdmin } from "@/lib/admin-access";
import { AUTOMATIONS, RISK_LABEL, autonomyPage, tierOf, type Part } from "@/lib/autonomie";
import { AdminNav, Stat, ago, day, num } from "@/components/admin/ui";
import { AutoApprove, AutoRun, AutoToggle, LoopRun } from "@/components/admin/AutonomyForms";

export const dynamic = "force-dynamic";
export const maxDuration = 60;
export const metadata = { title: "Autonomie · Admin" };

const STATUS: Record<string, { label: string; tone: string }> = {
  ok: { label: "făcut", tone: "ok" }, nimic: { label: "nimic de făcut", tone: "" }, asteapta: { label: "așteaptă aprobare", tone: "warn" },
  sarit: { label: "sărit", tone: "" }, eroare: { label: "eroare", tone: "bad" },
};
const TRIGGER: Record<string, string> = { ceas: "ceasul zilnic", manual: "pornit de tine", aprobare: "aprobat de tine" };
const label = (k: string) => AUTOMATIONS.find((a) => a.key === k)?.label ?? k;

/** Inelul cu scorul (0–100), desenat din date: cât e plin = scorul. */
function Ring({ score }: { score: number }) {
  const r = 52, c = 2 * Math.PI * r;
  const tone = score >= 90 ? "var(--good)" : score >= 75 ? "var(--accent)" : score >= 50 ? "var(--ochre)" : "var(--red)";
  return (
    <svg viewBox="0 0 120 120" className="auto-ring" role="img" aria-label={`Scor ${score} din 100`}>
      <circle cx="60" cy="60" r={r} fill="none" stroke="var(--line)" strokeWidth="9" />
      <circle cx="60" cy="60" r={r} fill="none" stroke={tone} strokeWidth="9" strokeLinecap="round" strokeDasharray={`${(c * score) / 100} ${c}`} transform="rotate(-90 60 60)" />
      <text x="60" y="62" textAnchor="middle" className="auto-ring-n" fill={tone}>{score}</text>
      <text x="60" y="82" textAnchor="middle" className="auto-ring-of">/ 100</text>
    </svg>
  );
}

/** Graficul mic al scorului pe zile (doar zilele în care a rulat bucla). */
function Spark({ data }: { data: { day: string; score: number }[] }) {
  if (data.length < 2) return <p className="muted" style={{ fontSize: 13, margin: 0 }}>Graficul apare după a doua zi în care rulează bucla ({data.length ? "una până acum" : "niciuna până acum"}).</p>;
  const w = 300, h = 54;
  const pts = data.map((d, i) => `${((i / (data.length - 1)) * w).toFixed(1)},${(h - (d.score / 100) * h).toFixed(1)}`);
  return (
    <figure className="auto-spark" style={{ margin: 0 }}>
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" role="img" aria-label={`Scorul pe ${data.length} zile, de la ${data[0].score} la ${data.at(-1)!.score}`}>
        <polygon points={`0,${h} ${pts.join(" ")} ${w},${h}`} fill="var(--accent-soft)" />
        <polyline points={pts.join(" ")} fill="none" stroke="var(--accent)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
      </svg>
      <figcaption className="muted">{day(data[0].day)} → {day(data.at(-1)!.day)} · {data.length} zile</figcaption>
    </figure>
  );
}

function PartCard({ p }: { p: Part }) {
  const gap = p.target - p.score;
  const tone = p.score >= p.target ? "ok" : p.score >= p.target - 20 ? "warn" : "bad";
  return (
    <details className="card auto-part">
      <summary>
        <span className="auto-part-h">{p.label}</span>
        <span className="auto-part-n">{p.score}</span>
        <span className="muted auto-part-t">țintă {p.target}</span>
        <span className={`auto-bar ${tone}`} aria-hidden="true"><i style={{ width: `${p.score}%` }} /></span>
        <small className="muted">{p.what}</small>
        {gap > 0 && <small className="auto-gap">până la țintă: {gap} puncte</small>}
      </summary>
      <ul className="auto-checks">
        {p.checks.map((c, i) => (
          <li key={i}>
            <span className={`pill ${c.points >= c.max ? "ok" : c.points > 0 ? "warn" : "bad"}`}>{c.points}/{c.max}</span>
            <span>{c.label}<small className="muted">{c.note}</small></span>
          </li>
        ))}
      </ul>
    </details>
  );
}

const STAGES = [
  { k: "observa", label: "Observă" }, { k: "gaseste", label: "Găsește" }, { k: "hotaraste", label: "Hotărăște" }, { k: "face", label: "Face" },
  { k: "verifica", label: "Verifică" }, { k: "noteaza", label: "Notează" }, { k: "invata", label: "Învață" },
];

/**
 * Admin → Autonomie: cât merge site-ul singur (scor din verificări reale), automatizările cu comutator, ce așteaptă aprobarea
 * ta, recomandările, bucla zilnică și jurnalul fiecărei rulări. Vezi src/lib/autonomie.ts.
 */
export default async function AdminAutonomie() {
  await requireAdmin("/admin/autonomie");
  const d = await autonomyPage(db);
  const tier = tierOf(d.score.score);
  const loop = d.loop?.details?.stats;
  return (
    <section className="stack">
      <AdminNav active="autonomie" />
      <p className="muted" style={{ marginTop: -8 }}>
        Cât din Cartea Neamului merge singură. Scorul vine doar din verificări pe datele site-ului (erori, probleme, securitate, plăți,
        rulările de mai jos), fără AI și fără cifre puse de mână. Apasă pe o parte ca să vezi fiecare punct.
      </p>

      <div className="card auto-hero">
        <Ring score={d.score.score} />
        <div className="auto-hero-txt">
          <span className={`pill ${tier.key === "autonom" ? "ok" : tier.key === "manual" ? "bad" : "warn"}`}>{tier.label}</span>
          <h2 style={{ margin: "8px 0 4px" }}>Site-ul e „{tier.label.toLowerCase()}”</h2>
          <p className="muted" style={{ margin: "0 0 10px" }}>{tier.text}</p>
          <p className="muted" style={{ fontSize: 13, margin: "0 0 10px" }}>
            {d.score.checks} verificări · {d.score.findings} cu puncte lipsă · țintă: 90
          </p>
          <Spark data={d.history} />
          <div className="actions" style={{ marginTop: 12 }}><LoopRun /></div>
        </div>
      </div>

      {!d.cron.secret && (
        <div className="card auto-note">
          <strong>Ceasul zilnic nu e pornit încă.</strong> Pune în Vercel → Settings → Environment Variables cheia <code>CRON_SECRET</code> (orice
          parolă lungă, de pildă 40 de litere și cifre la întâmplare), apoi o publicare nouă. De atunci, în fiecare dimineață pe la 7–8 bucla
          rulează singură. Până atunci rulează doar când apeși „Rulează bucla acum”.
        </div>
      )}

      <div className="auto-parts">
        {d.score.parts.map((p) => <PartCard key={p.key} p={p} />)}
      </div>

      {d.pendingApprovals.length > 0 && (
        <div className="card auto-approve" id="aprobari">
          <h2 style={{ marginTop: 0 }}>Așteaptă aprobarea ta</h2>
          {d.pendingApprovals.map((a) => (
            <div key={a.key} className="auto-row">
              <div><strong>{label(a.key)}</strong><small className="muted">{a.note} · pregătit {ago(a.at)}</small>
                {a.key === "probleme-vechi" && <small><Link href="/admin/probleme">Vezi-le în Probleme raportate</Link></small>}</div>
              <AutoApprove k={a.key} count={a.count} />
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Recomandări, în ordinea câștigului <span className="muted" style={{ fontSize: 15 }}>({d.recs.length})</span></h2>
        {d.recs.length === 0
          ? <p className="muted" style={{ marginBottom: 0 }}>Nicio recomandare: toate verificările au punctaj întreg.</p>
          : (
            <ol className="auto-recs">
              {d.recs.slice(0, 10).map((r, i) => (
                <li key={i} className={`auto-rec ${r.level === "ridicat" ? "hi" : r.level === "mediu" ? "mid" : ""}`}>
                  <div className="auto-rec-h">
                    <span className={`pill ${r.level === "ridicat" ? "bad" : r.level === "mediu" ? "warn" : ""}`}>{r.level}</span>
                    <span className="muted">{r.partLabel}</span>
                    <span className="auto-rec-gain">+{r.gain.toLocaleString("ro-RO")} puncte</span>
                  </div>
                  <p>{r.href ? <Link href={r.href}>{r.text}</Link> : r.text}</p>
                  <small className="muted">Acum: {r.note}</small>
                </li>
              ))}
            </ol>
          )}
      </div>

      <div className="card" id="automatizari">
        <h2 style={{ marginTop: 0 }}>Automatizările</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          „Merge singur” = doar citește, curăță ce a expirat sau îți scrie ție. „Cu acordul tău” = le scrie oamenilor; pornind-o îți dai
          acordul. „Cere aprobare” = pregătește lista, iar schimbarea se face doar când apeși „Aprobă”. Fiecare rulare intră în jurnalul de jos;
          una care dă eroare de 3 ori la rând se oprește singură.
        </p>
        <div className="auto-list">
          {AUTOMATIONS.map((a) => {
            const on = d.switches[a.key];
            const l = d.last.get(a.key);
            const paused = d.switches.paused?.[a.key];
            return (
              <div key={a.key} className={`auto-item${on ? " on" : ""}`}>
                <AutoToggle k={a.key} on={on} label={a.label}
                  consent={a.risk === "acord" ? `Pornești „${a.label}”? De acum emailurile pleacă singure, fără să te mai întrebe. Le poți opri oricând.` : undefined} />
                <div className="auto-item-txt">
                  <strong>{a.label}</strong> <span className={`pill ${a.risk === "singur" ? "ok" : "warn"}`}>{RISK_LABEL[a.risk]}</span>
                  <small className="muted">{a.what}</small>
                  {a.needs && <small className="muted">Are nevoie de: {a.needs}.</small>}
                  {paused && !on && <small className="err">{paused}</small>}
                  <small>{a.everyDays === 1 ? "zilnic" : `o dată la ${a.everyDays} zile`} · ultima rulare: {l?.last ? `${ago(new Date(l.last).toISOString())} (${STATUS[l.status ?? ""]?.label ?? l.status})` : "niciodată"}</small>
                </div>
                <AutoRun k={a.key} />
              </div>
            );
          })}
        </div>
        {a11yTextForMail(d.cron.mail)}
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Bucla zilnică</h2>
        <p className="muted" style={{ marginTop: 0 }}>Observă (verificările scorului) → găsește (ce nu are punctaj întreg) → hotărăște (ce automatizări sunt pornite și scadente) → face → verifică (după fiecare acțiune) → notează (jurnalul) → învață (oprește ce dă erori la rând, scorul zilei pentru grafic).</p>
        <ol className="auto-loop" aria-label="Pașii buclei">
          {STAGES.map((s, i) => <li key={s.k}>{s.label}{i < STAGES.length - 1 && <span aria-hidden="true"> →</span>}</li>)}
        </ol>
        {loop ? (
          <>
            <div className="stats" style={{ marginTop: 12 }}>
              <Stat label="Verificări" value={num(loop.observed)} />
              <Stat label="Găsite" value={num(loop.findings)} />
              <Stat label="Automatizări rulate" value={num(loop.ran)} />
              <Stat label="Lucruri făcute" value={num(loop.acted)} />
              <Stat label="Verificate" value={num(loop.verified)} />
              <Stat label="Așteaptă aprobare" value={num(loop.pending)} />
              <Stat label="Erori" value={num(loop.failed)} />
              <Stat label="Oprite singure" value={num(loop.paused)} />
            </div>
            <p className="muted" style={{ fontSize: 13, marginBottom: 0 }}>Ultima buclă: {day(d.loop!.at, true)} UTC, {TRIGGER[d.loop!.trigger] ?? d.loop!.trigger} · {d.loop!.note}</p>
          </>
        ) : <p className="muted" style={{ marginBottom: 0 }}>Bucla n-a rulat încă. Apasă „Rulează bucla acum” sus.</p>}
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Activitatea pe 7 zile</h2>
        <div className="stats">
          <Stat label="Rulări" value={num(d.week.runs)} />
          <Stat label="Reușite" value={num(d.week.ok)} />
          <Stat label="Cu eroare" value={num(d.week.errors)} tone={d.week.errors ? "bad" : undefined} />
          <Stat label="Lucruri făcute" value={num(d.week.acted)} />
          <Stat label="Emailuri către oameni" value={num(d.week.mails)} />
          <Stat label="Aprobate de tine" value={num(d.week.approved)} />
        </div>
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Jurnalul rulărilor</h2>
        {d.recent.length === 0 ? <p className="muted" style={{ marginBottom: 0 }}>Nimic încă.</p> : (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>Când (UTC)</th><th>Ce</th><th>Rezultat</th></tr></thead>
              <tbody>
                {d.recent.map((r) => (
                  <tr key={r.id}>
                    <td style={{ whiteSpace: "nowrap" }}>{day(r.at, true)}<small>{TRIGGER[r.trigger] ?? r.trigger}</small></td>
                    <td>{label(r.automation)}<small>văzute {num(r.observed)} · făcute {num(r.acted)}{r.pending ? ` · de aprobat ${num(r.pending)}` : ""}{(r.details as { verified?: boolean } | null)?.verified ? " · verificat" : ""}</small></td>
                    <td><span className={`pill ${STATUS[r.status]?.tone ?? ""}`}>{STATUS[r.status]?.label ?? r.status}</span><small>{r.note}</small></td>
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

function a11yTextForMail(mail: boolean) {
  if (mail) return null;
  return <p className="muted" style={{ fontSize: 13, marginBottom: 0 }}>Emailurile nu pleacă încă: lipsește <code>RESEND_API_KEY</code> în Vercel. Până atunci, cele cu email sunt sărite (fără eroare).</p>;
}
