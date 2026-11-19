import { describe, expect, it } from "vitest";
import { KIN_DRAFTS, KIN_PAGES, getKinPage } from "@/lib/unelte/rudenie-pagini";

describe("ciornele de pagini de rudenie", () => {
  it("nu au pagină publică până nu sunt aprobate și nu se suprapun cu cele de acum", () => {
    for (const d of KIN_DRAFTS) {
      expect(getKinPage(d.slug), d.slug).toBeNull();
      expect(KIN_PAGES.some((p) => p.slug === d.slug)).toBe(false);
    }
  });
  it("au text complet: titlu ≤ 60, descriere ≤ 155, trei secțiuni și întrebări", () => {
    for (const d of KIN_DRAFTS) {
      expect(d.title.length, d.slug).toBeLessThanOrEqual(60);
      expect(d.description.length, d.slug).toBeLessThanOrEqual(155);
      expect(d.body.length, d.slug).toBeGreaterThanOrEqual(3);
      expect(d.faq.length, d.slug).toBeGreaterThanOrEqual(3);
      for (const r of d.related) expect(getKinPage(r), `${d.slug} → ${r}`).not.toBeNull();
    }
  });
});
