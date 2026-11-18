import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { requireAdmin } from "@/lib/admin-access";
import { personDetail } from "@/lib/admin-people";
import { consentState } from "@/lib/consent";
import { answerLabel, labelOfSource, personSource } from "@/lib/sursa";
import { countryName } from "@/lib/analiza";
import { duration, usageOf } from "@/lib/usage";
import { inZile } from "@/lib/ro-words";
import { PLANS } from "@/lib/plan-names";
import { isOwnerEmail } from "@/lib/admin";
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
  const [answer, time, src] = await Promise.all([consentState(db, id, "usage"), usageOf(db, id, 30), personSource(db, id)]);
  const share = (a: number) => (time.total ? `${Math.round((100 * a) / time.total)}%` : "—");
  const p = d.person;
  const done = d.weeks.map((w) => ({ key: w.week, label: label(w.week), value: w.persoane + w.amintiri + w.poze + w.altele }));
  const visits = d.weeks.map((w) => ({ key: w.week, label: label(w.week), value: w.intrari }));

  return (
    <section className="stack">
      <AdminNav active="oameni" heading={false} />
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

      <SourceCard src={src} />

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

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Cât timp petrece și unde (30 de zile)</h3>
        {!answer.granted ? (
          <p className="muted" style={{ marginBottom: 0 }}>
            {answer.at ? `A spus „Nu vreau” pe ${day(answer.at.toISOString())}, așa că nu se măsoară nimic.` : "N-a răspuns încă la anunț, așa că nu se măsoară nimic."}
          </p>
        ) : (
          <>
            <div className="stats">
              <Stat label="Timp în total" value={duration(time.total)} hint={inZile(time.activeDays)} />
              <Stat label="Pe zi" value={duration(time.activeDays ? Math.round(time.total / time.activeDays) : 0)} hint="în zilele în care intră" />
              <Stat label="Pagini deschise" value={num(time.views)} />
              <Stat label="De pe telefon" value={share(time.phone)} hint={`${share(time.app)} în aplicație`} />
            </div>
            <div className="section-label">Minute pe zi</div>
            <Bars label="Minute pe zi" format={(s) => (s < 60 ? "<1" : String(Math.round(s / 60)))}
              data={time.days.map((x) => ({ key: x.day, label: `${x.day.slice(8, 10)}.${x.day.slice(5, 7)}`, value: x.seconds }))} />
            {time.sections.length > 0 && (
              <>
                <div className="section-label">Unde stă</div>
                <div className="chips" style={{ margin: 0 }}>
                  {time.sections.map((x) => <span key={x.section} className="chip">{x.label}: {duration(x.seconds)}</span>)}
                </div>
              </>
            )}
          </>
        )}
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
        {(p.plan === "mereu" || isOwnerEmail(p.email)) && (
          <p style={{ marginTop: 0 }}><span className="pill ok">✓ Acces gratuit</span>{" "}
            {isOwnerEmail(p.email) ? "Proprietar al site-ului: toate planurile și cartea PDF, din cod." : `Toate planurile și cartea PDF, fără termen.${p.planNote ? ` Nota: ${p.planNote}` : ""}`}</p>
        )}
        <p className="muted" style={{ marginTop: 0 }}>{PLANS[p.plan].label}: {PLANS[p.plan].hint}. Pentru „Acces gratuit”, alege-l în prima listă și scrie în notă de ce (de ex. „fratele meu”).</p>
        <AccountPlanForm userId={p.id} plan={p.plan} note={p.planNote} />
        <p style={{ marginBottom: 0 }}><Link href={`/admin/istoric?om=${p.id}#limite`}>Ce a schimbat în arbori și limitele lui de editare ▸</Link></p>
      </div>
    </section>
  );
}

/** De unde a venit: tot drumul până la cont (src/lib/sursa.ts). Sursa și drumul doar dacă omul acceptase cookie-urile de analiză. */
function SourceCard({ src }: { src: Awaited<ReturnType<typeof personSource>> }) {
  const r = src.row;
  const when = (d: Date | null | undefined) => (d ? day(d.toISOString(), true) : null);
  const touch = (o: { source: string | null; src: string | null; medium: string | null; campaign: string | null; referrer: string | null; landing: string | null; at: Date | null }) => (
    <table className="tbl">
      <tbody>
        <tr><td>Sursa</td><td><b>{labelOfSource(o.source ?? "direct")}</b>{o.src ? <small>link ?src={o.src}</small> : null}</td></tr>
        <tr><td>Campania</td><td>{[o.campaign, o.medium].filter(Boolean).join(" · ") || <span className="muted">—</span>}</td></tr>
        <tr><td>Referrer</td><td>{o.referrer ?? <span className="muted">direct (fără site din care să fi apăsat)</span>}</td></tr>
        <tr><td>Pagina de intrare</td><td>{o.landing ? <code>{o.landing}</code> : <span className="muted">—</span>}</td></tr>
        <tr><td>Când</td><td>{when(o.at) ?? <span className="muted">—</span>}</td></tr>
      </tbody>
    </table>
  );
  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>De unde a venit</h3>
      {!r ? (
        <p className="muted" style={{ marginBottom: 0 }}>Necunoscut: contul e făcut înainte să notăm sursa (16 noiembrie 2026).</p>
      ) : (
        <>
          <div className="stats">
            <Stat label="Sursa" value={<span style={{ fontSize: 20 }}>{labelOfSource(src.key, src.linkName)}</span>} />
            <Stat label="Răspunsul lui" value={<span style={{ fontSize: 18 }}>{answerLabel(r.answer, r.answerOther) ?? "n-a răspuns"}</span>} hint={r.answerAuto ? "pus singur: a venit prin invitație" : "„De unde ai aflat de noi?”"} />
            <Stat label="Dispozitiv și țară" value={<span style={{ fontSize: 18 }}>{r.analytics ? [r.device, r.country ? countryName(r.country) : null].filter(Boolean).join(" · ") || "—" : "—"}</span>} />
            <Stat label="Cookie-uri de analiză" value={r.analytics ? "acceptate" : "neacceptate"} hint={`cont din ${day(r.createdAt.toISOString())}`} />
          </div>
          {r.invite && <p style={{ margin: "10px 0 0" }}>A venit prin legătura de invitație a unei rude sau a unui prieten (recomandare).</p>}
          {r.analytics ? (
            <div className="admin-zones" style={{ marginTop: 12 }}>
              <div>
                <div className="section-label">Prima sursă (first-touch)</div>
                {touch({ source: r.source, src: r.firstSrc, medium: r.firstMedium, campaign: r.firstCampaign, referrer: r.firstReferrer, landing: r.firstLanding, at: r.firstAt })}
              </div>
              <div>
                <div className="section-label">Ultima sursă înainte de cont (last-touch)</div>
                {touch({ source: r.lastSource, src: r.lastSrc, medium: r.lastMedium, campaign: r.lastCampaign, referrer: r.lastReferrer, landing: r.lastLanding, at: r.lastAt })}
              </div>
            </div>
          ) : (
            <p className="muted" style={{ marginBottom: 0 }}>N-a acceptat cookie-urile de analiză, așa că păstrăm doar răspunsul lui din formular.</p>
          )}
        </>
      )}
    </div>
  );
}
