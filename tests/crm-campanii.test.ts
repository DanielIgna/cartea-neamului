import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { createDb } from "@/db";
import { runMigrations } from "@/db/migrate";
import { crmActivities, crmCampaigns, crmOrganizations, crmSends, crmSuppression } from "@/db/schema";
import { isSuppressed, suppress, upsertOrg } from "@/lib/crm";
import {
  CampaignInput, buildCampaignMail, campaignList, createCampaign, inWindow, resendEvent, roClock, roDayStart, runCampaignBatch, saveTemplate,
  sendByResendId, setCampaignStatus, sitePath, trackSend, verifyResendWebhook, type CampaignMailer,
} from "@/lib/crm-campanii";
import { ingest } from "@/lib/crm-ingest";

// Miercuri, 18.11.2026, 10:00 în România (08:00 UTC).
const wed = new Date("2026-11-18T08:00:00Z");
const sat = new Date("2026-11-21T08:00:00Z");
const DAY = 86_400_000;

function fakeMailer() {
  const sent: Parameters<CampaignMailer>[0][] = [];
  let n = 0;
  const mailer: CampaignMailer = async (m) => { sent.push(m); return { ok: true, id: `re_${++n}` }; };
  return { sent, mailer };
}

async function setup(orgs = 5) {
  const db = createDb();
  await runMigrations(db);
  for (let i = 1; i <= orgs; i++) await upsertOrg(db, { tip: "scoala", nume: `Școala ${i}`, localitate: "Cluj-Napoca", judet: "CJ", emailOficial: `secretariat@scoala${i}.ro` });
  const tpl = await saveTemplate(db, { nume: "Prima", tipOrg: "scoala", subiect: "Proiect pentru {organizatie}", corp: "Bună ziua,\n\nPentru elevii din {localitate} avem fișe gratuite.", butonText: "Vedeți fișele", butonCale: "/scoala" }, null);
  const fu = await saveTemplate(db, { nume: "Revenire", tipOrg: "scoala", subiect: "Revin: {organizatie}", corp: "Bună ziua,\n\nRevin cu un singur mesaj, apoi nu vă mai scriu.", butonText: null, butonCale: null }, null);
  return { db, tpl, fu };
}
const input = (templateId: string, extra: object = {}) => CampaignInput.parse({ nume: "Test", templateId, tip: "scoala", limitaZi: 20, ...extra });

describe("ceasul României", () => {
  it("ziua, ora, fereastra și începutul zilei", () => {
    expect(roClock(wed)).toMatchObject({ weekday: 3, hour: 10, date: "2026-11-18" });
    expect(roClock(sat).weekday).toBe(6);
    expect(roClock(new Date("2026-07-01T06:00:00Z")).hour).toBe(9); // vara: UTC+3
    expect(inWindow({ oraStart: 9, oraSfarsit: 16 }, wed)).toBe(true);
    expect(inWindow({ oraStart: 11, oraSfarsit: 16 }, wed)).toBe(false);
    expect(roDayStart(wed).toISOString()).toBe("2026-11-17T22:00:00.000Z");
  });
  it("linkurile de click duc doar în site", () => {
    expect(sitePath("/scoala?src=x")).toBe("/scoala?src=x");
    expect(sitePath("//rau.ro")).toBe("/");
    expect(sitePath("https://rau.ro")).toBe("/");
  });
});

describe("trimiterea campaniei", () => {
  it("nimic fără campanie pornită, în weekend sau în afara ferestrei", async () => {
    const { db, tpl } = await setup(2);
    const { sent, mailer } = fakeMailer();
    const id = await createCampaign(db, input(tpl), null);
    expect((await runCampaignBatch(db, { now: wed, mailer, dailyCap: 20 })).sent).toBe(0); // ciornă
    await setCampaignStatus(db, id, "pornita", wed);
    expect((await runCampaignBatch(db, { now: sat, mailer, dailyCap: 20 })).skipped).toMatch(/weekend/);
    expect((await runCampaignBatch(db, { now: new Date("2026-11-18T16:00:00Z"), mailer, dailyCap: 20 })).sent).toBe(0); // 18:00
    expect(sent).toHaveLength(0);
  });

  it("limita pe zi, o singură dată pe organizație, „nu contacta” sărit, activitate și dezabonare în fiecare email", async () => {
    const { db, tpl } = await setup(5);
    await suppress(db, "secretariat@scoala2.ro", "refuz");
    const { sent, mailer } = fakeMailer();
    const id = await createCampaign(db, input(tpl, { limitaZi: 2 }), null);
    await setCampaignStatus(db, id, "pornita", wed);
    const r1 = await runCampaignBatch(db, { now: wed, mailer, dailyCap: 20 });
    expect(r1.sent).toBe(2);
    expect((await runCampaignBatch(db, { now: new Date(wed.getTime() + 3600_000), mailer, dailyCap: 20 })).sent).toBe(0); // limita campaniei pe azi
    const r2 = await runCampaignBatch(db, { now: new Date(wed.getTime() + DAY), mailer, dailyCap: 20 });
    expect(r2.sent).toBe(2);
    expect((await runCampaignBatch(db, { now: new Date(wed.getTime() + 2 * DAY), mailer, dailyCap: 20 })).finished).toBe(1);
    const to = sent.map((m) => m.to).sort();
    expect(to).toEqual(["secretariat@scoala1.ro", "secretariat@scoala3.ro", "secretariat@scoala4.ro", "secretariat@scoala5.ro"]);
    expect(new Set(to).size).toBe(4);
    const m = sent[0];
    expect(m.marketing).toBe(true);
    expect(m.subject).toMatch(/^Proiect pentru Școala \d$/);
    expect(m.text).toContain("Cluj-Napoca");
    expect(m.text).toContain("/dezabonare-organizatie?d=");
    expect(m.html).toContain("/api/crm/o?d=");
    expect(m.html).toContain("/api/crm/c?d=");
    expect(m.headers["List-Unsubscribe-Post"]).toBe("List-Unsubscribe=One-Click");
    const acts = await db.select().from(crmActivities).where(eq(crmActivities.tip, "email_trimis"));
    expect(acts).toHaveLength(4);
    const [o1] = await db.select().from(crmOrganizations).where(eq(crmOrganizations.emailOficial, "secretariat@scoala1.ro"));
    expect(o1.status).toBe("contactat");
    // O campanie nouă nu le mai scrie celor care au primit deja.
    const id2 = await createCampaign(db, input(tpl), null);
    await setCampaignStatus(db, id2, "pornita", wed);
    expect((await runCampaignBatch(db, { now: new Date(wed.getTime() + 7 * DAY), mailer, dailyCap: 20 })).sent).toBe(0);
  });

  it("limita totală pe zi se aplică peste toate campaniile", async () => {
    const { db, tpl } = await setup(6);
    const { mailer } = fakeMailer();
    for (const n of ["Camp A", "Camp B"]) {
      const id = await createCampaign(db, input(tpl, { nume: n, limitaZi: 10 }), null);
      await setCampaignStatus(db, id, "pornita", wed);
    }
    expect((await runCampaignBatch(db, { now: wed, mailer, dailyCap: 3 })).sent).toBe(3);
    expect((await runCampaignBatch(db, { now: wed, mailer, dailyCap: 3 })).skipped).toMatch(/limita/);
  });

  it("dacă trimiterea e oprită de „nu contacta” la ultimul pas, rândul rămâne „blocat” și nu se scrie nimic la organizație", async () => {
    const { db, tpl } = await setup(1);
    const id = await createCampaign(db, input(tpl), null);
    await setCampaignStatus(db, id, "pornita", wed);
    const r = await runCampaignBatch(db, { now: wed, mailer: async () => ({ skipped: true }), dailyCap: 20 });
    expect(r).toMatchObject({ sent: 0, blocked: 1 });
    const [s] = await db.select().from(crmSends);
    expect(s.status).toBe("blocat");
    expect(await db.select().from(crmActivities)).toHaveLength(0);
  });

  it("organizațiile cărora le-ai scris din afară sunt sărite, dacă nu ceri altfel", async () => {
    const { db, tpl } = await setup(2);
    await ingest(db, { id: "x1", type: "email_trimis", email: "secretariat@scoala1.ro", subiect: "Salut" }, wed);
    const { sent, mailer } = fakeMailer();
    const id = await createCampaign(db, input(tpl, { statusuri: ["nou", "contactat"] }), null);
    await setCampaignStatus(db, id, "pornita", wed);
    await runCampaignBatch(db, { now: wed, mailer, dailyCap: 20 });
    expect(sent.map((m) => m.to)).toEqual(["secretariat@scoala2.ro"]);
  });
});

describe("urmărirea", () => {
  async function oneSent() {
    const { db, tpl, fu } = await setup(1);
    const { sent, mailer } = fakeMailer();
    const id = await createCampaign(db, input(tpl, { followUpZile: 7, followUpTemplateId: fu }), null);
    await setCampaignStatus(db, id, "pornita", wed);
    await runCampaignBatch(db, { now: wed, mailer, dailyCap: 20 });
    const [s] = await db.select().from(crmSends);
    return { db, s, sent, mailer, id };
  }

  it("livrat → deschis → click, câte o activitate pe tip", async () => {
    const { db, s } = await oneSent();
    expect(await sendByResendId(db, "re_1")).toBe(s.id);
    await trackSend(db, s.id, "livrat", wed);
    await trackSend(db, s.id, "deschis", wed);
    await trackSend(db, s.id, "deschis", wed);
    await trackSend(db, s.id, "click", wed);
    await trackSend(db, s.id, "click", wed);
    const [x] = await db.select().from(crmSends);
    expect(x).toMatchObject({ status: "click", clicks: 2 });
    expect(x.deliveredAt && x.openedAt && x.clickedAt).toBeTruthy();
    const tips = (await db.select().from(crmActivities)).map((a) => a.tip).sort();
    expect(tips).toEqual(["email_click", "email_deschis", "email_livrat", "email_trimis"]);
  });

  it("dezabonarea pune adresa și organizația pe „nu contacta”", async () => {
    const { db, s } = await oneSent();
    await trackSend(db, s.id, "dezabonat", wed);
    expect(await isSuppressed(db, s.email)).toBe(true);
    const [o] = await db.select().from(crmOrganizations);
    expect(o.status).toBe("nu_contacta");
  });

  it("nelivrat dur → „nu contacta” (nelivrat) + de sunat; temporar → doar notă", async () => {
    const { db, s } = await oneSent();
    await trackSend(db, s.id, "nelivrat", wed, { soft: true });
    expect(await isSuppressed(db, s.email)).toBe(false);
    await trackSend(db, s.id, "nelivrat", wed);
    const [sup] = await db.select().from(crmSuppression);
    expect(sup.motiv).toBe("nelivrat");
    const [o] = await db.select().from(crmOrganizations);
    expect(o).toMatchObject({ status: "nelivrat", deSunat: true });
  });

  it("follow-up o singură dată, după zilele setate, doar dacă n-a răspuns", async () => {
    const { db, sent, mailer } = await oneSent();
    const day = (n: number) => new Date(wed.getTime() + n * DAY);
    expect((await runCampaignBatch(db, { now: day(6), mailer, dailyCap: 20 })).sent).toBe(0);
    expect((await runCampaignBatch(db, { now: day(7), mailer, dailyCap: 20 })).followUps).toBe(1);
    expect(sent[1].subject).toMatch(/^Revin/);
    expect((await runCampaignBatch(db, { now: day(14), mailer, dailyCap: 20 })).sent).toBe(0);
    // Statisticile campaniei
    const [c] = await campaignList(db);
    expect(c).toMatchObject({ trimise: 2, ramase: 0 });
  });

  it("cine a răspuns nu primește follow-up", async () => {
    const { db, mailer } = await oneSent();
    await ingest(db, { id: "r1", type: "raspuns", email: "secretariat@scoala1.ro", rezumat: "Mulțumim, ne gândim", clasificare: "intrebare" }, new Date(wed.getTime() + DAY));
    const [s] = await db.select().from(crmSends);
    expect(s.repliedAt).not.toBeNull();
    expect((await runCampaignBatch(db, { now: new Date(wed.getTime() + 8 * DAY), mailer, dailyCap: 20 })).sent).toBe(0);
  });

  it("fără follow-up setat, campania se termină după primul email", async () => {
    const { db, tpl } = await setup(1);
    const { mailer } = fakeMailer();
    const id = await createCampaign(db, input(tpl), null);
    await setCampaignStatus(db, id, "pornita", wed);
    await runCampaignBatch(db, { now: wed, mailer, dailyCap: 20 });
    await runCampaignBatch(db, { now: new Date(wed.getTime() + DAY), mailer, dailyCap: 20 });
    const [c] = await db.select().from(crmCampaigns);
    expect(c.status).toBe("terminata");
  });
});

describe("webhook-ul Resend", () => {
  const secret = `whsec_${Buffer.from("cheie-de-test-1234567890").toString("base64")}`;
  const sign = (id: string, ts: string, body: string) => `v1,${createHmac("sha256", Buffer.from("cheie-de-test-1234567890")).update(`${id}.${ts}.${body}`).digest("base64")}`;
  it("semnătura corectă trece, cea greșită sau veche nu", () => {
    const body = JSON.stringify({ type: "email.delivered", data: { email_id: "re_1" } });
    const ts = String(Math.floor(wed.getTime() / 1000));
    expect(verifyResendWebhook(body, { id: "msg_1", timestamp: ts, signature: sign("msg_1", ts, body) }, secret, wed)).toBe(true);
    expect(verifyResendWebhook(body + " ", { id: "msg_1", timestamp: ts, signature: sign("msg_1", ts, body) }, secret, wed)).toBe(false);
    expect(verifyResendWebhook(body, { id: "msg_1", timestamp: ts, signature: sign("msg_1", ts, body) }, secret, new Date(wed.getTime() + 600_000))).toBe(false);
    expect(verifyResendWebhook(body, { id: "msg_1", timestamp: ts, signature: sign("msg_1", ts, body) }, undefined, wed)).toBe(false);
  });
  it("evenimentele", () => {
    expect(resendEvent({ type: "email.bounced", data: { email_id: "a", bounce: { type: "Permanent" } } })).toEqual({ resendId: "a", ev: "nelivrat", soft: false });
    expect(resendEvent({ type: "email.bounced", data: { email_id: "a", bounce: { type: "Transient" } } })?.soft).toBe(true);
    expect(resendEvent({ type: "email.complained", data: { email_id: "a" } })?.ev).toBe("dezabonat");
    expect(resendEvent({ type: "email.sent", data: { email_id: "a" } })).toBeNull();
  });
});

describe("textul", () => {
  it("linkul butonului poartă sursa organizației", async () => {
    const m = await buildCampaignMail({ subiect: "S", corp: "Text despre {organizatie}.", butonText: "Vezi", butonCale: "/scoala" },
      { id: "o", tip: "scoala", nume: "Școala 9", localitate: null, judet: null, email: "a@b.ro", slug: "scoala-9" }, "11111111-1111-1111-1111-111111111111", "camp1234");
    expect(decodeURIComponent(m.html)).toContain("/scoala?src=scoala-scoala-9");
    expect(m.text).toContain("Text despre Școala 9.");
  });
});
