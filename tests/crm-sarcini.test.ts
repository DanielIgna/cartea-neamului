import { describe, expect, it } from "vitest";
import { createDb } from "@/db";
import { runMigrations } from "@/db/migrate";
import { crmSends, crmTasks } from "@/db/schema";
import { upsertOrg } from "@/lib/crm";
import { todayList } from "@/lib/crm-admin";
import { CampaignInput, createCampaign, runCampaignBatch, saveTemplate, setCampaignStatus, trackSend } from "@/lib/crm-campanii";
import { ingest } from "@/lib/crm-ingest";
import { addTask, closeCallTasks, closeTask, dueFrom, dueTasks, morningDigest, roDayEnd, runMorningDigest } from "@/lib/crm-sarcini";

// Miercuri 18.11.2026, 10:00 în România.
const wed = new Date("2026-11-18T08:00:00Z");
const DAY = 86_400_000;

describe("termenele", () => {
  it("azi, mâine, joi, luni, +30, dată aleasă (ora 09:00 în România)", () => {
    expect(dueFrom("azi", null, wed)!.toISOString()).toBe("2026-11-18T07:00:00.000Z");
    expect(dueFrom("maine", null, wed)!.toISOString()).toBe("2026-11-19T07:00:00.000Z");
    expect(dueFrom("joi", null, wed)!.toISOString()).toBe("2026-11-19T07:00:00.000Z");
    expect(dueFrom("luni", null, wed)!.toISOString()).toBe("2026-11-23T07:00:00.000Z");
    expect(dueFrom("30", null, wed)!.toISOString()).toBe("2026-12-18T07:00:00.000Z");
    expect(dueFrom("maine", "2026-12-01", wed)!.toISOString()).toBe("2026-12-01T07:00:00.000Z");
    expect(dueFrom("nimic", null, wed)).toBeNull();
    expect(roDayEnd(wed).toISOString()).toBe("2026-11-18T21:59:59.999Z");
  });
});

describe("sarcinile în „Azi”", () => {
  it("apar din ziua termenului, restantele marcate; „Făcut” le scoate", async () => {
    const db = createDb();
    await runMigrations(db);
    const o = await upsertOrg(db, { tip: "firma", nume: "Firma X", emailOficial: "office@x.ro" });
    await addTask(db, { organizationId: o.id, titlu: "Sună joi", scadenta: dueFrom("joi", null, wed)! }, wed);
    const late = await addTask(db, { organizationId: o.id, titlu: "Trimite oferta", scadenta: new Date(wed.getTime() - 2 * DAY) }, wed);
    expect((await dueTasks(db, wed)).map((t) => [t.titlu, t.restanta])).toEqual([["Trimite oferta", true]]);
    expect((await dueTasks(db, new Date(wed.getTime() + DAY))).map((t) => t.titlu)).toEqual(["Trimite oferta", "Sună joi"]);
    const items = await todayList(db, wed);
    expect(items[0]).toMatchObject({ kind: "sarcina", late: true, detail: "Trimite oferta" });
    await closeTask(db, late!, "facuta", null, wed);
    expect(await dueTasks(db, wed)).toHaveLength(0);
  });

  it("automat: „de sunat” la școala cu email nelivrat (o dată), „Răspunde” la un răspuns pozitiv", async () => {
    const db = createDb();
    await runMigrations(db);
    const s = await upsertOrg(db, { tip: "scoala", nume: "Școala Y", emailOficial: "s@y.ro" });
    await upsertOrg(db, { tip: "firma", nume: "Firma Z", emailOficial: "o@z.ro" });
    await ingest(db, [{ id: "n1", type: "email_nelivrat", email: "s@y.ro" }, { id: "n2", type: "email_nelivrat", email: "o@z.ro" }], wed);
    // Și un nelivrat din campanie pentru aceeași școală: tot o singură sarcină.
    const tpl = await saveTemplate(db, { nume: "T", tipOrg: null, subiect: "S {organizatie}", corp: "Text destul de lung pentru șablon.", butonText: null, butonCale: null }, null);
    const c = await createCampaign(db, CampaignInput.parse({ nume: "Camp", templateId: tpl, statusuri: ["nou", "nelivrat"] }), null);
    await setCampaignStatus(db, c, "pornita", wed);
    await runCampaignBatch(db, { now: wed, mailer: async () => ({ ok: true, id: "re" }), dailyCap: 5, ignoreClock: true });
    const [send] = await db.select().from(crmSends);
    if (send) await trackSend(db, send.id, "nelivrat", wed);
    let tasks = await db.select().from(crmTasks);
    expect(tasks.filter((t) => t.sursa === "nelivrat")).toHaveLength(1); // doar școala, o singură dată
    // În „Azi” școala apare ca sarcină, nu încă o dată ca „de sunat”.
    const items = await todayList(db, wed);
    expect(items.filter((i) => i.title === "Școala Y")).toHaveLength(1);
    await closeCallTasks(db, s.id, null, wed);
    await ingest(db, { id: "r1", type: "raspuns", email: "o@z.ro", rezumat: "Suntem interesați, trimiteți-ne oferta", clasificare: "interesat" }, wed);
    await ingest(db, { id: "r1", type: "raspuns", email: "o@z.ro", rezumat: "Suntem interesați, trimiteți-ne oferta", clasificare: "interesat" }, wed);
    tasks = await db.select().from(crmTasks);
    expect(tasks.filter((t) => t.sursa === "raspuns")).toHaveLength(1);
    expect(tasks.find((t) => t.sursa === "nelivrat")!.status).toBe("facuta");
  });
});

describe("rezumatul de dimineață", () => {
  it("o dată pe zi, doar dacă e ceva de făcut, fără email real", async () => {
    const db = createDb();
    await runMigrations(db);
    const sent: { to: string; subject: string; text: string }[] = [];
    const send = async (to: string, subject: string, text: string) => { sent.push({ to, subject, text }); return true; };
    expect((await runMorningDigest(db, { now: wed, to: "admin@test.ro", send })).sent).toBe(false); // nimic de făcut
    const o = await upsertOrg(db, { tip: "firma", nume: "Firma X", emailOficial: "office@x.ro" });
    await addTask(db, { organizationId: o.id, titlu: "Sună la Firma X", scadenta: wed }, wed);
    const d = await morningDigest(db, wed);
    expect(d.text).toContain("Sună la Firma X");
    expect(d.subject).toMatch(/1 sarcini/);
    expect((await runMorningDigest(db, { now: wed, to: "admin@test.ro", send })).sent).toBe(true);
    expect((await runMorningDigest(db, { now: new Date(wed.getTime() + 3600_000), to: "admin@test.ro", send })).sent).toBe(false);
    expect(sent).toHaveLength(1);
    expect(sent[0].to).toBe("admin@test.ro");
  });
});
