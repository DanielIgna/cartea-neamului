import { describe, it, expect, beforeAll } from "vitest";
import { createDb, type Db } from "@/db";
import { runMigrations } from "@/db/migrate";
import { accountPlan, payment, user } from "@/db/schema";
import { REAL_PAYMENTS_SINCE, reportAuthorized, reportRanges, weeklyReport } from "@/lib/raport-saptamanal";

describe("raportul de luni: cine poate citi", () => {
  it("fără token pus sau cu token scurt, adresa e închisă", () => {
    expect(reportAuthorized("Bearer abc", undefined)).toBe(false);
    expect(reportAuthorized("Bearer scurt", "scurt")).toBe(false);
    const t = "x".repeat(32);
    expect(reportAuthorized(`Bearer ${t}`, t)).toBe(true);
    expect(reportAuthorized(`Bearer ${t}y`, t)).toBe(false);
    expect(reportAuthorized(t, t)).toBe(false);
  });
  it("perioada: ultimele 7 zile încheiate și cele 7 dinainte", () => {
    const r = reportRanges(7, "2026-11-23");
    expect(r.cur).toEqual({ from: "2026-11-16", to: "2026-11-22", days: 7 });
    expect(r.prev).toEqual({ from: "2026-11-09", to: "2026-11-15", days: 7 });
  });
});

describe("raportul de luni: doar clienții adevărați", () => {
  let db: Db;
  const at = (d: string) => new Date(`${d}T10:00:00Z`);
  beforeAll(async () => {
    db = createDb();
    await runMigrations(db);
    const mk = (id: string, email: string, d: string) => ({ id, name: id, email, createdAt: at(d), updatedAt: at(d) });
    await db.insert(user).values([
      mk("real1", "ana@x.ro", "2026-11-21"), mk("real2", "ion@x.ro", "2026-11-22"),
      mk("fam", "ruda@x.ro", "2026-11-21"), mk("test", "t@example.com", "2026-11-21"), mk("vechi", "vechi@x.ro", "2026-11-18"),
    ]);
    await db.insert(accountPlan).values({ userId: "fam", plan: "mereu" });
    await db.insert(payment).values([
      { id: "p-test-vechi", userId: "vechi", kind: "an", amount: 4900, currency: "ron", createdAt: at("2026-11-18") },
      { id: "p-real", userId: "real1", kind: "an", amount: 4900, currency: "ron", createdAt: at("2026-11-21") },
      { id: "p-fam", userId: "fam", kind: "an", amount: 14900, currency: "ron", createdAt: at("2026-11-21") },
      { id: "p-test", userId: "test", kind: "an", amount: 1000, currency: "eur", createdAt: at("2026-11-21") },
    ]);
  });
  it("numără conturile și plățile reale, fără test, familie și plățile de test", async () => {
    expect(REAL_PAYMENTS_SINCE).toBe("2026-11-20");
    const r = await weeklyReport(db, 7, { today: "2026-11-23", gsc: false });
    expect(r.current.accounts.new).toBe(3); // real1, real2, vechi (18.11): fără familie și fără test
    expect(r.current.accounts.paidSoFar).toBe(1);
    expect(r.current.payments.count).toBe(1);
    expect(r.current.payments.lei).toBe(49);
    expect(r.current.payments.eur).toBe(0);
    expect(r.current.payments.excluded).toBe(3);
    expect(r.current.visits.perDay).toHaveLength(7);
    expect(r.searchConsole).toBeNull();
    expect(JSON.stringify(r)).not.toMatch(/@x\.ro|example\.com/);
  });
});
