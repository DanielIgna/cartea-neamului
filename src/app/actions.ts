"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { tree, person, relationship } from "@/db/schema";
import { importGedcom } from "@/lib/gedcom-db";
import { parseFuzzyDate } from "@/lib/dates";
import { ensureSchema } from "@/lib/bootstrap";

const MAX_GEDCOM_BYTES = 10 * 1024 * 1024;

export async function createTree(_: unknown, form: FormData) {
  await ensureSchema();
  const name = String(form.get("name") ?? "").trim();
  if (!name) return { error: "Dă un nume arborelui, de exemplu „Neamul Pop din Ieud”." };
  const file = form.get("gedcom");
  const [t] = await db.insert(tree).values({ name, region: String(form.get("region") ?? "") || null }).returning();
  if (file instanceof File && file.size > 0) {
    if (file.size > MAX_GEDCOM_BYTES) return { error: "Fișierul GEDCOM e mai mare de 10 MB." };
    await importGedcom(db, t.id, await file.text());
    const [first] = await db.select().from(person).where(and(eq(person.treeId, t.id), eq(person.gedcomXref, "@I1@")));
    if (first) await db.update(tree).set({ rootPersonId: first.id }).where(eq(tree.id, t.id));
  } else {
    const given = String(form.get("given") ?? "").trim(), surname = String(form.get("surname") ?? "").trim();
    if (!given && !surname) return { error: "Scrie numele tău sau încarcă un fișier GEDCOM." };
    const b = parseFuzzyDate(String(form.get("birth") ?? ""));
    const [p] = await db.insert(person).values({
      treeId: t.id, givenName: given, surname, birthDateText: String(form.get("birth") ?? "") || null,
      birthFrom: b.from, birthTo: b.to, living: true, sex: (String(form.get("sex") ?? "U") as "M" | "F" | "U"),
    }).returning();
    await db.update(tree).set({ rootPersonId: p.id }).where(eq(tree.id, t.id));
  }
  redirect(`/arbore/${t.id}`);
}

const Parent = z.object({
  treeId: z.string().uuid(), childId: z.string().uuid(), role: z.enum(["father", "mother"]),
  given: z.string().trim().min(1, "Scrie prenumele."), surname: z.string().trim(), birthSurname: z.string().trim().optional(),
  birth: z.string().trim().optional(), birthPlace: z.string().trim().optional(),
  death: z.string().trim().optional(), deathPlace: z.string().trim().optional(), living: z.string().optional(),
});

export async function addParent(_: unknown, form: FormData) {
  const parsed = Parent.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const v = parsed.data;
  const [child] = await db.select().from(person).where(and(eq(person.id, v.childId), eq(person.treeId, v.treeId)));
  if (!child) return { error: "Persoana nu mai există în acest arbore." };
  const existing = await db.select({ sex: person.sex }).from(relationship)
    .innerJoin(person, eq(person.id, relationship.personA))
    .where(and(eq(relationship.type, "parent_child"), eq(relationship.personB, v.childId)));
  const sexWanted = v.role === "father" ? "M" : "F";
  if (existing.some((e) => e.sex === sexWanted)) return { error: `${child.givenName} are deja ${v.role === "father" ? "un tată" : "o mamă"} în arbore.` };
  const b = parseFuzzyDate(v.birth), d = parseFuzzyDate(v.death);
  const [p] = await db.insert(person).values({
    treeId: v.treeId, givenName: v.given, surname: v.surname, birthSurname: v.birthSurname || null, sex: sexWanted,
    birthDateText: v.birth || null, birthFrom: b.from, birthTo: b.to, birthPlace: v.birthPlace || null,
    deathDateText: v.death || null, deathFrom: d.from, deathTo: d.to, deathPlace: v.deathPlace || null,
    living: v.living === "on",
  }).returning();
  await db.insert(relationship).values({ treeId: v.treeId, type: "parent_child", personA: p.id, personB: v.childId, subtype: "biologic" });
  revalidatePath(`/arbore/${v.treeId}`);
  return { ok: true, id: p.id };
}
