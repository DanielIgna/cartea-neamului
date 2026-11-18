import type { Country, Region, Theme } from "../tipuri";
import { APROBATE } from "./aprobate";
import { DRAFT_COUNTRIES } from "./tari";
import { DRAFT_REGIONS } from "./regiuni";
import { DRAFT_THEMES } from "./teme";

/**
 * Textele noi de diaspora (Europa, Ucraina, valurile de emigrare) se scriu întâi ca ciorne (Daniel, 18.11.2026): nu au pagină
 * publică până nu le aprobă. Aprobarea = cheia în aprobate.ts; atunci intră în COUNTRIES, REGIONS și THEMES ca oricare alta.
 */
export const draftKey = {
  country: (c: Country) => `tara:${c.slug}`,
  region: (r: Region) => `regiune:${r.country}/${r.slug}`,
  theme: (t: Theme) => `tema:${t.slug}`,
};

export const APPROVED_COUNTRIES = DRAFT_COUNTRIES.filter((c) => APROBATE.has(draftKey.country(c)));
export const APPROVED_REGIONS = DRAFT_REGIONS.filter((r) => APROBATE.has(draftKey.region(r)));
export const APPROVED_THEMES = DRAFT_THEMES.filter((t) => APROBATE.has(draftKey.theme(t)));

/** Ciornele încă neaprobate (pentru Admin și previzualizare). */
export const PENDING = {
  countries: DRAFT_COUNTRIES.filter((c) => !APROBATE.has(draftKey.country(c))),
  regions: DRAFT_REGIONS.filter((r) => !APROBATE.has(draftKey.region(r))),
  themes: DRAFT_THEMES.filter((t) => !APROBATE.has(draftKey.theme(t))),
};
/** Toate țările, publicate sau nu (o regiune-ciornă poate ține de o țară-ciornă, ca Ucraina). */
export { DRAFT_COUNTRIES };
