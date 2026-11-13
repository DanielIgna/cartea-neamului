import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { person, problemReport, tree, user } from "@/db/schema";
import { requireAdmin } from "@/lib/admin-access";
import { AdminNav, day } from "@/components/admin/ui";
import ProblemActions from "@/components/admin/ProblemActions";
import { dropOldResolved, KIND_LABEL, STATUS_LABEL, type ProblemKind, type ProblemStatus } from "@/lib/probleme";
import { deleteObjects } from "@/lib/storage";

export const dynamic = "force-dynamic";
export const metadata = { title: "Probleme raportate · Admin" };

/** Felul browserului, pe scurt, din textul lung trimis de el. */
function device(ua: string | null) {
  if (!ua) return null;
  const os = /iPhone|iPad/.test(ua) ? "iPhone/iPad" : /Android/.test(ua) ? "Android" : /Mac OS X/.test(ua) ? "Mac" : /Windows/.test(ua) ? "Windows" : /Linux/.test(ua) ? "Linux" : "";
  const br = /Edg\//.test(ua) ? "Edge" : /SamsungBrowser/.test(ua) ? "Samsung" : /Firefox\//.test(ua) ? "Firefox" : /Chrome\//.test(ua) ? "Chrome" : /Safari\//.test(ua) ? "Safari" : "";
  return [os, br].filter(Boolean).join(", ") || ua.slice(0, 60);
}

/**
 * Problemele trimise din „Raportează o problemă”: textul, pozele ecranului, pagina și arborele din care a venit omul.
 * De aici îi răspunzi (vede pe pagina lui) și o marchezi rezolvată. Cele rezolvate de peste un an se șterg singure, cu pozele lor.
 */
export default async function AdminProblems({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin("/admin/probleme");
  const q = await searchParams;
  const show = q.toate === "1" ? "toate" : "deschise";
  await dropOldResolved(db).then(deleteObjects).catch((e) => console.error("probleme vechi", e));
  const rows = await db.select({ r: problemReport, name: user.name, email: user.email, tree: tree.name, given: person.givenName, surname: person.surname })
    .from(problemReport).innerJoin(user, eq(user.id, problemReport.userId)).leftJoin(tree, eq(tree.id, problemReport.treeId))
    .leftJoin(person, eq(person.id, problemReport.personId))
    .orderBy(desc(problemReport.createdAt)).limit(300);
  const order: Record<string, number> = { nou: 0, vazut: 1, rezolvat: 2 };
  rows.sort((a, b) => (order[a.r.status] ?? 3) - (order[b.r.status] ?? 3));
  const open = rows.filter((x) => x.r.status !== "rezolvat");
  const list = show === "toate" ? rows : open;
  const fresh = rows.filter((x) => x.r.status === "nou").length;
  return (
    <section className="stack">
      <AdminNav active="probleme" />
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Probleme raportate</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          Oamenii le trimit din meniul contului, „Raportează o problemă”: ce nu merge, legături greșite în arbore sau o idee, cu până la 3 poze ale ecranului.
          Pagina din care au venit se ține minte singură. Răspunsul tău îl văd pe pagina lor, cu un semn în meniu (și pe email, când e pus Resend).
          Pozele le vedeți doar tu și omul; pot avea date ale familiei, deci folosește-le doar ca să repari problema.
        </p>
        <p style={{ margin: 0 }}>
          <b>{fresh}</b> noi · <b>{open.length}</b> deschise · {rows.length} în total ·{" "}
          {show === "toate" ? <Link href="/admin/probleme">doar cele deschise</Link> : <Link href="/admin/probleme?toate=1">arată și pe cele rezolvate</Link>}
        </p>
      </div>
      {!list.length && <div className="card"><p className="muted" style={{ margin: 0 }}>{rows.length ? "Nicio problemă deschisă. 🎉" : "Nicio problemă raportată încă."}</p></div>}
      {list.map(({ r, name, email, tree: treeName, given, surname }) => (
        <div className="card stack" key={r.id} id={`p-${r.id}`} style={{ gap: 10 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <span className={`pill${r.status === "rezolvat" ? " ok" : r.status === "nou" ? " warn" : ""}`}>{STATUS_LABEL[r.status as ProblemStatus] ?? r.status}</span>
            <b>{KIND_LABEL[r.kind as ProblemKind] ?? r.kind}</b>
            <span className="muted" style={{ fontSize: 14 }}>{day(r.createdAt.toISOString(), true)}</span>
          </div>
          <p style={{ margin: 0, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{r.message}</p>
          {r.images.length > 0 && (
            <div className="problem-thumbs">
              {r.images.map((_, i) => (
                <a key={i} href={`/api/problema/${r.id}/${i}`} target="_blank" rel="noopener">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/api/problema/${r.id}/${i}`} alt={`Poza ${i + 1}`} loading="lazy" style={{ width: 160, height: 120 }} />
                </a>
              ))}
            </div>
          )}
          <p className="muted" style={{ margin: 0, fontSize: 14 }}>
            De la <Link href={`/admin/oameni/${r.userId}`}>{name || email}</Link> ({email})
            {r.page && <> · pagina <a href={r.page} target="_blank" rel="noopener">{r.page}</a></>}
            {treeName && <> · arborele „{treeName}”</>}
            {(given || surname) && <> · fișa {`${given ?? ""} ${surname ?? ""}`.trim()}</>}
            {device(r.browser) && <> · {device(r.browser)}</>}
            {r.screen && <> · ecran {r.screen}</>}
            {r.locale && <> · limba {r.locale}</>}
          </p>
          {r.repliedAt && <p className="muted" style={{ margin: 0, fontSize: 13 }}>Răspuns trimis {day(r.repliedAt.toISOString(), true)}{r.replySeenAt ? ", văzut de om" : ", încă nevăzut"}.</p>}
          <ProblemActions id={r.id} reply={r.reply ?? ""} status={r.status} />
        </div>
      ))}
    </section>
  );
}
