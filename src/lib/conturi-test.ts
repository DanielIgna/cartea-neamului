/**
 * Conturile de test (Daniel, 17.11.2026): ca cifrele din Admin să fie aceleași peste tot (Oameni, Business, Infra, Creștere,
 * Analiză, Sănătatea afacerii…), conturile care nu sunt oameni reali stau deoparte:
 * - contul de probă (demo@cartea-neamului.ro);
 * - adresele @example.com (făcute la încercări);
 * - conturile venite printr-un link de test (?src=test-link-…), oricare dintre atingeri.
 * Folosit și de CRM. În Admin → Oameni, filtrul „Ascunde conturile de test” le poate arăta la nevoie.
 */
import { sql, type SQL } from "drizzle-orm";
import { DEMO_EMAIL } from "./demo";

export const TEST_EMAIL_DOMAINS = ["example.com"] as const;
export const TEST_SOURCE_PREFIX = "test-link-";

/** Pentru JS: e cont de test? `src` = oricare dintre sursele contului (first/last/source). */
export function isTestAccount(a: { email?: string | null; src?: (string | null | undefined)[] | string | null }): boolean {
  const email = (a.email ?? "").trim().toLowerCase();
  if (email === DEMO_EMAIL) return true;
  if (TEST_EMAIL_DOMAINS.some((d) => email.endsWith(`@${d}`))) return true;
  const srcs = Array.isArray(a.src) ? a.src : [a.src];
  return srcs.some((s) => !!s && s.toLowerCase().startsWith(TEST_SOURCE_PREFIX));
}

/**
 * Fragmentul SQL adevărat pentru un cont de test. `u` = aliasul tabelului "user" din interogare (implicit `u`;
 * pentru tabelul fără alias, `"user"`). Nu cere niciun join în plus.
 */
export function testAccountSql(u = "u"): SQL {
  const a = sql.raw(u);
  const like = TEST_EMAIL_DOMAINS.map((d) => sql`lower(${a}.email) like ${`%@${d}`}`);
  const pre = `${TEST_SOURCE_PREFIX}%`;
  return sql`(lower(${a}.email) = ${DEMO_EMAIL} or ${sql.join(like, sql` or `)}
    or exists (select 1 from account_source s_test where s_test.user_id = ${a}.id
      and (s_test.source like ${pre} or s_test.first_src like ${pre} or s_test.last_src like ${pre} or s_test.last_source like ${pre})))`;
}

/** Negația: cont real. Cu `show = true` (filtrul oprit) lasă să treacă toate conturile. */
export function realAccountSql(u = "u", show = false): SQL {
  return show ? sql`true` : sql`not ${testAccountSql(u)}`;
}

/** Același lucru pentru un `user_id` dintr-un alt tabel (arbori, plăți, sesiuni…). */
export function realUserIdSql(col: SQL | string): SQL {
  const c = typeof col === "string" ? sql.raw(col) : col;
  return sql`not exists (select 1 from "user" u_test where u_test.id = ${c} and ${testAccountSql("u_test")})`;
}
