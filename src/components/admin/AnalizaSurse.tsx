import Link from "next/link";
import { db } from "@/db";
import { answersReport, labelOfSource as labelOf, linkNames, sourcesReport, type Range } from "@/lib/sursa";
import { ANSWER_LABEL, isAnswer } from "@/lib/sursa-shared";
import { HBars, Stat, lei, num } from "@/components/admin/ui";

const pct = (a: number, b: number) => (b ? `${Math.round((1000 * a) / b) / 10}%` : "—");

/**
 * Admin → Analiză → Surse (Daniel, 16.11.2026; src/lib/sursa.ts): pentru fiecare sursă, vizitatorii (anonimi, fără cookie-uri),
 * conturile create (după prima sursă, doar la cei care au acceptat cookie-urile de analiză), câte au arbore, câte au plătit,
 * rata de conversie și veniturile. Plus top 10 după conturi și răspunsurile la „De unde ai aflat de noi?”.
 */
export async function Sources({ cur }: { cur: Range }) {
  const [rows, answers, names] = await Promise.all([sourcesReport(db, cur), answersReport(db, cur), linkNames(db)]);
  const labelOfSource = (k: string) => labelOf(k, names.get(k));
  const tot = rows.reduce((a, r) => ({ visitors: a.visitors + r.visitors, accounts: a.accounts + r.accounts, trees: a.trees + r.trees, paid: a.paid + r.paid, lei: a.lei + r.lei, eur: a.eur + r.eur }),
    { visitors: 0, accounts: 0, trees: 0, paid: 0, lei: 0, eur: 0 });
  const top = rows.filter((r) => r.accounts > 0).slice(0, 10);
  const money = (l: number, e: number) => [l ? lei(l) : "", e ? `${e} €` : ""].filter(Boolean).join(" + ") || "—";
  const known = rows.filter((r) => r.accounts && r.key !== "necunoscut" && r.key !== "fara-acord").reduce((a, r) => a + r.accounts, 0);
  return (
    <>
      <div className="stats">
        <Stat label="Vizitatori" value={num(tot.visitors)} hint="unici pe zi, toate sursele" />
        <Stat label="Conturi create" value={num(tot.accounts)} hint={`${num(known)} cu sursa știută`} />
        <Stat label="Cu arbore" value={num(tot.trees)} hint={pct(tot.trees, tot.accounts)} />
        <Stat label="Plătite" value={num(tot.paid)} hint={money(tot.lei, tot.eur)} />
        <Stat label="Rata de conversie" value={pct(tot.accounts, tot.visitors)} hint="conturi din vizitatori" />
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Fiecare sursă</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          Vizitatorii vin din numărarea anonimă (prima pagină a zilei). Conturile se trec la <b>prima</b> lor sursă; arborii, plățile și veniturile sunt ale
          acestor conturi (plățile oricând după). „Fără acord” = conturi noi care n-au acceptat cookie-urile de analiză (le vezi răspunsul mai jos).
        </p>
        {rows.length === 0 ? <p className="muted" style={{ marginBottom: 0 }}>Nimic în această perioadă.</p> : (
          <div className="an-scroll">
            <table className="an-table">
              <thead><tr><th>Sursa</th><th>Vizitatori</th><th>Conturi create</th><th>Cu arbore</th><th>Plătite</th><th>Rata de conversie</th><th>Venituri</th></tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.key}>
                    <td>{r.accounts ? <Link href={`/admin/oameni?sursa=${encodeURIComponent(r.key)}`}>{labelOfSource(r.key)}</Link> : labelOfSource(r.key)}</td>
                    <td>{num(r.visitors)}</td>
                    <td><b>{num(r.accounts)}</b></td>
                    <td>{num(r.trees)}{r.accounts ? <small className="muted"> {pct(r.trees, r.accounts)}</small> : null}</td>
                    <td>{num(r.paid)}{r.accounts ? <small className="muted"> {pct(r.paid, r.accounts)}</small> : null}</td>
                    <td>{r.rate == null ? "—" : `${r.rate}%`}</td>
                    <td>{money(r.lei, r.eur)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="muted" style={{ fontSize: 13, marginBottom: 0 }}>Rata de conversie = conturi create din vizitatori. Sub fiecare cifră de arbori și plăți: procentul din conturile acelei surse.</p>
      </div>

      <div className="an-grid">
        <div className="card">
          <h2 style={{ marginTop: 0 }}>Top 10 surse după conturi create</h2>
          {top.length ? <HBars label="Top surse după conturi" total={tot.accounts} data={top.map((r) => ({ label: labelOfSource(r.key), count: r.accounts }))} />
            : <p className="muted" style={{ marginBottom: 0 }}>Niciun cont nou în această perioadă.</p>}
        </div>
        <div className="card">
          <h2 style={{ marginTop: 0 }}>„De unde ai aflat de noi?”</h2>
          <p className="muted" style={{ marginTop: 0 }}>Răspunsurile din formularul de cont (opțional), la conturile noi din perioadă. Se păstrează și fără acordul pentru cookie-uri.</p>
          {answers.total ? (
            <>
              <HBars label="Răspunsurile" total={answers.total}
                data={answers.counts.map((x) => ({ label: isAnswer(x.key) ? ANSWER_LABEL[x.key] : "N-a răspuns", count: x.count }))} />
              {answers.others.length > 0 && (
                <>
                  <div className="section-label">Ce au scris la „Altceva”</div>
                  <ul className="obs">{answers.others.map((o, i) => <li key={i}>„{o}”</li>)}</ul>
                </>
              )}
            </>
          ) : <p className="muted" style={{ marginBottom: 0 }}>Încă niciun cont nou de când există întrebarea.</p>}
        </div>
      </div>
      <p className="muted" style={{ fontSize: 13 }}>Linkurile cu sursă le faci în <Link href="/admin/linkuri">Admin → Linkuri cu sursă</Link>, unde vezi click-urile și conturile fiecăruia.</p>
    </>
  );
}
