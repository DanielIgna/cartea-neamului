/**
 * Istoricul schimbărilor din arbori, pentru panoul de admin („Istoric și limite”): cine a adăugat, a corectat, a șters sau a
 * schimbat legăturile cuiva, și când. Stă în audit_log (entity „persoana”), lângă erorile site-ului (entity „eroare”).
 * Ce se șterge rămâne aici întreg (fișa, legăturile, pozele legate), ca adminul să o poată pune înapoi. Amintirile din ladă
 * nu se copiază niciodată aici: textul lor nu ajunge în panou; se numără doar.
 */
import { and, count, eq, inArray, or } from "drizzle-orm";
import type { Db } from "@/db";
import { auditLog, document, documentLink, memory, person, raisedBy, relationship, tree, user } from "@/db/schema";

type Person = typeof person.$inferSelect;
type Exec = Pick<Db, "select" | "insert" | "update" | "delete">;

export const ENTITY = "persoana";
export type LogAction = "adaugare" | "modificare" | "stergere" | "unire" | "legaturi" | "anulare";

/** Câmpurile unei fișe care se pot schimba din formular, cu numele lor în panou (panoul rămâne în română). */
export const FIELD_LABELS: Record<string, string> = {
  givenName: "Prenume", surname: "Nume", birthSurname: "Numele de la naștere", sex: "Sex",
  birthDateText: "Născut(ă)", birthPlace: "Locul nașterii", birthCountry: "Țara nașterii",
  deathDateText: "Decedat(ă)", deathPlace: "Locul morții", deathCountry: "Țara morții",
  residencePlace: "Locuiește în", residenceCountry: "Țara în care locuiește", living: "În viață", discreet: "Discret(ă)",
  occupation: "Ocupația", biography: "Ce se știe despre persoană", notes: "Note", photoDocumentId: "Poza de profil",
};
/** Și câmpurile calculate din ele (intervalele datelor), ca anularea să pună totul exact cum era. */
const TRACKED = [...Object.keys(FIELD_LABELS), "birthFrom", "birthTo", "deathFrom", "deathTo"] as const;

export type LogDiff = {
  /** Numele persoanei, cum era în clipa schimbării (ca să se citească și după ce fișa a fost ștearsă). */
  name: string;
  /** O propoziție pentru panou: „a adăugat-o ca mamă a lui Avram Igna”, „a schimbat tatăl lui Ion”. */
  summary?: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  snapshot?: Snapshot;
  /** Anulată din panou: când și de cine. */
  undone?: { at: string; by: string };
};

export const personName = (p: Pick<Person, "givenName" | "surname">) => `${p.givenName} ${p.surname}`.trim() || "(fără nume)";

/** Doar câmpurile schimbate, înainte și după. `null` dacă nu s-a schimbat nimic. */
export function fieldChanges(before: Partial<Person>, after: Partial<Person>) {
  const b: Record<string, unknown> = {}, a: Record<string, unknown> = {};
  for (const k of TRACKED) {
    if (!(k in after)) continue;
    const x = (before as Record<string, unknown>)[k] ?? null, y = (after as Record<string, unknown>)[k] ?? null;
    if (x !== y) { b[k] = x; a[k] = y; }
  }
  return Object.keys(a).length ? { before: b, after: a } : null;
}

export async function logChange(db: Pick<Db, "insert">, e: { treeId: string; actorId: string | null; personId: string; action: LogAction; diff: LogDiff }) {
  await db.insert(auditLog).values({ treeId: e.treeId, actorId: e.actorId, entity: ENTITY, entityId: e.personId, action: e.action, diff: e.diff });
}

/** Tot ce dispare odată cu o fișă ștearsă și se poate pune înapoi. */
export type Snapshot = {
  person: Record<string, unknown>;
  rels: { type: "parent_child" | "partnership"; personA: string; personB: string; subtype: string | null; startText: string | null; endText: string | null }[];
  raised: { childId: string; carerId: string }[];
  docs: { documentId: string; role: string }[];
  wasRoot: boolean;
  /** Câte amintiri erau în lada ei: ele nu se pot aduce înapoi (nu le copiem textul). */
  memories: number;
};

export async function snapshotPerson(db: Pick<Db, "select">, treeId: string, personId: string): Promise<Snapshot | null> {
  const [p] = await db.select().from(person).where(and(eq(person.id, personId), eq(person.treeId, treeId)));
  if (!p) return null;
  const rels = await db.select().from(relationship).where(and(eq(relationship.treeId, treeId), or(eq(relationship.personA, personId), eq(relationship.personB, personId))));
  const raised = await db.select({ childId: raisedBy.childId, carerId: raisedBy.carerId }).from(raisedBy)
    .where(and(eq(raisedBy.treeId, treeId), or(eq(raisedBy.childId, personId), eq(raisedBy.carerId, personId))));
  const docs = await db.select({ documentId: documentLink.documentId, role: documentLink.role }).from(documentLink).where(eq(documentLink.personId, personId));
  const [t] = await db.select({ root: tree.rootPersonId }).from(tree).where(eq(tree.id, treeId));
  const [m] = await db.select({ n: count() }).from(memory).where(eq(memory.personId, personId));
  return {
    person: { ...p, createdAt: p.createdAt.toISOString(), updatedAt: p.updatedAt.toISOString() },
    rels: rels.map((r) => ({ type: r.type, personA: r.personA, personB: r.personB, subtype: r.subtype, startText: r.startText, endText: r.endText })),
    raised, docs, wasRoot: t?.root === personId, memories: Number(m?.n ?? 0),
  };
}

/**
 * Pune înapoi o fișă ștearsă, cu același id: legăturile cu cei care mai sunt în arbore, cine a crescut-o, pozele care mai există.
 * Întoarce câte legături n-au mai putut fi refăcute (cealaltă persoană a fost ștearsă între timp).
 */
export async function restoreSnapshot(db: Exec, treeId: string, s: Snapshot) {
  const p = s.person as Person & { createdAt: string; updatedAt: string };
  const [exists] = await db.select({ id: person.id }).from(person).where(eq(person.id, p.id));
  if (exists) return { error: "Fișa există deja în arbore." } as const;
  const [t] = await db.select({ id: tree.id, root: tree.rootPersonId }).from(tree).where(eq(tree.id, treeId));
  if (!t) return { error: "Arborele nu mai există." } as const;
  const userOk = async (id: string | null) => (id ? !!(await db.select({ id: user.id }).from(user).where(eq(user.id, id)))[0] : false);
  const claimed = (await userOk(p.claimedByUserId)) ? p.claimedByUserId : null;
  const [photo] = p.photoDocumentId ? await db.select({ id: document.id }).from(document).where(eq(document.id, p.photoDocumentId)) : [];
  await db.insert(person).values({
    ...p, treeId, createdAt: new Date(p.createdAt), updatedAt: new Date(),
    claimedByUserId: claimed, privacy: claimed ? p.privacy : p.privacy === "claimed" ? "private_tree" : p.privacy,
    createdBy: (await userOk(p.createdBy)) ? p.createdBy : null, photoDocumentId: photo ? p.photoDocumentId : null,
  });
  const others = [...new Set([...s.rels.flatMap((r) => [r.personA, r.personB]), ...s.raised.flatMap((r) => [r.childId, r.carerId])])];
  const alive = new Set(others.length ? (await db.select({ id: person.id }).from(person).where(and(eq(person.treeId, treeId), inArray(person.id, others)))).map((x) => x.id) : []);
  let lost = 0;
  for (const r of s.rels) {
    if (!alive.has(r.personA) || !alive.has(r.personB)) { lost++; continue; }
    await db.insert(relationship).values({ treeId, ...r }).onConflictDoNothing();
  }
  for (const r of s.raised) {
    if (!alive.has(r.childId) || !alive.has(r.carerId)) { lost++; continue; }
    await db.insert(raisedBy).values({ treeId, ...r }).onConflictDoNothing();
  }
  const docIds = s.docs.map((d) => d.documentId);
  const docsLeft = new Set(docIds.length ? (await db.select({ id: document.id }).from(document).where(inArray(document.id, docIds))).map((x) => x.id) : []);
  for (const d of s.docs) if (docsLeft.has(d.documentId)) await db.insert(documentLink).values({ documentId: d.documentId, personId: p.id, role: d.role });
  if (s.wasRoot && !t.root) await db.update(tree).set({ rootPersonId: p.id }).where(eq(tree.id, treeId));
  return { ok: true, lost } as const;
}
