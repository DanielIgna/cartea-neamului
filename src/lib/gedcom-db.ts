import { eq, and } from "drizzle-orm";
import type { Db } from "@/db";
import { person, relationship, tree } from "@/db/schema";
import { parseGedcom, writeGedcom, type GedcomData, type GFamily } from "./gedcom";
import { parseFuzzyDate } from "./dates";

const LIVING_IF_BORN_AFTER = new Date().getFullYear() - 100;

/** Importă un fișier GEDCOM într-un arbore existent. Întoarce numărul de persoane și relații create. */
export async function importGedcom(db: Db, treeId: string, text: string, createdBy?: string) {
  const data = parseGedcom(text);
  const ids = new Map<string, string>();
  for (const i of data.individuals) {
    const b = parseFuzzyDate(i.birth?.date);
    const d = parseFuzzyDate(i.death?.date);
    const living = !i.deceased && b.year !== null && b.year > LIVING_IF_BORN_AFTER;
    const [row] = await db.insert(person).values({
      treeId, givenName: i.given, surname: i.surname, birthSurname: i.birthSurname, sex: i.sex,
      birthDateText: i.birth?.date, birthFrom: b.from, birthTo: b.to, birthPlace: i.birth?.place,
      deathDateText: i.death?.date, deathFrom: d.from, deathTo: d.to, deathPlace: i.death?.place,
      living, occupation: i.occupation, biography: i.note, gedcomXref: i.xref, createdBy,
    }).returning({ id: person.id });
    ids.set(i.xref, row.id);
  }
  let rels = 0;
  for (const f of data.families) {
    const h = f.husb && ids.get(f.husb), w = f.wife && ids.get(f.wife);
    if (h && w) {
      await db.insert(relationship).values({ treeId, type: "partnership", personA: h, personB: w, subtype: "casatorie", startText: f.marriage?.date }).onConflictDoNothing();
      rels++;
    }
    for (const c of f.children) {
      const cid = ids.get(c);
      if (!cid) continue;
      for (const p of [h, w]) if (p) {
        await db.insert(relationship).values({ treeId, type: "parent_child", personA: p, personB: cid, subtype: "biologic" }).onConflictDoNothing();
        rels++;
      }
    }
  }
  return { persons: ids.size, relationships: rels };
}

/**
 * Exportă arborele în GEDCOM. Implicit ascunde detaliile persoanelor în viață (GDPR):
 * rămân doar legăturile și numele „Persoană în viață”.
 */
export async function exportGedcom(db: Db, treeId: string, opts: { includeLiving?: boolean } = {}) {
  const [t] = await db.select().from(tree).where(eq(tree.id, treeId));
  const people = await db.select().from(person).where(eq(person.treeId, treeId));
  const rels = await db.select().from(relationship).where(eq(relationship.treeId, treeId));
  const xref = new Map(people.map((p, i) => [p.id, `@I${i + 1}@`]));
  const sexOf = new Map(people.map((p) => [p.id, p.sex]));

  const data: GedcomData = {
    individuals: people.map((p) => {
      const hide = p.living && !opts.includeLiving;
      return hide
        ? { xref: xref.get(p.id)!, given: "Persoană", surname: "în viață", sex: p.sex }
        : {
            xref: xref.get(p.id)!, given: p.givenName, surname: p.surname, birthSurname: p.birthSurname ?? undefined, sex: p.sex,
            birth: { date: p.birthDateText ?? undefined, place: p.birthPlace ?? undefined },
            death: { date: p.deathDateText ?? undefined, place: p.deathPlace ?? undefined },
            deceased: !p.living, occupation: p.occupation ?? undefined, note: p.biography ?? undefined,
          };
    }),
    families: [],
  };

  // O familie = un set de părinți (și/sau un parteneriat)
  const fams = new Map<string, GFamily>();
  const famFor = (a?: string, b?: string) => {
    const [x, y] = [a, b].sort((p, q) => (sexOf.get(p ?? "") === "F" ? 1 : 0) - (sexOf.get(q ?? "") === "F" ? 1 : 0));
    const key = `${x ?? ""}|${y ?? ""}`;
    if (!fams.has(key)) fams.set(key, { xref: `@F${fams.size + 1}@`, husb: x && xref.get(x), wife: y && xref.get(y), children: [] });
    return fams.get(key)!;
  };
  for (const r of rels.filter((r) => r.type === "partnership")) {
    const f = famFor(r.personA, r.personB);
    if (r.startText) f.marriage = { date: r.startText };
  }
  const parentsOf = new Map<string, string[]>();
  for (const r of rels.filter((r) => r.type === "parent_child")) parentsOf.set(r.personB, [...(parentsOf.get(r.personB) ?? []), r.personA]);
  for (const [childId, ps] of parentsOf) famFor(ps[0], ps[1]).children.push(xref.get(childId)!);
  data.families = [...fams.values()];
  return writeGedcom(data, { source: t?.name });
}

export async function treeExists(db: Db, treeId: string) {
  const rows = await db.select({ id: tree.id }).from(tree).where(and(eq(tree.id, treeId)));
  return rows.length > 0;
}
