import { describe, expect, it, vi } from "vitest";

vi.mock("@/db", async (importOriginal) => {
  const m = await importOriginal<typeof import("@/db")>();
  const { runMigrations } = await import("@/db/migrate");
  const db = m.createDb();
  await runMigrations(db);
  return { ...m, db };
});

import { db } from "@/db";
import { user } from "@/db/schema";
import {
  SchoolRequestInput, activeSchoolOffer, afterSchoolPayment, approveRequest, newSchoolCode, recordSchoolSignup, saveSchoolRequest,
  schoolCodeFromCookie, schoolDashboard, schoolYearEnd, setCodeActive,
} from "@/lib/scoli";
import { KIT, SCHOOL_PAGES, SCHOOL_ROWS, SHEETS, schoolSlotLabel } from "@/lib/scoala";
import { sitemapGroups } from "@/lib/continut/sitemap";
import { PRIVATE_PREFIXES } from "@/lib/public-pages";
import fs from "node:fs";
import path from "node:path";

/** Stripe de probă: cuponul nu există încă, apoi se face; codul promoțional primește un id. */
function fakeStripe() {
  const calls: { url: string; method: string; body: string }[] = [];
  const f = (async (url: string, init?: RequestInit) => {
    calls.push({ url, method: init?.method ?? "GET", body: String(init?.body ?? "") });
    if (init?.method === "GET") return new Response("{}", { status: 404 });
    if (url.endsWith("/coupons")) return Response.json({ id: "cn-scoala-90" });
    return Response.json({ id: "promo_test_1" });
  }) as typeof fetch;
  return { f, calls };
}

describe("școli: piesele mici", () => {
  it("codul e ușor de dictat, cookie-ul se citește corect", () => {
    const c = newSchoolCode();
    expect(c).toMatch(/^SCOALA[A-HJ-NP-Z2-9]{5}$/);
    expect(schoolCodeFromCookie(`a=1; cn-scoala=${c}; b=2`)).toBe(c);
    expect(schoolCodeFromCookie("cn-scoala=<script>")).toBeNull();
  });
  it("anul școlar se termină pe 31 iulie", () => {
    expect(schoolYearEnd(new Date("2026-11-17T10:00:00Z")).toISOString().slice(0, 10)).toBe("2027-07-31");
    expect(schoolYearEnd(new Date("2027-03-01T10:00:00Z")).toISOString().slice(0, 10)).toBe("2027-07-31");
  });
  it("formularul cere școala, clasa, elevii și un email bun", () => {
    expect(SchoolRequestInput.safeParse({ school: "Școala Nr. 1", locality: "Huedin", classLabel: "a IV-a B", students: "24", email: "prof@scoala.ro" }).success).toBe(true);
    expect(SchoolRequestInput.safeParse({ school: "Școala Nr. 1", locality: "Huedin", classLabel: "a IV-a B", students: "0", email: "prof@scoala.ro" }).success).toBe(false);
    expect(SchoolRequestInput.safeParse({ school: "Ș", locality: "Huedin", classLabel: "a IV-a", students: 20, email: "nu-e-email" }).success).toBe(false);
  });
});

describe("școli: paginile", () => {
  it("titluri de cel mult 60 de caractere, descrieri de 120–155", () => {
    for (const p of SCHOOL_PAGES) {
      expect(p.title.length, p.path).toBeLessThanOrEqual(60);
      expect(p.description.length, p.path).toBeGreaterThanOrEqual(120);
      expect(p.description.length, p.path).toBeLessThanOrEqual(155);
    }
  });
  it("fișele și kitul există în public/", () => {
    const files = [...SHEETS.map((s) => s.pdf), KIT.classSheet.pdf, KIT.classSheet.docx, KIT.parentLetter.pdf, KIT.parentLetter.docx];
    for (const f of files) expect(fs.existsSync(path.join("public", f)), f).toBe(true);
  });
  it("sunt în sitemap; fișele pe ecran și linkul codului nu", () => {
    const g = sitemapGroups().find((x) => x.name === "scoala")!;
    expect(g.urls.map((u) => u.path)).toEqual(SCHOOL_PAGES.map((p) => p.path));
    expect(PRIVATE_PREFIXES).toEqual(expect.arrayContaining(["/scoala-cod/", "/scoala/fisa/"]));
  });
  it("arborele de tipărit: 15 locuri, cu rudele numite pentru copil", () => {
    expect(SCHOOL_ROWS.flat().sort((a, b) => a - b)).toEqual(Array.from({ length: 15 }, (_, i) => i + 1));
    expect([1, 2, 3, 4, 7, 8, 15].map(schoolSlotLabel)).toEqual(["Eu", "Tata", "Mama", "Bunicul (dinspre tata)", "Bunica (dinspre mama)", "Străbunicul", "Străbunica"]);
  });
});

describe("școli: de la cerere la plată", () => {
  it("cererea aprobată face codul în Stripe; contul făcut pe link primește reducerea o dată", async () => {
    const now = new Date("2026-11-17T10:00:00Z");
    await db.insert(user).values([{ id: "u-admin", name: "Admin", email: "admin@scoli.test" }, { id: "u-parinte", name: "Părinte", email: "parinte@scoli.test" }]);
    const reqId = await saveSchoolRequest(db, SchoolRequestInput.parse({ school: "Școala Nr. 1", locality: "Huedin", county: "Cluj", classLabel: "a IV-a B", students: 24, email: "prof@scoala.ro" }), now);
    const { f, calls } = fakeStripe();
    const code = await approveRequest(db, reqId, "u-admin", {}, { stripe: true, fetcher: f }, now);
    expect(code?.stripePromoId).toBe("promo_test_1");
    expect(code?.percent).toBe(90);
    expect(code?.maxUses).toBe(24);
    const promoBody = new URLSearchParams(calls.at(-1)!.body);
    expect(promoBody.get("coupon")).toBe("cn-scoala-90");
    expect(promoBody.get("max_redemptions")).toBe("24");
    expect(await approveRequest(db, reqId, "u-admin", {}, { stripe: true, fetcher: f }, now)).toBeNull();

    await recordSchoolSignup(db, "u-parinte", `cn-scoala=${code!.code}`);
    expect(await activeSchoolOffer(db, "u-parinte", now)).toEqual({ code: code!.code, promoId: "promo_test_1" });
    expect(await activeSchoolOffer(db, "u-admin", now)).toBeNull();

    expect(await afterSchoolPayment(db, { id: "cs_1", userId: "u-parinte", amount: 490, currency: "ron", promo: "promo_test_1" }, now)).toBe(true);
    expect(await activeSchoolOffer(db, "u-parinte", now)).toBeNull();
    const d = await schoolDashboard(db);
    const row = d.codes.find((c) => c.code === code!.code)!;
    expect([row.signups, row.payments, row.paid]).toEqual([1, 1, 490]);
    expect(d.pending).toBe(0);

    await setCodeActive(db, code!.id, false);
    await db.insert(user).values({ id: "u-alt", name: "Alt", email: "alt@scoli.test" });
    await recordSchoolSignup(db, "u-alt", `cn-scoala=${code!.code}`);
    expect(await activeSchoolOffer(db, "u-alt", now)).toBeNull();
  });
});
