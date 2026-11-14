/**
 * Măsoară cât durează, la baza de date reală, ce citesc paginile de admin și antetul site-ului.
 * Pentru fiecare funcție: timpul (3 rulări) și câte întrebări pune bazei de date. Nu scrie nimic.
 *   npx tsx --env-file=.env.local scripts/masoara-viteza.ts
 */
import pg from "pg";

let count = 0;
let busy = 0;
const orig = pg.Client.prototype.query;
// Numărăm fiecare întrebare trimisă bazei de date (Pool.query trece tot prin Client.query).
pg.Client.prototype.query = function (this: pg.Client, ...args: unknown[]) {
  count++;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (orig as any).apply(this, args);
} as typeof orig;
void busy;

const { db } = await import("../src/db");
const { sql } = await import("drizzle-orm");

type Target = [string, () => Promise<unknown>];
const L = async <T>(p: Promise<T>) => p;

const targets: Target[] = [];
async function add(name: string, mod: string, fn: (m: any) => Promise<unknown>) { // eslint-disable-line @typescript-eslint/no-explicit-any
  try {
    const m = await import(mod);
    targets.push([name, () => fn(m)]);
  } catch (e) {
    console.log(`(sar peste ${name}: ${(e as Error).message.split("\n")[0]})`);
  }
}

await add("select 1 (un drum dus-întors)", "drizzle-orm", () => L(db.execute(sql`select 1`)));
await add("adminBadges (meniul, pe fiecare pagină)", "../src/lib/admin-briefing", (m) => m.adminBadges(db));
await add("adminBriefing (Panou de bord)", "../src/lib/admin-briefing", (m) => m.adminBriefing(db));
await add("businessStats", "../src/lib/admin-stats", (m) => m.businessStats(db));
await add("infraStats", "../src/lib/admin-stats", (m) => m.infraStats(db));
await add("peopleList (Oamenii, Control, Panou)", "../src/lib/admin-people", (m) => m.peopleList(db));
await add("changeStats", "../src/lib/admin-istoric", (m) => m.changeStats(db));
await add("editLimits", "../src/lib/edit-limits", (m) => m.editLimits(db));
await add("baseWordInfo", "../src/lib/texte", (m) => m.baseWordInfo(db));
await add("knowledge (Centru de cunoștințe)", "../src/lib/cunostinte/verificare", (m) => m.knowledge(db));
await add("autonomyPage (Autonomie)", "../src/lib/autonomie", (m) => m.autonomyPage(db));
await add("growthDashboard (Creștere)", "../src/lib/crestere", (m) => m.growthDashboard(db));
await add("businessHealth (Sănătatea afacerii)", "../src/lib/sanatate-afacere", (m) => m.businessHealth(db));
await add("planOverview (Control)", "../src/lib/plans", (m) => m.planOverview(db));
await add("usageOverview (Oamenii)", "../src/lib/usage", (m) => m.usageOverview(db, 30));
await add("crmPartners (Parteneri)", "../src/lib/parteneri-crm", (m) => m.crmPartners(db));
await add("securityOverview (Securitate)", "../src/lib/admin-securitate", (m) => m.securityOverview(db));
await add("analiza: sessionsOf 30z", "../src/lib/analiza", (m) => m.sessionsOf(db, m.rangeOf("30z").cur));
await add("analiza: retention", "../src/lib/analiza", (m) => m.retention(db));
await add("invatare: ledger", "../src/lib/invatare", (m) => m.ledger(db));
await add("antet: planSettings", "../src/lib/plans", (m) => m.planSettings(db));

const out: string[] = [];
for (const [name, fn] of targets) {
  const times: number[] = [];
  let q = 0;
  let err = "";
  for (let i = 0; i < 3; i++) {
    const c0 = count;
    const t0 = performance.now();
    try { await fn(); } catch (e) { err = (e as Error).message.split("\n")[0]; }
    times.push(Math.round(performance.now() - t0));
    q = count - c0;
  }
  const line = `${name.padEnd(44)} ${times.map((t) => `${t}ms`.padStart(7)).join(" ")}   întrebări: ${q}${err ? `   EROARE: ${err}` : ""}`;
  out.push(line);
  console.log(line);
}

// Cât lucrează serverul bazei la cele mai grele întrebări (fără drumul prin internet).
try {
  const r = await db.execute(sql`select name, setting from pg_settings where name in ('max_connections','shared_buffers','work_mem')`);
  console.log("\nSetări Postgres:", JSON.stringify((r as unknown as { rows: unknown[] }).rows));
  const s = await db.execute(sql`select relname, n_live_tup from pg_stat_user_tables order by n_live_tup desc limit 12`);
  console.log("Cele mai mari tabele:", JSON.stringify((s as unknown as { rows: unknown[] }).rows));
} catch (e) { console.log("setări:", (e as Error).message); }
process.exit(0);
