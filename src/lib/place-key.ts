/**
 * Numele locurilor, așa cum le scriu oamenii: „Huedin”, „sat Domoșu, com. Sâncraiu, jud. Cluj”, „Tg. Mureș”,
 * „Sîncraiu” (cu ortografia veche) sau „Torino, Italia”. Aici sunt doar regulile de scriere, fără gazetar,
 * ca să le poată folosi și pagina din browser.
 */

export const COUNTIES: Record<string, string> = {
  AB: "Alba", AR: "Arad", AG: "Argeș", BC: "Bacău", BH: "Bihor", BN: "Bistrița-Năsăud", BT: "Botoșani", BV: "Brașov", BR: "Brăila", B: "București",
  BZ: "Buzău", CS: "Caraș-Severin", CL: "Călărași", CJ: "Cluj", CT: "Constanța", CV: "Covasna", DB: "Dâmbovița", DJ: "Dolj", GL: "Galați", GR: "Giurgiu",
  GJ: "Gorj", HR: "Harghita", HD: "Hunedoara", IL: "Ialomița", IS: "Iași", IF: "Ilfov", MM: "Maramureș", MH: "Mehedinți", MS: "Mureș", NT: "Neamț",
  OT: "Olt", PH: "Prahova", SM: "Satu Mare", SJ: "Sălaj", SB: "Sibiu", SV: "Suceava", TR: "Teleorman", TM: "Timiș", TL: "Tulcea", VS: "Vaslui",
  VL: "Vâlcea", VN: "Vrancea",
};

/** Țările pentru care harta știe orașele (România are și toate satele). */
export const COUNTRY_NAMES: Record<string, string> = {
  RO: "România", MD: "Republica Moldova", IT: "Italia", ES: "Spania", DE: "Germania", FR: "Franța", AT: "Austria", HU: "Ungaria", GB: "Marea Britanie",
  IE: "Irlanda", BE: "Belgia", NL: "Olanda", CH: "Elveția", SE: "Suedia", DK: "Danemarca", NO: "Norvegia", FI: "Finlanda", PT: "Portugalia", GR: "Grecia",
  CY: "Cipru", RS: "Serbia", BG: "Bulgaria", UA: "Ucraina", CZ: "Cehia", PL: "Polonia", IL: "Israel", US: "Statele Unite ale Americii", CA: "Canada",
  AU: "Australia", NZ: "Noua Zeelandă", AE: "Emiratele Arabe Unite", SK: "Slovacia", HR: "Croația", SI: "Slovenia", LU: "Luxemburg", MT: "Malta",
};

/** Mijlocul aproximativ al fiecărei țări, pentru cine are trecută doar țara (de pildă „front, Ungaria”). */
export const COUNTRY_CENTER: Record<string, [number, number]> = {
  RO: [45.9, 24.97], MD: [47.2, 28.5], IT: [42.8, 12.5], ES: [40.2, -3.6], DE: [51.1, 10.4], FR: [46.6, 2.4], AT: [47.6, 14.1], HU: [47.1, 19.4],
  GB: [53.5, -2.0], IE: [53.2, -8.0], BE: [50.6, 4.6], NL: [52.2, 5.5], CH: [46.8, 8.2], SE: [62.0, 15.0], DK: [56.0, 10.0], NO: [61.0, 9.0],
  FI: [63.0, 26.0], PT: [39.6, -8.0], GR: [39.3, 22.0], CY: [35.0, 33.2], RS: [44.0, 20.9], BG: [42.7, 25.3], UA: [49.0, 31.4], CZ: [49.8, 15.5],
  PL: [52.0, 19.4], IL: [31.4, 35.0], US: [39.8, -98.6], CA: [56.0, -106.0], AU: [-25.3, 133.8], NZ: [-41.8, 172.0], AE: [24.0, 54.0],
  SK: [48.7, 19.7], HR: [45.1, 15.2], SI: [46.1, 14.8], LU: [49.8, 6.1], MT: [35.9, 14.4],
};

/**
 * Forma de comparat a unui nume: litere mici, fără diacritice, fără cratime și puncte, „-ul” de la sfârșit căzut
 * („Sighetul” = „Sighetu”), iar prescurtările „Sf.”, „Tg.”, „Rm.” scrise întreg.
 */
export function plainPlace(s: string): string {
  const words = s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[‐-―'’`".]/g, " ").replace(/-/g, " ").split(/\s+/).filter(Boolean);
  return words.map((w) => ABBR[w] ?? (w.length > 3 && w.endsWith("ul") ? w.slice(0, -1) : w)).join(" ");
}
const ABBR: Record<string, string> = { sf: "sfantu", sfant: "sfantu", sfintu: "sfantu", tg: "targu", tirgu: "targu", rm: "ramnicu", rimnicu: "ramnicu", cimpulung: "campulung", cimpia: "campia" };

/** Aceeași formă, dar cu „â” citit ca „î” (ortografia de dinainte de 1993: „Sîncraiu”, „Tîrgu”). */
export function plainPlaceOld(s: string): string {
  return plainPlace(s.replace(/â/g, "î").replace(/Â/g, "Î"));
}

const COUNTRY_ALIASES: Record<string, string> = {
  ro: "RO", rumania: "RO", romania: "RO", moldova: "MD", basarabia: "MD", "rep moldova": "MD", italy: "IT", spain: "ES", espana: "ES", germany: "DE",
  deutschland: "DE", france: "FR", osterreich: "AT", hungary: "HU", magyarorszag: "HU", anglia: "GB", "regatul unit": "GB", uk: "GB",
  "united kingdom": "GB", england: "GB", scotia: "GB", "tara galilor": "GB", ireland: "IE", belgium: "BE", "tarile de jos": "NL", netherlands: "NL",
  switzerland: "CH", schweiz: "CH", sweden: "SE", denmark: "DK", norway: "NO", finland: "FI", portugal: "PT", greece: "GR", cyprus: "CY",
  ukraine: "UA", "republica ceha": "CZ", czechia: "CZ", poland: "PL", "statele unite": "US", sua: "US", usa: "US", america: "US",
  "new zealand": "NZ", eau: "AE", uae: "AE", slovakia: "SK", croatia: "HR", luxembourg: "LU",
};
for (const [cc, name] of Object.entries(COUNTRY_NAMES)) COUNTRY_ALIASES[plainPlace(name)] = cc;

/** „Italia” → IT. Gol sau necunoscut → null. */
export function countryCode(text: string | null | undefined): string | null {
  const k = text ? plainPlace(text) : "";
  return k ? COUNTRY_ALIASES[k] ?? null : null;
}

const COUNTY_BY_NAME: Record<string, string> = Object.fromEntries(Object.entries(COUNTIES).flatMap(([c, n]) => [[plainPlace(n), c], [c.toLowerCase(), c]]));
COUNTY_BY_NAME["bistrita"] = "BN"; COUNTY_BY_NAME["caras"] = "CS"; COUNTY_BY_NAME["severin"] = "CS"; COUNTY_BY_NAME["satu mare"] = "SM"; COUNTY_BY_NAME["sm"] = "SM";
export function countyCode(text: string): string | null {
  return COUNTY_BY_NAME[plainPlace(text)] ?? null;
}

/**
 * Cheia sub care ținem minte un loc scris într-o fișă (și un loc pus de mână pe hartă): textul locului plus țara.
 * „Huedin” cu țara România și „huedin” fără țară au aceeași cheie.
 */
export function placeKey(text: string | null | undefined, country: string | null | undefined): string | null {
  const t = text?.trim() ? plainPlace(text) : "";
  const cc = countryCode(country) ?? (country?.trim() ? plainPlace(country) : "RO");
  if (!t && (cc === "RO" || !country?.trim())) return null;
  return `${t}|${cc}`;
}

export type Prefix = "county" | "commune" | "name";
const PREFIX: Record<string, Prefix> = {
  jud: "county", judet: "county", judetu: "county", judetul: "county", comuna: "commune", com: "commune", sat: "name", satu: "name", satul: "name",
  oras: "name", orasu: "name", orasul: "name", mun: "name", municipiu: "name", municipiul: "name", loc: "name", localitatea: "name", cartier: "name",
};

/** „sat Domoșu, com. Sâncraiu, jud. Cluj” → numele de căutat, în ordine, și indiciile (județ, comună, țară). */
export function parsePlace(text: string) {
  const parts = text.split(/[,;()/]|\s[-–]\s/).map((p) => p.trim()).filter(Boolean);
  const names: string[] = [];
  let county: string | null = null, commune: string | null = null, country: string | null = null;
  parts.forEach((part, i) => {
    const words = plainPlace(part).split(" ");
    const kind = PREFIX[words[0]];
    const rest = kind ? words.slice(1).join(" ") : words.join(" ");
    if (!rest) return;
    if (kind === "county") { county = countyCode(rest) ?? county; return; }
    if (kind === "commune") { commune = rest; return; }
    if (i > 0 && !kind) {
      const cc = countryCode(rest);
      if (cc) { country = cc; return; }
      const cj = countyCode(rest);
      if (cj) { county = cj; return; }
    }
    names.push(rest);
  });
  return { names, county: county as string | null, commune: commune as string | null, country: country as string | null };
}
