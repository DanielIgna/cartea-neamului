import { and, eq, inArray, or } from "drizzle-orm";
import type { Db } from "@/db";
import { documentLink, memory, memoryMention, memoryQuestion, memoryReply, person, relationship, tree, user } from "@/db/schema";
import { buildGraph, type Graph } from "./kinship";
import { canSee, type Viewer, type Visibility } from "./lada";

/** Cine a scris: numele din fișa lui revendicată în arbore (sau numele contului), cu legătură spre profil când are fișă. */
export type Author = { name: string; personId: string | null };
export type ReplyView = { id: string; body: string; author: Author | null; mine: boolean; createdAt: string };
export type MemoryView = {
  id: string; personId: string; chapter: string; question: string | null; questionKey: string | null; askedId: string | null;
  title: string | null; body: string; whenText: string | null; whenYear: number | null; place: string | null; photoId: string | null;
  visibility: Visibility; maxDegree: number | null; inBook: boolean; createdAt: string;
  audioId: string | null; audioSeconds: number | null;
  /** Înregistrată în modul „la bunici” de `author`, pentru omul din ladă (care n-avea cont), cu acordul lui. */
  helper: boolean; consentAudioId: string | null;
  author: Author | null; askedBy: Author | null; mine: boolean;
  /** Cine o poate schimba sau șterge: autorul; la cele din modul „la bunici”, și omul din ladă, după ce își face cont. */
  editable: boolean;
  mentions: { personId: string; hidden: boolean }[]; replies: ReplyView[];
};
export type AskedView = { id: string; text: string; askedBy: Author | null; mine: boolean; answeredId: string | null; dismissed: boolean; createdAt: string };

/**
 * Ce vede `viewer` din lada unui om: amintirile lui (`own`), amintirile altora în care e pomenit (`about`, fără cele ascunse de el),
 * întrebările lăsate de rude (toate pentru omul din ladă, doar ale lui pentru ceilalți) și întrebările de duminică la care a răspuns deja.
 */
export async function loadLada(db: Db, treeId: string, personId: string, viewer: Viewer, g: Graph, defaultDegree: number) {
  const people = await db.select({ id: person.id, given: person.givenName, surname: person.surname, claimedBy: person.claimedByUserId })
    .from(person).where(eq(person.treeId, treeId));
  const claimedBy = new Map(people.map((p) => [p.id, p.claimedBy]));
  const byUser = new Map(people.filter((p) => p.claimedBy).map((p) => [p.claimedBy!, p]));
  const ownerUserId = claimedBy.get(personId) ?? null;

  const mentioned = (await db.select({ id: memoryMention.memoryId }).from(memoryMention).innerJoin(memory, eq(memory.id, memoryMention.memoryId))
    .where(and(eq(memoryMention.personId, personId), eq(memory.treeId, treeId)))).map((r) => r.id);
  const rows = await db.select().from(memory)
    .where(and(eq(memory.treeId, treeId), mentioned.length ? or(eq(memory.personId, personId), inArray(memory.id, mentioned)) : eq(memory.personId, personId)))
    .orderBy(memory.createdAt);
  const asked = await db.select().from(memoryQuestion).where(and(eq(memoryQuestion.treeId, treeId),
    rows.some((r) => r.askedId) ? or(eq(memoryQuestion.personId, personId), inArray(memoryQuestion.id, rows.map((r) => r.askedId).filter((x): x is string => !!x))) : eq(memoryQuestion.personId, personId)));
  const askedBy = new Map(asked.map((q) => [q.id, q.askedBy]));

  const visible = rows.filter((m) => canSee({ ...m, askedBy: m.askedId ? askedBy.get(m.askedId) : null }, viewer, g, defaultDegree, claimedBy.get(m.personId) ?? null));
  const ids = visible.map((m) => m.id);
  const mentions = ids.length ? await db.select().from(memoryMention).where(inArray(memoryMention.memoryId, ids)) : [];
  const replies = ids.length ? await db.select().from(memoryReply).where(inArray(memoryReply.memoryId, ids)).orderBy(memoryReply.createdAt) : [];

  const userIds = [...new Set([...visible.map((m) => m.authorId), ...replies.map((r) => r.authorId), ...asked.map((q) => q.askedBy)].filter((x): x is string => !!x))];
  const accounts = new Map(userIds.length ? (await db.select({ id: user.id, name: user.name }).from(user).where(inArray(user.id, userIds))).map((u) => [u.id, u.name]) : []);
  const author = (uid: string | null): Author | null => {
    if (!uid) return null;
    const p = byUser.get(uid);
    return p ? { name: `${p.given} ${p.surname}`.trim(), personId: p.id } : { name: accounts.get(uid) ?? "", personId: null };
  };

  const view = (m: typeof rows[number]): MemoryView => ({
    id: m.id, personId: m.personId, chapter: m.chapter, question: m.question, questionKey: m.questionKey, askedId: m.askedId,
    title: m.title, body: m.body, whenText: m.whenText, whenYear: m.whenYear, place: m.place, photoId: m.photoDocumentId,
    visibility: m.visibility, maxDegree: m.maxDegree, inBook: m.inBook, createdAt: m.createdAt.toISOString(),
    audioId: m.audioDocumentId, audioSeconds: m.audioSeconds, helper: m.helper, consentAudioId: m.consentDocumentId,
    author: author(m.authorId), askedBy: m.askedId ? author(askedBy.get(m.askedId) ?? null) : null, mine: !!m.authorId && m.authorId === viewer.userId,
    editable: (!!m.authorId && m.authorId === viewer.userId) || (m.helper && !!claimedBy.get(m.personId) && claimedBy.get(m.personId) === viewer.userId),
    mentions: mentions.filter((x) => x.memoryId === m.id).map((x) => ({ personId: x.personId, hidden: x.hidden })),
    replies: replies.filter((r) => r.memoryId === m.id).map((r) => ({ id: r.id, body: r.body, author: author(r.authorId), mine: !!r.authorId && r.authorId === viewer.userId, createdAt: r.createdAt.toISOString() })),
  });

  const isOwner = !!ownerUserId && ownerUserId === viewer.userId;
  const own = visible.filter((m) => m.personId === personId).map(view);
  // Pe profilul celui pomenit nu apare ce a ascuns el. O văd totuși autorul (cu semn că e ascunsă) și cel pomenit, ca s-o poată arăta din nou.
  const about = visible.filter((m) => m.personId !== personId).map(view)
    .filter((m) => m.mine || viewer.personId === personId || !m.mentions.some((x) => x.personId === personId && x.hidden));
  const questions: AskedView[] = asked.filter((q) => q.personId === personId && (isOwner || q.askedBy === viewer.userId))
    .map((q) => ({ id: q.id, text: q.text, askedBy: author(q.askedBy), mine: q.askedBy === viewer.userId, answeredId: q.memoryId, dismissed: q.dismissed, createdAt: q.createdAt.toISOString() }));
  const answeredKeys = isOwner ? rows.filter((m) => m.personId === personId && m.questionKey).map((m) => m.questionKey!) : [];
  return { own, about, questions, answeredKeys, isOwner };
}

/** Poate `viewer` să vadă amintirea? Aceleași reguli ca pe profil, cu arborele încărcat aici (pentru gradul de rudenie). */
export async function memoryVisible(db: Db, m: typeof memory.$inferSelect, viewer: Viewer) {
  const people = await db.select({ id: person.id, sex: person.sex, claimedBy: person.claimedByUserId }).from(person).where(eq(person.treeId, m.treeId));
  const rels = await db.select({ type: relationship.type, a: relationship.personA, b: relationship.personB }).from(relationship).where(eq(relationship.treeId, m.treeId));
  const [t] = await db.select({ degree: tree.chatMaxDegree }).from(tree).where(eq(tree.id, m.treeId));
  const askedBy = m.askedId ? (await db.select({ by: memoryQuestion.askedBy }).from(memoryQuestion).where(eq(memoryQuestion.id, m.askedId)))[0]?.by ?? null : null;
  return canSee({ ...m, askedBy }, viewer, buildGraph(people, rels), t?.degree ?? 4, people.find((p) => p.id === m.personId)?.claimedBy ?? null);
}

/** Pozele și glasul puse la amintiri (nu apar în album; le deschide doar cine vede amintirea). */
export async function memoryMediaIds(db: Db, treeId: string) {
  const rows = await db.select({ a: memory.photoDocumentId, b: memory.audioDocumentId, c: memory.consentDocumentId }).from(memory).where(eq(memory.treeId, treeId));
  return new Set(rows.flatMap((r) => [r.a, r.b, r.c]).filter((x): x is string => !!x));
}

/**
 * Pozele și glasul de la amintiri le deschide doar cine vede amintirea (o ciornă sau un răspuns „doar pentru cel care a întrebat”
 * nu se văd prin link). Un fișier încărcat pentru o amintire încă nesalvată îl vede doar cine l-a încărcat.
 */
export async function canOpenDocument(db: Db, docId: string, treeId: string, uploadedBy: string | null, userId: string) {
  const uses = await db.select().from(memory).where(and(eq(memory.treeId, treeId),
    or(eq(memory.photoDocumentId, docId), eq(memory.audioDocumentId, docId), eq(memory.consentDocumentId, docId))));
  if (!uses.length) {
    if (uploadedBy === userId) return true;
    const [link] = await db.select({ id: documentLink.documentId }).from(documentLink).where(eq(documentLink.documentId, docId)).limit(1);
    return !!link;
  }
  const [mine] = await db.select({ id: person.id }).from(person).where(and(eq(person.treeId, treeId), eq(person.claimedByUserId, userId))).limit(1);
  for (const m of uses) if (await memoryVisible(db, m, { userId, personId: mine?.id ?? null })) return true;
  return false;
}
