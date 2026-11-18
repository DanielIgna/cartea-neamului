import { describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { createDb } from "@/db";
import { runMigrations } from "@/db/migrate";
import { auditLog, crmActivities, crmContacts, crmOrganizations, crmSuppression, crmTasks } from "@/db/schema";
import { addActivity, isSuppressed, upsertOrg } from "@/lib/crm";
import { addTask } from "@/lib/crm-sarcini";
import { crmAudit, exportCsv, findDuplicates, formDiff, gdprDeleteOrg, ignoreDuplicate, mergeOrgs, mergePreview, toCsv } from "@/lib/crm-curatenie";

const now = new Date("2026-11-18T10:00:00Z");

describe("dublurile", () => {
  it("găsite după domeniu și după nume + oraș; „nu sunt dubluri” le ascunde; unirea mută tot", async () => {
    const db = createDb();
    await runMigrations(db);
    const a = await upsertOrg(db, { tip: "scoala", nume: "Școala Gimnazială nr. 1", localitate: "Dej", emailOficial: "secretariat@scoala1dej.ro" });
    const b = await upsertOrg(db, { tip: "scoala", nume: "Scoala Gimnaziala Nr 1", localitate: "Dej", telefon: "0264 111 222" });
    const c = await upsertOrg(db, { tip: "firma", nume: "Firma X", emailOficial: "office@firmax.ro" });
    const d = await upsertOrg(db, { tip: "firma", nume: "Firma X Sucursala", emailOficial: "hr@firmax.ro" });
    await upsertOrg(db, { tip: "scoala", nume: "Școala Y", emailOficial: "scoalay@yahoo.com" });
    await upsertOrg(db, { tip: "scoala", nume: "Școala Z", emailOficial: "scoalaz@yahoo.com" });
    const dups = await findDuplicates(db);
    expect(dups.map((x) => x.motiv).sort()).toEqual(["acelasi_domeniu", "nume_si_oras"]); // yahoo nu e domeniu propriu
    await ignoreDuplicate(db, c.id, d.id, null);
    expect(await findDuplicates(db)).toHaveLength(1);

    await addActivity(db, { tip: "apel", organizationId: b.id, rezumat: "Am sunat" });
    await addTask(db, { organizationId: b.id, titlu: "Sună iar", scadenta: now }, now);
    await db.insert(crmContacts).values({ organizationId: b.id, nume: "Secretariat", consimtamant: false });
    const prev = await mergePreview(db, a.id, b.id);
    expect(prev!.counts.map((x) => x.label).sort()).toEqual(["activități", "persoane de contact", "sarcini"]);
    expect(prev!.fill).toMatchObject({ telefon: "0264 111 222" });
    expect(await mergeOrgs(db, a.id, b.id, null, now)).toBe(true);
    const orgs = await db.select().from(crmOrganizations).where(eq(crmOrganizations.tip, "scoala"));
    expect(orgs.find((o) => o.id === b.id)).toBeUndefined();
    const kept = orgs.find((o) => o.id === a.id)!;
    expect(kept.telefon).toBe("0264 111 222");
    expect((await db.select().from(crmActivities).where(eq(crmActivities.organizationId, a.id))).map((x) => x.tip).sort()).toEqual(["apel", "nota"]);
    expect(await db.select().from(crmTasks).where(eq(crmTasks.organizationId, a.id))).toHaveLength(1);
    expect((await db.select().from(auditLog)).some((l) => l.action === "unire organizații")).toBe(true);
  });
});

describe("ștergerea GDPR și exportul", () => {
  it("șterge organizația, persoanele și istoricul; adresele rămân doar pe „nu contacta”; istoricul modificărilor fără date", async () => {
    const db = createDb();
    await runMigrations(db);
    const o = await upsertOrg(db, { tip: "firma", nume: "Firma Ștearsă", emailOficial: "office@sters.ro" });
    await db.insert(crmContacts).values({ organizationId: o.id, nume: "Ion", email: "ion@sters.ro", consimtamant: true });
    await addActivity(db, { tip: "nota", organizationId: o.id, rezumat: "ceva" });
    await crmAudit(db, null, "organizație modificată", o.id, { nume: "Firma Ștearsă" }, now);
    await gdprDeleteOrg(db, o.id, { keepSuppression: true, by: null, now });
    expect(await db.select().from(crmOrganizations)).toHaveLength(0);
    expect(await db.select().from(crmContacts)).toHaveLength(0);
    expect(await db.select().from(crmActivities)).toHaveLength(0);
    expect(await isSuppressed(db, "office@sters.ro")).toBe(true);
    expect(await isSuppressed(db, "ion@sters.ro")).toBe(true);
    expect((await db.select().from(crmSuppression)).every((x) => x.motiv === "nu_contacta")).toBe(true);
    const logs = await db.select().from(auditLog);
    expect(logs.find((l) => l.action === "organizație modificată")!.diff).toBeNull();
    expect(logs.some((l) => l.action === "ștergere GDPR")).toBe(true);
  });

  it("CSV cu „;”, BOM, ghilimele și fără formule", async () => {
    expect(toCsv([{ a: "x;y", b: '=1+1', c: 'el a zis "da"', d: null }])).toBe('﻿a;b;c;d\r\n"x;y";\'=1+1;"el a zis ""da""";\r\n');
    const db = createDb();
    await runMigrations(db);
    await upsertOrg(db, { tip: "scoala", nume: "Școala Ă", emailOficial: "s@a.ro" });
    const csv = await exportCsv(db, "organizatii");
    expect(csv.split("\r\n")[1]).toContain("Școala Ă");
    for (const k of ["activitati", "deal", "nucontacta", "campanii", "sarcini", "profesori", "aprobari", "istoric"] as const) expect(typeof (await exportCsv(db, k))).toBe("string");
  });

  it("formularul în istoric, scurtat", () => {
    const f = new FormData();
    f.set("id", "x");
    f.set("note", "a".repeat(300));
    f.set("$ACTION_ID_1", "y");
    const d = formDiff(f)!;
    expect(Object.keys(d)).toEqual(["id", "note"]);
    expect(d.note.length).toBe(201);
  });
});
