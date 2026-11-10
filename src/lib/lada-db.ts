import { and, eq, inArray, isNotNull, ne, or, type SQL } from "drizzle-orm";
import type { Db } from "@/db";
import { document, documentLink, memory, memoryMention, memoryQuestion, memoryReply, person, relationship, tree, user } from "@/db/schema";
import { buildGraph, type Graph } from "./kinship";
import { canSee, type Viewer, type Visibility } from "./lada";
import { canSeeHouse, housesWithPhoto } from "./old-house";

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

/** O amintire pe harta neamului: unde s-a întâmplat, în lada cui e și cum o recunoști în listă. */
export type PlaceMemory = {
  id: string; personId: string; teller: string; title: string; when: string | null; year: number | null; audio: boolean; place: string; createdAt: string;
};

/** Începutul unei amintiri fără titlu, tăiat la un cuvânt întreg. */
export function excerpt(s: string, n = 90) {
  const t = s.replace(/\s+/g, " ").trim();
  if (t.length <= n) return t;
  const cut = t.slice(0, n), sp = cut.lastIndexOf(" ");
  return `${(sp > n / 2 ? cut.slice(0, sp) : cut).replace(/[\s,.;:!?–-]+$/, "")}…`;
}

/**
 * Amintirile dintr-un arbore pe care le vede `viewer`, cu aceleași reguli ca pe profil, fără ciorne și fără lăzile
 * celor discreți. `only` restrânge căutarea (doar cele cu loc, doar cele pentru carte). Întoarce și cine e fiecare om
 * din ladă și numele conturilor (cine a întrebat, cine a înregistrat).
 */
async function seenMemories(db: Db, treeId: string, viewer: Viewer, only: SQL) {
  const rows = await db.select().from(memory).where(and(eq(memory.treeId, treeId), ne(memory.visibility, "private"), only)).orderBy(memory.createdAt);
  const people = rows.length ? await db.select({ id: person.id, sex: person.sex, given: person.givenName, surname: person.surname, claimedBy: person.claimedByUserId,
    discreet: person.discreet, living: person.living }).from(person).where(eq(person.treeId, treeId)) : [];
  const byId = new Map(people.map((p) => [p.id, p]));
  if (!rows.length) return { seen: [] as (typeof rows[number] & { askedBy: string | null })[], byId, nameOf: (_: string | null) => null as string | null };
  const rels = await db.select({ type: relationship.type, a: relationship.personA, b: relationship.personB }).from(relationship).where(eq(relationship.treeId, treeId));
  const [t] = await db.select({ degree: tree.chatMaxDegree }).from(tree).where(eq(tree.id, treeId));
  const askedIds = [...new Set(rows.map((m) => m.askedId).filter((x): x is string => !!x))];
  const askedBy = new Map(askedIds.length
    ? (await db.select({ id: memoryQuestion.id, by: memoryQuestion.askedBy }).from(memoryQuestion).where(inArray(memoryQuestion.id, askedIds))).map((q) => [q.id, q.by])
    : []);
  const g = buildGraph(people, rels);
  const seen = rows.map((m) => ({ ...m, askedBy: m.askedId ? askedBy.get(m.askedId) ?? null : null })).filter((m) => {
    const p = byId.get(m.personId);
    return !!p && !p.discreet && canSee(m, viewer, g, t?.degree ?? 4, p.claimedBy);
  });
  // Numele unui cont: din fișa lui revendicată în arbore, altfel numele contului.
  const userIds = [...new Set(seen.flatMap((m) => [m.authorId, m.askedBy]).filter((x): x is string => !!x))];
  const accounts = new Map(userIds.length ? (await db.select({ id: user.id, name: user.name }).from(user).where(inArray(user.id, userIds))).map((u) => [u.id, u.name]) : []);
  const nameOf = (uid: string | null) => {
    if (!uid) return null;
    const p = people.find((x) => x.claimedBy === uid);
    return p ? `${p.given} ${p.surname}`.trim() : accounts.get(uid) ?? null;
  };
  return { seen, byId, nameOf };
}

/** Amintirile cu loc pe care le vede `viewer`, pentru harta neamului. */
export async function placedMemories(db: Db, treeId: string, viewer: Viewer,
  words: { quoted: (text: string) => string; voice: string; plain: string } = { quoted: (s) => `„${s}”`, voice: "Amintire spusă cu glasul", plain: "Amintire" }): Promise<PlaceMemory[]> {
  const { seen, byId } = await seenMemories(db, treeId, viewer, isNotNull(memory.place));
  return seen.filter((m) => m.place?.trim()).map((m): PlaceMemory => {
    const p = byId.get(m.personId)!;
    const title = m.title?.trim() || (m.question?.trim() ? words.quoted(m.question.trim()) : "") || excerpt(m.body) || (m.audioDocumentId ? words.voice : words.plain);
    return { id: m.id, personId: m.personId, teller: `${p.given} ${p.surname}`.trim(), title, when: m.whenText?.trim() || null, year: m.whenYear,
      audio: !!m.audioDocumentId, place: m.place!.trim(), createdAt: m.createdAt.toISOString() };
  }).sort((a, b) => (a.year ?? 9999) - (b.year ?? 9999) || a.createdAt.localeCompare(b.createdAt));
}

/** O amintire în capitolul „Cu vorbele lor” din Cartea neamului. */
export type BookMemory = {
  id: string; personId: string; chapter: string; title: string | null; question: string | null; askedBy: string | null; body: string;
  when: string | null; year: number | null; place: string | null; photoId: string | null; audio: boolean; audioSeconds: number | null;
  recordedBy: string | null; createdAt: string;
};

/**
 * Ce intră în capitolul „Cu vorbele lor”: amintirile pe care autorul le-a lăsat să intre în carte și pe care le vede cel care
 * face cartea. Răspunsurile „doar pentru cel care a întrebat” nu intră, chiar bifate. Cei în viață apar după alegerea cărții:
 * cu `ascunsi` amintirile lor lipsesc, cu `nume` apar fără poze (ei au ales să intre în carte, dar fețele rămân acasă).
 */
export async function bookMemories(db: Db, treeId: string, viewer: Viewer, living: "tot" | "nume" | "ascunsi", photos = true): Promise<BookMemory[]> {
  const { seen, byId, nameOf } = await seenMemories(db, treeId, viewer, eq(memory.inBook, true));
  return seen.flatMap((m): BookMemory[] => {
    const p = byId.get(m.personId)!;
    // Răspunsurile doar pentru cel care a întrebat nu intră niciodată; cele pentru familia apropiată doar în ediția pentru familie
    // (cu cei în viață „doar cu numele” sau ascunși, cartea poate fi dată și altora).
    if (m.visibility === "asker" || (m.visibility === "close" && living !== "tot") || (p.living && living === "ascunsi")) return [];
    if (!m.body.trim() && !m.audioDocumentId) return [];
    const photo = photos && !(p.living && living === "nume") ? m.photoDocumentId : null;
    return [{ id: m.id, personId: m.personId, chapter: m.chapter, title: m.title?.trim() || null, question: m.question?.trim() || null,
      askedBy: m.askedId ? nameOf(m.askedBy) : null, body: m.body.trim(), when: m.whenText?.trim() || null, year: m.whenYear, place: m.place?.trim() || null,
      photoId: photo, audio: !!m.audioDocumentId, audioSeconds: m.audioSeconds, recordedBy: m.helper ? nameOf(m.authorId) : null, createdAt: m.createdAt.toISOString() }];
  });
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
  // Pozele de la casa bătrânească: le deschide doar cine vede casa (aceleași reguli ca la amintiri).
  const houses = await housesWithPhoto(db, treeId, docId);
  if (houses.length) {
    const [mine] = await db.select({ id: person.id }).from(person).where(and(eq(person.treeId, treeId), eq(person.claimedByUserId, userId))).limit(1);
    const viewer = { userId, personId: mine?.id ?? null };
    const [t] = await db.select({ degree: tree.chatMaxDegree }).from(tree).where(eq(tree.id, treeId));
    const people = await db.select({ id: person.id, sex: person.sex, claimedBy: person.claimedByUserId }).from(person).where(eq(person.treeId, treeId));
    const rels = await db.select({ type: relationship.type, a: relationship.personA, b: relationship.personB }).from(relationship).where(eq(relationship.treeId, treeId));
    const g = buildGraph(people, rels);
    for (const h of houses) if (canSeeHouse(h, viewer, g, t?.degree ?? 4, people.find((p) => p.id === h.personId)?.claimedBy ?? null)) return true;
    if (!uses.length) return false;
  }
  if (!uses.length) {
    if (uploadedBy === userId) return true;
    const [link] = await db.select({ id: documentLink.documentId }).from(documentLink).where(eq(documentLink.documentId, docId)).limit(1);
    return !!link;
  }
  const [mine] = await db.select({ id: person.id }).from(person).where(and(eq(person.treeId, treeId), eq(person.claimedByUserId, userId))).limit(1);
  for (const m of uses) if (await memoryVisible(db, m, { userId, personId: mine?.id ?? null })) return true;
  return false;
}

/** Baza de date sau o tranzacție: tot ce trebuie ca să citim și să ștergem. */
export type Q = Pick<Db, "select" | "insert" | "update" | "delete">;

/**
 * Șterge amintirile împreună cu fișierele puse doar la ele (poza, glasul, acordul înregistrat „la bunici”): cele care nu sunt
 * și în albumul cuiva, nici poză de profil, nici la o altă amintire. Întoarce cheile fișierelor, ca să fie șterse din stocare
 * după ce tranzacția s-a încheiat.
 */
export async function dropMemories(db: Q, ids: string[]): Promise<string[]> {
  if (!ids.length) return [];
  const rows = await db.select({ a: memory.photoDocumentId, b: memory.audioDocumentId, c: memory.consentDocumentId }).from(memory).where(inArray(memory.id, ids));
  const media = [...new Set(rows.flatMap((r) => [r.a, r.b, r.c]).filter((x): x is string => !!x))];
  await db.delete(memory).where(inArray(memory.id, ids));
  if (!media.length) return [];
  const linked = new Set((await db.select({ id: documentLink.documentId }).from(documentLink).where(inArray(documentLink.documentId, media))).map((r) => r.id));
  const still = await db.select({ a: memory.photoDocumentId, b: memory.audioDocumentId, c: memory.consentDocumentId }).from(memory)
    .where(or(inArray(memory.photoDocumentId, media), inArray(memory.audioDocumentId, media), inArray(memory.consentDocumentId, media)));
  const used = new Set(still.flatMap((r) => [r.a, r.b, r.c]));
  const profile = new Set((await db.select({ id: person.photoDocumentId }).from(person).where(inArray(person.photoDocumentId, media))).map((r) => r.id));
  const orphans = media.filter((id) => !linked.has(id) && !used.has(id) && !profile.has(id));
  if (!orphans.length) return [];
  const gone = await db.delete(document).where(inArray(document.id, orphans)).returning({ key: document.fileKey });
  return gone.map((d) => d.key).filter((k): k is string => !!k);
}
