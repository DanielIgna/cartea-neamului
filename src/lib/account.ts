/**
 * Contul și datele lui: ce descarcă omul din „Datele mele”, ce se întâmplă când își șterge contul și când își retrage acordul
 * pentru capitolul „Credința”.
 *
 * La ștergerea contului pleacă tot ce e al lui: contul cu sesiunile, amintirile din lada lui (și cele înregistrate de rude
 * pentru el, „la bunici”), cu glasul și pozele puse doar la ele, ce a scris sub amintirile altora, mesajele, întrebările lui
 * încă fără răspuns, cererile și acordurile. Arborii rămân ai familiei: unul cu alți membri trece la cel mai vechi membru
 * cu cel mai mare drept (editor, apoi contributor, apoi vizitator); unul în care e singur se șterge cu totul, cu fișele,
 * pozele și actele lui. Fișa lui din arbori rămâne, ca să nu se rupă arborele, dar fără legătura cu contul; dacă vrea, se
 * golește de datele lui (data și locul nașterii, unde locuiește, ocupația, biografia, poza de profil).
 */
import { and, asc, eq, inArray, isNull, ne, notInArray, or, sql } from "drizzle-orm";
import type { Db } from "@/db";
import {
  account, accountPlan, consent, document, usageDay, invitation, joinRequest, memory, memoryQuestion, memoryReply, message, person, placeContact, session, tree, treeMember,
  user, verification,
} from "@/db/schema";
import type { Role } from "./access";
import { dropMemories, type Q } from "./lada-db";
import { chapterLabel } from "./questions";
import { recordConsent } from "./consent";
import { CONSENT_LABEL, type ConsentPurpose } from "./legal";
import { sectionLabel } from "./usage";
import { PLANS, type Plan } from "./plan-names";

const RANK: Record<Role, number> = { viewer: 0, contributor: 1, editor: 2, owner: 3 };
/** În lada uneia dintre fișele lui (fără fișe, niciuna). */
const inLada = (ids: string[]) => (ids.length ? inArray(memory.personId, ids) : sql`false`);

export type Heir = { userId: string; name: string; role: Role };
export type OwnedTree = { id: string; name: string; people: number; heir: Heir | null };
export type DeletionPlan = {
  /** Arborii lui: fiecare trece la un alt membru (`heir`) sau, dacă e singur în el, se șterge. */
  owned: OwnedTree[];
  /** Arborii în care e doar membru: iese din ei. */
  member: { id: string; name: string; role: Role }[];
  /** Fișele lui revendicate, care rămân în arbori fără legătura cu contul. */
  claimed: { treeId: string; treeName: string; personId: string; name: string; living: boolean }[];
  memories: number; faith: number; replies: number; messages: number;
};

/** Fișele revendicate de cont, în toți arborii. */
const claimedIds = async (db: Q, userId: string) =>
  (await db.select({ id: person.id }).from(person).where(eq(person.claimedByUserId, userId))).map((r) => r.id);

/** Amintirile lui: din lada lui (oricine le-a scris) și cele scrise de el, nu pentru altcineva „la bunici”. */
const hisMemories = (userId: string, mine: string[]) => or(inLada(mine), and(eq(memory.authorId, userId), eq(memory.helper, false)))!;

/** Ce se întâmplă cu fiecare lucru dacă omul își șterge contul: ce arată pagina înainte de buton. */
export async function deletionPlan(db: Db, userId: string): Promise<DeletionPlan> {
  const memberships = await db.select({ id: tree.id, name: tree.name, ownerId: tree.ownerId, role: treeMember.role }).from(treeMember)
    .innerJoin(tree, eq(tree.id, treeMember.treeId)).where(eq(treeMember.userId, userId)).orderBy(asc(tree.createdAt));
  // Un arbore al lui fără rândul de membru (n-ar trebui să existe, dar nu-l lăsăm fără stăpân).
  const orphanOwned = await db.select({ id: tree.id, name: tree.name }).from(tree)
    .where(memberships.length ? and(eq(tree.ownerId, userId), notInArray(tree.id, memberships.map((m) => m.id))) : eq(tree.ownerId, userId));
  const ownedRows = [...memberships.filter((m) => m.role === "owner" || m.ownerId === userId), ...orphanOwned];
  const ownedIds = ownedRows.map((t) => t.id);
  const others = ownedIds.length
    ? await db.select({ treeId: treeMember.treeId, userId: treeMember.userId, role: treeMember.role, joinedAt: treeMember.joinedAt, name: user.name }).from(treeMember)
      .innerJoin(user, eq(user.id, treeMember.userId)).where(and(inArray(treeMember.treeId, ownedIds), ne(treeMember.userId, userId)))
    : [];
  const counts = ownedIds.length
    ? await db.select({ treeId: person.treeId, n: sql<number>`count(*)::int` }).from(person).where(inArray(person.treeId, ownedIds)).groupBy(person.treeId)
    : [];
  const owned: OwnedTree[] = ownedRows.map((t) => {
    const best = others.filter((o) => o.treeId === t.id)
      .sort((a, b) => RANK[b.role] - RANK[a.role] || a.joinedAt.getTime() - b.joinedAt.getTime())[0];
    return { id: t.id, name: t.name, people: Number(counts.find((c) => c.treeId === t.id)?.n ?? 0), heir: best ? { userId: best.userId, name: best.name, role: best.role } : null };
  });
  const claimed = await db.select({ treeId: person.treeId, treeName: tree.name, personId: person.id, given: person.givenName, surname: person.surname, living: person.living })
    .from(person).innerJoin(tree, eq(tree.id, person.treeId)).where(eq(person.claimedByUserId, userId));
  const mine = claimed.map((c) => c.personId);
  const [mem] = await db.select({ n: sql<number>`count(*)::int`, faith: sql<number>`count(*) filter (where ${memory.chapter} = 'credinta')::int` })
    .from(memory).where(hisMemories(userId, mine));
  const [rep] = await db.select({ n: sql<number>`count(*)::int` }).from(memoryReply).where(eq(memoryReply.authorId, userId));
  const [msg] = await db.select({ n: sql<number>`count(*)::int` }).from(message).where(or(eq(message.fromUserId, userId), eq(message.toUserId, userId)));
  return {
    owned,
    member: memberships.filter((m) => !ownedIds.includes(m.id)).map((m) => ({ id: m.id, name: m.name, role: m.role })),
    claimed: claimed.map((c) => ({ treeId: c.treeId, treeName: c.treeName, personId: c.personId, name: `${c.given} ${c.surname}`.trim(), living: c.living })),
    memories: Number(mem?.n ?? 0), faith: Number(mem?.faith ?? 0), replies: Number(rep?.n ?? 0), messages: Number(msg?.n ?? 0),
  };
}

/**
 * Șterge contul, cum scrie mai sus, într-o singură tranzacție. Întoarce cheile fișierelor rămase fără rând în baza de date
 * (de șters apoi din stocare) și câți arbori s-au șters cu totul.
 */
export async function deleteAccount(db: Db, userId: string, opts: { scrub: boolean }) {
  const [u] = await db.select({ email: user.email }).from(user).where(eq(user.id, userId));
  if (!u) return { fileKeys: [] as string[], deletedTrees: 0 };
  const plan = await deletionPlan(db, userId);
  const doomed = plan.owned.filter((t) => !t.heir).map((t) => t.id);
  return db.transaction(async (tx) => {
    const fileKeys: string[] = [];
    // Arborii în care e singur: întâi fișierele, apoi arborele (fișele, relațiile, documentele și amintirile pleacă odată cu el).
    if (doomed.length) {
      fileKeys.push(...(await tx.select({ k: document.fileKey }).from(document).where(inArray(document.treeId, doomed))).map((r) => r.k).filter((k): k is string => !!k));
      await tx.delete(tree).where(inArray(tree.id, doomed));
    }
    // Arborii cu alți membri trec la moștenitor (dacă nu e deja proprietar și altcineva).
    for (const t of plan.owned) {
      if (!t.heir) continue;
      await tx.update(treeMember).set({ role: "owner" }).where(and(eq(treeMember.treeId, t.id), eq(treeMember.userId, t.heir.userId)));
      await tx.update(tree).set({ ownerId: t.heir.userId }).where(and(eq(tree.id, t.id), or(eq(tree.ownerId, userId), isNull(tree.ownerId))));
    }
    const mine = await claimedIds(tx, userId);
    const gone = (await tx.select({ id: memory.id }).from(memory).where(hisMemories(userId, mine))).map((r) => r.id);
    fileKeys.push(...(await dropMemories(tx, gone)));
    await tx.delete(memoryReply).where(eq(memoryReply.authorId, userId));
    // Întrebările lui fără răspuns pleacă; cele la care s-a răspuns rămân lângă răspuns, fără numele lui.
    await tx.delete(memoryQuestion).where(and(eq(memoryQuestion.askedBy, userId), isNull(memoryQuestion.memoryId)));
    // Coloanele care țin minte cine a invitat pe cine nu se golesc singure.
    await tx.update(invitation).set({ createdBy: null }).where(eq(invitation.createdBy, userId));
    await tx.update(invitation).set({ acceptedBy: null }).where(eq(invitation.acceptedBy, userId));
    await tx.update(treeMember).set({ invitedBy: null }).where(eq(treeMember.invitedBy, userId));
    if (opts.scrub && mine.length) {
      await tx.update(person).set({
        birthDateText: null, birthFrom: null, birthTo: null, birthPlace: null, birthCountry: null, residencePlace: null, residenceCountry: null,
        occupation: null, biography: null, notes: null, photoDocumentId: null, updatedAt: new Date(),
      }).where(and(inArray(person.id, mine), eq(person.living, true)));
    }
    await tx.delete(verification).where(eq(verification.identifier, u.email));
    // Contul: odată cu el pleacă sesiunile, intrările (parola, Google), apartenența la arbori, mesajele, acordurile și cererile.
    await tx.delete(user).where(eq(user.id, userId));
    return { fileKeys, deletedTrees: doomed.length };
  });
}

/** Retrage acordul pentru capitolul „Credința”: răspunsurile lui din acest capitol se șterg, cu glasul și pozele lor. */
export async function withdrawFaith(db: Db, userId: string, now = new Date()) {
  return db.transaction(async (tx) => {
    const mine = await claimedIds(tx, userId);
    const ids = (await tx.select({ id: memory.id }).from(memory).where(and(eq(memory.chapter, "credinta"), hisMemories(userId, mine)))).map((r) => r.id);
    const fileKeys = await dropMemories(tx, ids);
    await recordConsent(tx, userId, "faith", false, now);
    return { removed: ids.length, fileKeys };
  });
}

const iso = (d: Date | null | undefined) => (d ? d.toISOString() : null);
const VIS: Record<string, string> = { private: "doar eu (ciornă)", asker: "doar cel care a întrebat", close: "familia apropiată", tree: "tot arborele" };
const ROLE: Record<Role, string> = { owner: "proprietar", editor: "editor", contributor: "contributor", viewer: "vizitator" };

/**
 * Tot ce ține de cont, pentru „Descarcă datele mele”: un fișier JSON cu nume românești, ușor de citit și de dus în altă parte.
 * Pozele și înregistrările apar ca legături spre site (se deschid după intrarea în cont); arborii întregi se descarcă ca GEDCOM.
 */
export async function exportMyData(db: Db, userId: string, origin: string) {
  const [u] = await db.select().from(user).where(eq(user.id, userId));
  if (!u) return null;
  const file = (id: string | null) => (id ? `${origin}/api/document/${id}` : null);
  const logins = await db.select({ provider: account.providerId, createdAt: account.createdAt }).from(account).where(eq(account.userId, userId));
  const sessions = await db.select({ createdAt: session.createdAt, expiresAt: session.expiresAt, ip: session.ipAddress, browser: session.userAgent })
    .from(session).where(eq(session.userId, userId)).orderBy(asc(session.createdAt));
  const consents = await db.select().from(consent).where(eq(consent.userId, userId)).orderBy(asc(consent.createdAt));
  const [plan] = await db.select().from(accountPlan).where(eq(accountPlan.userId, userId));
  const usage = await db.select().from(usageDay).where(eq(usageDay.userId, userId)).orderBy(asc(usageDay.day), asc(usageDay.section));
  const trees = await db.select({ id: tree.id, name: tree.name, region: tree.region, role: treeMember.role, joinedAt: treeMember.joinedAt })
    .from(treeMember).innerJoin(tree, eq(tree.id, treeMember.treeId)).where(eq(treeMember.userId, userId)).orderBy(asc(treeMember.joinedAt));
  const claimed = await db.select().from(person).where(eq(person.claimedByUserId, userId));
  const mine = claimed.map((p) => p.id);
  const mems = await db.select().from(memory).where(or(inLada(mine), eq(memory.authorId, userId))).orderBy(asc(memory.createdAt));
  const replies = await db.select({ body: memoryReply.body, createdAt: memoryReply.createdAt, memoryId: memoryReply.memoryId, treeId: memory.treeId, personId: memory.personId })
    .from(memoryReply).innerJoin(memory, eq(memory.id, memoryReply.memoryId)).where(eq(memoryReply.authorId, userId)).orderBy(asc(memoryReply.createdAt));
  const asked = await db.select().from(memoryQuestion).where(eq(memoryQuestion.askedBy, userId)).orderBy(asc(memoryQuestion.createdAt));
  const msgs = await db.select().from(message).where(or(eq(message.fromUserId, userId), eq(message.toUserId, userId))).orderBy(asc(message.createdAt));
  const joins = await db.select().from(joinRequest).where(eq(joinRequest.userId, userId)).orderBy(asc(joinRequest.createdAt));
  const contacts = await db.select().from(placeContact).where(or(eq(placeContact.fromUserId, userId), eq(placeContact.toUserId, userId))).orderBy(asc(placeContact.createdAt));
  const docs = await db.select({ id: document.id, treeId: document.treeId, kind: document.kind, title: document.title, dateText: document.dateText, description: document.description,
    place: document.place, mimeType: document.mimeType, createdAt: document.createdAt }).from(document).where(eq(document.uploadedBy, userId)).orderBy(asc(document.createdAt));

  // Numele arborilor, ale oamenilor din lăzi și ale celor cu care a vorbit.
  const treeIds = [...new Set([...trees.map((t) => t.id), ...mems.map((m) => m.treeId), ...replies.map((r) => r.treeId), ...msgs.map((m) => m.treeId), ...docs.map((d) => d.treeId),
    ...joins.map((j) => j.treeId), ...contacts.flatMap((c) => [c.fromTreeId, c.toTreeId])])];
  const treeNames = new Map(treeIds.length ? (await db.select({ id: tree.id, name: tree.name }).from(tree).where(inArray(tree.id, treeIds))).map((t) => [t.id, t.name]) : []);
  const personIds = [...new Set([...mems.map((m) => m.personId), ...replies.map((r) => r.personId), ...asked.map((q) => q.personId), ...joins.map((j) => j.personId)])];
  const people = new Map(personIds.length
    ? (await db.select({ id: person.id, given: person.givenName, surname: person.surname }).from(person).where(inArray(person.id, personIds))).map((p) => [p.id, `${p.given} ${p.surname}`.trim()])
    : []);
  const userIds = [...new Set([...msgs.flatMap((m) => [m.fromUserId, m.toUserId]), ...contacts.flatMap((c) => [c.fromUserId, c.toUserId])].filter((x) => x !== userId))];
  const names = new Map(userIds.length ? (await db.select({ id: user.id, name: user.name }).from(user).where(inArray(user.id, userIds))).map((x) => [x.id, x.name]) : []);
  const who = (id: string) => (id === userId ? "eu" : names.get(id) ?? "cont șters");
  const treeOf = (id: string) => treeNames.get(id) ?? null;

  return {
    despre: {
      ce: "Datele tale din Cartea Neamului, descărcate din „Datele mele”.",
      descarcat: new Date().toISOString(),
      fisiere: "Legăturile spre poze și înregistrări se deschid după ce intri în cont. Arborii întregi îi descarci ca GEDCOM, de la legătura fiecăruia.",
    },
    cont: { nume: u.name, email: u.email, emailVerificat: u.emailVerified, poza: u.image, creat: iso(u.createdAt), intrari: logins.map((l) => ({ fel: l.provider, din: iso(l.createdAt) })) },
    sesiuni: sessions.map((s) => ({ inceput: iso(s.createdAt), expira: iso(s.expiresAt), ip: s.ip, browser: s.browser })),
    acorduri: consents.map((c) => ({ pentru: CONSENT_LABEL[c.purpose as ConsentPurpose] ?? c.purpose,
      versiune: c.textVersion, dat: c.granted, cand: iso(c.createdAt) })),
    // Planul ales din panoul de admin și nota de acolo, dacă există (un drept al omului, ca orice altă dată despre el).
    ...(plan ? { notaNoastra: { plan: PLANS[plan.plan as Plan]?.label ?? plan.plan, nota: plan.note, schimbata: iso(plan.updatedAt) } } : {}),
    // Cât a folosit site-ul, pe zile, dacă a spus „Bine” la măsurare (doar timpul și partea din site).
    folosire: usage.map((x) => ({ zi: x.day, parte: sectionLabel(x.section), secunde: x.seconds, deschideri: x.views, peTelefon: x.phoneSeconds, inAplicatie: x.appSeconds })),
    arbori: trees.map((t) => ({ nume: t.name, regiune: t.region, rol: ROLE[t.role], intrat: iso(t.joinedAt), gedcom: `${origin}/api/arbore/${t.id}/gedcom?living=1` })),
    fisaMea: claimed.map((p) => ({
      arbore: treeOf(p.treeId), prenume: p.givenName, nume: p.surname, numeLaNastere: p.birthSurname, sex: p.sex, inViata: p.living,
      nascut: p.birthDateText, loculNasterii: [p.birthPlace, p.birthCountry].filter(Boolean).join(", ") || null,
      locuieste: [p.residencePlace, p.residenceCountry].filter(Boolean).join(", ") || null, ocupatie: p.occupation, biografie: p.biography, note: p.notes,
      pozaDeProfil: file(p.photoDocumentId), schimbata: iso(p.updatedAt),
    })),
    amintiri: mems.map((m) => ({
      arbore: treeOf(m.treeId), inLada: people.get(m.personId) ?? null, capitol: chapterLabel(m.chapter), intrebare: m.question, titlu: m.title, text: m.body,
      cand: m.whenText, unde: m.place, cineOVede: VIS[m.visibility] ?? m.visibility, panaLaGradul: m.maxDegree, inCarte: m.inBook,
      glas: file(m.audioDocumentId), secunde: m.audioSeconds, poza: file(m.photoDocumentId),
      inregistrata: m.helper ? (m.authorId === userId ? "de mine, pentru altcineva, în modul „la bunici”" : "de o rudă, în modul „la bunici”, cu acordul meu") : null,
      scrisa: iso(m.createdAt), schimbata: iso(m.updatedAt),
    })),
    siEuImiAmintesc: replies.map((r) => ({ arbore: treeOf(r.treeId), subAmintireaDin: people.get(r.personId) ?? null, text: r.body, cand: iso(r.createdAt) })),
    intrebariPuse: asked.map((q) => ({ arbore: treeOf(q.treeId), pentru: people.get(q.personId) ?? null, text: q.text, raspuns: !!q.memoryId, cand: iso(q.createdAt) })),
    mesaje: msgs.map((m) => ({ arbore: treeOf(m.treeId), de: who(m.fromUserId), catre: who(m.toUserId), text: m.body, trimis: iso(m.createdAt), citit: iso(m.readAt) })),
    cereriDeIntrare: joins.map((j) => ({ arbore: treeOf(j.treeId), fisa: people.get(j.personId) ?? null, nota: j.note, stare: j.status, cand: iso(j.createdAt) })),
    dinAceleasiLocuri: contacts.map((c) => ({ de: who(c.fromUserId), catre: who(c.toUserId), dinArborele: treeOf(c.fromTreeId), spreArborele: treeOf(c.toTreeId),
      sat: c.place, nota: c.note, stare: c.status, cand: iso(c.createdAt) })),
    documenteIncarcate: docs.map((d) => ({ arbore: treeOf(d.treeId), fel: d.kind, titlu: d.title, data: d.dateText, unde: d.place, descriere: d.description,
      fisier: file(d.id), incarcat: iso(d.createdAt) })),
  };
}
