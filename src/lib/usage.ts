/**
 * Cât folosesc oamenii site-ul, doar la cei care au spus „Bine” la anunțul despre asta (acordul `usage` din src/lib/legal.ts).
 * Browserul trimite din când în când câte secunde a stat omul, activ, într-o parte a site-ului; aici se adună pe zile. Nu se
 * păstrează adresa paginii (cu arborele sau persoana din ea), ce scrie omul sau pe ce apasă: doar numele părții din site.
 */
import { and, desc, eq, gte, lt, sql } from "drizzle-orm";
import type { Db } from "@/db";
import { consent, usageDay } from "@/db/schema";
import { DEMO_EMAIL } from "./demo";

export const SECTIONS = {
  acasa: "Prima pagină",
  pornire: "Pornirea arborelui",
  "arbore-hour": "Arborele · Clepsidră",
  "arbore-fan": "Arborele · Evantai",
  "arbore-classic": "Arborele · Clasic",
  "arbore-tree": "Arborele · Copac",
  "arbore-360": "Arborele · Copac 360°",
  "arbore-desc": "Arborele · Descendenți",
  arbore: "Arborele",
  persoana: "Fișa unei persoane și lada ei",
  poveste: "Povestea unei persoane",
  autobiografie: "Autobiografia",
  "la-bunici": "„La bunici”",
  carte: "Cartea neamului",
  cronologie: "Cronologia",
  harta: "Harta neamului",
  calatorie: "Călătoria în timp",
  "istoria-bisericii": "Istoria Bisericii",
  mesaje: "Mesajele",
  amintire: "O amintire primită",
  "datele-mele": "Datele mele",
  altele: "Alte pagini",
} as const;
export type Section = keyof typeof SECTIONS;
export const isSection = (v: unknown): v is Section => typeof v === "string" && Object.prototype.hasOwnProperty.call(SECTIONS, v);

/** Partea din site a unei adrese. `hint` vine de la pagina însăși (felul în care e desenat arborele). Panoul de admin nu se numără. */
export function sectionOf(path: string, hint?: string | null): Section | null {
  const p = (path.split(/[?#]/)[0] ?? "").replace(/\/+$/, "") || "/";
  if (p === "/admin" || p.startsWith("/admin/")) return null;
  const tree = p.match(/^\/arbore\/[^/]+(?:\/(.*))?$/);
  if (tree && !tree[1] && hint && hint.startsWith("arbore-") && isSection(hint)) return hint;
  if (p === "/") return "acasa";
  if (p === "/arbore-nou") return "pornire";
  if (p === "/mesaje" || p.startsWith("/mesaje/")) return "mesaje";
  if (p === "/datele-mele") return "datele-mele";
  if (p === "/istoria-bisericii" || p.startsWith("/istoria-bisericii/")) return "istoria-bisericii";
  if (p.startsWith("/a/")) return "amintire";
  if (tree) {
    const rest = tree[1] ?? "";
    if (!rest) return "arbore";
    if (rest === "bun-venit") return "pornire";
    if (rest === "carte" || rest === "cronologie" || rest === "harta" || rest === "calatorie") return rest;
    const pers = rest.match(/^persoana\/[^/]+(?:\/(.*))?$/);
    if (pers) {
      const r = pers[1] ?? "";
      if (r.startsWith("autobiografie")) return "autobiografie";
      if (r === "la-bunici") return "la-bunici";
      if (r === "poveste") return "poveste";
      return "persoana";
    }
  }
  return "altele";
}

/** O bătaie de la browser are cel mult atâtea secunde (browserul trimite la un minut); o zi într-o parte, cel mult o zi. */
export const MAX_BEAT = 90;
const MAX_DAY = 86_400;
/** Cât se păstrează: 13 luni, ca să se poată compara o lună cu aceeași lună de anul trecut. */
export const KEEP_DAYS = 400;

const dayOf = (now: Date) => now.toISOString().slice(0, 10);

/**
 * Adună o bătaie: secundele (tăiate la MAX_BEAT), o deschidere a paginii și cât din timp a fost pe telefon sau în aplicație.
 * Când omul închide pagina, browserul trimite bătaia și o mai ține și la el, ca s-o trimită din nou la intrarea următoare dacă
 * n-a ajuns. Ca să nu se numere de două ori, fiecare bătaie are un `id`, iar aceeași bătaie venită a doua oară e lăsată deoparte.
 */
export async function recordUsage(db: Pick<Db, "insert">, userId: string, section: Section,
  beat: { id?: string | null; seconds: number; view: boolean; phone: boolean; app: boolean }, now = new Date()) {
  const seconds = Math.max(0, Math.min(MAX_BEAT, Math.round(Number(beat.seconds) || 0)));
  const views = beat.view ? 1 : 0;
  if (!seconds && !views) return;
  const phone = beat.phone ? seconds : 0, app = beat.app ? seconds : 0;
  const id = beat.id || null;
  await db.insert(usageDay).values({ userId, day: dayOf(now), section, seconds, views, phoneSeconds: phone, appSeconds: app, lastBeat: id, updatedAt: now })
    .onConflictDoUpdate({
      target: [usageDay.userId, usageDay.day, usageDay.section],
      set: {
        seconds: sql`least(${usageDay.seconds} + ${seconds}, ${MAX_DAY})`,
        views: sql`${usageDay.views} + ${views}`,
        phoneSeconds: sql`least(${usageDay.phoneSeconds} + ${phone}, ${MAX_DAY})`,
        appSeconds: sql`least(${usageDay.appSeconds} + ${app}, ${MAX_DAY})`,
        lastBeat: id,
        updatedAt: now,
      },
      ...(id ? { setWhere: sql`${usageDay.lastBeat} is distinct from ${id}` } : {}),
    });
}

/** Șterge zilele mai vechi de 13 luni. */
export async function cleanupUsage(db: Pick<Db, "delete">, now = new Date()) {
  await db.delete(usageDay).where(lt(usageDay.day, dayOf(new Date(now.getTime() - KEEP_DAYS * 86_400_000))));
}

/** Când omul spune „Nu mai vreau”: pleacă tot ce s-a adunat despre el. */
export async function deleteUsage(db: Pick<Db, "delete">, userId: string) {
  await db.delete(usageDay).where(eq(usageDay.userId, userId));
}

export type SectionTime = { section: Section; label: string; seconds: number; views: number; people?: number };
export const sectionLabel = (s: string) => (isSection(s) ? SECTIONS[s] : SECTIONS.altele);
const label = sectionLabel;
const since = (days: number, now: Date) => dayOf(new Date(now.getTime() - (days - 1) * 86_400_000));
const n = (v: unknown) => Number(v ?? 0) || 0;

/** Timpul unui om pe părți ale site-ului și pe zile, în ultimele `days` zile (pentru el, în „Datele mele”, și pentru panou). */
export async function usageOf(db: Pick<Db, "select">, userId: string, days = 30, now = new Date()) {
  const rows = await db.select().from(usageDay).where(and(eq(usageDay.userId, userId), gte(usageDay.day, since(days, now))))
    .orderBy(desc(usageDay.day));
  const bySection = new Map<string, SectionTime>();
  const byDay = new Map<string, number>();
  let total = 0, phone = 0, app = 0, views = 0;
  for (const r of rows) {
    const cur = bySection.get(r.section) ?? { section: (isSection(r.section) ? r.section : "altele") as Section, label: label(r.section), seconds: 0, views: 0 };
    cur.seconds += r.seconds; cur.views += r.views;
    bySection.set(r.section, cur);
    byDay.set(r.day, (byDay.get(r.day) ?? 0) + r.seconds);
    total += r.seconds; phone += r.phoneSeconds; app += r.appSeconds; views += r.views;
  }
  const dayKeys = Array.from({ length: days }, (_, i) => dayOf(new Date(now.getTime() - (days - 1 - i) * 86_400_000)));
  return {
    total, phone, app, views, activeDays: byDay.size,
    // O parte doar deschisă, fără nicio secundă numărată, nu spune nimic în liste (deschiderile rămân în `views`).
    sections: [...bySection.values()].filter((x) => x.seconds > 0).sort((a, b) => b.seconds - a.seconds),
    days: dayKeys.map((d) => ({ day: d, seconds: byDay.get(d) ?? 0 })),
  };
}

/** Cine a răspuns la anunț: ultimul răspuns al fiecăruia (fără contul de probă). */
export async function usageAnswers(db: Db) {
  const r = await db.execute(sql`select granted, count(*) as c from (
      select distinct on (c.user_id) c.user_id, c.granted from ${consent} c join "user" u on u.id = c.user_id
      where c.purpose = 'usage' and lower(u.email) <> ${DEMO_EMAIL} order by c.user_id, c.created_at desc) last
    group by granted`);
  const rows = (r.rows ?? []) as { granted: boolean; c: unknown }[];
  return { yes: n(rows.find((x) => x.granted)?.c), no: n(rows.find((x) => !x.granted)?.c) };
}

/** Pentru panou: timpul tuturor celor care au spus „Bine”, pe părți ale site-ului, și timpul fiecăruia, în ultimele `days` zile. */
export async function usageOverview(db: Db, days = 30, now = new Date()) {
  const from = since(days, now);
  const r = await db.execute(sql`select section, sum(seconds) as seconds, sum(views) as views, count(distinct user_id) as people
    from ${usageDay} where day >= ${from} group by section order by seconds desc`);
  const all = ((r.rows ?? []) as Record<string, unknown>[]).map((x) => ({
    section: (isSection(x.section) ? x.section : "altele") as Section, label: label(String(x.section)), seconds: n(x.seconds), views: n(x.views), people: n(x.people),
  }));
  const sections = all.filter((x) => x.seconds > 0);
  const p = await db.execute(sql`select user_id, sum(seconds) as seconds, count(distinct day) as days, sum(phone_seconds) as phone, sum(app_seconds) as app
    from ${usageDay} where day >= ${from} group by user_id`);
  const perUser = new Map(((p.rows ?? []) as Record<string, unknown>[]).map((x) => [String(x.user_id), { seconds: n(x.seconds), days: n(x.days), phone: n(x.phone), app: n(x.app) }]));
  const total = all.reduce((s, x) => s + x.seconds, 0);
  const personDays = [...perUser.values()].reduce((s, x) => s + x.days, 0);
  return {
    sections, perUser, total, people: perUser.size,
    phone: [...perUser.values()].reduce((s, x) => s + x.phone, 0),
    app: [...perUser.values()].reduce((s, x) => s + x.app, 0),
    perPersonDay: personDays ? Math.round(total / personDays) : 0,
    answers: await usageAnswers(db),
  };
}

/** „3 h 20 min”, „12 min”, „40 sec”. */
export function duration(seconds: number) {
  if (seconds < 60) return `${seconds} sec`;
  const min = Math.round(seconds / 60);
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60), m = min % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}
