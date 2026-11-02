import Link from "next/link";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { tree, person } from "@/db/schema";
import { ensureSchema } from "@/lib/bootstrap";
import NewTreeForm from "@/components/NewTreeForm";

export const dynamic = "force-dynamic";

export default async function Home() {
  await ensureSchema();
  const trees = await db.select({ id: tree.id, name: tree.name, region: tree.region, count: sql<number>`count(${person.id})::int` })
    .from(tree).leftJoin(person, eq(person.treeId, tree.id)).groupBy(tree.id).orderBy(desc(tree.createdAt));
  return (
    <div className="layout">
      <div className="card">
        <div className="toolbar"><div className="title">Arborii tăi</div></div>
        {trees.length === 0 ? (
          <p className="muted">Niciun arbore încă. Creează unul din dreapta sau rulează <code>npm run db:seed</code> pentru familia de exemplu.</p>
        ) : (
          <div className="list">
            {trees.map((t) => (
              <Link key={t.id} href={`/arbore/${t.id}`}>
                <b>{t.name}</b>
                <span className="muted">{t.region ? `${t.region} · ` : ""}{t.count} persoane</span>
              </Link>
            ))}
          </div>
        )}
      </div>
      <aside className="card"><NewTreeForm /></aside>
    </div>
  );
}
