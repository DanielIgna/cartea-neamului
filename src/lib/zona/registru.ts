import { COUNTRIES } from "@/lib/diaspora/tari";
import { HUB_PATH, regionPath } from "@/lib/diaspora/index";
import { getRegion } from "@/lib/diaspora/america";
import { getEntry } from "@/lib/continut/colectii";
import { localizedPath, type Locale } from "@/i18n/locales";
import { EUROPE_ZONES } from "./europa";
import { DIASPORA_LANGS } from "@/lib/diaspora/limbi-generat";
import { LANG_OF } from "@/lib/diaspora/tipuri";

/**
 * Sugestii după zona vizitatorului (Daniel, 18.11.2026): cine intră din Ohio vede pagina românilor din Ohio, pagina SUA și
 * câteva ghiduri potrivite, în limba lui, plus legătura spre celelalte state (poate s-a mutat de curând). Zona vine doar din
 * antetele de țară și regiune ale cererii (x-vercel-ip-country, x-vercel-ip-country-region); nu se salvează nimic.
 *
 * Registrul e comun pentru toate țările: aici sunt SUA și Canada; țările din Europa se adaugă cu intrări de același fel
 * (firul „Extinde SEO-ul diasporei în Europa”). O intrare fără `region` e cea a țării.
 */
export type ZoneEntry = {
  /** Codul țării, ISO 3166-1, ca în x-vercel-ip-country: „US”, „CA”. */
  country: string;
  /** Codul regiunii fără țară, ca în x-vercel-ip-country-region: „OH”, „ON”. Lipsește la intrarea țării. */
  region?: string;
  /** Pagina zonei, fără prefix de limbă. */
  page: string;
  /** Ghidurile potrivite zonei (căi /ghid/…), doar cele publicate; cele nepublicate sunt sărite. */
  guides?: string[];
  /** Numele zonei, când nu e un stat SUA sau o provincie canadiană (regiunile din Europa). */
  label?: Partial<Record<"ro" | "en", string>>;
};

/** Codurile poștale ale statelor SUA (ISO 3166-2:US fără „US-”), după slug-ul paginii din src/lib/diaspora/america.ts. */
const US_CODES: Record<string, string> = {
  alabama: "AL", alaska: "AK", arizona: "AZ", arkansas: "AR", california: "CA", colorado: "CO", connecticut: "CT", delaware: "DE",
  florida: "FL", georgia: "GA", hawaii: "HI", idaho: "ID", illinois: "IL", indiana: "IN", iowa: "IA", kansas: "KS", kentucky: "KY",
  louisiana: "LA", maine: "ME", maryland: "MD", massachusetts: "MA", michigan: "MI", minnesota: "MN", mississippi: "MS", missouri: "MO",
  montana: "MT", nebraska: "NE", nevada: "NV", "new-hampshire": "NH", "new-jersey": "NJ", "new-mexico": "NM", "new-york": "NY",
  "north-carolina": "NC", "north-dakota": "ND", ohio: "OH", oklahoma: "OK", oregon: "OR", pennsylvania: "PA", "rhode-island": "RI",
  "south-carolina": "SC", "south-dakota": "SD", tennessee: "TN", texas: "TX", utah: "UT", vermont: "VT", virginia: "VA",
  washington: "WA", "west-virginia": "WV", wisconsin: "WI", wyoming: "WY",
};
/** Provinciile și teritoriile Canadei (ISO 3166-2:CA fără „CA-”). */
const CA_CODES: Record<string, string> = {
  ontario: "ON", quebec: "QC", alberta: "AB", "british-columbia": "BC", manitoba: "MB", saskatchewan: "SK", "nova-scotia": "NS",
  "new-brunswick": "NB", "newfoundland-and-labrador": "NL", "prince-edward-island": "PE", yukon: "YT", "northwest-territories": "NT", nunavut: "NU",
};

/** Ghidurile comune pentru SUA și Canada (doar cele publicate apar). Ghidurile noi pentru America de Nord se adaugă aici. */
const NORTH_AMERICA_GUIDES = [
  "/ghid/emigrarea-in-america", "/ghid/nume-schimbate-si-variante", "/ghid/intrebari-pentru-bunici", "/ghid/cum-inregistrezi-glasul-bunicilor",
  "/ghid/trace-romanian-ancestors-from-us-canada", "/ghid/romanian-immigration-waves-us-canada", "/ghid/valurile-de-emigrare-in-america-de-nord",
  "/ghid/arbore-genealogic-familie-romania-sua-canada", "/ghid/romanian-surnames-changed-in-america", "/ghid/preserve-immigrant-parents-stories",
];
/** Ghiduri în plus pentru o regiune anume (de pildă Canada de Vest, unde au venit familii din Bucovina). */
const REGION_GUIDES: Record<string, string[]> = {
  "CA-AB": ["/ghid/bucovina-registre-si-arhive"], "CA-SK": ["/ghid/bucovina-registre-si-arhive"], "CA-MB": ["/ghid/bucovina-registre-si-arhive"],
  "US-OH": ["/ghid/hpdt-registrele-din-transilvania"], "US-PA": ["/ghid/hpdt-registrele-din-transilvania"],
};

const country = (key: "us" | "ca") => `${HUB_PATH}/${key === "us" ? "statele-unite" : "canada"}`;
function regionsOf(code: "US" | "CA", codes: Record<string, string>): ZoneEntry[] {
  const key = code === "US" ? "us" : "ca";
  return Object.entries(codes).flatMap(([slug, region]) => {
    const r = getRegion(key, slug);
    return r ? [{ country: code, region, page: regionPath(r), guides: REGION_GUIDES[`${code}-${region}`] }] : [];
  });
}

export const ZONES: ZoneEntry[] = [
  { country: "US", page: country("us"), guides: NORTH_AMERICA_GUIDES },
  { country: "CA", page: country("ca"), guides: NORTH_AMERICA_GUIDES },
  ...regionsOf("US", US_CODES),
  ...regionsOf("CA", CA_CODES),
  ...EUROPE_ZONES,
];

export type ZoneLink = { href: string; label: string };
export type ZoneSuggestion = { region: ZoneLink | null; country: ZoneLink; guides: ZoneLink[]; lang: "ro" | "en" };

/** Titlul unei pagini de diaspora în limba cerută (numele statului sau al țării). */
function placeName(country: string, region: string | undefined, lang: "ro" | "en"): string {
  const key = country === "US" ? "us" : country === "CA" ? "ca" : null;
  if (region && key) {
    const slug = Object.entries(key === "us" ? US_CODES : CA_CODES).find(([, c]) => c === region)?.[0];
    const r = slug ? getRegion(key, slug) : null;
    if (r) return r.name[lang] ?? r.name.en ?? r.name.ro ?? slug!;
  }
  const c = COUNTRIES.find((x) => x.code === country);
  return c ? (c.name[lang] ?? c.name.en ?? c.name.ro ?? country) : country;
}

/**
 * Ce îi arătăm cuiva venit din țara și regiunea date, în limba lui (română pe română, engleză în rest). Null dacă țara nu e în
 * registru (din România, de pildă, nu arătăm nimic).
 */
export function suggestFor(countryCode: string | null | undefined, regionCode: string | null | undefined, locale: Locale): ZoneSuggestion | null {
  const cc = (countryCode ?? "").toUpperCase();
  const rc = (regionCode ?? "").toUpperCase();
  const top = ZONES.find((z) => z.country === cc && !z.region);
  if (!top) return null;
  const zone = rc ? ZONES.find((z) => z.country === cc && z.region === rc) ?? null : null;
  const lang = locale === "ro" ? "ro" : "en";
  // Paginile de diaspora au adresă pe limbă (/en-us/diaspora/…); ghidurile sunt doar în română, fără prefix.
  // În Europa, pagina e adesea scrisă și în limba țării (it, es, de, fr, nl): atunci o deschidem direct în limba omului.
  const page = (p: string) => {
    const own = LANG_OF[locale];
    if (own && DIASPORA_LANGS[p]?.split(" ").includes(own)) return localizedPath(p, locale);
    return localizedPath(p, locale === "ro" ? "ro" : locale === "en-GB" ? "en-GB" : "en-US");
  };
  const guides = [...new Set([...(zone?.guides ?? []), ...(top.guides ?? [])])]
    .map((p) => ({ p, e: getEntry("ghid", p.replace(/^\/ghid\//, "")) }))
    .filter((g) => !!g.e)
    .slice(0, 4)
    .map(({ p, e }) => ({ href: p, label: e!.title }));
  return {
    lang,
    region: zone ? { href: page(zone.page), label: zone.label?.[lang] ?? zone.label?.en ?? placeName(cc, rc, lang) } : null,
    country: { href: page(top.page), label: placeName(cc, undefined, lang) },
    guides,
  };
}
