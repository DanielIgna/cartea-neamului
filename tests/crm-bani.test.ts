import { describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { createDb } from "@/db";
import { runMigrations } from "@/db/migrate";
import { accountSource, crmActivities, crmOrgAccounts, crmOrganizations, payment, school, schoolCode, schoolSignup, user } from "@/db/schema";
import { upsertOrg } from "@/lib/crm";
import { srcOf } from "@/lib/crm-admin";
import { afterCrmPayment, createOrgCode, moneyByOrg, newOrgCode, refreshOrgAccounts } from "@/lib/crm-bani";

const now = new Date("2026-11-18T10:00:00Z");

async function setup() {
  const db = createDb();
  await runMigrations(db);
  const a = await upsertOrg(db, { tip: "scoala", nume: "Școala Gimnazială 1", localitate: "Dej", emailOficial: "s1@scoala1.ro" });
  const b = await upsertOrg(db, { tip: "firma", nume: "Firma B", emailOficial: "office@firmab.ro" });
  const [oa] = await db.select().from(crmOrganizations).where(eq(crmOrganizations.id, a.id));
  await db.insert(user).values([
    { id: "u-src", name: "Ana", email: "ana@gmail.com" },
    { id: "u-cod", name: "Ion", email: "ion@gmail.com" },
    { id: "u-sc", name: "Eva", email: "eva@gmail.com" },
    { id: "u-test", name: "Test", email: "t@example.com" },
  ]);
  const src = srcOf("scoala", oa.slug)!;
  await db.insert(accountSource).values([{ userId: "u-src", firstSrc: src, source: src }, { userId: "u-test", firstSrc: src, source: src }]);
  return { db, a: a.id, b: b.id };
}

describe("codul organizației", () => {
  it("NEAM-XXXX pe cuponul lui NEAM90, o singură dată", async () => {
    const { db, b } = await setup();
    expect(newOrgCode()).toMatch(/^NEAM-[A-Z2-9]{4}$/);
    const prev = process.env.STRIPE_SECRET_KEY;
    process.env.STRIPE_SECRET_KEY = "sk_test_x";
    const calls: { url: string; body: string }[] = [];
    const f = (async (url: string | URL, init?: RequestInit) => {
      calls.push({ url: String(url), body: String(init?.body ?? "") });
      if (String(url).includes("promotion_codes?code=NEAM90")) return Response.json({ data: [{ id: "promo_neam90", coupon: { id: "cpn_neam90" } }] });
      return Response.json({ id: "promo_org" });
    }) as typeof fetch;
    const code = await createOrgCode(db, b, f);
    expect(code).toMatch(/^NEAM-/);
    expect(calls[1].body).toContain("coupon=cpn_neam90");
    expect(calls[1].body).toContain(`metadata%5BcrmOrg%5D=${b}`);
    expect(await createOrgCode(db, b, f)).toBe(code);
    expect(calls).toHaveLength(2);
    process.env.STRIPE_SECRET_KEY = prev;
  });
});

describe("conturile aduse și banii", () => {
  it("după link, cod și codul școlii; plata → activitate, venit, „client”; testele nu contează", async () => {
    const { db, a, b } = await setup();
    // Codul școlii (Admin → Școli) legat de organizația A.
    const [sc] = await db.insert(school).values({ name: "Școala Gimnazială 1", locality: "Dej" }).returning();
    const [code] = await db.insert(schoolCode).values({ schoolId: sc.id, code: "SCOALAABCDE", percent: 90, maxUses: 30, expiresAt: new Date("2027-06-30") }).returning();
    await db.insert(schoolSignup).values({ userId: "u-sc", codeId: code.id });
    await db.update(crmOrganizations).set({ schoolId: sc.id, cod: "NEAM-B2B2", stripePromoId: "promo_b" }).where(eq(crmOrganizations.id, b));
    await db.update(crmOrganizations).set({ schoolId: sc.id }).where(eq(crmOrganizations.id, a));
    await db.update(crmOrganizations).set({ schoolId: null }).where(eq(crmOrganizations.id, b));

    const r1 = await refreshOrgAccounts(db, now);
    expect(r1.added).toBe(2); // u-src (link), u-sc (școala); nu u-test
    const links = new Map((await db.select().from(crmOrgAccounts)).map((x) => [x.userId, x]));
    expect(links.get("u-src")).toMatchObject({ organizationId: a, via: "src" });
    expect(links.get("u-sc")).toMatchObject({ organizationId: a, via: "scoala" });
    expect(links.has("u-test")).toBe(false);

    // Plată cu codul firmei B.
    await db.insert(payment).values({ id: "cs_cod", userId: "u-cod", kind: "an", amount: 490, currency: "ron" });
    await afterCrmPayment(db, { userId: "u-cod", promo: "promo_b" }, now);
    // Plata contului adus de școală.
    await db.insert(payment).values([{ id: "cs_src", userId: "u-src", kind: "an", amount: 4900, currency: "ron" }, { id: "cs_test", userId: "u-test", kind: "an", amount: 4900, currency: "ron" }]);
    const r2 = await refreshOrgAccounts(db, now);
    expect(r2.payments).toBe(1);
    expect((await refreshOrgAccounts(db, now)).payments).toBe(0);

    const money = await moneyByOrg(db);
    expect(money.get(a)).toMatchObject({ accounts: 2, paidAccounts: 1, ron: 49 });
    expect(money.get(b)).toMatchObject({ accounts: 1, paidAccounts: 1, ron: 4.9 });
    const orgs = new Map((await db.select().from(crmOrganizations)).map((o) => [o.id, o.status]));
    expect(orgs.get(a)).toBe("client");
    expect(orgs.get(b)).toBe("client");
    const acts = await db.select().from(crmActivities);
    expect(acts.filter((x) => x.tip === "plata")).toHaveLength(2);
    expect(acts.filter((x) => x.tip === "cont_creat")).toHaveLength(3);
  });
});

describe("la înscriere", () => {
  it("contul se leagă imediat de organizația din link", async () => {
    const { db, a } = await setup();
    const { attributeNewAccount } = await import("@/lib/crm-bani");
    await attributeNewAccount(db, "u-src", now);
    const [x] = await db.select().from(crmOrgAccounts);
    expect(x).toMatchObject({ userId: "u-src", organizationId: a, via: "src" });
    await attributeNewAccount(db, "u-cod", now); // fără sursă: nimic
    expect(await db.select().from(crmOrgAccounts)).toHaveLength(1);
  });
});
