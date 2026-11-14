/**
 * Creșterea fără reclame plătite (Daniel, 14 noiembrie 2026): ce face platforma singură ca să vină oameni noi.
 * Planul întreg e în /mnt/project-files/marketing/plan-clienti-fara-reclame.md (proiect), pe scurt:
 * - rudele sunt canalul principal: invitația pleacă cu un buton pe WhatsApp, email sau „Trimite”, cu semnul `invitatie`
 *   în legătură, ca să se vadă în Admin → Analiză;
 * - cardurile de nume și de localitate (poză + butoane de distribuit) pe /nume/… și /localitati/…;
 * - șirul de emailuri de bun venit („Sfaturi pe email”), doar cu acordul omului (acordul `news`), cu dezabonare dintr-un clic,
 *   trimis de automatizarea „bun-venit” din Admin → Autonomie, oprită până o pornește Daniel;
 * - panoul Admin → Creștere și recomandări și calendarul de conținut (src/lib/calendar-continut.ts).
 * Fiecare parte are comutatorul ei (app_setting `crestere`, sau automatizarea din Autonomie).
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import { sql, type SQL } from "drizzle-orm";
import type { Db } from "@/db";
import { appSetting } from "@/db/schema";

type Row = Record<string, unknown>;
async function rows<T = Row>(db: Db, q: SQL): Promise<T[]> {
  const r = await db.execute(q);
  return (r.rows ?? []) as T[];
}
const n = (v: unknown) => Number(v ?? 0) || 0;
const DAY = 86_400_000;

/* ---------- Comutatoarele ---------- */

export type GrowthSettings = {
  /** Întrebarea „Vrei sfaturi pe email?”, o singură dată, în cont. */
  askNews: boolean;
  /** Butoanele WhatsApp / email / Trimite la invitații. */
  shareInvite: boolean;
  /** Cardurile de distribuit pe paginile de nume și localități. */
  shareCards: boolean;
};
export const GROWTH_KEY = "crestere";
export const GROWTH_DEFAULTS: GrowthSettings = { askNews: true, shareInvite: true, shareCards: true };
export const GROWTH_LABELS: Record<keyof GrowthSettings, { label: string; what: string }> = {
  askNews: { label: "Întrebarea „Vrei sfaturi pe email?”", what: "O singură dată, în cont, după ce omul a răspuns la celelalte întrebări. Fără „Da” nu pleacă niciun email de bun venit." },
  shareInvite: { label: "Invitația pe WhatsApp, email și „Trimite”", what: "Lângă linkul de invitație: butoane cu un mesaj cald gata scris. Linkul poartă semnul „invitatie”, ca să-l vezi în Analiză." },
  shareCards: { label: "Cardurile de nume și localitate", what: "Pe /nume/… și /localitati/…: cardul cu poza paginii și butoanele WhatsApp, Facebook, copiază și descarcă. Poza apare oricum în previzualizarea linkului." },
};

export async function growthSettings(db: Pick<Db, "select">): Promise<GrowthSettings> {
  try {
    const [r] = await db.select({ value: appSetting.value }).from(appSetting).where(sql`${appSetting.key} = ${GROWTH_KEY}`);
    const v = (r?.value ?? {}) as Partial<GrowthSettings>;
    return {
      askNews: typeof v.askNews === "boolean" ? v.askNews : GROWTH_DEFAULTS.askNews,
      shareInvite: typeof v.shareInvite === "boolean" ? v.shareInvite : GROWTH_DEFAULTS.shareInvite,
      shareCards: typeof v.shareCards === "boolean" ? v.shareCards : GROWTH_DEFAULTS.shareCards,
    };
  } catch {
    return GROWTH_DEFAULTS;
  }
}
export async function saveGrowthSettings(db: Pick<Db, "insert">, value: GrowthSettings, by: string | null, now = new Date()) {
  await db.insert(appSetting).values({ key: GROWTH_KEY, value, updatedBy: by, updatedAt: now })
    .onConflictDoUpdate({ target: appSetting.key, set: { value, updatedBy: by, updatedAt: now } });
}

/* ---------- Legăturile distribuite: semnele din Analiză ---------- */

export type ShareChannel = "whatsapp" | "facebook" | "email" | "copiat" | "telefon";
/** Legătura cu semnele utm, ca vizita să apară în Admin → Analiză la sursa și campania ei. */
export function tagged(url: string, source: ShareChannel, campaign: string, medium = "distribuire") {
  const u = new URL(url);
  u.searchParams.set("utm_source", source);
  u.searchParams.set("utm_medium", medium);
  u.searchParams.set("utm_campaign", campaign);
  return u.toString();
}
export const whatsappShare = (text: string) => `https://wa.me/?text=${encodeURIComponent(text)}`;
export const facebookShare = (url: string) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
export const mailShare = (subject: string, body: string) => `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

/* ---------- Sfaturile pe email (bun venit) ---------- */

/**
 * Pașii șirului: în ce zi de la crearea contului pleacă și când se sare (omul a făcut deja ce îi cerem). Un pas pleacă doar
 * în fereastra lui (`day` … `day + WINDOW`), ca un cont vechi să nu primească pe loc tot șirul când se pornește automatizarea.
 */
export const NEWS_STEPS = [
  { key: "e1", day: 1, skip: null },
  { key: "e2", day: 2, skip: "invited" },
  { key: "e3", day: 4, skip: "voice" },
  { key: "e4", day: 10, skip: "paid" },
  { key: "e5", day: 21, skip: null },
] as const;
export type NewsStep = (typeof NEWS_STEPS)[number]["key"];
export const NEWS_WINDOW = 3;
export type NewsFacts = { invited: boolean; voice: boolean; paid: boolean };

/** Ce pas îi trebuie azi omului (cel mult unul), sau nimic. Pură, ca să se poată testa. */
export function dueStep(createdAt: Date, sent: Set<string>, facts: NewsFacts, now = new Date()): NewsStep | null {
  const age = Math.floor((now.getTime() - createdAt.getTime()) / DAY);
  for (const s of NEWS_STEPS) {
    if (sent.has(s.key)) continue;
    if (age < s.day || age >= s.day + NEWS_WINDOW) continue;
    if (s.skip && facts[s.skip]) continue;
    return s.key;
  }
  return null;
}

/** Cheia pentru dezabonare: semnătura id-ului, ca nimeni să nu poată dezabona pe altcineva ghicind adrese. */
const secret = () => process.env.BETTER_AUTH_SECRET?.trim() || "cartea-neamului-local";
export const unsubscribeToken = (userId: string) => createHmac("sha256", secret()).update(`vesti:${userId}`).digest("base64url").slice(0, 32);
export function checkUnsubscribe(userId: string, token: string) {
  const want = Buffer.from(unsubscribeToken(userId));
  const got = Buffer.from(token);
  return want.length === got.length && timingSafeEqual(want, got);
}

/** Cei cu acordul dat acum (ultima alegere = da), cu contul din ultimele 25 de zile, fără contul de probă. */
export async function newsCandidates(db: Db, now = new Date()) {
  return rows<{ id: string; name: string; email: string; locale: string; created_at: string; invited: boolean; voice: boolean; paid: boolean; sent: string[] | null }>(db, sql`
    with last as (select distinct on (user_id) user_id, granted from consent where purpose = 'news' order by user_id, created_at desc)
    select u.id, u.name, u.email, u.locale, u.created_at,
      exists (select 1 from invitation i where i.created_by = u.id) as invited,
      exists (select 1 from document d join tree_member m on m.tree_id = d.tree_id where m.user_id = u.id and d.kind = 'audio') as voice,
      exists (select 1 from account_plan p where p.user_id = u.id and p.paid_until > ${now.toISOString()}) as paid,
      (select array_agg(split_part(k.ref, ':', 2)) from automation_mark k where k.automation = 'bun-venit' and k.ref like u.id || ':%') as sent
    from "user" u join last on last.user_id = u.id and last.granted
    where u.created_at > ${new Date(now.getTime() - 25 * DAY).toISOString()} and u.email not like 'demo@%'`);
}

/* ---------- Panoul Admin → Creștere și recomandări ---------- */

export const SHARE_CAMPAIGNS = ["invitatie", "card-nume", "card-localitate", "bun-venit", "calendar"] as const;

export async function growthDashboard(db: Db) {
  const [base] = await rows(db, sql`select
      (select count(*) from invitation) as inv_all,
      (select count(*) from invitation where expires_at > now() - interval '16 days') as inv_30,
      (select count(*) from invitation where accepted_at is not null) as acc_all,
      (select count(*) from invitation where accepted_at > now() - interval '30 days') as acc_30,
      (select count(distinct created_by) from invitation) as inviters,
      (select count(*) from "user") as users,
      (select count(*) from "user" where created_at > now() - interval '30 days') as users_30,
      (select count(*) from referral_bonus) as ref_all,
      (select coalesce(sum(days), 0) from referral_bonus where applied_at is not null) as ref_days,
      (select count(*) from gift) as gifts,
      (select count(*) from gift where redeemed_by is not null) as gifts_used,
      (select count(*) from (select distinct on (user_id) granted from consent where purpose = 'news' order by user_id, created_at desc) x where granted) as news_yes,
      (select count(*) from (select distinct on (user_id) granted from consent where purpose = 'news' order by user_id, created_at desc) x where not granted) as news_no`)
    .catch(() => [{} as Row]);
  const b = base ?? {};
  const [top, campaigns, mails, weeks] = await Promise.all([
    rows<{ name: string; accepted: number; made: number; bonus: number }>(db, sql`select u.name,
        count(i.accepted_at) as accepted, count(*) as made,
        (select count(*) from referral_bonus r where r.referrer_id = u.id) as bonus
      from invitation i join "user" u on u.id = i.created_by group by u.id, u.name order by count(i.accepted_at) desc, count(*) desc limit 10`).catch(() => []),
    rows<{ campaign: string; source: string; visitors: number; views: number }>(db, sql`select campaign, source, count(distinct visitor) as visitors, count(*) as views
      from page_view where day > current_date - 30 and campaign in (${sql.join(SHARE_CAMPAIGNS.map((c) => sql`${c}`), sql`, `)})
      group by campaign, source order by count(distinct visitor) desc`).catch(() => []),
    rows<{ step: string; c: number }>(db, sql`select split_part(ref, ':', 2) as step, count(*) as c from automation_mark where automation = 'bun-venit' group by 1 order by 1`).catch(() => []),
    rows<{ week: string; made: number; accepted: number }>(db, sql`select to_char(date_trunc('week', expires_at - interval '14 days'), 'YYYY-MM-DD') as week,
        count(*) as made, count(accepted_at) as accepted
      from invitation where expires_at > now() - interval '70 days' group by 1 order by 1`).catch(() => []),
  ]);
  const accepted30 = n(b.acc_30), users30 = n(b.users_30);
  return {
    invitations: { all: n(b.inv_all), last30: n(b.inv_30), accepted: n(b.acc_all), accepted30, inviters: n(b.inviters) },
    users: { all: n(b.users), last30: users30 },
    /** Câte conturi noi au venit prin invitații, din toate conturile noi ale lunii (aproximativ: o invitație primită = un om). */
    viralShare: users30 ? Math.round((100 * Math.min(accepted30, users30)) / users30) : 0,
    /** Câte rude aduce, în medie, un om care invită (din tot istoricul). */
    perInviter: n(b.inviters) ? Math.round((10 * n(b.acc_all)) / n(b.inviters)) / 10 : 0,
    referrals: { all: n(b.ref_all), days: n(b.ref_days) },
    gifts: { all: n(b.gifts), used: n(b.gifts_used) },
    news: { yes: n(b.news_yes), no: n(b.news_no), sent: Object.fromEntries(mails.map((m) => [m.step, n(m.c)])) as Record<string, number> },
    top: top.map((t) => ({ name: t.name, accepted: n(t.accepted), made: n(t.made), bonus: n(t.bonus) })),
    campaigns: campaigns.map((c) => ({ campaign: c.campaign, source: c.source, visitors: n(c.visitors), views: n(c.views) })),
    weeks: weeks.map((w) => ({ week: w.week, made: n(w.made), accepted: n(w.accepted) })),
  };
}
