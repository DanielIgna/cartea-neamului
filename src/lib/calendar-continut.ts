/**
 * Calendarul de conținut (Admin → Calendar de conținut, Daniel, 14 noiembrie 2026): ce postezi, unde și când, cu textul gata
 * scris și legătura cu semnele din Analiză (utm_campaign=calendar-…). Se face singur din ce avem deja: sărbătorile și zilele
 * bune pentru familie (ton neutru, fără limbaj religios), plus în fiecare săptămână „Numele săptămânii”, „Județul săptămânii”
 * și „Ghidul săptămânii”, luate pe rând din /nume, /localitati și /ghid. Ce bifezi (făcut / sărit) se ține în app_setting.
 */
import { sql } from "drizzle-orm";
import type { Db } from "@/db";
import { appSetting } from "@/db/schema";
import { loadCollection } from "./continut/colectii";
import { loadCounties } from "./continut/localitati";
import { loadNames } from "./continut/nume";
import { SITE_URL } from "./site-url";

export type Channel = "Grupuri Facebook" | "Pagina de Facebook" | "WhatsApp" | "Instagram" | "Presă locală";
export type CalItem = { id: string; date: string; channel: Channel; title: string; text: string; path: string; kind: "sezon" | "nume" | "judet" | "ghid" };

const DAY = 86_400_000;
const iso = (d: Date) => d.toISOString().slice(0, 10);
const link = (path: string, id: string, source = "facebook") => `${SITE_URL}${path}?utm_source=${source}&utm_medium=social&utm_campaign=calendar-${id}`;

/** Zilele bune din an (lună, zi). Paștele se schimbă de la an la an, așa că nu e aici; îl adaugi tu ca idee. */
const SEASON: { m: number; d: number; id: string; channel: Channel; title: string; text: string; path: string }[] = [
  { m: 11, d: 25, id: "cadou-parinti", channel: "Pagina de Facebook", title: "Un an dăruit părinților", path: "/cadou-de-sarbatori",
    text: "Cel mai simplu dar de sărbători: un an în care părinții sau bunicii adună familia, pozele și amintirile într-un singur loc. Primești un card de pus sub brad." },
  { m: 12, d: 1, id: "ziua-nationala", channel: "Grupuri Facebook", title: "Harta numelor de familie din România", path: "/localitati",
    text: "De 1 Decembrie: de unde vin numele familiilor noastre? Caută județul bunicilor și vezi ce registre vechi există acolo." },
  { m: 12, d: 15, id: "cadou-ultima", channel: "WhatsApp", title: "Ultimele zile pentru darul de sărbători", path: "/cadou-de-sarbatori",
    text: "Mai e puțin până la sărbători. Un an în Cartea Neamului se dăruiește în două minute, cu un card de tipărit." },
  { m: 12, d: 20, id: "intrebari-masa", channel: "Pagina de Facebook", title: "Întrebări pentru bunici, la masa de sărbători", path: "/ghid/intrebari-pentru-bunici",
    text: "Când sunteți toți la masă, întrebați-i pe bunici cum era casa copilăriei lor și cum s-au cunoscut. Înregistrați-le glasul: e cea mai frumoasă amintire." },
  { m: 12, d: 28, id: "dupa-sarbatori", channel: "Grupuri Facebook", title: "Ce ai aflat de sărbători?", path: "/ghid/cum-incepi-arborele-genealogic",
    text: "Ce povești ați auzit de la rude zilele astea? Scrieți-le acum, cât sunt proaspete. Iată cum începeți arborele familiei." },
  { m: 1, d: 15, id: "pozele-vechi", channel: "Pagina de Facebook", title: "Pozele vechi din sertar", path: "/ghid/cum-pastrezi-pozele-vechi",
    text: "Pozele vechi se șterg și se pierd. Cum le scanezi și le păstrezi, ca să le vadă și nepoții." },
  { m: 2, d: 21, id: "limba-materna", channel: "Grupuri Facebook", title: "Ziua limbii materne: cuvintele bunicilor", path: "/glosar",
    text: "Ce cuvinte vechi foloseau bunicii voștri? Glosarul nostru explică termenii din actele și registrele vechi." },
  { m: 3, d: 8, id: "ziua-mamei", channel: "Pagina de Facebook", title: "Numele de fată al bunicii", path: "/ghid/cum-gasesti-numele-de-fata-al-bunicii",
    text: "De Ziua Mamei: știți numele de fată al bunicii și al străbunicii? Iată unde îl găsiți." },
  { m: 5, d: 15, id: "ziua-familiei", channel: "Grupuri Facebook", title: "Ziua Internațională a Familiei", path: "/ghid/cum-implici-familia",
    text: "Un arbore se face mai ușor împreună. Cum îi implicați pe frați, veri și mătuși." },
  { m: 6, d: 1, id: "ziua-copilului", channel: "Pagina de Facebook", title: "Proiect pentru copii: arborele familiei", path: "/ghid/intrebari-pentru-bunici",
    text: "De 1 Iunie: un proiect frumos pentru copii, interviul cu bunicii. Iată întrebările." },
  { m: 7, d: 15, id: "vara-la-bunici", channel: "WhatsApp", title: "Vara la bunici", path: "/ghid/cum-inregistrezi-glasul-bunicilor",
    text: "Mergeți la bunici în vacanță? Luați telefonul și înregistrați-le poveștile." },
  { m: 8, d: 1, id: "diaspora-acasa", channel: "Grupuri Facebook", title: "Diaspora acasă: actele din satul bunicilor", path: "/ghid/cum-ceri-un-act-de-stare-civila",
    text: "Veniți acasă vara? E momentul bun să cereți actele bunicilor de la primărie. Iată cum." },
];

/** Calendarul pentru următoarele `weeks` săptămâni, de la luni. Pur (fără bază de date), ca să se poată testa. */
export function buildCalendar(from = new Date(), weeks = 8): CalItem[] {
  const start = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()));
  start.setUTCDate(start.getUTCDate() - ((start.getUTCDay() + 6) % 7)); // luni
  const end = new Date(start.getTime() + weeks * 7 * DAY);
  const out: CalItem[] = [];
  for (const y of [start.getUTCFullYear(), start.getUTCFullYear() + 1]) {
    for (const s of SEASON) {
      const d = new Date(Date.UTC(y, s.m - 1, s.d));
      if (d >= start && d < end) out.push({ id: `${y}-${s.id}`, date: iso(d), channel: s.channel, title: s.title, text: s.text, path: s.path, kind: "sezon" });
    }
  }
  const names = loadNames(), counties = loadCounties(), guides = loadCollection("ghid");
  for (let w = 0; w < weeks; w++) {
    const mon = new Date(start.getTime() + w * 7 * DAY);
    const k = Math.floor(mon.getTime() / (7 * DAY)); // numărul săptămânii de la 1970: alt nume în fiecare săptămână, mereu același pentru aceeași săptămână
    const n = names[(k * 37) % names.length], c = counties[(k * 7) % counties.length], g = guides[(k * 11) % guides.length];
    if (n) out.push({ id: `nume-${n.slug}-${iso(mon)}`, date: iso(new Date(mon.getTime() + 1 * DAY)), channel: "Grupuri Facebook", kind: "nume",
      title: `Numele săptămânii: ${n.name}`, path: `/nume/${n.slug}`,
      text: `Numele săptămânii: ${n.name}. ${n.meaning.replace(/\*/g, "").split(". ")[0]}. Aveți pe cineva cu numele ăsta în familie?` });
    if (c) out.push({ id: `judet-${c.slug}-${iso(mon)}`, date: iso(new Date(mon.getTime() + 3 * DAY)), channel: "Grupuri Facebook", kind: "judet",
      title: `Județul săptămânii: ${c.name}`, path: `/localitati/${c.slug}`,
      text: `Aveți rădăcini în ${c.slug === "bucuresti" ? "București" : `județul ${c.name}`}? Unde sunt arhivele, ce registre vechi există și ce nume de familie sunt des întâlnite acolo.` });
    if (g) out.push({ id: `ghid-${g.slug}-${iso(mon)}`, date: iso(new Date(mon.getTime() + 5 * DAY)), channel: "Pagina de Facebook", kind: "ghid",
      title: `Ghidul săptămânii: ${g.title}`, path: g.path, text: g.description });
  }
  return out.sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
}

export const linkFor = (it: CalItem) => link(it.path, it.id.slice(0, 50), it.channel === "WhatsApp" ? "whatsapp" : it.channel === "Instagram" ? "instagram" : "facebook");

export type CalStatus = "facut" | "sarit";
const KEY = "calendar_continut";
export async function calendarMarks(db: Pick<Db, "select">): Promise<Record<string, CalStatus>> {
  const [r] = await db.select({ value: appSetting.value }).from(appSetting).where(sql`${appSetting.key} = ${KEY}`);
  return (r?.value ?? {}) as Record<string, CalStatus>;
}
export async function markCalendar(db: Db, id: string, status: CalStatus | null, by: string, now = new Date()) {
  const cur = await calendarMarks(db);
  if (status) cur[id] = status; else delete cur[id];
  // Păstrăm doar ultimele ~300 de bife, ca setarea să nu crească la nesfârșit.
  const value = Object.fromEntries(Object.entries(cur).slice(-300));
  await db.insert(appSetting).values({ key: KEY, value, updatedBy: by, updatedAt: now })
    .onConflictDoUpdate({ target: appSetting.key, set: { value, updatedBy: by, updatedAt: now } });
}

/** Vizitele aduse de postările din calendar în ultimele 60 de zile, pe campanie (din Analiză). */
export async function calendarVisits(db: Db) {
  const r = await db.execute(sql`select campaign, count(distinct visitor) as v from page_view where day > current_date - 60 and campaign like 'calendar-%' group by campaign`);
  return new Map(((r.rows ?? []) as { campaign: string; v: unknown }[]).map((x) => [x.campaign.replace(/^calendar-/, ""), Number(x.v) || 0]));
}
