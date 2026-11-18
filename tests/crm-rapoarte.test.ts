import { describe, expect, it } from "vitest";
import { createDb } from "@/db";
import { runMigrations } from "@/db/migrate";
import { addActivity, setOrgStatus, upsertOrg } from "@/lib/crm";
import { CampaignInput, createCampaign, runCampaignBatch, saveTemplate, setCampaignStatus } from "@/lib/crm-campanii";
import { ingest } from "@/lib/crm-ingest";
import { funnel, rate, templateStats } from "@/lib/crm-rapoarte";

const wed = new Date("2026-11-18T08:00:00Z");

describe("rapoartele", () => {
  it("pâlnia cu filtre și rezultatele pe șablon", async () => {
    const db = createDb();
    await runMigrations(db);
    for (let i = 1; i <= 4; i++) await upsertOrg(db, { tip: "scoala", nume: `Școala ${i}`, localitate: "Dej", judet: "CJ", emailOficial: `s@s${i}.ro` });
    await upsertOrg(db, { tip: "firma", nume: "Firma", localitate: "Arad", judet: "AR", emailOficial: "o@f.ro" });
    const a = await saveTemplate(db, { nume: "Varianta A", tipOrg: "scoala", subiect: "A {organizatie}", corp: "Textul variantei A, destul de lung.", butonText: null, butonCale: null }, null);
    const b = await saveTemplate(db, { nume: "Varianta B", tipOrg: null, subiect: "B", corp: "Textul variantei B, destul de lung.", butonText: null, butonCale: null }, null);
    const ca = await createCampaign(db, CampaignInput.parse({ nume: "Școli", templateId: a, tip: "scoala" }), null);
    const cb = await createCampaign(db, CampaignInput.parse({ nume: "Firme", templateId: b, tip: "firma" }), null);
    for (const c of [ca, cb]) await setCampaignStatus(db, c, "pornita", wed);
    let k = 0;
    await runCampaignBatch(db, { now: wed, mailer: async () => ({ ok: true, id: `re${++k}` }), dailyCap: 20 });
    const later = new Date(wed.getTime() + 3600_000);
    await ingest(db, [
      { id: "r1", type: "raspuns", email: "s@s1.ro", rezumat: "Suntem interesați", clasificare: "interesat" },
      { id: "r2", type: "raspuns", email: "s@s2.ro", rezumat: "Cât costă?", clasificare: "intrebare" },
      { id: "r3", type: "raspuns", email: "s@s3.ro", rezumat: "Absent", clasificare: "automat" },
    ], later);
    const [o1] = (await db.execute(`select id from crm_organizations where email_oficial = 's@s1.ro'`)).rows as { id: string }[];
    await addActivity(db, { tip: "plata", organizationId: o1.id, at: new Date(wed.getTime() + 2 * 3600_000), externalId: "plata:x" });
    await setOrgStatus(db, o1.id, "client");

    const all = await funnel(db);
    expect(all).toMatchObject({ contactat: 5, raspuns: 2, interesat: 1, client: 1 });
    expect(all.rates.raspuns).toBe(40);
    expect((await funnel(db, { tip: "firma" })).contactat).toBe(1);
    expect((await funnel(db, { judet: "CJ" })).contactat).toBe(4);
    expect((await funnel(db, { localitate: "dej" })).contactat).toBe(4);
    expect((await funnel(db, { luna: "2026-11" })).contactat).toBe(5);
    expect((await funnel(db, { luna: "2026-10" })).contactat).toBe(0);
    expect((await funnel(db, { campanie: cb })).contactat).toBe(1);

    const t = new Map((await templateStats(db)).map((x) => [x.nume, x]));
    expect(t.get("Varianta A")).toMatchObject({ trimise: 4, raspunsuri: 2, pozitive: 1, clienti: 1, rataRaspuns: 50, rataPozitiv: 25 });
    expect(t.get("Varianta B")).toMatchObject({ trimise: 1, raspunsuri: 0 });
    expect(rate(1, 3)).toBe(33.3);
  });
});
