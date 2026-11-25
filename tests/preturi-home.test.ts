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
