import { beforeAll, describe, expect, it, vi } from "vitest";

/** Baza de test e și cea pe care o vede sendEmail (lista „nu contacta”), iar Resend e înlocuit: nu pleacă nimic. */
vi.mock("@/db", async (importOriginal) => {
  const m = await importOriginal<typeof import("@/db")>();
  const { runMigrations } = await import("@/db/migrate");
  const db = m.createDb();
  await runMigrations(db);
  return { ...m, db };
});
const resendSend = vi.hoisted(() => vi.fn());
vi.mock("resend", () => ({ Resend: class { emails = { send: resendSend }; } }));

import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { accountSource, crmActivities, crmOrganizations, crmSuppression, user } from "@/db/schema";
import {
  advanceStatus, allowedRecipients, classifyReply, dedupeKeyOf, isSuppressed, realUserSql, slugify, suppress, unsuppress, upsertOrg,
} from "@/lib/crm";
import { importCsv, kindOfFile, parseCsv, parseWhen, seedPressDraftsOnce, seedPressOnce } from "@/lib/crm-import";
import { readFileSync } from "node:fs";
import { ingest, ingestAuthorized } from "@/lib/crm-ingest";
import { pendingApprovals } from "@/lib/crm-admin";
import { sendEmail } from "@/lib/email";

const now = new Date("2026-11-17T10:00:00Z");
const orgs = () => db.select().from(crmOrganizations);
const acts = () => db.select().from(crmActivities);

describe("CRM: piesele mici", () => {
  it("cheia unei organizații: emailul, altfel tip + nume + localitate fără diacritice", () => {
    expect(dedupeKeyOf({ tip: "scoala", nume: "Școala Gimnazială Nr. 1", emailOficial: " Secretariat@Scoala1.RO " })).toBe("e:secretariat@scoala1.ro");
    expect(dedupeKeyOf({ tip: "scoala", nume: "Școala  Gimnazială", localitate: "Huedin" })).toBe(dedupeKeyOf({ tip: "scoala", nume: "Scoala Gimnaziala", localitate: "huedin" }));
    expect(slugify("Școala Gimnazială „Avram Iancu” Huedin")).toBe("scoala-gimnaziala-avram-iancu-huedin");
  });
  it("statusul nu coboară singur, iar „nu contacta” rămâne", () => {
    expect(advanceStatus("interesat", "contactat")).toBe("interesat");
    expect(advanceStatus("nou", "contactat")).toBe("contactat");
    expect(advanceStatus("contactat", "nelivrat")).toBe("nelivrat");
    expect(advanceStatus("interesat", "nelivrat")).toBe("interesat");
    expect(advanceStatus("nu_contacta", "interesat")).toBe("nu_contacta");
    expect(advanceStatus("client", "nu_contacta")).toBe("nu_contacta");
  });
  it("răspunsurile se clasifică după reguli de cuvinte", () => {
    expect(classifyReply("Out of office: revin pe 20 noiembrie")).toBe("automat");
    expect(classifyReply("Vă rugăm să ne dezabonați de la aceste mesaje.")).toBe("dezabonare");
    expect(classifyReply("Mulțumim, dar nu suntem interesați.")).toBe("refuz");
    expect(classifyReply("Bună ziua, suntem interesați pentru clasa a IV-a B.")).toBe("interesat");
    expect(classifyReply("Cât costă pentru 25 de elevi?")).toBe("intrebare");
  });
  it("CSV: virgulă sau punct și virgulă, ghilimele, BOM, rânduri goale", () => {
    expect(parseCsv("﻿scoala;email\n\"Școala „Unu”; Cluj\";a@b.ro\n\n")).toEqual([["scoala", "email"], ["Școala „Unu”; Cluj", "a@b.ro"]]);
    expect(parseCsv('a,b\r\n"x ""y""",2')).toEqual([["a", "b"], ['x "y"', "2"]]);
    expect(kindOfFile("scoli_trimise (1).csv")).toBe("scoli_trimise");
    expect(kindOfFile("altceva.csv")).toBeNull();
    expect(parseWhen("17.11.2026", "09:30")?.toISOString()).toBe("2026-11-17T07:30:00.000Z");
    expect(parseWhen("2026-11-17", null)?.toISOString()).toBe("2026-11-17T10:00:00.000Z");
    expect(parseWhen("ieri", null)).toBeNull();
  });
  it("ingestia cere tokenul exact, de cel puțin 16 semne", () => {
    expect(ingestAuthorized("Bearer 0123456789abcdef", "0123456789abcdef")).toBe(true);
    expect(ingestAuthorized("Bearer 0123456789abcdeX", "0123456789abcdef")).toBe(false);
    expect(ingestAuthorized("Bearer scurt", "scurt")).toBe(false);
    expect(ingestAuthorized(null, "0123456789abcdef")).toBe(false);
    expect(ingestAuthorized("Bearer 0123456789abcdef", undefined)).toBe(false);
  });
});

describe("CRM: lista „nu contacta”", () => {
  it("adresa sau tot domeniul; o adresă stricată nu primește nimic", async () => {
    await suppress(db, "Director@Firma-X.ro", "refuz", { now });
    await suppress(db, "@scoala-tacuta.ro", "nu_contacta", { now });
    expect(await isSuppressed(db, "director@firma-x.ro")).toBe(true);
    expect(await isSuppressed(db, "office@firma-x.ro")).toBe(false);
    expect(await isSuppressed(db, "secretariat@scoala-tacuta.ro")).toBe(true);
    expect(await isSuppressed(db, "nu-e-email")).toBe(true);
    expect(await allowedRecipients(db, ["a@ok.ro", "director@firma-x.ro", "b@scoala-tacuta.ro"])).toEqual(["a@ok.ro"]);
    const [d] = await db.select().from(crmSuppression).where(eq(crmSuppression.valoare, "scoala-tacuta.ro"));
    expect(d.tip).toBe("domeniu");
  });

  it("nimeni de pe listă nu primește emailuri de marketing; cele tranzacționale pleacă", async () => {
    process.env.RESEND_API_KEY = "re_test";
    resendSend.mockReset().mockResolvedValue({ data: { id: "m" }, error: null });
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    for (const tag of ["conversie-bunvenit", "bun-venit-e1", "crm-raspuns", "reactivare"]) {
      expect(await sendEmail({ to: "director@firma-x.ro", subject: "S", html: "h", text: "t", tag })).toEqual({ skipped: true });
    }
    expect(await sendEmail({ to: ["a@ok.ro", "x@scoala-tacuta.ro"], subject: "S", html: "h", text: "t", marketing: true })).toEqual({ skipped: true });
    expect(resendSend).not.toHaveBeenCalled();
    expect(await sendEmail({ to: "director@firma-x.ro", subject: "Parola", html: "h", text: "t", tag: "parola" })).toEqual({ ok: true, id: "m" });
    expect(await sendEmail({ to: "a@ok.ro", subject: "S", html: "h", text: "t", tag: "conversie-progres" })).toEqual({ ok: true, id: "m" });
    expect(resendSend).toHaveBeenCalledTimes(2);
    await unsuppress(db, "director@firma-x.ro");
    expect(await sendEmail({ to: "director@firma-x.ro", subject: "S", html: "h", text: "t", tag: "crm-raspuns" })).toEqual({ ok: true, id: "m" });
    info.mockRestore();
    delete process.env.RESEND_API_KEY;
  });
});

describe("CRM: importul din CSV", () => {
  const trimise = "scoala,localitate,judet,email,data,ora\nȘcoala Gimnazială Nr. 1,Huedin,CJ,secretariat@sc1-huedin.ro,10.11.2026,09:00\n"
    + "Liceul Teoretic,Gherla,CJ,office@lt-gherla.ro,10.11.2026,09:05\nFără email,Dej,CJ,,10.11.2026,09:10\nRând stricat,Dej,CJ,nu-i-adresa,10.11.2026,09:11\n";

  it("fiecare rând devine organizație + „email trimis”; a doua rulare nu dublează nimic", async () => {
    const r1 = await importCsv(db, "scoli_trimise", trimise, null, now);
    expect(r1).toMatchObject({ rows: 4, orgsNew: 3, orgsSeen: 0, activities: 3 });
    expect(r1.skipped).toEqual([{ row: 5, why: "adresa „nu-i-adresa” nu e validă" }]);
    const r2 = await importCsv(db, "scoli_trimise", trimise, null, now);
    expect(r2).toMatchObject({ orgsNew: 0, orgsSeen: 3, activities: 0 });
    expect((await orgs()).filter((o) => o.tip === "scoala")).toHaveLength(3);
    expect((await acts()).filter((a) => a.tip === "email_trimis")).toHaveLength(3);
    const [o] = (await orgs()).filter((x) => x.emailOficial === "secretariat@sc1-huedin.ro");
    expect(o).toMatchObject({ status: "contactat", judet: "CJ", localitate: "Huedin", slug: "scoala-gimnaziala-nr-1" });
  });

  it("„nu contacta” intră pe listă; răspunsurile schimbă statusul, un refuz pune adresa pe listă", async () => {
    const nu = await importCsv(db, "scoli_nu_contacta", "scoala,email,motiv\nLiceul Teoretic,office@lt-gherla.ro,a cerut telefonic\n", null, now);
    expect(nu).toMatchObject({ suppressed: 1, orgsSeen: 1 });
    expect(await isSuppressed(db, "office@lt-gherla.ro")).toBe(true);
    const rasp = await importCsv(db, "firme_raspunsuri", "firma;email;data;raspuns\nAcme SRL;hr@acme.ro;12.11.2026;Suntem interesați, trimiteți-ne oferta\nBeta SRL;office@beta.ro;12.11.2026;Nu suntem interesați\n", null, now);
    expect(rasp).toMatchObject({ orgsNew: 2, activities: 2, suppressed: 1 });
    const all = await orgs();
    expect(all.find((o) => o.emailOficial === "hr@acme.ro")?.status).toBe("interesat");
    expect(all.find((o) => o.emailOficial === "office@beta.ro")?.status).toBe("nu_contacta");
    expect(all.find((o) => o.emailOficial === "office@lt-gherla.ro")?.status).toBe("nu_contacta");
    // Un email trimis după „nu contacta” (import vechi) nu-l scoate de acolo.
    await importCsv(db, "scoli_trimise", trimise, null, now);
    expect((await orgs()).find((o) => o.emailOficial === "office@lt-gherla.ro")?.status).toBe("nu_contacta");
  });

  it("lista de presă intră o singură dată, ca „Presă”, fără activități și cu sursa adresei", async () => {
    const csv = readFileSync("src/data/crm-presa.csv", "utf8");
    const lines = csv.trim().split("\n").length - 1;
    const before = (await acts()).length;
    expect(await seedPressOnce(db, csv, now)).toBe(`${lines} redacții noi, 0 deja în CRM`);
    expect(await seedPressOnce(db, csv, now)).toBe("deja");
    const presa = (await orgs()).filter((o) => o.tip === "presa");
    expect(presa).toHaveLength(lines);
    expect(presa.every((o) => o.status === "nou" && o.sursaDatelor?.startsWith("https://") && o.emailOficial)).toBe(true);
    expect((await acts()).length).toBe(before);
    // Câte un email pentru fiecare redacție, în Aprobări, cu răspunsul la contact@; nimic trimis.
    const drafts = JSON.parse(readFileSync("src/data/crm-presa-mesaje.json", "utf8"));
    expect(Object.keys(drafts).sort()).toEqual(presa.map((o) => o.emailOficial).sort());
    expect(await seedPressDraftsOnce(db, drafts, now)).toBe(`${lines} emailuri pentru redacții în Aprobări`);
    expect(await seedPressDraftsOnce(db, drafts, now)).toBe("deja");
    const q = (await pendingApprovals(db, now)).filter(({ a }) => a.tipActiune === "email_presa");
    expect(q).toHaveLength(lines);
    expect(q.every(({ a }) => a.payload.replyTo === "contact@carteaneamului.ro" && a.expiresAt.getTime() - now.getTime() === 7 * 24 * 3600_000)).toBe(true);
    expect((await acts()).length).toBe(before);
  });

  it("fără cap de tabel se ia ordinea din cerință", async () => {
    const r = await importCsv(db, "firme_trimise", "Gamma SRL,contact@gamma.ro,11.11.2026,10:00\n", null, now);
    expect(r).toMatchObject({ rows: 1, orgsNew: 1, activities: 1 });
  });
});

describe("CRM: ingestia", () => {
  it("evenimentele se scriu o singură dată; nelivrat → de sunat; dezabonare → pe listă", async () => {
    const evs = [
      { id: "g-1", type: "email_trimis", email: "secretariat@sc-noua.ro", subiect: "Proiectul arborele familiei", organizatie: { nume: "Școala Nouă", tip: "scoala", localitate: "Cluj-Napoca", judet: "CJ" } },
      { id: "g-2", type: "email_nelivrat", email: "office@nu-exista.ro", organizatie: { nume: "Școala Pierdută", tip: "scoala" } },
      { id: "g-3", type: "raspuns", email: "secretariat@sc-noua.ro", rezumat: "Vă rog să ne scoateți din listă, nu mai trimiteți." },
      { id: "g-4", type: "raspuns", email: "hr@acme.ro", rezumat: "Cât costă pentru 40 de angajați?" },
      { id: "g-5", type: "altceva" },
    ];
    const r1 = await ingest(db, { events: evs }, now);
    expect(r1.ok).toBe(false);
    expect(r1.results.map((r) => [r.id, r.ok, r.nou])).toEqual([["g-1", true, true], ["g-2", true, true], ["g-3", true, true], ["g-4", true, true], ["g-5", false, false]]);
    expect(r1.results[2].clasificare).toBe("dezabonare");
    const r2 = await ingest(db, evs.slice(0, 4), now);
    expect(r2.results.every((r) => r.ok && !r.nou)).toBe(true);
    const all = await orgs();
    expect(all.find((o) => o.emailOficial === "secretariat@sc-noua.ro")).toMatchObject({ status: "nu_contacta", tip: "scoala", judet: "CJ" });
    expect(all.find((o) => o.emailOficial === "office@nu-exista.ro")).toMatchObject({ status: "nelivrat", deSunat: true });
    expect(all.find((o) => o.emailOficial === "hr@acme.ro")?.status).toBe("interesat"); // o întrebare nu coboară „interesat”
    expect(await isSuppressed(db, "secretariat@sc-noua.ro")).toBe(true);
    const ext = (await acts()).filter((a) => a.externalId?.startsWith("ingest:"));
    expect(ext).toHaveLength(4);
  });
  it("un lot prea mare e refuzat întreg", async () => {
    const r = await ingest(db, Array.from({ length: 201 }, (_, i) => ({ id: `x${i}`, type: "email_trimis", email: `a${i}@x.ro` })), now);
    expect(r).toMatchObject({ ok: false, error: "cel mult 200 de evenimente o dată" });
  });
});

describe("CRM: conturile de test nu intră în cifre", () => {
  beforeAll(async () => {
    await db.insert(user).values([
      { id: "u-real", name: "Ana", email: "ana@gmail.com" },
      { id: "u-demo", name: "Demo", email: "demo@cartea-neamului.ro" },
      { id: "u-ex", name: "Test", email: "test1@example.com" },
      { id: "u-link", name: "Link", email: "link@gmail.com" },
    ]).onConflictDoNothing();
    await db.insert(accountSource).values({ userId: "u-link", analytics: true, source: "test-link-1", firstSrc: "test-link-1" }).onConflictDoNothing();
  });
  it("realUserSql scoate demo, @example.com și sursa test-link-*", async () => {
    const r = await db.execute(sql`select u.id from "user" u where ${realUserSql("u")} and u.id like 'u-%' order by u.id`);
    expect((r.rows as { id: string }[]).map((x) => x.id)).toEqual(["u-real"]);
  });
});

describe("CRM: upsert", () => {
  it("completează doar câmpurile goale și nu schimbă slug-ul", async () => {
    const a = await upsertOrg(db, { tip: "firma", nume: "Delta SRL", emailOficial: "office@delta.ro" }, now);
    const b = await upsertOrg(db, { tip: "firma", nume: "Delta altfel", emailOficial: "OFFICE@delta.ro", telefon: "0264 000 000" }, now);
    expect(b).toMatchObject({ id: a.id, created: false });
    const [o] = await db.select().from(crmOrganizations).where(eq(crmOrganizations.id, a.id));
    expect(o).toMatchObject({ nume: "Delta SRL", telefon: "0264 000 000", slug: "delta-srl" });
    const c = await upsertOrg(db, { tip: "firma", nume: "Delta SRL", emailOficial: "contact@delta2.ro" }, now);
    const [o2] = await db.select().from(crmOrganizations).where(eq(crmOrganizations.id, c.id));
    expect(o2.slug).toBe("delta-srl-2");
  });
});
