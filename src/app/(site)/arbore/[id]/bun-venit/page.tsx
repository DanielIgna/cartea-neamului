import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { person, tree } from "@/db/schema";
import { can, requireUser, roleIn } from "@/lib/access";
import { isPlaceholder } from "@/lib/family";
import InstallApp from "@/components/InstallApp";
import InvitePanel from "@/components/InvitePanel";
import { getT } from "@/i18n/server";

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
  const tr = await getT("Welcome");

  return (
    <div className="welcome">
      <section className="card welcome-hero">
        <div className="section-label" style={{ marginTop: 0 }}>{tr("label")}</div>
        <h2>{tr("title", { tree: t.name })}</h2>
        <p>{tr("text", { count: people.length })}</p>
        <div className="actions"><Link className="btn primary" href={base}>{tr("seeTree")}</Link></div>
      </section>

      <div className="welcome-grid">
        {can(role, "editor") && (
          <section className="card">
            <h3>{tr("inviteTitle")}</h3>
            <p className="muted">{tr("inviteText")}</p>
            <InvitePanel treeId={id} />
            {living.length > 0 && (
              <>
                <div className="section-label">{tr("eachLabel")}</div>
                <p className="muted" style={{ marginTop: 0 }}>{tr("eachText")}</p>
                {living.map((p) => (
                  <details key={p.id} className="welcome-person">
                    <summary>{tr("linkFor", { name: name(p) })}</summary>
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
              <h3>{tr("mineTitle")}</h3>
              <p className="muted">{tr("mineText")}</p>
              <div className="actions"><Link className="btn" href={`${base}/persoana/${mine.id}`}>{tr("mineButton")}</Link></div>
            </section>
          )}
          {mine && (
            <section className="card">
              <h3>{tr("storyTitle")}</h3>
              <p className="muted">{tr("storyText")}</p>
              <div className="actions"><Link className="btn" href={`${base}/persoana/${mine.id}/autobiografie`}>{tr("storyButton")}</Link></div>
            </section>
          )}
          {can(role, "contributor") && living.length > 0 && (
            <section className="card">
              <h3>{tr("grandTitle")}</h3>
              <p className="muted">{tr("grandText")}</p>
              <div className="actions">
                {living.map((p) => <Link key={p.id} className="btn" href={`${base}/persoana/${p.id}/la-bunici`}>{tr("grandWith", { name: p.given || name(p) })}</Link>)}
              </div>
            </section>
          )}
          <InstallApp />
        </div>
      </div>
    </div>
  );
}
