import { describe, it, expect, beforeAll } from "vitest";
import { eq } from "drizzle-orm";
import { createDb, type Db } from "@/db";
import { runMigrations } from "@/db/migrate";
import { tree, person, relationship, treeMember, user, message } from "@/db/schema";
import { canMessage, chatContacts, inbox, markRead, unreadCount } from "@/lib/chat";

let db: Db, treeId: string;
const P: Record<string, string> = {};

/** Bunicul, cei doi copii ai lui, nepoții (veri primari, gradul IV) și un strănepot (gradul V față de vărul lui). */
beforeAll(async () => {
  db = createDb();
  await runMigrations(db);
  const [t] = await db.insert(tree).values({ name: "Chat" }).returning();
  treeId = t.id;
  for (const [k, sex] of [["bunic", "M"], ["tata", "M"], ["unchi", "M"], ["eu", "M"], ["sotie", "F"], ["var", "M"], ["fiulVar", "M"]] as const) {
    const [p] = await db.insert(person).values({ treeId, givenName: k, surname: "Igna", sex }).returning();
    P[k] = p.id;
  }
  const pc = (a: string, b: string) => ({ treeId, type: "parent_child" as const, personA: P[a], personB: P[b] });
  await db.insert(relationship).values([pc("bunic", "tata"), pc("bunic", "unchi"), pc("tata", "eu"), pc("unchi", "var"), pc("var", "fiulVar"),
    { treeId, type: "partnership", personA: P.eu, personB: P.sotie }]);
  for (const u of ["eu", "sotie", "var", "fiulVar", "tata"]) {
    await db.insert(user).values({ id: `u-${u}`, name: u, email: `${u}@test.ro` });
    await db.insert(treeMember).values({ treeId, userId: `u-${u}`, role: u === "eu" ? "owner" : "contributor" });
    if (u !== "tata") await db.update(person).set({ claimedByUserId: `u-${u}` }).where(eq(person.id, P[u]));
  }
});

describe("mesaje între rude", () => {
  it("permite rudele până la gradul ales și soții oricând", async () => {
    await db.update(tree).set({ chatMaxDegree: 4 }).where(eq(tree.id, treeId));
    const { contacts } = await chatContacts(db, treeId, "u-eu");
    const allowed = Object.fromEntries(contacts.map((c) => [c.userId, c.allowed]));
    expect(allowed).toEqual({ "u-sotie": true, "u-var": true, "u-fiulVar": false });
    expect((await canMessage(db, treeId, "u-eu", "u-fiulVar")).ok).toBe(false);
    await db.update(tree).set({ chatMaxDegree: 5 }).where(eq(tree.id, treeId));
    expect((await canMessage(db, treeId, "u-eu", "u-fiulVar")).ok).toBe(true);
  });

  it("refuză pe cine nu și-a revendicat fișa", async () => {
    expect((await canMessage(db, treeId, "u-tata", "u-eu")).ok).toBe(false);
    expect((await canMessage(db, treeId, "u-eu", "u-tata")).ok).toBe(false);
  });

  it("numără necititele și le marchează citite", async () => {
    await db.insert(message).values([{ treeId, fromUserId: "u-var", toUserId: "u-eu", body: "Salut, vere!" }, { treeId, fromUserId: "u-var", toUserId: "u-eu", body: "Ce mai faci?" }]);
    expect(await unreadCount(db, "u-eu")).toBe(2);
    const [conv] = await inbox(db, "u-eu", [treeId]);
    expect(conv).toMatchObject({ otherId: "u-var", unread: 2 });
    await markRead(db, treeId, "u-eu", "u-var");
    expect(await unreadCount(db, "u-eu")).toBe(0);
  });
});
