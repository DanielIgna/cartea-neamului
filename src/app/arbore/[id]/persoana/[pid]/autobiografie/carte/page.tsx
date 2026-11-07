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
import { BOOK_CHAPTERS, BOOK_VERSE, OTHER_CHAPTER, bookPlan, type Verse } from "@/lib/autobiografie";
import { lifeDates } from "@/lib/person-text";
import { memoryShortPath } from "@/lib/short-link";
import { siteOrigin } from "@/lib/site";
import { Avatar } from "@/components/Avatar";
import PrintButton from "@/components/PrintButton";

export const dynamic = "force-dynamic";
const UUID = /^[0-9a-f-]{36}$/i;
const clock = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
const day = (iso: string) => new Date(iso).toLocaleDateString("ro-RO", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Bucharest" });

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
  const data = await loadTreeView(db, id, undefined, 1);
  const p = data?.people[pid];
  if (!data || !p) notFound();
  const g = buildGraph(Object.values(data.people), data.rels);
  const [mine] = await db.select({ id: person.id }).from(person).where(and(eq(person.treeId, id), eq(person.claimedByUserId, me.id))).limit(1);
  const lada = await loadLada(db, id, pid, { userId: me.id, personId: mine?.id ?? null }, g, data.tree.chatMaxDegree);
  const ctx = questionContext(g, data.people, pid);
  const plan = ctx ? bookPlan(ctx) : [];
  const order = new Map(plan.flatMap((c) => c.questions).map((q, i) => [q.key, i]));
  const shown = lada.own.filter((m) => m.visibility !== "private");
  const drafts = lada.isOwner ? lada.own.length - shown.length : 0;
  const origin = await siteOrigin();
  const inChapter = (key: string) => (m: MemoryView) => key === OTHER_CHAPTER.key ? !BOOK_CHAPTERS.some((c) => c.key === m.chapter) : m.chapter === key;
  const sort = (a: MemoryView, b: MemoryView) => (order.get(a.questionKey ?? "") ?? 1e6) - (order.get(b.questionKey ?? "") ?? 1e6)
    || (a.whenYear ?? 9999) - (b.whenYear ?? 9999) || a.createdAt.localeCompare(b.createdAt);
  const chapters: Chapter[] = (await Promise.all([...BOOK_CHAPTERS, OTHER_CHAPTER].map(async (c) => ({
    key: c.key, title: c.title, verse: "verse" in c ? c.verse : undefined,
    items: await Promise.all(shown.filter(inChapter(c.key)).sort(sort).map(async (m): Promise<Entry> => {
      const url = m.audioId ? `${origin}${memoryShortPath(m.id)}` : null;
      return { ...m, qr: url ? await QRCode.toString(url, { type: "svg", margin: 0, errorCorrectionLevel: "M", color: { dark: "#1b2430", light: "#ffffff" } }) : null };
    })),
  })))).filter((c) => c.items.length);
  const last = shown.reduce<string | null>((x, m) => (!x || m.createdAt > x ? m.createdAt : x), null);
  const back = `/arbore/${id}/persoana/${pid}`;
  const born = where(p.birthPlace, p.birthCountry);

  return (
    <article className="autobook">
      <style>{"@page{size:A4;margin:18mm 18mm 20mm}"}</style>
      <div className="autobook-tools no-print">
        <Link href={`${back}#lada`}>← Înapoi la profil</Link>
        {chapters.length > 0 && <PrintButton />}
        {lada.isOwner && p.living && <Link className="btn" href={`${back}/autobiografie`}>Scrie mai departe</Link>}
        {drafts > 0 && <span className="muted">{drafts === 1 ? "Un răspuns e ciornă și nu intră" : `${drafts} răspunsuri sunt ciorne și nu intră`} în carte până nu alegi cine {drafts === 1 ? "îl vede" : "le vede"}.</span>}
      </div>

      <section className="ab-cover">
        <Avatar p={p} size={150} />
        <div className="ab-kicker">Autobiografie</div>
        <h1>{p.name}</h1>
        <div className="ab-dates">{lifeDates(p)}{born ? ` · ${p.sex === "F" ? "născută" : "născut"} în ${born}` : ""}</div>
        <blockquote className="ab-verse">„{BOOK_VERSE.text}”<cite>{BOOK_VERSE.ref}</cite></blockquote>
      </section>

      {chapters.length === 0 ? (
        <section className="ab-empty">
          {lada.isOwner ? (
            <>
              <p>Cartea ta e încă goală. Răspunde la întrebările ei și se umple, capitol cu capitol.</p>
              {p.living && <Link className="btn primary no-print" href={`${back}/autobiografie`}>Începe autobiografia</Link>}
            </>
          ) : <p>{p.givenName} n-a scris încă nimic în autobiografie, sau încă nu pentru tine.</p>}
        </section>
      ) : (
        <>
          <nav className="ab-toc" aria-label="Cuprins">
            <h2>Cuprins</h2>
            <ol>{chapters.map((c) => <li key={c.key}><a href={`#cap-${c.key}`}>{c.title}</a></li>)}</ol>
          </nav>
          {chapters.map((c, i) => (
            <section key={c.key} className="ab-ch" id={`cap-${c.key}`}>
              <div className="ab-ch-n">Capitolul {i + 1}</div>
              <h2>{c.title}</h2>
              {c.verse && <blockquote className="ab-verse">„{c.verse.text}”<cite>{c.verse.ref}</cite></blockquote>}
              {c.items.map((m) => (
                <div key={m.id} className="ab-entry" id={`amintire-${m.id}`}>
                  {m.question && <h3 className="ab-q">{m.question}</h3>}
                  {m.title && <h4 className="ab-title">{m.title}</h4>}
                  {m.photoId && <img className="ab-photo" src={`/api/document/${m.photoId}`} alt={m.title ?? "Poza amintirii"} />}
                  {m.body && <p className="ab-body">{m.body}</p>}
                  {(m.whenText || m.place) && <div className="ab-meta">{[m.whenText, m.place].filter(Boolean).join(" · ")}</div>}
                  {m.audioId && (
                    <div className="ab-listen">
                      {m.qr && <span className="ab-qr" dangerouslySetInnerHTML={{ __html: m.qr }} />}
                      <span>
                        <span className="print-only">Scanează codul ca {p.sex === "F" ? "s-o" : "să-l"} auzi povestind{m.audioSeconds ? ` (${clock(m.audioSeconds)})` : ""}.</span>
                        <audio className="no-print" controls preload="none" src={`/api/document/${m.audioId}`} aria-label="Răspunsul spus cu glasul" />
                      </span>
                    </div>
                  )}
                  {m.helper && <div className="ab-meta">Povestită de {p.givenName}{m.author ? ` și înregistrată de ${m.author.name}` : ""}.</div>}
                </div>
              ))}
            </section>
          ))}
          <section className="ab-end">
            <p>Povestită de {p.givenName}, pentru cei care vin.</p>
            {last && <p className="muted">Ultima pagină scrisă: {day(last)}.</p>}
          </section>
        </>
      )}
    </article>
  );
}
