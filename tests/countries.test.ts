import { describe, expect, it } from "vitest";
import { COUNTRY_NAMES, countryCode, countryName, placeKey } from "@/lib/place-key";
import { where } from "@/lib/tree-data";
import { LOCALES } from "@/i18n/locales";

describe("țările, în limba fiecăruia", () => {
  it("numele țării e scris în limba omului, iar în română ca înainte", () => {
    expect(countryName("DE", "ro")).toBe("Germania");
    expect(countryName("DE", "fr")).toBe("Allemagne");
    expect(countryName("DE", "hu")).toBe("Németország");
    expect(countryName("RO", "de")).toBe("Rumänien");
    expect(countryName("GB", "en-US")).toBe("United Kingdom");
  });

  it("țara scrisă în oricare limbă a site-ului e recunoscută (și deci găsită pe hartă)", () => {
    for (const l of LOCALES) for (const cc of Object.keys(COUNTRY_NAMES)) expect(countryCode(countryName(cc, l)), `${l} ${cc}`).toBe(cc);
    expect(countryCode("Großbritannien")).toBe("GB");
    expect(countryCode("Hollande")).toBe("NL");
    expect(countryCode("EE. UU.")).toBe("US");
    expect(countryCode("Moldawien")).toBe("MD");
    expect(placeKey("Torino", "Italien")).toBe(placeKey("Torino", "Italia"));
    expect(placeKey("Huedin", "Roumanie")).toBe(placeKey("Huedin", null));
  });

  it("România nu se mai scrie lângă loc, oricum ar fi scrisă; celelalte țări, în limba celui care citește", () => {
    expect(where("Huedin", "România")).toBe("Huedin");
    expect(where("Huedin", "Rumänien", "de")).toBe("Huedin");
    expect(where("Huedin", "Románia", "hu")).toBe("Huedin");
    expect(where("Torino", "Italia")).toBe("Torino, Italia");
    expect(where("Torino", "Italia", "en-GB")).toBe("Torino, Italy");
    expect(where("Torino", "Italien", "ro")).toBe("Torino, Italia");
    expect(where("Sydney", "Atlantida", "fr")).toBe("Sydney, Atlantida");
  });
});
