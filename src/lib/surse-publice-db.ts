/**
 * Partea de server a „Surselor publice” (src/lib/surse-publice.ts): schimbările din Admin (app_setting `surse_publice`),
 * „Nu mai arăta” pentru fiecare om și persoană (archive_hint_dismissal) și cine poate primi emailul unic despre arhive.
 */
import { and, eq, inArray, sql, type SQL } from "drizzle-orm";
import type { Db } from "@/db";
import { appSetting, archiveHintDismissal, automationMark, person } from "@/db/schema";
import { realAccountSql } from "./conturi-test";
import { AN_LIMITA, SURSE, adresaBuna, aplica, type Schimbare, type Schimbari, type Sursa } from "./surse-publice";

export const SETARE = "surse_publice";

/** Schimbările din Admin, cum sunt salvate (doar câmpurile cunoscute). */
export async function schimbari(db: Pick<Db, "select">): Promise<Schimbari> {
  const [row] = await db.select({ value: appSetting.value }).from(appSetting).where(eq(appSetting.key, SETARE)).catch(() => []);
  const v = row?.value;
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Schimbari) : {};
}

/** Lista de surse, cu ce s-a schimbat din Admin (toate, și cele oprite: filtrează după `activ`). */
export async function surse(db: Pick<Db, "select">): Promise<Sursa[]> {
  return aplica(SURSE, await schimbari(db));
}

/** Verifică ce vine din formularul din Admin. */
export function verificaSchimbare(raw: Record<string, unknown>): { ok: Schimbare } | { error: string } {
  const s = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
  const url = s(raw.url, 500);
  if (url && !adresaBuna(url)) return { error: "Adresa trebuie să înceapă cu https:// și să nu aibă parametri de urmărire." };
  const nume = s(raw.nume, 160), descriere = s(raw.descriere, 600);
  if (!nume) return { error: "Scrie numele sursei." };
  if (!descriere) return { error: "Scrie o descriere scurtă." };
  const ordine = Number(raw.ordine);
  return { ok: {
    nume, descriere, url: url || undefined, perioada: s(raw.perioada, 120) || undefined, sfat: s(raw.sfat, 600), nota: s(raw.nota, 300),
    activ: raw.activ === "on" || raw.activ === true, ordine: Number.isFinite(ordine) ? Math.round(ordine) : undefined,
  } };
}

/** Salvează schimbarea unei surse (o sursă necunoscută e ignorată). */
export async function salveazaSchimbare(db: Pick<Db, "select" | "insert">, id: string, ch: Schimbare | null, by: string | null, now = new Date()) {
  if (!SURSE.some((x) => x.id === id)) return false;
  const all = await schimbari(db);
  if (ch) all[id] = ch; else delete all[id];
  await db.insert(appSetting).values({ key: SETARE, value: all, updatedBy: by, updatedAt: now })
    .onConflictDoUpdate({ target: appSetting.key, set: { value: all, updatedBy: by, updatedAt: now } });
  return true;
}

/** Doar pornit / oprit, păstrând restul schimbărilor. */
export async function pornesteSursa(db: Pick<Db, "select" | "insert">, id: string, activ: boolean, by: string | null) {
  const all = await schimbari(db);
  return salveazaSchimbare(db, id, { ...(all[id] ?? {}), activ }, by);
}

/* ---------- „Nu mai arăta” ---------- */

/** Persoanele din arbore pentru care omul a închis cardul. */
export async function inchise(db: Pick<Db, "select">, userId: string, treeId: string): Promise<string[]> {
  const rows = await db.select({ id: archiveHintDismissal.personId }).from(archiveHintDismissal)
    .innerJoin(person, eq(person.id, archiveHintDismissal.personId))
    .where(and(eq(archiveHintDismissal.userId, userId), eq(person.treeId, treeId))).catch(() => []);
  return rows.map((r) => r.id);
}

export async function inchide(db: Pick<Db, "insert">, userId: string, personId: string, now = new Date()) {
  await db.insert(archiveHintDismissal).values({ userId, personId, createdAt: now }).onConflictDoNothing();
}

/** Pentru verificări (teste, Admin): s-a închis cardul la aceste persoane? */
export async function suntInchise(db: Pick<Db, "select">, userId: string, ids: string[]) {
  if (!ids.length) return [];
  return (await db.select({ id: archiveHintDismissal.personId }).from(archiveHintDismissal)
    .where(and(eq(archiveHintDismissal.userId, userId), inArray(archiveHintDismissal.personId, ids)))).map((r) => r.id);
}

/* ---------- Emailul unic „Ai strămoși înainte de 1930?” ---------- */

export const EMAIL_CHEIE = "surse-publice";
export const MIN_PERSOANE = 5;
/** Câte emailuri pleacă cel mult într-o zi (ca să nu plece deodată sute). */
export const PE_ZI = 100;

export type Candidat = { id: string; name: string; email: string; locale: string | null };

/** Un strămoș căruia îi lipsește ceva și pentru care arhivele pot ajuta (aceeași regulă ca în cardul din arbore). */
const stramosCuLipsuri = (p: SQL) => sql`
  ${p}.living = false and ${p}.given_name !~* 'necunoscut' and (${p}.birth_from is null or ${p}.birth_from < ${`${AN_LIMITA}-01-01`}::date)
  and (${p}.birth_from is null or coalesce(trim(${p}.birth_place), '') = '' or coalesce(trim(${p}.death_date_text), '') = ''
    or (select count(*) from relationship r where r.type = 'parent_child' and r.person_b = ${p}.id) < 2
    or not exists (select 1 from relationship r where r.type = 'partnership' and (r.person_a = ${p}.id or r.person_b = ${p}.id)))`;

/**
 * Cine primește emailul: conturi reale, cu un arbore al lor de cel puțin 5 persoane și cel puțin un strămoș născut înainte
 * de 1930 (sau fără an) cu date lipsă; o singură dată pe cont. Respectă dezabonarea existentă: cine a spus „Nu” la emailurile
 * despre cont (acordul `conversie`) sau la sfaturile pe email (`news`) nu-l primește.
 */
export async function candidatiEmail(db: Db, limit = PE_ZI): Promise<Candidat[]> {
  const r = await db.execute(sql`
    select u.id, u.name, u.email, u.locale from "user" u
    where ${realAccountSql("u")} and coalesce(u.email_verified, false)
      and coalesce((select c.granted from consent c where c.user_id = u.id and c.purpose = 'conversie' order by c.created_at desc limit 1), true)
      and coalesce((select c.granted from consent c where c.user_id = u.id and c.purpose = 'news' order by c.created_at desc limit 1), true)
      and not exists (select 1 from automation_mark k where k.automation = ${EMAIL_CHEIE} and k.ref = u.id)
      and exists (
        select 1 from tree t where t.owner_id = u.id
          and (select count(*) from person x where x.tree_id = t.id) >= ${MIN_PERSOANE}
          and exists (select 1 from person p where p.tree_id = t.id and ${stramosCuLipsuri(sql.raw("p"))}))
    order by u.created_at limit ${limit}`);
  return (r.rows ?? []) as Candidat[];
}

export const marcheazaEmail = (db: Pick<Db, "insert">, userId: string, now = new Date()) =>
  db.insert(automationMark).values({ automation: EMAIL_CHEIE, ref: userId, at: now }).onConflictDoNothing();
