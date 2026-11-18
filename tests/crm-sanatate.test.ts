import { describe, expect, it } from "vitest";
import { createDb } from "@/db";
import { runMigrations } from "@/db/migrate";
import { automationRun, crmSends } from "@/db/schema";
import { upsertOrg } from "@/lib/crm";
import { CampaignInput, createCampaign, runCampaignBatch, saveTemplate, setCampaignStatus } from "@/lib/crm-campanii";
import { crmAudit } from "@/lib/crm-curatenie";
import { alertsFor, crmHealth, runCrmAlerts } from "@/lib/crm-sanatate";

const now = new Date("2026-11-18T10:00:00Z");
const ago = (h: number) => new Date(now.getTime() - h * 3600_000);

describe("sănătatea CRM și alertele", () => {
  it("eroare de 2 ori la rând, nelivrate peste 5%, „nu contacta”; fiecare alertă o singură dată", async () => {
    const db = createDb();
    await runMigrations(db);
    const sent: { to: string; subject: string; text: string }[] = [];
    const send = async (to: string, subject: string, text: string) => { sent.push({ to, subject, text }); return true; };
    expect((await runCrmAlerts(db, { now, to: "a@test.ro", send })).sent).toBe(false);

    await db.insert(automationRun).values([
      { automation: "crm-gmail", trigger: "ceas", status: "eroare", note: "legătura cu Gmail a expirat", startedAt: ago(30) },
      { automation: "crm-gmail", trigger: "ceas", status: "eroare", note: "legătura cu Gmail a expirat", startedAt: ago(5) },
      { automation: "crm-campanii", trigger: "ceas", status: "eroare", note: "x", startedAt: ago(4) },
      { automation: "crm-campanii", trigger: "ceas", status: "ok", note: "ok", startedAt: ago(2) },
    ]);
    const tpl = await saveTemplate(db, { nume: "T", tipOrg: null, subiect: "S", corp: "Text destul de lung pentru șablon.", butonText: null, butonCale: null }, null);
    const camp = await createCampaign(db, CampaignInput.parse({ nume: "Camp", templateId: tpl }), null);
    for (let i = 0; i < 20; i++) {
      const o = await upsertOrg(db, { tip: "scoala", nume: `S${i}`, emailOficial: `s@s${i}.ro` });
      await db.insert(crmSends).values({ campaignId: camp, organizationId: o.id, email: `s@s${i}.ro`, sentAt: ago(48), bouncedAt: i < 2 ? ago(47) : null, status: i < 2 ? "nelivrat" : "livrat" });
    }
    await crmAudit(db, null, "trimitere oprită (nu contacta)", "crm-campanie", null, ago(1));

    const h = await crmHealth(db, now);
    expect(h.runs.find((r) => r.key === "crm-gmail")!.twoFails).toBe(true);
    expect(h.runs.find((r) => r.key === "crm-campanii")!.twoFails).toBe(false);
    expect(h.bounce).toMatchObject({ sent: 20, bounced: 2, rate: 10, high: true });
    expect(h.blocked).toBe(1);
    expect(h.errors).toHaveLength(2);
    expect(alertsFor(h, now)).toHaveLength(3);

    const r1 = await runCrmAlerts(db, { now, to: "a@test.ro", send });
    expect(r1).toMatchObject({ alerts: 3, sent: true });
    expect(sent[0].text).toContain("de 2 ori la rând");
    expect(sent[0].text).toContain("10%");
    expect(sent[0].text).toContain("Nu contacta");
    expect((await runCrmAlerts(db, { now: new Date(now.getTime() + 3600_000), to: "a@test.ro", send })).sent).toBe(false);
    expect(sent).toHaveLength(1);
  });

  it("sub 20 de emailuri trimise, nelivratele nu dau alertă", async () => {
    const db = createDb();
    await runMigrations(db);
    const tpl = await saveTemplate(db, { nume: "T", tipOrg: null, subiect: "S", corp: "Text destul de lung pentru șablon.", butonText: null, butonCale: null }, null);
    const camp = await createCampaign(db, CampaignInput.parse({ nume: "Camp", templateId: tpl }), null);
    const o = await upsertOrg(db, { tip: "scoala", nume: "S", emailOficial: "s@s.ro" });
    await db.insert(crmSends).values({ campaignId: camp, organizationId: o.id, email: "s@s.ro", sentAt: ago(5), bouncedAt: ago(4), status: "nelivrat" });
    const h = await crmHealth(db, now);
    expect(h.bounce).toMatchObject({ rate: 100, high: false });
    expect(alertsFor(h, now)).toHaveLength(0);
  });
});

describe("proba cu adresă de test", () => {
  it("cu CRM_TEST_RECIPIENT, campania trimite doar la adresa de test", async () => {
    const db = createDb();
    await runMigrations(db);
    const tpl = await saveTemplate(db, { nume: "T", tipOrg: null, subiect: "Salut {organizatie}", corp: "Text destul de lung pentru șablon.", butonText: null, butonCale: null }, null);
    const camp = await createCampaign(db, CampaignInput.parse({ nume: "Camp", templateId: tpl }), null);
    await setCampaignStatus(db, camp, "pornita", now);
    await upsertOrg(db, { tip: "scoala", nume: "Școala Q", emailOficial: "q@q.ro" });
    const got: { to: string | string[]; subject: string }[] = [];
    process.env.CRM_TEST_RECIPIENT = "proba@test.ro";
    try {
      await runCampaignBatch(db, { now, mailer: async (m) => { got.push(m); return { ok: true, id: "re1" }; }, dailyCap: 5, ignoreClock: true });
    } finally {
      delete process.env.CRM_TEST_RECIPIENT;
    }
    expect(got).toHaveLength(1);
    expect(got[0].to).toBe("proba@test.ro");
    expect(got[0].subject).toContain("q@q.ro");
  });
});
