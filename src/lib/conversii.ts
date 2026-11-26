import { sql, type SQL } from "drizzle-orm";
import type { Db } from "@/db";
import { conversion } from "@/db/schema";
import { clientIp } from "./securitate";
import { deviceOf, localDayHour, normalizePath, visitorOf } from "./vizite";

/**
 * Conversiile, cu sursa lor (Daniel, 14.11.2026: „vreau date precise: cine intră, cum intră, ce conținut atrage”).
 *
 * Când cineva își face cont, pornește un arbore, apasă un buton de început („Începe arborele”, „Plătește”…) sau plătește, căutăm
 * în vizitele de azi (page_view) amprenta anonimă a aceluiași browser și luăm sursa, campania și prima pagină a vizitei în care
 * s-a întâmplat. Rândul din `conversion` NU are id de cont, de arbore sau de plată: e doar un semn „încă un cont, venit din Google
 * pe /ghid/cum-incepi…”. Așa știm ce pagini și ce surse aduc oameni, fără să legăm vizitele de cineva (regula din Analiză).
 *
 * Dacă vizita începuse ieri (amprenta se schimbă zilnic) sau omul are „Do Not Track”, conversia se numără la „necunoscut”.
 */

export const KINDS = ["cta", "cont", "arbore", "plata-start", "plata"] as const;
export type ConversionKind = (typeof KINDS)[number];
export const KIND_LABEL: Record<ConversionKind, string> = {
  cta: "Clic pe un buton de început", cont: "Conturi noi", arbore: "Arbori porniți", "plata-start": "Au deschis plata", plata: "Plăți încheiate",
};

export type Attribution = {
  source: string; medium: string | null; campaign: string | null; referrer: string | null; landing: string | null;
  device: string | null; country: string | null; attributed: boolean;
};
export const UNKNOWN: Attribution = { source: "necunoscut", medium: null, campaign: null, referrer: null, landing: null, device: null, country: null, attributed: false };

type ViewRow = { at: Date | string; path: string; source: string; medium: string | null; campaign: string | null; referrer: string | null; device: string; country: string | null };

/** Din paginile de azi ale unui vizitator (cele mai noi întâi), începutul vizitei de acum: înapoi până la o pauză de peste 30 de minute. */
export function sessionStartOf(views: ViewRow[]): ViewRow | null {
  if (!views.length) return null;
  let start = views[0];
  for (let i = 1; i < views.length; i++) {
    const gap = new Date(start.at).getTime() - new Date(views[i].at).getTime();
    if (gap > 30 * 60_000) break;
    start = views[i];
  }
  return start;
}

/** Sursa vizitei din care vine cererea aceasta (după amprenta zilei); „necunoscut” dacă nu găsim nicio pagină numărată azi. */
export async function attributionOf(db: Db, h: Headers): Promise<Attribution> {
  try {
    const { day } = localDayHour();
    const visitor = await visitorOf(db, day, { ip: clientIp(h), ua: h.get("user-agent"), host: h.get("host") });
    const r = await db.execute(sql`select at, path, source, medium, campaign, referrer, device, country from page_view
      where day = ${day} and visitor = ${visitor} order by at desc limit 300`);
    const s = sessionStartOf((r.rows ?? []) as ViewRow[]);
    if (!s) return { ...UNKNOWN, device: deviceOf(h.get("user-agent") ?? "", null), country: countryOf(h) };
    return { source: s.source, medium: s.medium, campaign: s.campaign, referrer: s.referrer, landing: s.path, device: s.device, country: s.country, attributed: true };
  } catch (e) {
    console.error("conversie: sursa nu s-a putut afla", e);
    return UNKNOWN;
  }
}

const countryOf = (h: Headers) => { const c = h.get("x-vercel-ip-country"); return c && /^[A-Z]{2}$/.test(c) ? c : null; };
const short = (v: string | null | undefined, n: number) => (v ? v.replace(/[^\p{L}\p{N} ._/…-]/gu, "").slice(0, n) || null : null);

/**
 * Notează o conversie. Nu aruncă niciodată (nu strică un cont nou sau o plată). `attr` se dă când sursa e deja știută
 * (la plată, din Stripe); altfel se caută după antetele cererii.
 */
/** Clicurile pe desene (Admin → SEO → Imagini) stau în același tabel, cu `kind = 'imagine'`, dar nu sunt conversii: nu intră în Analiză. */
export type RecordKind = ConversionKind | "imagine";
export async function recordConversion(db: Db, kind: RecordKind, o: {
  headers?: Headers | null; attr?: Attribution | null; label?: string | null; page?: string | null; amount?: number | null; currency?: string | null;
}) {
  try {
    const attr = o.attr ?? (o.headers ? await attributionOf(db, o.headers) : UNKNOWN);
    await db.insert(conversion).values({
      day: localDayHour().day, kind, label: short(o.label, 60), page: o.page ? normalizePath(o.page) : null,
      landing: attr.landing, source: attr.source, medium: attr.medium, campaign: attr.campaign, referrer: attr.referrer,
      device: attr.device, country: attr.country, amount: o.amount ?? null, currency: o.currency ?? null, attributed: attr.attributed,
    });
  } catch (e) {
    console.error(`conversie ${kind}: nu s-a putut nota`, e);
  }
}

/* ---------- Sursa la plată: trece prin Stripe, în metadate (fără nimic despre om, doar sursa și pagina) ---------- */

export function attributionToMetadata(a: Attribution): Record<string, string> {
  if (!a.attributed) return {};
  const m: Record<string, string> = { "metadata[a_src]": a.source.slice(0, 60) };
  if (a.landing) m["metadata[a_land]"] = a.landing.slice(0, 200);
  if (a.campaign) m["metadata[a_camp]"] = a.campaign.slice(0, 60);
  if (a.medium) m["metadata[a_med]"] = a.medium.slice(0, 40);
  if (a.referrer) m["metadata[a_ref]"] = a.referrer.slice(0, 60);
  if (a.device) m["metadata[a_dev]"] = a.device.slice(0, 20);
  if (a.country) m["metadata[a_cc]"] = a.country.slice(0, 2);
  return m;
}

/** null = plata nu se numără (plată de probă a unui admin, sau deschisă înainte de numărare). */
export function attributionFromMetadata(md: Record<string, string> | null | undefined): Attribution | null {
  if (!md?.a_src) return null;
  if (md.a_src === "necunoscut") return UNKNOWN;
  return {
    source: md.a_src, landing: md.a_land || null, campaign: md.a_camp || null, medium: md.a_med || null, referrer: md.a_ref || null,
    device: md.a_dev || null, country: md.a_cc || null, attributed: true,
  };
}

export { CTA_TARGETS, ctaTarget } from "./cta";

/* ------------------------------ Citirile pentru Admin ------------------------------ */

type Range = { from: string; to: string };
const n = (v: unknown) => Number(v ?? 0) || 0;
async function rows(db: Db, q: SQL) { return ((await db.execute(q)).rows ?? []) as Record<string, unknown>[]; }

export type ConvCounts = Record<ConversionKind, number> & { lei: number; eur: number };
const empty = (): ConvCounts => ({ cta: 0, cont: 0, arbore: 0, "plata-start": 0, plata: 0, lei: 0, eur: 0 });

/** Conversiile grupate după o coloană (source / landing / campaign / page / label), plus totalul. */
export async function conversionsBy(db: Db, r: Range, by: "source" | "landing" | "campaign" | "page" | "label" | "medium") {
  const col = sql.raw(`coalesce(${by}, '—')`);
  const list = await rows(db, sql`select ${col} as k, kind, count(*) as c,
      coalesce(sum(amount) filter (where currency = 'ron'), 0) as ron, coalesce(sum(amount) filter (where currency = 'eur'), 0) as eur
    from conversion where day between ${r.from} and ${r.to} and kind <> 'imagine' group by 1, 2`);
  const out = new Map<string, ConvCounts>();
  for (const x of list) {
    const k = String(x.k);
    if (!out.has(k)) out.set(k, empty());
    const c = out.get(k)!;
    const kind = String(x.kind) as ConversionKind;
    if (kind in c) c[kind] += n(x.c);
    c.lei += n(x.ron) / 100; c.eur += n(x.eur) / 100;
  }
  return out;
}

export function totalOf(m: Map<string, ConvCounts>): ConvCounts {
  const t = empty();
  for (const c of m.values()) for (const k of Object.keys(t) as (keyof ConvCounts)[]) t[k] += c[k];
  return t;
}

/** Ce parte din conversii au o sursă găsită (restul: vizita începuse altă zi, Do Not Track etc.). */
export async function attributedShare(db: Db, r: Range) {
  const [x] = await rows(db, sql`select count(*) as c, count(*) filter (where attributed) as a from conversion where day between ${r.from} and ${r.to} and kind not in ('cta', 'imagine')`);
  return { total: n(x?.c), attributed: n(x?.a) };
}

/** Curățenie: aceleași 13 luni ca la vizite. */
export async function cleanupConversions(db: Db) {
  await db.execute(sql`delete from conversion where day < (current_date - interval '13 months')`);
}
