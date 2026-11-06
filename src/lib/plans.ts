/**
 * Planurile, pregătite din panoul de admin („Manager control”) pentru când pornește abonamentul. Acum nu se văd nicăieri în site și nu
 * opresc pe nimeni: cel care ține site-ul alege cine rămâne gratuit pentru totdeauna (familia, prietenii) și cine plătește,
 * și încearcă limite pentru planul gratuit, ca să vadă câți arbori ar trece peste ele.
 *
 * Ce rămâne mereu gratuit, orice plan ar avea omul: vederea arborelui, invitațiile, descărcarea arborelui (GEDCOM) și a datelor
 * din „Datele mele” (o cere și legea). Banii pot veni din arborii mari și din ce se face în plus: cartea tipărită, albumul.
 */
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import type { Db } from "@/db";
import { accountPlan, appSetting } from "@/db/schema";
import { isPlan, type Plan } from "./plan-names";
export { PLANS, isPlan, type Plan } from "./plan-names";

const count = (what: string) => z.coerce.number({ invalid_type_error: "Scrie un număr." }).int("Scrie un număr întreg.")
  .min(10, `Cel puțin 10 ${what}.`).max(1_000_000, "E prea mult.");
export const PlanSettings = z.object({
  freePersons: count("persoane"),
  freeFiles: count("fișiere"),
  priceEurYear: z.coerce.number({ invalid_type_error: "Scrie un număr." }).min(0, "Prețul nu poate fi negativ.").max(1000, "Cel mult 1000 €."),
});
export type PlanSettings = z.infer<typeof PlanSettings>;
/**
 * Propunerea din planul de afaceri: gratuit până la 200 de persoane și cam 1 GB de poze pe arbore, apoi 12 €/an pe arbore.
 * Mărimea fișierelor nu e ținută în baza de date, așa că limita pozelor se numără în fișiere (500 × ~2 MB ≈ 1 GB).
 */
export const DEFAULT_SETTINGS: PlanSettings = { freePersons: 200, freeFiles: 500, priceEurYear: 12 };
const KEY = "planuri";

/** Limitele planului gratuit și prețul, cum le-a lăsat cel care ține site-ul (sau cele propuse, dacă nu le-a schimbat). */
export async function planSettings(db: Pick<Db, "select">): Promise<PlanSettings> {
  const [row] = await db.select({ value: appSetting.value }).from(appSetting).where(eq(appSetting.key, KEY));
  const parsed = PlanSettings.safeParse({ ...DEFAULT_SETTINGS, ...(row?.value as object | undefined) });
  return parsed.success ? parsed.data : DEFAULT_SETTINGS;
}

export async function savePlanSettings(db: Pick<Db, "insert">, v: PlanSettings, by: string, now = new Date()) {
  await db.insert(appSetting).values({ key: KEY, value: v, updatedBy: by, updatedAt: now })
    .onConflictDoUpdate({ target: appSetting.key, set: { value: v, updatedBy: by, updatedAt: now } });
}

/** Planul ales pentru un cont; „gratuit” șterge alegerea, ca omul să fie din nou ca toți. */
export async function setAccountPlan(db: Pick<Db, "insert" | "delete">, userId: string, plan: Plan, note: string | null, by: string, now = new Date()) {
  const clean = note?.trim().slice(0, 200) || null;
  if (plan === "gratuit" && !clean) {
    await db.delete(accountPlan).where(eq(accountPlan.userId, userId));
    return;
  }
  await db.insert(accountPlan).values({ userId, plan, note: clean, setBy: by, updatedAt: now })
    .onConflictDoUpdate({ target: accountPlan.userId, set: { plan, note: clean, setBy: by, updatedAt: now } });
}

export type AccountPlanRow = { plan: Plan; note: string | null; updatedAt: string | null };
export async function accountPlans(db: Pick<Db, "select">): Promise<Map<string, AccountPlanRow>> {
  const rows = await db.select().from(accountPlan);
  return new Map(rows.map((r) => [r.userId, { plan: isPlan(r.plan) ? r.plan : "gratuit", note: r.note, updatedAt: r.updatedAt?.toISOString() ?? null }]));
}

export type LimitState = "sub" | "aproape" | "peste";
/** Unde e un arbore față de limitele gratuite: „aproape” de la trei sferturi din oricare limită. */
export function limitState(persons: number, files: number, s: PlanSettings): LimitState {
  const worst = Math.max(persons / s.freePersons, files / s.freeFiles);
  return worst >= 1 ? "peste" : worst >= 0.75 ? "aproape" : "sub";
}

/**
 * Câți bani ar aduce abonamentul azi, cu prețul pe an pentru un cont (oricâți arbori ar avea): cei marcați „Familie”, plus cei cu
 * planul gratuit care au un arbore peste limite. Cei „Gratuit mereu” nu plătesc, oricât de mare le-ar fi arborele.
 */
export function revenue(owners: { plan: Plan; overLimitTrees: number }[], s: PlanSettings) {
  const paying = owners.filter((o) => o.plan === "familie").length;
  const wouldPay = owners.filter((o) => o.plan === "gratuit" && o.overLimitTrees > 0).length;
  return { paying, wouldPay, eurYearNow: paying * s.priceEurYear, eurYearPossible: (paying + wouldPay) * s.priceEurYear };
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

export type PlanOverview = Awaited<ReturnType<typeof planOverview>>;

/** Totul despre planuri dintr-o privire: limitele, unde e fiecare arbore față de ele, planul fiecărui cont și ce ar aduce. */
export async function planOverview(db: Db) {
  const settings = await planSettings(db);
  const plans = await accountPlans(db);
  const planOf = (uid: string | null): Plan => (uid ? plans.get(uid)?.plan ?? "gratuit" : "gratuit");
  const trees = (await treeSizes(db)).map((t) => ({ ...t, state: limitState(t.persons, t.files, settings), plan: planOf(t.ownerId) }));
  const owners = new Map<string, { plan: Plan; overLimitTrees: number }>();
  for (const [uid, p] of plans) owners.set(uid, { plan: p.plan, overLimitTrees: 0 });
  for (const t of trees) {
    if (!t.ownerId) continue;
    const o = owners.get(t.ownerId) ?? { plan: t.plan, overLimitTrees: 0 };
    if (t.state === "peste") o.overLimitTrees++;
    owners.set(t.ownerId, o);
  }
  const all = [...plans.values()];
  return {
    settings, plans, trees,
    revenue: revenue([...owners.values()], settings),
    counts: {
      mereu: all.filter((p) => p.plan === "mereu").length,
      familie: all.filter((p) => p.plan === "familie").length,
      over: trees.filter((t) => t.state === "peste").length,
      near: trees.filter((t) => t.state === "aproape").length,
      overFree: trees.filter((t) => t.state === "peste" && t.plan === "gratuit").length,
    },
  };
}
