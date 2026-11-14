import { describe, it, expect, beforeAll } from "vitest";
import { createDb, type Db } from "@/db";
import { runMigrations } from "@/db/migrate";
import { invitation, tree, user } from "@/db/schema";
import { recordConsent } from "@/lib/consent";
import { checkUnsubscribe, dueStep, growthDashboard, growthSettings, newsCandidates, saveGrowthSettings, unsubscribeToken } from "@/lib/crestere";
import { buildCalendar } from "@/lib/calendar-continut";
import { businessHealth, funnelTargets, statusOf } from "@/lib/sanatate-afacere";
import { architecture } from "@/lib/cunostinte/arhitectura";

const DAY = 86_400_000;

describe("creșterea fără reclame", () => {
  it("șirul de bun venit: un singur pas pe zi, în fereastra lui, sărind ce omul a făcut deja", () => {
    const now = new Date("2026-12-01T10:00:00Z");
    const at = (days: number) => new Date(now.getTime() - days * DAY);
    const none = { invited: false, voice: false, paid: false };
    expect(dueStep(at(0), new Set(), none, now)).toBeNull();
    expect(dueStep(at(1), new Set(), none, now)).toBe("e1");
    expect(dueStep(at(2), new Set(["e1"]), none, now)).toBe("e2");
    expect(dueStep(at(2), new Set(["e1"]), { ...none, invited: true }, now)).toBeNull();
    expect(dueStep(at(10), new Set(["e1", "e2", "e3"]), { ...none, paid: true }, now)).toBeNull();
    expect(dueStep(at(21), new Set(), none, now)).toBe("e5");
    // Un cont vechi nu primește tot șirul deodată.
    expect(dueStep(at(40), new Set(), none, now)).toBeNull();
  });

  it("dezabonarea cere semnătura potrivită", () => {
    const t = unsubscribeToken("u1");
    expect(checkUnsubscribe("u1", t)).toBe(true);
    expect(checkUnsubscribe("u2", t)).toBe(false);
    expect(checkUnsubscribe("u1", "x")).toBe(false);
  });

  it("ținta de 1000 pe lună se socotește înapoi în conturi și vizite", () => {
    expect(funnelTargets(1000, 0.1, 0.03)).toEqual({ accounts: 10000, visits: 333334 });
    expect(statusOf(85)).toBe("sanatos");
    expect(statusOf(60)).toBe("atentie");
    expect(statusOf(10)).toBe("critic");
  });

  it("calendarul are trei postări pe săptămână și zilele bune, fără limbaj religios", () => {
    const c = buildCalendar(new Date("2026-11-16T00:00:00Z"), 8);
    expect(c.filter((i) => i.kind !== "sezon")).toHaveLength(24);
    expect(c.some((i) => i.id.endsWith("ziua-nationala"))).toBe(true);
    expect(c.some((i) => i.id.endsWith("intrebari-masa"))).toBe(true);
    for (const i of c) expect(`${i.title} ${i.text}`).not.toMatch(/biseric|Biblie|Dumnez|preot|rugăc/i);
    expect(new Set(c.map((i) => i.id)).size).toBe(c.length);
  });

  it("navigatorul arată fișiere care există", () => {
    const a = architecture();
    expect(a.blocks.length).toBeGreaterThan(10);
    expect(a.blocks[0].layer).toBe("guvernanta");
    expect(a.blocks[a.blocks.length - 1].layer).toBe("client");
  });

  describe("în baza de date", () => {
    let db: Db;
    beforeAll(async () => {
      db = createDb();
      await runMigrations(db);
      const now = Date.now();
      await db.insert(user).values([
        { id: "a", name: "Ana Pop", email: "a@test.ro", createdAt: new Date(now - 2 * DAY) },
        { id: "b", name: "Bogdan", email: "b@test.ro", createdAt: new Date(now - 2 * DAY) },
        { id: "c", name: "Cora", email: "c@test.ro", createdAt: new Date(now - 60 * DAY) },
      ]);
      const [t] = await db.insert(tree).values({ name: "Pop", ownerId: "a" }).returning({ id: tree.id });
      await db.insert(invitation).values({ treeId: t.id, tokenHash: "h1", createdBy: "a", expiresAt: new Date(now + 10 * DAY), acceptedBy: "b", acceptedAt: new Date(now - DAY) });
      await recordConsent(db, "a", "news", true);
      await recordConsent(db, "b", "news", true);
      await recordConsent(db, "b", "news", false, new Date(now + 1000));
      await recordConsent(db, "c", "news", true);
    });

    it("sfaturile pleacă doar celor cu acordul dat acum și cu contul nou", async () => {
      const list = await newsCandidates(db);
      expect(list.map((u) => u.id)).toEqual(["a"]);
      expect(list[0].invited).toBe(true);
    });

    it("panoul de creștere și comutatoarele", async () => {
      const d = await growthDashboard(db);
      expect(d.invitations.all).toBe(1);
      expect(d.invitations.accepted).toBe(1);
      expect(d.news).toMatchObject({ yes: 2, no: 1 });
      expect(d.top[0]).toMatchObject({ name: "Ana Pop", accepted: 1 });
      expect((await growthSettings(db)).shareInvite).toBe(true);
      await saveGrowthSettings(db, { askNews: false, shareInvite: true, shareCards: true }, null);
      expect((await growthSettings(db)).askNews).toBe(false);
    });

    it("sănătatea afacerii dă scoruri 0–100 pe departamente, cu formula scrisă", async () => {
      const h = await businessHealth(db);
      expect(h.domains.map((d) => d.key)).toEqual(expect.arrayContaining(["venituri", "marketing", "conversii", "seo", "invitatii", "leaduri", "retentie", "suport"]));
      for (const d of h.domains) {
        expect(d.score).toBeGreaterThanOrEqual(0);
        expect(d.score).toBeLessThanOrEqual(100);
        expect(d.formula.length).toBeGreaterThan(10);
      }
      expect(h.domains.find((d) => d.key === "venituri")!.score).toBe(0);
      expect(h.goal.revenueMonth).toBe(1000 * h.goal.price);
    });
  });
});

describe("învățare și conversii", () => {
  it("scorul din semnalele contului și mesajul propus", async () => {
    const { leadScore, suggestedMessage } = await import("@/lib/invatare");
    const s = { persons: 12, invites: 2, photos: 4, memories: 1, activeDaysAgo: 1, daysLeft: 1 };
    expect(leadScore(s)).toMatchObject({ score: 100, tier: "aproape" });
    expect(leadScore({ ...s, persons: 2, invites: 0, photos: 0, memories: 0, daysLeft: 5 }).tier).toBe("inceput");
    expect(suggestedMessage("Ana Pop", { ...s, invites: 0 }, 49).subject).toMatch(/familie/);
    expect(suggestedMessage("Ana Pop", s, 49).body).toContain("49 lei");
    expect(suggestedMessage("Ana Pop", s, 49).body).not.toMatch(/biseric|Dumnez|\bAI\b/);
  });

  it("jurnalul: adaugă, bifează făcut, măsoară înainte/după", async () => {
    const { createDb } = await import("@/db");
    const { runMigrations } = await import("@/db/migrate");
    const { addRecommendation, ledger, outcomes, setRecommendation } = await import("@/lib/invatare");
    const db = createDb();
    await runMigrations(db);
    const t0 = new Date("2026-12-01T00:00:00Z");
    await addRecommendation(db, { text: "Postare în grupuri", source: "de mână" }, null, t0);
    await addRecommendation(db, { text: "Postare în grupuri", source: "de mână" }, null, t0);
    let items = await ledger(db);
    expect(items).toHaveLength(1);
    await setRecommendation(db, items[0].id, "facuta", "5 grupuri", null, t0);
    items = await ledger(db);
    expect(items[0]).toMatchObject({ status: "facuta", note: "5 grupuri" });
    const o = await outcomes(db, items, new Date("2026-12-20T00:00:00Z"));
    expect(o.get(items[0].id)).toMatchObject({ days: 14, complete: true });
  });
});
