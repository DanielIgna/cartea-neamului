import { describe, it, expect, beforeAll } from "vitest";
import { eq } from "drizzle-orm";
import { createDb, type Db } from "@/db";
import { runMigrations } from "@/db/migrate";
import { tree, person, user, treeMember, invitation } from "@/db/schema";
import { createInvitation, acceptInvitation, hashToken } from "@/lib/invitations";
import { can } from "@/lib/access";

let db: Db, treeId: string, maria: string;
const mkUser = async (id: string) => (await db.insert(user).values({ id, name: id, email: `${id}@ex.ro` }).returning())[0];

beforeAll(async () => {
  db = createDb();
  await runMigrations(db);
  await mkUser("andrei"); await mkUser("maria"); await mkUser("ion");
  const [t] = await db.insert(tree).values({ name: "Test", ownerId: "andrei" }).returning();
  treeId = t.id;
  await db.insert(treeMember).values({ treeId, userId: "andrei", role: "owner" });
  maria = (await db.insert(person).values({ treeId, givenName: "Maria", surname: "Pop", living: true, sex: "F" }).returning())[0].id;
});

describe("invitații", () => {
  it("păstrează doar hash-ul tokenului", async () => {
    const { token } = await createInvitation(db, { treeId, createdBy: "andrei", role: "contributor" });
    const rows = await db.select().from(invitation).where(eq(invitation.tokenHash, hashToken(token)));
    expect(rows).toHaveLength(1);
    expect(JSON.stringify(rows)).not.toContain(token);
  });

  it("face membru și revendică fișa persoanei", async () => {
    const { token } = await createInvitation(db, { treeId, createdBy: "andrei", role: "contributor", personId: maria });
    const res = await acceptInvitation(db, token, "maria");
    expect(res).toEqual({ ok: true, treeId, claimed: true });
    const [m] = await db.select().from(treeMember).where(eq(treeMember.userId, "maria"));
    expect(m.role).toBe("contributor");
    const [p] = await db.select().from(person).where(eq(person.id, maria));
    expect(p).toMatchObject({ claimedByUserId: "maria", privacy: "claimed" });
  });

  it("nu poate fi folosită de altcineva după ce a fost acceptată", async () => {
    const { token } = await createInvitation(db, { treeId, createdBy: "andrei", role: "viewer" });
    expect((await acceptInvitation(db, token, "ion")).ok).toBe(true);
    expect(await acceptInvitation(db, token, "maria")).toEqual({ ok: false, reason: "used" });
  });

  it("expiră după 14 zile", async () => {
    const created = new Date("2026-01-01T00:00:00Z");
    const { token } = await createInvitation(db, { treeId, createdBy: "andrei", role: "viewer", now: created });
    expect(await acceptInvitation(db, token, "ion", new Date("2026-01-16T00:00:00Z"))).toEqual({ ok: false, reason: "expired" });
  });

  it("respinge tokenuri inventate", async () => {
    expect(await acceptInvitation(db, "token-inventat-de-cineva-1234", "ion")).toEqual({ ok: false, reason: "invalid" });
  });
});

describe("roluri", () => {
  it("ierarhia owner > editor > contributor > viewer", () => {
    expect(can("owner", "editor")).toBe(true);
    expect(can("contributor", "contributor")).toBe(true);
    expect(can("viewer", "contributor")).toBe(false);
    expect(can(null, "viewer")).toBe(false);
  });
});
