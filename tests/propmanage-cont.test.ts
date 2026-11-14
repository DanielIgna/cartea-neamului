import { describe, it, expect, beforeAll } from "vitest";
import { eq } from "drizzle-orm";
import { createDb, type Db } from "@/db";
import { runMigrations } from "@/db/migrate";
import { propmanageInvite, user } from "@/db/schema";
import { batchCards, createBatch, markSold, redeemCard, savePartner, setGiftCardsEnabled } from "@/lib/carduri-cadou";
import {
  CONSENT_TEXT, inviteCounts, linkFromResponse, offerEnabled, offerVisible, propmanageConfig, requestInvite, setOfferEnabled, signBody,
} from "@/lib/propmanage-cont";

const ENV = { PROPMANAGE_INVITE_URL: "https://propmanage.ro/api/partner/invite", PARTNER_SHARED_SECRET: "cheie-de-test-cheie-de-test-1234" };

type Call = { url: string; body: string; headers: Record<string, string> };
function fakeFetch(reply: () => Response | Promise<Response>, calls: Call[]): typeof fetch {
  return (async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(url), body: String(init?.body), headers: init?.headers as Record<string, string> });
    return reply();
  }) as typeof fetch;
}
const json = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: { "content-type": "application/json" } });

describe("configurarea și răspunsul lui PropManage", () => {
  it("fără adresă sau fără cheie oferta nu există", () => {
    expect(propmanageConfig({})).toBeNull();
    expect(propmanageConfig({ PROPMANAGE_INVITE_URL: ENV.PROPMANAGE_INVITE_URL })).toBeNull();
    expect(propmanageConfig({ PARTNER_SHARED_SECRET: "x", PROPMANAGE_INVITE_URL: "ftp://x" })).toBeNull();
    expect(propmanageConfig(ENV)).toEqual({ url: ENV.PROPMANAGE_INVITE_URL, secret: ENV.PARTNER_SHARED_SECRET });
  });
  it("linkul se ia din url/link/token și se pune pe adresa lui PropManage; altfel nimic", () => {
    const u = ENV.PROPMANAGE_INVITE_URL;
    expect(linkFromResponse({ url: "https://propmanage.ro/cont-cadou?token=abc" }, u)).toBe("https://propmanage.ro/cont-cadou?token=abc");
    expect(linkFromResponse({ link: "/cont-cadou?token=abc" }, u)).toBe("https://propmanage.ro/cont-cadou?token=abc");
    expect(linkFromResponse({ token: "a b" }, u)).toBe("https://propmanage.ro/cont-cadou?token=a%20b");
    expect(linkFromResponse({ url: "javascript:alert(1)" }, u)).toBeNull();
    expect(linkFromResponse({ ok: true }, u)).toBeNull();
    expect(linkFromResponse(null, u)).toBeNull();
  });
});

describe("cererea „Vreau contul gratuit”", () => {
  let db: Db;
  let partnerId: string, batchId: string;
  beforeAll(async () => {
    db = createDb();
    await runMigrations(db);
    await db.insert(user).values([{ id: "a1", name: "Admin", email: "admin@test.ro" }, { id: "u1", name: "Ana Pop", email: "ana@test.ro" },
      { id: "u2", name: "Ion", email: "ion@test.ro" }, { id: "u3", name: "Maria", email: "maria@test.ro" }]);
    partnerId = await savePartner(db, null, { numeMagazin: "Librăria Test", oras: "Cluj", adresa: null, persoanaContact: null, telefon: null, email: null, comisionProcent: 25, activ: true, note: null }, "a1");
    batchId = await createBatch(db, { partnerId, plan: "basic", durataLuni: 12, pretRaftLei: 49, cantitate: 3 }, "a1");
    await setGiftCardsEnabled(db, true, "a1");
    const codes = (await batchCards(db, batchId)).map((c) => c.cod);
    await markSold(db, { batchId }, "a1", "admin");
    expect((await redeemCard(db, codes[0], "u1")).result).toBe("ok");
    expect((await redeemCard(db, codes[1], "u2")).result).toBe("ok");
  });

  it("oferta pornește oprită și nu se arată nimănui", async () => {
    expect(await offerEnabled(db)).toBe(false);
    expect(await offerVisible(db, "u1", ENV)).toBe(false);
    const calls: Call[] = [];
    expect(await requestInvite(db, "u1", { consent: true, place: "activare", env: ENV, fetchImpl: fakeFetch(() => json({}), calls) })).toEqual({ ok: false, reason: "off" });
    expect(calls).toHaveLength(0);
  });

  it("pornită, dar fără PropManage legat în Vercel, tot nu se arată", async () => {
    await setOfferEnabled(db, true, "a1");
    expect(await offerVisible(db, "u1", {})).toBe(false);
    expect(await offerVisible(db, "u1", ENV)).toBe(true);
  });

  it("fără bifă nu se trimite nimic și nu se scrie nimic", async () => {
    const calls: Call[] = [];
    expect(await requestInvite(db, "u1", { consent: false, place: "activare", env: ENV, fetchImpl: fakeFetch(() => json({}), calls) })).toEqual({ ok: false, reason: "no_consent" });
    expect(calls).toHaveLength(0);
    expect(await db.select().from(propmanageInvite)).toHaveLength(0);
  });

  it("cu bifă: trimite nume, email, sursa și magazinul, semnat; păstrează acordul și ascunde oferta", async () => {
    const calls: Call[] = [];
    const now = new Date("2026-11-14T12:30:00Z");
    const r = await requestInvite(db, "u1", { consent: true, place: "activare", locale: "ro", env: ENV, now,
      fetchImpl: fakeFetch(() => json({ url: "https://propmanage.ro/cont-cadou?token=t1" }), calls) });
    expect(r).toEqual({ ok: true, link: "https://propmanage.ro/cont-cadou?token=t1" });
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe(ENV.PROPMANAGE_INVITE_URL);
    const body = JSON.parse(calls[0].body);
    expect(body).toEqual({ nume: "Ana Pop", email: "ana@test.ro", sursa: "cartea-neamului", partner_id: partnerId, timestamp: now.toISOString() });
    expect(calls[0].headers["x-signature"]).toBe(`sha256=${signBody(calls[0].body, ENV.PARTNER_SHARED_SECRET)}`);
    const [row] = await db.select().from(propmanageInvite).where(eq(propmanageInvite.userId, "u1"));
    expect(row).toMatchObject({ consentText: CONSENT_TEXT, status: "trimis", partnerId, batchId, place: "activare", locale: "ro", sursa: "cartea-neamului" });
    expect(row.consentAt).toEqual(now);
    const [u] = await db.select({ at: user.propmanageInvitedAt }).from(user).where(eq(user.id, "u1"));
    expect(u.at).toEqual(now);
    expect(await offerVisible(db, "u1", ENV)).toBe(false);
    expect((await requestInvite(db, "u1", { consent: true, place: "datele-mele", env: ENV, fetchImpl: fakeFetch(() => json({ url: "https://x.ro" }), []) })).ok).toBe(false);
  });

  it("dacă PropManage nu răspunde, omul nu e marcat invitat, iar Admin vede încercarea", async () => {
    const r1 = await requestInvite(db, "u2", { consent: true, place: "activare", env: ENV, fetchImpl: fakeFetch(() => json({ error: "x" }, 500), []) });
    expect(r1).toEqual({ ok: false, reason: "unavailable" });
    const r2 = await requestInvite(db, "u2", { consent: true, place: "activare", env: ENV, fetchImpl: fakeFetch(() => { throw new Error("ECONNREFUSED"); }, []) });
    expect(r2).toEqual({ ok: false, reason: "unavailable" });
    const [u] = await db.select({ at: user.propmanageInvitedAt }).from(user).where(eq(user.id, "u2"));
    expect(u.at).toBeNull();
    const rows = await db.select().from(propmanageInvite).where(eq(propmanageInvite.userId, "u2"));
    expect(rows.map((x) => x.status)).toEqual(["eroare", "eroare"]);
  });

  it("fără card (din Datele mele) pleacă fără magazin; „Conturi PropManage” numără doar cele trimise", async () => {
    const calls: Call[] = [];
    expect((await requestInvite(db, "u3", { consent: true, place: "datele-mele", env: ENV, fetchImpl: fakeFetch(() => json({ token: "t3" }), calls) })).ok).toBe(true);
    expect(JSON.parse(calls[0].body).partner_id).toBeNull();
    const c = await inviteCounts(db);
    expect(c.trimise).toBe(2);
    expect(c.erori).toBe(2);
    expect(c.faraCard).toBe(1);
    expect(c.partner.get(partnerId)).toBe(1);
    expect(c.batch.get(batchId)).toBe(1);
  });

  it("dacă omul își șterge contul, rândul rămâne doar ca număr, fără om", async () => {
    await db.delete(user).where(eq(user.id, "u3"));
    const rows = await db.select().from(propmanageInvite).where(eq(propmanageInvite.place, "datele-mele"));
    expect(rows.some((r) => r.userId === null && r.status === "trimis")).toBe(true);
  });
});
