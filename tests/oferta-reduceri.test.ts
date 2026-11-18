import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { createDb } from "@/db";
import { runMigrations } from "@/db/migrate";
import { accountPlan, gift, payment, user } from "@/db/schema";
import { eq } from "drizzle-orm";
import { cleanLinkCode, isFirstYear, linkCodeFromCookie, linkCodeOffer, stripePromoFor } from "@/lib/cod-link";
import { applyUsedTrial, emailPrint, markTrialUsed, normalEmail, trialUsed } from "@/lib/proba-email";
import { createCheckout } from "@/lib/plati";
import { accessFor, DEFAULT_SETTINGS } from "@/lib/plans";
import { deleteAccount } from "@/lib/account";

const src = (p: string) => readFileSync(p, "utf8");
const promo = (o: Partial<{ code: string; active: boolean; expires_at: number | null; max_redemptions: number | null; times_redeemed: number }> = {}) =>
  (async () => new Response(JSON.stringify({ data: [{ id: "promo_1", code: "NEAM90", active: true, expires_at: null, max_redemptions: null, times_redeemed: 0, ...o }] }))) as unknown as typeof fetch;

describe("reducerile (oferta din 18 noiembrie 2026)", () => {
  let key: string | undefined;
  beforeEach(() => { key = process.env.STRIPE_SECRET_KEY; process.env.STRIPE_SECRET_KEY = "sk_test_x"; });
  afterEach(() => { if (key === undefined) delete process.env.STRIPE_SECRET_KEY; else process.env.STRIPE_SECRET_KEY = key; });

  it("pe pagina Stripe nu mai e câmp liber de cod, doar pentru admini (TEST90 la plățile de probă)", async () => {
    let sent: URLSearchParams | null = null;
    const fake = (async (_u: string, init: RequestInit) => { sent = init.body as URLSearchParams; return new Response(JSON.stringify({ url: "https://x" })); }) as typeof fetch;
    const base = { kind: "an" as const, userId: "u", email: "a@b.ro", name: "An", amount: 4900, currency: "ron", locale: "ro", successUrl: "s", cancelUrl: "c" };
    await createCheckout(base, fake);
    expect(sent!.get("allow_promotion_codes")).toBeNull();
    await createCheckout({ ...base, promoField: true }, fake);
    expect(sent!.get("allow_promotion_codes")).toBe("true");
    // O reducere pusă singură: fără câmp, o singură reducere.
    await createCheckout({ ...base, promoField: true, offer: { code: "NEAM90", promoId: "promo_1" } }, fake);
    expect(sent!.get("allow_promotion_codes")).toBeNull();
    expect(sent!.getAll("discounts[0][promotion_code]")).toEqual(["promo_1"]);
    expect(sent!.get("discounts[1][promotion_code]")).toBeNull();
    const route = src("src/app/api/plata/start/route.ts");
    expect(route).toContain("promoField: isAdminUser(me)");
    expect(route).toMatch(/offer: offer\?\.stripePromoId \? .* : school \?\? linked/);
  });

  it("codul din link: doar NEAM90 și NEAM-XXXX, ținut minte în cookie", () => {
    expect(cleanLinkCode("neam90")).toBe("NEAM90");
    expect(cleanLinkCode("NEAM-AB12")).toBe("NEAM-AB12");
    expect(cleanLinkCode("TEST90")).toBeNull();
    expect(cleanLinkCode("ORICE")).toBeNull();
    expect(linkCodeFromCookie("limba=ro; cn-cod=NEAM90; tema=auto")).toBe("NEAM90");
    expect(linkCodeFromCookie("cn-cod=TEST90")).toBeNull();
    expect(existsSync("src/app/cod/[cod]/route.ts")).toBe(true);
  });

  it("Stripe: codul trebuie să fie activ, neexpirat și cu folosiri rămase", async () => {
    const now = new Date("2026-12-01T00:00:00Z");
    expect(await stripePromoFor("NEAM90", promo(), now)).toBe("promo_1");
    expect(await stripePromoFor("NEAM90", promo({ expires_at: Math.floor(now.getTime() / 1000) - 10 }), now)).toBeNull();
    expect(await stripePromoFor("NEAM90", promo({ max_redemptions: 100, times_redeemed: 100 }), now)).toBeNull();
    expect(await stripePromoFor("NEAM90", promo({ active: false }), now)).toBeNull();
    expect(await stripePromoFor("NEAM90", promo({ code: "ALTUL" }), now)).toBeNull();
  });

  it("doar la primul an întreg, fără altă reducere; reînnoirea și anul dăruit nu mai primesc reducerea", async () => {
    const d = createDb(); await runMigrations(d);
    await d.insert(user).values([{ id: "nou", name: "N", email: "n@test.ro" }, { id: "vechi", name: "V", email: "v@test.ro" }, { id: "dar", name: "D", email: "d@test.ro" }]);
    await d.insert(payment).values({ id: "cs_1", userId: "vechi", kind: "an", amount: 4900, currency: "ron" });
    await d.insert(gift).values({ id: "g1", paymentId: "cs_g", tier: "basic", redeemedBy: "dar", redeemedAt: new Date() });
    const ask = (userId: string, o: { full?: boolean; other?: boolean } = {}) =>
      linkCodeOffer(d, { userId, cookie: "cn-cod=NEAM90", fullFirstYear: o.full ?? true, other: o.other ?? false }, promo());
    expect(await ask("nou")).toEqual({ code: "NEAM90", promoId: "promo_1" });
    expect(await ask("nou", { other: true })).toBeNull();
    expect(await ask("nou", { full: false })).toBeNull();
    expect(await ask("vechi")).toBeNull();
    expect(await ask("dar")).toBeNull();
    expect(await linkCodeOffer(d, { userId: "nou", cookie: "", fullFirstYear: true, other: false }, promo())).toBeNull();
    expect(await isFirstYear(d, "nou")).toBe(true);
    // Codul clasei: tot doar la primul an.
    expect(src("src/lib/scoli.ts")).toContain("if (!(await isFirstYear(db, userId))) return null;");
  });
});

describe("un email = o singură perioadă de zile gratuite", () => {
  it("emailul se scrie la fel indiferent de litere, puncte la Gmail sau „+ceva”; se ține doar amprenta", () => {
    expect(normalEmail(" Ion.Pop+test@GMail.com ")).toBe("ionpop@gmail.com");
    expect(normalEmail("ion.pop+x@yahoo.com")).toBe("ion.pop@yahoo.com");
    expect(emailPrint("ion.pop@gmail.com")).toBe(emailPrint("IonPop+a@googlemail.com"));
    expect(emailPrint("ion.pop@gmail.com")).not.toContain("ion");
  });

  it("după ștergerea contului, contul nou cu același email pornește fără zilele gratuite", async () => {
    const d = createDb(); await runMigrations(d);
    await d.insert(user).values({ id: "a", name: "A", email: "ana.pop@gmail.com" });
    await deleteAccount(d, "a", { scrub: true });
    expect(await trialUsed(d, "AnaPop+2@gmail.com")).toBe(true);
    await d.insert(user).values({ id: "b", name: "A", email: "anapop@gmail.com" });
    expect(await applyUsedTrial(d, "b", "anapop@gmail.com")).toBe(true);
    const [ap] = await d.select().from(accountPlan).where(eq(accountPlan.userId, "b"));
    expect(ap.plan).toBe("fara-proba");
    // Un email nou primește zilele gratuite, ca înainte.
    await d.insert(user).values({ id: "c", name: "C", email: "alt@test.ro" });
    expect(await applyUsedTrial(d, "c", "alt@test.ro")).toBe(false);
    await markTrialUsed(d, "alt@test.ro");
    await markTrialUsed(d, "alt@test.ro");
    expect(src("src/lib/auth.ts")).toContain("applyUsedTrial(db, u.id, u.email)");
  });

  it("planul „fara-proba”: fără zile gratuite, dar plata anului merge", () => {
    const s = { ...DEFAULT_SETTINGS, on: true, startedAt: "2026-11-01T00:00:00Z" }, now = new Date("2026-12-01T10:00:00Z");
    const createdAt = new Date("2026-12-01T09:00:00Z");
    expect(accessFor({ createdAt, plan: null, paidUntil: null }, s, now).kind).toBe("proba");
    expect(accessFor({ createdAt, plan: "fara-proba", paidUntil: null }, s, now).kind).toBe("expirat");
    expect(accessFor({ createdAt, plan: "fara-proba", paidUntil: new Date("2027-12-01") }, s, now).kind).toBe("platit");
  });
});

describe("descărcarea arborelui (GEDCOM) și „Datele mele” rămân deschise oricând", () => {
  it("nicio blocare după zilele gratuite", () => {
    expect(src("src/app/api/arbore/[id]/gedcom/route.ts")).not.toMatch(/blocat=export|exportLocked/);
    expect(src("src/components/TreeScreen.tsx")).not.toMatch(/exportLocked|blocat=export/);
    expect(src("src/lib/plata.ts")).not.toContain("export async function exportLocked");
  });
});
