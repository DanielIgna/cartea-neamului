import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { requireAdmin } from "@/lib/admin-access";
import { AdminNav } from "@/components/admin/ui";
import { batchById, batchCards, lotLabel, pl, STATUS_LABEL, SOLDABLE, type CardStatus } from "@/lib/carduri-cadou";
import { cardAction } from "@/app/carduri-actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Lot de carduri · Admin" };

const when = (d: Date | null) => d ? new Intl.DateTimeFormat("ro", { dateStyle: "short", timeStyle: "short", timeZone: "Europe/Bucharest" }).format(d) : "";
const PLAN: Record<string, string> = { basic: "Basic", familie: "Familie", premium: "Premium" };

/** Un lot: fiecare cod cu starea lui, marcarea pe tot lotul sau pe un interval (numerele de pe card) și pe un singur cod. */
export default async function AdminCardLot({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { id } = await params;
  await requireAdmin(`/admin/carduri/lot/${id}`);
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const q = await searchParams;
  const b = await batchById(db, id);
  if (!b) notFound();
  const cards = await batchCards(db, id);
  const here = `/admin/carduri/lot/${id}`;
  const bulk = (what: string, label: string, primary = false) => (
    <form action={cardAction} style={{ display: "inline" }}>
      <input type="hidden" name="back" value={here} /><input type="hidden" name="batchId" value={id} /><input type="hidden" name="what" value={what} />
      <button className={`btn${primary ? " primary" : ""}`}>{label}</button>
    </form>
  );
  return (
    <section className="stack">
      <AdminNav active="carduri" />
      <p><Link href="/admin/carduri">← Carduri cadou</Link></p>
      {q.eroare && <p className="err" role="alert">{q.eroare}</p>}
      {q.ok && <p className="cc-ok" role="status">{q.ok}</p>}
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Lotul {lotLabel(id)} pentru {b.partner}</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          {pl(b.cantitate, "card", "carduri")} · plan {PLAN[b.plan] ?? b.plan} · {pl(b.durataLuni, "lună", "luni")} · {b.pretRaftLei} lei pe raft · generat {when(b.createdAt)}
        </p>
        <div className="actions">
          <Link className="btn primary" href={`${here}/tipar`}>PDF de tipar (carduri 85×55 mm)</Link>
          <a className="btn" href={`${here}/csv`}>Descarcă CSV</a>
        </div>
        <h4>Pe tot lotul</h4>
        <div className="actions" style={{ marginTop: 0 }}>
          {bulk("livrat", "Marchează livrat magazinului")}
          {bulk("vandut", "Marchează tot lotul vândut")}
          {bulk("anulat", "Anulează tot lotul")}
        </div>
        <h4>Pe un interval (numerele „Nr.” de pe card)</h4>
        <form action={cardAction} className="form limits-form">
          <input type="hidden" name="back" value={here} /><input type="hidden" name="batchId" value={id} />
          <div className="limits-row">
            <label>De la nr.<input name="from" type="number" min={1} max={b.cantitate} required /></label>
            <label>Până la nr.<input name="to" type="number" min={1} max={b.cantitate} required /></label>
          </div>
          <div className="actions" style={{ marginTop: 0 }}>
            <button className="btn primary" name="what" value="vandut">Marchează vândute</button>
            <button className="btn" name="what" value="livrat">Marchează livrate</button>
            <button className="btn" name="what" value="anulat">Anulează</button>
          </div>
        </form>
      </div>
      <div className="card">
        <div className="tbl-wrap">
          <table className="tbl stacked">
            <thead><tr><th>Nr.</th><th>Cod</th><th>Stare</th><th>Vândut</th><th>Folosit</th><th></th></tr></thead>
            <tbody>
              {cards.map((c) => (
                <tr key={c.id} style={c.status === "anulat" ? { opacity: 0.55 } : undefined}>
                  <td>{c.seq}</td>
                  <td><code>{c.cod}</code></td>
                  <td>{STATUS_LABEL[c.status as CardStatus] ?? c.status}</td>
                  <td>{when(c.soldAt)}</td>
                  <td>{when(c.redeemedAt)}</td>
                  <td>
                    {(SOLDABLE as string[]).includes(c.status) && (
                      <form action={cardAction} style={{ display: "inline" }}>
                        <input type="hidden" name="back" value={here} /><input type="hidden" name="cod" value={c.cod} />
                        <button className="btn" name="what" value="vandut">Vândut</button>
                      </form>
                    )}{" "}
                    {c.status !== "folosit" && c.status !== "anulat" && (
                      <form action={cardAction} style={{ display: "inline" }}>
                        <input type="hidden" name="back" value={here} /><input type="hidden" name="cod" value={c.cod} />
                        <button className="btn" name="what" value="anulat">Anulează</button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
