import { describe, expect, it } from "vitest";
import { createDb } from "@/db";
import { runMigrations } from "@/db/migrate";
import { appSetting, automationMark, consent, conversionMail, person, relationship, session, tree, treeMember, user } from "@/db/schema";
import { messageFor, pickRule, planActivity, runActivityMessages, type ActivityFacts, type Rule } from "@/lib/mesaje-activitate";
import { leadScore, suggestedMessage, trialLeads } from "@/lib/invatare";

const now = new Date("2026-11-25T10:00:00Z");
const DAY = 86_400_000;
const base: ActivityFacts = { persons: 0, invites: 0, photos: 0, ageDays: 0, idleDays: 0, inTrial: true, missingGrandparents: null, story: null };
const none = new Set<Rule>();

describe("regulile (pure)", () => {
  it("fiecare regulă la semnalul ei, în ordine, o singură dată", () => {
    expect(pickRule({ ...base, ageDays: 0, persons: 1 }, none, null, now)).toBeNull(); // în prima zi, nimic
    expect(pickRule({ ...base, ageDays: 1, persons: 2 }, none, null, now)).toBe("inceput");
    expect(pickRule({ ...base, ageDays: 1, persons: 2, inTrial: false }, none, null, now)).toBeNull();
    expect(pickRule({ ...base, ageDays: 3, persons: 6 }, none, null, now)).toBe("rude");
    expect(pickRule({ ...base, ageDays: 3, persons: 6 }, new Set<Rule>(["rude"]), null, now)).toBeNull();
    expect(pickRule({ ...base, ageDays: 9, persons: 12, invites: 1, missingGrandparents: 2 }, none, null, now)).toBe("bunici");
    expect(pickRule({ ...base, ageDays: 9, persons: 12, invites: 1, missingGrandparents: 0 }, none, null, now)).toBe("poze");
    expect(pickRule({ ...base, ageDays: 9, persons: 12, invites: 1, missingGrandparents: 0, photos: 2 }, none, null, now)).toBeNull();
  });
  it("povestea: doar după 3–21 de zile fără intrare, cel mult o dată la 30 de zile", () => {
    const story = { treeId: "t", personId: "p", given: "Toader", name: "Toader Pop", sex: "M", year: 1871, place: "Ieud", bio: null };
    const f = { ...base, inTrial: false, ageDays: 40, persons: 8, invites: 1, photos: 2, story };
    expect(pickRule({ ...f, idleDays: 2 }, none, null, now)).toBeNull();
    expect(pickRule({ ...f, idleDays: 3 }, none, null, now)).toBe("poveste");
    expect(pickRule({ ...f, idleDays: 22 }, none, null, now)).toBeNull();
    expect(pickRule({ ...f, idleDays: 5 }, none, new Date(now.getTime() - 10 * DAY), now)).toBeNull();
    expect(pickRule({ ...f, idleDays: 5 }, none, new Date(now.getTime() - 31 * DAY), now)).toBe("poveste");
  });
  it("textele: în română și în engleză, fără AI și fără limbaj religios", () => {
    const story = { treeId: "t", personId: "p", given: "Ana", name: "Ana Pop", sex: "F", year: 1890, place: "Ieud", bio: "Țesea covoare." };
    const f = { ...base, persons: 12, missingGrandparents: 1, story };
    for (const r of ["inceput", "rude", "bunici", "poze", "poveste"] as Rule[]) for (const l of ["ro", "it"]) {
      const m = messageFor(r, l, "Maria Ionescu", f, "tree-1");
      expect(m.subject.length).toBeGreaterThan(5);
      expect(m.paragraphs.join(" ")).not.toMatch(/\bAI\b|inteligen|biseric|Dumnez|God/);
      expect(m.path.startsWith("/arbore/")).toBe(true);
    }
    expect(messageFor("poveste", "ro", "Maria", f, "tree-1").paragraphs.join(" ")).toContain("Ana Pop, născută pe la 1890 în Ieud");
    expect(messageFor("poveste", "ro", "Maria", f, "tree-1").path).toBe("/arbore/t/persoana/p");
    expect(messageFor("bunici", "ro", "Maria", f, "tree-1").paragraphs.join(" ")).toContain("un bunic");
    expect(messageFor("rude", "de", "Max", f, null).subject).toBe("Who in the family knows more?");
  });
});

async function setup() {
  const db = createDb();
  await runMigrations(db);
  // Plățile pornite cu o lună în urmă, 7 zile gratuite.
  await db.insert(appSetting).values({ key: "planuri", value: { on: true, startedAt: new Date(now.getTime() - 60 * DAY).toISOString(), trialDays: 7, betaDays: 0 } })
    .onConflictDoUpdate({ target: appSetting.key, set: { value: { on: true, startedAt: new Date(now.getTime() - 60 * DAY).toISOString(), trialDays: 7, betaDays: 0 } } });
  const mkUser = async (id: string, daysAgo: number, news: boolean, idle: number | null) => {
    await db.insert(user).values({ id, name: `Om ${id}`, email: `${id}@exemplu.ro`, locale: "ro", createdAt: new Date(now.getTime() - daysAgo * DAY) });
    if (news) await db.insert(consent).values({ userId: id, purpose: "news", textVersion: "1", granted: true });
    if (idle != null) await db.insert(session).values({ id: `s-${id}`, token: `t-${id}`, userId: id, expiresAt: new Date(now.getTime() + 9 * DAY), updatedAt: new Date(now.getTime() - idle * DAY) });
    const [t] = await db.insert(tree).values({ name: `Arbore ${id}`, ownerId: id }).returning();
    await db.insert(treeMember).values({ treeId: t.id, userId: id, role: "owner" });
    return t.id;
  };
  const addPeople = async (treeId: string, count: number, o: { claimedBy?: string; oldest?: boolean } = {}) => {
    const ids: string[] = [];
    for (let i = 0; i < count; i++) {
      const [p] = await db.insert(person).values({ treeId, givenName: `P${i}`, surname: "Pop", living: i === 0, birthFrom: o.oldest && i === count - 1 ? "1871-01-01" : null,
        birthPlace: o.oldest && i === count - 1 ? "Ieud" : null, claimedByUserId: i === 0 ? o.claimedBy ?? null : null }).returning();
      ids.push(p.id);
    }
    return ids;
  };
  return { db, mkUser, addPeople };
}

describe("cine primește ce (fără email real)", () => {
  it("regulile pe conturi reale, doar cu acord, o dată; cine a primit azi alt email e lăsat pe mâine", async () => {
    const { db, mkUser, addPeople } = await setup();
    await addPeople(await mkUser("nou", 2, true, 0), 1);                  // în zilele gratuite, 1 persoană → inceput
    await addPeople(await mkUser("fara-acord", 2, false, 0), 1);          // fără acord → nimic
    const tRude = await mkUser("rude", 20, true, 0);
    await addPeople(tRude, 6);                                            // 6 persoane, fără invitații → rude
    const tBunici = await mkUser("bunici", 30, true, 0);
    const ids = await addPeople(tBunici, 11, { claimedBy: "bunici" });
    await db.insert(relationship).values({ treeId: tBunici, type: "parent_child", personA: ids[1], personB: ids[0] });
    await db.insert(relationship).values({ treeId: tBunici, type: "parent_child", personA: ids[2], personB: ids[1] });
    await db.insert(automationMark).values({ automation: "mesaje-activitate", ref: "bunici:rude", at: now });  // a primit deja „rude” (azi, deci e și „ocupat”)
    const tPov = await mkUser("poveste", 50, true, 6);
    await addPeople(tPov, 4, { oldest: true });
    await db.insert(automationMark).values({ automation: "mesaje-activitate", ref: "poveste:rude", at: new Date(now.getTime() - 9 * DAY) });
    const tBusy = await mkUser("ocupat", 2, true, 0);
    await addPeople(tBusy, 1);
    await db.insert(conversionMail).values({ id: crypto.randomUUID(), userId: "ocupat", step: "bunvenit", sentAt: new Date(now.getTime() - 3_600_000) });

    const plan = await planActivity(db, now);
    const got = Object.fromEntries(plan.planned.map((p) => [p.userId, p.rule]));
    expect(got).toEqual({ nou: "inceput", rude: "rude", poveste: "poveste" });
    expect(plan.planned.find((p) => p.userId === "poveste")!.mail.paragraphs.join(" ")).toContain("pe la 1871 în Ieud");

    const sent: { to: string; subject: string; tag: string; marketing?: boolean; text: string; headers?: Record<string, string> }[] = [];
    const mailer = async (m: (typeof sent)[number]) => { sent.push(m); return { ok: true }; };
    const r = await runActivityMessages(db, { now, mailer, siteUrl: "https://exemplu.test" });
    expect(r).toMatchObject({ sent: 3, failed: 0 });
    expect(sent.every((m) => m.marketing && m.tag.startsWith("activitate-") && m.headers?.["List-Unsubscribe"]?.includes("/api/vesti/dezabonare"))).toBe(true);
    expect(sent.find((m) => m.to === "nou@exemplu.ro")!.text).toContain("/dezabonare?u=nou");
    // A doua rulare în aceeași zi: nimic (fiecare a primit azi).
    expect((await runActivityMessages(db, { now, mailer })).sent).toBe(0);
    // Peste două zile: „bunici” primește acum regula lui (îi lipsesc 3 bunici); ceilalți nu mai au reguli noi.
    const later = new Date(now.getTime() + 2 * DAY);
    const p2 = await planActivity(db, later);
    expect(p2.planned.map((p) => [p.userId, p.rule])).toContainEqual(["bunici", "bunici"]);
    expect(p2.planned.find((p) => p.userId === "bunici")!.facts.missingGrandparents).toBe(3);
  });
});

describe("aproape de plată: și cei cu zilele gratuite terminate", () => {
  it("scorul pentru cei cu proba terminată de curând și mesajul lor", () => {
    const s = { persons: 12, invites: 1, photos: 3, memories: 1, activeDaysAgo: 1, daysLeft: 0, endedDaysAgo: 3 };
    expect(leadScore(s)).toMatchObject({ score: 100, tier: "aproape" });
    expect(leadScore({ ...s, endedDaysAgo: 20 }).score).toBe(90);
    const m = suggestedMessage("Ana Pop", s, 49);
    expect(m.subject).toBe("Arborele tău te așteaptă");
    expect(m.body).toContain("49 lei");
    expect(m.body).toContain("n-am șters nimic");
  });
  it("lista: în probă și cu proba terminată de cel mult 30 de zile, fără cei care au plătit", async () => {
    const { db, mkUser, addPeople } = await setup();
    await addPeople(await mkUser("proba", 3, true, 0), 4);
    await addPeople(await mkUser("terminat", 12, true, 1), 12);
    await addPeople(await mkUser("vechi", 45, true, 1), 12);
    const leads = await trialLeads(db, now);
    expect(leads.map((l) => [l.id, l.phase]).sort()).toEqual([["proba", "proba"], ["terminat", "expirat"]]);
    const t = leads.find((l) => l.id === "terminat")!;
    expect(t.endedDaysAgo).toBe(5);
    expect(t.offer).toBeNull();
  });
});
