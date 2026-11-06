/**
 * „Pornește arborele pas cu pas”: omul își scrie numele, apoi pe ai lui (părinții și bunicii), iar arborele se face dintr-o
 * dată, cu toate legăturile. Pe cine nu știe îl lasă gol și îl adaugă mai târziu din arbore; bunicii dinspre un părinte
 * intră doar dacă e trecut și părintele (ca să nu plutească în arbore).
 */
import { eq } from "drizzle-orm";
import { z } from "zod";
import type { Db } from "@/db";
import { person, relationship, tree, treeMember } from "@/db/schema";
import { parseFuzzyDate } from "./dates";

const text = (max: number) => z.string().trim().max(max).optional().default("");
const Who = z.object({
  given: text(120), surname: text(120), birthSurname: text(120), birth: text(60), living: z.boolean().optional().default(false),
});
export const StartInput = z.object({
  treeName: z.string().trim().min(1, "Dă un nume arborelui.").max(120),
  region: text(120),
  me: Who.extend({ given: z.string().trim().min(1, "Scrie-ți prenumele.").max(120), sex: z.enum(["M", "F"], { message: "Alege dacă ești bărbat sau femeie." }), birthPlace: text(160) }),
  father: Who.optional(), mother: Who.optional(),
  ff: Who.optional(), fm: Who.optional(), mf: Who.optional(), mm: Who.optional(),
});
export type StartInput = z.input<typeof StartInput>;
type Parsed = z.output<typeof StartInput>;

export type StartKey = "me" | "father" | "mother" | "ff" | "fm" | "mf" | "mm";
export type StartPerson = { key: StartKey; sex: "M" | "F"; given: string; surname: string; birthSurname: string; birth: string; birthPlace: string; living: boolean };
export type StartPlan = { people: StartPerson[]; parentOf: [StartKey, StartKey][]; partners: [StartKey, StartKey][] };

/** Cine a fost scris: măcar prenumele sau numele. */
const filled = (w?: { given: string; surname: string }) => !!w && !!(w.given || w.surname);

/** Din ce a scris omul: cine intră în arbore și cum se leagă (tată–copil, soț–soție). */
export function startPlan(v: Parsed): StartPlan {
  const people: StartPerson[] = [{
    key: "me", sex: v.me.sex, given: v.me.given, surname: v.me.surname, birthSurname: v.me.sex === "F" ? v.me.birthSurname : "",
    birth: v.me.birth, birthPlace: v.me.birthPlace, living: true,
  }];
  const parentOf: [StartKey, StartKey][] = [], partners: [StartKey, StartKey][] = [];
  const add = (key: StartKey, sex: "M" | "F", w: Parsed["father"], child: StartKey) => {
    if (!filled(w)) return false;
    people.push({ key, sex, given: w!.given, surname: w!.surname, birthSurname: sex === "F" ? w!.birthSurname : "", birth: w!.birth, birthPlace: "", living: w!.living });
    parentOf.push([key, child]);
    return true;
  };
  const couple = (dad: StartKey, mom: StartKey, a: boolean, b: boolean) => { if (a && b) partners.push([dad, mom]); };
  const f = add("father", "M", v.father, "me"), m = add("mother", "F", v.mother, "me");
  couple("father", "mother", f, m);
  if (f) couple("ff", "fm", add("ff", "M", v.ff, "father"), add("fm", "F", v.fm, "father"));
  if (m) couple("mf", "mm", add("mf", "M", v.mf, "mother"), add("mm", "F", v.mm, "mother"));
  return { people, parentOf, partners };
}

/** Face arborele dintr-o dată: arborele, omul (cu fișa revendicată, în centru), ai lui și legăturile, într-o singură tranzacție. */
export async function createFamilyTree(db: Db, userId: string, input: Parsed) {
  const plan = startPlan(input);
  return db.transaction(async (tx) => {
    const [t] = await tx.insert(tree).values({ name: input.treeName, ownerId: userId, region: input.region || null }).returning({ id: tree.id });
    await tx.insert(treeMember).values({ treeId: t.id, userId, role: "owner" });
    const ids = new Map<StartKey, string>();
    for (const p of plan.people) {
      const b = parseFuzzyDate(p.birth);
      const [row] = await tx.insert(person).values({
        treeId: t.id, givenName: p.given, surname: p.surname, birthSurname: p.birthSurname || null, sex: p.sex,
        birthDateText: p.birth || null, birthFrom: b.from, birthTo: b.to, birthPlace: p.birthPlace || null, living: p.living, createdBy: userId,
        ...(p.key === "me" ? { claimedByUserId: userId, privacy: "claimed" as const } : {}),
      }).returning({ id: person.id });
      ids.set(p.key, row.id);
    }
    for (const [a, b] of plan.parentOf) await tx.insert(relationship).values({ treeId: t.id, type: "parent_child", personA: ids.get(a)!, personB: ids.get(b)!, subtype: "biologic" });
    for (const [a, b] of plan.partners) await tx.insert(relationship).values({ treeId: t.id, type: "partnership", personA: ids.get(a)!, personB: ids.get(b)!, subtype: "casatorie" });
    await tx.update(tree).set({ rootPersonId: ids.get("me")! }).where(eq(tree.id, t.id));
    return { treeId: t.id, meId: ids.get("me")!, people: plan.people.length };
  });
}
