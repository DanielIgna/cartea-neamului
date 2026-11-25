import { describe, it, expect } from "vitest";
import { eq, like } from "drizzle-orm";
import { createDb } from "@/db";
import { runMigrations } from "@/db/migrate";
import { accountPlan, activationCode, user } from "@/db/schema";
import { probaOnce, probaResult } from "@/lib/coduri-activare-proba";

describe("proba codurilor de activare, de la publicare", () => {
  it("un cod pe fiecare plan: activat, „deja folosit”, apoi anulat, fără conturi de probă rămase; o singură dată", async () => {
    const db = createDb();
    await runMigrations(db);
    await db.insert(user).values({ id: "real", name: "Om adevărat", email: "om@test.ro" });
    const now = new Date("2026-11-25T18:00:00Z");
    expect(await probaOnce(db, now)).toMatch(/^reușită/);
    const p = await probaResult(db);
    expect(p).toMatchObject({ ok: true, conturiSterse: 6 });
    expect(p!.rows.map((r) => [r.plan, r.activare, r.planPrimit, r.valabilPana, r.aDouaOaraAcelasiCont, r.aDouaOaraAltCont, r.anulat])).toEqual([
      ["basic", "ok", "basic", "2027-11-25T18:00:00.000Z", "used_by_you", "used", true],
      ["familie", "ok", "familie", "2027-11-25T18:00:00.000Z", "used_by_you", "used", true],
      ["premium", "ok", "premium", "2027-11-25T18:00:00.000Z", "used_by_you", "used", true],
    ]);
    const codes = await db.select().from(activationCode).where(eq(activationCode.sursa, "test"));
    expect(codes.map((c) => c.status)).toEqual(["anulat", "anulat", "anulat"]);
    expect(await db.select().from(user).where(like(user.id, "proba-activare-%"))).toHaveLength(0);
    expect(await db.select().from(accountPlan)).toHaveLength(0);
    expect(await db.select().from(user)).toHaveLength(1);
    expect(await probaOnce(db, now)).toBe("deja");
  });
});
