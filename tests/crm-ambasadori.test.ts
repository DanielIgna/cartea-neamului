import { describe, expect, it } from "vitest";
import { createDb } from "@/db";
import { runMigrations } from "@/db/migrate";
import { accountSource, crmAmbassadorAccounts, payment, school, schoolCode, schoolSignup, user } from "@/db/schema";
import { AmbassadorInput, addPayout, ambassadorList, ambassadorOnPayment, attributeToAmbassador, createAmbassador, refreshAmbassadorAccounts, rewardFor, saveRewardRules, DEFAULT_RULES } from "@/lib/crm-ambasadori";

const now = new Date("2026-11-18T10:00:00Z");

describe("profesorii ambasadori", () => {
  it("datele de contact doar cu acord", () => {
    expect(AmbassadorInput.safeParse({ nume: "Ana Pop", email: "ana@scoala.ro", acord: false }).success).toBe(false);
    expect(AmbassadorInput.safeParse({ nume: "Ana Pop", acord: false }).success).toBe(true);
    expect(AmbassadorInput.safeParse({ nume: "Ana Pop", email: "ana@scoala.ro", acord: true }).success).toBe(true);
  });

  it("regula recompensei", () => {
    expect(rewardFor(DEFAULT_RULES, 30, 12)).toEqual({ lei: 120, ani: 1 });
    expect(rewardFor({ ...DEFAULT_RULES, leiPerCont: 2, pragAnGratuit: 0 }, 10, 3)).toEqual({ lei: 50, ani: 0 });
  });

  it("elevi prin link, clasă și cod; plătitori, recompensă, ce s-a dat; testele nu contează", async () => {
    const db = createDb();
    await runMigrations(db);
    const [sc] = await db.insert(school).values({ name: "Liceul X", locality: "Dej" }).returning();
    const [code] = await db.insert(schoolCode).values({ schoolId: sc.id, code: "SCOALAPROF1", percent: 90, maxUses: 30, expiresAt: new Date("2027-06-30") }).returning();
    const a = await createAmbassador(db, AmbassadorInput.parse({ nume: "Maria Ionescu", acord: false, schoolCodeId: code.id }), null, now);
    const b = await createAmbassador(db, AmbassadorInput.parse({ nume: "Maria Ionescu", acord: false }), null, now);
    expect(a.slug).toBe("maria-ionescu");
    expect(b.slug).toBe("maria-ionescu-2");
    await db.insert(user).values([1, 2, 3, 4].map((i) => ({ id: `e${i}`, name: `Elev ${i}`, email: `e${i}@gmail.com` })).concat([{ id: "et", name: "Test", email: "x@example.com" }]));
    await db.insert(accountSource).values([{ userId: "e1", firstSrc: "prof-maria-ionescu" }, { userId: "et", firstSrc: "prof-maria-ionescu" }, { userId: "e4", firstSrc: "prof-maria-ionescu-2" }]);
    await db.insert(schoolSignup).values({ userId: "e2", codeId: code.id });
    await attributeToAmbassador(db, "e1", now);
    await db.execute(`update crm_ambassadors set stripe_promo_id = 'promo_prof', cod = 'NEAM-PROF' where slug = 'maria-ionescu'`);
    await ambassadorOnPayment(db, { userId: "e3", promo: "promo_prof" }, now);
    const r = await refreshAmbassadorAccounts(db, now);
    expect(r.added).toBe(2); // e2 (clasa), e4 (link al lui b); e1 deja legat, et e test (dar legat la înscriere nu contează la cifre)
    await db.insert(payment).values([
      { id: "p1", userId: "e1", kind: "an", amount: 4900, currency: "ron" },
      { id: "p2", userId: "e3", kind: "an", amount: 490, currency: "ron" }, // sub plata minimă (40 lei): nu contează la recompensă
      { id: "p3", userId: "e2", kind: "an", amount: 14900, currency: "ron" },
    ]);
    await saveRewardRules(db, { leiPerCont: 1, leiPerPlata: 10, pragAnGratuit: 2, minimPlata: 40 }, null, now);
    await addPayout(db, a.id, 5, "transfer", null, now);
    const list = new Map((await ambassadorList(db)).map((x) => [x.slug, x]));
    expect(list.get("maria-ionescu")).toMatchObject({ elevi: 3, platitori: 2, venit: 202.9, recompensaLei: 23, aniGratuiti: 1, dat: 5, deDat: 18 });
    expect(list.get("maria-ionescu-2")).toMatchObject({ elevi: 1, platitori: 0, recompensaLei: 1 });
  });
});
