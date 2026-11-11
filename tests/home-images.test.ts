import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { activeImages, findUpload, HOME_SLOTS, MAX_ACTIVE, parseHomeState, slotOptions, withActive, withoutUpload, withUpload } from "@/lib/home-images";

const up = (id: string) => ({ id, key: `site/acasa/x-${id}.jpg`, type: "image/jpeg", at: "2026-11-11T00:00:00Z", by: null });

describe("pozele primei pagini", () => {
  it("fiecare poză inițială și fiecare variantă există în public/home", () => {
    for (const s of HOME_SLOTS) for (const o of slotOptions(s.id, undefined)) expect(existsSync(`public${o.src}`), o.src).toBe(true);
  });

  it("fără alegeri: o poză pe locurile simple, câteva în banner", () => {
    expect(activeImages("gen1", undefined).map((i) => i.id)).toEqual(["b:bunici"]);
    const banner = activeImages("banner", undefined);
    expect(banner[0].id).toBe("b:banner");
    expect(banner.length).toBeGreaterThan(1);
  });

  it("înțelege forma veche, cu o singură poză încărcată", () => {
    const st = parseHomeState({ gen1: { key: "site/acasa/gen1-abc-123.jpg", type: "image/jpeg", at: "2026-11-11T00:00:00Z", by: "u1" } });
    expect(activeImages("gen1", st.gen1)).toEqual([{ id: "u:gen1-abc-123", src: "/api/poza-acasa/gen1-abc-123", custom: true }]);
    expect(findUpload(st, "gen1-abc-123")?.key).toBe("site/acasa/gen1-abc-123.jpg");
    expect(parseHomeState("nimic")).toEqual({});
  });

  it("încărcarea: la locurile simple înlocuiește, la banner se adaugă", () => {
    let st = withUpload({}, "gen2", up("a"));
    expect(activeImages("gen2", st.gen2).map((i) => i.id)).toEqual(["u:a"]);
    st = withUpload(st, "banner", up("b"));
    const ids = activeImages("banner", st.banner).map((i) => i.id);
    expect(ids[0]).toBe("b:banner");
    expect(ids.at(-1)).toBe("u:b");
  });

  it("alegerea păstrează doar poze care există, cel mult una sau MAX_ACTIVE", () => {
    expect(withActive({}, "gen1", ["b:nu-exista", "b:variante/vechi-bunici", "b:bunici"]).gen1?.active).toEqual(["b:variante/vechi-bunici"]);
    const many = slotOptions("banner", undefined).map((o) => o.id);
    expect(withActive({}, "banner", [...many, ...many]).banner?.active.length).toBeLessThanOrEqual(MAX_ACTIVE);
  });

  it("ștergerea scoate poza și de pe pagină; se întoarce la inițială", () => {
    const st = withUpload({}, "gen3", up("c"));
    const { state, key } = withoutUpload(st, "gen3", "c");
    expect(key).toBe("site/acasa/x-c.jpg");
    expect(activeImages("gen3", state.gen3).map((i) => i.id)).toEqual(["b:tineri"]);
    expect(withoutUpload(st, "gen3", "nu").key).toBeNull();
  });
});
