/**
 * „Păstrarea” (Daniel, 2026-11-13): după anul plătit, cu o sumă mică pe an (25 lei / 5 €, din Admin), familia vede și ascultă
 * tot online, fără adăugări noi. La fiecare plată (deci o dată pe an) trimitem pe email legătura spre arhiva completă
 * (/arhiva: arborii ca GEDCOM, pozele, glasurile și actele). Regulile de acces sunt în src/lib/plans.ts (`fullMedia`).
 */
import { asc, eq, inArray, isNotNull, and, or } from "drizzle-orm";
import type { Db } from "@/db";
import { accountPlan, document, documentLink, memory, tree, treeMember, user } from "@/db/schema";
import { sendMail } from "./extra";
import { SITE_URL } from "./site-url";
import { isLocale } from "@/i18n/locales";
import { getAppName, getT } from "@/i18n/server";

/** Emailul cu arhiva, după plata „Păstrării”. Fără serviciu de email pus, nu trimite nimic (arhiva rămâne la /arhiva). */
export async function sendKeepMail(db: Db, userId: string) {
  const [u] = await db.select({ name: user.name, email: user.email, locale: user.locale, keepUntil: accountPlan.keepUntil })
    .from(user).leftJoin(accountPlan, eq(accountPlan.userId, user.id)).where(eq(user.id, userId));
  if (!u?.keepUntil) return false;
  const locale = isLocale(u.locale) ? u.locale : "ro";
  const [t, app] = await Promise.all([getT("KeepMail", locale), getAppName(locale)]);
  const date = new Intl.DateTimeFormat(locale, { dateStyle: "long", timeZone: "Europe/Bucharest" }).format(u.keepUntil);
  return sendMail(u.email, t("subject", { app }), t("body", { name: u.name, app, date, link: `${SITE_URL}/arhiva` }));
}

export type ArchiveTree = {
  id: string; name: string; owner: boolean;
  files: { id: string; kind: string; title: string; mine: boolean; createdAt: Date }[];
};

/**
 * Arhiva unui om: arborii în care e, cei ai lui primii, cu fișierele pe care le vede oricine din arbore (cele puse la o persoană)
 * și cu tot ce a încărcat el. Pozele și glasurile din amintiri și de la casa bătrânească au regulile lor de vedere: acelea se
 * deschid din Lada cu amintiri, nu se înșiră aici.
 */
export async function archiveOf(db: Db, userId: string): Promise<ArchiveTree[]> {
  const trees = await db.select({ id: tree.id, name: tree.name, ownerId: tree.ownerId }).from(treeMember)
    .innerJoin(tree, eq(tree.id, treeMember.treeId)).where(eq(treeMember.userId, userId)).orderBy(asc(tree.name));
  if (!trees.length) return [];
  const docs = await db.select({ id: document.id, treeId: document.treeId, kind: document.kind, title: document.title, uploadedBy: document.uploadedBy, createdAt: document.createdAt })
    .from(document).where(and(inArray(document.treeId, trees.map((t) => t.id)), isNotNull(document.fileKey))).orderBy(asc(document.createdAt));
  const linked = new Set((docs.length ? await db.selectDistinct({ id: documentLink.documentId }).from(documentLink)
    .where(inArray(documentLink.documentId, docs.map((d) => d.id))) : []).map((l) => l.id));
  const ids = docs.map((d) => d.id);
  const inMemories = new Set((ids.length ? await db.select({ p: memory.photoDocumentId, a: memory.audioDocumentId, c: memory.consentDocumentId }).from(memory)
    .where(or(inArray(memory.photoDocumentId, ids), inArray(memory.audioDocumentId, ids), inArray(memory.consentDocumentId, ids))) : [])
    .flatMap((m) => [m.p, m.a, m.c]).filter(Boolean));
  const open = docs.filter((d) => d.uploadedBy === userId || (linked.has(d.id) && !inMemories.has(d.id)));
  return trees
    .map((t) => ({
      id: t.id, name: t.name, owner: t.ownerId === userId,
      files: open.filter((d) => d.treeId === t.id).map((d) => ({ id: d.id, kind: d.kind, title: d.title, mine: d.uploadedBy === userId, createdAt: d.createdAt })),
    }))
    .sort((a, b) => Number(b.owner) - Number(a.owner));
}
