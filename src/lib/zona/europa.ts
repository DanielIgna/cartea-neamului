import { COUNTRIES } from "@/lib/diaspora/tari";
import { COUNTRY_OF, HUB_PATH, regionPath } from "@/lib/diaspora/index";
import { getRegion } from "@/lib/diaspora/america";
import type { CountryKey } from "@/lib/diaspora/tipuri";
import type { ZoneEntry } from "./registru";

/**
 * Zonele din Europa (și Ucraina) pentru blocul de sugestii (firul „Extinde SEO-ul diasporei în Europa”, 19.11.2026). Intră
 * doar paginile publicate: o regiune sau o țară încă în ciornă (src/lib/diaspora/ciorne) nu are pagină, deci e sărită.
 *
 * Codurile de regiune sunt cele ISO 3166-2 fără țară, cum vin în x-vercel-ip-country-region. Pentru Italia și Spania antetul
 * poate aduce regiunea sau provincia, așa că trecem ambele coduri spre aceeași pagină.
 */
const GENERAL = ["/ghid/cum-afli-satul-de-origine", "/ghid/cum-ceri-un-act-de-stare-civila", "/ghid/redobandirea-cetateniei-acte-stramosi", "/ghid/intrebari-pentru-bunici"];
const SAXONS = ["/ghid/sasii-din-transilvania-registre", "/ghid/svabii-banateni-genealogie", "/ghid/documente-in-maghiara-si-germana"];

/** Țara (cheia din diaspora), codul ISO și ghidurile ei. */
const COUNTRY_ZONES: [CountryKey, string, string[]][] = [
  ["it", "IT", GENERAL], ["es", "ES", GENERAL], ["de", "DE", [...SAXONS, ...GENERAL]], ["at", "AT", [...SAXONS, ...GENERAL]],
  ["gb", "GB", GENERAL], ["fr", "FR", GENERAL], ["nl", "NL", GENERAL], ["be", "BE", GENERAL], ["ie", "IE", GENERAL], ["pt", "PT", GENERAL],
  ["gr", "GR", GENERAL], ["cy", "CY", GENERAL],
  ["ua", "UA", ["/ghid/bucovina-registre-si-arhive", "/ghid/basarabia-registrele-parohiale", "/ghid/redobandirea-cetateniei-acte-stramosi", "/ghid/deportati-in-baragan-si-siberia"]],
];

/** Regiunile: țara, slug-ul paginii și codurile care o aleg (regiunea, apoi provinciile ei). */
const REGION_CODES: [CountryKey, string, string[]][] = [
  ["it", "lazio", ["62", "RM", "LT", "FR", "VT", "RI"]],
  ["it", "piemonte", ["21", "TO", "AL", "AT", "CN", "NO", "VC", "BI", "VB"]],
  ["it", "lombardia", ["25", "MI", "BG", "BS", "MB", "VA", "CO", "LC", "PV", "CR", "MN", "LO", "SO"]],
  ["it", "veneto", ["34", "VE", "VR", "PD", "VI", "TV", "RO", "BL"]],
  ["es", "castilla-la-mancha", ["CM", "GU", "TO", "CR", "AB", "CU"]],
  ["es", "andalucia", ["AN", "AL", "CA", "CO", "GR", "H", "J", "MA", "SE"]],
  ["es", "comunitat-valenciana", ["VC", "V", "CS", "A"]],
  ["es", "cataluna", ["CT", "B", "L", "T", "GI"]],
  ["de", "bayern", ["BY"]], ["de", "baden-wuerttemberg", ["BW"]], ["de", "nordrhein-westfalen", ["NW"]],
  ["at", "oberoesterreich", ["4"]],
  ["ua", "cernauti", ["77"]], ["ua", "sudul-basarabiei", ["51"]],
];

const published = (key: CountryKey) => COUNTRIES.some((c) => c.slug === COUNTRY_OF[key]);

export const EUROPE_ZONES: ZoneEntry[] = [
  ...COUNTRY_ZONES.filter(([key]) => published(key)).map(([key, code, guides]): ZoneEntry => ({ country: code, page: `${HUB_PATH}/${COUNTRY_OF[key]}`, guides })),
  ...REGION_CODES.flatMap(([key, slug, codes]) => {
    const r = published(key) ? getRegion(key, slug) : null;
    const code = COUNTRY_ZONES.find(([k]) => k === key)![1];
    return r ? codes.map((region): ZoneEntry => ({ country: code, region, page: regionPath(r), label: { ro: r.name.ro, en: r.name.en ?? r.name.ro } })) : [];
  }),
];
