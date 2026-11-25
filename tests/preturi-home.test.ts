import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { loadMessages } from "@/i18n/messages";
import { LOCALES } from "@/i18n/locales";

const src = (p: string) => readFileSync(p, "utf8");
const sentences = (x: string) => x.split(/(?<=[.!?])\s+/);

describe("prețurile de pe prima pagină (25.11.2026)", () => {
  it("textele de sub carduri se împart în întrebări fără să se piardă nimic, în toate limbile", async () => {
    for (const l of LOCALES) {
      const m = (await loadMessages(l)) as unknown as { Landing: Record<string, string>; Preturi: Record<string, unknown> };
      // plansNote: 8 propoziții (cine vede / schimbarea planului ×2 / dacă nu plătești + Păstrarea / plata, factura, TVA).
      expect(sentences(m.Landing.plansNote).length, l).toBe(8);
      // plansText: primele 2 despre zilele gratuite; ultimele 2 („anul nu se reînnoiește”) nu se mai arată cu abonamentele.
      expect(sentences(m.Landing.plansText).length, l).toBe(4);
      for (const k of ["choose", "trial", "onlyYearly", "orYear", "faqTitle", "qTrial", "qAfter", "qStop", "qChange", "qFamily", "qBook", "qPay", "afterLead", "bannerAfter", "payToday"]) {
        expect(m.Preturi[k], `${l} ${k}`).toBeTruthy();
      }
    }
  });

  it("butonul „Alege planul” duce la cont nou și apoi la plată, cu planul și perioada alese", () => {
    expect(src("src/components/HomePlans.tsx")).toContain("/intrare?mod=cont-nou&plan=${plan}&perioada=${p}");
    const signIn = src("src/app/(site)/intrare/page.tsx");
    expect(signIn).toContain("`/plata?perioada=${isPeriod(perioada) ? perioada : \"an\"}&plan=${plan}#plan-${plan}`");
    expect(src("src/app/(site)/plata/page.tsx")).toContain("id={`plan-${x}`}");
    // Fără bifă, plata nu pare moartă: căsuța se înroșește și apare mesajul.
    expect(src("src/app/(site)/plata/page.tsx")).toContain("<ConsentGuard />");
  });

  it("nicio frază „plata nu se reînnoiește” cât abonamentele sunt pornite", () => {
    const faq = src("src/lib/seo/home-faq.ts");
    expect(faq).toContain('s.subs ? ` Familie și Premium se pot plăti și lunar sau la 3 luni.');
    const landing = src("src/components/Landing.tsx");
    expect(landing).toContain('s.subs ? trialText.slice(0, 2) : trialText');
  });
});

describe("prețul tăiat (25.11.2026)", async () => {
  const { comparePrice, DEFAULT_SETTINGS: s } = await import("@/lib/plans");
  it("spune ce e: aceeași perioadă plătită lunar sau prețul întreg; nimic la lunar", () => {
    expect(comparePrice("familie", "an", true, s, false, true)).toEqual({ kind: "monthly", was: 185.88, count: 12, month: 15.49 });
    expect(comparePrice("premium", "trimestru", true, s, false, true)).toEqual({ kind: "monthly", was: 77.7, count: 3, month: 25.9 });
    expect(comparePrice("familie", "luna", true, s, false, true)).toBeNull();
    expect(comparePrice("basic", "an", true, s, false, true)).toBeNull();
    expect(comparePrice("familie", "an", true, s, true, true)).toEqual({ kind: "full", was: 149 });
    expect(comparePrice("basic", "an", true, s, true, false)).toEqual({ kind: "full", was: 14 });
  });
});

describe("Basic 69 lei / 14 € (25.11.2026)", () => {
  it("o singură dată la publicare: Basic, ruda și pachetul; ce era pus altfel în Admin rămâne", async () => {
    const { createDb } = await import("@/db");
    const { runMigrations } = await import("@/db/migrate");
    const { basicPrice69Once, planSettings, savePlanSettings, DEFAULT_SETTINGS } = await import("@/lib/plans");
    const d = createDb(); await runMigrations(d);
    await savePlanSettings(d, { ...DEFAULT_SETTINGS, priceLei: 49, priceEur: 10, invitePriceLei: 49, invitePriceEur: 10, bundleLei: 79, bundleEur: 16, basicRenewLei: 39 }, null as unknown as string);
    expect(await basicPrice69Once(d)).toBe("schimbat");
    expect(await planSettings(d)).toMatchObject({ priceLei: 69, priceEur: 14, invitePriceLei: 69, invitePriceEur: 14, bundleLei: 99, bundleEur: 20, basicRenewLei: 39 });
    await savePlanSettings(d, { ...(await planSettings(d)), priceLei: 59 }, null as unknown as string);
    expect(await basicPrice69Once(d)).toBe("deja");
    expect((await planSettings(d)).priceLei).toBe(59);
  });
});

describe("Reînnoirea Basic cu cel mult 20% reducere (25.11.2026)", () => {
  it("39 lei / 8 € devin 56 lei / 12 €, o singură dată; Familie și Premium rămân", async () => {
    const { createDb } = await import("@/db");
    const { runMigrations } = await import("@/db/migrate");
    const { discount20Once, planSettings, savePlanSettings, DEFAULT_SETTINGS } = await import("@/lib/plans");
    const d = createDb(); await runMigrations(d);
    await savePlanSettings(d, { ...DEFAULT_SETTINGS, basicRenewLei: 39, basicRenewEur: 8 }, null as unknown as string);
    expect(await discount20Once(d)).toBe("schimbat");
    const s = await planSettings(d);
    expect(s).toMatchObject({ basicRenewLei: 56, basicRenewEur: 12, familieRenewLei: 119, premiumRenewLei: 199 });
    expect(1 - s.basicRenewLei / s.priceLei).toBeLessThanOrEqual(0.2);
    expect(1 - s.basicRenewEur / s.priceEur).toBeLessThanOrEqual(0.2);
    await savePlanSettings(d, { ...s, basicRenewLei: 60 }, null as unknown as string);
    expect(await discount20Once(d)).toBe("deja");
    expect((await planSettings(d)).basicRenewLei).toBe(60);
  });
});
