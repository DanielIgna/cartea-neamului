"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq, and, inArray, or } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { tree, person, relationship, treeMember, document, documentLink, message } from "@/db/schema";
import { canMessage } from "@/lib/chat";
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

const Fields = {
  given: z.string().trim().min(1, "Scrie prenumele.").max(120), surname: z.string().trim().max(120), birthSurname: z.string().trim().max(120).optional(),
  birth: z.string().trim().max(60).optional(), birthPlace: z.string().trim().max(160).optional(),
  death: z.string().trim().max(60).optional(), deathPlace: z.string().trim().max(160).optional(), living: z.string().optional(),
  sex: z.enum(["M", "F", "U"]).optional(), occupation: z.string().trim().max(160).optional(),
  biography: z.string().trim().max(8000).optional(), notes: z.string().trim().max(8000).optional(),
};
const Relative = z.object({
  treeId: z.string().uuid(), anchorId: z.string().uuid(), kind: z.enum(["father", "mother", "child", "spouse", "sibling"]),
  otherParentId: z.string().uuid().optional().or(z.literal("")), ...Fields,
});

const personValues = (v: z.infer<typeof Relative> | z.infer<typeof Edit>) => {
  const b = parseFuzzyDate(v.birth), d = parseFuzzyDate(v.death);
  return {
    givenName: v.given, surname: v.surname, birthSurname: v.birthSurname || null,
    birthDateText: v.birth || null, birthFrom: b.from, birthTo: b.to, birthPlace: v.birthPlace || null,
    deathDateText: v.death || null, deathFrom: d.from, deathTo: d.to, deathPlace: v.deathPlace || null,
    living: v.living === "on", occupation: v.occupation || null, biography: v.biography || null, notes: v.notes || null,
  };
};

const KIND_LABEL = { father: "tatăl", mother: "mama", child: "un copil", spouse: "soțul sau soția", sibling: "un frate sau o soră" } as const;

/**
 * Adaugă o rudă lângă o persoană din arbore: tată, mamă, copil, soț/soție sau frate/soră.
 * Persoana și legăturile ei intră într-o singură tranzacție, ca rudele care urmăresc arborele live să nu vadă pe cineva „plutind”.
 */
export async function addRelative(_: unknown, form: FormData) {
  const parsed = Relative.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const v = parsed.data;
  const me = await currentUser();
  if (!me || !can(await roleIn(db, v.treeId, me.id), "contributor")) return { error: "Nu ai drept să adaugi persoane în acest arbore." };
  const [anchor] = await db.select().from(person).where(and(eq(person.id, v.anchorId), eq(person.treeId, v.treeId)));
  if (!anchor) return { error: "Persoana nu mai există în acest arbore." };
  const parentsOf = async (id: string) => db.select({ id: person.id, sex: person.sex }).from(relationship)
    .innerJoin(person, eq(person.id, relationship.personA))
    .where(and(eq(relationship.type, "parent_child"), eq(relationship.personB, id)));

  let sex: "M" | "F" | "U" = v.sex ?? "U";
  let parentIds: string[] = [];
  if (v.kind === "father" || v.kind === "mother") {
    sex = v.kind === "father" ? "M" : "F";
    const existing = await parentsOf(anchor.id);
    if (existing.some((e) => e.sex === sex)) return { error: `${anchor.givenName} are deja ${v.kind === "father" ? "un tată" : "o mamă"} în arbore.` };
  } else if (v.kind === "sibling") {
    parentIds = (await parentsOf(anchor.id)).map((p) => p.id);
    if (!parentIds.length) return { error: `Adaugă întâi un părinte al lui ${anchor.givenName}; fratele sau sora se leagă de aceiași părinți.` };
  } else if (v.kind === "child") {
    parentIds = [anchor.id];
    if (v.otherParentId) {
      const [other] = await db.select({ id: person.id }).from(person).where(and(eq(person.id, v.otherParentId), eq(person.treeId, v.treeId)));
      if (other) parentIds.push(other.id);
    }
  }

  const p = await db.transaction(async (tx) => {
    const [p] = await tx.insert(person).values({ treeId: v.treeId, sex, createdBy: me.id, ...personValues(v) }).returning();
    if (v.kind === "father" || v.kind === "mother")
      await tx.insert(relationship).values({ treeId: v.treeId, type: "parent_child", personA: p.id, personB: anchor.id, subtype: "biologic" });
    else if (v.kind === "spouse")
      await tx.insert(relationship).values({ treeId: v.treeId, type: "partnership", personA: anchor.id, personB: p.id, subtype: "casatorie" });
    else for (const parent of parentIds)
      await tx.insert(relationship).values({ treeId: v.treeId, type: "parent_child", personA: parent, personB: p.id, subtype: "biologic" });
    // Doi părinți fără legătură între ei devin partenerii copilului comun, ca descendenții să-i arate împreună.
    if (v.kind === "father" || v.kind === "mother") {
      const [other] = (await tx.select({ id: person.id, sex: person.sex }).from(relationship).innerJoin(person, eq(person.id, relationship.personA))
        .where(and(eq(relationship.type, "parent_child"), eq(relationship.personB, anchor.id)))).filter((x) => x.id !== p.id);
      if (other) await tx.insert(relationship).values({ treeId: v.treeId, type: "partnership", personA: sex === "M" ? p.id : other.id, personB: sex === "M" ? other.id : p.id, subtype: "casatorie" }).onConflictDoNothing();
    }
    return p;
  });
  revalidatePath(`/arbore/${v.treeId}`);
  return { ok: true, id: p.id, message: `Am adăugat ${KIND_LABEL[v.kind]}: ${p.givenName} ${p.surname}`.trim() };
}

/** Compatibilitate: formularul de loc liber din evantai trimite `childId` și `role`. */
export async function addParent(prev: unknown, form: FormData) {
  form.set("anchorId", String(form.get("childId") ?? ""));
  form.set("kind", String(form.get("role") ?? ""));
  return addRelative(prev, form);
}

const Edit = z.object({ treeId: z.string().uuid(), personId: z.string().uuid(), ...Fields });

/** Corectează fișa unei persoane. Editorii pot corecta pe oricine; contributorii, persoanele adăugate de ei; fiecare, propriul profil. */
export async function updatePerson(_: unknown, form: FormData) {
  const parsed = Edit.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const v = parsed.data;
  const me = await currentUser();
  const role = me ? await roleIn(db, v.treeId, me.id) : null;
  if (!me || !can(role, "contributor")) return { error: "Nu ai drept să modifici acest arbore." };
  const [p] = await db.select().from(person).where(and(eq(person.id, v.personId), eq(person.treeId, v.treeId)));
  if (!p) return { error: "Persoana nu mai există în acest arbore." };
  if (!can(role, "editor") && p.createdBy !== me.id && p.claimedByUserId !== me.id)
    return { error: "Poți corecta doar persoanele adăugate de tine. Cere unui editor al arborelui să facă schimbarea." };
  await db.update(person).set({ ...personValues(v), sex: v.sex ?? p.sex, updatedAt: new Date() }).where(eq(person.id, p.id));
  revalidatePath(`/arbore/${v.treeId}`);
  return { ok: true, message: "Fișa a fost salvată." };
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

/* ---------- Poze, album și mesaje ---------- */

const DocRef = z.object({ treeId: z.string().uuid(), personId: z.string().uuid(), docId: z.string().uuid() });

/** Alege poza de profil a unei persoane dintre fotografiile ei. */
export async function setProfilePhoto(treeId: string, personId: string, docId: string): Promise<{ ok?: boolean; error?: string }> {
  if (!DocRef.safeParse({ treeId, personId, docId }).success) return { error: "Date invalide." };
  const me = await currentUser();
  if (!me || !can(await roleIn(db, treeId, me.id), "contributor")) return { error: "Nu ai drept să modifici acest arbore." };
  const [link] = await db.select({ id: document.id }).from(documentLink).innerJoin(document, eq(document.id, documentLink.documentId))
    .where(and(eq(documentLink.personId, personId), eq(document.id, docId), eq(document.treeId, treeId), eq(document.kind, "photo")));
  if (!link) return { error: "Fotografia nu e în albumul acestei persoane." };
  await db.update(person).set({ photoDocumentId: docId, updatedAt: new Date() }).where(and(eq(person.id, personId), eq(person.treeId, treeId)));
  revalidatePath(`/arbore/${treeId}`);
  return { ok: true };
}

/** Descrierea unei poze sau a unui document: cine apare, unde, când, ce poveste are. */
export async function updateDocumentDescription(treeId: string, docId: string, description: string): Promise<{ ok?: boolean; error?: string }> {
  const parsed = z.object({ treeId: z.string().uuid(), docId: z.string().uuid(), description: z.string().trim().max(2000) }).safeParse({ treeId, docId, description });
  if (!parsed.success) return { error: "Descrierea e prea lungă." };
  const me = await currentUser();
  if (!me || !can(await roleIn(db, treeId, me.id), "contributor")) return { error: "Nu ai drept să modifici acest arbore." };
  const res = await db.update(document).set({ description: parsed.data.description || null }).where(and(eq(document.id, docId), eq(document.treeId, treeId))).returning({ id: document.id });
  if (!res.length) return { error: "Documentul nu există." };
  revalidatePath(`/arbore/${treeId}`);
  return { ok: true };
}

/** Proprietarul arborelui alege până la ce grad de rudenie își pot scrie membrii. */
export async function setChatLimit(treeId: string, degree: number): Promise<{ ok?: boolean; error?: string }> {
  const parsed = z.object({ treeId: z.string().uuid(), degree: z.number().int().min(1).max(10) }).safeParse({ treeId, degree });
  if (!parsed.success) return { error: "Alege un grad între I și X." };
  const me = await currentUser();
  if (!me || (await roleIn(db, treeId, me.id)) !== "owner") return { error: "Doar proprietarul arborelui schimbă această regulă." };
  await db.update(tree).set({ chatMaxDegree: degree }).where(eq(tree.id, treeId));
  revalidatePath(`/arbore/${treeId}`);
  revalidatePath("/mesaje");
  return { ok: true };
}

export async function sendMessage(_: unknown, form: FormData) {
  const parsed = z.object({ treeId: z.string().uuid(), to: z.string().min(1).max(100), body: z.string().trim().min(1, "Scrie un mesaj.").max(4000) }).safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const v = parsed.data;
  const me = await currentUser();
  if (!me) return { error: "Intră în cont." };
  const ok = await canMessage(db, v.treeId, me.id, v.to);
  if (!ok.ok) return { error: ok.reason };
  await db.insert(message).values({ treeId: v.treeId, fromUserId: me.id, toUserId: v.to, body: v.body });
  revalidatePath(`/mesaje/${v.treeId}/${v.to}`);
  return { ok: true, sentAt: Date.now() };
}
