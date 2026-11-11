import { describe, expect, it } from "vitest";
import { END, LANES, MOMENTS, SPANS, START, WINDOWS, packLane, spanText, yearText } from "@/lib/firul-vremii";
import { CHURCH_ERAS } from "@/lib/istoria-bisericii";
import { indexAll } from "@/lib/adam-hristos";

describe("Firul vremii", () => {
  it("fiecare bară stă pe axă, pe un rând care există, cu un id unic", () => {
    const ids = new Set<string>();
    for (const s of SPANS) {
      expect(ids.has(s.id), s.id).toBe(false);
      ids.add(s.id);
      expect(LANES.some((l) => l.id === s.lane), s.id).toBe(true);
      expect(s.from, s.id).toBeLessThan(s.to);
      expect(s.from, s.id).toBeGreaterThanOrEqual(START);
      expect(s.to, s.id).toBeLessThanOrEqual(END);
    }
    for (const m of MOMENTS) expect(m.year >= START && m.year <= END, m.id).toBe(true);
  });

  it("legăturile spre arbori duc la persoane care există", () => {
    const idx = indexAll();
    for (const s of SPANS) if (s.person) expect(idx.has(s.person), `${s.id} → ${s.person}`).toBe(true);
  });

  it("barele de pe același sub-rând nu se suprapun", () => {
    for (const l of LANES) {
      const spans = SPANS.filter((s) => s.lane === l.id);
      const { row } = packLane(spans);
      for (const a of spans) for (const b of spans) {
        if (a.id < b.id && row.get(a.id) === row.get(b.id)) expect(a.to <= b.from || b.to <= a.from, `${a.id} / ${b.id}`).toBe(true);
      }
    }
  });

  it("după Hristos: epocile Bisericii vin din Istoria Bisericii, iar evenimentele românești din Povestea vremurilor", () => {
    expect(SPANS.filter((s) => s.lane === "biserica").map((s) => s.id)).toEqual(CHURCH_ERAS.map((e) => `b-${e.id}`));
    for (const s of SPANS.filter((s) => s.lane === "biserica")) expect(s.label.length, s.id).toBeGreaterThan(3);
    for (const m of MOMENTS.filter((m) => m.id.startsWith("v-"))) expect(m.note?.length ?? 0, m.id).toBeGreaterThan(10);
    for (const x of [...SPANS, ...MOMENTS]) if (x.href) expect(x.href, x.id).toMatch(/^\/istoria-bisericii#(apostoli|roma|evul-mediu|reforma|trezire|secolul-xx|azi|biblia|eroi)$/);
  });

  it("fiecare bucată a axei are în ea ce promit butoanele „Sari la”", () => {
    for (const w of Object.values(WINDOWS)) for (const [, y] of w.jumps) expect(y >= w.from && y <= w.to).toBe(true);
  });

  it("scrie anii înainte și după Hristos", () => {
    expect(yearText(-586)).toBe("586 î.Hr.");
    expect(yearText(30, true)).toBe("c. 30 d.Hr.");
    expect(spanText(-931, -913)).toBe("931–913 î.Hr.");
    expect(spanText(-5, 30, true)).toBe("c. 5 î.Hr.–30 d.Hr.");
  });
});
