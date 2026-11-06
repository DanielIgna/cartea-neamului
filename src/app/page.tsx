import Link from "next/link";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { tree, treeMember } from "@/db/schema";
import { currentUser } from "@/lib/access";
import FamilyStart from "@/components/FamilyStart";
import GedcomImport from "@/components/GedcomImport";
import InstallApp from "@/components/InstallApp";
import JoinTree from "@/components/JoinTree";
import { myJoinRequests } from "@/lib/join";
import { persoane } from "@/lib/ro-words";

export const dynamic = "force-dynamic";

const ROLE: Record<string, string> = { owner: "proprietar", editor: "editor", contributor: "contributor", viewer: "vizitator" };

const FEATURES = [
  { title: "Arborele și spițele", text: "Vezi neamul cum vrei: din tată în tată, dinspre fiecare părinte, ca o clepsidră sau ca un copac întreg, de jur împrejur." },
  { title: "Lada cu amintiri", text: "Povești, poze și glasul bunicilor, înregistrat cu telefonul. În fiecare duminică vine o întrebare nouă, care te ajută să-ți amintești." },
  { title: "Harta neamului", text: "Satele din care vin ai tăi, pe hartă. Dacă vrei, afli și ce alte familii vin din aceleași locuri." },
  { title: "Cartea neamului", text: "La sfârșit, familia își tipărește cartea: arborele, poveștile și pozele, cu coduri QR pe care le scanezi ca să asculți glasul bunicilor." },
];

/** Prima pagină pentru cine n-are încă un cont: ce e Cartea Neamului și cum începi, în trei pași. */
function Landing({ deleted }: { deleted: boolean }) {
  return (
    <div className="landing">
      {deleted && <p className="notice" role="status">Contul tău a fost șters, cu tot ce era al tău. Îți mulțumim că ai fost cu noi.</p>}
      <section className="card landing-hero">
        <h2>Arborele familiei, construit împreună</h2>
        <p>Pornești de la tine, chemi rudele, iar fiecare completează ramura lui cu nume, poze, acte și amintiri. La sfârșit, familia își tipărește cartea neamului.</p>
        <div className="actions"><Link className="btn primary" href="/intrare?mod=cont-nou">Creează cont gratuit</Link><Link className="btn" href="/intrare">Intră în cont</Link></div>
      </section>
      <section className="landing-grid" aria-label="Ce găsești aici">
        {FEATURES.map((f) => <div key={f.title} className="card"><h3>{f.title}</h3><p>{f.text}</p></div>)}
      </section>
      <section className="card">
        <h3>Cum începi</h3>
        <ol className="landing-steps">
          <li><b>Îți faci cont.</b> E gratuit și durează un minut.</li>
          <li><b>Scrii ce știi:</b> pe tine, pe părinți și pe bunici. Ce nu știi lași gol.</li>
          <li><b>Îți chemi rudele</b> cu un link pe WhatsApp. Fiecare adaugă ce știe el, iar arborele crește.</li>
        </ol>
        <p className="muted">Arborele îl văd doar rudele pe care le chemi tu. Despre datele voastre: <Link href="/confidentialitate">Confidențialitate</Link>.</p>
        <div className="actions"><Link className="btn primary" href="/intrare?mod=cont-nou">Pornește arborele</Link></div>
      </section>
    </div>
  );
}

export default async function Home({ searchParams }: { searchParams: Promise<{ cont?: string }> }) {
  const me = await currentUser();
  const deleted = (await searchParams).cont === "sters";
  if (!me) return <Landing deleted={deleted} />;
  const trees = await db.select({ id: tree.id, name: tree.name, region: tree.region, role: treeMember.role, count: sql<number>`(select count(*) from person p where p.tree_id = ${tree.id})::int` })
    .from(treeMember).innerJoin(tree, eq(tree.id, treeMember.treeId)).where(eq(treeMember.userId, me.id)).orderBy(desc(tree.createdAt));
  const requests = (await myJoinRequests(db, me.id)).map((j) => ({ ...j, at: j.at.toISOString() }));

  // Fără niciun arbore: întâi pornirea pas cu pas; alături, căutarea în arborii rudelor și aducerea unui fișier GEDCOM.
  if (trees.length === 0) {
    return (
      <div className="layout">
        <section className="card start-card">
          <h2>Pornește-ți arborele</h2>
          <p className="muted">Patru pași scurți: tu, părinții, bunicii, iar la sfârșit arborele e gata, cu toate legăturile. Ce nu știi lași gol.</p>
          <FamilyStart />
        </section>
        <aside className="stack">
          <JoinTree compact={false} requests={requests} />
          <div className="card"><GedcomImport /></div>
        </aside>
      </div>
    );
  }
  return (
    <div className="layout">
      <div className="stack">
        <div className="card">
          <div className="toolbar"><div className="title">Arborii tăi</div></div>
          <div className="list">
            {trees.map((t) => (
              <Link key={t.id} href={`/arbore/${t.id}`}>
                <b>{t.name}</b>
                <span className="muted">{t.region ? `${t.region} · ` : ""}{persoane(t.count)} · {ROLE[t.role]}</span>
              </Link>
            ))}
          </div>
        </div>
        <JoinTree compact requests={requests} />
      </div>
      <aside className="stack">
        <div className="card">
          <h2 style={{ fontSize: 20 }}>Arbore nou</h2>
          <p className="muted">Încă un arbore, pornit pas cu pas sau adus dintr-un fișier GEDCOM.</p>
          <Link className="btn" href="/arbore-nou">Fă un arbore nou</Link>
        </div>
        <InstallApp compact />
      </aside>
    </div>
  );
}
