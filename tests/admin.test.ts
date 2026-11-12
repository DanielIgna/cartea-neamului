import { describe, it, expect, beforeAll } from "vitest";
import { createDb, type Db } from "@/db";
import { runMigrations } from "@/db/migrate";
import { tree, person, treeMember, user, session, auditLog } from "@/db/schema";
import { adminEmails, isAdminEmail } from "@/lib/admin";
import { businessStats, fillWeeks, infraStats } from "@/lib/admin-stats";

describe("cine e admin", () => {
  it("citește lista din ADMIN_EMAILS, fără să țină cont de litere mari", () => {
    expect(adminEmails(" A@x.ro, b@y.ro ;c@z.ro")).toEqual(["a@x.ro", "b@y.ro", "c@z.ro"]);
    expect(isAdminEmail("B@Y.ro", "a@x.ro,b@y.ro")).toBe(true);
    expect(isAdminEmail("d@x.ro", "a@x.ro")).toBe(false);
  });
  it("fără ADMIN_EMAILS nu e nimeni admin", () => {
    expect(isAdminEmail("a@x.ro", "")).toBe(false);
    expect(isAdminEmail("a@x.ro", undefined)).toBe(false);
    expect(isAdminEmail(null, "a@x.ro")).toBe(false);
  });
});

describe("săptămânile graficului", () => {
  it("pune 0 pe săptămânile fără conturi și începe lunea", () => {
    const w = fillWeeks([{ week: "2026-11-02T00:00:00.000Z", c: 3 }], 3, new Date("2026-11-04T10:00:00Z"));
    expect(w).toEqual([{ week: "2026-10-19", c: 0 }, { week: "2026-10-26", c: 0 }, { week: "2026-11-02", c: 3 }]);
  });
});

describe("cifrele din panou", () => {
  let db: Db;
  beforeAll(async () => {
    db = createDb();
    await runMigrations(db);
    await db.insert(user).values([{ id: "u1", name: "Ana", email: "ana@test.ro" }, { id: "u2", name: "Ion", email: "ion@test.ro" }]);
    await db.insert(session).values({ id: "s1", token: "t1", userId: "u1", expiresAt: new Date(Date.now() + 86_400_000) });
    const [big] = await db.insert(tree).values({ name: "Mare", ownerId: "u1" }).returning();
    const [small] = await db.insert(tree).values({ name: "Mic", ownerId: "u2" }).returning();
    await db.insert(treeMember).values([{ treeId: big.id, userId: "u1", role: "owner" }, { treeId: big.id, userId: "u2" }, { treeId: small.id, userId: "u2", role: "owner" }]);
    await db.insert(person).values(Array.from({ length: 200 }, (_, k) => ({ treeId: big.id, givenName: `P${k}` })));
    await db.insert(person).values({ treeId: small.id, givenName: "Unu", living: true });
    await db.insert(auditLog).values({ entity: "eroare", entityId: "/arbore/x", action: "render", diff: { message: "boom" } });
  });

  it("Business: oameni, arbori și ce ar aduce plățile pornite azi", async () => {
    const b = await businessStats(db);
    expect(b.users).toMatchObject({ total: 2, new7: 2, active7: 1 });
    expect(b.trees).toMatchObject({ total: 2, shared: 1, maxPersons: 200 });
    expect(b.revenue.potentialLeiYear).toBe(0); // cei de acum au primul an gratuit
    expect(b.content.persons).toBe(201);
    expect(b.content.living).toBe(1);
    expect(b.topTrees[0]).toMatchObject({ name: "Mare", owner: "Ana", persons: 200, members: 2 });
    expect(b.signupsByWeek).toHaveLength(12);
    expect(b.signupsByWeek.at(-1)!.c).toBe(2);
  });

  it("Infra: tabele, migrații la zi și erorile prinse", async () => {
    const i = await infraStats(db);
    expect(i.missingTables).toEqual([]);
    expect(i.migrations.applied).toBe(i.migrations.expected);
    expect(i.tables.find((t) => t.name === "person")?.rows).toBe(201);
    expect(i.db.bytes).toBeGreaterThan(0);
    expect(i.errors.d1).toBe(1);
    expect(i.errors.recent[0]).toMatchObject({ path: "/arbore/x", message: "boom" });
    expect(i.sessions.live).toBe(1);
  });
});
