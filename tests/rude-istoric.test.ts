import { describe, it, expect, beforeAll } from "vitest";
import { and, eq } from "drizzle-orm";
import { createDb, type Db } from "@/db";
import { runMigrations } from "@/db/migrate";
import { auditLog, document, documentLink, person, relationship, tree, user } from "@/db/schema";
import { buildGraph } from "@/lib/kinship";
import { closeFamily, closeKinIds, mayEdit, shareIds } from "@/lib/relatives";
import { fieldChanges, logChange, personName, snapshotPerson } from "@/lib/edit-log";
import { changeLog, changeStats, fieldLines, undoChange, undoKind } from "@/lib/admin-istoric";
import { editLimits, limitFor, setTreeLimit, setUserLimit } from "@/lib/edit-limits";

/**
 * Neamul lui Ioan Daniel: părinții Avram și Floarea, bunicii Gavril și Onița (după tată) și Iosif Todea (după mamă),
 * fratele Nicolae Radu cu fiica lui Maria, soția Ana și fiul Luca, cu fiica lui Sara.
 */
let db: Db, treeId: string;
const P: Record<string, string> = {};

beforeAll(async () => {
  process.env.PGLITE_DIR = "memory";
  db = createDb();
  await runMigrations(db);
  await db.insert(user).values([{ id: "daniel", name: "Daniel", email: "daniel@test.ro" }, { id: "nicu", name: "Nicu", email: "nicu@test.ro" }]);
  const [t] = await db.insert(tree).values({ name: "Neamul Igna", ownerId: "daniel" }).returning();
  treeId = t.id;
  const add = async (k: string, v: Partial<typeof person.$inferInsert>) => { P[k] = (await db.insert(person).values({ treeId, givenName: k, surname: "Igna", ...v }).returning())[0].id; };
  await add("gavril", { givenName: "Gavril", sex: "M" });
  await add("onita", { givenName: "Onița", sex: "F" });
  await add("iosif", { givenName: "Iosif", surname: "Todea", sex: "M" });
  await add("avram", { givenName: "Avram", sex: "M" });
  await add("floarea", { givenName: "Floarea", sex: "F", birthDateText: "1950" });
  await add("daniel", { givenName: "Ioan Daniel", sex: "M", claimedByUserId: "daniel" });
  await add("nicolae", { givenName: "Nicolae Radu", sex: "M", claimedByUserId: "nicu" });
  await add("maria", { givenName: "Maria", sex: "F" });
  await add("ana", { givenName: "Ana", sex: "F" });
  await add("luca", { givenName: "Luca", sex: "M" });
  await add("sara", { givenName: "Sara", sex: "F" });
  await add("strain", { givenName: "Vasile", surname: "Pop", sex: "M" });
  const rel = (type: "parent_child" | "partnership", a: string, b: string) => db.insert(relationship).values({ treeId, type, personA: P[a], personB: P[b] });
  await rel("parent_child", "gavril", "avram"); await rel("parent_child", "onita", "avram"); await rel("parent_child", "iosif", "floarea");
  for (const c of ["daniel", "nicolae"]) { await rel("parent_child", "avram", c); await rel("parent_child", "floarea", c); }
  await rel("partnership", "avram", "floarea");
  await rel("parent_child", "nicolae", "maria");
  await rel("partnership", "daniel", "ana");
  await rel("parent_child", "daniel", "luca"); await rel("parent_child", "ana", "luca");
  await rel("parent_child", "luca", "sara");
});

async function graph() {
  const people = await db.select().from(person).where(eq(person.treeId, treeId));
  const rels = await db.select({ type: relationship.type, a: relationship.personA, b: relationship.personB }).from(relationship).where(eq(relationship.treeId, treeId));
  return buildGraph(people, rels);
}

describe("familia apropiată din profil", () => {
  it("găsește părinții, bunicii din ambele părți, soția, fratele, copilul și nepoții", async () => {
    const f = closeFamily(await graph(), P.daniel);
    expect([f.father, f.mother]).toEqual([P.avram, P.floarea]);
    expect(f.paternal).toEqual({ parent: P.avram, grandfather: P.gavril, grandmother: P.onita });
    expect(f.maternal).toEqual({ parent: P.floarea, grandfather: P.iosif, grandmother: null });
    expect(f.partners).toEqual([P.ana]);
    expect(f.siblings).toEqual([P.nicolae]);
    expect(f.children).toEqual([P.luca]);
    expect(f.nephews).toEqual([{ via: P.nicolae, ids: [P.maria] }]);
    expect(f.grandchildren).toEqual([{ via: P.luca, ids: [P.sara] }]);
  });

  it("fără tată, bunicii din partea lui rămân goi (se adaugă întâi tatăl)", async () => {
    const f = closeFamily(await graph(), P.gavril);
    expect(f.father).toBeNull();
    expect(f.paternal).toEqual({ parent: null, grandfather: null, grandmother: null });
  });

  it("la „+ Mamă” primesc noua mamă și frații fără mamă; la „+ Soț” copiii cu un singur părinte", async () => {
    const g = await graph();
    const sex = (id: string) => g.sex.get(id);
    expect(shareIds(g, sex, P.maria, "mother")).toEqual([]);
    expect(shareIds(g, sex, P.nicolae, "spouse")).toEqual([P.maria]);
  });

  it("din profilul lui, fiecare își poate corecta rudele apropiate, dar nu fișa revendicată de altcineva și nici străinii", async () => {
    const kin = closeKinIds(await graph(), P.daniel);
    const base = { editor: false, contributor: true, meId: "daniel", kin };
    const t = (k: string, claimedBy: string | null = null) => ({ id: P[k], createdBy: null, claimedBy });
    for (const k of ["avram", "floarea", "gavril", "onita", "iosif", "ana", "luca", "sara", "maria"]) expect(mayEdit({ ...base, target: t(k) })).toBe(true);
    expect(mayEdit({ ...base, target: t("nicolae", "nicu") })).toBe(false);
    expect(mayEdit({ ...base, target: t("strain") })).toBe(false);
    expect(mayEdit({ ...base, contributor: false, target: t("avram") })).toBe(false);
    expect(mayEdit({ ...base, kin: null, editor: true, target: t("strain") })).toBe(true);
  });
});

describe("limitele de editare", () => {
  it("fără limite, nimic oprit; apoi fiecare limită oprește ce trebuie", async () => {
    expect(limitFor(await editLimits(db), treeId, "nicu", "contributor", "delete")).toBeNull();
    await setUserLimit(db, "nicu", "fara-stergeri", "a șters frații", "daniel");
    let l = await editLimits(db);
    expect(l.users.nicu.note).toBe("a șters frații");
    expect(limitFor(l, treeId, "nicu", "contributor", "edit")).toBeNull();
    expect(limitFor(l, treeId, "nicu", "contributor", "delete")).toBe("noDelete");
    await setUserLimit(db, "nicu", "doar-adauga", null, "daniel");
    l = await editLimits(db);
    expect(limitFor(l, treeId, "nicu", "contributor", "add")).toBeNull();
    expect(limitFor(l, treeId, "nicu", "contributor", "edit")).toBe("addOnly");
    await setUserLimit(db, "nicu", "blocat", null, "daniel");
    expect(limitFor(await editLimits(db), treeId, "nicu", "editor", "add")).toBe("blocked");
    await setUserLimit(db, "nicu", null, null, "daniel");
    expect(limitFor(await editLimits(db), treeId, "nicu", "contributor", "delete")).toBeNull();
  });

  it("un arbore închis lasă doar editorii, unul înghețat doar proprietarul", async () => {
    await setTreeLimit(db, treeId, "editori", null, "daniel");
    let l = await editLimits(db);
    expect(limitFor(l, treeId, "nicu", "contributor", "add")).toBe("treeEditors");
    expect(limitFor(l, treeId, "nicu", "editor", "add")).toBeNull();
    expect(limitFor(l, "alt-arbore", "nicu", "contributor", "add")).toBeNull();
    await setTreeLimit(db, treeId, "proprietar", null, "daniel");
    l = await editLimits(db);
    expect(limitFor(l, treeId, "nicu", "editor", "edit")).toBe("treeOwner");
    expect(limitFor(l, treeId, "daniel", "owner", "delete")).toBeNull();
    await setTreeLimit(db, treeId, null, null, "daniel");
    expect((await editLimits(db)).trees).toEqual({});
  });
});

describe("istoricul schimbărilor și anularea lor", () => {
  it("o corectură păstrează doar câmpurile schimbate și se poate anula", async () => {
    const [before] = await db.select().from(person).where(eq(person.id, P.floarea));
    const after = { givenName: "Floare", surname: "Igna", birthDateText: "1951", birthFrom: "1951-01-01", birthTo: "1951-12-31", sex: "F" as const };
    const changed = fieldChanges(before, after)!;
    expect(Object.keys(changed.after).sort()).toEqual(["birthDateText", "birthFrom", "birthTo", "givenName"]);
    await db.update(person).set(after).where(eq(person.id, P.floarea));
    await logChange(db, { treeId, actorId: "nicu", personId: P.floarea, action: "modificare", diff: { name: "Floare Igna", ...changed } });
    const [row] = await changeLog(db, { actorId: "nicu" });
    expect(fieldLines(row.diff)).toContainEqual({ label: "Prenume", before: "Floarea", after: "Floare" });
    expect(undoKind(row)).toBe("revert");
    expect(await undoChange(db, row.id, "daniel")).toHaveProperty("ok");
    const [back] = await db.select().from(person).where(eq(person.id, P.floarea));
    expect([back.givenName, back.birthDateText, back.birthFrom]).toEqual(["Floarea", "1950", before.birthFrom]);
    expect(await undoChange(db, row.id, "daniel")).toEqual({ error: "E deja anulată." });
  });

  it("o fișă ștearsă se pune înapoi cu legăturile și pozele ei", async () => {
    const [doc] = await db.insert(document).values({ treeId, kind: "photo", title: "Maria la nuntă" }).returning();
    await db.insert(documentLink).values({ documentId: doc.id, personId: P.maria });
    const snap = (await snapshotPerson(db, treeId, P.maria))!;
    expect(snap.rels).toHaveLength(1);
    expect(snap.docs).toEqual([{ documentId: doc.id, role: "subject" }]);
    await db.delete(person).where(eq(person.id, P.maria));
    await logChange(db, { treeId, actorId: "nicu", personId: P.maria, action: "stergere", diff: { name: "Maria Igna", snapshot: snap } });
    const [row] = await changeLog(db, { action: "stergere" });
    expect(row.personExists).toBe(false);
    expect(undoKind(row)).toBe("restore");
    const r = await undoChange(db, row.id, "daniel");
    expect(r).toEqual({ ok: "Maria Igna e din nou în arbore, cu toate legăturile." });
    const g = await graph();
    expect(g.parents.get(P.maria)).toEqual([P.nicolae]);
    expect(await db.select().from(documentLink).where(and(eq(documentLink.personId, P.maria), eq(documentLink.documentId, doc.id)))).toHaveLength(1);
  });

  it("o adăugare greșită se scoate din arbore și se poate pune înapoi", async () => {
    const [p] = await db.insert(person).values({ treeId, givenName: "Greșit", surname: "Pus", sex: "M", createdBy: "nicu" }).returning();
    await db.insert(relationship).values({ treeId, type: "parent_child", personA: p.id, personB: P.luca });
    await logChange(db, { treeId, actorId: "nicu", personId: p.id, action: "adaugare", diff: { name: personName(p), summary: "Adăugat ca tată pentru Luca" } });
    const [row] = await changeLog(db, { action: "adaugare" });
    expect(undoKind(row)).toBe("remove");
    expect(await undoChange(db, row.id, "daniel")).toHaveProperty("ok");
    expect(await db.select().from(person).where(eq(person.id, p.id))).toHaveLength(0);
    const [undo] = await changeLog(db, { action: "anulare" });
    expect(undoKind(undo)).toBe("restore");
    expect(await undoChange(db, undo.id, "daniel")).toHaveProperty("ok");
    expect((await graph()).parents.get(P.luca)?.includes(p.id)).toBe(true);
  });

  it("nu scoate din panou pe cineva care și-a revendicat fișa; numără schimbările", async () => {
    await logChange(db, { treeId, actorId: "daniel", personId: P.nicolae, action: "adaugare", diff: { name: "Nicolae Radu Igna" } });
    const [row] = await changeLog(db, { action: "adaugare" });
    expect(await undoChange(db, row.id, "daniel")).toEqual({ error: "Persoana și-a revendicat fișa cu contul ei; nu o scot din panou." });
    const s = await changeStats(db);
    expect(s.total).toBe((await db.select().from(auditLog).where(eq(auditLog.entity, "persoana"))).length);
    expect(s.deleted).toBe(1);
  });
});
