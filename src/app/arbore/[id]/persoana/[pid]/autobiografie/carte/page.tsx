import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import QRCode from "qrcode";
import { db } from "@/db";
import { person } from "@/db/schema";
import { loadTreeView, where } from "@/lib/tree-data";
import { requireUser, roleIn } from "@/lib/access";
import { buildGraph } from "@/lib/kinship";
import { questionContext } from "@/lib/lada";
import { loadLada, type MemoryView } from "@/lib/lada-db";
import { BOOK_CHAPTER_KEYS, bookChapters, bookPlan, verse, type Verse } from "@/lib/autobiografie";
import { lifeDates } from "@/lib/person-text";
import { memoryShortPath } from "@/lib/short-link";
import { siteOrigin } from "@/lib/site";
import { Avatar } from "@/components/Avatar";
import PrintButton from "@/components/PrintButton";
import { getLocale, getT } from "@/i18n/server";

export const dynamic = "force-dynamic";
const UUID = /^[0-9a-f-]{36}$/i;
const clock = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
const day = (iso: string, locale: string) => new Date(iso).toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Bucharest" });

type Entry = MemoryView & { qr: string | null };
type Chapter = { key: string; title: string; verse?: Verse; items: Entry[] };

/**
 * Autobiografia ca o carte: coperta, cuprinsul și capitolele, cu întrebarea deasupra fiecărui răspuns. Fiecare vede doar
 * răspunsurile pe care i le-a dat voie omul, ca pe profil; ciornele nu intră. Se tipărește sau se salvează ca PDF din browser.
 */
export default async function AutobiographyBookPage({ params }: { params: Promise<{ id: string; pid: string }> }) {
  const { id, pid } = await params;
  if (!UUID.test(id) || !UUID.test(pid)) notFound();
  const me = await requireUser(`/arbore/${id}/persoana/${pid}/autobiografie/carte`);
  if (!(await roleIn(db, id, me.id))) notFound();
  const locale = await getLocale();
  const [t, tq] = await Promise.all([getT("Auto", locale), getT("Questions", locale)]);
  const data = await loadTreeView(db, id, undefined, 1, locale);
  const p = data?.people[pid];
  if (!data || !p) notFound();
  const g = buildGraph(Object.values(data.people), data.rels);
  const [mine] = await db.select({ id: person.id }).from(person).where(and(eq(person.treeId, id), eq(person.claimedByUserId, me.id))).limit(1);
  const lada = await loadLada(db, id, pid, { userId: me.id, personId: mine?.id ?? null }, g, data.tree.chatMaxDegree);
  const ctx = questionContext(g, data.people, pid);
  const plan = ctx ? bookPlan(ctx, tq, locale) : [];
  const order = new Map(plan.flatMap((c) => c.questions).map((q, i) => [q.key, i]));
  const shown = lada.own.filter((m) => m.visibility !== "private");
  const drafts = lada.isOwner ? lada.own.length - shown.length : 0;
  const origin = await siteOrigin();
  const inChapter = (key: string) => (m: MemoryView) => key === "altele" ? !(BOOK_CHAPTER_KEYS as string[]).includes(m.chapter) : m.chapter === key;
  const sort = (a: MemoryView, b: MemoryView) => (order.get(a.questionKey ?? "") ?? 1e6) - (order.get(b.questionKey ?? "") ?? 1e6)
    || (a.whenYear ?? 9999) - (b.whenYear ?? 9999) || a.createdAt.localeCompare(b.createdAt);
  const chapters: Chapter[] = (await Promise.all([...bookChapters(tq), { key: "altele", title: tq("otherChapter"), verse: undefined }].map(async (c) => ({
    key: c.key, title: c.title, verse: c.verse,
    items: await Promise.all(shown.filter(inChapter(c.key)).sort(sort).map(async (m): Promise<Entry> => {
      const url = m.audioId ? `${origin}${memoryShortPath(m.id)}` : null;
      return { ...m, qr: url ? await QRCode.toString(url, { type: "svg", margin: 0, errorCorrectionLevel: "M", color: { dark: "#1b2430", light: "#ffffff" } }) : null };
    })),
  })))).filter((c) => c.items.length);
  const last = shown.reduce<string | null>((x, m) => (!x || m.createdAt > x ? m.createdAt : x), null);
  const back = `/arbore/${id}/persoana/${pid}`;
  const born = where(p.birthPlace, p.birthCountry, locale);
  const sex = p.sex === "F" ? "F" : "M";
  const motto = verse(tq, "book");

  return (
    <article className="autobook">
      <style>{"@page{size:A4;margin:18mm 18mm 20mm}"}</style>
      <div className="autobook-tools no-print">
        <Link href={`${back}#lada`}>{t("backToProfile")}</Link>
        {chapters.length > 0 && <PrintButton label={t("print")} />}
        {lada.isOwner && p.living && <Link className="btn" href={`${back}/autobiografie`}>{t("writeOn")}</Link>}
        {drafts > 0 && <span className="muted">{t("drafts", { count: drafts })}</span>}
      </div>

      <section className="ab-cover">
        <Avatar p={p} size={150} />
        <div className="ab-kicker">{t("kicker")}</div>
        <h1>{p.name}</h1>
        <div className="ab-dates">{lifeDates(p, locale)}{born ? ` · ${t("born", { sex, place: born })}` : ""}</div>
        <blockquote className="ab-verse">{t("quoted", { text: motto.text })}<cite>{motto.ref}</cite></blockquote>
      </section>

      {chapters.length === 0 ? (
        <section className="ab-empty">
          {lada.isOwner ? (
            <>
              <p>{t("emptyOwn")}</p>
              {p.living && <Link className="btn primary no-print" href={`${back}/autobiografie`}>{t("start")}</Link>}
            </>
          ) : <p>{t("emptyOther", { name: p.givenName })}</p>}
        </section>
      ) : (
        <>
          <nav className="ab-toc" aria-label={t("toc")}>
            <h2>{t("toc")}</h2>
            <ol>{chapters.map((c) => <li key={c.key}><a href={`#cap-${c.key}`}>{c.title}</a></li>)}</ol>
          </nav>
          {chapters.map((c, i) => (
            <section key={c.key} className="ab-ch" id={`cap-${c.key}`}>
              <div className="ab-ch-n">{t("chapterN", { n: String(i + 1) })}</div>
              <h2>{c.title}</h2>
              {c.verse && <blockquote className="ab-verse">{t("quoted", { text: c.verse.text })}<cite>{c.verse.ref}</cite></blockquote>}
              {c.items.map((m) => (
                <div key={m.id} className="ab-entry" id={`amintire-${m.id}`}>
                  {m.question && <h3 className="ab-q">{m.question}</h3>}
                  {m.title && <h4 className="ab-title">{m.title}</h4>}
                  {m.photoId && <img className="ab-photo" src={`/api/document/${m.photoId}`} alt={m.title ?? t("photoAlt")} />}
                  {m.body && <p className="ab-body">{m.body}</p>}
                  {(m.whenText || m.place) && <div className="ab-meta">{[m.whenText, m.place].filter(Boolean).join(" · ")}</div>}
                  {m.audioId && (
                    <div className="ab-listen">
                      {m.qr && <span className="ab-qr" dangerouslySetInnerHTML={{ __html: m.qr }} />}
                      <span>
                        <span className="print-only">{m.audioSeconds ? t("scanTime", { sex, time: clock(m.audioSeconds) }) : t("scan", { sex })}</span>
                        <audio className="no-print" controls preload="none" src={`/api/document/${m.audioId}`} aria-label={t("voiceAria")} />
                      </span>
                    </div>
                  )}
                  {m.helper && <div className="ab-meta">{m.author ? t("toldRecorded", { name: p.givenName, recorder: m.author.name }) : t("told", { name: p.givenName })}</div>}
                </div>
              ))}
            </section>
          ))}
          <section className="ab-end">
            <p>{t("end", { name: p.givenName })}</p>
            {last && <p className="muted">{t("lastPage", { date: day(last, locale) })}</p>}
          </section>
        </>
      )}
    </article>
  );
}
