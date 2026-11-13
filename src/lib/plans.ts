/**
 * Planurile și accesul, din panoul de admin („Manager control”). Cât timp plățile nu sunt pornite de acolo, nu e oprit nimeni.
 * Cel care ține site-ul alege cine rămâne gratuit pentru totdeauna (familia, prietenii) și până când a plătit fiecare.
 *
 * Ce rămâne mereu gratuit, orice plan ar avea omul: vederea arborelui, descărcarea arborelui (GEDCOM) și a datelor
 * din „Datele mele” (o cere și legea). După zilele gratuite, fără plată, arborii se pot doar vedea, nu se șterge nimic.
 */
import { eq, sql } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import type { Db } from "@/db";
import { accountPlan, appSetting } from "@/db/schema";
import { isPlan, type Plan } from "./plan-names";
import { isAdminUser } from "./admin";
import { isDemo } from "./demo";
export { PLANS, isPlan, type Plan } from "./plan-names";

const num = (min: number, max: number, what: string) => z.coerce.number({ invalid_type_error: "Scrie un număr." })
  .min(min, min === 0 ? "Prețul nu poate fi negativ." : `Cel puțin ${min} ${what}.`).max(max, "E prea mult.");
const flag = z.preprocess((v) => v === true || v === "on" || v === "true" || v === "1", z.boolean());

/** Planurile anuale (Daniel, 2026-11-13): Basic, Familie (recomandat) și Premium. Prețurile și plafoanele se schimbă din Admin. */
export const TIERS = ["basic", "familie", "premium"] as const;
export type Tier = (typeof TIERS)[number];
export const isTier = (v: unknown): v is Tier => typeof v === "string" && (TIERS as readonly string[]).includes(v);
export const tierRank = (t: Tier) => TIERS.indexOf(t);
/** Cartea PDF la un plan: plătită separat, una inclusă pe an (un arbore la alegere) sau inclusă la toți arborii titularului. */
export const BOOK_MODES = ["separat", "una", "toti"] as const;
export type BookMode = (typeof BOOK_MODES)[number];
/** Ce se numără într-un arbore: persoane, poze, înregistrări cu glasul, acte și documente, cine scrie și câți arbori are titularul. */
export const LIMIT_KEYS = ["persons", "photos", "audio", "docs", "writers", "trees"] as const;
export type LimitKey = (typeof LIMIT_KEYS)[number];
/** Plafoanele: `null` = fără limită. */
export type Limits = Record<LimitKey, number | null>;

const cap = (what: string) => num(0, 1_000_000, what).int("Scrie un număr întreg.");
const bookMode = z.enum(BOOK_MODES).catch("separat");
const tierFields = <P extends string>(p: P) => ({
  [`${p}Persons`]: cap(""), [`${p}Photos`]: cap(""), [`${p}Audio`]: cap(""), [`${p}Docs`]: cap(""),
  [`${p}Writers`]: cap(""), [`${p}Trees`]: cap(""), [`${p}Book`]: bookMode, [`${p}Print`]: num(0, 90, "").int("Scrie un număr întreg."),
}) as Record<`${P}${"Persons" | "Photos" | "Audio" | "Docs" | "Writers" | "Trees" | "Print"}`, ReturnType<typeof cap>> & Record<`${P}Book`, typeof bookMode>;

/**
 * Modelul de plată ales de Daniel pe 2026-11-12: fiecare om (cel care pornește arborele și fiecare rudă invitată) are câteva
 * zile gratuite cu totul deschis; după ele poate doar să vadă, până plătește anul. Din 2026-11-13 anul are trei planuri:
 * Basic (`priceLei` / `priceEur`, ca înainte), Familie și Premium, fiecare cu plafoanele lui. Cartea PDF se plătește separat
 * la Basic. `on` pornește regulile în site; până atunci nu e oprit nimeni. `startedAt` e ziua pornirii: cine avea cont dinainte
 * primește zilele gratuite de atunci, nu de la facerea contului.
 * Plafoanele: 0 = fără limită.
 */
export const PlanSettings = z.object({
  on: flag,
  startedAt: z.string().datetime().nullable().catch(null),
  trialDays: num(1, 90, "zile").int("Scrie un număr întreg."),
  priceLei: num(0, 5000, ""),
  priceEur: num(0, 1000, ""),
  invitePriceLei: num(0, 5000, ""),
  invitePriceEur: num(0, 1000, ""),
  bookLei: num(0, 5000, ""),
  bookEur: num(0, 1000, ""),
  betaDays: num(0, 3650, "zile").int("Scrie un număr întreg."),
  trialPersons: num(5, 100000, "persoane").int("Scrie un număr întreg."),
  trialPhotos: cap(""),
  trialAudio: cap(""),
  trialDocs: cap(""),
  ...tierFields("basic"),
  familieLei: num(0, 5000, ""),
  familieEur: num(0, 1000, ""),
  ...tierFields("familie"),
  premiumLei: num(0, 5000, ""),
  premiumEur: num(0, 1000, ""),
  ...tierFields("premium"),
  // Îmbunătățirile din 2026-11-13: pachetul Basic + cartea PDF, „de la X lei” la cartea tipărită (0 = nu se arată),
  // zilele în plus pentru cine aduce o rudă care își deschide arborele și plătește, aducerea aminte înainte de expirare.
  bundleLei: num(0, 5000, ""),
  bundleEur: num(0, 1000, ""),
  printFromLei: num(0, 100000, ""),
  printFromEur: num(0, 20000, ""),
  referralDays: num(0, 365, "zile").int("Scrie un număr întreg."),
  reminderDays: num(0, 60, "zile").int("Scrie un număr întreg."),
  // „Păstrarea” (Daniel, 2026-11-13): după un an plătit, o sumă mică pe an ca familia să vadă și să asculte tot online, fără
  // adăugări noi; și pachetul „Păstrare + cartea PDF”. Aceeași sumă la orice plan.
  keepLei: num(0, 5000, ""),
  keepEur: num(0, 1000, ""),
  keepBookLei: num(0, 5000, ""),
  keepBookEur: num(0, 1000, ""),
});
export type PlanSettings = z.infer<typeof PlanSettings>;
export const DEFAULT_SETTINGS: PlanSettings = {
  on: false, startedAt: null, trialDays: 7, priceLei: 49, priceEur: 10, invitePriceLei: 49, invitePriceEur: 10, bookLei: 99, bookEur: 20,
  // Cei care au testat site-ul înainte de pornirea plăților au primul an gratuit (alegerea lui Daniel, 2026-11-12).
  betaDays: 365,
  // Cât încape familia apropiată (părinți, bunici, soț/soție, copii, frați, nepoți): în zilele gratuite, un arbore al cuiva
  // care n-a plătit nu crește peste atât (alegerea lui Daniel, 2026-11-13), ca să nu se facă tot neamul fără plată.
  trialPersons: 30, trialPhotos: 40, trialAudio: 10, trialDocs: 10,
  basicPersons: 100, basicPhotos: 200, basicAudio: 20, basicDocs: 40, basicWriters: 2, basicTrees: 1, basicBook: "separat", basicPrint: 0,
  familieLei: 149, familieEur: 30,
  familiePersons: 400, familiePhotos: 800, familieAudio: 80, familieDocs: 150, familieWriters: 8, familieTrees: 2, familieBook: "una", familiePrint: 0,
  premiumLei: 249, premiumEur: 50,
  premiumPersons: 0, premiumPhotos: 3000, premiumAudio: 250, premiumDocs: 500, premiumWriters: 20, premiumTrees: 5, premiumBook: "toti", premiumPrint: 20,
  bundleLei: 129, bundleEur: 25, printFromLei: 0, printFromEur: 0, referralDays: 30, reminderDays: 14,
  keepLei: 25, keepEur: 5, keepBookLei: 109, keepBookEur: 22,
};
const capOf = (n: number) => (n > 0 ? n : null);
const K = { persons: "Persons", photos: "Photos", audio: "Audio", docs: "Docs", writers: "Writers", trees: "Trees" } as const;

/** Plafoanele unui plan plătit. */
export function tierLimits(t: Tier, s: PlanSettings): Limits {
  return Object.fromEntries(LIMIT_KEYS.map((k) => [k, capOf(s[`${t}${K[k]}`])])) as Limits;
}
/** Plafoanele din zilele gratuite (și după ele, când arborele e doar de citit): un arbore, doar titularul scrie. */
export const trialLimits = (s: PlanSettings): Limits =>
  ({ persons: s.trialPersons, photos: capOf(s.trialPhotos), audio: capOf(s.trialAudio), docs: capOf(s.trialDocs), writers: 1, trees: 1 });
/** Cartea PDF și reducerea la tipar pe un plan. */
export const tierBook = (t: Tier, s: PlanSettings): BookMode => s[`${t}Book`];
export const tierPrint = (t: Tier, s: PlanSettings): number => s[`${t}Print`];
const KEY = "planuri";
/** Eticheta cache-ului cu prețurile de pe prima pagină; se golește la fiecare salvare din Admin. */
export const PLANS_TAG = "plan-settings";

/** Setările plăților, cum le-a lăsat cel care ține site-ul (sau cele propuse, dacă nu le-a schimbat). */
export async function planSettings(db: Pick<Db, "select">): Promise<PlanSettings> {
  const [row] = await db.select({ value: appSetting.value }).from(appSetting).where(eq(appSetting.key, KEY));
  const parsed = PlanSettings.safeParse({ ...DEFAULT_SETTINGS, ...(row?.value as object | undefined) });
  return parsed.success ? parsed.data : DEFAULT_SETTINGS;
}

/** Salvează setările; ziua pornirii se ține minte prima dată când se pornesc plățile și se uită când se opresc. */
export async function savePlanSettings(db: Pick<Db, "insert" | "select">, v: PlanSettings, by: string, now = new Date()) {
  const before = await planSettings(db);
  const value: PlanSettings = { ...v, startedAt: v.on ? (before.on && before.startedAt ? before.startedAt : now.toISOString()) : null };
  await db.insert(appSetting).values({ key: KEY, value, updatedBy: by, updatedAt: now })
    .onConflictDoUpdate({ target: appSetting.key, set: { value, updatedBy: by, updatedAt: now } });
  try { revalidateTag(PLANS_TAG); } catch { /* în afara unei cereri Next (teste, scripturi) nu e cache de golit */ }
  return value;
}

/**
 * Pornirea vânzării cerută de Daniel pe 2026-11-13 („pornește-o tu”): o singură dată, la publicare (scripts/deploy-db.ts).
 * Un semn în `app_setting` ține minte că s-a făcut, ca o oprire ulterioară din Admin să rămână oprire.
 */
export async function startSalesOnce(db: Pick<Db, "insert" | "select">, now = new Date()): Promise<"pornit" | "deja"> {
  const MARK = "planuri_pornite_2026_11_13";
  const [seen] = await db.select({ key: appSetting.key }).from(appSetting).where(eq(appSetting.key, MARK));
  if (seen) return "deja";
  const before = await planSettings(db);
  const value: PlanSettings = { ...before, on: true, startedAt: before.on && before.startedAt ? before.startedAt : now.toISOString() };
  await db.insert(appSetting).values({ key: KEY, value, updatedAt: now }).onConflictDoUpdate({ target: appSetting.key, set: { value, updatedAt: now } });
  await db.insert(appSetting).values({ key: MARK, value: { at: now.toISOString() }, updatedAt: now }).onConflictDoNothing();
  return "pornit";
}

/**
 * Basic de la 50 la 49 de lei pe an (Daniel, 2026-11-13), la fel și anul unei rude care scrie: o singură dată, la publicare.
 * Schimbă doar ce era încă 50, ca un preț pus altfel din Admin să rămână cum l-a pus; anii deja plătiți nu se ating.
 */
export async function basicPrice49Once(db: Pick<Db, "insert" | "select">, now = new Date()): Promise<"schimbat" | "deja"> {
  const MARK = "pret_basic_49_2026_11_13";
  const [seen] = await db.select({ key: appSetting.key }).from(appSetting).where(eq(appSetting.key, MARK));
  if (seen) return "deja";
  const [row] = await db.select({ value: appSetting.value }).from(appSetting).where(eq(appSetting.key, KEY));
  if (row) {
    const before = await planSettings(db);
    const value: PlanSettings = { ...before, priceLei: before.priceLei === 50 ? 49 : before.priceLei, invitePriceLei: before.invitePriceLei === 50 ? 49 : before.invitePriceLei };
    await db.insert(appSetting).values({ key: KEY, value, updatedAt: now }).onConflictDoUpdate({ target: appSetting.key, set: { value, updatedAt: now } });
  }
  await db.insert(appSetting).values({ key: MARK, value: { at: now.toISOString() }, updatedAt: now }).onConflictDoNothing();
  return "schimbat";
}

/** Planul ales pentru un cont; „gratuit” fără notă și fără plată șterge alegerea, ca omul să fie din nou ca toți. */
export async function setAccountPlan(db: Pick<Db, "insert" | "delete">, userId: string, plan: Plan, note: string | null, by: string, now = new Date(),
  paidUntil: Date | null = null, tier: Tier | null = null) {
  const clean = note?.trim().slice(0, 200) || null;
  if (plan === "gratuit" && !clean && !paidUntil) {
    await db.delete(accountPlan).where(eq(accountPlan.userId, userId));
    return;
  }
  // Cine are an plătit (sau „Plătit” pus de mână) are și un plan: Basic, dacă nu s-a ales altul.
  const t = tier ?? (plan === "familie" || paidUntil ? "basic" : null);
  await db.insert(accountPlan).values({ userId, plan, note: clean, paidUntil, tier: t, setBy: by, updatedAt: now })
    .onConflictDoUpdate({ target: accountPlan.userId, set: { plan, note: clean, paidUntil, tier: t, setBy: by, updatedAt: now } });
}

export type AccountPlanRow = { plan: Plan; tier: Tier | null; note: string | null; paidUntil: string | null; keepUntil: string | null; updatedAt: string | null };
export async function accountPlans(db: Pick<Db, "select">): Promise<Map<string, AccountPlanRow>> {
  const rows = await db.select().from(accountPlan);
  return new Map(rows.map((r) => [r.userId, {
    plan: isPlan(r.plan) ? r.plan : "gratuit", tier: isTier(r.tier) ? r.tier : null, note: r.note, paidUntil: r.paidUntil?.toISOString() ?? null, keepUntil: r.keepUntil?.toISOString() ?? null, updatedAt: r.updatedAt?.toISOString() ?? null,
  }]));
}

const DAY = 86_400_000;
/**
 * Ce poate face un om acum:
 * - „deschis”: plățile nu sunt pornite, toți pot tot (ca până acum);
 * - „mereu”: gratuit pentru totdeauna (familia, prietenii, contul demo, cel care ține site-ul);
 * - „platit”: are anul plătit pe un plan (Basic, Familie, Premium; fără dată = pus „Plătit” de mână, fără termen);
 * - „beta”: avea cont înainte de pornirea plăților, deci are primul an gratuit (`betaDays` de la pornire);
 * - „proba”: e în zilele gratuite;
 * - „expirat”: zilele gratuite (sau anul plătit) s-au terminat: arborii lui sunt doar de citit până plătește. Dacă a avut
 *   un an (plătit sau primul an din beta), poate lua „Păstrarea” (`keepable`); cât o are (`keptUntil`), familia vede și
 *   ascultă tot online. Fără ea, numele, datele și textele rămân de văzut, iar pozele și glasurile altora doar în mic.
 * Fiecare om are zilele lui: și cel care pornește arborele, și fiecare rudă invitată (alegerea lui Daniel din 2026-11-12).
 */
export type Access =
  | { kind: "deschis" }
  | { kind: "mereu" }
  | { kind: "platit"; until: Date | null; tier: Tier }
  | { kind: "beta"; until: Date }
  | { kind: "proba"; until: Date; daysLeft: number }
  | { kind: "expirat"; since: Date; keptUntil?: Date | null; keepable?: boolean };

export function accessFor(a: { createdAt: Date; plan: Plan | null; paidUntil: Date | null; tier?: Tier | null; exempt?: boolean; keepUntil?: Date | null }, s: PlanSettings, now = new Date()): Access {
  const ended = (since: Date, hadYear: boolean): Access =>
    ({ kind: "expirat", since, keptUntil: a.keepUntil && a.keepUntil > now ? a.keepUntil : null, keepable: hadYear || !!(a.keepUntil) });
  if (!s.on) return { kind: "deschis" };
  if (a.exempt || a.plan === "mereu") return { kind: "mereu" };
  // „familie” în `account_plan.plan` înseamnă „a plătit anul”; planul ales (Basic / Familie / Premium) e în `tier`.
  const tier = a.tier ?? "basic";
  if (a.paidUntil && a.paidUntil > now) return { kind: "platit", until: a.paidUntil, tier };
  if (a.plan === "familie" && !a.paidUntil) return { kind: "platit", until: null, tier };
  const started = s.startedAt ? new Date(s.startedAt) : now;
  if (s.betaDays > 0 && a.createdAt < started) {
    const betaEnd = new Date(started.getTime() + s.betaDays * DAY);
    if (now < betaEnd) return { kind: "beta", until: betaEnd };
    return ended(a.paidUntil && a.paidUntil > betaEnd ? a.paidUntil : betaEnd, true);
  }
  const from = Math.max(a.createdAt.getTime(), started.getTime());
  const trialEnd = new Date(from + s.trialDays * DAY);
  if (now < trialEnd) return { kind: "proba", until: trialEnd, daysLeft: Math.ceil((trialEnd.getTime() - now.getTime()) / DAY) };
  return ended(a.paidUntil && a.paidUntil > trialEnd ? a.paidUntil : trialEnd, !!a.paidUntil);
}

/** Are „Păstrarea” acum? */
export const isKept = (a: Access) => a.kind === "expirat" && !!a.keptUntil;
/** Poate lua (sau prelungi) „Păstrarea”: doar după un an avut (plătit sau beta), cu anul terminat. */
export const mayKeep = (a: Access) => a.kind === "expirat" && !!a.keepable;
/** Până când ține „Păstrarea” dacă se plătește acum: un an de azi sau de la sfârșitul celei în curs. */
export function keepEnd(a: Access, now = new Date()) {
  const from = a.kind === "expirat" && a.keptUntil && a.keptUntil > now ? a.keptUntil : now;
  return new Date(from.getTime() + 365 * DAY);
}

/**
 * Pozele, glasurile și actele dintr-un arbore se deschid întregi? Da, cât titularul ține arborele (anul plătit, beta, gratuit
 * mereu, zilele gratuite, plăți oprite) sau are „Păstrarea”; da și pentru cine își are el însuși anul. Altfel se arată doar în
 * mic (pozele) și nu se ascultă online; fișierele încărcate de om însuși se deschid mereu întregi (sunt datele lui).
 */
export function fullMedia(owner: Access | null, viewer: Access) {
  if (viewer.kind === "deschis" || holdsYear(viewer)) return true;
  if (!owner) return false;
  return owner.kind !== "expirat" || isKept(owner);
}
export const mayWrite = (a: Access) => a.kind !== "expirat";

/**
 * Reguli ca plata să nu se poată ocoli invitându-se unul pe altul (Daniel, 2026-11-13). Lucrul împreună rămâne deschis,
 * dar arborele crește doar cât îi dă planul titularului:
 * - „ține arborele”: proprietarul are anul (plătit, primul an din beta, gratuit mereu sau plățile oprite);
 * - plafoanele unui arbore (persoane, poze, glasuri, acte, cine scrie) vin din planul titularului; în zilele gratuite
 *   (și după ele) sunt cele de probă;
 * - câți arbori are un om vine din planul lui;
 * - rudele se invită să scrie doar într-un arbore pe care îl ține titularul, cât încap în plafonul de scriitori;
 * - la Familie și Premium (și în primul an din beta, care are plafoanele Familie) cei care scriu nu plătesc separat;
 *   la Basic, ruda invitată are zilele ei gratuite și apoi își plătește anul, ca înainte;
 * - o rudă invitată în zilele ei gratuite nu mai scrie într-un arbore al cărui proprietar a rămas doar cu citirea.
 * Peste plafon nu se șterge nimic: se opresc doar adăugările noi.
 */
export const holdsYear = (a: Access) => a.kind === "deschis" || a.kind === "mereu" || a.kind === "platit" || a.kind === "beta";

/** Planul cu care se socotește un om: cel plătit; primul an din beta are plafoanele planului Familie. */
export const tierOf = (a: Access): Tier | null => (a.kind === "platit" ? a.tier : a.kind === "beta" ? "familie" : null);

/** Plafoanele unui om (pentru arborii lui): `null` = fără nicio limită. */
export function limitsFor(a: Access, s: PlanSettings): Limits | null {
  if (a.kind === "deschis" || a.kind === "mereu") return null;
  const t = tierOf(a);
  return t ? tierLimits(t, s) : trialLimits(s);
}

/** Cât mai încape dintr-un lucru într-un arbore, după planul titularului: `null` = fără limită. */
export function room(owner: Access, what: LimitKey, used: number, s: PlanSettings): { cap: number; used: number; left: number } | null {
  const c = limitsFor(owner, s)?.[what] ?? null;
  return c === null ? null : { cap: c, used, left: Math.max(0, c - used) };
}

/** Câte persoane mai încap: `null` = fără limită. Plafonul vine din planul titularului. */
export function personRoom(owner: Access, count: number, s: PlanSettings): number | null {
  return room(owner, "persons", count, s)?.left ?? null;
}

/** Cei care scriu în arborele titularului nu plătesc separat (Familie, Premium, beta, gratuit mereu, plăți oprite)? */
export const coversWriters = (owner: Access) =>
  owner.kind === "deschis" || owner.kind === "mereu" || owner.kind === "beta" || (owner.kind === "platit" && owner.tier !== "basic");

/** Poate scrie în arbore omul ăsta, ținând seama de proprietar? (Pe al lui arbore, cât nu i-a expirat anul, da.) */
export function writesInTree(me: Access, owner: Access | null, isOwner: boolean) {
  if (isOwner) return me.kind !== "expirat";
  if (owner && coversWriters(owner)) return true;
  if (me.kind === "expirat") return false;
  if (me.kind !== "proba" || !owner) return true;
  return owner.kind !== "expirat";
}

/** Se poate invita încă o rudă care să scrie în arbore? Doar dacă titularul ține arborele și mai e loc în plafonul de scriitori. */
export function mayInviteWriters(owner: Access, writers: number, s: PlanSettings) {
  if (!holdsYear(owner)) return false;
  const r = room(owner, "writers", writers, s);
  return r === null || r.left > 0;
}

/** Poate porni încă un arbore? Câți arbori are fiecare plan (în zilele gratuite, unul). */
export function mayStartTree(me: Access, ownedTrees: number, s: PlanSettings) {
  const c = limitsFor(me, s)?.trees ?? null;
  return c === null || ownedTrees < c;
}

/** Prețul anului pe un plan. La Basic, ruda invitată (fără arbore al ei) plătește prețul pentru invitați. */
export function tierPrice(t: Tier, ownsTree: boolean, s: PlanSettings): { lei: number; eur: number } {
  if (t === "familie") return { lei: s.familieLei, eur: s.familieEur };
  if (t === "premium") return { lei: s.premiumLei, eur: s.premiumEur };
  return ownsTree ? { lei: s.priceLei, eur: s.priceEur } : { lei: s.invitePriceLei, eur: s.invitePriceEur };
}
/** Prețul anului Basic pentru un om (cel mai mic: cel arătat în bandă). */
export const yearPrice = (ownsTree: boolean, s: PlanSettings) => tierPrice("basic", ownsTree, s);

/** Câți plătesc acum și cât ar aduce anul dacă toți cei în probă sau cu timpul expirat ar plăti (măcar Basic). */
export function revenue(people: { access: Access; ownsTree: boolean }[], s: PlanSettings) {
  let paying = 0, leiNow = 0, wouldPay = 0, leiPossible = 0;
  for (const p of people) {
    if (p.access.kind === "platit") { const { lei } = tierPrice(p.access.tier, p.ownsTree, s); paying++; leiNow += lei; leiPossible += lei; }
    if (p.access.kind === "proba" || p.access.kind === "expirat") { wouldPay++; leiPossible += yearPrice(p.ownsTree, s).lei; }
  }
  return { paying, wouldPay, leiYearNow: leiNow, leiYearPossible: leiPossible };
}

/** Mărimea fiecărui arbore: persoane și fișiere (poze, acte, înregistrări), cu proprietarul lui. Doar citiri. */
export async function treeSizes(db: Db) {
  const r = await db.execute(sql`select t.id, t.name, t.owner_id, t.created_at,
      (select count(*) from person p where p.tree_id = t.id) as persons,
      (select count(*) from document d where d.tree_id = t.id and d.file_key is not null) as files,
      (select count(*) from tree_member m where m.tree_id = t.id) as members
    from tree t order by persons desc`);
  return ((r.rows ?? []) as Record<string, unknown>[]).map((x) => ({
    id: String(x.id), name: String(x.name), ownerId: (x.owner_id as string) ?? null, createdAt: x.created_at ? new Date(x.created_at as string).toISOString() : null,
    persons: Number(x.persons ?? 0), files: Number(x.files ?? 0), members: Number(x.members ?? 0),
  }));
}

/** Oamenii cu ce le trebuie pentru acces: când și-au făcut contul, dacă sunt scutiți și dacă au un arbore al lor. */
export async function accessPeople(db: Db) {
  const r = await db.execute(sql`select u.id, u.email, u.email_verified, u.created_at,
      exists (select 1 from tree t where t.owner_id = u.id) as owns
    from "user" u`);
  return ((r.rows ?? []) as Record<string, unknown>[]).map((x) => {
    const createdAt = new Date(x.created_at as string);
    const email = String(x.email ?? "");
    return { id: String(x.id), createdAt, ownsTree: !!x.owns, exempt: isDemo(email) || isAdminUser({ email, emailVerified: !!x.email_verified, createdAt }) };
  });
}

export type PlanOverview = Awaited<ReturnType<typeof planOverview>>;

/**
 * Totul despre plăți dintr-o privire: setările, planul și accesul fiecărui om și ce ar aduce. Cât timp plățile sunt oprite,
 * accesul se socotește ca și cum ar fi pornite azi, ca să se vadă dinainte ce s-ar întâmpla.
 */
export async function planOverview(db: Db, now = new Date()) {
  const settings = await planSettings(db);
  const sim: PlanSettings = settings.on ? settings : { ...settings, on: true, startedAt: now.toISOString() };
  const plans = await accountPlans(db);
  const people = await accessPeople(db);
  const access = new Map<string, Access>();
  for (const p of people) {
    const ap = plans.get(p.id);
    access.set(p.id, accessFor({ createdAt: p.createdAt, plan: ap?.plan ?? null, paidUntil: ap?.paidUntil ? new Date(ap.paidUntil) : null, tier: ap?.tier, exempt: p.exempt,
      keepUntil: ap?.keepUntil ? new Date(ap.keepUntil) : null }, sim, now));
  }
  const planOf = (uid: string | null): Plan => (uid ? plans.get(uid)?.plan ?? "gratuit" : "gratuit");
  const trees = (await treeSizes(db)).map((t) => ({ ...t, plan: planOf(t.ownerId), access: t.ownerId ? access.get(t.ownerId) ?? null : null }));
  const kinds = [...access.values()].map((a) => a.kind);
  return {
    settings, plans, trees, access,
    revenue: revenue(people.map((p) => ({ access: access.get(p.id)!, ownsTree: p.ownsTree })), sim),
    counts: {
      mereu: kinds.filter((k) => k === "mereu").length,
      platit: kinds.filter((k) => k === "platit").length,
      proba: kinds.filter((k) => k === "proba").length,
      expirat: kinds.filter((k) => k === "expirat").length,
      beta: kinds.filter((k) => k === "beta").length,
      pastrare: [...access.values()].filter(isKept).length,
      basic: [...access.values()].filter((a) => a.kind === "platit" && a.tier === "basic").length,
      familie: [...access.values()].filter((a) => a.kind === "platit" && a.tier === "familie").length,
      premium: [...access.values()].filter((a) => a.kind === "platit" && a.tier === "premium").length,
    },
  };
}
