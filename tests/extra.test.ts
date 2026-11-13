import { describe, it, expect, beforeAll } from "vitest";
import { eq } from "drizzle-orm";
import { createDb, type Db } from "@/db";
import { runMigrations } from "@/db/migrate";
import { accountPlan, document, gift, person, referralBonus, tree, treeMember, user } from "@/db/schema";
import { applyPayment, includedBooksLeft, paidSession } from "@/lib/plati";
import { dueReminders, giftsBy, markReminded, redeemGift, voiceNudge } from "@/lib/extra";
import { DEFAULT_SETTINGS, type Access } from "@/lib/plans";

const DAY = 86_400_000;
const plan = async (db: Db, id: string) => (await db.select().from(accountPlan).where(eq(accountPlan.userId, id)))[0];

describe("îmbunătățirile de după planuri", () => {
  it("Stripe aduce pachetul Basic + carte și darul cu biletul", () => {
    const ev = (md: object) => ({ type: "checkout.session.completed", data: { object: { id: "cs", payment_status: "paid", amount_total: 12900, currency: "ron", metadata: md } } });
    expect(paidSession(ev({ kind: "an", userId: "u", tier: "basic", extra: "carte" }))).toMatchObject({ kind: "an", tier: "basic", extra: "carte" });
    expect(paidSession(ev({ kind: "cadou", userId: "u", tier: "premium", forName: "Mama", note: "Cu drag" }))).toMatchObject({ kind: "cadou", tier: "premium", forName: "Mama", note: "Cu drag" });
    expect(paidSession(ev({ kind: "cadou", userId: "u" }))).toMatchObject({ tier: "familie" });
    expect(DEFAULT_SETTINGS).toMatchObject({ bundleLei: 129, referralDays: 30, reminderDays: 14, printFromLei: 0 });
  });

  describe("în baza de date", () => {
    let db: Db;
    beforeAll(async () => {
      db = createDb();
      await runMigrations(db);
      await db.insert(user).values(["b1", "p1", "r1", "n1", "x1", "m1"].map((id) => ({ id, name: id, email: `${id}@test.ro` })));
    });

    it("pachetul Basic + PDF aduce o carte de ales în anul ăla", async () => {
      const now = new Date("2027-02-01T00:00:00Z");
      await applyPayment(db, { id: "cs_pachet", kind: "an", userId: "b1", treeId: null, amount: 12900, currency: "ron", tier: "basic", upgradeFrom: null, extra: "carte" }, now);
      const until = (await plan(db, "b1")).paidUntil!;
      const acc: Access = { kind: "platit", until, tier: "basic" };
      expect(await includedBooksLeft(db, "b1", acc, DEFAULT_SETTINGS, now)).toBe(1);
      // Fără pachet, Basic nu are carte inclusă.
      await applyPayment(db, { id: "cs_simplu", kind: "an", userId: "x1", treeId: null, amount: 5000, currency: "ron", tier: "basic", upgradeFrom: null }, now);
      expect(await includedBooksLeft(db, "x1", { ...acc, until: (await plan(db, "x1")).paidUntil! }, DEFAULT_SETTINGS, now)).toBe(0);
    });

    it("anul dăruit: legătura se primește o dată, de altcineva decât cel care a plătit", async () => {
      const now = new Date("2027-03-01T00:00:00Z");
      await applyPayment(db, { id: "cs_dar", kind: "cadou", userId: "p1", treeId: null, amount: 14900, currency: "ron", tier: "familie", forName: "Părinții", note: "Pentru voi" }, now);
      const [g] = await giftsBy(db, "p1");
      expect(g).toMatchObject({ tier: "familie", forName: "Părinții", note: "Pentru voi", redeemedBy: null });
      expect(await plan(db, "p1")).toBeUndefined(); // cine dăruiește nu primește anul
      expect(await redeemGift(db, g.id, "p1", now)).toBe("own");
      expect(await redeemGift(db, "cod-gresit-123", "n1", now)).toBe("invalid");
      expect(await redeemGift(db, g.id, "n1", now)).toBe("ok");
      expect(await plan(db, "n1")).toMatchObject({ tier: "familie", paidUntil: new Date(now.getTime() + 365 * DAY) });
      expect(await redeemGift(db, g.id, "m1", now)).toBe("used");
      expect(await redeemGift(db, g.id, "n1", now)).toBe("ok");
      // Plătit o singură dată: aceeași confirmare nu face încă un dar.
      await applyPayment(db, { id: "cs_dar", kind: "cadou", userId: "p1", treeId: null, amount: 14900, currency: "ron", tier: "familie" }, now);
      expect(await db.select().from(gift)).toHaveLength(1);
    });

    it("cine aduce o rudă care își face arborele și plătește primește zilele în plus (și dacă plătește el mai târziu)", async () => {
      const now = new Date("2027-04-01T00:00:00Z");
      const [{ id: t }] = await db.insert(tree).values({ name: "Al lui m1", ownerId: "m1" }).returning({ id: tree.id });
      await db.insert(treeMember).values({ treeId: t, userId: "r1", role: "editor", invitedBy: "m1" });
      const [{ id: own }] = await db.insert(tree).values({ name: "Al lui r1", ownerId: "r1" }).returning({ id: tree.id });
      await db.insert(treeMember).values({ treeId: own, userId: "r1", role: "owner" });
      // m1 n-are încă anul plătit: zilele așteaptă.
      await applyPayment(db, { id: "cs_r1", kind: "an", userId: "r1", treeId: null, amount: 5000, currency: "ron", tier: "basic", upgradeFrom: null }, now);
      expect((await db.select().from(referralBonus))[0]).toMatchObject({ referrerId: "m1", days: 30, appliedAt: null });
      // Când m1 plătește, anul lui primește și cele 30 de zile.
      await applyPayment(db, { id: "cs_m1", kind: "an", userId: "m1", treeId: null, amount: 5000, currency: "ron", tier: "basic", upgradeFrom: null }, now);
      expect((await plan(db, "m1")).paidUntil).toEqual(new Date(now.getTime() + (365 + 30) * DAY));
      expect((await db.select().from(referralBonus))[0].appliedAt).not.toBeNull();
      // A doua plată a rudei nu mai aduce zile.
      await applyPayment(db, { id: "cs_r1b", kind: "an", userId: "r1", treeId: null, amount: 5000, currency: "ron", tier: "basic", upgradeFrom: null }, now);
      expect(await db.select().from(referralBonus)).toHaveLength(1);
      expect((await plan(db, "m1")).paidUntil).toEqual(new Date(now.getTime() + (365 + 30) * DAY));
    });

    it("aducerea aminte: o dată pe an, cu 14 zile înainte, nu pentru „gratuit mereu”", async () => {
      const now = new Date("2028-03-20T00:00:00Z");
      const due = await dueReminders(db, 14, now);
      // n1 (dar din 2027-03-01) se termină pe 2028-02-29: deja trecut; b1 și x1 se termină pe 2028-02-01: trecut.
      expect(due.map((d) => d.userId)).not.toContain("n1");
      const soon = new Date("2028-02-20T00:00:00Z");
      const ids = (await dueReminders(db, 14, soon)).map((d) => d.userId);
      expect(ids).toContain("n1");
      expect(ids).not.toContain("b1");
      await markReminded(db, "n1", (await plan(db, "n1")).paidUntil!);
      expect((await dueReminders(db, 14, soon)).map((d) => d.userId)).not.toContain("n1");
      await db.update(accountPlan).set({ plan: "mereu", remindedFor: null }).where(eq(accountPlan.userId, "n1"));
      expect((await dueReminders(db, 14, soon)).map((d) => d.userId)).not.toContain("n1");
      expect(await dueReminders(db, 0, soon)).toEqual([]);
    });

    it("îndemnul pentru glasul bunicii: după primele fișe, până la prima înregistrare", async () => {
      const [{ id: t }] = await db.insert(tree).values({ name: "Glas", ownerId: "x1" }).returning({ id: tree.id });
      await db.insert(person).values([{ treeId: t, givenName: "Ion", living: true, birthFrom: "1990-01-01" }, { treeId: t, givenName: "Maria", living: true, birthFrom: "1941-05-02" }]);
      expect(await voiceNudge(db, t)).toBeNull();
      await db.insert(person).values([{ treeId: t, givenName: "Petru", living: false, birthFrom: "1900-01-01" }, { treeId: t, givenName: "A" }, { treeId: t, givenName: "B" }]);
      expect(await voiceNudge(db, t)).toMatchObject({ name: "Maria" });
      await db.insert(document).values({ treeId: t, kind: "audio", title: "Povestea" });
      expect(await voiceNudge(db, t)).toBeNull();
    });
  });
});
