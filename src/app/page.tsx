import Link from "next/link";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { tree, treeMember } from "@/db/schema";
import { currentUser } from "@/lib/access";
import NewTreeForm from "@/components/NewTreeForm";

export const dynamic = "force-dynamic";

const ROLE: Record<string, string> = { owner: "proprietar", editor: "editor", contributor: "contributor", viewer: "vizitator" };

export default async function Home() {
  const me = await currentUser();
  if (!me) {
    return (
      <div className="card" style={{ maxWidth: 640 }}>
        <h2 style={{ fontSize: 28 }}>Arborele familiei, construit împreună</h2>
        <p style={{ maxWidth: "60ch" }}>Pornești de la tine, inviți rudele, fiecare completează ramura lui cu nume, poze, acte și amintiri. La final, familia își tipărește cartea neamului.</p>
        <div className="actions"><Link className="btn primary" href="/intrare?mod=cont-nou">Creează cont gratuit</Link><Link className="btn" href="/intrare">Intră în cont</Link></div>
      </div>
    );
  }
  const trees = await db.select({ id: tree.id, name: tree.name, region: tree.region, role: treeMember.role, count: sql<number>`(select count(*) from person p where p.tree_id = ${tree.id})::int` })
    .from(treeMember).innerJoin(tree, eq(tree.id, treeMember.treeId)).where(eq(treeMember.userId, me.id)).orderBy(desc(tree.createdAt));
  return (
    <div className="layout">
      <div className="card">
        <div className="toolbar"><div className="title">Arborii tăi</div></div>
        {trees.length === 0 ? (
          <p className="muted">Niciun arbore încă. Creează unul din dreapta sau deschide un link de invitație primit de la o rudă.</p>
        ) : (
          <div className="list">
            {trees.map((t) => (
              <Link key={t.id} href={`/arbore/${t.id}`}>
                <b>{t.name}</b>
                <span className="muted">{t.region ? `${t.region} · ` : ""}{t.count} persoane · {ROLE[t.role]}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
      <aside className="card"><NewTreeForm /></aside>
    </div>
  );
}
