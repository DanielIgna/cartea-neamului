import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { person } from "@/db/schema";
import { loadTreeView } from "@/lib/tree-data";
import { requireUser, roleIn } from "@/lib/access";
import { buildGraph } from "@/lib/kinship";
import { loadLada, type MemoryView } from "@/lib/lada-db";
import { CHAPTERS } from "@/lib/questions";
import { lifeDates } from "@/lib/person-text";
import StoryViewer, { type Slide, type StoryMemory } from "@/components/StoryViewer";

export const dynamic = "force-dynamic";
const UUID = /^[0-9a-f-]{36}$/i;
const order = (a: MemoryView, b: MemoryView) => (a.whenYear ?? 9999) - (b.whenYear ?? 9999) || a.createdAt.localeCompare(b.createdAt);

/**
 * Povestea unui om, de răsfoit ca pe telefon: coperta, apoi capitolele lăzii cu amintirile lui și, la sfârșit,
 * cum și-l amintesc ceilalți. Aceleași reguli ca pe profil: fiecare vede doar ce i s-a dat voie; ciornele nu intră.
 */
export default async function StoryPage({ params }: { params: Promise<{ id: string; pid: string }> }) {
  const { id, pid } = await params;
  if (!UUID.test(id) || !UUID.test(pid)) notFound();
  const me = await requireUser(`/arbore/${id}/persoana/${pid}/poveste`);
  if (!(await roleIn(db, id, me.id))) notFound();
  const data = await loadTreeView(db, id, undefined, 1);
  const p = data?.people[pid];
  if (!data || !p) notFound();
  const g = buildGraph(Object.values(data.people), data.rels);
  const [mine] = await db.select({ id: person.id }).from(person).where(and(eq(person.treeId, id), eq(person.claimedByUserId, me.id))).limit(1);
  const lada = await loadLada(db, id, pid, { userId: me.id, personId: mine?.id ?? null }, g, data.tree.chatMaxDegree);

  const name = (x: string) => data.people[x]?.name ?? "";
  const story = (m: MemoryView, from: boolean): StoryMemory => ({
    id: m.id, title: m.title, question: m.question, body: m.body, when: [m.whenText, m.place].filter(Boolean).join(" · "), photoId: m.photoId,
    mentions: m.mentions.filter((x) => x.personId !== pid).map((x) => name(x.personId)).filter(Boolean), from: from ? m.author?.name ?? null : null, replies: m.replies.length,
    audioId: m.audioId, audioSeconds: m.audioSeconds, recordedBy: m.helper && !from ? m.author?.name ?? null : null,
  });
  const own = lada.own.filter((m) => m.visibility !== "private");
  const about = lada.about.filter((m) => !m.mentions.some((x) => x.personId === pid && x.hidden)).sort(order);

  const slides: Slide[] = [{ kind: "cover", name: p.name, dates: lifeDates(p), who: { givenName: p.givenName, surname: p.surname, photoId: p.photoId, accountImage: p.accountImage ?? null }, count: own.length + about.length,
    kicker: p.living || own.length ? "Lada cu amintiri" : "Amintirile familiei" }];
  let n = 0;
  for (const c of CHAPTERS) {
    const items = own.filter((m) => m.chapter === c.key).sort(order);
    if (!items.length) continue;
    slides.push({ kind: "chapter", label: c.label, kicker: `Capitolul ${++n}`, count: items.length });
    for (const m of items) slides.push({ kind: "memory", chapter: c.label, m: story(m, false) });
  }
  if (about.length) {
    slides.push({ kind: "chapter", label: `Cum ${p.sex === "F" ? "și-o" : "și-l"} amintesc ceilalți`, kicker: "Din lăzile celorlalți", count: about.length });
    for (const m of about) slides.push({ kind: "memory", chapter: "Din lăzile celorlalți", m: story(m, true) });
  }
  slides.push({ kind: "end", givenName: p.givenName, isOwner: lada.isOwner, living: p.living, drafts: lada.own.length - own.length,
    writeHref: mine && mine.id !== pid ? `/arbore/${id}/persoana/${mine.id}?scrie=${pid}#lada` : null });

  return <StoryViewer slides={slides} back={`/arbore/${id}/persoana/${pid}`} title={p.name} />;
}
