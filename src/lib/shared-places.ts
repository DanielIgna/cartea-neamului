import { and, count, desc, eq, gte, inArray, ne, notInArray, or } from "drizzle-orm";
import type { Db } from "@/db";
import { placeContact, tree, treeMember, treePlace, user } from "@/db/schema";
import type { SharedPlace } from "./map-data";
import { DEMO_EMAIL, isDemo } from "./demo";

/**
 * „Din aceleași locuri”: neamuri din alți arbori, cu strămoși în aceleași sate.
 *
 * Fiecare proprietar alege dacă neamul lui poate fi găsit. Celelalte familii văd atunci doar satele, câte persoane
 * decedate sunt acolo, anii și numele lor de familie, plus numele arborelui și prenumele proprietarului cu inițiala.
 * Cei în viață nu apar niciodată. Și vezi alte neamuri doar dacă îl arăți și tu pe al tău.
 */

export const DEMO_NO = "Contul de probă e folosit de mai mulți oameni, așa că nu poate arăta neamul altor familii și nici nu poate cere legături. Fă-ți un cont al tău.";
const DAILY_REQUESTS = 10;

const sig = (r: SharedPlace) => [r.placeId, r.area ?? "", r.name, r.detail ?? "", r.people, r.fromYear ?? "", r.toYear ?? "", r.surnames].join("\t");

/** Rescrie satele arborelui pe care le văd celelalte neamuri, doar dacă s-au schimbat. */
export async function storeSharedPlaces(db: Db, treeId: string, shared: SharedPlace[]): Promise<boolean> {
  const old = await db.select().from(treePlace).where(eq(treePlace.treeId, treeId));
  if (old.map(sig).sort().join("\n") === shared.map(sig).sort().join("\n")) return false;
  await db.transaction(async (tx) => {
    await tx.delete(treePlace).where(eq(treePlace.treeId, treeId));
    if (shared.length) await tx.insert(treePlace).values(shared.map((s) => ({ ...s, treeId })));
  });
  return true;
}

/** După o schimbare în fișe: recalculăm satele doar pentru arborii care pot fi găsiți (ceilalți nu păstrează nimic). */
export async function refreshTreePlaces(db: Db, treeId: string) {
  const [t] = await db.select({ on: tree.discoverable }).from(tree).where(eq(tree.id, treeId));
  if (!t?.on) return false;
  // Gazetarul (toate satele țării) se încarcă doar aici, nu în fiecare pagină care arată numărul de pe „Mesaje”.
  const { loadTreeMap } = await import("./map-data");
  return storeSharedPlaces(db, treeId, (await loadTreeMap(db, treeId)).shared);
}

/** Proprietarul pornește sau oprește „Din aceleași locuri”. Oprit, satele arborelui sunt șterse de tot din listă. */
export async function setTreeDiscoverable(db: Db, treeId: string, on: boolean) {
  await db.update(tree).set({ discoverable: on }).where(eq(tree.id, treeId));
  if (on) await refreshTreePlaces(db, treeId);
  else await db.delete(treePlace).where(eq(treePlace.treeId, treeId));
}

/** „Maria Pop” → „Maria P.”: celelalte familii văd doar prenumele și inițiala, până acceptă legătura. */
export function shortName(name: string | null | undefined): string {
  const w = (name ?? "").replace(/\(.*?\)/g, " ").trim().split(/\s+/).filter(Boolean);
  if (!w.length) return "proprietarul";
  return w.length > 1 ? `${w[0]} ${w[w.length - 1][0].toUpperCase()}.` : w[0];
}

export type Common = {
  placeId: string; area: string | null; name: string; detail: string | null; people: number; years: string; surnames: string;
  same: boolean; // același sat; altfel e alt sat din aceeași comună cu satele din `mine`
  mine: string[];
};
export type ContactState = { status: "pending" | "accepted" | "declined"; outgoing: boolean; href: string | null };
export type Match = { treeId: string; treeName: string; owner: string; places: Common[]; contact: ContactState | null };

const years = (p: { fromYear: number | null; toYear: number | null }) =>
  p.fromYear && p.toYear ? (p.fromYear === p.toYear ? `${p.fromYear}` : `${p.fromYear}–${p.toYear}`) : `${p.fromYear ?? p.toYear ?? ""}`;
/** Un sat mic în comun spune mai mult decât un oraș mare sau o capitală din străinătate. */
const weight = (p: { placeId: string; detail: string | null }) =>
  !p.placeId.startsWith("RO:") || p.detail === "capitala" || p.detail?.startsWith("municipiu") ? 0.3 : p.detail?.startsWith("oraș") ? 0.6 : 1;

async function memberOf(db: Db, userId: string) {
  return (await db.select({ id: treeMember.treeId }).from(treeMember).where(eq(treeMember.userId, userId))).map((r) => r.id);
}

/**
 * Neamurile din alți arbori cu strămoși în aceleași sate (sau în alt sat al aceleiași comune), cele mai apropiate întâi.
 * Doar dacă arborele meu poate fi găsit; nu apar arborii din care fac deja parte.
 */
export async function placeMatches(db: Db, treeId: string, meId: string, limit = 30): Promise<Match[]> {
  const [t] = await db.select({ on: tree.discoverable }).from(tree).where(eq(tree.id, treeId));
  if (!t?.on) return [];
  const mine = await db.select().from(treePlace).where(eq(treePlace.treeId, treeId));
  if (!mine.length) return [];
  const ids = mine.map((r) => r.placeId);
  const areas = [...new Set(mine.map((r) => r.area).filter((a): a is string => !!a))];
  const skip = [...new Set([treeId, ...(await memberOf(db, meId))])];
  const near = areas.length ? or(inArray(treePlace.placeId, ids), inArray(treePlace.area, areas)) : inArray(treePlace.placeId, ids);
  const rows = await db.select({ p: treePlace, treeName: tree.name, ownerId: tree.ownerId, owner: user.name })
    .from(treePlace).innerJoin(tree, eq(tree.id, treePlace.treeId)).innerJoin(user, eq(user.id, tree.ownerId))
    .where(and(eq(tree.discoverable, true), near, notInArray(treePlace.treeId, skip), ne(user.id, meId), ne(user.email, DEMO_EMAIL)));

  const myIds = new Set(ids);
  const myAreas = new Map<string, string[]>();
  for (const r of mine) if (r.area) myAreas.set(r.area, [...(myAreas.get(r.area) ?? []), r.name]);
  const by = new Map<string, Match & { ownerId: string; score: number }>();
  for (const { p, treeName, ownerId, owner } of rows) {
    const same = myIds.has(p.placeId);
    const m = by.get(p.treeId) ?? { treeId: p.treeId, treeName, owner: shortName(owner), ownerId: ownerId!, places: [], contact: null, score: 0 };
    m.places.push({ placeId: p.placeId, area: p.area, name: p.name, detail: p.detail, people: p.people, years: years(p), surnames: p.surnames,
      same, mine: same ? [] : myAreas.get(p.area ?? "") ?? [] });
    m.score += (same ? 10 : 3) * weight(p) * (1 + Math.log2(p.people));
    by.set(p.treeId, m);
  }
  const list = [...by.values()].sort((a, b) => b.score - a.score).slice(0, limit);
  for (const m of list) m.places.sort((a, b) => Number(b.same) - Number(a.same) || b.people - a.people);

  const others = list.map((m) => m.treeId);
  const contacts = others.length ? await db.select().from(placeContact).where(or(
    and(eq(placeContact.fromUserId, meId), inArray(placeContact.toTreeId, others)),
    and(eq(placeContact.toUserId, meId), inArray(placeContact.fromTreeId, others)),
  )) : [];
  return list.map(({ ownerId, score: _, ...m }) => {
    const out = contacts.find((c) => c.fromUserId === meId && c.toTreeId === m.treeId);
    const inc = contacts.find((c) => c.toUserId === meId && c.fromTreeId === m.treeId);
    const status = (s: string) => s as ContactState["status"];
    const contact: ContactState | null = out
      ? { status: status(out.status), outgoing: true, href: out.status === "accepted" ? `/mesaje/${m.treeId}/${ownerId}` : null }
      : inc ? { status: status(inc.status), outgoing: false, href: inc.status === "accepted" ? `/mesaje/${inc.toTreeId}/${inc.fromUserId}` : "/mesaje" } : null;
    return { ...m, contact };
  });
}

/**
 * „Cere legătura”: cineva dintr-un neam care poate fi găsit scrie proprietarului altui neam, cu care are un sat (sau o comună) în comun.
 * O singură cerere de la fiecare om către fiecare arbore; dacă proprietarul o refuză, nu se mai poate trimite alta.
 */
export async function askContact(db: Db, me: { id: string; email: string }, input: { fromTreeId: string; toTreeId: string; placeId: string; note: string | null }) {
  const { fromTreeId, toTreeId, placeId } = input;
  if (isDemo(me.email)) return { error: DEMO_NO, code: "demo" as const };
  if (fromTreeId === toTreeId) return { error: "Alege alt neam decât al tău.", code: "sameTree" as const };
  const mineTrees = await memberOf(db, me.id);
  if (!mineTrees.includes(fromTreeId)) return { error: "Nu ești în acest arbore.", code: "notMember" as const };
  if (mineTrees.includes(toTreeId)) return { error: "Faceți deja parte din același arbore; vă puteți scrie din Mesaje.", code: "together" as const };
  const [from] = await db.select({ on: tree.discoverable }).from(tree).where(eq(tree.id, fromTreeId));
  if (!from?.on) return { error: "Arată întâi neamul vostru celor din aceleași sate, ca să poți cere legătura.", code: "showFirst" as const };
  const [to] = await db.select({ on: tree.discoverable, ownerId: tree.ownerId, email: user.email }).from(tree).innerJoin(user, eq(user.id, tree.ownerId)).where(eq(tree.id, toTreeId));
  if (!to?.on || !to.ownerId || isDemo(to.email)) return { error: "Acest neam nu mai poate fi găsit.", code: "gone" as const };
  if (to.ownerId === me.id) return { error: "Acesta e tot arborele tău.", code: "ownTree" as const };
  const [theirs] = await db.select().from(treePlace).where(and(eq(treePlace.treeId, toTreeId), eq(treePlace.placeId, placeId)));
  const ours = await db.select({ placeId: treePlace.placeId, area: treePlace.area }).from(treePlace).where(eq(treePlace.treeId, fromTreeId));
  if (!theirs || !ours.some((o) => o.placeId === placeId || (!!theirs.area && o.area === theirs.area))) return { error: "Neamurile voastre nu mai au acest loc în comun.", code: "noCommon" as const };
  const [old] = await db.select().from(placeContact).where(and(eq(placeContact.fromUserId, me.id), eq(placeContact.toTreeId, toTreeId)));
  if (old?.status === "accepted") return { ok: true as const };
  if (old?.status === "pending") return { error: "Ai trimis deja cererea. Așteaptă răspunsul.", code: "alreadyAsked" as const };
  if (old) return { error: "Proprietarul acestui neam nu a acceptat legătura.", code: "declined" as const };
  const [{ n }] = await db.select({ n: count() }).from(placeContact).where(and(eq(placeContact.fromUserId, me.id), gte(placeContact.createdAt, new Date(Date.now() - 864e5))));
  if (n >= DAILY_REQUESTS) return { error: "Ai trimis multe cereri azi. Mai încearcă mâine.", code: "tooMany" as const };
  await db.insert(placeContact).values({ fromUserId: me.id, fromTreeId, toTreeId, toUserId: to.ownerId, place: theirs.name, note: input.note?.trim() || null })
    .onConflictDoNothing();
  return { ok: true as const };
}

/** Proprietarul răspunde: „Acceptă” deschide conversația, „Refuză” (sau „Încheie legătura” mai târziu) o închide. */
export async function answerContact(db: Db, meId: string, id: string, accept: boolean) {
  const r = await db.update(placeContact).set({ status: accept ? "accepted" : "declined", answeredAt: new Date() })
    .where(and(eq(placeContact.id, id), eq(placeContact.toUserId, meId))).returning({ id: placeContact.id });
  return r.length ? { ok: true as const } : { error: "Cererea nu mai există.", code: "noRequest" as const };
}

/** Câte cereri de legătură îmi așteaptă răspunsul (se adună la numărul de pe „Mesaje”). */
export async function pendingContacts(db: Db, meId: string) {
  const [r] = await db.select({ n: count() }).from(placeContact).where(and(eq(placeContact.toUserId, meId), eq(placeContact.status, "pending")));
  return Number(r?.n ?? 0);
}

export type Link = {
  id: string; status: ContactState["status"]; incoming: boolean; place: string; note: string | null; at: Date;
  name: string; // cine a cerut (pentru mine) sau proprietarul celuilalt neam (prescurtat, cât timp nu a acceptat)
  treeName: string; // neamul celuilalt
  treeId: string; otherId: string; // conversația: arborele celui care a acceptat și celălalt om
};

/** Toate legăturile mele „Din aceleași locuri”, pentru pagina Mesaje. */
export async function myLinks(db: Db, meId: string): Promise<Link[]> {
  const rows = await db.select().from(placeContact).where(or(eq(placeContact.fromUserId, meId), eq(placeContact.toUserId, meId)))
    .orderBy(desc(placeContact.createdAt)).limit(200);
  if (!rows.length) return [];
  const users = await db.select({ id: user.id, name: user.name }).from(user).where(inArray(user.id, [...new Set(rows.flatMap((r) => [r.fromUserId, r.toUserId]))]));
  const trees = await db.select({ id: tree.id, name: tree.name }).from(tree).where(inArray(tree.id, [...new Set(rows.flatMap((r) => [r.fromTreeId, r.toTreeId]))]));
  const uname = new Map(users.map((u) => [u.id, u.name])), tname = new Map(trees.map((t) => [t.id, t.name]));
  return rows.map((r) => {
    const incoming = r.toUserId === meId;
    const otherId = incoming ? r.fromUserId : r.toUserId;
    const full = uname.get(otherId) ?? "";
    return { id: r.id, status: r.status as Link["status"], incoming, place: r.place, note: r.note, at: r.createdAt,
      name: incoming || r.status === "accepted" ? full : shortName(full),
      treeName: tname.get(incoming ? r.fromTreeId : r.toTreeId) ?? "", treeId: r.toTreeId, otherId };
  });
}
