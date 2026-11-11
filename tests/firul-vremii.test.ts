import { describe, expect, it } from "vitest";
import { END, LANES, MOMENTS, SPANS, START, packLane, spanText, yearText } from "@/lib/firul-vremii";
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

  it("scrie anii înainte și după Hristos", () => {
    expect(yearText(-586)).toBe("586 î.Hr.");
    expect(yearText(30, true)).toBe("c. 30 d.Hr.");
    expect(spanText(-931, -913)).toBe("931–913 î.Hr.");
    expect(spanText(-5, 30, true)).toBe("c. 5 î.Hr.–30 d.Hr.");
  });
});
