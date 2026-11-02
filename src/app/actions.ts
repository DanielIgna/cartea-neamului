"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq, and, inArray, or } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { tree, person, relationship, treeMember, document, documentLink } from "@/db/schema";
import { importGedcom } from "@/lib/gedcom-db";
import { parseFuzzyDate } from "@/lib/dates";
import { ensureSchema } from "@/lib/bootstrap";
import { currentUser, roleIn, can } from "@/lib/access";
import { createInvitation, acceptInvitation } from "@/lib/invitations";
import { headers } from "next/headers";
import { toView } from "@/lib/tree-data";
import { aiConfigured, biographyPrompt, chat } from "@/lib/ai";

const MAX_GEDCOM_BYTES = 10 * 1024 * 1024;

export async function createTree(_: unknown, form: FormData) {
  await ensureSchema();
  const me = await currentUser();
  if (!me) return { error: "Intră în cont ca să creezi un arbore." };
  const name = String(form.get("name") ?? "").trim();
  if (!name) return { error: "Dă un nume arborelui, de exemplu „Neamul Pop din Ieud”." };
  const region = String(form.get("region") ?? "") || null;
  const file = form.get("gedcom");
  const hasGedcom = file instanceof File && file.size > 0;
  // Verificăm tot înainte să scriem ceva, ca o eroare să nu lase în urmă un arbore gol, care nu se poate deschide.
  if (hasGedcom && file.size > MAX_GEDCOM_BYTES) return { error: "Fișierul GEDCOM e mai mare de 10 MB." };
  const given = String(form.get("given") ?? "").trim(), surname = String(form.get("surname") ?? "").trim();
  if (!hasGedcom && !given && !surname) return { error: "Scrie numele tău sau încarcă un fișier GEDCOM." };
  const gedcom = hasGedcom ? await file.text() : null;

  const NO_PEOPLE = "gedcom-fara-persoane";
  const t = await db.transaction(async (tx) => {
    const [t] = await tx.insert(tree).values({ name, ownerId: me.id, region }).returning();
    await tx.insert(treeMember).values({ treeId: t.id, userId: me.id, role: "owner" });
    if (gedcom !== null) {
      const res = await importGedcom(tx as unknown as typeof db, t.id, gedcom, me.id);
      if (!res.persons) throw new Error(NO_PEOPLE);
      const [first] = await tx.select().from(person).where(and(eq(person.treeId, t.id), eq(person.gedcomXref, "@I1@")));
      const [any] = first ? [first] : await tx.select().from(person).where(eq(person.treeId, t.id)).limit(1);
      await tx.update(tree).set({ rootPersonId: any.id }).where(eq(tree.id, t.id));
    } else {
      const b = parseFuzzyDate(String(form.get("birth") ?? ""));
      const [p] = await tx.insert(person).values({
        treeId: t.id, givenName: given, surname, birthDateText: String(form.get("birth") ?? "") || null,
        birthFrom: b.from, birthTo: b.to, living: true, sex: (String(form.get("sex") ?? "U") as "M" | "F" | "U"),
        claimedByUserId: me.id, privacy: "claimed", createdBy: me.id,
      }).returning();
      await tx.update(tree).set({ rootPersonId: p.id }).where(eq(tree.id, t.id));
    }
    return t;
  }).catch((e: unknown) => {
    if (e instanceof Error && e.message === NO_PEOPLE) return null;
    throw e;
  });
  if (!t) return { error: "Fișierul GEDCOM nu conține nicio persoană." };
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
  const me = await currentUser();
  if (!me || !can(await roleIn(db, v.treeId, me.id), "contributor")) return { error: "Nu ai drept să adaugi persoane în acest arbore." };
  const [child] = await db.select().from(person).where(and(eq(person.id, v.childId), eq(person.treeId, v.treeId)));
  if (!child) return { error: "Persoana nu mai există în acest arbore." };
  const existing = await db.select({ sex: person.sex }).from(relationship)
    .innerJoin(person, eq(person.id, relationship.personA))
    .where(and(eq(relationship.type, "parent_child"), eq(relationship.personB, v.childId)));
  const sexWanted = v.role === "father" ? "M" : "F";
  if (existing.some((e) => e.sex === sexWanted)) return { error: `${child.givenName} are deja ${v.role === "father" ? "un tată" : "o mamă"} în arbore.` };
  const b = parseFuzzyDate(v.birth), d = parseFuzzyDate(v.death);
  // Persoana și relația intră împreună, ca rudele care urmăresc arborele live să nu vadă un părinte „plutind”.
  const p = await db.transaction(async (tx) => {
    const [p] = await tx.insert(person).values({
      treeId: v.treeId, givenName: v.given, surname: v.surname, birthSurname: v.birthSurname || null, sex: sexWanted,
      birthDateText: v.birth || null, birthFrom: b.from, birthTo: b.to, birthPlace: v.birthPlace || null,
      deathDateText: v.death || null, deathFrom: d.from, deathTo: d.to, deathPlace: v.deathPlace || null,
      living: v.living === "on", createdBy: me.id,
    }).returning();
    await tx.insert(relationship).values({ treeId: v.treeId, type: "parent_child", personA: p.id, personB: v.childId, subtype: "biologic" });
    return p;
  });
  revalidatePath(`/arbore/${v.treeId}`);
  return { ok: true, id: p.id };
}

const Invite = z.object({ treeId: z.string().uuid(), role: z.enum(["editor", "contributor", "viewer"]), personId: z.string().uuid().optional().or(z.literal("")) });

export async function createInviteLink(_: unknown, form: FormData) {
  const parsed = Invite.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: "Date de invitație invalide." };
  const me = await currentUser();
  if (!me || !can(await roleIn(db, parsed.data.treeId, me.id), "editor")) return { error: "Doar proprietarul și editorii pot invita rude." };
  const { token, expiresAt } = await createInvitation(db, { treeId: parsed.data.treeId, createdBy: me.id, role: parsed.data.role, personId: parsed.data.personId || null });
  const h = await headers();
  const origin = process.env.BETTER_AUTH_URL ?? `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
  return { link: `${origin}/invitatie/${token}`, expiresAt: expiresAt.toISOString().slice(0, 10) };
}

export async function acceptInvite(token: string) {
  const me = await currentUser();
  if (!me) redirect(`/intrare?next=${encodeURIComponent(`/invitatie/${token}`)}`);
  const res = await acceptInvitation(db, token, me.id);
  if (!res.ok) return res;
  redirect(`/arbore/${res.treeId}`);
}

const PersonRef = z.object({ treeId: z.string().uuid(), personId: z.string().uuid() });

/** Sugestie de biografie prin Neon AI Gateway, doar din faptele din fișă. Utilizatorul decide dacă o păstrează. */
export async function suggestBiography(treeId: string, personId: string): Promise<{ text?: string; error?: string }> {
  const parsed = PersonRef.safeParse({ treeId, personId });
  if (!parsed.success) return { error: "Persoană invalidă." };
  const me = await currentUser();
  if (!me || !can(await roleIn(db, treeId, me.id), "contributor")) return { error: "Nu ai drept să scrii în acest arbore." };
  if (!aiConfigured()) return { error: "Sugestiile AI nu sunt configurate (lipsește Neon AI Gateway)." };
  const [p] = await db.select().from(person).where(and(eq(person.id, personId), eq(person.treeId, treeId)));
  if (!p) return { error: "Persoana nu există în acest arbore." };
  if (p.living) return { error: "Pentru persoanele în viață nu trimitem date în afara aplicației." };
  const docs = await db.select({ id: document.id, title: document.title, kind: document.kind, dateText: document.dateText, fileKey: document.fileKey })
    .from(documentLink).innerJoin(document, eq(document.id, documentLink.documentId)).where(eq(documentLink.personId, personId));
  const rels = await db.select().from(relationship).where(and(eq(relationship.type, "parent_child"), or(eq(relationship.personA, personId), eq(relationship.personB, personId))));
  const otherIds = rels.map((r) => (r.personA === personId ? r.personB : r.personA));
  const others = otherIds.length ? await db.select().from(person).where(inArray(person.id, otherIds)) : [];
  // Rudele în viață rămân private: apar doar cu relația, fără nume.
  const relatives = rels.flatMap((r) => {
    const o = others.find((x) => x.id === (r.personA === personId ? r.personB : r.personA));
    if (!o || o.living) return [];
    const v = toView(o);
    const relation = r.personA === personId ? "copil:" : o.sex === "M" ? "tată:" : o.sex === "F" ? "mamă:" : "părinte:";
    return [{ relation, name: v.name, years: [v.birthYear, v.deathYear].filter(Boolean).join("–") }];
  });
  try {
    const view = toView(p, docs.map((d) => ({ id: d.id, title: d.title, kind: d.kind, dateText: d.dateText, hasFile: !!d.fileKey })));
    return { text: await chat(biographyPrompt(view, relatives)) };
  } catch (e) {
    console.error("suggestBiography", e);
    return { error: "Nu am putut obține o sugestie acum. Încearcă din nou peste un minut." };
  }
}

export async function saveBiography(treeId: string, personId: string, biography: string): Promise<{ ok?: boolean; error?: string }> {
  const parsed = PersonRef.extend({ biography: z.string().trim().min(1).max(4000) }).safeParse({ treeId, personId, biography });
  if (!parsed.success) return { error: "Biografia e goală sau prea lungă." };
  const me = await currentUser();
  if (!me || !can(await roleIn(db, treeId, me.id), "editor")) return { error: "Doar proprietarul și editorii pot schimba biografia." };
  const res = await db.update(person).set({ biography: parsed.data.biography, updatedAt: new Date() })
    .where(and(eq(person.id, personId), eq(person.treeId, treeId))).returning({ id: person.id });
  if (!res.length) return { error: "Persoana nu există în acest arbore." };
  revalidatePath(`/arbore/${treeId}`);
  return { ok: true };
}
