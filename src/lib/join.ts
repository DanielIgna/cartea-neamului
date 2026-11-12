import { and, count, desc, eq, gte, inArray, isNull, lte, ne, or } from "drizzle-orm";
import type { Db } from "@/db";
import { joinAttempt, joinRequest, person, tree, treeMember, user } from "@/db/schema";
import { exactDay } from "./dates";
import { DEMO_EMAIL, isDemo } from "./demo";

/**
 * „Ești deja într-un arbore?”: cine își face cont scrie numele și data nașterii. Dacă o rudă l-a trecut deja într-un arbore,
 * cu data completă, proprietarul acelui arbore primește o cerere. După ce confirmă că e chiar el, omul intră în arbore
 * cu fișa lui revendicată (arborele pornește de la el) și își poate continua ramura.
 *
 * Până la confirmare, cel care caută nu află ce arbore e. Și ca data nașterii cuiva să nu poată fi ghicită încercând
 * zi după zi, căutările sunt puține pe zi, pentru fiecare cont și pentru fiecare nume.
 */

/** De ce nu merge cererea; textul, în limba omului, e în Errors.join (src/i18n/messages/ro.ts). */
export type JoinError = "demo" | "birth" | "names" | "tooMany" | "notPending" | "claimed";
const PER_USER = 10; // căutări pe zi, pentru un cont
const PER_NAME = 30; // căutări fără rezultat pe zi, pentru același nume de familie (din toate conturile)
const DAY = 864e5;

/** „Ioan-Daniel ” → ["ioan", "daniel"]: litere mici, fără diacritice, cuvânt cu cuvânt. */
export const words = (s: string | null | undefined) =>
  (s ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z\s-]/g, " ").split(/[\s-]+/).filter(Boolean);
const within = (a: string[], b: string[]) => a.length > 0 && a.every((w) => b.includes(w));

/**
 * Același om: prenumele se potrivesc (unul cuprinde toate cuvintele celuilalt: „Daniel” și „Ioan Daniel”), iar numele de familie
 * scris e cel de acum sau cel de la naștere (pentru femeile căsătorite).
 */
export function sameName(typed: { given: string; surname: string }, p: { givenName: string; surname: string; birthSurname: string | null }) {
  const g = words(typed.given), r = words(p.givenName);
  if (!(within(g, r) || within(r, g))) return false;
  const s = words(typed.surname);
  return within(s, words(p.surname)) || within(s, words(p.birthSurname));
}

export type JoinInput = { given: string; surname: string; birth: string; note: string | null };
export type JoinResult = { error?: JoinError; found?: number; declined?: boolean };

/** Caută fișa și trimite cererea proprietarului fiecărui arbore în care apare. */
export async function askToJoin(db: Db, me: { id: string; email: string }, input: JoinInput, now = new Date()): Promise<JoinResult> {
  if (isDemo(me.email)) return { error: "demo" };
  const day = /^\d{4}-\d{2}-\d{2}$/.test(input.birth) ? exactDay(input.birth) : null;
  if (!day || day > now.toISOString().slice(0, 10) || day < "1900-01-01") return { error: "birth" };
  if (!words(input.given).length || !words(input.surname).length) return { error: "names" };
  const nameKey = words(input.surname).join(" ");
  const since = new Date(now.getTime() - DAY);
  const [mine] = await db.select({ n: count() }).from(joinAttempt).where(and(eq(joinAttempt.userId, me.id), gte(joinAttempt.createdAt, since)));
  const [named] = await db.select({ n: count() }).from(joinAttempt)
    .where(and(eq(joinAttempt.nameKey, nameKey), eq(joinAttempt.found, false), gte(joinAttempt.createdAt, since)));
  if (mine.n >= PER_USER || named.n >= PER_NAME) return { error: "tooMany" };

  // Fișele celor în viață, nerevendicate, cu data completă a nașterii (doar anul nu ajunge ca să recunoaștem pe cineva).
  const claimedTrees = (await db.select({ id: person.treeId }).from(person).where(eq(person.claimedByUserId, me.id))).map((r) => r.id);
  const rows = await db.select({ p: person, ownerId: tree.ownerId }).from(person)
    .innerJoin(tree, eq(tree.id, person.treeId)).innerJoin(user, eq(user.id, tree.ownerId))
    .where(and(eq(person.living, true), isNull(person.claimedByUserId), lte(person.birthFrom, day), gte(person.birthTo, day), ne(user.email, DEMO_EMAIL)));
  const found = rows.filter(({ p }) => exactDay(p.birthDateText) === day && sameName(input, p) && !claimedTrees.includes(p.treeId));
  await db.insert(joinAttempt).values({ userId: me.id, nameKey, found: found.length > 0, createdAt: now });
  if (!found.length) return { found: 0 };

  const note = input.note?.trim().slice(0, 500) || null;
  await db.insert(joinRequest).values(found.map(({ p }) => ({ userId: me.id, treeId: p.treeId, personId: p.id, note, createdAt: now })))
    .onConflictDoNothing();
  const mineNow = await db.select({ treeId: joinRequest.treeId, status: joinRequest.status }).from(joinRequest)
    .where(and(eq(joinRequest.userId, me.id), inArray(joinRequest.personId, found.map(({ p }) => p.id))));
  const open = new Set(mineNow.filter((r) => r.status !== "declined").map((r) => r.treeId));
  return { found: open.size, declined: open.size === 0 };
}

/** Cererile mele: cele în așteptare nu spun ce arbore e; după „Acceptă”, arborele are nume. */
export async function myJoinRequests(db: Db, meId: string) {
  const rows = await db.select({ r: joinRequest, treeName: tree.name }).from(joinRequest).innerJoin(tree, eq(tree.id, joinRequest.treeId))
    .where(eq(joinRequest.userId, meId)).orderBy(desc(joinRequest.createdAt)).limit(50);
  return rows.map(({ r, treeName }) => ({ id: r.id, status: r.status as "pending" | "accepted" | "declined", at: r.createdAt,
    treeId: r.status === "accepted" ? r.treeId : null, treeName: r.status === "accepted" ? treeName : null }));
}

/** Cererile care așteaptă răspunsul meu, ca proprietar: cine cere, ce fișă spune că e a lui și ce a scris. */
export async function joinRequestsFor(db: Db, ownerId: string) {
  const rows = await db.select({ r: joinRequest, treeName: tree.name, name: user.name, email: user.email,
    given: person.givenName, surname: person.surname, sex: person.sex, born: person.birthDateText })
    .from(joinRequest).innerJoin(tree, eq(tree.id, joinRequest.treeId)).innerJoin(user, eq(user.id, joinRequest.userId))
    .innerJoin(person, eq(person.id, joinRequest.personId))
    .where(and(eq(tree.ownerId, ownerId), eq(joinRequest.status, "pending"))).orderBy(desc(joinRequest.createdAt)).limit(100);
  return rows.map(({ r, ...x }) => ({ id: r.id, treeId: r.treeId, personId: r.personId, note: r.note, at: r.createdAt,
    treeName: x.treeName, name: x.name, email: x.email, personName: `${x.given} ${x.surname}`.trim(), sex: x.sex, born: x.born }));
}

export async function pendingJoins(db: Db, ownerId: string) {
  const [r] = await db.select({ n: count() }).from(joinRequest).innerJoin(tree, eq(tree.id, joinRequest.treeId))
    .where(and(eq(tree.ownerId, ownerId), eq(joinRequest.status, "pending")));
  return Number(r?.n ?? 0);
}

/**
 * Proprietarul răspunde. „Acceptă”: omul devine membru al arborelui (poate adăuga rude) și fișa devine a lui;
 * celelalte cereri pentru aceeași fișă sunt refuzate. Un proprietar în zilele gratuite primește rudele doar să vadă (`role`).
 */
export async function answerJoin(db: Db, ownerId: string, id: string, accept: boolean, now = new Date(),
  role: "contributor" | "viewer" = "contributor"): Promise<{ ok?: true; error?: JoinError }> {
  const [row] = await db.select({ r: joinRequest, ownerId: tree.ownerId }).from(joinRequest).innerJoin(tree, eq(tree.id, joinRequest.treeId))
    .where(eq(joinRequest.id, id));
  if (!row || row.ownerId !== ownerId || row.r.status !== "pending") return { error: "notPending" };
  const r = row.r;
  if (!accept) {
    await db.update(joinRequest).set({ status: "declined", answeredAt: now }).where(eq(joinRequest.id, id));
    return { ok: true as const };
  }
  return db.transaction(async (tx) => {
    const claimed = await tx.update(person).set({ claimedByUserId: r.userId, privacy: "claimed", updatedAt: now })
      .where(and(eq(person.id, r.personId), eq(person.treeId, r.treeId), isNull(person.claimedByUserId))).returning({ id: person.id });
    if (!claimed.length) return { error: "claimed" as const };
    await tx.insert(treeMember).values({ treeId: r.treeId, userId: r.userId, role, invitedBy: ownerId }).onConflictDoNothing();
    await tx.update(joinRequest).set({ status: "accepted", answeredAt: now }).where(eq(joinRequest.id, id));
    await tx.update(joinRequest).set({ status: "declined", answeredAt: now })
      .where(and(eq(joinRequest.status, "pending"), or(eq(joinRequest.personId, r.personId), and(eq(joinRequest.userId, r.userId), eq(joinRequest.treeId, r.treeId)))));
    return { ok: true as const };
  });
}
