import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { requireAdmin } from "@/lib/admin-access";
import { personDetail } from "@/lib/admin-people";
import { PLANS } from "@/lib/plan-names";
import { AdminNav, Bars, PlanPill, Stat, StagePill, ago, day, num } from "@/components/admin/ui";
import { AccountPlanForm } from "@/components/admin/PlanForms";

export const dynamic = "force-dynamic";
export const metadata = { title: "Fișa unui om · Admin" };

const ROLE: Record<string, string> = { owner: "proprietar", editor: "editor", contributor: "contributor", viewer: "vizitator" };
const label = (week: string) => `${week.slice(8, 10)}.${week.slice(5, 7)}`;
const minutes = (s: number) => (s < 60 ? `${s} sec` : `${Math.round(s / 60)} min`);

/** Fișa unui om în panou: cât și-a crescut arborele, ce a făcut săptămână cu săptămână și de pe ce intră. Fără conținutul amintirilor. */
export default async function AdminPerson({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireAdmin(`/admin/oameni/${id}`);
  const d = await personDetail(db, id);
  if (!d) notFound();
  const p = d.person;
  const done = d.weeks.map((w) => ({ key: w.week, label: label(w.week), value: w.persoane + w.amintiri + w.poze + w.altele }));
  const visits = d.weeks.map((w) => ({ key: w.week, label: label(w.week), value: w.intrari }));

  return (
    <section className="stack">
      <AdminNav active="oameni" />
      <p style={{ margin: 0 }}><Link href="/admin/oameni">← Toți oamenii</Link></p>

      <div className="card">
        <div className="person-head">
          <h2>{p.name}</h2>
          <StagePill stage={p.stage} />
          <PlanPill plan={p.plan} />
        </div>
        <p className="muted" style={{ margin: "6px 0 12px" }}>
          {p.email}{p.verified ? " (verificat)" : ""} · intră cu {p.providers.replace("credential", "parolă") || "—"} · cont din {day(p.createdAt, true)} ·
          ultima dată activ {ago([p.lastAction, p.lastSeen].filter(Boolean).sort().at(-1) ?? null)}
        </p>
        <div className="stats">
          <Stat label="Persoane trecute" value={num(p.personsAdded)} hint={p.mainTree ? `arborele lui are ${num(p.mainTree.persons)}` : "n-are arbore"} />
          <Stat label="Amintiri" value={num(p.memories)} hint={[p.ownStory ? `${p.ownStory} din autobiografie` : "", p.helper ? `${p.helper} „la bunici”` : ""].filter(Boolean).join(" · ") || "fără capitolul „Credința”"} />
          <Stat label="Cu glasul" value={num(p.voices)} hint={p.voiceSeconds ? `${minutes(p.voiceSeconds)} înregistrate` : undefined} />
          <Stat label="Poze" value={num(p.photos)} />
          <Stat label="Rude chemate" value={p.invites ? `${p.invitesAccepted}/${p.invites}` : "0"} hint="linkuri folosite / trimise" />
          <Stat label="Mesaje trimise" value={num(p.messages)} hint={`${p.replies} „Și eu îmi amintesc” · ${p.questions} întrebări`} />
          <Stat label="Zile active" value={`${p.activeDays30}/30`} hint={`${p.sessions} intrări în cont`} />
        </div>
      </div>

      <div className="admin-zones">
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Ce a făcut, pe săptămâni</h3>
          <p className="muted" style={{ marginTop: 0 }}>Persoane, amintiri, poze, mesaje, invitații (ultimele 12 săptămâni).</p>
          <Bars label="Ce a făcut pe săptămâni" data={done} />
        </div>
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Intrări în cont, pe săptămâni</h3>
          <p className="muted" style={{ marginTop: 0 }}>De câte ori a intrat din nou (o intrare ține câteva zile).</p>
          <Bars label="Intrări în cont pe săptămâni" data={visits} />
        </div>
      </div>

      {d.growth.length > 1 && (
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Cum a crescut „{p.mainTree?.name}”</h3>
          <p className="muted" style={{ marginTop: 0 }}>Câte persoane avea arborele la sfârșitul fiecărei săptămâni în care s-a adăugat cineva (de toți membrii).</p>
          <Bars label="Persoane în arbore" data={d.growth.map((g) => ({ key: g.week, label: label(g.week), value: g.total }))} />
        </div>
      )}

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Arborii lui</h3>
        {d.trees.length === 0 ? <p className="muted" style={{ marginBottom: 0 }}>N-are încă niciun arbore.</p> : (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>Arbore</th><th>Rol</th><th className="n">Persoane</th><th className="n">Trecute de el</th><th className="n">Membri</th><th className="n">Fișiere</th><th>Ultima schimbare</th></tr></thead>
              <tbody>
                {d.trees.map((t) => (
                  <tr key={t.id}>
                    <td><Link href={`/arbore/${t.id}`}>{t.name}</Link><small>{t.owner ? `pornit ${day(t.createdAt)}` : `intrat ${day(t.joinedAt)}`}</small></td>
                    <td>{ROLE[t.role] ?? t.role}</td>
                    <td className="n">{num(t.persons)}</td>
                    <td className="n">{num(t.byHim)}</td>
                    <td className="n">{num(t.members)}</td>
                    <td className="n">{num(t.files)}</td>
                    <td className="tight">{ago(t.lastEdit)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="muted" style={{ marginBottom: 0 }}>Arborele se deschide doar dacă ești și tu membru în el.</p>
      </div>

      <div className="admin-zones">
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Despre ce scrie</h3>
          {d.chapters.length === 0 ? <p className="muted" style={{ marginBottom: 0 }}>Încă nicio amintire.</p> : (
            <div className="chips" style={{ margin: 0 }}>
              {d.chapters.map((c) => <span key={c.label} className="chip">{c.label}: {c.count}</span>)}
            </div>
          )}
          <p className="muted" style={{ marginBottom: 0 }}>Doar câte amintiri are în fiecare capitol, nu ce scrie. „Credința” nu e numărată.</p>
        </div>
        <div className="card">
          <h3 style={{ marginTop: 0 }}>De pe ce intră</h3>
          {d.devices.length === 0 ? <p className="muted" style={{ marginBottom: 0 }}>Nicio intrare păstrată.</p> : (
            <table className="tbl">
              <tbody>
                {d.devices.map((x) => <tr key={x.label}><td>{x.label}</td><td className="n">{x.sessions} {x.sessions === 1 ? "intrare" : "intrări"}</td><td className="tight">{ago(x.last)}</td></tr>)}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Planul lui</h3>
        <p className="muted" style={{ marginTop: 0 }}>{PLANS[p.plan].label}: {PLANS[p.plan].hint}. Nu se vede nicăieri în site cât timp plățile nu sunt pornite.</p>
        <AccountPlanForm userId={p.id} plan={p.plan} note={p.planNote} />
      </div>
    </section>
  );
}
