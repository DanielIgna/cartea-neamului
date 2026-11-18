import { describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { createDb } from "@/db";
import { runMigrations } from "@/db/migrate";
import { appSetting, automationMark, consent, crmActivities, crmApprovals, crmUserSignals, user } from "@/db/schema";
import { addActivity, suppress, upsertOrg } from "@/lib/crm";
import { automationStats, crmLimits, queueAmbassadors, queueReplyDrafts, runReactivation, saveCrmLimits, tipFor, DEFAULT_LIMITS } from "@/lib/crm-auto";
import { ingest } from "@/lib/crm-ingest";

const DAY = 86_400_000;
const now = new Date("2026-11-18T08:00:00Z");

async function setup() {
  const db = createDb();
  await runMigrations(db);
  const old = new Date(now.getTime() - 40 * DAY);
  await db.insert(user).values([
    { id: "r-ana", name: "Ana Pop", email: "ana@gmail.com", createdAt: old },
    { id: "r-ion", name: "Ion", email: "ion@gmail.com", createdAt: old },
    { id: "r-eva", name: "Eva", email: "eva@gmail.com", createdAt: old, locale: "en" },
    { id: "r-nu", name: "Nu", email: "nu@gmail.com", createdAt: old },
    { id: "r-test", name: "Test", email: "x@example.com", createdAt: old },
  ]);
  const sig = (userId: string, etapa: string, detalii: object = {}, scor = 10) => ({ userId, etapa, scor, detalii, updatedAt: now });
  await db.insert(crmUserSignals).values([
    sig("r-ana", "in_risc", { treePersons: 2 }, 30), sig("r-ion", "in_risc"), sig("r-eva", "in_risc", { treePersons: 8 }, 20), sig("r-nu", "in_risc"), sig("r-test", "in_risc"),
  ]);
  const c = (userId: string, granted: boolean, d: number) => ({ userId, purpose: "news", textVersion: "t", granted, createdAt: new Date(now.getTime() - d * DAY) });
  // Ana și Eva: „Da”; Ion: „Da”, apoi „Nu”; Nu: „Da”, dar e pe lista „nu contacta”; Test: cont de test.
  await db.insert(consent).values([c("r-ana", true, 30), c("r-eva", true, 30), c("r-ion", true, 30), c("r-ion", false, 5), c("r-nu", true, 30), c("r-test", true, 30)]);
  await suppress(db, "nu@gmail.com", "dezabonat");
  return db;
}

describe("reactivarea", () => {
  it("doar „în risc” cu acord, fără test și fără „nu contacta”; o dată la 30 de zile; în limita pe zi", async () => {
    const db = await setup();
    const sent: { to: string; subject: string; tag: string; headers?: Record<string, string>; text: string }[] = [];
    const mailer = async (m: (typeof sent)[number]) => { sent.push(m); return { ok: true }; };
    const r1 = await runReactivation(db, { now, mailer, limit: 1 });
    expect(r1).toMatchObject({ candidates: 3, sent: 1, suppressed: 0 });
    const r2 = await runReactivation(db, { now, mailer });
    expect(r2.sent).toBe(1);
    expect(r2.suppressed).toBe(1);
    expect(sent.map((m) => m.to).sort()).toEqual(["ana@gmail.com", "eva@gmail.com"]);
    const ana = sent.find((m) => m.to === "ana@gmail.com")!;
    expect(ana.subject).toContain("bunicii");
    expect(ana.tag).toBe("reactivare");
    expect(ana.headers?.["List-Unsubscribe"]).toContain("/api/vesti/dezabonare");
    expect(ana.text).toContain("dezabonare");
    expect(sent.find((m) => m.to === "eva@gmail.com")!.subject).toMatch(/grandparents/);
    expect((await db.select().from(crmActivities)).filter((a) => a.tip === "email_trimis")).toHaveLength(2);
    // A doua zi: nimic; după 31 de zile: din nou.
    expect((await runReactivation(db, { now: new Date(now.getTime() + DAY), mailer })).sent).toBe(0);
    expect((await runReactivation(db, { now: new Date(now.getTime() + 31 * DAY), mailer })).sent).toBe(2);
  });

  it("ideea potrivită după arbore", () => {
    expect(tipFor({ treePersons: 1, media: true })).toBe("bunici");
    expect(tipFor({ treePersons: 9, media: false })).toBe("intrebari");
    expect(tipFor({ treePersons: 9, media: true })).toBe("ruda");
  });
});

describe("ambasadorii și ciornele", () => {
  it("ambasadorii intră o singură dată în Aprobări, fără să trimită nimic", async () => {
    const db = await setup();
    await db.update(crmUserSignals).set({ etapa: "ambasador", detalii: { brought: 3 } }).where(eq(crmUserSignals.userId, "r-ana"));
    await db.update(crmUserSignals).set({ etapa: "ambasador" }).where(eq(crmUserSignals.userId, "r-test"));
    expect(await queueAmbassadors(db, { now })).toMatchObject({ candidates: 1, queued: 1 });
    expect(await queueAmbassadors(db, { now })).toMatchObject({ candidates: 0, queued: 0 });
    const [a] = await db.select().from(crmApprovals);
    expect(a).toMatchObject({ tipActiune: "email-ambasador", status: "in_asteptare", userId: "r-ana" });
    expect((a.payload as { text: string }).text).toContain("3 oameni");
    expect((await automationStats(db)).ambasadori).toBe(1);
  });

  it("ciornă doar la „interesat”/„întrebare”, nu la refuz, nu după ce ai răspuns deja", async () => {
    const db = await setup();
    const a = await upsertOrg(db, { tip: "scoala", nume: "Școala A", emailOficial: "secretariat@scoala-a.ro" });
    const b = await upsertOrg(db, { tip: "scoala", nume: "Școala B", emailOficial: "secretariat@scoala-b.ro" });
    const c = await upsertOrg(db, { tip: "firma", nume: "Firma C", emailOficial: "office@firma-c.ro" });
    const t = (h: number) => new Date(now.getTime() - h * 3600_000);
    await addActivity(db, { tip: "raspuns", organizationId: a.id, at: t(5), meta: { clasificare: "interesat" } });
    await addActivity(db, { tip: "raspuns", organizationId: b.id, at: t(5), meta: { clasificare: "refuz" } });
    await addActivity(db, { tip: "raspuns", organizationId: c.id, at: t(5), meta: { clasificare: "intrebare" } });
    await addActivity(db, { tip: "email_trimis", organizationId: c.id, at: t(2) });
    expect(await queueReplyDrafts(db, { now })).toMatchObject({ candidates: 1, queued: 1 });
    expect(await queueReplyDrafts(db, { now })).toMatchObject({ queued: 0 });
    const [p] = await db.select().from(crmApprovals);
    expect(p).toMatchObject({ tipActiune: "email-raspuns", organizationId: a.id });
    expect((p.payload as { destinatar: string }).destinatar).toBe("secretariat@scoala-a.ro");
  });

  it("la ingestie, ciorna apare doar dacă automatizarea e pornită", async () => {
    const db = await setup();
    await upsertOrg(db, { tip: "scoala", nume: "Școala D", emailOficial: "secretariat@scoala-d.ro" });
    const ev = (id: string) => ({ id, type: "raspuns", email: "secretariat@scoala-d.ro", rezumat: "Suntem interesați, trimiteți detalii", clasificare: "interesat" });
    await ingest(db, ev("e1"), now);
    expect(await db.select().from(crmApprovals)).toHaveLength(0);
    await db.insert(appSetting).values({ key: "automatizari", value: { "crm-ciorne": true } });
    await ingest(db, ev("e2"), now);
    expect(await db.select().from(crmApprovals)).toHaveLength(2); // câte o ciornă pentru fiecare răspuns nou
  });
});

describe("limitele", () => {
  it("implicite, salvate, verificate", async () => {
    const db = createDb();
    await runMigrations(db);
    expect(await crmLimits(db)).toEqual(DEFAULT_LIMITS);
    await saveCrmLimits(db, { reactivare: 5, ambasador: 2, ciorne: 10 }, null, now);
    expect(await crmLimits(db)).toEqual({ reactivare: 5, ambasador: 2, ciorne: 10 });
    expect((await db.select().from(automationMark))).toHaveLength(0);
  });
});
