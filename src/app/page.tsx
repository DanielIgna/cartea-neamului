import Link from "next/link";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { person, tree, treeMember } from "@/db/schema";
import { currentUser } from "@/lib/access";
import FamilyStart from "@/components/FamilyStart";
import GedcomImport from "@/components/GedcomImport";
import InstallApp from "@/components/InstallApp";
import JoinTree from "@/components/JoinTree";
import { myJoinRequests } from "@/lib/join";
import { getT } from "@/i18n/server";
import Landing from "@/components/Landing";
import Image from "next/image";
import { homeImages } from "@/lib/home-images";
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
  // Coperta de bun venit, ca bannerul de pe prima pagină: numele, arborele cel mai nou și fișa ta din el.
  const first = trees[0];
  const imgs = await homeImages(db);
  const stack = (["gen1", "gen2", "gen4"] as const).map((k) => imgs[k][0]).filter(Boolean);
  const [mine] = await db.select({ id: person.id }).from(person).where(and(eq(person.treeId, first.id), eq(person.claimedByUserId, me.id))).limit(1);
  const firstName = (me.name ?? "").replace(/\s*\(.*\)\s*$/, "").split(/\s+/)[0] || me.name;
  return (
    <>
    <header className="pf-cover home-cover">
      <div className="pf-cover-grain" aria-hidden="true" />
      {/* Aceleași fotografii cu generații ca pe prima pagină, așezate ca niște poze vechi puse una peste alta. */}
      <div className="hc-stack" aria-hidden="true">
        {stack.map((img, i) => (
          <div key={img.id + i} className="hc-photo"><div className="hc-photo-in"><Image src={img.src} alt="" fill sizes="200px" unoptimized={img.custom} /></div></div>
        ))}
      </div>
      <p className="pf-eyebrow">{t("welcomeEyebrow")}</p>
      <h1 className="pf-name">{firstName}</h1>
      <div className="pf-orn" aria-hidden="true"><i /><b /><i /></div>
      <p className="meta">{t("welcomeLead")}</p>
      <div className="actions">
        <Link className="btn primary" href={`/arbore/${first.id}`}>{t("openTree")} · {first.name}</Link>
        {mine && <Link className="btn" href={`/arbore/${first.id}/persoana/${mine.id}`}>{t("myProfile")}</Link>}
      </div>
    </header>
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
    </>
  );
}
