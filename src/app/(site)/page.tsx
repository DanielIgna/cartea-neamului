import Link from "next/link";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { person, tree, treeMember } from "@/db/schema";
import { currentUser } from "@/lib/access";
import QuickStart from "@/components/QuickStart";
import GedcomImport from "@/components/GedcomImport";
import InstallApp from "@/components/InstallApp";
import JoinTree from "@/components/JoinTree";
import { myJoinRequests } from "@/lib/join";
import { getT } from "@/i18n/server";
import Landing from "@/components/Landing";
import Image from "next/image";
import { Ico } from "@/components/AccountNav";
import { homeImages } from "@/lib/home-images";
import { seoSettings, SEO_TAG } from "@/lib/seo";
import { unstable_cache } from "next/cache";
import type { Metadata } from "next";
import { publicPageMetadata } from "@/lib/page-metadata";
import { userAccess } from "@/lib/plata";
import { tierRank, TIERS } from "@/lib/plans";
import { getLocale } from "@/i18n/server";

// Prima pagină are o singură adresă (fără ?cont=…), iar motoarele de căutare află numele site-ului din datele WebSite, Organization și SoftwareApplication.
// Tot aici stă codul de verificare Google Search Console, pus din Admin → SEO (sau GOOGLE_SITE_VERIFICATION în Vercel).
/** Codul de verificare se schimbă rar: în cache o oră, golit pe loc când se salvează din Admin → SEO. */
const cachedVerification = unstable_cache(async () => (await seoSettings(db)).verification, ["seo-verification"], { tags: [SEO_TAG], revalidate: 3600 });
export async function generateMetadata(): Promise<Metadata> {
  const t = await getT("Meta");
  const code = process.env.GOOGLE_SITE_VERIFICATION?.trim() || (await cachedVerification());
  return {
    ...publicPageMetadata({ path: "/", title: t("homeTitle"), description: t("description"), locale: await getLocale() }),
    ...(code ? { verification: { google: code } } : {}),
  };
}

export const dynamic = "force-dynamic";

export default async function Home({ searchParams }: { searchParams: Promise<{ cont?: string }> }) {
  const me = await currentUser();
  const deleted = (await searchParams).cont === "sters";
  if (!me) return <Landing deleted={deleted} />;
  const trees = await db.select({ id: tree.id, name: tree.name, region: tree.region, role: treeMember.role, count: sql<number>`(select count(*) from person p where p.tree_id = ${tree.id})::int` })
    .from(treeMember).innerJoin(tree, eq(tree.id, treeMember.treeId)).where(eq(treeMember.userId, me.id)).orderBy(desc(tree.createdAt));
  const requests = (await myJoinRequests(db, me.id)).map((j) => ({ ...j, at: j.at.toISOString() }));
  const t = await getT("Home");

  // Fără niciun arbore (și imediat după înscriere): primii pași, 3 câmpuri pe ecran (src/components/QuickStart.tsx); alături,
  // căutarea în arborii rudelor și aducerea unui fișier GEDCOM.
  if (trees.length === 0) {
    const tq = await getT("QuickStart");
    return (
      <div className="layout">
        <section className="card start-card">
          <h2>{tq("title")}</h2>
          <p className="muted">{tq("lead")}</p>
          <QuickStart />
          <p className="muted qs-note">{tq("otherWays")}</p>
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
  // Planul tău: cine are un an plătit pe Basic sau Familie vede că poate trece oricând pe unul mai mare (plătind diferența).
  const [{ access }, tp, locale] = await Promise.all([userAccess(db, me.id).catch(() => null).then((x) => x ?? { access: { kind: "deschis" as const } }), getT("Plata"), getLocale()]);
  const paid = access.kind === "platit" && access.until ? access : null;
  const canUp = !!paid && tierRank(paid.tier) < TIERS.length - 1;
  const date = (d: Date) => new Intl.DateTimeFormat(locale, { dateStyle: "long", timeZone: "Europe/Bucharest" }).format(d);
  // Cifrele neamului (arborele cel mai nou): persoane, cel mai vechi an de naștere, locurile de baștină și rudele intrate în arbore.
  const stats = await db.execute(sql`select
      (select min(extract(year from p.birth_from))::int from person p where p.tree_id = ${first.id}) as oldest,
      (select count(distinct lower(trim(p.birth_place)))::int from person p where p.tree_id = ${first.id} and coalesce(trim(p.birth_place), '') <> '') as places,
      (select count(*)::int from tree_member m where m.tree_id = ${first.id}) as members`)
    .then((r) => (r.rows?.[0] ?? {}) as { oldest?: number | null; places?: number; members?: number }).catch(() => ({} as { oldest?: number | null; places?: number; members?: number }));
  const th = await getT("HomeDash");
  const trial = access.kind === "proba" ? access : null;
  const planName = paid ? tp(`tiers.${paid.tier}.name`) : null;
  const tiles: { k: "persons" | "oldest" | "places" | "members"; icon: string; v: string | number }[] = [
    { k: "persons", icon: "user", v: first.count },
    { k: "oldest", icon: "book", v: stats.oldest ?? "–" },
    { k: "places", icon: "map", v: stats.places ?? 0 },
    { k: "members", icon: "inv", v: stats.members ?? 1 },
  ];
  const hero = stack[1] ?? stack[0];
  return (
    <div className="dash">
    <header className="dash-hero">
      {hero && <div className="dash-hero-img" aria-hidden="true"><Image src={hero.src} alt="" fill sizes="(max-width: 900px) 100vw, 900px" priority unoptimized={hero.custom} /></div>}
      <div className="pf-cover-grain" aria-hidden="true" />
      <div className="dash-hero-in">
        <p className="pf-eyebrow">{t("welcomeEyebrow")}</p>
        <h1 className="dash-name">{firstName}</h1>
        <p className="dash-lead">{t("welcomeLead")}</p>
        <div className="actions">
          <Link className="btn primary dash-go" href={`/arbore/${first.id}`}>{t("openTree")} · {first.name}<span className="dash-arrow" aria-hidden="true">→</span></Link>
          {mine && <Link className="btn" href={`/arbore/${first.id}/persoana/${mine.id}`}>{t("myProfile")}</Link>}
        </div>
      </div>
    </header>

    <section className="dash-plan card">
      {trial ? (
        <div className="dash-ring" style={{ ["--p" as string]: `${Math.max(0, Math.min(100, Math.round((trial.daysLeft / 7) * 100)))}%` }}>
          <b>{trial.daysLeft}<small>{th("daysLeft")}</small></b>
        </div>
      ) : <div className="dash-ring dash-ring-full"><b><Ico n="card" /></b></div>}
      <div>
        <div className="section-label">{t("planTitle")}</div>
        {paid && paid.until ? <>
          <h3>{planName}</h3>
          <p>{tp("tierUntil", { plan: planName ?? "", date: date(paid.until) })}</p>
          {canUp && <p className="muted">{t("planUpText")}</p>}
          <Link className={`btn${canUp ? " primary" : ""}`} href="/plata">{canUp ? t("planUpBtn") : tp("treeLink")}</Link>
        </> : <>
          <h3>{trial ? th("trialTitle") : th("planOther")}</h3>
          <p className="muted">{trial ? th("trialText", { date: date(trial.until) }) : th("planOtherText")}</p>
          <Link className="btn primary" href="/plata">{th("planButton")}</Link>
        </>}
      </div>
    </section>

    {tiles.map((x) => (
      <section key={x.k} className="dash-stat card">
        <span className="dash-stat-ic"><Ico n={x.icon} /></span>
        <div className="section-label">{th(`stat.${x.k}`)}</div>
        <div className="dash-v">{x.v}</div>
        <div className="muted">{th(`statHint.${x.k}`)}</div>
      </section>
    ))}

    <section className="dash-next card">
      <div className="section-label">{th("nextTitle")}</div>
      <div className="dash-acts">
        <Link href={`/arbore/${first.id}`}><span className="dash-act-ic"><Ico n="plus" /></span><span><b>{th("next.add")}</b><small>{th("next.addHint")}</small></span></Link>
        <Link href="/invitatii"><span className="dash-act-ic"><Ico n="inv" /></span><span><b>{th("next.invite")}</b><small>{th("next.inviteHint")}</small></span></Link>
        {mine && <Link href={`/arbore/${first.id}/persoana/${mine.id}#lada`}><span className="dash-act-ic"><Ico n="box" /></span><span><b>{th("next.memories")}</b><small>{th("next.memoriesHint")}</small></span></Link>}
        <Link href={`/arbore/${first.id}/carte`}><span className="dash-act-ic"><Ico n="book" /></span><span><b>{th("next.book")}</b><small>{th("next.bookHint")}</small></span></Link>
      </div>
    </section>

    <section className="dash-trees card">
      <div className="section-label">{t("yourTrees")}</div>
      <div className="list">
        {trees.map((tr) => (
          <Link key={tr.id} href={`/arbore/${tr.id}`}>
            <b>{tr.name}</b>
            <span className="muted">{tr.region ? `${tr.region} · ` : ""}{t("persons", { count: tr.count })} · {t(tr.role)}</span>
          </Link>
        ))}
      </div>
      <div className="dash-new">
        <div><b>{t("newTitle")}</b><p className="muted">{t("newText")}</p></div>
        <Link className="btn" href="/arbore-nou">{t("newButton")}</Link>
      </div>
    </section>

    <div className="dash-side">
      <JoinTree compact requests={requests} />
      <InstallApp compact />
    </div>
    </div>
  );
}
