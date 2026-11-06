import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { person, tree } from "@/db/schema";
import { can, requireUser, roleIn } from "@/lib/access";
import { isPlaceholder } from "@/lib/family";
import { persoane } from "@/lib/ro-words";
import InstallApp from "@/components/InstallApp";
import InvitePanel from "@/components/InvitePanel";

export const dynamic = "force-dynamic";
const UUID = /^[0-9a-f-]{36}$/i;

/**
 * Bun venit, după „Pornește arborele pas cu pas”: arborele e gata, iar aici sunt primii pași, în ordinea în care contează.
 * Întâi rudele (un link pentru toți și câte unul pentru fiecare om în viață, care intră direct pe fișa lui), apoi fișa și
 * povestea ta, apoi poveștile celor bătrâni, în modul „la bunici”.
 */
export default async function WelcomePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const me = await requireUser(`/arbore/${id}/bun-venit`);
  const role = await roleIn(db, id, me.id);
  if (!role) notFound();
  const [t] = await db.select({ name: tree.name }).from(tree).where(eq(tree.id, id));
  if (!t) notFound();
  const people = await db.select({ id: person.id, given: person.givenName, surname: person.surname, sex: person.sex, living: person.living, claimedBy: person.claimedByUserId })
    .from(person).where(eq(person.treeId, id)).orderBy(asc(person.birthFrom));
  const mine = people.find((p) => p.claimedBy === me.id);
  // Cei în viață fără cont, de la cel mai bătrân: pentru ei sunt linkurile pe nume și modul „la bunici”.
  const living = people.filter((p) => p.living && !p.claimedBy && !isPlaceholder(p.given));
  const name = (p: (typeof people)[number]) => [p.given, p.surname].filter(Boolean).join(" ");
  const base = `/arbore/${id}`;

  return (
    <div className="welcome">
      <section className="card welcome-hero">
        <div className="section-label" style={{ marginTop: 0 }}>Bun venit</div>
        <h2>Arborele „{t.name}” e gata</h2>
        <p>Are {persoane(people.length)}. De aici îl creșteți împreună: fiecare rudă adaugă ce știe, cu poze, acte și amintiri.</p>
        <div className="actions"><Link className="btn primary" href={base}>Vezi arborele</Link></div>
      </section>

      <div className="welcome-grid">
        {can(role, "editor") && (
          <section className="card">
            <h3>Cheamă-ți rudele</h3>
            <p className="muted">Fă un link și trimite-l pe WhatsApp sau pe email. Cine intră cu el vede arborele și își completează ramura.</p>
            <InvitePanel treeId={id} />
            {living.length > 0 && (
              <>
                <div className="section-label">Sau câte un link pentru fiecare</div>
                <p className="muted" style={{ marginTop: 0 }}>Cu linkul pe numele lui, omul intră direct pe fișa lui din arbore.</p>
                {living.map((p) => (
                  <details key={p.id} className="welcome-person">
                    <summary>Link pentru {name(p)}</summary>
                    <InvitePanel treeId={id} personId={p.id} personName={p.given || name(p)} />
                  </details>
                ))}
              </>
            )}
          </section>
        )}

        <div className="stack">
          {mine && (
            <section className="card">
              <h3>Fișa ta</h3>
              <p className="muted">Pune-ți o poză, locul nașterii și prima amintire în ladă. Rudele o văd când deschid arborele.</p>
              <div className="actions"><Link className="btn" href={`${base}/persoana/${mine.id}`}>Deschide fișa ta</Link></div>
            </section>
          )}
          {mine && (
            <section className="card">
              <h3>Povestea ta</h3>
              <p className="muted">Autobiografia, capitol cu capitol, cu întrebări care te ajută să-ți amintești. La sfârșit o poți tipări ca pe o carte.</p>
              <div className="actions"><Link className="btn" href={`${base}/persoana/${mine.id}/autobiografie`}>Începe autobiografia</Link></div>
            </section>
          )}
          {can(role, "contributor") && living.length > 0 && (
            <section className="card">
              <h3>Mergi „la bunici”</h3>
              <p className="muted">Stai lângă ei cu telefonul: tu citești întrebările, ei povestesc, iar glasul lor rămâne în lada familiei.</p>
              <div className="actions">
                {living.map((p) => <Link key={p.id} className="btn" href={`${base}/persoana/${p.id}/la-bunici`}>Cu {p.given || name(p)}</Link>)}
              </div>
            </section>
          )}
          <InstallApp />
        </div>
      </div>
    </div>
  );
}
