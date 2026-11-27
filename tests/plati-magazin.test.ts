import { describe, it, expect } from "vitest";
import { createDb } from "@/db";
import { runMigrations } from "@/db/migrate";
import { payment, shopOrder } from "@/db/schema";
import { business } from "@/lib/analiza";
import { fillPaymentCodes } from "@/lib/plati-test";
import { shopPaidFromSession } from "@/lib/invitatii-nunta-server";

const at = new Date("2026-11-27T12:00:00Z");
const order = (id: string, amount: number, promo: string | null) => ({ id, email: "a@b.ro", slug: "maramures", locale: "ro", amount, currency: "ron",
  tokenHash: `h-${id}`, expiresAt: new Date(at.getTime() + 86_400_000), createdAt: at, promo });

describe("plățile din magazin intră în rapoarte", () => {
  it("Analiză numără invitațiile, cu felul lor; cele cu cod TEST… sunt de test și nu intră în bani", async () => {
    const db = createDb(); await runMigrations(db);
    await db.insert(shopOrder).values([order("cs_live_1", 450, "TESTINV90"), order("cs_live_2", 4500, "")]);
    await db.insert(payment).values({ id: "cs_live_3", kind: "an", amount: 6900, currency: "ron", promo: "", createdAt: at });
    const b = await business(db, { from: "2026-11-27", to: "2026-11-27", days: 1 });
    expect(b.payments).toBe(3);
    expect(b.tests).toBe(1);
    expect(b.lei).toBe(114);
    expect(b.byKind).toEqual(expect.arrayContaining([{ kind: "invitatie", label: "invitație de nuntă", count: 2 }, { kind: "an", label: "plan", count: 1 }]));
  });
  it("codul comenzii se ia din Stripe (id promo_… → TESTINV90)", async () => {
    const db = createDb(); await runMigrations(db);
    const paid = shopPaidFromSession({ id: "cs_live_9", payment_status: "paid", amount_total: 450, currency: "ron", customer_details: { email: "a@b.ro" },
      discounts: [{ promotion_code: "promo_123" }], metadata: { kind: "invitatie-nunta", slug: "maramures", locale: "ro" } })!;
    expect(paid.promo).toBe("promo_123");
    await db.insert(shopOrder).values(order("cs_live_9", 450, paid.promo!));
    process.env.STRIPE_SECRET_KEY = "sk_test_x";
    const fake = (async () => new Response(JSON.stringify({ discounts: [{ promotion_code: { code: "TESTINV90" } }] }))) as unknown as typeof fetch;
    expect(await fillPaymentCodes(db, fake)).toBe(1);
    delete process.env.STRIPE_SECRET_KEY;
    const b = await business(db, { from: "2026-11-27", to: "2026-11-27", days: 1 });
    expect(b.tests).toBe(1);
  });
});
