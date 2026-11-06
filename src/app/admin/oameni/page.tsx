import Link from "next/link";
import { db } from "@/db";
import { requireAdmin } from "@/lib/admin-access";
import { adoptionOf, funnelOf, observations, peopleList, type PersonRow } from "@/lib/admin-people";
import { AdminNav, HBars, PlanPill, Stat, StagePill, ago, day, num } from "@/components/admin/ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "Oamenii · Admin" };

const DAY = 86_400_000;
const lastActive = (p: PersonRow) => [p.lastAction, p.lastSeen].filter(Boolean).sort().at(-1) ?? null;
const since = (iso: string | null, days: number) => !!iso && Date.now() - new Date(iso).getTime() <= days * DAY;

const FILTERS: Record<string, { label: string; ok: (p: PersonRow) => boolean }> = {
  toti: { label: "Toți", ok: () => true },
  "fara-arbore": { label: "Fără arbore", ok: (p) => p.trees === 0 },
  singuri: { label: "Singuri în arbore", ok: (p) => p.owned > 0 && (p.mainTree?.members ?? 0) < 2 },
  familie: { label: "Cu familia în arbore", ok: (p) => (p.mainTree?.members ?? 0) >= 2 },
  amintiri: { label: "Scriu amintiri", ok: (p) => p.memories > 0 },
  activi: { label: "Activi în 7 zile", ok: (p) => since(lastActive(p), 7) },
  dusi: { label: "Neintrați de 14 zile", ok: (p) => !since(lastActive(p), 14) },
};
const ORDERS: Record<string, { label: string; cmp: (a: PersonRow, b: PersonRow) => number }> = {
  noi: { label: "cei mai noi", cmp: (a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? "") },
  activi: { label: "ultima dată activi", cmp: (a, b) => (lastActive(b) ?? "").localeCompare(lastActive(a) ?? "") },
  arbore: { label: "arborele cel mai mare", cmp: (a, b) => (b.mainTree?.persons ?? 0) - (a.mainTree?.persons ?? 0) },
  amintiri: { label: "cele mai multe amintiri", cmp: (a, b) => b.memories - a.memories },
};

/** Oamenii: drumul tuturor de la cont la amintiri, ce folosesc și cifrele fiecăruia. Doar cifre, niciodată ce scriu. */
export default async function AdminPeople({ searchParams }: { searchParams: Promise<{ arata?: string; ordine?: string }> }) {
  await requireAdmin("/admin/oameni");
  const sp = await searchParams;
  const people = await peopleList(db);
  const show = FILTERS[sp.arata ?? ""] ? sp.arata! : "toti";
  const order = ORDERS[sp.ordine ?? ""] ? sp.ordine! : "noi";
  const list = people.filter(FILTERS[show].ok).sort(ORDERS[order].cmp);
  const total = people.length;
  const href = (arata: string, ordine: string) => `/admin/oameni?${new URLSearchParams({ ...(arata !== "toti" ? { arata } : {}), ...(ordine !== "noi" ? { ordine } : {}) })}`;

  return (
    <section className="stack">
      <AdminNav active="oameni" />

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Oamenii</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          Toți cei care și-au făcut cont, în afară de contul de probă. Aici sunt doar cifre: ce scriu oamenii în amintiri și în mesaje nu se vede, iar
          capitolul „Credința” nu e numărat deloc.
        </p>
        <div className="stats">
          <Stat label="Conturi" value={num(total)} hint={`${people.filter((p) => since(p.createdAt, 7)).length} noi în 7 zile`} />
          <Stat label="Cu arbore" value={num(people.filter((p) => p.trees > 0).length)} hint={`${people.filter((p) => p.owned > 0).length} și-au pornit unul`} />
          <Stat label="Activi în 7 zile" value={num(people.filter((p) => since(lastActive(p), 7)).length)} />
          <Stat label="S-au întors" value={num(people.filter((p) => p.returned).length)} hint="după prima zi" />
          <Stat label="Scriu amintiri" value={num(people.filter((p) => p.memories > 0).length)} />
          <Stat label="De pe telefon" value={num(people.filter((p) => p.phone).length)} hint="sau tabletă" />
        </div>
      </div>

      <div className="admin-zones">
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Drumul oamenilor</h3>
          <p className="muted" style={{ marginTop: 0 }}>Până unde au ajuns, din toate conturile. Unde scade mult, acolo se opresc.</p>
          <HBars label="Drumul oamenilor" data={funnelOf(people)} total={total} />
        </div>
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Ce folosesc</h3>
          <p className="muted" style={{ marginTop: 0 }}>Câți au făcut măcar o dată fiecare lucru.</p>
          <HBars label="Ce folosesc" data={adoptionOf(people)} total={total} />
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Ce se vede din cifre</h3>
        <ul className="obs">{observations(people).map((o) => <li key={o}>{o}</li>)}</ul>
        <p className="muted" style={{ marginBottom: 0 }}>
          Cât timp petrec oamenii în site și ce pagini îi interesează se va vedea aici doar la cei care spun „Bine” la anunțul despre asta.
        </p>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Fiecare om</h3>
        <nav className="filters" aria-label="Arată">
          <span className="section-label">Arată</span>
          {Object.entries(FILTERS).map(([k, f]) => (
            <Link key={k} href={href(k, order)} aria-current={show === k ? "page" : undefined}>{f.label} ({people.filter(f.ok).length})</Link>
          ))}
        </nav>
        <nav className="filters" aria-label="Ordine">
          <span className="section-label">Ordine</span>
          {Object.entries(ORDERS).map(([k, o]) => (
            <Link key={k} href={href(show, k)} aria-current={order === k ? "page" : undefined}>{o.label}</Link>
          ))}
        </nav>
        {list.length === 0 ? <p className="muted">Nimeni, deocamdată.</p> : (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Om</th><th>Unde a ajuns</th><th>Arborele lui</th><th className="n">A trecut</th><th className="n">Amintiri</th><th className="n">Poze</th>
                  <th className="n">Rude chemate</th><th className="n">Zile active</th><th>Ultima dată</th><th>Plan</th>
                </tr>
              </thead>
              <tbody>
                {list.map((p) => (
                  <tr key={p.id}>
                    <td><Link href={`/admin/oameni/${p.id}`}>{p.name}</Link><small>{p.email}</small><small>cont din {day(p.createdAt)}{p.phone ? " · telefon" : ""}</small></td>
                    <td><StagePill stage={p.stage} /></td>
                    <td>{p.mainTree ? <>{p.mainTree.name}<small>{num(p.mainTree.persons)} persoane · {p.mainTree.members} {p.mainTree.members === 1 ? "membru" : "membri"}{p.trees > 1 ? ` · în ${p.trees} arbori` : ""}</small></> : <span className="muted">—</span>}</td>
                    <td className="n">{num(p.personsAdded)}</td>
                    <td className="n">{num(p.memories)}{p.voices ? <small>{p.voices} cu glasul</small> : null}</td>
                    <td className="n">{num(p.photos)}</td>
                    <td className="n">{p.invites ? `${p.invitesAccepted}/${p.invites}` : "—"}</td>
                    <td className="n">{p.activeDays30}<small>din 30</small></td>
                    <td className="tight">{ago(lastActive(p))}</td>
                    <td><PlanPill plan={p.plan} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="muted" style={{ marginBottom: 0 }}>
          „A trecut” = câte persoane a adăugat el în arbori. „Rude chemate” = linkuri folosite din cele trimise. „Zile active” = zilele din ultimele 30 în
          care a intrat sau a adăugat ceva.
        </p>
      </div>
    </section>
  );
}
