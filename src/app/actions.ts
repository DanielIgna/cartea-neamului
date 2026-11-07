"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq, and, inArray, or } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { tree, person, relationship, treeMember, document, documentLink, message, raisedBy } from "@/db/schema";
import { canMessage } from "@/lib/chat";
import { importGedcom } from "@/lib/gedcom-db";
import { normalizeTypedDate, parseFuzzyDate } from "@/lib/dates";
import { ensureSchema } from "@/lib/bootstrap";
import { currentUser, roleIn, can } from "@/lib/access";
import { createInvitation, acceptInvitation } from "@/lib/invitations";
import { headers } from "next/headers";
import { toView } from "@/lib/tree-data";
import { aiConfigured, biographyPrompt, chat } from "@/lib/ai";
import { mergeInto } from "@/lib/merge";
import { after } from "next/server";
import { refreshTreePlaces } from "@/lib/shared-places";
import { setRaised } from "@/lib/raised";
import { getLocale, getT } from "@/i18n/server";
import { degreeWord } from "@/lib/kin-words";
import { isPlaceholder } from "@/lib/family";
import { buildGraph } from "@/lib/kinship";
import { closeKinIds, mayEdit } from "@/lib/relatives";
import { editLimits, limitFor, type EditOp } from "@/lib/edit-limits";
import { fieldChanges, logChange, personName, snapshotPerson, type LogAction, type LogDiff } from "@/lib/edit-log";
import type { Role } from "@/lib/access";

/** După o schimbare în fișe, satele pe care le văd alte neamuri („Din aceleași locuri”) se recalculează, după răspuns. */
function placesChanged(treeId: string) {
  after(async () => {
    try { await refreshTreePlaces(db, treeId); } catch (e) { console.error("Din aceleași locuri: nu am putut recalcula satele", e); }
  });
}

/**
 * Dacă adminul a limitat schimbările acestui om sau ale acestui arbore („Istoric și limite”), mesajul pentru el; altfel null.
 * Rolul din arbore se verifică separat, ca până acum.
 */
async function limited(treeId: string, userId: string, role: Role | null, op: EditOp): Promise<string | null> {
  const code = limitFor(await editLimits(db), treeId, userId, role, op);
  return code ? (await getT("TreeErrors"))(`limit.${code}`) : null;
}

/** O schimbare în istoric; o greșeală la scriere nu oprește schimbarea făcută de om. */
async function logged(treeId: string, actorId: string, personId: string, action: LogAction, diff: LogDiff) {
  try { await logChange(db, { treeId, actorId, personId, action, diff }); } catch (e) { console.error("Istoric: nu am putut scrie schimbarea", e); }
}
const nameOf = async (treeId: string, id: string) => {
  const [p] = await db.select({ givenName: person.givenName, surname: person.surname }).from(person).where(and(eq(person.id, id), eq(person.treeId, treeId)));
  return p ? personName(p) : "?";
};
const KIND_RO = { father: "tată", mother: "mamă", child: "copil", spouse: "soț/soție", sibling: "frate/soră" } as const;

/**
 * Cine poate corecta fișa unei persoane: editorii pe oricine; contributorii pe cei adăugați de ei, propriul profil și, din
 * profilul lor, rudele apropiate (părinți, bunici, soți, frați, copii, nepoți), cât timp ruda nu și-a revendicat fișa.
 */
async function mayFix(treeId: string, meId: string, role: Role | null, p: typeof person.$inferSelect) {
  const base = { editor: can(role, "editor"), contributor: can(role, "contributor"), meId, target: { id: p.id, createdBy: p.createdBy, claimedBy: p.claimedByUserId } };
  if (mayEdit({ ...base, kin: null })) return true;
  if (!base.contributor || p.claimedByUserId) return false;
  const [mine] = await db.select({ id: person.id }).from(person).where(and(eq(person.treeId, treeId), eq(person.claimedByUserId, meId))).limit(1);
  if (!mine) return false;
  const people = await db.select({ id: person.id, sex: person.sex }).from(person).where(eq(person.treeId, treeId));
  const rels = await db.select({ type: relationship.type, a: relationship.personA, b: relationship.personB }).from(relationship).where(eq(relationship.treeId, treeId));
  return mayEdit({ ...base, kin: closeKinIds(buildGraph(people, rels), mine.id) });
}

const MAX_GEDCOM_BYTES = 10 * 1024 * 1024;

type TreeErrors = Awaited<ReturnType<typeof getT<"TreeErrors">>>;
/** Primul lucru greșit dintr-un formular, spus în limba omului. */
function formError(te: TreeErrors, issues: z.ZodIssue[]) {
  const i = issues[0];
  if (i?.path[0] === "given" && i.code === "too_small") return te("givenMissing");
  if (i?.path[0] === "body" && i.code === "too_small") return te("writeMessage");
  return i?.code === "too_big" ? te("tooLong") : te("badData");
}
const RAISED_ERROR = { self: "raisedSelf", gone: "personGone", parent: "raisedParent", descendant: "raisedDescendant" } as const;

export async function createTree(_: unknown, form: FormData) {
  const te = await getT("TreeErrors");
  await ensureSchema();
  const t = await getT("Errors");
  const me = await currentUser();
  if (!me) return { error: t("createSignIn") };
  const name = String(form.get("name") ?? "").trim();
  if (!name) return { error: t("createName") };
  const region = String(form.get("region") ?? "") || null;
  const file = form.get("gedcom");
  const hasGedcom = file instanceof File && file.size > 0;
  // Verificăm tot înainte să scriem ceva, ca o eroare să nu lase în urmă un arbore gol, care nu se poate deschide.
  if (hasGedcom && file.size > MAX_GEDCOM_BYTES) return { error: t("gedcomTooBig") };
  const given = String(form.get("given") ?? "").trim(), surname = String(form.get("surname") ?? "").trim();
  if (!hasGedcom && !given && !surname) return { error: t("createNoName") };
  const gedcom = hasGedcom ? await file.text() : null;

  const NO_PEOPLE = "gedcom-fara-persoane";
  const locale = await getLocale();
  const made = await db.transaction(async (tx) => {
    const [t] = await tx.insert(tree).values({ name, ownerId: me.id, region }).returning();
    await tx.insert(treeMember).values({ treeId: t.id, userId: me.id, role: "owner" });
    if (gedcom !== null) {
      const res = await importGedcom(tx as unknown as typeof db, t.id, gedcom, me.id);
      if (!res.persons) throw new Error(NO_PEOPLE);
      const [first] = await tx.select().from(person).where(and(eq(person.treeId, t.id), eq(person.gedcomXref, "@I1@")));
      const [any] = first ? [first] : await tx.select().from(person).where(eq(person.treeId, t.id)).limit(1);
      await tx.update(tree).set({ rootPersonId: any.id }).where(eq(tree.id, t.id));
    } else {
      const birth = normalizeTypedDate(String(form.get("birth") ?? ""), locale);
      const b = parseFuzzyDate(birth);
      const [p] = await tx.insert(person).values({
        treeId: t.id, givenName: given, surname, birthDateText: birth || null,
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
  if (!made) return { error: t("gedcomEmpty") };
  redirect(`/arbore/${made.id}`);
}

const Fields = {
  given: z.string().trim().min(1, "Scrie prenumele.").max(120), surname: z.string().trim().max(120), birthSurname: z.string().trim().max(120).optional(),
  birth: z.string().trim().max(60).optional(), birthPlace: z.string().trim().max(160).optional(),
  death: z.string().trim().max(60).optional(), deathPlace: z.string().trim().max(160).optional(), living: z.string().optional(),
  birthCountry: z.string().trim().max(80).optional(), deathCountry: z.string().trim().max(80).optional(),
  residencePlace: z.string().trim().max(160).optional(), residenceCountry: z.string().trim().max(80).optional(),
  sex: z.enum(["M", "F", "U"]).optional(), occupation: z.string().trim().max(160).optional(),
  biography: z.string().trim().max(8000).optional(), notes: z.string().trim().max(8000).optional(), discreet: z.string().optional(),
};
const Relative = z.object({
  treeId: z.string().uuid(), anchorId: z.string().uuid(), kind: z.enum(["father", "mother", "child", "spouse", "sibling"]),
  otherParentId: z.string().uuid().optional().or(z.literal("")), ...Fields,
});

/**
 * Valorile fișei din formular. Datele scrise acum le citim în felul limbii celui care scrie (în engleza americană luna vine
 * întâi); cele lăsate cum erau (`before`) nu le atingem, ca „12.03.1985” scris de o rudă din România să nu devină 3 decembrie.
 */
const personValues = (v: z.infer<typeof Relative> | z.infer<typeof Edit>, locale: string, before?: { birth: string | null; death: string | null }) => {
  const typed = (text: string | undefined, old: string | null | undefined) => (text && text !== old ? normalizeTypedDate(text, locale) : text);
  const birth = typed(v.birth, before?.birth), death = typed(v.death, before?.death);
  const b = parseFuzzyDate(birth), d = parseFuzzyDate(death);
  return {
    givenName: v.given, surname: v.surname, birthSurname: v.birthSurname || null,
    birthDateText: birth || null, birthFrom: b.from, birthTo: b.to, birthPlace: v.birthPlace || null,
    deathDateText: death || null, deathFrom: d.from, deathTo: d.to, deathPlace: v.deathPlace || null,
    birthCountry: v.birthCountry || null, deathCountry: v.living === "on" ? null : v.deathCountry || null,
    residencePlace: v.living === "on" ? v.residencePlace || null : null, residenceCountry: v.living === "on" ? v.residenceCountry || null : null,
    living: v.living === "on", occupation: v.occupation || null, biography: v.biography || null, notes: v.notes || null,
    discreet: v.discreet === "on",
  };
};

/**
 * Adaugă o rudă lângă o persoană din arbore: tată, mamă, copil, soț/soție sau frate/soră.
 * Persoana și legăturile ei intră într-o singură tranzacție, ca rudele care urmăresc arborele live să nu vadă pe cineva „plutind”.
 */
export async function addRelative(_: unknown, form: FormData) {
  const te = await getT("TreeErrors");
  const parsed = Relative.safeParse(Object.fromEntries(form));
  // „Și pentru…”: frații care primesc același părinte nou, sau copiii care primesc noul soț/soție ca părinte.
  const also = form.getAll("also").map(String).filter((x) => /^[0-9a-f-]{36}$/i.test(x));
  if (!parsed.success) return { error: formError(te, parsed.error.issues) };
  const v = parsed.data;
  const me = await currentUser();
  const role = me ? await roleIn(db, v.treeId, me.id) : null;
  if (!me || !can(role, "contributor")) return { error: te("noAddRight") };
  const lim = await limited(v.treeId, me.id, role, "add");
  if (lim) return { error: lim };
  const [anchor] = await db.select().from(person).where(and(eq(person.id, v.anchorId), eq(person.treeId, v.treeId)));
  if (!anchor) return { error: te("personGone") };
  const parentsOf = async (id: string) => db.select({ id: person.id, sex: person.sex }).from(relationship)
    .innerJoin(person, eq(person.id, relationship.personA))
    .where(and(eq(relationship.type, "parent_child"), eq(relationship.personB, id)));

  let sex: "M" | "F" | "U" = v.sex ?? "U";
  let parentIds: string[] = [];
  let shareWith: string[] = [];
  if (v.kind === "father" || v.kind === "mother") {
    sex = v.kind === "father" ? "M" : "F";
    const existing = await parentsOf(anchor.id);
    if (existing.some((e) => e.sex === sex)) return { error: te("hasParent", { name: anchor.givenName, kind: v.kind }) };
    // Doar frații adevărați (cu un părinte comun) care nu au încă un părinte de acest sex.
    for (const id of also) {
      if (id === anchor.id) continue;
      const theirs = await parentsOf(id);
      if (theirs.some((t) => existing.some((e) => e.id === t.id)) && !theirs.some((t) => t.sex === sex)) shareWith.push(id);
    }
  } else if (v.kind === "sibling") {
    parentIds = (await parentsOf(anchor.id)).map((p) => p.id);
    // Fără părinți cunoscuți, frații se leagă printr-un tată încă fără nume, pe care îl poți completa mai târziu.
    if (!parentIds.length) {
      const [father] = await db.transaction(async (tx) => {
        const r = await tx.insert(person).values({ treeId: v.treeId, sex: "M", createdBy: me.id, givenName: "Tată necunoscut", surname: anchor.birthSurname || anchor.surname,
          notes: te("autoNoteSiblings", { name: anchor.givenName }) }).returning();
        await tx.insert(relationship).values({ treeId: v.treeId, type: "parent_child", personA: r[0].id, personB: anchor.id, subtype: "biologic" });
        return r;
      });
      parentIds = [father.id];
    }
  } else if (v.kind === "spouse") {
    // Copiii lui care nu au încă al doilea părinte.
    for (const id of also) {
      const theirs = await parentsOf(id);
      if (theirs.length === 1 && theirs[0].id === anchor.id) shareWith.push(id);
    }
  } else if (v.kind === "child") {
    parentIds = [anchor.id];
    if (v.otherParentId) {
      const [other] = await db.select({ id: person.id }).from(person).where(and(eq(person.id, v.otherParentId), eq(person.treeId, v.treeId)));
      if (other) parentIds.push(other.id);
    }
  }

  const locale = await getLocale();
  const p = await db.transaction(async (tx) => {
    const [p] = await tx.insert(person).values({ treeId: v.treeId, sex, createdBy: me.id, ...personValues(v, locale) }).returning();
    if (v.kind === "father" || v.kind === "mother")
      for (const c of [anchor.id, ...shareWith]) await tx.insert(relationship).values({ treeId: v.treeId, type: "parent_child", personA: p.id, personB: c, subtype: "biologic" });
    else if (v.kind === "spouse") {
      await tx.insert(relationship).values({ treeId: v.treeId, type: "partnership", personA: anchor.id, personB: p.id, subtype: "casatorie" });
      for (const c of shareWith) await tx.insert(relationship).values({ treeId: v.treeId, type: "parent_child", personA: p.id, personB: c, subtype: "biologic" });
    }
    else for (const parent of parentIds)
      await tx.insert(relationship).values({ treeId: v.treeId, type: "parent_child", personA: parent, personB: p.id, subtype: "biologic" });
    // Doi părinți fără legătură între ei devin partenerii copilului comun, ca descendenții să-i arate împreună.
    if (v.kind === "father" || v.kind === "mother") {
      const [other] = (await tx.select({ id: person.id, sex: person.sex }).from(relationship).innerJoin(person, eq(person.id, relationship.personA))
        .where(and(eq(relationship.type, "parent_child"), eq(relationship.personB, anchor.id)))).filter((x) => x.id !== p.id);
      if (other) await linkPartners(tx, v.treeId, p.id, other.id);
    }
    return p;
  });
  await logged(v.treeId, me.id, p.id, "adaugare", {
    name: personName(p), summary: `Adăugat(ă) ca ${KIND_RO[v.kind]} pentru ${personName(anchor)}${shareWith.length ? ` (și pentru încă ${shareWith.length})` : ""}`,
    after: fieldChanges({}, p)?.after,
  });
  revalidatePath(`/arbore/${v.treeId}`);
  placesChanged(v.treeId);
  return { ok: true, id: p.id, message: te("added", { kind: v.kind, name: `${p.givenName} ${p.surname}`.trim() }) };
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
  const te = await getT("TreeErrors");
  const parsed = Edit.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: formError(te, parsed.error.issues) };
  const v = parsed.data;
  const me = await currentUser();
  const role = me ? await roleIn(db, v.treeId, me.id) : null;
  if (!me || !can(role, "contributor")) return { error: te("noEditRight") };
  const [p] = await db.select().from(person).where(and(eq(person.id, v.personId), eq(person.treeId, v.treeId)));
  if (!p) return { error: te("personGone") };
  if (!(await mayFix(v.treeId, me.id, role, p))) return { error: te("onlyOwnEdit") };
  const lim = await limited(v.treeId, me.id, role, "edit");
  if (lim) return { error: lim };
  const values = { ...personValues(v, await getLocale(), { birth: p.birthDateText, death: p.deathDateText }), sex: v.sex ?? p.sex };
  await db.update(person).set({ ...values, updatedAt: new Date() }).where(eq(person.id, p.id));
  const changed = fieldChanges(p, values);
  if (changed) await logged(v.treeId, me.id, p.id, "modificare", { name: personName({ givenName: values.givenName, surname: values.surname }), ...changed });
  revalidatePath(`/arbore/${v.treeId}`);
  placesChanged(v.treeId);
  return { ok: true, message: te("saved") };
}

const Invite = z.object({ treeId: z.string().uuid(), role: z.enum(["editor", "contributor", "viewer"]), personId: z.string().uuid().optional().or(z.literal("")) });

export async function createInviteLink(_: unknown, form: FormData) {
  const tr = await getT("Errors");
  const parsed = Invite.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: tr("inviteInvalid") };
  const me = await currentUser();
  if (!me || !can(await roleIn(db, parsed.data.treeId, me.id), "editor")) return { error: tr("inviteNotAllowed") };
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
  const te = await getT("TreeErrors");
  const parsed = PersonRef.safeParse({ treeId, personId });
  if (!parsed.success) return { error: te("badData") };
  const me = await currentUser();
  if (!me || !can(await roleIn(db, treeId, me.id), "contributor")) return { error: te("noWriteRight") };
  if (!aiConfigured()) return { error: te("aiOff") };
  const [p] = await db.select().from(person).where(and(eq(person.id, personId), eq(person.treeId, treeId)));
  if (!p) return { error: te("personGone") };
  if (p.living) return { error: te("aiLiving") };
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
    return { error: te("aiFailed") };
  }
}

export async function saveBiography(treeId: string, personId: string, biography: string): Promise<{ ok?: boolean; error?: string }> {
  const te = await getT("TreeErrors");
  const parsed = PersonRef.extend({ biography: z.string().trim().min(1).max(4000) }).safeParse({ treeId, personId, biography });
  if (!parsed.success) return { error: te("bioInvalid") };
  const me = await currentUser();
  const role = me ? await roleIn(db, treeId, me.id) : null;
  if (!me || !can(role, "editor")) return { error: te("bioEditors") };
  const lim = await limited(treeId, me.id, role, "edit");
  if (lim) return { error: lim };
  const [before] = await db.select().from(person).where(and(eq(person.id, personId), eq(person.treeId, treeId)));
  if (!before) return { error: te("personGone") };
  await db.update(person).set({ biography: parsed.data.biography, updatedAt: new Date() }).where(eq(person.id, personId));
  const changed = fieldChanges(before, { biography: parsed.data.biography });
  if (changed) await logged(treeId, me.id, personId, "modificare", { name: personName(before), ...changed });
  revalidatePath(`/arbore/${treeId}`);
  return { ok: true };
}

/* ---------- Poze, album și mesaje ---------- */

const DocRef = z.object({ treeId: z.string().uuid(), personId: z.string().uuid(), docId: z.string().uuid() });

/** Alege poza de profil a unei persoane dintre fotografiile ei. */
export async function setProfilePhoto(treeId: string, personId: string, docId: string): Promise<{ ok?: boolean; error?: string }> {
  const te = await getT("TreeErrors");
  if (!DocRef.safeParse({ treeId, personId, docId }).success) return { error: te("badData") };
  const me = await currentUser();
  const role = me ? await roleIn(db, treeId, me.id) : null;
  if (!me || !can(role, "contributor")) return { error: te("noEditRight") };
  const lim = await limited(treeId, me.id, role, "edit");
  if (lim) return { error: lim };
  const [link] = await db.select({ id: document.id }).from(documentLink).innerJoin(document, eq(document.id, documentLink.documentId))
    .where(and(eq(documentLink.personId, personId), eq(document.id, docId), eq(document.treeId, treeId), eq(document.kind, "photo")));
  if (!link) return { error: te("photoNotInAlbum") };
  const [before] = await db.select().from(person).where(and(eq(person.id, personId), eq(person.treeId, treeId)));
  if (!before) return { error: te("personGone") };
  await db.update(person).set({ photoDocumentId: docId, updatedAt: new Date() }).where(eq(person.id, personId));
  const changed = fieldChanges(before, { photoDocumentId: docId });
  if (changed) await logged(treeId, me.id, personId, "modificare", { name: personName(before), ...changed });
  revalidatePath(`/arbore/${treeId}`);
  return { ok: true };
}

/** Descrierea unei poze sau a unui document: cine apare, unde, când, ce poveste are. */
export async function updateDocumentDescription(treeId: string, docId: string, description: string): Promise<{ ok?: boolean; error?: string }> {
  const te = await getT("TreeErrors");
  const parsed = z.object({ treeId: z.string().uuid(), docId: z.string().uuid(), description: z.string().trim().max(2000) }).safeParse({ treeId, docId, description });
  if (!parsed.success) return { error: te("descTooLong") };
  const me = await currentUser();
  const role = me ? await roleIn(db, treeId, me.id) : null;
  if (!me || !can(role, "contributor")) return { error: te("noEditRight") };
  const lim = await limited(treeId, me.id, role, "edit");
  if (lim) return { error: lim };
  const res = await db.update(document).set({ description: parsed.data.description || null }).where(and(eq(document.id, docId), eq(document.treeId, treeId))).returning({ id: document.id });
  if (!res.length) return { error: te("docMissing") };
  revalidatePath(`/arbore/${treeId}`);
  return { ok: true };
}

/** Proprietarul arborelui alege până la ce grad de rudenie își pot scrie membrii. */
export async function setChatLimit(treeId: string, degree: number): Promise<{ ok?: boolean; error?: string }> {
  const te = await getT("TreeErrors");
  const parsed = z.object({ treeId: z.string().uuid(), degree: z.number().int().min(1).max(10) }).safeParse({ treeId, degree });
  if (!parsed.success) return { error: te("degreeRange") };
  const me = await currentUser();
  if (!me || (await roleIn(db, treeId, me.id)) !== "owner") return { error: te("ownerOnlyRule") };
  await db.update(tree).set({ chatMaxDegree: degree }).where(eq(tree.id, treeId));
  revalidatePath(`/arbore/${treeId}`);
  revalidatePath("/mesaje");
  return { ok: true };
}

export async function sendMessage(_: unknown, form: FormData) {
  const te = await getT("TreeErrors");
  const parsed = z.object({ treeId: z.string().uuid(), to: z.string().min(1).max(100), body: z.string().trim().min(1, "Scrie un mesaj.").max(4000) }).safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: formError(te, parsed.error.issues) };
  const v = parsed.data;
  const me = await currentUser();
  if (!me) return { error: te("signIn") };
  const ok = await canMessage(db, v.treeId, me.id, v.to);
  if (!ok.ok) {
    const [tc, locale] = await Promise.all([getT("Chat"), getLocale()]);
    return { error: ok.code === "beyondLimit" ? tc("reasons.beyondLimit", { degree: degreeWord(ok.limit, locale) }) : tc(`reasons.${ok.code}`) };
  }
  await db.insert(message).values({ treeId: v.treeId, fromUserId: me.id, toUserId: v.to, body: v.body });
  revalidatePath(`/mesaje/${v.treeId}/${v.to}`);
  return { ok: true, sentAt: Date.now() };
}

/**
 * Schimbă tatăl sau mama unei persoane: scoate legătura greșită și, dacă e ales cineva, o pune pe cea bună
 * (de pildă copiii dintr-o altă căsătorie a tatălui). Cei doi părinți devin parteneri, dacă nu erau deja.
 */
export async function setParent(treeId: string, childId: string, role: "father" | "mother", parentId: string | null): Promise<{ ok?: boolean; error?: string }> {
  const te = await getT("TreeErrors");
  const parsed = z.object({ treeId: z.string().uuid(), childId: z.string().uuid(), role: z.enum(["father", "mother"]), parentId: z.string().uuid().nullable() })
    .safeParse({ treeId, childId, role, parentId });
  if (!parsed.success) return { error: te("badData") };
  const me = await currentUser();
  const myRole = me ? await roleIn(db, treeId, me.id) : null;
  if (!me || !can(myRole, "contributor")) return { error: te("noLinkRight") };
  // Scoaterea unui părinte fără altul în loc e ca o ștergere de legătură.
  const lim = await limited(treeId, me.id, myRole, parentId ? "edit" : "delete");
  if (lim) return { error: lim };
  const inTree = async (id: string) => (await db.select({ id: person.id, sex: person.sex }).from(person).where(and(eq(person.id, id), eq(person.treeId, treeId))))[0];
  const child = await inTree(childId);
  if (!child) return { error: te("personGone") };
  const newParent = parentId ? await inTree(parentId) : null;
  if (parentId && !newParent) return { error: te("parentMissing") };
  if (parentId === childId) return { error: te("selfParent") };
  if (parentId && (await isDescendant(treeId, childId, parentId))) return { error: te("descendantParent") };
  const sex = role === "father" ? "M" : "F";
  const parents = await db.select({ id: person.id, sex: person.sex }).from(relationship).innerJoin(person, eq(person.id, relationship.personA))
    .where(and(eq(relationship.treeId, treeId), eq(relationship.type, "parent_child"), eq(relationship.personB, childId)));
  const old = parents.filter((p) => p.sex === sex);
  const other = parents.find((p) => p.sex !== sex && p.id !== parentId);
  await db.transaction(async (tx) => {
    for (const o of old)
      await tx.delete(relationship).where(and(eq(relationship.treeId, treeId), eq(relationship.type, "parent_child"), eq(relationship.personA, o.id), eq(relationship.personB, childId)));
    if (!newParent) return;
    await tx.insert(relationship).values({ treeId, type: "parent_child", personA: newParent.id, personB: childId, subtype: "biologic" }).onConflictDoNothing();
    if (other) await linkPartners(tx, treeId, newParent.id, other.id);
  });
  await dropEmptyPlaceholders(treeId, old.map((o) => o.id).filter((id) => id !== parentId));
  const word = role === "father" ? "tatăl" : "mama";
  const was = (await Promise.all(old.map((o) => nameOf(treeId, o.id)))).join(", ");
  await logged(treeId, me.id, childId, "legaturi", {
    name: await nameOf(treeId, childId),
    summary: newParent ? `I-a schimbat ${word}${was ? ` (era ${was})` : ""}: acum ${await nameOf(treeId, newParent.id)}` : `I-a scos ${word}${was ? `: ${was}` : ""}`,
  });
  revalidatePath(`/arbore/${treeId}`);
  return { ok: true };
}

/**
 * Un „Tată necunoscut” (sau „Mamă necunoscută”) ține locul unui părinte. Înlocuit cu cel adevărat și rămas fără niciun copil,
 * nu mai ține locul nimănui: îl scoatem, cu tot cu căsătoria închipuită, ca să nu rămână în desen lângă celălalt părinte.
 */
async function dropEmptyPlaceholders(treeId: string, ids: string[]) {
  const te = await getT("TreeErrors");
  for (const id of ids) {
    const [p] = await db.select({ given: person.givenName, claimed: person.claimedByUserId }).from(person).where(and(eq(person.id, id), eq(person.treeId, treeId)));
    if (!p || p.claimed || !isPlaceholder(p.given)) continue;
    const kin = await db.select({ id: relationship.id }).from(relationship)
      .where(and(eq(relationship.treeId, treeId), eq(relationship.type, "parent_child"), or(eq(relationship.personA, id), eq(relationship.personB, id)))).limit(1);
    const cared = await db.select({ child: raisedBy.childId }).from(raisedBy).where(and(eq(raisedBy.treeId, treeId), or(eq(raisedBy.childId, id), eq(raisedBy.carerId, id)))).limit(1);
    if (!kin.length && !cared.length) await db.delete(person).where(eq(person.id, id));
  }
}

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** Îi face parteneri pe doi oameni, o singură dată, oricare ar fi ordinea în care au fost legați înainte. */
async function linkPartners(tx: Tx, treeId: string, a: string, b: string) {
  const existing = await tx.select({ id: relationship.id }).from(relationship).where(and(eq(relationship.treeId, treeId), eq(relationship.type, "partnership"),
    or(and(eq(relationship.personA, a), eq(relationship.personB, b)), and(eq(relationship.personA, b), eq(relationship.personB, a)))));
  if (!existing.length) await tx.insert(relationship).values({ treeId, type: "partnership", personA: a, personB: b, subtype: "casatorie" });
}

/** Este `candidate` urmaș al lui `ancestor`? (ca un copil să nu devină părintele propriului părinte) */
async function isDescendant(treeId: string, ancestor: string, candidate: string) {
  const rels = await db.select({ a: relationship.personA, b: relationship.personB }).from(relationship)
    .where(and(eq(relationship.treeId, treeId), eq(relationship.type, "parent_child")));
  const seen = new Set<string>([ancestor]);
  for (let frontier = [ancestor]; frontier.length; ) {
    const next = rels.filter((r) => frontier.includes(r.a) && !seen.has(r.b)).map((r) => r.b);
    for (const n of next) { if (n === candidate) return true; seen.add(n); }
    frontier = next;
  }
  return false;
}

/**
 * Șterge o persoană adăugată din greșeală, cu toate legăturile ei. Editorii pot șterge pe oricine,
 * contributorii doar pe cine au adăugat ei. Nu se șterg rădăcina arborelui și profilurile revendicate de altcineva.
 */
export async function deletePerson(treeId: string, personId: string): Promise<{ ok?: boolean; error?: string }> {
  const te = await getT("TreeErrors");
  const parsed = z.object({ treeId: z.string().uuid(), personId: z.string().uuid() }).safeParse({ treeId, personId });
  if (!parsed.success) return { error: te("badData") };
  const me = await currentUser();
  const role = me ? await roleIn(db, treeId, me.id) : null;
  if (!me || !can(role, "contributor")) return { error: te("noDeleteRight") };
  const [p] = await db.select().from(person).where(and(eq(person.id, personId), eq(person.treeId, treeId)));
  if (!p) return { error: te("personGone") };
  if (!can(role, "editor") && p.createdBy !== me.id) return { error: te("onlyOwnDelete") };
  if (p.claimedByUserId && p.claimedByUserId !== me.id) return { error: te("claimedNoDelete") };
  const [t] = await db.select({ root: tree.rootPersonId }).from(tree).where(eq(tree.id, treeId));
  if (t?.root === personId) return { error: te("rootNoDelete") };
  const lim = await limited(treeId, me.id, role, "delete");
  if (lim) return { error: lim };
  // Fișa întreagă, cu legăturile ei, rămâne în istoric: adminul o poate pune înapoi dacă a fost ștearsă din greșeală.
  const snapshot = await snapshotPerson(db, treeId, personId);
  await db.delete(person).where(eq(person.id, personId));
  if (snapshot) await logged(treeId, me.id, personId, "stergere", { name: personName(p), snapshot,
    summary: `Ștearsă cu ${snapshot.rels.length} legături${snapshot.memories ? `; avea ${snapshot.memories} amintiri în ladă, care nu se pot aduce înapoi` : ""}` });
  revalidatePath(`/arbore/${treeId}`);
  placesChanged(treeId);
  return { ok: true };
}

/**
 * Soții au copiii împreună: copiii care au trecut doar unul dintre soți primesc și celălalt părinte.
 * Se leagă doar copiii aleși (cei din altă căsătorie rămân deoparte) și doar dacă au un singur părinte, partenerul lui `parentId`.
 */
export async function linkChildren(treeId: string, parentId: string, childIds: string[]): Promise<{ ok?: boolean; linked?: number; error?: string }> {
  const te = await getT("TreeErrors");
  const parsed = z.object({ treeId: z.string().uuid(), parentId: z.string().uuid(), childIds: z.array(z.string().uuid()).max(100) }).safeParse({ treeId, parentId, childIds });
  if (!parsed.success) return { error: te("badData") };
  const me = await currentUser();
  const role = me ? await roleIn(db, treeId, me.id) : null;
  if (!me || !can(role, "contributor")) return { error: te("noLinkRight") };
  const lim = await limited(treeId, me.id, role, "edit");
  if (lim) return { error: lim };
  const rels = await db.select({ type: relationship.type, a: relationship.personA, b: relationship.personB }).from(relationship).where(eq(relationship.treeId, treeId));
  const partners = new Set(rels.filter((r) => r.type === "partnership" && (r.a === parentId || r.b === parentId)).map((r) => (r.a === parentId ? r.b : r.a)));
  let linked = 0;
  await db.transaction(async (tx) => {
    for (const c of childIds) {
      const parents = rels.filter((r) => r.type === "parent_child" && r.b === c).map((r) => r.a);
      if (parents.length !== 1 || !partners.has(parents[0]) || c === parentId) continue;
      await tx.insert(relationship).values({ treeId, type: "parent_child", personA: parentId, personB: c, subtype: "biologic" }).onConflictDoNothing();
      linked++;
    }
  });
  if (linked) await logged(treeId, me.id, parentId, "legaturi", { name: await nameOf(treeId, parentId), summary: `I-a legat ${linked} copii ai soțului/soției ca fiind și ai lui/ei` });
  revalidatePath(`/arbore/${treeId}`);
  return { ok: true, linked };
}

/**
 * „A crescut-o”: cine a crescut un copil fără să-i fie părinte (mama vitregă, bunicii). Nu schimbă desenele; apare în fișe, în profil și în carte.
 */
export async function setRaisedBy(treeId: string, childId: string, carerId: string, on: boolean): Promise<{ ok?: boolean; error?: string }> {
  const te = await getT("TreeErrors");
  if (!z.object({ treeId: z.string().uuid(), childId: z.string().uuid(), carerId: z.string().uuid(), on: z.boolean() }).safeParse({ treeId, childId, carerId, on }).success) return { error: te("badData") };
  const me = await currentUser();
  const role = me ? await roleIn(db, treeId, me.id) : null;
  if (!me || !can(role, "contributor")) return { error: te("noLinkRight") };
  const lim = await limited(treeId, me.id, role, on ? "edit" : "delete");
  if (lim) return { error: lim };
  const r = await setRaised(db, treeId, childId, carerId, on, me.id);
  if (r.code) return { error: te(RAISED_ERROR[r.code]) };
  await logged(treeId, me.id, childId, "legaturi", { name: await nameOf(treeId, childId), summary: `${on ? "A trecut" : "A scos"} „A crescut-o”: ${await nameOf(treeId, carerId)}` });
  revalidatePath(`/arbore/${treeId}`);
  return { ok: true };
}

/** Cine poate corecta fișa unei persoane: editorii pe oricine, contributorii pe cei adăugați de ei, fiecare propriul profil. */
async function canFix(treeId: string, personId: string) {
  const te = await getT("TreeErrors");
  const me = await currentUser();
  const role = me ? await roleIn(db, treeId, me.id) : null;
  if (!me || !can(role, "contributor")) return { error: te("noEditRight") } as const;
  const [p] = await db.select().from(person).where(and(eq(person.id, personId), eq(person.treeId, treeId)));
  if (!p) return { error: te("personGone") } as const;
  if (!(await mayFix(treeId, me.id, role, p))) return { error: te("onlyOwnChange") } as const;
  const lim = await limited(treeId, me.id, role, "edit");
  if (lim) return { error: lim } as const;
  return { me, p } as const;
}

/**
 * Persoană discretă (de pildă o fostă soție): nu apare în desenele arborelui și nici în lista rudelor prin alianță,
 * ci doar în fișele copiilor ei. Copiii ei pornesc în desen doar din celălalt părinte.
 */
export async function setDiscreet(treeId: string, personId: string, on: boolean): Promise<{ ok?: boolean; error?: string }> {
  const te = await getT("TreeErrors");
  if (!z.object({ treeId: z.string().uuid(), personId: z.string().uuid(), on: z.boolean() }).safeParse({ treeId, personId, on }).success) return { error: te("badData") };
  const r = await canFix(treeId, personId);
  if ("error" in r) return { error: r.error };
  await db.update(person).set({ discreet: on, updatedAt: new Date() }).where(eq(person.id, personId));
  const changed = fieldChanges(r.p, { discreet: on });
  if (changed) await logged(treeId, r.me.id, personId, "modificare", { name: personName(r.p), ...changed });
  revalidatePath(`/arbore/${treeId}`);
  placesChanged(treeId);
  return { ok: true };
}

/**
 * Copil dintr-o altă relație, cu cineva al cărui nume nu se știe (sau nu vrei să-l scrii): primește un părinte „necunoscut”, discret,
 * în locul celui trecut greșit. Așa nu mai e socotit copilul soțului/soției de acum, iar frații lui apar „după tată” / „după mamă”.
 */
export async function otherRelation(treeId: string, childId: string, role: "father" | "mother"): Promise<{ ok?: boolean; error?: string }> {
  const te = await getT("TreeErrors");
  if (!z.object({ treeId: z.string().uuid(), childId: z.string().uuid(), role: z.enum(["father", "mother"]) }).safeParse({ treeId, childId, role }).success) return { error: te("badData") };
  const me = await currentUser();
  const myRole = me ? await roleIn(db, treeId, me.id) : null;
  if (!me || !can(myRole, "contributor")) return { error: te("noLinkRight") };
  const lim = await limited(treeId, me.id, myRole, "edit");
  if (lim) return { error: lim };
  const [child] = await db.select().from(person).where(and(eq(person.id, childId), eq(person.treeId, treeId)));
  if (!child) return { error: te("personGone") };
  const sex = role === "father" ? "M" : "F";
  const parents = await db.select({ id: person.id, sex: person.sex, given: person.givenName }).from(relationship).innerJoin(person, eq(person.id, relationship.personA))
    .where(and(eq(relationship.treeId, treeId), eq(relationship.type, "parent_child"), eq(relationship.personB, childId)));
  const other = parents.find((x) => x.sex !== sex);
  await db.transaction(async (tx) => {
    for (const o of parents.filter((x) => x.sex === sex))
      await tx.delete(relationship).where(and(eq(relationship.treeId, treeId), eq(relationship.type, "parent_child"), eq(relationship.personA, o.id), eq(relationship.personB, childId)));
    const [ph] = await tx.insert(person).values({
      treeId, sex, createdBy: me.id, discreet: true, givenName: role === "father" ? "Tată necunoscut" : "Mamă necunoscută", surname: "",
      notes: te("autoNoteOther", { role, name: child.givenName, other: other?.given ?? "", hasOther: other ? "yes" : "no" }),
    }).returning();
    await tx.insert(relationship).values({ treeId, type: "parent_child", personA: ph.id, personB: childId, subtype: "biologic" });
    if (other) await linkPartners(tx, treeId, ph.id, other.id);
  });
  await dropEmptyPlaceholders(treeId, parents.filter((x) => x.sex === sex).map((x) => x.id));
  const old = parents.filter((x) => x.sex === sex).map((x) => x.given).join(", ");
  await logged(treeId, me.id, childId, "legaturi", { name: personName(child),
    summary: `Copil dintr-o altă relație: ${role === "father" ? "tatăl" : "mama"}${old ? ` (era ${old})` : ""} e acum necunoscut(ă)` });
  revalidatePath(`/arbore/${treeId}`);
  return { ok: true };
}

/**
 * Unește două fișe ale aceleiași persoane, trecută de două ori din greșeală (de pildă bunica, o dată cu 8 copii și încă o dată cu 3).
 * Doar proprietarul și editorii; nu se unesc oameni de sex diferit, fișe revendicate de oameni diferiți sau un om cu urmașul lui.
 */
export async function mergePeople(treeId: string, keepId: string, dropId: string): Promise<{ ok?: boolean; error?: string; message?: string }> {
  const te = await getT("TreeErrors");
  if (!z.object({ treeId: z.string().uuid(), keepId: z.string().uuid(), dropId: z.string().uuid() }).safeParse({ treeId, keepId, dropId }).success || keepId === dropId) return { error: te("badData") };
  const me = await currentUser();
  const role = me ? await roleIn(db, treeId, me.id) : null;
  if (!me || !can(role, "editor")) return { error: te("mergeEditors") };
  const lim = await limited(treeId, me.id, role, "delete");
  if (lim) return { error: lim };
  const two = await db.select().from(person).where(and(eq(person.treeId, treeId), inArray(person.id, [keepId, dropId])));
  const keep = two.find((x) => x.id === keepId), drop = two.find((x) => x.id === dropId);
  if (!keep || !drop) return { error: te("mergeGone") };
  if (keep.sex !== "U" && drop.sex !== "U" && keep.sex !== drop.sex) return { error: te("mergeSex") };
  if (keep.claimedByUserId && drop.claimedByUserId && keep.claimedByUserId !== drop.claimedByUserId) return { error: te("mergeClaimed") };
  if ((await isDescendant(treeId, keepId, dropId)) || (await isDescendant(treeId, dropId, keepId))) return { error: te("mergeDescendant") };
  const r = await mergeInto(db, treeId, keepId, dropId);
  const left = await settleParents(treeId, keepId);
  await logged(treeId, me.id, keepId, "unire", { name: personName(keep), summary: `A unit cu ea dubla „${personName(drop)}” (dubla a fost ștearsă)` });
  revalidatePath(`/arbore/${treeId}`);
  placesChanged(treeId);
  return { ok: true, message: te("merged", { name: r.name, warn: left.twoFathers ? "fathers" : left.twoMothers ? "mothers" : "none" }) };
}

/**
 * După o unire, o fișă poate avea și tatăl adevărat (adus de dublă) și un „Tată necunoscut” fără părinți, pus când i s-au adăugat frații.
 * Locul gol ținea locul aceluiași om: îl unim cu el, ca frații legați prin locul gol să treacă și ei la tatăl adevărat.
 */
async function settleParents(treeId: string, childId: string) {
  const parentsOf = (id: string) => db.select({ id: person.id, sex: person.sex, given: person.givenName, claimed: person.claimedByUserId }).from(relationship)
    .innerJoin(person, eq(person.id, relationship.personA)).where(and(eq(relationship.treeId, treeId), eq(relationship.type, "parent_child"), eq(relationship.personB, id)));
  const parents = await parentsOf(childId);
  for (const sex of ["M", "F"] as const) {
    const real = parents.filter((x) => x.sex === sex && !isPlaceholder(x.given));
    if (real.length !== 1) continue;
    for (const ph of parents.filter((x) => x.sex === sex && isPlaceholder(x.given) && !x.claimed)) {
      if ((await parentsOf(ph.id)).length || (await isDescendant(treeId, ph.id, real[0].id))) continue;
      await mergeInto(db, treeId, real[0].id, ph.id);
    }
  }
  const now = await parentsOf(childId);
  return { twoFathers: now.filter((x) => x.sex === "M").length > 1, twoMothers: now.filter((x) => x.sex === "F").length > 1 };
}

/**
 * „Tată necunoscut” e de fapt cineva din arbore (de pildă tatăl fraților, trecut la ei): toți copiii locului gol trec la el,
 * cu tot cu căsătoria, iar locul gol dispare. Așa ajunge neamul lui la toți frații deodată.
 */
export async function replacePlaceholder(treeId: string, placeholderId: string, personId: string): Promise<{ ok?: boolean; error?: string }> {
  const te = await getT("TreeErrors");
  if (!z.object({ treeId: z.string().uuid(), placeholderId: z.string().uuid(), personId: z.string().uuid() }).safeParse({ treeId, placeholderId, personId }).success
    || placeholderId === personId) return { error: te("badData") };
  const me = await currentUser();
  const role = me ? await roleIn(db, treeId, me.id) : null;
  if (!me || !can(role, "contributor")) return { error: te("noLinkRight") };
  const lim = await limited(treeId, me.id, role, "edit");
  if (lim) return { error: lim };
  const two = await db.select().from(person).where(and(eq(person.treeId, treeId), inArray(person.id, [placeholderId, personId])));
  const ph = two.find((x) => x.id === placeholderId), real = two.find((x) => x.id === personId);
  if (!ph || !real) return { error: te("onePersonGone") };
  if (!isPlaceholder(ph.givenName) || ph.claimedByUserId || isPlaceholder(real.givenName)) return { error: te("replaceOnlyPlaceholder") };
  if (ph.sex !== "U" && real.sex !== "U" && ph.sex !== real.sex) return { error: te("badData") };
  if ((await isDescendant(treeId, placeholderId, personId)) || (await isDescendant(treeId, personId, placeholderId))) return { error: te("replaceDescendant", { name: real.givenName }) };
  await mergeInto(db, treeId, personId, placeholderId);
  await logged(treeId, me.id, personId, "legaturi", { name: personName(real), summary: `A luat locul lui „${personName(ph)}” la copiii acestuia` });
  revalidatePath(`/arbore/${treeId}`);
  placesChanged(treeId);
  return { ok: true };
}
