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
import Landing from "@/components/Landing";
import { SITE_URL } from "@/lib/site-url";
import type { Metadata } from "next";

// Prima pagină are o singură adresă (fără ?cont=…), iar motoarele de căutare află numele site-ului din datele WebSite.
export const metadata: Metadata = { alternates: { canonical: "/" } };
const WEBSITE = {
  "@context": "https://schema.org", "@type": "WebSite", name: "Cartea Neamului", url: SITE_URL, inLanguage: "ro",
  description: "Arborele familiei, construit împreună, cu amintirile celor dragi și cartea neamului gata de tipărit.",
};

export const dynamic = "force-dynamic";

export default async function Home({ searchParams }: { searchParams: Promise<{ cont?: string }> }) {
  const me = await currentUser();
  const deleted = (await searchParams).cont === "sters";
  if (!me) return <Landing deleted={deleted} jsonLd={WEBSITE} />;
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
