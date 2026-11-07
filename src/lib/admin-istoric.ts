/**
 * „Istoric și limite” în panoul de admin: schimbările din arbori (cine, ce, când), anularea lor și limitele de editare.
 * Fișele sunt date de familie (nume, date, locuri); amintirile și mesajele nu ajung aici niciodată.
 */
import { and, desc, eq, gte, lt, sql, type SQL } from "drizzle-orm";
import type { Db } from "@/db";
import { auditLog, person, tree, user } from "@/db/schema";
import { ENTITY, FIELD_LABELS, logChange, personName, restoreSnapshot, snapshotPerson, type LogAction, type LogDiff, type Snapshot } from "./edit-log";

export const ACTION_LABELS: Record<LogAction, string> = {
  adaugare: "a adăugat", modificare: "a corectat", stergere: "a șters", unire: "a unit două fișe", legaturi: "a schimbat legături", anulare: "anulare din panou",
};
export const isAction = (v: unknown): v is LogAction => typeof v === "string" && v in ACTION_LABELS;

export type LogRow = {
  id: string; at: string; treeId: string | null; treeName: string | null; actorId: string | null; actorName: string | null; actorEmail: string | null;
  personId: string; action: LogAction; diff: LogDiff; personExists: boolean;
};

export const PAGE = 60;

/** Schimbările, cele mai noi întâi, cu filtre (arbore, om, fel) și „mai vechi decât” pentru pagina următoare. */
export async function changeLog(db: Db, f: { treeId?: string; actorId?: string; action?: LogAction; before?: string }): Promise<LogRow[]> {
  const conds: SQL[] = [eq(auditLog.entity, ENTITY)];
  if (f.treeId) conds.push(eq(auditLog.treeId, f.treeId));
  if (f.actorId) conds.push(eq(auditLog.actorId, f.actorId));
  if (f.action) conds.push(eq(auditLog.action, f.action));
  if (f.before && !Number.isNaN(Date.parse(f.before))) conds.push(lt(auditLog.createdAt, new Date(f.before)));
  const rows = await db.select({
    id: auditLog.id, at: auditLog.createdAt, treeId: auditLog.treeId, treeName: tree.name, actorId: auditLog.actorId, actorName: user.name, actorEmail: user.email,
    personId: auditLog.entityId, action: auditLog.action, diff: auditLog.diff, still: person.id,
  }).from(auditLog)
    .leftJoin(tree, eq(tree.id, auditLog.treeId))
    .leftJoin(user, eq(user.id, auditLog.actorId))
    .leftJoin(person, sql`${person.id}::text = ${auditLog.entityId}`)
    .where(and(...conds)).orderBy(desc(auditLog.createdAt)).limit(PAGE);
  return rows.map((r) => ({
    id: r.id, at: r.at.toISOString(), treeId: r.treeId, treeName: r.treeName, actorId: r.actorId, actorName: r.actorName, actorEmail: r.actorEmail,
    personId: r.personId, action: (isAction(r.action) ? r.action : "modificare"), diff: (r.diff ?? { name: "?" }) as LogDiff, personExists: !!r.still,
  }));
}

/** Cifrele de sus: câte schimbări și ștergeri în ultimele 7 zile. */
export async function changeStats(db: Db) {
  const since = new Date(Date.now() - 7 * 86_400_000);
  const r = await db.select({ action: auditLog.action, n: sql<number>`count(*)::int` }).from(auditLog)
    .where(and(eq(auditLog.entity, ENTITY), gte(auditLog.createdAt, since))).groupBy(auditLog.action);
  const by = Object.fromEntries(r.map((x) => [x.action, Number(x.n)]));
  return { total: r.reduce((s, x) => s + Number(x.n), 0), deleted: by.stergere ?? 0, added: by.adaugare ?? 0, edited: by.modificare ?? 0 };
}

/** Ce se poate face cu o schimbare din panou: „Pune înapoi” (ștergere), „Anulează” (corectură, adăugare) sau nimic. */
export function undoKind(r: Pick<LogRow, "action" | "diff" | "personExists">): "restore" | "revert" | "remove" | null {
  if (r.diff.undone) return null;
  if ((r.action === "stergere" || (r.action === "anulare" && r.diff.snapshot)) && r.diff.snapshot && !r.personExists) return "restore";
  if (r.action === "modificare" && r.diff.before && r.personExists) return "revert";
  if (r.action === "adaugare" && r.personExists) return "remove";
  return null;
}

/** Rândurile „vechi → nou” ale unei corecturi, cu numele câmpurilor în română. */
export function fieldLines(d: LogDiff) {
  if (!d.before || !d.after) return [];
  const show = (v: unknown) => (v === null || v === undefined || v === "" ? "—" : v === true ? "da" : v === false ? "nu" : String(v));
  return Object.keys(d.after).filter((k) => k in FIELD_LABELS).map((k) => ({ label: FIELD_LABELS[k], before: show(d.before![k]), after: show(d.after![k]) }));
}

/**
 * Anulează o schimbare din istoric: pune înapoi o fișă ștearsă, readuce valorile de dinainte de o corectură sau scoate
 * o persoană adăugată greșit. Anularea însăși intră în istoric (și se poate, la rândul ei, anula: o scoatere se pune înapoi).
 */
export async function undoChange(db: Db, logId: string, adminId: string): Promise<{ ok: string } | { error: string }> {
  const [row] = await db.select().from(auditLog).where(and(eq(auditLog.id, logId), eq(auditLog.entity, ENTITY)));
  if (!row || !row.treeId) return { error: "Schimbarea nu mai e în istoric." };
  const d = (row.diff ?? {}) as LogDiff;
  const [still] = await db.select().from(person).where(eq(person.id, row.entityId));
  const kind = isAction(row.action) ? undoKind({ action: row.action, diff: d, personExists: !!still }) : null;
  if (!kind) return { error: d.undone ? "E deja anulată." : "Aceasta nu se poate anula din panou." };
  const treeId = row.treeId;
  const when = row.createdAt.toISOString();
  const mark = async () => db.update(auditLog).set({ diff: { ...d, undone: { at: new Date().toISOString(), by: adminId } } }).where(eq(auditLog.id, logId));

  if (kind === "restore") {
    const r = await db.transaction(async (tx) => restoreSnapshot(tx as unknown as Db, treeId, d.snapshot as Snapshot));
    if ("error" in r) return { error: r.error ?? "Nu am putut pune fișa înapoi." };
    await mark();
    await logChange(db, { treeId, actorId: adminId, personId: row.entityId, action: "anulare", diff: { name: d.name, summary: `Pusă înapoi (fusese ștearsă pe ${when.slice(0, 10)})${r.lost ? `; ${r.lost} legături n-au mai putut fi refăcute` : ""}` } });
    return { ok: `${d.name} e din nou în arbore${r.lost ? `, fără ${r.lost} legături cu oameni șterși între timp` : ", cu toate legăturile"}.` };
  }
  if (kind === "revert") {
    const back = d.before as Record<string, unknown>;
    const values = Object.fromEntries(Object.entries(back).filter(([k]) => k in person && k !== "id" && k !== "treeId"));
    await db.update(person).set({ ...values, updatedAt: new Date() }).where(eq(person.id, row.entityId));
    await mark();
    await logChange(db, { treeId, actorId: adminId, personId: row.entityId, action: "anulare",
      diff: { name: personName(still!), summary: `A pus înapoi valorile de dinainte de corectura din ${when.slice(0, 10)}`, before: d.after, after: d.before } });
    return { ok: `Am pus înapoi fișa lui ${personName(still!)} cum era înainte.` };
  }
  // „remove”: persoana adăugată greșit iese din arbore, dar rămâne în istoric, ca să poată fi pusă înapoi.
  if (still!.claimedByUserId) return { error: "Persoana și-a revendicat fișa cu contul ei; nu o scot din panou." };
  const [t] = await db.select({ root: tree.rootPersonId }).from(tree).where(eq(tree.id, treeId));
  if (t?.root === still!.id) return { error: "E persoana de la care pornește arborele; nu poate fi scoasă." };
  const snapshot = await snapshotPerson(db, treeId, still!.id);
  if (snapshot?.memories) return { error: `Are ${snapshot.memories} amintiri în ladă, care s-ar pierde. Vorbește întâi cu familia.` };
  await db.delete(person).where(eq(person.id, still!.id));
  await mark();
  await logChange(db, { treeId, actorId: adminId, personId: still!.id, action: "anulare",
    diff: { name: personName(still!), summary: `Scoasă din arbore (adăugarea din ${when.slice(0, 10)} a fost anulată)`, snapshot: snapshot ?? undefined } });
  return { ok: `Am scos-o pe ${personName(still!)} din arbore. Se poate pune înapoi din istoric.` };
}
