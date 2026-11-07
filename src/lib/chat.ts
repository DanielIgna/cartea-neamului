import { and, desc, eq, inArray, isNull, or, sql } from "drizzle-orm";
import type { Db } from "@/db";
import { message, person, placeContact, relationship, tree, treeMember, user } from "@/db/schema";
import { buildGraph, kinship, type Kinship } from "./kinship";

/**
 * Cine cu cine își poate scrie într-un arbore: amândoi sunt membri, amândoi și-au revendicat fișa,
 * iar rudenia dintre ei e cel mult gradul ales de proprietar (soții își pot scrie oricând).
 */
export type Contact = {
  userId: string; name: string; personId: string; personName: string; photoId: string | null; kin: Kinship | null; allowed: boolean;
  via?: { place: string; treeName: string }; // „Din aceleași locuri”: din alt neam, cu strămoși în același sat
};

export async function chatContacts(db: Db, treeId: string, meId: string): Promise<{ limit: number; mePersonId: string | null; contacts: Contact[] }> {
  const [t] = await db.select({ limit: tree.chatMaxDegree }).from(tree).where(eq(tree.id, treeId));
  if (!t) return { limit: 0, mePersonId: null, contacts: [] };
  const members = await db.select({ userId: treeMember.userId, name: user.name }).from(treeMember).innerJoin(user, eq(user.id, treeMember.userId)).where(eq(treeMember.treeId, treeId));
  const people = await db.select({ id: person.id, sex: person.sex, given: person.givenName, surname: person.surname, claimedBy: person.claimedByUserId, photoId: person.photoDocumentId })
    .from(person).where(eq(person.treeId, treeId));
  const rels = await db.select({ type: relationship.type, a: relationship.personA, b: relationship.personB }).from(relationship).where(eq(relationship.treeId, treeId));
  const g = buildGraph(people, rels);
  const claimed = new Map(people.filter((p) => p.claimedBy).map((p) => [p.claimedBy!, p]));
  const mine = claimed.get(meId);
  const contacts: Contact[] = [];
  for (const m of members) {
    if (m.userId === meId) continue;
    const theirs = claimed.get(m.userId);
    if (!theirs) continue;
    const kin = mine ? kinship(g, mine.id, theirs.id) : null;
    const spouse = !!mine && (g.partners.get(mine.id) ?? []).includes(theirs.id);
    const allowed = !!kin && (spouse || (kin.degree !== null && kin.degree <= t.limit));
    contacts.push({ userId: m.userId, name: m.name, personId: theirs.id, personName: `${theirs.given} ${theirs.surname}`.trim(), photoId: theirs.photoId, kin, allowed });
  }
  contacts.sort((a, b) => (a.kin?.degree ?? 99) - (b.kin?.degree ?? 99));
  return { limit: t.limit, mePersonId: mine?.id ?? null, contacts };
}

export async function canMessage(db: Db, treeId: string, fromId: string, toId: string) {
  const kin = await canMessageKin(db, treeId, fromId, toId);
  if (kin.ok) return kin;
  return (await placeLink(db, treeId, fromId, toId)) ?? kin;
}

/**
 * Doi oameni din neamuri diferite, cu strămoși în același sat: își pot scrie după ce proprietarul a acceptat cererea de legătură.
 * Mesajele lor stau în arborele celui care a acceptat.
 */
async function placeLink(db: Db, treeId: string, a: string, b: string) {
  const [c] = await db.select().from(placeContact).where(and(eq(placeContact.toTreeId, treeId),
    or(and(eq(placeContact.fromUserId, a), eq(placeContact.toUserId, b)), and(eq(placeContact.fromUserId, b), eq(placeContact.toUserId, a)))));
  if (!c) return null;
  if (c.status !== "accepted") {
    return c.status === "pending" ? { ok: false as const, code: "pending" as const, reason: "Cererea de legătură așteaptă încă răspunsul." } : { ok: false as const, code: "ended" as const, reason: "Legătura dintre neamurile voastre s-a încheiat." };
  }
  const [other] = await db.select({ name: user.name }).from(user).where(eq(user.id, b));
  const [t] = await db.select({ name: tree.name }).from(tree).where(eq(tree.id, c.fromUserId === a ? c.toTreeId : c.fromTreeId));
  const contact: Contact = { userId: b, name: other?.name ?? "", personId: "", personName: other?.name ?? "", photoId: null, kin: null, allowed: true,
    via: { place: c.place, treeName: t?.name ?? "" } };
  return { ok: true as const, contact };
}

async function canMessageKin(db: Db, treeId: string, fromId: string, toId: string) {
  const { contacts, mePersonId, limit } = await chatContacts(db, treeId, fromId);
  if (!mePersonId) return { ok: false as const, code: "claimFirst" as const, reason: "Revendică-ți întâi fișa din arbore, ca rudele să știe cine scrie." };
  const c = contacts.find((x) => x.userId === toId);
  if (!c) return { ok: false as const, code: "notInTree" as const, reason: "Persoana nu e în arbore sau nu și-a revendicat încă fișa." };
  if (!c.allowed) return { ok: false as const, code: "beyondLimit" as const, limit, reason: `În acest arbore, mesajele merg doar între rude până la gradul ${limit}.` };
  return { ok: true as const, contact: c };
}

export async function conversation(db: Db, treeId: string, a: string, b: string) {
  return db.select().from(message)
    .where(and(eq(message.treeId, treeId), or(and(eq(message.fromUserId, a), eq(message.toUserId, b)), and(eq(message.fromUserId, b), eq(message.toUserId, a)))))
    .orderBy(message.createdAt).limit(500);
}

export async function markRead(db: Db, treeId: string, meId: string, otherId: string) {
  await db.update(message).set({ readAt: new Date() })
    .where(and(eq(message.treeId, treeId), eq(message.toUserId, meId), eq(message.fromUserId, otherId), isNull(message.readAt)));
}

export async function unreadCount(db: Db, meId: string) {
  const [r] = await db.select({ n: sql<number>`count(*)::int` }).from(message).where(and(eq(message.toUserId, meId), isNull(message.readAt)));
  return Number(r?.n ?? 0);
}

/** Ultimul mesaj și câte necitite are fiecare conversație a mea, pe arbori. */
export async function inbox(db: Db, meId: string, treeIds: string[]) {
  if (!treeIds.length) return [];
  const rows = await db.select().from(message)
    .where(and(inArray(message.treeId, treeIds), or(eq(message.fromUserId, meId), eq(message.toUserId, meId))))
    .orderBy(desc(message.createdAt)).limit(1000);
  const out = new Map<string, { treeId: string; otherId: string; last: typeof rows[number]; unread: number }>();
  for (const r of rows) {
    const otherId = r.fromUserId === meId ? r.toUserId : r.fromUserId;
    const key = `${r.treeId}:${otherId}`;
    const cur = out.get(key) ?? { treeId: r.treeId, otherId, last: r, unread: 0 };
    if (r.toUserId === meId && !r.readAt) cur.unread++;
    out.set(key, cur);
  }
  return [...out.values()];
}
