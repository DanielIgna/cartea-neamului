import Link from "next/link";
import { db } from "@/db";
import { requireAdmin } from "@/lib/admin-access";
import { AdminNav } from "@/components/admin/ui";
import { COUNTIES } from "@/lib/place-key";
import { CATEGORIES, STAGES, STAGE_LABEL, pl, type Stage } from "@/lib/carduri-cadou";
import { coverage, crmPartners, crmStats, dueSteps, filterCrm, monthOf, monthReport, quietPartners, referralTotals } from "@/lib/parteneri-crm";
import { stepDoneAction } from "@/app/parteneri-crm-actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "City Partners · Admin" };

const lei = (v: number) => `${new Intl.NumberFormat("ro", { maximumFractionDigits: 2 }).format(v)} lei`;
const day = (d: Date) => new Intl.DateTimeFormat("ro", { dateStyle: "medium", timeZone: "Europe/Bucharest" }).format(d);

/**
 * Admin → City Partners (Daniel, 2026-11-14, după modelul „Strategic City Partnership” din PropManage): magazinele și firmele
 * partenere, de la primul contact până la activ. Cifrele de sus, etapele, filtrele, ce e de făcut azi, cine n-a mai vândut de
 * 30 de zile, acoperirea pe județe și raportul lunar „de plată”. Vezi src/lib/parteneri-crm.ts.
 */
export default async function CityPartners({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireAdmin("/admin/parteneri");
  const q = await searchParams;
  const month = /^\d{4}-\d{2}$/.test(q.luna ?? "") ? q.luna! : monthOf();
  const [all, quiet, refs, monthRows] = await Promise.all([crmPartners(db), quietPartners(db, 30), referralTotals(db), monthReport(db, month)]);
  const stats = crmStats(all);
  const rows = filterCrm(all, { etapa: q.etapa, categorie: q.categorie, judet: q.judet, oras: q.oras, q: q.q });
  const due = dueSteps(all);
  const cov = coverage(all);
  const covered = cov.filter((c) => c.activi > 0).length;
  const etapa = q.etapa ?? "toti";
  const keep = (extra: Record<string, string>) => {
    const s = new URLSearchParams(Object.entries({ categorie: q.categorie, judet: q.judet, oras: q.oras, q: q.q, ...extra }).filter(([, v]) => v) as [string, string][]);
    return `/admin/parteneri${s.toString() ? `?${s}` : ""}`;
  };
  const monthTotal = monthRows.reduce((n, r) => n + r.total, 0);
  return (
    <section className="stack">
      <AdminNav active="parteneri" />
      {q.ok && <p className="cc-ok" role="status">{q.ok}</p>}

      <div className="crm-tiles">
        <div><small>Parteneri în total</small><b>{stats.total}</b></div>
        <div><small>Prospecte</small><b>{stats.prospecte}</b></div>
        <div><small>În discuții</small><b>{stats.inLucru}</b></div>
        <div><small>Activi</small><b>{stats.activi}</b></div>
        <div><small>Carduri vândute / activate</small><b>{stats.vandute} / {stats.activate}</b></div>
        <div><small>Comision de la început</small><b>{lei(stats.comision)}</b></div>
      </div>

      <div className="card">
        <nav className="crm-tabs" aria-label="Etape">
          <Link href={keep({})} aria-current={etapa === "toti" ? "page" : undefined}>Toți <small>{stats.total}</small></Link>
          <Link href={keep({ etapa: "prospecte" })} aria-current={etapa === "prospecte" ? "page" : undefined}>Prospecte <small>{stats.prospecte}</small></Link>
          {STAGES.map((s) => <Link key={s} href={keep({ etapa: s })} aria-current={etapa === s ? "page" : undefined}>{STAGE_LABEL[s]} <small>{stats.perEtapa[s]}</small></Link>)}
        </nav>
        <form className="crm-filters" method="get">
          {q.etapa && <input type="hidden" name="etapa" value={q.etapa} />}
          <select name="categorie" defaultValue={q.categorie ?? ""} aria-label="Categoria">
            <option value="">Toate categoriile</option>
            {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select name="judet" defaultValue={q.judet ?? ""} aria-label="Județul">
            <option value="">Toate județele</option>
            {Object.entries(COUNTIES).sort((a, b) => a[1].localeCompare(b[1], "ro")).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <input name="oras" defaultValue={q.oras ?? ""} placeholder="Oraș" aria-label="Oraș" />
          <input name="q" defaultValue={q.q ?? ""} placeholder="Caută nume, persoană, telefon" aria-label="Caută" />
          <button className="btn">Filtrează</button>
          <Link className="btn primary" href="/admin/parteneri/nou">+ Adaugă partener</Link>
        </form>
      </div>

      {due.length > 0 && (
        <div className="card crm-due">
          <h3 style={{ marginTop: 0 }}>De făcut azi ({due.length})</h3>
          <ul className="crm-list">
            {due.map((p) => (
              <li key={p.id}>
                <div><Link href={`/admin/parteneri/${p.id}`}><b>{p.numeMagazin}</b></Link> · {p.urmatorulPas ?? "pasul următor"} <small className={p.urmatorulPasLa! < new Date(Date.now() - 86_400_000) ? "err" : "muted"}>({day(p.urmatorulPasLa!)})</small>
                  {p.telefon && <> · <a href={`tel:${p.telefon}`}>{p.telefon}</a></>}</div>
                <form action={stepDoneAction} className="crm-inline">
                  <input type="hidden" name="id" value={p.id} /><input type="hidden" name="back" value="lista" /><input type="hidden" name="pas" value={p.urmatorulPas ?? ""} />
                  <button className="btn" name="amana" value="0">Făcut</button>
                  <button className="btn" name="amana" value="1">Amână 7 zile</button>
                </form>
              </li>
            ))}
          </ul>
        </div>
      )}

      {quiet.length > 0 && (
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Activi, dar fără vânzări de 30 de zile ({quiet.length})</h3>
          <p className="muted" style={{ marginTop: 0 }}>Pe ei îi suni: poate au rămas fără carduri, au uitat de ele sau le trebuie un afiș nou.</p>
          <ul className="crm-list">
            {quiet.map((p) => (
              <li key={p.id}>
                <div><Link href={`/admin/parteneri/${p.id}`}><b>{p.nume}</b></Link>{p.oras ? ` · ${p.oras}` : ""} · {p.last ? `ultima vânzare ${day(p.last)}` : "nicio vânzare încă"}
                  {p.telefon && <> · <a href={`tel:${p.telefon}`}>{p.telefon}</a></>}</div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <details className="card">
        <summary><b>Acoperire pe județe</b> · {covered} din {cov.length} județe au cel puțin un partener activ</summary>
        <div className="crm-cov">
          {cov.map((c) => (
            <Link key={c.code} href={keep({ judet: c.code })} className={c.activi ? "on" : c.inLucru ? "mid" : ""} title={`${c.name}: ${c.activi} activi, ${c.inLucru} în lucru, ${c.vandute} carduri vândute`}>
              <b>{c.name}</b><small>{c.activi} activi · {c.inLucru} în lucru</small>
            </Link>
          ))}
        </div>
      </details>

      <div className="crm-cards">
        {rows.map((p) => (
          <Link key={p.id} href={`/admin/parteneri/${p.id}`} className="card crm-card">
            <div className="crm-card-top">
              <b>{p.numeMagazin}</b>
              <span className={`crm-stage s-${p.etapa}`}>{STAGE_LABEL[p.etapa as Stage] ?? p.etapa}</span>
              {p.tip === "firma" && <span className="crm-stage">Firmă</span>}
            </div>
            <small className="muted">{[p.oras, p.judet ? COUNTIES[p.judet] : null].filter(Boolean).join(", ") || "fără oraș"}{p.categorie ? ` · ${CATEGORIES[p.categorie] ?? p.categorie}` : ""}</small>
            <small>{[p.persoanaContact, p.telefon, p.email].filter(Boolean).join(" · ") || "fără date de contact"}</small>
            <div className="crm-card-nums">
              <span><b>{p.vandute}</b> vândute</span><span><b>{p.activate}</b> activate</span><span><b>{refs.get(p.id) ?? 0}</b> conturi aduse</span>
              <span><b>{lei(p.comisionLei)}</b> comision</span><span title={p.steps.map((s) => `${s.done ? "✓" : "·"} ${s.label}`).join("\n")}><b>{p.onboarding}/5</b> pornire</span>
            </div>
            {p.urmatorulPas && <small>Următorul pas: {p.urmatorulPas}{p.urmatorulPasLa ? ` (${day(p.urmatorulPasLa)})` : ""}</small>}
          </Link>
        ))}
        {!rows.length && <p className="card muted">Niciun partener aici. Apasă „Adaugă partener” ca să începi.</p>}
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Raport lunar de plată</h3>
        <p className="muted" style={{ marginTop: 0 }}>
          Comisionul pe lună al fiecărui partener: cardurile vândute în luna aleasă × preț de raft × comision%, plus anii plătiți cu cardul,
          în aceeași lună, de conturile aduse prin legătura sau afișul lui × comision%. Descarcă CSV-ul pentru facturi.
        </p>
        <form method="get" className="crm-filters">
          <input type="month" name="luna" defaultValue={month} aria-label="Luna" />
          <button className="btn">Arată luna</button>
          <a className="btn" href={`/admin/parteneri/raport-lunar.csv?luna=${month}`}>Descarcă CSV ({month})</a>
        </form>
        <div className="tbl-wrap">
          <table className="tbl stacked">
            <thead><tr><th>Partener</th><th>Vândute</th><th>Activate</th><th>Încasări raft</th><th>Comision carduri</th><th>Conturi aduse</th><th>Plăți aduse</th><th>Comision recomandări</th><th>De plată</th></tr></thead>
            <tbody>
              {monthRows.filter((r) => r.vandute || r.activate || r.conturiAduse || r.platiAduse).map((r) => (
                <tr key={r.partnerId}>
                  <td>{r.nume}<small>{r.comisionProcent}%{r.tip === "firma" ? " · firmă" : ""}</small></td>
                  <td>{r.vandute}</td><td>{r.activate}</td><td>{lei(r.incasariLei)}</td><td>{lei(r.comisionCarduri)}</td>
                  <td>{r.conturiAduse}</td><td>{pl(r.platiAduse, "plată", "plăți")}<small>{lei(r.platiAduseLei)}</small></td><td>{lei(r.comisionRecomandari)}</td><td><b>{lei(r.total)}</b></td>
                </tr>
              ))}
              {!monthRows.some((r) => r.vandute || r.activate || r.conturiAduse || r.platiAduse) && <tr><td colSpan={9} className="muted">Nicio vânzare în luna aceasta.</td></tr>}
            </tbody>
          </table>
        </div>
        <p>Total de plată în {month}: <b>{lei(Math.round(monthTotal * 100) / 100)}</b></p>
      </div>
    </section>
  );
}
