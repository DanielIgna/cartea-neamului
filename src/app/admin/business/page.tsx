import Link from "next/link";
import { db } from "@/db";
import { requireAdmin } from "@/lib/admin-access";
import { businessStats } from "@/lib/admin-stats";
import { FREE_PERSONS, PRICE_EUR_YEAR } from "@/lib/admin";
import { AdminNav, Bars, Stat, Status, ago, day, eur, lei, num } from "@/components/admin/ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "Business · Admin" };

const BOOK_STATUS: Record<string, string> = { draft: "ciornă", paid: "plătită", rendering: "în lucru", ready: "gata", failed: "eșuată" };
const pct = (a: number, b: number) => (b ? `${Math.round((100 * a) / b)}%` : "—");

/** Zona Business: creșterea, folosirea și banii. Nu schimbă nimic, doar citește. */
export default async function AdminBusiness() {
  await requireAdmin("/admin/business");
  const b = await businessStats(db);
  const c = b.content;
  return (
    <section className="stack">
      <AdminNav active="business" />

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Oameni</h2>
        <div className="stats">
          <Stat label="Conturi" value={num(b.users.total)} hint={`${b.users.verified} cu emailul verificat`} />
          <Stat label="Noi în 7 zile" value={num(b.users.new7)} hint={`${b.users.new30} în 30 de zile`} />
          <Stat label="Activi azi" value={num(b.users.active1)} />
          <Stat label="Activi în 7 zile" value={num(b.users.active7)} hint={`${pct(b.users.active7, b.users.total)} din conturi`} />
          <Stat label="Activi în 30 de zile" value={num(b.users.active30)} />
          <Stat label="Intră cu Google" value={num(b.users.google)} />
        </div>
        <div className="section-label">Conturi noi pe săptămână (ultimele 12)</div>
        <Bars label="Conturi noi pe săptămână" data={b.signupsByWeek.map((w) => ({ key: w.week, label: w.week.slice(8, 10) + "." + w.week.slice(5, 7), value: w.c }))} />
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Arbori și conținut</h2>
        <div className="stats">
          <Stat label="Arbori" value={num(b.trees.total)} hint={`${b.trees.shared} cu mai mulți membri`} />
          <Stat label="Pot fi găsiți" value={num(b.trees.discoverable)} hint="„Din aceleași locuri”" />
          <Stat label="Persoane" value={num(c.persons)} hint={`în medie ${b.trees.avgPersons}, maxim ${b.trees.maxPersons} pe arbore`} />
          <Stat label="Fișe revendicate" value={num(c.claimed)} hint={`${c.living} persoane în viață`} />
          <Stat label="Documente" value={num(c.documents)} hint={`${c.photos} poze`} />
          <Stat label="Mesaje" value={num(c.messages)} hint={`${c.messages7} în 7 zile`} />
          <Stat label="Invitații acceptate" value={`${num(c.invites_accepted)}/${num(c.invites)}`} />
          <Stat label="Intrări după nume" value={num(c.joins_accepted)} hint={c.joins_pending ? `${c.joins_pending} așteaptă răspuns` : "nicio cerere în așteptare"} tone={c.joins_pending ? "warn" : undefined} />
          <Stat label="Legături între sate" value={`${num(c.contacts_accepted)}/${num(c.contacts)}`} hint="acceptate / cerute" />
        </div>
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Bani</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          Planul propus: gratuit până la {FREE_PERSONS} de persoane pe arbore, apoi „Familie” {PRICE_EUR_YEAR} €/an pe arbore. Plățile nu sunt încă pornite,
          așa că cifrele de abonamente arată ce ar aduce planul dacă ar fi pornit azi.
        </p>
        <div className="stats">
          <Stat label="Abonamente active" value={num(b.revenue.subscriptionsActive)} hint="plățile nu sunt pornite" />
          <Stat label="Arbori peste limită" value={num(b.trees.overLimit)} hint={`≥ ${FREE_PERSONS} persoane`} tone={b.trees.overLimit ? "ok" : undefined} />
          <Stat label="Aproape de limită" value={num(b.trees.nearLimit)} hint={`${Math.round(FREE_PERSONS * 0.75)}–${FREE_PERSONS - 1} persoane`} />
          <Stat label="Venit posibil pe an" value={eur(b.revenue.potentialEurYear)} hint="arborii peste limită × 12 €" />
          <Stat label="Cărți plătite" value={lei(b.revenue.booksLei)} />
        </div>
        {b.books.length > 0 && (
          <p className="muted" style={{ marginBottom: 0 }}>Cărți comandate: {b.books.map((x) => `${x.count} ${BOOK_STATUS[x.status] ?? x.status}`).join(", ")}.</p>
        )}
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Cei mai mari arbori</h2>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>Arbore</th><th>Proprietar</th><th className="n">Persoane</th><th className="n">Membri</th><th className="n">Documente</th><th>Ultima schimbare</th><th>Plan</th></tr></thead>
            <tbody>
              {b.topTrees.map((t) => (
                <tr key={t.id}>
                  <td><Link href={`/arbore/${t.id}`}>{t.name}</Link><small>creat {day(t.createdAt)}{t.discoverable ? " · poate fi găsit" : ""}</small></td>
                  <td>{t.owner}<small>{t.ownerEmail}</small></td>
                  <td className="n">{num(t.persons)}</td>
                  <td className="n">{num(t.members)}</td>
                  <td className="n">{num(t.documents)}</td>
                  <td>{ago(t.lastEdit)}</td>
                  <td>{t.persons >= FREE_PERSONS ? <Status ok>Familie</Status> : <span className="muted">gratuit</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Conturi noi</h2>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>Nume</th><th>Intră cu</th><th className="n">Arbori</th><th>Cont creat</th><th>Ultima vizită</th></tr></thead>
            <tbody>
              {b.recentUsers.map((u) => (
                <tr key={u.id}>
                  <td>{u.name}<small>{u.email}</small></td>
                  <td>{u.providers.replace("credential", "parolă") || "—"}</td>
                  <td className="n">{num(u.trees)}</td>
                  <td>{day(u.createdAt)}</td>
                  <td>{ago(u.lastSeen)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
