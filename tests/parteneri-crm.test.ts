import { describe, it, expect, beforeAll } from "vitest";
import { eq } from "drizzle-orm";
import { createDb, type Db } from "@/db";
import { runMigrations } from "@/db/migrate";
import { giftCards, partners, payment, user } from "@/db/schema";
import { cardByShareToken, checkPartner, createBatch, digitalLeft, redeemCard, savePartner, sellDigital, setGiftCardsEnabled, shareLinks, testDigitalOnce } from "@/lib/carduri-cadou";
import { addContact, contactsOf, coverage, crmPartners, crmStats, dueSteps, ensureRefCode, filterCrm, monthReport, partnerByRef, quietPartners, recordReferral, REF_COOKIE } from "@/lib/parteneri-crm";

const base = { oras: "Cluj-Napoca", adresa: null, persoanaContact: null, telefon: "0740000000", email: null, comisionProcent: 20, activ: true, note: null };

describe("fișa partenerului (formular)", () => {
  it("etapa hotărăște dacă e activ; județul și categoria se verifică", () => {
    expect(checkPartner({ numeMagazin: "X", etapa: "negociere" })).toMatchObject({ ok: { etapa: "negociere", activ: false, plafonZi: 20, tip: "magazin" } });
    expect(checkPartner({ numeMagazin: "X", etapa: "activ", judet: "CJ", categorie: "librarie", website: "librariax.ro", tip: "firma", plafonZi: "5" }))
      .toMatchObject({ ok: { activ: true, judet: "CJ", website: "https://librariax.ro", tip: "firma", plafonZi: 5 } });
    expect(checkPartner({ numeMagazin: "X", etapa: "activ", judet: "ZZ" })).toHaveProperty("error");
    expect(checkPartner({ numeMagazin: "X", etapa: "nu" })).toHaveProperty("error");
    expect(checkPartner({ numeMagazin: "X", etapa: "activ", urmatorulPasLa: "2027-01-05" })).toMatchObject({ ok: { urmatorulPasLa: new Date("2027-01-05T07:00:00Z") } });
  });
  it("mesajul de trimis are legătura și pentru cine e", () => {
    const l = shareLinks("https://www.carteaneamului.ro/card/abc", 12, "Maria");
    expect(l.text).toContain("Maria, ai primit");
    expect(l.text).toContain("un an");
    expect(l.whatsapp).toMatch(/^https:\/\/wa\.me\/\?text=/);
    expect(decodeURIComponent(l.sms)).toContain("/card/abc");
  });
});

describe("cardurile digitale și City Partners, în baza de date", () => {
  let db: Db; let shop: string; let other: string;
  beforeAll(async () => {
    db = createDb();
    await runMigrations(db);
    await db.insert(user).values([{ id: "a1", name: "Admin", email: "a@t.ro" }, { id: "u1", name: "Ana", email: "ana@t.ro" }, { id: "u2", name: "Ion", email: "ion@t.ro" }]);
    shop = await savePartner(db, null, { ...base, numeMagazin: "Librăria Digitală", etapa: "activ", judet: "CJ", categorie: "librarie", plafonZi: 3 }, "a1");
    other = await savePartner(db, null, { ...base, numeMagazin: "Florăria Prospect", activ: false, etapa: "necontactat", judet: "SB" }, "a1");
    await setGiftCardsEnabled(db, true, "a1");
  });

  it("un lot digital dă fiecărui card o legătură secretă", async () => {
    await createBatch(db, { partnerId: shop, plan: "basic", durataLuni: 12, pretRaftLei: 49, cantitate: 5, digital: true }, "a1");
    const cards = await db.select().from(giftCards).where(eq(giftCards.partnerId, shop));
    expect(cards.every((c) => c.shareToken && c.shareToken.length >= 24)).toBe(true);
    expect(new Set(cards.map((c) => c.shareToken)).size).toBe(5);
    expect(await digitalLeft(db, shop)).toBe(5);
  });

  it("legătura nu arată un card nevândut ca activ; vânzarea îl face folosibil într-un pas", async () => {
    const [first] = await db.select().from(giftCards).where(eq(giftCards.partnerId, shop)).orderBy(giftCards.seq).limit(1);
    expect((await cardByShareToken(db, first.shareToken!))?.status).toBe("generat");
    const c = await sellDigital(db, { partnerId: shop, pentru: "Maria", mesaj: "La mulți ani!", via: "whatsapp", by: null, source: "magazin" });
    expect(c && c !== "plafon" && c.id).toBe(first.id);
    const seen = await cardByShareToken(db, first.shareToken!);
    expect(seen).toMatchObject({ status: "vandut_activat_de_magazin", pentru: "Maria", mesaj: "La mulți ani!", magazin: "Librăria Digitală" });
    expect((await redeemCard(db, first.cod, "u1")).result).toBe("ok");
  });

  it("plafonul pe 24 de ore oprește un link de magazin scăpat", async () => {
    expect(await sellDigital(db, { partnerId: shop, via: "sms", by: null, source: "magazin" })).not.toBe("plafon");
    expect(await sellDigital(db, { partnerId: shop, via: "sms", by: null, source: "magazin" })).not.toBe("plafon");
    expect(await sellDigital(db, { partnerId: shop, via: "sms", by: null, source: "magazin" })).toBe("plafon");
    // Adminul nu e oprit de plafon; fără carduri rămase, nu se vinde nimic.
    expect(await sellDigital(db, { partnerId: shop, via: "link", by: "a1", source: "admin" })).not.toBeNull();
    expect(await sellDigital(db, { partnerId: shop, via: "link", by: "a1", source: "admin" })).not.toBeNull();
    expect(await sellDigital(db, { partnerId: shop, via: "link", by: "a1", source: "admin" })).toBeNull();
    expect(await sellDigital(db, { partnerId: other, via: "link", by: null, source: "admin" })).toBeNull();
  });

  it("recomandarea: codul, cookie-ul și contul trecut pe partener", async () => {
    const code = await ensureRefCode(db, shop);
    expect(code).toMatch(/^[2-9A-HJ-NP-Z]{6}$/);
    expect(await ensureRefCode(db, shop)).toBe(code);
    expect((await partnerByRef(db, code!.toLowerCase()))?.id).toBe(shop);
    expect(await recordReferral(db, "u2", `x=1; ${REF_COOKIE}=${code}`)).toBe(true);
    expect(await recordReferral(db, "u2", `${REF_COOKIE}=${code}`)).toBe(false);
    expect(await recordReferral(db, "u1", "x=1")).toBe(false);
  });

  it("raportul lunar: carduri vândute × preț × comision% și anii plătiți de conturile aduse", async () => {
    const now = new Date();
    await db.insert(payment).values({ id: "cs_ref", userId: "u2", kind: "an", amount: 4900, currency: "ron", createdAt: now });
    const [r] = (await monthReport(db, now.toISOString().slice(0, 7))).filter((x) => x.partnerId === shop);
    expect(r).toMatchObject({ vandute: 5, activate: 1, incasariLei: 245, comisionCarduri: 49, conturiAduse: 1, platiAduse: 1, platiAduseLei: 49, comisionRecomandari: 9.8, total: 58.8 });
  });

  it("CRM: cifre, filtre, județe, pași la termen, contacte și partenerii opriți", async () => {
    const rows = await crmPartners(db);
    expect(crmStats(rows)).toMatchObject({ total: 2, prospecte: 1, activi: 1, vandute: 5 });
    expect(filterCrm(rows, { etapa: "prospecte" }).map((p) => p.numeMagazin)).toEqual(["Florăria Prospect"]);
    expect(filterCrm(rows, { oras: "cluj", q: "digitala" }).length).toBe(1);
    const cj = coverage(rows).find((c) => c.code === "CJ")!;
    expect(cj).toMatchObject({ activi: 1, vandute: 5 });
    expect(coverage(rows).find((c) => c.code === "SB")).toMatchObject({ activi: 0, inLucru: 1 });
    expect(rows.find((p) => p.id === shop)!.onboarding).toBe(4); // fără PIN
    await db.update(partners).set({ urmatorulPas: "sun", urmatorulPasLa: new Date(Date.now() - 86_400_000) }).where(eq(partners.id, other));
    expect(dueSteps(await crmPartners(db)).map((p) => p.id)).toEqual([other]);
    await addContact(db, other, { canal: "telefon", nota: "Vrea afișul" }, "a1");
    expect((await contactsOf(db, other)).length).toBe(1);
    expect((await db.select({ e: partners.etapa }).from(partners).where(eq(partners.id, other)))[0].e).toBe("contactat");
    expect(await quietPartners(db, 30)).toEqual([]); // a vândut azi
    expect((await quietPartners(db, 30, new Date(Date.now() + 40 * 86_400_000))).map((p) => p.id)).toEqual([shop]);
  });

  it("lotul digital de test se face o singură dată", async () => {
    expect(await testDigitalOnce(db)).toMatch(/^lot digital /);
    expect(await testDigitalOnce(db)).toBe("deja");
  });
});
