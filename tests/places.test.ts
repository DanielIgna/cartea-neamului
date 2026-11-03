import { describe, expect, it } from "vitest";
import { parsePlace, placeKey, plainPlace, countryCode } from "@/lib/place-key";
import { candidates, resolvePlaces, searchPlaces, choicesFor } from "@/lib/places";

describe("numele locurilor", () => {
  it("scrie la fel ortografia veche, fără diacritice și prescurtările", () => {
    expect(plainPlace("Târgu-Mureș")).toBe(plainPlace("Targu Mures"));
    expect(plainPlace("Tg. Mureș")).toBe(plainPlace("Târgu Mureș"));
    expect(plainPlace("Sighetul Marmației")).toBe(plainPlace("Sighetu Marmatiei"));
    expect(placeKey("Huedin", "România")).toBe(placeKey(" huedin ", ""));
    expect(placeKey("", "România")).toBeNull();
    expect(placeKey("", "Italia")).toBe("|IT");
    expect(countryCode("Statele Unite ale Americii")).toBe("US");
    expect(countryCode("SUA")).toBe("US");
  });
  it("desparte satul, comuna, județul și țara", () => {
    expect(parsePlace("sat Domoșu, com. Sâncraiu, jud. Cluj")).toEqual({ names: ["domosu"], county: "CJ", commune: "sancraiu", country: null });
    expect(parsePlace("Torino, Italia")).toMatchObject({ names: ["torino"], country: "IT" });
    expect(parsePlace("Valea Mare (Bistrița-Năsăud)")).toMatchObject({ names: ["valea mare"], county: "BN" });
  });
});

describe("gazetarul", () => {
  it("găsește satele din jurul Huedinului, și scrise cu ortografia veche", async () => {
    const [h] = (await candidates("Huedin", "România")).list;
    expect(h).toMatchObject({ name: "Huedin", id: "RO:55455", detail: "oraș, jud. Cluj" });
    expect((await candidates("Sîncraiu", null)).list.map((e) => e.detail)).toContain("comună, jud. Cluj");
    expect((await candidates("sat Domoșu, com. Sâncraiu, jud. Cluj", "România")).list).toHaveLength(1);
    expect((await candidates("Bánffyhunyad", "")).list[0].name).toBe("Huedin");
    expect((await candidates("Viena", "Austria")).list[0].name).toBe("Viena");
    expect((await candidates("Chișinău", "Republica Moldova")).list[0].name).toBe("Chișinău");
    expect((await candidates("Cluj", "România")).list[0].name).toBe("Cluj-Napoca");
    expect((await candidates("București", "România")).list[0].detail).toBe("capitala");
  });
  it("găsește orașele din străinătate după numele românesc", async () => {
    expect((await candidates("Torino", "Italia")).list[0]).toMatchObject({ name: "Torino", cc: "IT", id: "IT:turin:45.07,7.69" });
    expect((await candidates("Torino", "România")).list[0]).toMatchObject({ name: "Torino", cc: "IT", id: "IT:turin:45.07,7.69" });
    expect((await candidates("Iași, Moldova", "România")).list[0]).toMatchObject({ name: "Iași", cc: "RO" });
    expect(await candidates("front, Ungaria", "România")).toMatchObject({ list: [], approx: "HU" });
    expect(await candidates("front, Galiția", "România")).toMatchObject({ list: [], approx: null });
  });
  it("alege satul cu nume des întâlnit după celelalte locuri ale neamului", async () => {
    const refs = [
      { key: "huedin|RO", text: "Huedin", country: "România", weight: 6 },
      { key: "domosu|RO", text: "Domoșu", country: "România", weight: 3 },
      { key: "valea mare|RO", text: "Valea Mare", country: "România", weight: 1 },
      { key: "sfantu gheorghe|RO", text: "Sf. Gheorghe", country: "România", weight: 1 },
    ];
    const r = await resolvePlaces(refs);
    expect(r.get("huedin|RO")).toMatchObject({ how: "found" });
    const vm = r.get("valea mare|RO")!;
    expect(vm.how).toBe("guess");
    expect(vm.choices).toBeGreaterThan(20);
    expect(["jud. Bistrița-Năsăud", "jud. Cluj", "jud. Mureș", "jud. Sălaj", "jud. Alba"].some((j) => vm.detail.endsWith(j))).toBe(true);
    expect(r.get("sfantu gheorghe|RO")).toMatchObject({ name: "Sfântu Gheorghe", detail: "municipiu, jud. Covasna" });
    const pinned = await resolvePlaces(refs, [{ key: "valea mare|RO", placeId: "RO:35410", name: "Valea Mare", detail: "com. Urmeniș, jud. Bistrița-Năsăud", lat: 46.8, lng: 24.39 }]);
    expect(pinned.get("valea mare|RO")).toMatchObject({ how: "pin", id: "RO:35410" });
  });
  it("caută și cu greșeli mici de scriere", async () => {
    expect((await searchPlaces("Sincrau", "România")).map((s) => s.name)).toContain("Sâncraiu");
    expect((await searchPlaces("Domo", "România"))[0].name).toBe("Domoșu");
    expect((await searchPlaces("Torin", "Italia"))[0]).toMatchObject({ name: "Torino" });
    const near = await choicesFor("Valea Mare", "România", { lat: 46.86, lng: 23.02 });
    expect(near.length).toBeGreaterThan(20);
  });
});
