import { PRIVATE_ROBOTS } from "@/lib/page-metadata";
import { db } from "@/db";
import { requireUser } from "@/lib/access";
import { markRepliesSeen, myReports, problemContext, PROBLEM_STATUSES, type ProblemStatus } from "@/lib/probleme";
import ProblemForm from "@/components/ProblemForm";
import PageIntl from "@/i18n/PageIntl";
import { getAppName, getFormat, getT } from "@/i18n/server";

export const dynamic = "force-dynamic";
export async function generateMetadata() {
  const t = await getT("Problem");
  return { title: `${t("metaTitle")} · ${await getAppName()}`, robots: PRIVATE_ROBOTS };
}

/**
 * „Raportează o problemă” (Daniel, 2026-11-13): omul din cont ne scrie ce nu merge, cu poze ale ecranului, iar mai jos vede
 * ce ne-a scris și ce i-am răspuns. Se ajunge aici din meniul contului; `?de=` e pagina din care a venit.
 */
export default async function ProblemPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const q = await searchParams;
  const from = typeof q.de === "string" ? q.de : "";
  const me = await requireUser(`/problema${from ? `?de=${encodeURIComponent(from)}` : ""}`);
  const ctx = problemContext(from);
  const page = ctx.page && !ctx.page.startsWith("/problema") ? ctx.page : null;
  const [t, format, mine] = await Promise.all([getT("Problem"), getFormat(), myReports(db, me.id)]);
  // Răspunsurile noi se arată cu „nou” acum, apoi se socotesc văzute.
  const unseen = new Set(mine.filter((r) => r.repliedAt && !r.replySeenAt).map((r) => r.id));
  if (unseen.size) await markRepliesSeen(db, me.id);
  const day = (d: Date) => format.dateTime(d, { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Bucharest" });
  const st = (s: string): ProblemStatus => (PROBLEM_STATUSES.includes(s as ProblemStatus) ? (s as ProblemStatus) : "nou");
  return (
    <section className="stack" style={{ maxWidth: 760, margin: "0 auto" }}>
      <div className="card stack">
        <div>
          <h1 className="section-label" style={{ marginTop: 0 }}>{t("label")}</h1>
          <h2 style={{ marginBottom: 6 }}>{t("title")}</h2>
          <p style={{ margin: 0 }}>{t("lead")}</p>
        </div>
        <PageIntl ns={["Problem"]}><ProblemForm page={page} kind={typeof q.fel === "string" ? q.fel : undefined} /></PageIntl>
      </div>
      <div className="card stack">
        <h3 style={{ margin: 0 }}>{t("mineTitle")}</h3>
        {!mine.length && <p className="muted" style={{ margin: 0 }}>{t("mineEmpty")}</p>}
        {mine.length > 0 && (
          <ul className="problem-list">
            {mine.map((r) => (
              <li key={r.id} className="problem-item" id={`p-${r.id}`}>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                  <span className={`pill${r.status === "rezolvat" ? " ok" : r.status === "nou" ? "" : " warn"}`}>{t(`status.${st(r.status)}`)}</span>
                  <span className="muted" style={{ fontSize: 14 }}>{t(`kinds.${(["eroare", "arbore", "idee", "altceva"].includes(r.kind) ? r.kind : "altceva") as "eroare"}`)} · {t("sentOn", { date: day(r.createdAt) })}</span>
                </div>
                <p>{r.message}</p>
                {r.images.length > 0 && (
                  <div className="problem-thumbs">
                    {r.images.map((_, i) => (
                      <a key={i} href={`/api/problema/${r.id}/${i}`} target="_blank" rel="noopener">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={`/api/problema/${r.id}/${i}`} alt="" loading="lazy" />
                      </a>
                    ))}
                  </div>
                )}
                {r.reply ? (
                  <div className="problem-reply">
                    <b>{t("ourReply")}{unseen.has(r.id) && <span className="badge" style={{ marginInlineStart: 8 }}>{t("newReply")}</span>}</b>
                    <p>{r.reply}</p>
                  </div>
                ) : <p className="muted" style={{ fontSize: 14 }}>{t("noReply")}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
