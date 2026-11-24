import type { Country, CountryExtra, Lang, Link, Region } from "../tipuri";
import type { NewLang } from "./tip";
import { PT } from "./pt";
import { EL } from "./el";
import { SV } from "./sv";
import { DA } from "./da";
import { NB } from "./nb";
import { UK } from "./uk";
import { SR } from "./sr";
import { BG } from "./bg";
import { TR } from "./tr";

/** Limbile noi ale paginilor de diaspora (vezi tip.ts). */
export const NEW_LANGS = { pt: PT, el: EL, sv: SV, da: DA, nb: NB, uk: UK, sr: SR, bg: BG, tr: TR } satisfies Partial<Record<Lang, NewLang>>;
const ALL = Object.entries(NEW_LANGS) as [Lang, NewLang][];

/** Țările, cu numele în limbile noi și, pentru țara fiecărei limbi, textul ei (limba țării trece prima). */
export function withNewCountries(cs: Country[]): Country[] {
  return cs.map((c) => {
    const o: Country = {
      ...c, langs: [...c.langs], name: { ...c.name }, where: { ...c.where }, history: { ...c.history },
      size: c.size ? { ...c.size } : null, icr: c.icr ? { ...c.icr } : null,
      records: c.records.map((r) => ({ ...r, note: { ...r.note } })),
    };
    for (const [l, d] of ALL) {
      if (d.names[c.slug]) o.name[l] = d.names[c.slug];
      const k = d.countries[c.slug];
      if (!k) continue;
      o.where[l] = k.where;
      if (o.size && k.size) o.size[l] = k.size;
      if (o.icr && k.icr) o.icr[l] = k.icr;
      o.history[l] = k.history;
      k.records?.forEach((n, i) => { if (o.records[i]) o.records[i].note[l] = n; });
      if (!o.langs.includes(l)) o.langs.unshift(l);
    }
    return o;
  });
}

/** Ghidul, particularitățile și întrebările țărilor, în limba lor. */
export function withNewExtra(ex: Record<string, CountryExtra>): Record<string, CountryExtra> {
  const out: Record<string, CountryExtra> = {};
  for (const [slug, e] of Object.entries(ex)) {
    const o: CountryExtra = { ...e, guide: { ...e.guide }, specifics: { ...e.specifics }, faq: { ...e.faq }, stats: e.stats ? { ...e.stats, note: { ...e.stats.note } } : undefined };
    for (const [l, d] of ALL) {
      const k = d.countries[slug];
      if (!k) continue;
      o.guide[l] = k.guide; o.specifics[l] = k.specifics; o.faq[l] = k.faq;
      if (o.stats && k.stats) o.stats.note[l] = k.stats;
    }
    out[slug] = o;
  }
  return out;
}

/** Orașele și regiunile țărilor limbilor noi (Lisabona, Atena, Cernăuți …), în limba țării. */
export function withNewRegions(rs: Region[]): Region[] {
  return rs.map((r) => {
    let o = r;
    for (const [l, d] of ALL) {
      const k = d.regions?.[`${r.country}/${r.slug}`];
      if (!k) continue;
      if (o === r) o = { ...r, langs: [...r.langs], name: { ...r.name }, where: { ...r.where }, notes: { ...r.notes } };
      o.name[l] = k.name; o.where[l] = k.where; o.notes[l] = k.notes;
      if (!o.langs.includes(l)) o.langs.push(l);
    }
    return o;
  });
}

/** Notele surselor din România, în limbile noi. */
export const withNewRomania = (ls: Link[]): Link[] => ls.map((s, i) => ({ ...s, note: { ...s.note, ...Object.fromEntries(ALL.map(([l, d]) => [l, d.romania[i]])) } }));

export const NEW_UI = Object.fromEntries(ALL.map(([l, d]) => [l, d.ui])) as Record<keyof typeof NEW_LANGS, NewLang["ui"]>;
export const NEW_XUI = Object.fromEntries(ALL.map(([l, d]) => [l, d.x])) as Record<keyof typeof NEW_LANGS, NewLang["x"]>;
