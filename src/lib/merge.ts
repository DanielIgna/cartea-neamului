import { and, eq, or } from "drizzle-orm";
import type { Db } from "@/db";
import { bookExport, documentLink, invitation, person, relationship, tree } from "@/db/schema";

type Person = typeof person.$inferSelect;
const empty = (v: unknown) => v === null || v === undefined || v === "";
const pick = <T,>(a: T, b: T) => (empty(a) ? b : a);
/** Două texte lungi (biografie, note): le păstrăm pe amândouă, fără să repetăm același text. */
const both = (a: string | null, b: string | null) => (empty(a) ? b : empty(b) || a === b || a!.includes(b!) ? a : `${a}\n\n${b}`);

/** Ce rămâne în fișa păstrată: câmpurile ei, iar cele goale completate din dublură. */
export function mergedFields(keep: Person, drop: Person) {
  const birth = empty(keep.birthDateText) && !empty(drop.birthDateText) ? drop : keep;
  const death = empty(keep.deathDateText) && !empty(drop.deathDateText) ? drop : keep;
  const dead = !empty(keep.deathDateText) || !empty(drop.deathDateText);
  const claimedBy = keep.claimedByUserId ?? drop.claimedByUserId;
  return {
    givenName: keep.givenName.length >= drop.givenName.length ? keep.givenName : drop.givenName,
    surname: pick(keep.surname, drop.surname), birthSurname: pick(keep.birthSurname, drop.birthSurname),
    sex: keep.sex === "U" ? drop.sex : keep.sex,
    birthDateText: birth.birthDateText, birthFrom: birth.birthFrom, birthTo: birth.birthTo,
    birthPlace: pick(keep.birthPlace, drop.birthPlace), birthCountry: pick(keep.birthCountry, drop.birthCountry),
    deathDateText: death.deathDateText, deathFrom: death.deathFrom, deathTo: death.deathTo,
    deathPlace: pick(keep.deathPlace, drop.deathPlace), deathCountry: pick(keep.deathCountry, drop.deathCountry),
    residencePlace: pick(keep.residencePlace, drop.residencePlace), residenceCountry: pick(keep.residenceCountry, drop.residenceCountry),
    living: dead ? false : keep.living || drop.living, discreet: keep.discreet || drop.discreet,
    biography: both(keep.biography, drop.biography), notes: both(keep.notes, drop.notes),
    photoDocumentId: keep.photoDocumentId ?? drop.photoDocumentId, occupation: pick(keep.occupation, drop.occupation),
    claimedByUserId: claimedBy, privacy: claimedBy ? ("claimed" as const) : keep.privacy, gedcomXref: keep.gedcomXref ?? drop.gedcomXref,
    updatedAt: new Date(),
  };
}

/**
 * Unește dubla `dropId` în fișa `keepId`: soții, părinții, copiii, pozele și documentele trec la fișa păstrată (fără legături dublate),
 * câmpurile goale se completează din dublură, apoi dublura se șterge. Totul într-o singură tranzacție.
 */
export async function mergeInto(db: Db, treeId: string, keepId: string, dropId: string) {
  return db.transaction(async (tx) => {
    const [keep] = await tx.select().from(person).where(and(eq(person.id, keepId), eq(person.treeId, treeId)));
    const [drop] = await tx.select().from(person).where(and(eq(person.id, dropId), eq(person.treeId, treeId)));
    if (!keep || !drop || keepId === dropId) throw new Error("Fișele nu sunt în acest arbore.");
    const mine = (id: string) => tx.select().from(relationship).where(and(eq(relationship.treeId, treeId), or(eq(relationship.personA, id), eq(relationship.personB, id))));
    const kept = await mine(keepId);
    let moved = 0;
    for (const r of await mine(dropId)) {
      const a = r.personA === dropId ? keepId : r.personA, b = r.personB === dropId ? keepId : r.personB;
      const same = kept.find((x) => x.type === r.type && ((x.personA === a && x.personB === b) || (r.type === "partnership" && x.personA === b && x.personB === a)));
      if (a === b || same) {
        // Legătura există deja la fișa păstrată (sau ar lega persoana de ea însăși): păstrăm data căsătoriei, dacă doar dubla o avea.
        if (same && empty(same.startText) && !empty(r.startText)) await tx.update(relationship).set({ startText: r.startText }).where(eq(relationship.id, same.id));
        await tx.delete(relationship).where(eq(relationship.id, r.id));
        continue;
      }
      await tx.update(relationship).set({ personA: a, personB: b }).where(eq(relationship.id, r.id));
      kept.push({ ...r, personA: a, personB: b });
      moved++;
    }
    const docs = new Set((await tx.select({ d: documentLink.documentId }).from(documentLink).where(eq(documentLink.personId, keepId))).map((x) => x.d));
    for (const l of await tx.select({ d: documentLink.documentId }).from(documentLink).where(eq(documentLink.personId, dropId))) {
      const where = and(eq(documentLink.documentId, l.d), eq(documentLink.personId, dropId));
      if (docs.has(l.d)) await tx.delete(documentLink).where(where);
      else { await tx.update(documentLink).set({ personId: keepId }).where(where); docs.add(l.d); }
    }
    await tx.update(tree).set({ rootPersonId: keepId }).where(and(eq(tree.id, treeId), eq(tree.rootPersonId, dropId)));
    await tx.update(invitation).set({ personId: keepId }).where(and(eq(invitation.treeId, treeId), eq(invitation.personId, dropId)));
    await tx.update(bookExport).set({ centerPersonId: keepId }).where(and(eq(bookExport.treeId, treeId), eq(bookExport.centerPersonId, dropId)));
    // Revendicarea trece la fișa păstrată: întâi o scoatem de pe dublură.
    if (drop.claimedByUserId) await tx.update(person).set({ claimedByUserId: null }).where(eq(person.id, dropId));
    await tx.update(person).set(mergedFields(keep, drop)).where(eq(person.id, keepId));
    await tx.delete(person).where(eq(person.id, dropId));
    // Dacă dubla avea alți părinți decât fișa păstrată, acum pot fi doi tați sau două mame: spunem, ca omul să aleagă.
    const parents = await tx.select({ sex: person.sex }).from(relationship).innerJoin(person, eq(person.id, relationship.personA))
      .where(and(eq(relationship.type, "parent_child"), eq(relationship.personB, keepId)));
    const twoFathers = parents.filter((p) => p.sex === "M").length > 1, twoMothers = parents.filter((p) => p.sex === "F").length > 1;
    return { moved, name: `${keep.givenName} ${keep.surname || drop.surname}`.trim(), twoFathers, twoMothers };
  });
}
