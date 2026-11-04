"use server";
import { revalidatePath } from "next/cache";
import { and, eq, inArray, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { document, memory, memoryMention, memoryQuestion, memoryReply, person } from "@/db/schema";
import { can, currentUser, roleIn } from "@/lib/access";
import { yearIn } from "@/lib/lada";
import { memoryVisible } from "@/lib/lada-db";
import { isChapter } from "@/lib/questions";

type Result = { ok?: boolean; id?: string; error?: string };
const uuid = z.string().uuid();
const blank = (s: string | null | undefined) => (s && s.trim() ? s.trim() : null);

/** Cine e în arbore și ce fișă și-a revendicat: tot ce trebuie ca să știm cine poate vedea o amintire. */
async function member(treeId: string) {
  const me = await currentUser();
  if (!me || !uuid.safeParse(treeId).success) return null;
  const role = await roleIn(db, treeId, me.id);
  if (!role) return null;
  const [mine] = await db.select({ id: person.id }).from(person).where(and(eq(person.treeId, treeId), eq(person.claimedByUserId, me.id))).limit(1);
  return { me, role, personId: mine?.id ?? null };
}

const touch = (treeId: string) => revalidatePath(`/arbore/${treeId}`, "layout");

const MemoryInput = z.object({
  treeId: uuid, personId: uuid, id: uuid.optional(),
  chapter: z.string().refine(isChapter, "Alege capitolul."),
  question: z.string().trim().max(400).nullish(), questionKey: z.string().trim().max(120).nullish(), askedId: uuid.nullish(),
  title: z.string().trim().max(160).nullish(),
  body: z.string().trim().max(20000, "Amintirea e prea lungă; împarte-o în două."),
  whenText: z.string().trim().max(80).nullish(), place: z.string().trim().max(160).nullish(), photoId: uuid.nullish(),
  audioId: uuid.nullish(), audioSeconds: z.number().int().min(0).max(4 * 3600).nullish(),
  visibility: z.enum(["private", "asker", "close", "tree"]), maxDegree: z.number().int().min(1).max(10).nullish(),
  inBook: z.boolean().optional(), mentions: z.array(uuid).max(30).optional(),
  // Modul „la bunici”: o rudă înregistrează pentru omul fără cont, care și-a dat acordul la început (poate și cu glasul lui).
  helper: z.boolean().optional(), consent: z.boolean().optional(), consentAudioId: uuid.nullish(),
}).refine((v) => v.body.length > 0 || !!v.audioId, { message: "Scrie amintirea sau spune-o cu glasul." });

/**
 * Scrie (sau schimbă) o amintire. Doar omul își scrie amintirile în lada lui, cu fișa revendicată; doar autorul le poate schimba.
 * Cei pomeniți primesc amintirea și pe profilul lor, păstrându-și alegerea de a o ascunde.
 */
export async function saveMemory(input: z.input<typeof MemoryInput>): Promise<Result> {
  const parsed = MemoryInput.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const v = parsed.data;
  const m = await member(v.treeId);
  if (!m) return { error: "Nu ești în acest arbore." };
  const [owner] = await db.select({ id: person.id, givenName: person.givenName, sex: person.sex, living: person.living, claimedBy: person.claimedByUserId }).from(person)
    .where(and(eq(person.id, v.personId), eq(person.treeId, v.treeId)));
  if (!owner) return { error: "Persoana nu mai e în arbore." };
  if (v.chapter === "credinta" && !owner.living) return { error: "Capitolul despre credință e doar pentru cei în viață, care răspund singuri." };
  let existing: typeof memory.$inferSelect | undefined;
  let helper = false;
  if (v.id) {
    [existing] = await db.select().from(memory).where(and(eq(memory.id, v.id), eq(memory.treeId, v.treeId)));
    if (!existing) return { error: "Amintirea nu mai există." };
    // Cea înregistrată „la bunici” e și a omului din ladă: după ce își face cont, o poate schimba și el.
    if (existing.authorId !== m.me.id && !(existing.helper && owner.claimedBy === m.me.id)) return { error: "Doar cine a scris amintirea o poate schimba." };
    if (existing.personId !== v.personId) return { error: "Date greșite." };
  } else if (owner.claimedBy !== m.me.id) {
    if (!v.helper) return { error: `Doar ${owner.givenName} își scrie amintirile în lada ${owner.sex === "F" ? "ei" : "lui"}. Tu îi poți lăsa o întrebare.` };
    if (owner.claimedBy) return { error: `${owner.givenName} are cont: își scrie singur${owner.sex === "F" ? "ă" : ""} amintirile.` };
    if (!owner.living) return { error: "Modul „la bunici” e pentru cei în viață." };
    if (!can(m.role, "contributor")) return { error: "Nu ai drept să adaugi în acest arbore." };
    if (!v.consent) return { error: `Întâi ${owner.sex === "F" ? "întreab-o" : "întreabă-l"} dacă e de acord să-i păstrăm povestea în arbore.` };
    helper = true;
  }
  const askedId = v.askedId ?? existing?.askedId ?? null;
  let asked: typeof memoryQuestion.$inferSelect | undefined;
  if (askedId) {
    [asked] = await db.select().from(memoryQuestion).where(and(eq(memoryQuestion.id, askedId), eq(memoryQuestion.personId, v.personId)));
    if (!asked) return { error: "Întrebarea nu mai există." };
    if (asked.memoryId && asked.memoryId !== existing?.id) return { error: "Ai răspuns deja la această întrebare." };
  }
  if (v.visibility === "asker" && !asked?.askedBy) return { error: "„Doar cel care a întrebat” se poate alege doar la răspunsul unei întrebări de la o rudă." };
  // Poza și glasul: încărcate de tine pentru amintirea asta (sau deja puse la ea), ca nimeni să nu poată arăta fișierele altcuiva.
  const kept = new Set([existing?.photoDocumentId, existing?.audioDocumentId, existing?.consentDocumentId].filter(Boolean));
  for (const [id, what] of [[v.photoId, "Poza"], [v.audioId, "Înregistrarea"], [v.consentAudioId, "Acordul înregistrat"]] as const) {
    if (!id || kept.has(id)) continue;
    const [d] = await db.select({ by: document.uploadedBy }).from(document).where(and(eq(document.id, id), eq(document.treeId, v.treeId)));
    if (!d || d.by !== m.me.id) return { error: `${what} nu e în acest arbore.` };
  }
  const named = v.mentions?.length
    ? (await db.select({ id: person.id }).from(person).where(and(eq(person.treeId, v.treeId), inArray(person.id, v.mentions)))).map((p) => p.id).filter((id) => id !== v.personId)
    : [];
  const values = {
    chapter: v.chapter, question: blank(v.question) ?? (asked ? asked.text : null), questionKey: asked ? null : blank(v.questionKey),
    askedId: asked?.id ?? null, title: blank(v.title), body: v.body.trim(), whenText: blank(v.whenText), whenYear: yearIn(v.whenText),
    place: blank(v.place), photoDocumentId: v.photoId ?? null, visibility: v.visibility, maxDegree: v.visibility === "close" ? (v.maxDegree ?? null) : null,
    inBook: !!v.inBook, audioDocumentId: v.audioId ?? null, audioSeconds: v.audioId ? (v.audioSeconds ?? existing?.audioSeconds ?? null) : null, updatedAt: new Date(),
    ...(helper ? { helper: true, consentAt: new Date(), consentDocumentId: v.consentAudioId ?? null } : {}),
  };
  const id = await db.transaction(async (tx) => {
    const [row] = existing
      ? await tx.update(memory).set(values).where(eq(memory.id, existing.id)).returning({ id: memory.id })
      : await tx.insert(memory).values({ ...values, treeId: v.treeId, personId: v.personId, authorId: m.me.id }).returning({ id: memory.id });
    const before = await tx.select().from(memoryMention).where(eq(memoryMention.memoryId, row.id));
    await tx.delete(memoryMention).where(eq(memoryMention.memoryId, row.id));
    for (const pid of named) await tx.insert(memoryMention).values({ memoryId: row.id, personId: pid, hidden: before.find((b) => b.personId === pid)?.hidden ?? false });
    if (asked) await tx.update(memoryQuestion).set({ memoryId: row.id, dismissed: false }).where(eq(memoryQuestion.id, asked.id));
    return row.id;
  });
  touch(v.treeId);
  return { ok: true, id };
}

/** Șterge o amintire: doar cine a scris-o. Poza rămâne în albumul omului. */
export async function deleteMemory(treeId: string, id: string): Promise<Result> {
  const m = await member(treeId);
  if (!m || !uuid.safeParse(id).success) return { error: "Nu ești în acest arbore." };
  const [row] = await db.select({ authorId: memory.authorId, helper: memory.helper, personId: memory.personId }).from(memory).where(and(eq(memory.id, id), eq(memory.treeId, treeId)));
  if (!row) return { error: "Amintirea nu mai există." };
  if (row.authorId !== m.me.id && !(row.helper && m.personId === row.personId)) return { error: "Doar cine a scris amintirea o poate șterge." };
  await db.delete(memory).where(eq(memory.id, id));
  touch(treeId);
  return { ok: true };
}

/** Cine e pomenit într-o amintire o poate ascunde de pe profilul lui (sau o poate arăta din nou). */
export async function hideMention(treeId: string, memoryId: string, personId: string, hidden: boolean): Promise<Result> {
  const m = await member(treeId);
  if (!m || !uuid.safeParse(memoryId).success || !uuid.safeParse(personId).success) return { error: "Nu ești în acest arbore." };
  if (m.personId !== personId) return { error: "Doar cel pomenit poate ascunde amintirea de pe profilul lui." };
  const [row] = await db.select({ id: memory.id }).from(memory).where(and(eq(memory.id, memoryId), eq(memory.treeId, treeId)));
  if (!row) return { error: "Amintirea nu mai există." };
  await db.update(memoryMention).set({ hidden }).where(and(eq(memoryMention.memoryId, memoryId), eq(memoryMention.personId, personId)));
  touch(treeId);
  return { ok: true };
}

/** „Și eu îmi amintesc”: oricine vede amintirea poate adăuga ce își amintește el. */
export async function addMemoryReply(treeId: string, memoryId: string, body: string): Promise<Result> {
  const m = await member(treeId);
  const text = (body ?? "").trim();
  if (!m || !uuid.safeParse(memoryId).success) return { error: "Nu ești în acest arbore." };
  if (!text) return { error: "Scrie ce îți amintești." };
  if (text.length > 4000) return { error: "E prea lung; scrie-o ca amintire în lada ta." };
  const [row] = await db.select().from(memory).where(and(eq(memory.id, memoryId), eq(memory.treeId, treeId)));
  if (!row || !(await memoryVisible(db, row, { userId: m.me.id, personId: m.personId }))) return { error: "Amintirea nu mai există." };
  if (row.visibility === "private") return { error: "E o ciornă; încă nu se poate răspunde la ea." };
  const [r] = await db.insert(memoryReply).values({ memoryId, authorId: m.me.id, body: text }).returning({ id: memoryReply.id });
  touch(treeId);
  return { ok: true, id: r.id };
}

/** Șterge un „Și eu îmi amintesc”: cine l-a scris sau autorul amintirii. */
export async function deleteMemoryReply(treeId: string, replyId: string): Promise<Result> {
  const m = await member(treeId);
  if (!m || !uuid.safeParse(replyId).success) return { error: "Nu ești în acest arbore." };
  const [r] = await db.select({ authorId: memoryReply.authorId, memoryAuthor: memory.authorId, helper: memory.helper, personId: memory.personId }).from(memoryReply)
    .innerJoin(memory, eq(memory.id, memoryReply.memoryId)).where(and(eq(memoryReply.id, replyId), eq(memory.treeId, treeId)));
  if (!r) return { error: "Nu mai există." };
  if (r.authorId !== m.me.id && r.memoryAuthor !== m.me.id && !(r.helper && r.personId === m.personId)) return { error: "Doar cine l-a scris îl poate șterge." };
  await db.delete(memoryReply).where(eq(memoryReply.id, replyId));
  touch(treeId);
  return { ok: true };
}

/** O întrebare lăsată în lada cuiva în viață („Bunico, cum era la nunta voastră?”). Cel mult 10 întrebări fără răspuns de la același om. */
export async function askQuestion(treeId: string, personId: string, text: string): Promise<Result> {
  const m = await member(treeId);
  const q = (text ?? "").trim();
  if (!m || !uuid.safeParse(personId).success) return { error: "Nu ești în acest arbore." };
  if (q.length < 3) return { error: "Scrie întrebarea." };
  if (q.length > 400) return { error: "Întrebarea e prea lungă (cel mult 400 de litere)." };
  const [p] = await db.select({ living: person.living }).from(person).where(and(eq(person.id, personId), eq(person.treeId, treeId)));
  if (!p) return { error: "Persoana nu mai e în arbore." };
  if (!p.living) return { error: "Întrebările se lasă doar celor în viață." };
  if (m.personId === personId) return { error: "Asta e lada ta: scrie direct amintirea." };
  const [open] = await db.select({ n: sql<number>`count(*)::int` }).from(memoryQuestion)
    .where(and(eq(memoryQuestion.personId, personId), eq(memoryQuestion.askedBy, m.me.id), isNull(memoryQuestion.memoryId), eq(memoryQuestion.dismissed, false)));
  if (Number(open?.n ?? 0) >= 10) return { error: "Ai deja 10 întrebări fără răspuns în lada aceasta. Așteaptă să răspundă la câteva." };
  const [r] = await db.insert(memoryQuestion).values({ treeId, personId, askedBy: m.me.id, text: q }).returning({ id: memoryQuestion.id });
  touch(treeId);
  return { ok: true, id: r.id };
}

/** Omul din ladă amână o întrebare („Nu acum”); cel care a întrebat își poate retrage întrebarea cât timp n-are răspuns. */
export async function dismissQuestion(treeId: string, questionId: string): Promise<Result> {
  const m = await member(treeId);
  if (!m || !uuid.safeParse(questionId).success) return { error: "Nu ești în acest arbore." };
  const [q] = await db.select().from(memoryQuestion).where(and(eq(memoryQuestion.id, questionId), eq(memoryQuestion.treeId, treeId)));
  if (!q) return { error: "Întrebarea nu mai există." };
  if (q.askedBy === m.me.id && !q.memoryId) await db.delete(memoryQuestion).where(eq(memoryQuestion.id, questionId));
  else if (m.personId === q.personId) await db.update(memoryQuestion).set({ dismissed: true }).where(eq(memoryQuestion.id, questionId));
  else return { error: "Doar omul din ladă poate amâna întrebarea." };
  touch(treeId);
  return { ok: true };
}
