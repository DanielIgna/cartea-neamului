/**
 * Sănătatea afacerii (Admin → Sănătatea afacerii, Daniel, 14 noiembrie 2026, după ecranele „Business Health” / „Enterprise
 * Health” din PropManage). Câte un scor 0–100 pe departament, fiecare dintr-o formulă scrisă aici, pe datele din baza de date:
 * fără estimări inventate și fără AI. Lângă fiecare scor: formula, cauza, ce înseamnă și pașii care îl urcă, cu câte puncte
 * aduce fiecare după aceeași formulă.
 *
 * Ținta de bani e cea cerută de Daniel: 1000 de abonamente noi pe lună la prețul Basic (Admin → Manager control). Basic e pe AN,
 * așa că ținta lunară de încasări e 1000 × prețul Basic (49.000 lei la 49 lei), iar ținta de clienți plătitori activi crește
 * cu 1000 pe lună. Restul țintelor (câte conturi, câte vizite) se socotesc înapoi din ea, cu conversia reală când există
 * destule date și cu presupunerea scrisă pe pagină când nu.
 *
 * Datele vin din tabelele site-ului, din Analiză (page_view), din Autonomie (scorul, automatizările) și din Centrul de
 * cunoștințe (Harta funcțiilor). Istoricul zilnic stă în app_setting `sanatate_istoric` (cele mai noi 90 de zile).
 */
import { sql, type SQL } from "drizzle-orm";
import type { Db } from "@/db";
import { appSetting } from "@/db/schema";
import { autonomyScore, automationSwitches } from "./autonomie";
import { DEMO_EMAIL } from "./demo";
import { planSettings } from "./plans";
import { activeServiceAccount, seoSettings } from "./seo";
import { SEARCH_SOURCES } from "./vizite";

type Row = Record<string, unknown>;
async function rows<T = Row>(db: Db, q: SQL): Promise<T[]> {
  const r = await db.execute(q);
  return (r.rows ?? []) as T[];
}
const n = (v: unknown) => Number(v ?? 0) || 0;
const clamp = (v: number) => Math.max(0, Math.min(100, Math.round(v)));

/** Ținta lui Daniel: abonamente noi pe lună. */
export const TARGET_PAID_PER_MONTH = 1000;
/** Presupunerile folosite până când avem destule date proprii (spuse pe pagină). */
export const ASSUMED = { trialToPaid: 0.1, visitToAccount: 0.03, inviteShare: 0.5, newsShare: 0.4, active: 0.4 };
/** De la câte conturi încolo folosim conversia noastră reală în loc de presupunere. */
const MIN_SAMPLE = 30;

export type Action = { text: string; href?: string; points: number };
export type Domain = {
  key: string; label: string; score: number; status: "sanatos" | "atentie" | "critic";
  formula: string; value: string; cause: string; impact: string; actions: Action[]; confidence: "mare" | "mică";
};
export const statusOf = (s: number): Domain["status"] => (s >= 80 ? "sanatos" : s >= 50 ? "atentie" : "critic");
export const STATUS_LABEL: Record<Domain["status"], string> = { sanatos: "Sănătos", atentie: "Atenție", critic: "Critic" };

/** Câte conturi noi și câte vizite pe lună trebuie pentru ținta de plătitori, cu o conversie dată. Pură, ca să se poată testa. */
export function funnelTargets(paidPerMonth: number, trialToPaid: number, visitToAccount: number) {
  const accounts = Math.ceil(paidPerMonth / Math.max(trialToPaid, 0.001));
  return { accounts, visits: Math.ceil(accounts / Math.max(visitToAccount, 0.0001)) };
}

export async function businessHealth(db: Db, now = new Date()) {
  // Totul deodată (înainte: 5 rânduri de întrebări, unul după altul, iar rezumatul cunoștințelor se calcula de două ori).
  const [s, [b], [visits], auto, sw, seo, kc] = await Promise.all([
  planSettings(db),
  rows(db, sql`select
      (select count(*) from account_plan p join "user" u on u.id = p.user_id where p.paid_until > now() and p.tier is not null and u.email <> ${DEMO_EMAIL}) as paid_active,
      (select count(*) from payment where created_at > now() - interval '30 days') as pay30,
      (select coalesce(sum(amount), 0) from payment where currency = 'ron' and created_at > now() - interval '30 days') as lei30,
      (select coalesce(sum(amount), 0) from payment where currency = 'eur' and created_at > now() - interval '30 days') as eur30,
      (select count(distinct user_id) from payment where created_at > now() - interval '30 days') as payers30,
      (select count(*) from "user" where email <> ${DEMO_EMAIL} and created_at > now() - interval '30 days') as acc30,
      (select count(*) from "user" where email <> ${DEMO_EMAIL} and created_at <= now() - interval '30 days' and created_at > now() - interval '60 days') as acc_prev,
      (select count(*) from "user" where email <> ${DEMO_EMAIL}) as acc_all,
      (select count(*) from "user" u where email <> ${DEMO_EMAIL} and created_at < now() - interval '8 days' and created_at > now() - interval '98 days') as cohort,
      (select count(*) from "user" u where email <> ${DEMO_EMAIL} and created_at < now() - interval '8 days' and created_at > now() - interval '98 days'
         and exists (select 1 from payment p where p.user_id = u.id)) as cohort_paid,
      (select count(*) from invitation where accepted_at > now() - interval '30 days') as inv_acc30,
      (select count(*) from invitation where expires_at > now() - interval '16 days') as inv30,
      (select count(*) from (select distinct on (user_id) granted from consent where purpose = 'news' order by user_id, created_at desc) x where granted) as news_yes,
      (select count(*) from "user" u where email <> ${DEMO_EMAIL} and created_at < now() - interval '14 days') as old_users,
      (select count(distinct s.user_id) from session s join "user" u on u.id = s.user_id where u.email <> ${DEMO_EMAIL} and u.created_at < now() - interval '14 days' and s.updated_at > now() - interval '30 days') as old_active,
      (select count(*) from problem_report where status = 'nou') as prob_new,
      (select count(*) from problem_report where status <> 'rezolvat' and reply is null and created_at < now() - interval '2 days') as prob_late,
      (select count(*) from problem_report where created_at > now() - interval '30 days') as prob30`).catch(() => [{} as Row]),
  rows(db, sql`select count(distinct visitor || day::text) as all_v,
      count(distinct visitor || day::text) filter (where source in (${sql.join([...SEARCH_SOURCES].map((v) => sql`${v}`), sql`, `)})) as organic,
      count(distinct visitor || day::text) filter (where campaign = 'invitatie') as invite,
      count(distinct visitor || day::text) filter (where campaign in ('card-nume', 'card-localitate') or medium = 'distribuire') as shares
    from page_view where day > current_date - 30`).catch(() => [{} as Row]),
  autonomyScore(db, now).catch(() => null), automationSwitches(db).catch(() => null), seoSettings(db).catch(() => null),
  import("./cunostinte/verificare").then((m) => m.knowledgeSummaryOnce(db)).catch(() => null),
  ]);
  const price = s.priceLei || 49;
  const x = b ?? {};
  const v = visits ?? {};

  // Conversia reală (conturi trecute de cele 7 zile, din ultimele ~3 luni) când are destule conturi; altfel presupunerea.
  const cohort = n(x.cohort), cohortPaid = n(x.cohort_paid);
  const realConv = cohort >= MIN_SAMPLE;
  const conv = realConv ? cohortPaid / cohort : ASSUMED.trialToPaid;
  const accAll30 = n(x.acc30);
  const allVisits = n(v.all_v);
  const realSignup = allVisits >= 1000;
  const signup = realSignup ? Math.max(accAll30 / allVisits, 0.001) : ASSUMED.visitToAccount;
  const need = funnelTargets(TARGET_PAID_PER_MONTH, conv || ASSUMED.trialToPaid, signup);
  const revTarget = TARGET_PAID_PER_MONTH * price;
  const lei30 = n(x.lei30) / 100, eur30 = n(x.eur30) / 100;
  const payers30 = n(x.payers30);
  const plansOn = s.on;
  const stripe = !!process.env.STRIPE_SECRET_KEY?.trim();

  const D: Domain[] = [];
  // 1. Venituri: încasările ultimelor 30 de zile față de ținta lunară (în lei; euro doar se arată).
  {
    const score = clamp((100 * lei30) / revTarget);
    const actions: Action[] = [];
    if (!plansOn) actions.push({ text: "Pornește plățile din Manager control: fără ele nu intră niciun leu", href: "/admin/control", points: 0 });
    if (!stripe) actions.push({ text: "Pune cheile Stripe în Vercel (STRIPE_SECRET_KEY și STRIPE_WEBHOOK_SECRET)", href: "/admin/control", points: 0 });
    actions.push({ text: `Fiecare 10 plătitori Basic noi pe lună aduc ${(10 * price).toLocaleString("ro-RO")} lei`, href: "/admin/crestere", points: Math.round((1000 * 10 * price) / revTarget) / 10 });
    actions.push({ text: "Campania „Un an dăruit părinților” până pe 20 decembrie (calendarul de conținut)", href: "/admin/calendar", points: 0 });
    D.push({ key: "venituri", label: "Venituri", score, status: statusOf(score), confidence: "mare",
      formula: `încasat în 30 de zile ÷ (${TARGET_PAID_PER_MONTH} × ${price} lei) × 100`,
      value: `${lei30.toLocaleString("ro-RO")} lei${eur30 ? ` + ${eur30.toLocaleString("ro-RO")} €` : ""} din ${revTarget.toLocaleString("ro-RO")} lei pe lună · ${payers30} plătitori în 30 de zile · ${n(x.paid_active)} cu anul activ`,
      cause: !plansOn ? "Plățile sunt oprite în Manager control." : payers30 === 0 ? "Nimeni n-a plătit în ultimele 30 de zile." : `${payers30} din ${TARGET_PAID_PER_MONTH} plătitori pe lună.`,
      impact: "Încasările țin site-ul în viață: găzduirea, Vercel Pro, contabilul și timpul tău.", actions });
  }
  // 2. Marketing / creștere: conturile noi din 30 de zile față de câte trebuie pentru ținta de plătitori.
  {
    const score = clamp((100 * accAll30) / need.accounts);
    const prev = n(x.acc_prev);
    const trend = prev ? Math.round((100 * (accAll30 - prev)) / prev) : null;
    D.push({ key: "marketing", label: "Marketing și creștere", score, status: statusOf(score), confidence: realConv ? "mare" : "mică",
      formula: `conturi noi în 30 de zile ÷ ${need.accounts.toLocaleString("ro-RO")} × 100 (${TARGET_PAID_PER_MONTH} plătitori ÷ conversia ${Math.round(conv * 1000) / 10}%)`,
      value: `${accAll30} conturi noi în 30 de zile${trend != null ? ` (${trend > 0 ? "+" : ""}${trend}% față de cele 30 dinainte)` : ""}`,
      cause: `Pentru ${TARGET_PAID_PER_MONTH} de plătitori pe lună trebuie ~${need.accounts.toLocaleString("ro-RO")} de conturi noi pe lună.${realConv ? "" : " Conversia e presupusă (10%) până avem 30 de conturi trecute de zilele gratuite."}`,
      impact: "Fără conturi noi nu are cine plăti; fiecare cont nou e un arbore care cheamă rude.",
      actions: [
        { text: "Postările din calendarul de conținut, în grupurile de genealogie și diaspora", href: "/admin/calendar", points: 0 },
        { text: "Fiecare 100 de conturi noi pe lună", points: Math.round((1000 * 100) / need.accounts) / 10 },
      ] });
  }
  // 3. Conversii: din conturile trecute de zilele gratuite (ultimele ~3 luni), câte au plătit; ținta 10%.
  {
    const rate = cohort ? cohortPaid / cohort : 0;
    const score = clamp((100 * rate) / ASSUMED.trialToPaid);
    D.push({ key: "conversii", label: "Conversii (probă → plată)", score, status: statusOf(score), confidence: realConv ? "mare" : "mică",
      formula: "conturi care au plătit ÷ conturi trecute de cele 7 zile (8–98 de zile vechime) ÷ 10% × 100",
      value: `${cohortPaid} din ${cohort} conturi (${Math.round(rate * 1000) / 10}%)`,
      cause: cohort < MIN_SAMPLE ? `Doar ${cohort} conturi au trecut de zilele gratuite: prea puține ca cifra să spună mult.` : rate < ASSUMED.trialToPaid ? "Mai puțin de 1 din 10 plătește după zilele gratuite." : "Conversia e la țintă.",
      impact: "Fiecare punct de conversie în plus înseamnă mai puțini oameni de adus pentru aceiași bani.",
      actions: [
        ...(sw && !sw["aminteste-proba"] ? [{ text: "Pornește emailul „Zilele gratuite se termină” (Autonomie)", href: "/admin/autonomie#automatizari", points: 0 }] : []),
        ...(sw && !sw["bun-venit"] ? [{ text: "Pornește sfaturile de bun venit pe email (Autonomie)", href: "/admin/autonomie#automatizari", points: 0 }] : []),
        { text: "Fiecare plătitor în plus la 100 de conturi trecute de probă", points: 10 },
      ] });
  }
  // 4. SEO: vizitele din motoarele de căutare față de cele necesare (60 de puncte), Search Console legat (20), sitemap trimis (20).
  {
    const organic = n(v.organic);
    const linked = !!(seo && activeServiceAccount(seo));
    const sitemap = !!(sw?.sitemap && linked);
    const traffic = Math.min(60, (60 * organic) / need.visits);
    const score = clamp(traffic + (linked ? 20 : 0) + (sitemap ? 20 : 0));
    D.push({ key: "seo", label: "SEO (Google, fără reclame)", score, status: statusOf(score), confidence: "mare",
      formula: `60 × vizite din căutare ÷ ${need.visits.toLocaleString("ro-RO")} + 20 (Search Console legat) + 20 (sitemap trimis singur)`,
      value: `${organic.toLocaleString("ro-RO")} vizite din căutare în 30 de zile, din ${allVisits.toLocaleString("ro-RO")} în total`,
      cause: !linked ? "Search Console nu e legat: nu știm ce caută oamenii și Google află mai greu de paginile noi." : "Paginile publice (~525) abia încep să urce în Google; durează 3–6 luni.",
      impact: "Google aduce oameni în fiecare zi, fără bani, ani la rând.",
      actions: [
        ...(!linked ? [{ text: "Leagă Search Console (pașii sunt în pagină)", href: "/admin/seo", points: 20 }] : []),
        ...(!sitemap ? [{ text: "Lasă pornit „Sitemap la Google” în Autonomie (după Search Console)", href: "/admin/autonomie#automatizari", points: 20 }] : []),
        { text: "Linkuri de la bloguri, primării și asociații spre paginile lor de localitate", href: "/admin/calendar", points: 0 },
      ] });
  }
  // 5. Invitații (viral): din conturile noi, câte au venit printr-o invitație; ținta: jumătate.
  {
    const acc = n(x.inv_acc30);
    const share = accAll30 ? Math.min(1, acc / accAll30) : 0;
    const score = clamp((100 * share) / ASSUMED.inviteShare);
    D.push({ key: "invitatii", label: "Invitații și rude aduse", score, status: statusOf(score), confidence: accAll30 >= 10 ? "mare" : "mică",
      formula: "invitații primite în 30 de zile ÷ conturi noi în 30 de zile ÷ 50% × 100",
      value: `${acc} invitații primite, ${n(x.inv30)} făcute · ${n(v.invite)} vizite din linkuri de invitație`,
      cause: share < ASSUMED.inviteShare ? "Mai puțin de jumătate din oamenii noi vin chemați de o rudă." : "Rudele aduc jumătate sau mai mult din oamenii noi.",
      impact: "O rudă invitată vede deja numele ei în arbore: e cel mai ieftin și mai sigur client.",
      actions: [{ text: "Roagă-i pe cei din beta să-și cheme rudele cu butonul nou de WhatsApp", href: "/admin/crestere", points: 0 },
        { text: "Fiecare 10 invitații primite la 100 de conturi noi", points: 20 }] });
  }
  // 6. Leaduri: câți au spus „Da” la sfaturile pe email, din toate conturile; ținta 40%.
  {
    const yes = n(x.news_yes), all = n(x.acc_all);
    const share = all ? yes / all : 0;
    const on = !!sw?.["bun-venit"];
    const score = clamp((80 * share) / ASSUMED.newsShare + (on ? 20 : 0));
    D.push({ key: "leaduri", label: "Leaduri (emailuri cu acord)", score, status: statusOf(score), confidence: "mare",
      formula: "80 × (acorduri „Da” ÷ toate conturile) ÷ 40% + 20 dacă sfaturile de bun venit sunt pornite",
      value: `${yes} din ${all} conturi au spus „Da” · sfaturile pe email: ${on ? "pornite" : "oprite"}`,
      cause: !on ? "Sfaturile de bun venit sunt oprite: cei care au spus „Da” nu primesc încă nimic." : "Cei cu acord primesc sfaturile.",
      impact: "Un email bun la momentul potrivit (ziua 2: cheamă o rudă) urcă și invitațiile, și plățile.",
      actions: on ? [] : [{ text: "Citește textele și pornește „Email: sfaturi de bun venit”", href: "/admin/autonomie#automatizari", points: 20 }] });
  }
  // 7. Retenție: din conturile mai vechi de 14 zile, câte au intrat în ultimele 30 de zile; ținta 40%.
  {
    const old = n(x.old_users), act = n(x.old_active);
    const share = old ? act / old : 0;
    const score = old ? clamp((100 * share) / ASSUMED.active) : 0;
    D.push({ key: "retentie", label: "Retenție", score, status: statusOf(score), confidence: old >= MIN_SAMPLE ? "mare" : "mică",
      formula: "conturi (peste 14 zile) intrate în ultimele 30 de zile ÷ toate conturile peste 14 zile ÷ 40% × 100",
      value: `${act} din ${old} conturi mai vechi de 14 zile au intrat în ultimele 30 de zile`,
      cause: share < ASSUMED.active ? "Mulți oameni nu se mai întorc după primele zile." : "Oamenii se întorc.",
      impact: "Cine se întoarce plătește anul următor și cheamă rude.",
      actions: [{ text: "Vezi retenția pe săptămâni în Analiză", href: "/admin/analiza?t=retentie", points: 0 }] });
  }
  // 8. Suport: problemele noi și cele fără răspuns de peste 2 zile scad scorul.
  {
    const late = n(x.prob_late), fresh = n(x.prob_new);
    const score = clamp(100 - 15 * late - 5 * fresh);
    D.push({ key: "suport", label: "Suport (probleme raportate)", score, status: statusOf(score), confidence: "mare",
      formula: "100 − 15 × probleme fără răspuns de peste 2 zile − 5 × probleme noi necitite",
      value: `${fresh} noi, ${late} fără răspuns de peste 2 zile, ${n(x.prob30)} în 30 de zile`,
      cause: late ? `${late} oameni așteaptă un răspuns de peste 2 zile.` : fresh ? `${fresh} probleme noi de citit.` : "Nimeni nu așteaptă.",
      impact: "Un om ajutat repede rămâne și le spune și altora.",
      actions: late || fresh ? [{ text: "Răspunde la problemele din Probleme raportate", href: "/admin/probleme", points: Math.min(100, 15 * late + 5 * fresh) }] : [] });
  }
  // 9–11. Operațiuni, Tehnic și Încredere: din scorul de Autonomie; Cunoștințe din Harta funcțiilor.
  if (auto) {
    const part = (k: string) => auto.parts.find((p) => p.key === k)?.score ?? 0;
    const op = part("operational"), tech = part("tehnic"), sec = part("securitate"), dev = part("dezvoltare");
    D.push({ key: "operatiuni", label: "Operațiuni și automatizare", score: op, status: statusOf(op), confidence: "mare",
      formula: "partea „Operațional” din Autonomie (ceasul zilnic + automatizările pornite și reușite)", value: `${op} din 100 · scorul total de autonomie ${auto.score}`,
      cause: op < 80 ? "Unele automatizări sunt oprite sau ceasul zilnic nu rulează." : "Rutinele merg singure.", impact: "Ce merge singur nu-ți mai cere timp.",
      actions: [{ text: "Vezi recomandările din Autonomie", href: "/admin/autonomie", points: 100 - op }] });
    D.push({ key: "tehnic", label: "Tehnic", score: Math.round((tech + dev) / 2), status: statusOf(Math.round((tech + dev) / 2)), confidence: "mare",
      formula: "media părților „Tehnic” și „Dezvoltare” din Autonomie", value: `tehnic ${tech}, dezvoltare ${dev}`,
      cause: tech < 80 ? "Lipsesc chei sau sunt erori noi pe server." : dev < 80 ? "Erori care se repetă sau funcții în roșu." : "Totul merge.", impact: "Un site care merge e prima condiție ca oamenii să plătească.",
      actions: [{ text: "Vezi Infra & Dev", href: "/admin/infra", points: 0 }] });
    D.push({ key: "incredere", label: "Încrederea clienților", score: sec, status: statusOf(sec), confidence: "mare",
      formula: "partea „Securitate” din Autonomie (alerte, verificarea în 2 pași a adminilor, plăți confirmate prin webhook)", value: `${sec} din 100`,
      cause: sec < 80 ? "Sunt alerte sau pași de siguranță lipsă." : "Conturile și plățile sunt păzite.", impact: "Familiile pun aici poze și date despre cei dragi; încrederea e tot.",
      actions: [{ text: "Vezi Securitate", href: "/admin/securitate", points: 0 }] });
  }
  if (kc) {
    const score = kc.live ? clamp((100 * (kc.green + kc.yellow / 2)) / kc.live) : 0;
    D.push({ key: "cunostinte", label: "Cunoștințe și produs", score, status: statusOf(score), confidence: "mare",
      formula: "(funcții verzi + jumătate din cele galbene) ÷ funcțiile live × 100, din Harta funcțiilor", value: `${kc.green} verzi, ${kc.yellow} galbene, ${kc.red} roșii din ${kc.live}`,
      cause: kc.red ? `${kc.red} funcții roșii.` : kc.yellow ? `${kc.yellow} funcții de urmărit.` : "Toate funcțiile sunt verzi.", impact: "Fiecare funcție care merge e un motiv în plus să plătească.",
      actions: [{ text: "Deschide Harta funcțiilor", href: "/admin/cunostinte/functii", points: kc.live ? Math.round((100 * (kc.red + kc.yellow / 2)) / kc.live) : 0 }] });
  }

  const overall = D.length ? Math.round(D.reduce((a, d) => a + d.score, 0) / D.length) : 0;
  const channels = [
    { label: "Google și alte căutări", value: n(v.organic) },
    { label: "Invitații de la rude", value: n(v.invite) },
    { label: "Carduri și pagini distribuite", value: n(v.shares) },
    { label: "Restul (direct, Facebook, WhatsApp, email…)", value: Math.max(0, allVisits - n(v.organic) - n(v.invite) - n(v.shares)) },
  ];
  return {
    overall, status: statusOf(overall), domains: D, channels, allVisits,
    goal: { paidPerMonth: TARGET_PAID_PER_MONTH, price, revenueMonth: revTarget, revenueYear: revTarget * 12, accountsNeeded: need.accounts, visitsNeeded: need.visits,
      conv, realConv, signup, realSignup, payers30, lei30 },
  };
}

/* ---------- Istoricul (pentru tendință) ---------- */

const HISTORY_KEY = "sanatate_istoric";
export type HealthDay = { overall: number; d: Record<string, number> };
export async function healthHistory(db: Pick<Db, "select">): Promise<Record<string, HealthDay>> {
  const [r] = await db.select({ value: appSetting.value }).from(appSetting).where(sql`${appSetting.key} = ${HISTORY_KEY}`);
  return (r?.value ?? {}) as Record<string, HealthDay>;
}
export async function saveHealthDay(db: Db, h: Awaited<ReturnType<typeof businessHealth>>, now = new Date()) {
  const day = now.toISOString().slice(0, 10);
  const cur = await healthHistory(db);
  cur[day] = { overall: h.overall, d: Object.fromEntries(h.domains.map((x) => [x.key, x.score])) };
  const value = Object.fromEntries(Object.entries(cur).sort(([a], [b]) => a.localeCompare(b)).slice(-90));
  await db.insert(appSetting).values({ key: HISTORY_KEY, value, updatedAt: now })
    .onConflictDoUpdate({ target: appSetting.key, set: { value, updatedAt: now } });
}
export async function recomputeHealth(db: Db, now = new Date()) {
  const h = await businessHealth(db, now);
  await saveHealthDay(db, h, now);
  return h;
}
