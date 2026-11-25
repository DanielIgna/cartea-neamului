import { describe, it, expect } from "vitest";
import { createDb } from "@/db";
import { runMigrations } from "@/db/migrate";
import { payment, tree, user } from "@/db/schema";
import { DEFAULT_SETTINGS, offerNov18Once, planSettings, savePlanSettings } from "@/lib/plans";
import { PLANS } from "@/lib/plan-names";
import { bookAccess } from "@/lib/plati";

/** Schimbarea de ofertă din 18 noiembrie 2026: cartea PDF e un produs separat, plătit. */
describe("oferta din 18 noiembrie 2026", () => {
  it("prețurile implicite: Basic 69 (din 25.11.2026), Familie 149, Premium 249 lei; cartea PDF 39 lei / 8 €, separată la toate planurile", () => {
    expect(DEFAULT_SETTINGS).toMatchObject({
      priceLei: 69, priceEur: 14, familieLei: 149, familieEur: 30, premiumLei: 249, premiumEur: 50, trialDays: 7,
      bookLei: 39, bookEur: 8, basicBook: "separat", familieBook: "separat", premiumBook: "separat",
      basicPrint: 0, familiePrint: 0, premiumPrint: 0, printFromLei: 0, printFromEur: 0,
    });
    expect(PLANS.mereu.label).toBe("Acces gratuit");
  });

  it("o singură dată la publicare: cartea 39 lei, „separat”, fără tipar, pachete recalculate; ce era pus altfel rămâne", async () => {
    const d = createDb(); await runMigrations(d);
    await savePlanSettings(d, { ...DEFAULT_SETTINGS, on: true, bookLei: 99, bookEur: 20, familieBook: "una", premiumBook: "toti", premiumPrint: 20,
      bundleLei: 129, bundleEur: 25, keepBookLei: 110, keepBookEur: 22, printFromLei: 150 }, null as unknown as string);
    expect(await offerNov18Once(d)).toBe("schimbat");
    expect(await planSettings(d)).toMatchObject({ on: true, bookLei: 39, bookEur: 8, basicBook: "separat", familieBook: "separat", premiumBook: "separat",
      premiumPrint: 0, printFromLei: 0, bundleLei: 79, bundleEur: 16, keepBookLei: 110, keepBookEur: 12, priceLei: 69, familieLei: 149, premiumLei: 249 });
    // După aceea hotărăște Admin: cartea pusă „inclusă” la Premium rămâne așa.
    await savePlanSettings(d, { ...(await planSettings(d)), premiumBook: "toti" }, null as unknown as string);
    expect(await offerNov18Once(d)).toBe("deja");
    expect((await planSettings(d)).premiumBook).toBe("toti");
  });

  it("fără setări salvate (bază nouă) doar se ține minte, implicitele sunt deja cele noi", async () => {
    const d = createDb(); await runMigrations(d);
    expect(await offerNov18Once(d)).toBe("schimbat");
    expect((await planSettings(d)).bookLei).toBe(39);
  });

  it("cine are cartea PDF: acces gratuit, proprietarii, beta (până expiră), inclusă din Admin, plătită; altfel nimeni", async () => {
    const d = createDb(); await runMigrations(d);
    await d.insert(user).values([{ id: "u1", name: "U", email: "u1@test.ro" }, { id: "u2", name: "V", email: "u2@test.ro" }]);
    const [{ id: t }] = await d.insert(tree).values({ name: "Neamul de probă", ownerId: "u1" }).returning({ id: tree.id });
    const s = { ...DEFAULT_SETTINGS, on: true }, until = new Date("2030-01-01"), now = new Date("2027-01-10T00:00:00Z");
    const ask = (access: Parameters<typeof bookAccess>[1]["access"], o: { owner?: boolean; settings?: typeof s; userId?: string } = {}) =>
      bookAccess(d, { userId: o.userId ?? "u1", treeId: t, access, settings: o.settings ?? s, ownsThisTree: (o.userId ?? "u1") === "u1", owner: o.owner }, now);
    expect(await ask({ kind: "deschis" })).toBe("deschis");
    expect(await ask({ kind: "mereu" })).toBe("gratuit");
    expect(await ask({ kind: "expirat", since: now }, { owner: true })).toBe("gratuit");
    expect(await ask({ kind: "beta", until })).toBe("beta");
    // Planurile plătite nu mai au cartea inclusă implicit, nici Premium.
    for (const tier of ["basic", "familie", "premium"] as const) expect(await ask({ kind: "platit", until, tier })).toBeNull();
    expect(await ask({ kind: "proba", until, daysLeft: 3 })).toBeNull();
    expect(await ask({ kind: "expirat", since: now })).toBeNull();
    expect(await ask({ kind: "platit", until, tier: "premium" }, { settings: { ...s, premiumBook: "toti" } })).toBe("inclus");
    // O plată deblochează cartea arborelui 12 luni, doar pentru cel care a plătit.
    await d.insert(payment).values({ id: "cs_carte", userId: "u1", kind: "carte", treeId: t, amount: 3900, currency: "ron", createdAt: new Date("2026-12-01T00:00:00Z") });
    expect(await ask({ kind: "platit", until, tier: "basic" })).toBe("platit");
    expect(await ask({ kind: "expirat", since: now })).toBe("platit");
    expect(await ask({ kind: "proba", until, daysLeft: 3 }, { userId: "u2" })).toBeNull();
    expect(await bookAccess(d, { userId: "u1", treeId: t, access: { kind: "expirat", since: now }, settings: s, ownsThisTree: true }, new Date("2027-12-02T00:00:00Z"))).toBeNull();
  });
});

describe("cine plătise Familie sau Premium înainte de 18 noiembrie", () => {
  it("își păstrează cartea inclusă la arborii lui până la capătul anului plătit atunci", async () => {
    const d = createDb(); await runMigrations(d);
    await d.insert(user).values([{ id: "v1", name: "V", email: "v1@test.ro" }, { id: "n1", name: "N", email: "n1@test.ro" }]);
    const [{ id: t }] = await d.insert(tree).values({ name: "Vechi", ownerId: "v1" }).returning({ id: tree.id });
    const [{ id: t2 }] = await d.insert(tree).values({ name: "Nou", ownerId: "n1" }).returning({ id: tree.id });
    await d.insert(payment).values([
      { id: "cs_v", userId: "v1", kind: "an", amount: 14900, currency: "ron", createdAt: new Date("2026-11-15T10:00:00Z") },
      { id: "cs_n", userId: "n1", kind: "an", amount: 14900, currency: "ron", createdAt: new Date("2026-11-19T10:00:00Z") },
    ]);
    const s = { ...DEFAULT_SETTINGS, on: true }, until = new Date("2027-11-15T00:00:00Z"), now = new Date("2027-03-01T00:00:00Z");
    expect(await bookAccess(d, { userId: "v1", treeId: t, access: { kind: "platit", until, tier: "familie" }, settings: s, ownsThisTree: true }, now)).toBe("inclus");
    expect(await bookAccess(d, { userId: "v1", treeId: t, access: { kind: "platit", until, tier: "basic" }, settings: s, ownsThisTree: true }, now)).toBeNull();
    expect(await bookAccess(d, { userId: "n1", treeId: t2, access: { kind: "platit", until, tier: "familie" }, settings: s, ownsThisTree: true }, now)).toBeNull();
  });
});
