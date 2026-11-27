import { describe, expect, it, vi } from "vitest";

vi.mock("@/db", async (importOriginal) => {
  const m = await importOriginal<typeof import("@/db")>();
  const { runMigrations } = await import("@/db/migrate");
  const db = m.createDb();
  await runMigrations(db);
  return { ...m, db };
});

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { accountSource, crmActivities, crmApprovals, crmContacts, crmDeals, payment, tree, user } from "@/db/schema";
import { addActivity, suppress, upsertOrg } from "@/lib/crm";
import {
  accountsBySrc, checkPartnershipForm, decideApproval, expireApprovals, orgList, queueApproval, srcOf, submitPartnership, todayList, volumeDiscount, volumeValue, whatsappLink,
} from "@/lib/crm-admin";

const now = new Date("2026-11-17T10:00:00Z");

describe("CRM admin: piesele mici", () => {
  it("oferta de volum", () => {
    expect([5, 10, 29, 30, 89, 90, 149, 150, 499].map(volumeDiscount)).toEqual([0, 10, 10, 15, 15, 20, 20, 25, 25]);
    expect(volumeDiscount(500)).toBeNull();
    expect(volumeValue(30, 49)).toBe(1250);
    expect(volumeValue(600, 49)).toBeNull();
  });
  it("linkul WhatsApp: numerele românești primesc prefixul 4; cele prea scurte, nimic", () => {
    expect(whatsappLink("0744 123 456", "Salut")).toBe("https://wa.me/40744123456?text=Salut");
    expect(whatsappLink("+39 333 1234567", "x")).toBe("https://wa.me/393331234567?text=x");
    expect(whatsappLink("112", "x")).toBeNull();
    expect(srcOf("scoala", "sc-1-huedin")).toBe("scoala-sc-1-huedin");
    expect(srcOf("parohie_sau_arhiva_doar_informativ", "x")).toBe("org-x");
  });
  it("formularul public: tip, nume, email și bifa de acord sunt obligatorii", () => {
    const base = { tip: "scoala", organizatie: "Școala Nr. 2", email: "inv@scoala2.ro", consent: "on" };
    expect("ok" in checkPartnershipForm(base)).toBe(true);
    expect(checkPartnershipForm({ ...base, consent: undefined })).toEqual({ error: "Bifează acordul ca să-ți putem răspunde." });
    expect(checkPartnershipForm({ ...base, email: "x" })).toEqual({ error: "Adresa de email nu pare bună." });
    expect(checkPartnershipForm({ ...base, tip: "hacker" })).toEqual({ error: "Alege ce fel de organizație ești." });
    expect(checkPartnershipForm({ ...base, numar: "-3" })).toEqual({ error: "Numărul de elevi sau angajați nu pare bun." });
  });
});

describe("CRM admin: formularul, „Azi” și cifrele", () => {
  it("formularul face organizație + contact cu acord + deal cu pasul de azi, apoi apare în „Azi”", async () => {
    const id = await submitPartnership(db, { tip: "scoala", organizatie: "Școala Gimnazială Nr. 2 Dej", localitate: "Dej", rol: "învățătoare", numar: 26, email: "inv@scoala2.ro", telefon: "0744123456", mesaj: null, consent: true }, now);
    const [c] = await db.select().from(crmContacts).where(eq(crmContacts.organizationId, id));
    expect(c).toMatchObject({ consimtamant: true, email: "inv@scoala2.ro" });
    const [d] = await db.select().from(crmDeals).where(eq(crmDeals.organizationId, id));
    expect(d).toMatchObject({ produs: "coduri_clasa", etapa: "interesat", conturiEstimate: 26 });
    const today = await todayList(db, now);
    expect(today.some((t) => t.kind === "deal" && t.title === "Școala Gimnazială Nr. 2 Dej")).toBe(true);
  });

  it("un răspuns nou apare în „Azi” până când trecem ceva după el; un refuz nu apare", async () => {
    const a = await upsertOrg(db, { tip: "firma", nume: "Acme SRL", emailOficial: "hr@acme.ro" }, now);
    await addActivity(db, { tip: "raspuns", rezumat: "Cât costă pentru 40?", at: new Date(now.getTime() - 3600_000), organizationId: a.id, meta: { clasificare: "intrebare" } });
    const b = await upsertOrg(db, { tip: "firma", nume: "Beta SRL", emailOficial: "office@beta.ro" }, now);
    await addActivity(db, { tip: "raspuns", rezumat: "Nu, mulțumim", at: now, organizationId: b.id, meta: { clasificare: "refuz" } });
    let t = await todayList(db, now);
    expect(t.filter((x) => x.kind === "raspuns").map((x) => x.title)).toEqual(["Acme SRL"]);
    await addActivity(db, { tip: "apel", rezumat: "Am sunat", at: now, organizationId: a.id });
    t = await todayList(db, now);
    expect(t.filter((x) => x.kind === "raspuns")).toHaveLength(0);
  });

  it("conturile pe linkul organizației nu includ conturile de test", async () => {
    const o = await upsertOrg(db, { tip: "scoala", nume: "Liceul X", emailOficial: "office@liceulx.ro" }, now);
    const [row] = await orgList(db, { q: "liceul x" });
    expect(row.src).toBe("scoala-liceul-x");
    await db.insert(user).values([{ id: "c-1", name: "Elev 1", email: "e1@gmail.com" }, { id: "c-2", name: "Test", email: "t@example.com" }]);
    await db.insert(accountSource).values([{ userId: "c-1", firstSrc: "scoala-liceul-x", source: "scoala-liceul-x", analytics: true }, { userId: "c-2", firstSrc: "scoala-liceul-x", source: "scoala-liceul-x", analytics: true }]);
    await db.insert(tree).values({ name: "Arborele lui Elev", ownerId: "c-1" });
    await db.insert(payment).values({ id: "cs_1", userId: "c-1", kind: "an", amount: 4900, currency: "ron" });
    expect((await accountsBySrc(db)).get("scoala-liceul-x")).toEqual({ accounts: 1, trees: 1, paid: 1 });
    const [again] = await orgList(db, { q: "liceul x" });
    expect(again).toMatchObject({ id: o.id, accounts: 1, trees: 1, paid: 1 });
  });
});

describe("CRM admin: coada de aprobări", () => {
  it("aprobarea trimite emailul (cu textul editat) și îl trece în istoric; de două ori nu", async () => {
    const o = await upsertOrg(db, { tip: "asociatie_diaspora", nume: "Asociația Românilor din Torino", emailOficial: "info@aromtorino.it" }, now);
    const id = (await queueApproval(db, { tipActiune: "email-raspuns", payload: { destinatar: "info@aromtorino.it", subiect: "Re: parteneriat", text: "Ciornă" }, motiv: "a întrebat de parteneriat", organizationId: o.id, dedupeKey: "t1" }, now))!;
    expect(await queueApproval(db, { tipActiune: "email-raspuns", payload: {}, dedupeKey: "t1" }, now)).toBeNull();
    const send = vi.fn(async () => ({ ok: true }));
    const r = await decideApproval(db, id, "aprobat", null as unknown as string, { text: "Bună ziua,\n\nTextul meu." }, now, send);
    expect(r).toEqual({ ok: true, why: "aprobat" });
    expect(send).toHaveBeenCalledWith(expect.objectContaining({ to: "info@aromtorino.it", text: "Bună ziua,\n\nTextul meu.", marketing: true, tag: "crm-email-raspuns" }));
    expect((await decideApproval(db, id, "aprobat", "x", null, now, send)).ok).toBe(false);
    expect(send).toHaveBeenCalledTimes(1);
    const acts = await db.select().from(crmActivities).where(eq(crmActivities.externalId, `aprobare:${id}`));
    expect(acts).toHaveLength(1);
  });

  it("dacă destinatarul a intrat între timp pe lista „nu contacta”, nu pleacă nimic și rămâne motivul", async () => {
    const id = (await queueApproval(db, { tipActiune: "email-raspuns", payload: { destinatar: "nu@refuz.ro", subiect: "S", text: "T" } }, now))!;
    await suppress(db, "nu@refuz.ro", "refuz", { now });
    const { sendEmail } = await import("@/lib/email");
    process.env.RESEND_API_KEY = "re_test";
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    const r = await decideApproval(db, id, "aprobat", null as unknown as string, null, now, (m) => sendEmail(m));
    info.mockRestore();
    delete process.env.RESEND_API_KEY;
    expect(r.ok).toBe(false);
    const [a] = await db.select().from(crmApprovals).where(eq(crmApprovals.id, id));
    expect(a.status).toBe("respins");
    expect(String(a.payload.eroare)).toContain("nu contacta");
  });

  it("la o eroare de trimitere rămâne în așteptare, cu textul editat păstrat", async () => {
    const id = (await queueApproval(db, { tipActiune: "email_presa", payload: { destinatar: "redactie@ziar.ro", subiect: "S", text: "Ciornă" }, dedupeKey: "eroare" }, now))!;
    const r = await decideApproval(db, id, "aprobat", null as unknown as string, { text: "Textul meu schimbat" }, now, async () => ({ ok: false }));
    expect(r.ok).toBe(false);
    const [a] = await db.select().from(crmApprovals).where(eq(crmApprovals.id, id));
    expect(a.status).toBe("in_asteptare");
    expect(a.payload.text).toBe("Textul meu schimbat");
    const send = vi.fn(async () => ({ ok: true }));
    expect(await decideApproval(db, id, "aprobat", null as unknown as string, null, now, send)).toEqual({ ok: true, why: "aprobat" });
    expect(send).toHaveBeenCalledWith(expect.objectContaining({ text: "Textul meu schimbat" }));
  });

  it("după 72 de ore expiră", async () => {
    const id = (await queueApproval(db, { tipActiune: "email-x", payload: { destinatar: "a@b.ro" } }, now))!;
    expect(await expireApprovals(db, new Date(now.getTime() + 71 * 3600_000))).toBe(0);
    expect(await expireApprovals(db, new Date(now.getTime() + 73 * 3600_000))).toBeGreaterThanOrEqual(1);
    const [a] = await db.select().from(crmApprovals).where(eq(crmApprovals.id, id));
    expect(a.status).toBe("expirat");
    expect((await decideApproval(db, id, "aprobat", "x", null, now)).ok).toBe(false);
  });
});
