import Link from "next/link";
import { db } from "@/db";
import { requireFounder } from "@/lib/admin-access";
import { AREA, LIFECYCLE, RISK, type Area, type Lifecycle, type Risk } from "@/lib/cunostinte/functii";
import { COLS, COL_LABEL, HEALTH, VERIF, countBy, knowledge, type Health, type Verif } from "@/lib/cunostinte/verificare";
import CunostinteHead from "@/components/admin/CunostinteHead";
import { FunctionMap, type FnRow } from "@/components/admin/Cunostinte";

export const dynamic = "force-dynamic";
export const metadata = { title: "Harta funcțiilor · Admin" };

function Tally<T extends string>({ title, labels, counts, tone }: { title: string; labels: Record<T, string>; counts: Record<T, number>; tone?: (k: T) => string }) {
  return (
    <div className="card kc-tally">
      <h2>{title}</h2>
      <ul>
        {(Object.keys(labels) as T[]).filter((k) => counts[k]).map((k) => (
          <li key={k}><span className={`pill ${tone?.(k) ?? ""}`}>{labels[k]}</span><b>{counts[k]}</b></li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Admin → Harta funcțiilor: fiecare funcție a platformei cu ciclul de viață, sănătatea, riscul și verificarea, în listă sau
 * matrice (motor / pagini-API / bază / metrică / automatizare / panou / teste / chei / decizie). Export CSV și JSON.
 */
export default async function Functii() {
  await requireFounder("/admin/cunostinte/functii");
  const k = await knowledge(db);
  const counts = countBy(k.docs.map((d) => d.status));
  const rows: FnRow[] = k.evals.map((e) => ({
    key: e.fn.key, name: e.fn.name, area: e.fn.area, areaLabel: AREA[e.fn.area], lifecycle: e.lifecycle, lifecycleLabel: LIFECYCLE[e.lifecycle],
    risk: e.fn.risk, riskLabel: RISK[e.fn.risk], riskWhy: e.fn.riskWhy, health: e.health, healthLabel: HEALTH[e.health], verification: e.verification,
    verificationLabel: VERIF[e.verification], what: e.fn.what, errors7: e.errors7, issues: e.issues, docs: e.docs, cells: e.cells, dashboard: e.fn.dashboard, human: e.fn.human,
  }));
  const opts = <T extends string>(labels: Record<T, string>, present: string[]) => (Object.keys(labels) as T[]).filter((v) => present.includes(v)).map((v) => ({ value: v, label: labels[v] }));
  const hTone = (h: Health) => (h === "verde" ? "ok" : h === "galben" ? "warn" : h === "rosu" ? "bad" : "");
  const vTone = (v: Verif) => (v === "verificat" ? "ok" : v === "rupt" ? "bad" : "warn");
  const rTone = (r: Risk) => (r === "ridicat" ? "bad" : r === "mediu" ? "warn" : "");
  const withAuto = k.evals.filter((e) => e.fn.automations?.length && e.health !== "gri").length;

  return (
    <section className="stack kc">
      <CunostinteHead s={k.summary} active="functii" counts={counts} />
      <div className="kc-tallies">
        <Tally title="Zonă" labels={AREA} counts={countBy(rows.map((r) => r.area as Area))} />
        <Tally title="Ciclu de viață" labels={LIFECYCLE} counts={countBy(rows.map((r) => r.lifecycle as Lifecycle))} />
        <Tally title="Sănătate" labels={HEALTH} counts={countBy(rows.map((r) => r.health as Health))} tone={hTone} />
        <Tally title="Risc" labels={RISK} counts={countBy(rows.map((r) => r.risk as Risk))} tone={rTone} />
        <Tally title="Verificare" labels={VERIF} counts={countBy(rows.map((r) => r.verification as Verif))} tone={vTone} />
      </div>
      <div className="card kc-bridge">
        <span>Business ⇄ Infra ⇄ Autonomie</span>
        <small className="muted">{withAuto} din {k.summary.live} funcții în lucru au o automatizare. Sănătatea de aici intră în scorul din <Link href="/admin/autonomie">Autonomie</Link> (partea Dezvoltare).</small>
      </div>
      <FunctionMap rows={rows} cols={COLS.map((c) => ({ key: c, label: COL_LABEL[c] }))}
        filters={{
          area: opts(AREA, rows.map((r) => r.area)), lifecycle: opts(LIFECYCLE, rows.map((r) => r.lifecycle)), health: opts(HEALTH, rows.map((r) => r.health)),
          risk: opts(RISK, rows.map((r) => r.risk)), verification: opts(VERIF, rows.map((r) => r.verification)),
        }} />
      <p className="muted" style={{ fontSize: 13 }}>
        Exportă harta: <Link href="/admin/cunostinte/export?ce=functii&format=csv">CSV</Link> · <Link href="/admin/cunostinte/export?ce=functii&format=json">JSON</Link>.
        O funcție nouă se trece în src/lib/cunostinte/functii.ts; fișierele și adresele se verifică față de codul publicat, tabelele față de baza de date.
      </p>
    </section>
  );
}
