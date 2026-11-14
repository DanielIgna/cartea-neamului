/**
 * Învățare și conversii (Admin → Învățare și conversii, Daniel, 14 noiembrie 2026, după ecranele „Learning Engine”,
 * „Lead & Intent” și „Marketing Intelligence” din PropManage), adaptate la Cartea Neamului și la regulile noastre:
 *
 * 1. Jurnalul recomandărilor: ce s-a propus (din Sănătatea afacerii sau de mână), ce s-a făcut și ce s-a schimbat după, măsurat:
 *    conturi noi, arbori începuți și plăți în cele 14 zile dinainte și de după ziua în care ai bifat „Făcut”. Înainte/după arată
 *    o schimbare, nu dovedește cauza; pagina o spune.
 * 2. Aproape de plată: doar conturile aflate în zilele gratuite, din ce fac ele în cont (persoane, invitații, poze, amintiri,
 *    ultima intrare, zilele rămase). Un scor simplu, cu reguli scrise aici: fără AI și fără decizii automate. Ieșirea e cui să-i
 *    scrii, cu un mesaj propus pe care îl aprobi tu; emailul pleacă doar celor care au spus „Da” la sfaturile pe email.
 *    Vizitele anonime din Analiză nu se leagă niciodată de conturi sau de adrese.
 * 3. Perspective de marketing, din Analiză (anonim): canalul care aduce cele mai multe sesiuni ce ajung la cont/arbore/plată,
 *    ziua și ora cu cele mai multe vizite, paginile din care pleacă oamenii. Fiecare spune dacă e „calculat din date” sau doar
 *    „ipoteză” (prea puține date).
 */
import { sql, type SQL } from "drizzle-orm";
import type { Db } from "@/db";
import { appSetting } from "@/db/schema";
import { groupBy, rangeOf, sessionsOf, sourceLabel, weekHeat } from "./analiza";
import { DEMO_EMAIL } from "./demo";
import { accessFor, accessPeople, accountPlans, planSettings } from "./plans";

type Row = Record<string, unknown>;
async function rows<T = Row>(db: Db, q: SQL): Promise<T[]> {
  const r = await db.execute(q);
  return (r.rows ?? []) as T[];
}
const n = (v: unknown) => Number(v ?? 0) || 0;
const DAY = 86_400_000;

/* ---------- 1. Jurnalul recomandărilor ---------- */

export type LedgerStatus = "propusa" | "facuta" | "respinsa";
export type LedgerItem = { id: string; at: string; source: string; text: string; href?: string; status: LedgerStatus; doneAt?: string; note?: string };
const LEDGER_KEY = "jurnal_recomandari";

export async function ledger(db: Pick<Db, "select">): Promise<LedgerItem[]> {
  const [r] = await db.select({ value: appSetting.value }).from(appSetting).where(sql`${appSetting.key} = ${LEDGER_KEY}`);
  return ((r?.value ?? []) as LedgerItem[]).slice().sort((a, b) => b.at.localeCompare(a.at));
}
async function saveLedger(db: Db, items: LedgerItem[], by: string | null, now: Date) {
  const value = items.slice().sort((a, b) => a.at.localeCompare(b.at)).slice(-300);
  await db.insert(appSetting).values({ key: LEDGER_KEY, value, updatedBy: by, updatedAt: now })
    .onConflictDoUpdate({ target: appSetting.key, set: { value, updatedBy: by, updatedAt: now } });
}
export async function addRecommendation(db: Db, o: { text: string; source: string; href?: string }, by: string | null, now = new Date()) {
  const items = await ledger(db);
  // Aceeași recomandare încă deschisă nu se adaugă de două ori.
  if (items.some((i) => i.text === o.text && i.status === "propusa")) return;
  items.push({ id: `${now.getTime().toString(36)}${Math.random().toString(36).slice(2, 6)}`, at: now.toISOString(), source: o.source.slice(0, 40), text: o.text.slice(0, 300), href: o.href?.slice(0, 200), status: "propusa" });
  await saveLedger(db, items, by, now);
}
export async function setRecommendation(db: Db, id: string, status: LedgerStatus, note: string | null, by: string | null, now = new Date()) {
  const items = await ledger(db);
  const it = items.find((i) => i.id === id);
  if (!it) return;
  it.status = status;
  it.doneAt = status === "facuta" ? (it.doneAt ?? now.toISOString()) : undefined;
  if (note != null) it.note = note.slice(0, 300);
  await saveLedger(db, items, by, now);
}

export type Window = { accounts: number; trees: number; payments: number; lei: number };
async function windowOf(db: Db, from: Date, to: Date): Promise<Window> {
  const [x] = await rows(db, sql`select
      (select count(*) from "user" where email <> ${DEMO_EMAIL} and created_at >= ${from.toISOString()} and created_at < ${to.toISOString()}) as accounts,
      (select count(*) from tree where created_at >= ${from.toISOString()} and created_at < ${to.toISOString()}) as trees,
      (select count(*) from payment where created_at >= ${from.toISOString()} and created_at < ${to.toISOString()}) as payments,
      (select coalesce(sum(amount), 0) from payment where currency = 'ron' and created_at >= ${from.toISOString()} and created_at < ${to.toISOString()}) as lei`);
  return { accounts: n(x?.accounts), trees: n(x?.trees), payments: n(x?.payments), lei: n(x?.lei) / 100 };
}

/** Efectul măsurat: 14 zile înainte de „Făcut” față de 14 zile după (sau cât a trecut până azi, scalat la 14). */
export async function outcomes(db: Db, items: LedgerItem[], now = new Date()) {
  const out = new Map<string, { before: Window; after: Window; days: number; complete: boolean }>();
  for (const it of items.filter((i) => i.status === "facuta" && i.doneAt)) {
    const t = new Date(it.doneAt!);
    const days = Math.min(14, Math.max(0, (now.getTime() - t.getTime()) / DAY));
    if (days < 1) continue;
    const [before, after] = await Promise.all([windowOf(db, new Date(t.getTime() - 14 * DAY), t), windowOf(db, t, new Date(t.getTime() + days * DAY))]);
    out.set(it.id, { before, after, days: Math.round(days), complete: days >= 14 });
  }
  return out;
}

/* ---------- 2. Aproape de plată ---------- */

export type Signals = { persons: number; invites: number; photos: number; memories: number; activeDaysAgo: number | null; daysLeft: number };
export type Lead = Signals & { id: string; name: string; email: string; locale: string; score: number; tier: "aproape" | "interesat" | "inceput"; chips: string[]; news: boolean; message: { subject: string; body: string } };

/** Scorul 0–100 din semnalele din cont. Pur, ca să se poată testa; regulile se văd și pe pagină. */
export const SCORE_RULES = [
  { label: "cel puțin 10 persoane în arbore", points: 25 },
  { label: "a invitat cel puțin o rudă", points: 25 },
  { label: "cel puțin 3 poze", points: 15 },
  { label: "cel puțin o amintire", points: 15 },
  { label: "a intrat în ultimele 3 zile", points: 10 },
  { label: "mai are cel mult 2 zile gratuite", points: 10 },
] as const;
export function leadScore(s: Signals) {
  const hits = [s.persons >= 10, s.invites >= 1, s.photos >= 3, s.memories >= 1, s.activeDaysAgo != null && s.activeDaysAgo <= 3, s.daysLeft <= 2];
  const score = SCORE_RULES.reduce((a, r, i) => a + (hits[i] ? r.points : 0), 0);
  const tier: Lead["tier"] = score >= 70 ? "aproape" : score >= 40 ? "interesat" : "inceput";
  return { score, tier, hits };
}
export const TIER_LABEL: Record<Lead["tier"], string> = { aproape: "Aproape de plată", interesat: "Interesat", inceput: "La început" };

/** Mesajul propus, după ce lipsește sau ce merge deja. Doar în română (Daniel îl citește și îl aprobă); se poate schimba. */
export function suggestedMessage(name: string, s: Signals, price: number) {
  const first = name.split(" ")[0] || name;
  const left = s.daysLeft <= 0 ? "Zilele gratuite s-au terminat" : s.daysLeft === 1 ? "Mai ai o zi gratuită" : `Mai ai ${s.daysLeft} zile gratuite`;
  if (s.persons >= 10 && s.invites >= 1)
    return { subject: "Arborele vostru crește frumos", body: `Bună, ${first}! Am văzut că arborele are deja ${s.persons} de persoane și că ți-ai chemat rudele. ${left}. Ca să puteți scrie mai departe toți, anul Basic costă ${price} lei. Nu se iau bani automat și nu se șterge nimic. Dacă ai vreo întrebare, răspunde-mi aici.` };
  if (s.invites === 0)
    return { subject: "Cine din familie știe mai multe?", body: `Bună, ${first}! ${left}. Cel mai repede crește arborele când vin și rudele: trimite-le invitația pe WhatsApp din pagina arborelui, iar ei adaugă ce știu. Dacă te pot ajuta cu ceva, răspunde-mi aici.` };
  if (s.photos < 3)
    return { subject: "O poză veche face arborele viu", body: `Bună, ${first}! ${left}. Pune pe fișa bunicilor o poză veche: arborele prinde viață și rudele recunosc imediat oamenii. Dacă te pot ajuta cu ceva, răspunde-mi aici.` };
  return { subject: "Glasul bunicilor, păstrat", body: `Bună, ${first}! ${left}. Ai deja poze și rude în arbore; următorul pas frumos e să înregistrezi glasul bunicilor, direct din telefon, pe fișa lor. Dacă te pot ajuta cu ceva, răspunde-mi aici.` };
}

export async function trialLeads(db: Db, now = new Date()): Promise<Lead[]> {
  const s = await planSettings(db);
  const [plans, people] = await Promise.all([accountPlans(db), accessPeople(db)]);
  const trial: { id: string; until: Date }[] = [];
  for (const p of people) {
    const ap = plans.get(p.id);
    const a = accessFor({ createdAt: p.createdAt, plan: ap?.plan ?? null, paidUntil: ap?.paidUntil ? new Date(ap.paidUntil) : null, tier: ap?.tier, exempt: p.exempt,
      keepUntil: ap?.keepUntil ? new Date(ap.keepUntil) : null }, s, now);
    if (a.kind === "proba") trial.push({ id: p.id, until: a.until });
  }
  if (!trial.length) return [];
  const ids = sql.join(trial.map((t) => sql`${t.id}`), sql`, `);
  const info = await rows<{ id: string; name: string; email: string; locale: string; persons: number; invites: number; photos: number; memories: number; last: string | null; news: boolean }>(db, sql`
    with last_news as (select distinct on (user_id) user_id, granted from consent where purpose = 'news' order by user_id, created_at desc)
    select u.id, u.name, u.email, u.locale,
      (select count(*) from person p join tree t on t.id = p.tree_id where t.owner_id = u.id) as persons,
      (select count(*) from invitation i where i.created_by = u.id) as invites,
      (select count(*) from document d join tree t on t.id = d.tree_id where t.owner_id = u.id and d.kind = 'photo') as photos,
      (select count(*) from memory m where m.author_id = u.id) as memories,
      (select max(updated_at) from session s where s.user_id = u.id) as last,
      coalesce((select granted from last_news where user_id = u.id), false) as news
    from "user" u where u.id in (${ids}) and u.email <> ${DEMO_EMAIL}`);
  const until = new Map(trial.map((t) => [t.id, t.until]));
  return info.map((u) => {
    const last = u.last ? new Date(u.last) : null;
    const sig: Signals = { persons: n(u.persons), invites: n(u.invites), photos: n(u.photos), memories: n(u.memories),
      activeDaysAgo: last ? Math.floor((now.getTime() - last.getTime()) / DAY) : null,
      daysLeft: Math.max(0, Math.ceil((until.get(u.id)!.getTime() - now.getTime()) / DAY)) };
    const { score, tier, hits } = leadScore(sig);
    const chips = SCORE_RULES.filter((_, i) => hits[i]).map((r) => r.label);
    return { ...sig, id: u.id, name: u.name, email: u.email, locale: u.locale, score, tier, chips, news: !!u.news, message: suggestedMessage(u.name, sig, s.priceLei) };
  }).sort((a, b) => b.score - a.score || a.daysLeft - b.daysLeft);
}

/* ---------- 3. Perspective de marketing (din Analiză, anonim) ---------- */

export type Insight = { title: string; text: string; basis: "calculat din date" | "ipoteză" };
const DOW = ["luni", "marți", "miercuri", "joi", "vineri", "sâmbătă", "duminică"];

export async function marketingInsights(db: Db) {
  const { cur } = rangeOf("30z");
  const sessions = await sessionsOf(db, cur);
  const enough = sessions.length >= 200;
  const basis = (ok: boolean) => (ok ? "calculat din date" : "ipoteză") as Insight["basis"];
  const bySource = groupBy(sessions, (s) => s.source).map((g) => {
    const list = sessions.filter((s) => s.source === g.key);
    const good = list.filter((s) => s.signup || s.tree || s.pay).length;
    return { source: g.key, label: sourceLabel(g.key), sessions: list.length, good, rate: list.length ? good / list.length : 0 };
  }).sort((a, b) => b.good - a.good || b.sessions - a.sessions);
  const heat = weekHeat(sessions);
  let best = { d: 0, h: 0, v: -1 };
  heat.forEach((row, d) => row.forEach((v, h) => { if (v > best.v) best = { d, h, v }; }));
  const dayTotals = heat.map((row) => row.reduce((a, b) => a + b, 0));
  const bestDay = dayTotals.indexOf(Math.max(...dayTotals));
  const exits = groupBy(sessions.filter((s) => s.views >= 1 && !s.signup && !s.tree && !s.pay), (s) => s.exit).slice(0, 8);
  const bounce = sessions.length ? sessions.filter((s) => s.views === 1).length / sessions.length : 0;
  const insights: Insight[] = [];
  if (bySource[0]) insights.push({ title: `Canalul care aduce cei mai mulți oameni care fac un pas: ${bySource[0].label}`,
    text: `${bySource[0].good} din ${bySource[0].sessions} sesiuni au ajuns la cont, arbore sau plată (${Math.round(bySource[0].rate * 100)}%).`, basis: basis(bySource[0].sessions >= 50) });
  if (best.v > 0) insights.push({ title: `Cele mai multe vizite: ${DOW[bestDay]}, iar ora de vârf ${String(best.h).padStart(2, "0")}:00`,
    text: `Postează cu o oră-două înainte, ca oamenii să vadă postarea când intră. Ora de vârf a săptămânii: ${DOW[best.d]} la ${String(best.h).padStart(2, "0")}:00 (${best.v} sesiuni).`, basis: basis(enough) });
  if (exits[0]) insights.push({ title: `Pagina din care pleacă cei mai mulți fără niciun pas: ${exits[0].key}`,
    text: `${exits[0].count} sesiuni s-au oprit acolo. Merită un îndemn mai clar spre „Începe arborele” pe pagina asta.`, basis: basis(exits[0].count >= 30) });
  insights.push({ title: `${Math.round(bounce * 100)}% din vizite văd o singură pagină`, text: "Legăturile spre ghiduri și nume înrudite din fiecare pagină țin oamenii mai mult în site.", basis: basis(enough) });
  return { sessions: sessions.length, enough, bySource: bySource.slice(0, 8), heat, exits, insights };
}
