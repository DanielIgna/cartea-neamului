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
import { getT } from "@/i18n/server";

export const dynamic = "force-dynamic";

const FEATURES = ["tree", "memories", "map", "book"] as const;

/** Prima pagină pentru cine n-are încă un cont: ce e Cartea Neamului și cum începi, în trei pași. */
async function Landing({ deleted }: { deleted: boolean }) {
  const t = await getT("Landing");
  const b = (c: React.ReactNode) => <b>{c}</b>;
  return (
    <div className="landing">
      {deleted && <p className="notice" role="status">{t("deleted")}</p>}
      <section className="card landing-hero">
        <h2>{t("heroTitle")}</h2>
        {t("brandNote") && <p className="muted landing-brand">{t("brandNote")}</p>}
        <p>{t("heroText")}</p>
        <div className="actions"><Link className="btn primary" href="/intrare?mod=cont-nou">{t("signUp")}</Link><Link className="btn" href="/intrare">{t("signIn")}</Link></div>
      </section>
      <section className="landing-grid" aria-label={t("featuresLabel")}>
        {FEATURES.map((f) => <div key={f} className="card"><h3>{t(`${f}Title`)}</h3><p>{t(`${f}Text`)}</p></div>)}
      </section>
      <section className="card">
        <h3>{t("howTitle")}</h3>
        <ol className="landing-steps">
          <li>{t.rich("step1", { b })}</li>
          <li>{t.rich("step2", { b })}</li>
          <li>{t.rich("step3", { b })}</li>
        </ol>
        <p className="muted">{t.rich("privacy", { link: (c) => <Link href="/confidentialitate">{c}</Link> })}</p>
        <div className="actions"><Link className="btn primary" href="/intrare?mod=cont-nou">{t("start")}</Link></div>
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
  const t = await getT("Home");

  // Fără niciun arbore: întâi pornirea pas cu pas; alături, căutarea în arborii rudelor și aducerea unui fișier GEDCOM.
  if (trees.length === 0) {
    return (
      <div className="layout">
        <section className="card start-card">
          <h2>{t("startTitle")}</h2>
          <p className="muted">{t("startText")}</p>
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
          <div className="toolbar"><div className="title">{t("yourTrees")}</div></div>
          <div className="list">
            {trees.map((tr) => (
              <Link key={tr.id} href={`/arbore/${tr.id}`}>
                <b>{tr.name}</b>
                <span className="muted">{tr.region ? `${tr.region} · ` : ""}{t("persons", { count: tr.count })} · {t(tr.role)}</span>
              </Link>
            ))}
          </div>
        </div>
        <JoinTree compact requests={requests} />
      </div>
      <aside className="stack">
        <div className="card">
          <h2 style={{ fontSize: 20 }}>{t("newTitle")}</h2>
          <p className="muted">{t("newText")}</p>
          <Link className="btn" href="/arbore-nou">{t("newButton")}</Link>
        </div>
        <InstallApp compact />
      </aside>
    </div>
  );
}
