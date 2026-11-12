/**
 * Corectura cerută de Daniel pe 12.11.2026, aplicată o singură dată la publicare (scripts/deploy-db.ts), cu aceleași
 * întrebări ca în „De verificat în arbore”, dar cu răspunsurile date de el:
 * - Jenica e soția lui Iosif Todea fiul (fratele Floarei), nu a bunicului Iosif Todea; Anca și Simona sunt fiicele lor.
 * - Mama Lenuței (și a Marianei) e Valeria, fosta soție a lui Avram Igna; rămâne discretă (doar în profilul fetelor).
 * - Floarea Curtuli e sora lui Toader: numele de fată e cel al tatălui.
 * Se atinge doar arborele în care sunt Avram Igna și Floarea; fiecare schimbare intră în „Istoric și limite” și se poate anula.
 * Dacă datele nu arată cum ne așteptăm (de pildă fiul Iosif nu e trecut separat), nu se schimbă nimic.
 */
import { and, eq, or } from "drizzle-orm";
import type { Db } from "@/db";
import { appSetting, person, relationship, tree } from "@/db/schema";
import { buildGraph } from "./kinship";
import { normName } from "./family";
import { toView } from "./tree-data";
import { findChecks, stepsFor } from "./verificari";
import { loadDecisions, saveDecision } from "./verificari-db";
import { logChange, personName } from "./edit-log";

const MARK = "corectura:igna-todea:2026-11-12";

export async function fixIgnaTodea(db: Db): Promise<string> {
  const [done] = await db.select({ key: appSetting.key }).from(appSetting).where(eq(appSetting.key, MARK));
  if (done) return "deja făcută";
  const avrams = await db.select({ treeId: person.treeId, given: person.givenName, surname: person.surname }).from(person);
  const treeIds = [...new Set(avrams.filter((p) => normName(p.given).startsWith("avram") && normName(p.surname) === "igna").map((p) => p.treeId))];
  const report: string[] = [];
  for (const treeId of treeIds) {
    const [t] = await db.select().from(tree).where(eq(tree.id, treeId));
    if (!t?.ownerId || t.name === "Neamul Pop din Ieud") continue;
    const rows = await db.select().from(person).where(eq(person.treeId, treeId));
    if (!rows.some((p) => normName(p.givenName).startsWith("floarea") && normName(p.surname) === "igna")) continue;
    const owner = t.ownerId;
    const n = (id: string) => normName(rows.find((p) => p.id === id)?.givenName).split(/[\s-]+/)[0] ?? "";
    let changed = 0;
    // Pe rând: după fiecare răspuns arborele se schimbă, iar întrebările se recalculează.
    for (let round = 0; round < 6; round++) {
      const people = await db.select().from(person).where(eq(person.treeId, treeId));
      const rels = await db.select({ type: relationship.type, a: relationship.personA, b: relationship.personB }).from(relationship).where(eq(relationship.treeId, treeId));
      const views = Object.fromEntries(people.map((p) => [p.id, toView(p, [], null)]));
      const g = buildGraph(Object.values(views), rels);
      const checks = findChecks(g, views, await loadDecisions(db, treeId));
      const pick = checks.map((c) => {
        if ((c.kind === "sotGeneratie" || c.kind === "copilGeneratie") && n(c.older) === "iosif" && normName(views[c.older].surname) === "todea"
          && (n(c.who) === "jenica" || n(c.who) === "anca" || n(c.who) === "simona")) return { c, choice: "muta" };
        if (c.kind === "parinteLipsa" && (n(c.child) === "lenuta" || n(c.child) === "mariana") && n(c.parent) === "avram") {
          const v = c.options.find((o) => o.person && n(o.person) === "valeria");
          return v ? { c, choice: v.id } : null;
        }
        if (c.kind === "numeDeFata" && n(c.who) === "floarea" && normName(views[c.who].surname) === "curtuli") return { c, choice: "da" };
        return null;
      }).find(Boolean);
      if (!pick) break;
      const { c, choice } = pick;
      const name = (id: string) => (views[id] ? personName(views[id]) : "?");
      const log = (id: string, summary: string) => logChange(db, { treeId, actorId: null, personId: id, action: "legaturi", diff: { name: name(id), summary } });
      for (const s of stepsFor(c, choice) ?? []) {
        if (s.op === "moveSpouse") {
          await db.delete(relationship).where(and(eq(relationship.treeId, treeId), eq(relationship.type, "partnership"),
            or(and(eq(relationship.personA, s.from), eq(relationship.personB, s.spouse)), and(eq(relationship.personA, s.spouse), eq(relationship.personB, s.from)))));
          await db.insert(relationship).values({ treeId, type: "partnership", personA: s.to, personB: s.spouse, subtype: "casatorie" }).onConflictDoNothing();
          await log(s.spouse, `Corectat după spusele lui Daniel: soția lui ${name(s.to)} (fiul), nu a lui ${name(s.from)}`);
        } else if (s.op === "moveChild") {
          await db.delete(relationship).where(and(eq(relationship.treeId, treeId), eq(relationship.type, "parent_child"), eq(relationship.personA, s.from), eq(relationship.personB, s.child)));
          await db.insert(relationship).values({ treeId, type: "parent_child", personA: s.to, personB: s.child, subtype: "biologic" }).onConflictDoNothing();
          await log(s.child, `Corectat după spusele lui Daniel: copilul lui ${name(s.to)} (fiul), nu al lui ${name(s.from)}`);
        } else if (s.op === "setParent") {
          await db.insert(relationship).values({ treeId, type: "parent_child", personA: s.parent, personB: s.child, subtype: "biologic" }).onConflictDoNothing();
          // Valeria e dintr-o altă relație a lui Avram: rămâne discretă, doar în profilul fetelor.
          await db.update(person).set({ discreet: true, updatedAt: new Date() }).where(eq(person.id, s.parent));
          await log(s.child, `Corectat după spusele lui Daniel: mama e ${name(s.parent)} (discretă, apare doar în profilul fetelor)`);
        } else if (s.op === "birthSurname") {
          await db.update(person).set({ birthSurname: s.value, updatedAt: new Date() }).where(eq(person.id, s.who));
          await log(s.who, `Corectat după spusele lui Daniel: numele de fată e ${s.value} (sora lui Toader)`);
        }
        changed++;
      }
      await saveDecision(db, treeId, c.key, choice, owner);
    }
    report.push(`${t.name}: ${changed} schimbări`);
  }
  await db.insert(appSetting).values({ key: MARK, value: { at: new Date().toISOString(), report } }).onConflictDoNothing();
  return report.join("; ") || "niciun arbore potrivit";
}

/**
 * Daniel, 12.11.2026, mai târziu: numele de fată al Floarei Curtuli e Igna (e sora lui Toader Igna). O singură dată,
 * doar în arborele cu Avram și Floarea Igna, doar fișa „Floarea Curtuli”; se vede în Istoric și se poate anula.
 */
const MARK2 = "corectura:curtuli-igna:2026-11-12";
export async function fixCurtuliMaiden(db: Db): Promise<string> {
  const [done] = await db.select({ key: appSetting.key }).from(appSetting).where(eq(appSetting.key, MARK2));
  if (done) return "deja făcută";
  const all = await db.select().from(person);
  const trees = new Set(all.filter((p) => normName(p.givenName).startsWith("avram") && normName(p.surname) === "igna").map((p) => p.treeId));
  let n = 0;
  for (const p of all) {
    if (!trees.has(p.treeId) || !normName(p.givenName).startsWith("floarea") || normName(p.surname) !== "curtuli" || normName(p.birthSurname) === "igna") continue;
    await db.update(person).set({ birthSurname: "Igna", updatedAt: new Date() }).where(eq(person.id, p.id));
    await logChange(db, { treeId: p.treeId, actorId: null, personId: p.id, action: "modificare",
      diff: { name: personName(p), summary: `Corectat după spusele lui Daniel: numele de fată e Igna (era ${p.birthSurname || "gol"})` } });
    n++;
  }
  await db.insert(appSetting).values({ key: MARK2, value: { at: new Date().toISOString(), changed: n } }).onConflictDoNothing();
  return `${n} fișe`;
}
