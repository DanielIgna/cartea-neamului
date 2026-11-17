import { describe, expect, it } from "vitest";
import { createDb } from "@/db";
import { runMigrations } from "@/db/migrate";
import { accountSource, crmUserSignals, inviteReferral, payment, person, tree, treeMember, user } from "@/db/schema";
import { lifeStageOf, orgPriority, refreshIfStale, refreshSignals, schoolSeason, scoreOf, type Facts } from "@/lib/crm-scor";

const DAY = 86_400_000;
const now = new Date("2026-11-17T10:00:00Z");
const base: Facts = { verified: false, persons: 0, treePersons: 0, invited: false, inviteAccepted: false, activeDays30: 0, goodSource: false, emailClick: false, codeUsed: false, media: false, paidEver: false, brought: 0, lastActivity: now };
const trial = { kind: "proba", until: new Date(now.getTime() + 3 * DAY), daysLeft: 3 } as const;

describe("scorul", () => {
  it("fiecare regulă are plafonul ei, iar totalul nu trece de 100", () => {
    expect(scoreOf(base).score).toBe(0);
    expect(scoreOf({ ...base, verified: true, persons: 4 }).score).toBe(18);
    expect(scoreOf({ ...base, persons: 50 }).parts.persoane).toBe(20);
    const all = { ...base, verified: true, persons: 30, invited: true, inviteAccepted: true, activeDays30: 20, goodSource: true, emailClick: true, codeUsed: true, media: true, paidEver: true };
    expect(scoreOf(all).score).toBe(100);
  });
});

describe("etapa", () => {
  const created = new Date(now.getTime() - 5 * DAY);
  it("de la cont la ambasador", () => {
    expect(lifeStageOf(base, trial, created, now)).toBe("cont");
    expect(lifeStageOf({ ...base, treePersons: 3 }, trial, created, now)).toBe("activat");
    expect(lifeStageOf({ ...base, treePersons: 3, invited: true }, trial, created, now)).toBe("angajat");
    expect(lifeStageOf({ ...base, invited: true }, { kind: "platit", until: null, tier: "basic" }, created, now)).toBe("platitor");
    expect(lifeStageOf({ ...base, brought: 2 }, { kind: "platit", until: null, tier: "basic" }, created, now)).toBe("ambasador");
  });
  it("în risc după 14 zile fără nimic; pierdut la 30 de zile după zilele gratuite, fără plată", () => {
    expect(lifeStageOf({ ...base, lastActivity: new Date(now.getTime() - 15 * DAY) }, trial, created, now)).toBe("in_risc");
    expect(lifeStageOf({ ...base, lastActivity: null }, trial, new Date(now.getTime() - 20 * DAY), now)).toBe("in_risc");
    const exp = { kind: "expirat", since: new Date(now.getTime() - 31 * DAY) } as const;
    expect(lifeStageOf(base, exp, created, now)).toBe("pierdut");
    expect(lifeStageOf({ ...base, paidEver: true }, exp, created, now)).toBe("in_risc");
    expect(lifeStageOf(base, { kind: "expirat", since: new Date(now.getTime() - 10 * DAY) }, created, now)).toBe("in_risc");
  });
});

describe("prioritatea organizațiilor", () => {
  it("reguli simple; „nu contacta” = 0", () => {
    expect(schoolSeason(new Date("2026-11-17"))).toBe(true);
    expect(schoolSeason(new Date("2026-07-15"))).toBe(false);
    expect(orgPriority({ tip: "scoala", status: "interesat", maxAccounts: 30, warmCounty: true }, now)).toBe(77);
    expect(orgPriority({ tip: "firma", status: "nou", maxAccounts: 0, warmCounty: false }, now)).toBe(10);
    expect(orgPriority({ tip: "scoala", status: "nu_contacta", maxAccounts: 500, warmCounty: true }, now)).toBe(0);
    expect(orgPriority({ tip: "firma", status: "nelivrat", maxAccounts: 0, warmCounty: false }, now)).toBe(0);
  });
});

describe("recalcularea din baza de date", () => {
  it("scrie scorul doar pentru conturile reale și doar ce s-a schimbat", async () => {
    const db = createDb();
    await runMigrations(db);
    const old = new Date(now.getTime() - 3 * DAY);
    await db.insert(user).values([
      { id: "s-ana", name: "Ana", email: "ana@gmail.com", emailVerified: true, createdAt: old },
      { id: "s-ion", name: "Ion", email: "ion@gmail.com", createdAt: old },
      { id: "s-mia", name: "Mia", email: "mia@gmail.com", createdAt: old },
      { id: "s-test", name: "Test", email: "x@example.com", createdAt: old },
    ]);
    const [t] = await db.insert(tree).values({ name: "Neamul Anei", ownerId: "s-ana" }).returning();
    await db.insert(treeMember).values({ treeId: t.id, userId: "s-ana", role: "owner" });
    await db.insert(person).values([1, 2, 3].map((i) => ({ treeId: t.id, givenName: `P${i}`, surname: "Pop", createdBy: "s-ana", createdAt: new Date(now.getTime() - DAY) })));
    await db.insert(inviteReferral).values([{ referredId: "s-ion", referrerId: "s-ana", via: "link" }, { referredId: "s-mia", referrerId: "s-ana", via: "link" }]);
    await db.insert(accountSource).values({ userId: "s-ion", invite: true, source: "invitatie" });
    await db.insert(payment).values({ id: "cs_s", userId: "s-ana", kind: "an", amount: 4900, currency: "ron" });
    const r1 = await refreshSignals(db, now);
    expect(r1).toMatchObject({ users: 3, changed: 3 });
    const got = new Map((await db.select().from(crmUserSignals)).map((x) => [x.userId, x]));
    expect(got.has("s-test")).toBe(false);
    expect(got.get("s-ana")).toMatchObject({ etapa: "ambasador" });
    expect(got.get("s-ana")!.scor).toBe(10 + 6 + 15 + 3 + 10); // email, 3 persoane, rude, o zi activă, plată
    expect(got.get("s-ion")).toMatchObject({ etapa: "cont", sursa: "invitatie", scor: 10 }); // venit prin invitație, fără activitate încă
    expect(got.get("s-mia")).toMatchObject({ etapa: "cont", scor: 0 });
    const r2 = await refreshSignals(db, now);
    expect(r2.changed).toBe(0);
    expect(await refreshIfStale(db, new Date(now.getTime() + 10 * 60_000))).toBeNull();
    expect(await refreshIfStale(db, new Date(now.getTime() + 2 * 3600_000))).not.toBeNull();
  });
});
