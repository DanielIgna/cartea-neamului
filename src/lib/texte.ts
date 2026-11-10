/**
 * Textele site-ului pe care adminul le schimbă din panou (pagina „Texte”), păstrate în `app_setting`.
 * Deocamdată unul: cuvântul de la finalul Călătoriei în timp, câte unul pentru fiecare limbă a site-ului (`cuvant_final` pentru
 * română, `cuvant_final:de` și așa mai departe pentru celelalte). Cât timp nu e schimbat, rămâne cel scris în cod (DEFAULT_WORDS),
 * iar proprietarul unui arbore îl poate înlocui tot cu al lui sau îl poate ascunde (tree.journey_word).
 */
import { eq, sql } from "drizzle-orm";
import type { Db } from "@/db";
import { appSetting, tree } from "@/db/schema";
import { MAX_WORD } from "./cuvant-final";
import { DEFAULT_WORDS } from "./cuvant-final-limbi";
import type { Locale } from "@/i18n/locales";

const WORD_KEY = "cuvant_final";
const wordKey = (locale: Locale) => (locale === "ro" ? WORD_KEY : `${WORD_KEY}:${locale}`);
type SettingRow = typeof appSetting.$inferSelect;

export type BaseWord = { text: string; changed: boolean; updatedAt: Date | null };

/** Cuvântul de la final pentru arborii unde proprietarul n-a scris altul: cel schimbat din panou sau cel inițial. */
export async function baseWordInfo(db: Pick<Db, "select">, locale: Locale = "ro"): Promise<BaseWord> {
  // Dacă setările nu se pot citi, călătoria merge mai departe cu textul inițial.
  const rows = await db.select().from(appSetting).where(eq(appSetting.key, wordKey(locale))).catch((): SettingRow[] => []);
  const row = rows[0];
  const text = (row?.value as { text?: unknown } | undefined)?.text;
  return typeof text === "string" && text.trim()
    ? { text, changed: true, updatedAt: row!.updatedAt }
    : { text: DEFAULT_WORDS[locale], changed: false, updatedAt: null };
}

export async function baseWord(db: Pick<Db, "select">, locale: Locale = "ro") {
  return (await baseWordInfo(db, locale)).text;
}

/**
 * Salvează textul din panou. `null`, un text gol sau chiar textul inițial = înapoi la cel din cod, ca o schimbare viitoare a
 * textului inițial să ajungă și aici.
 */
export async function saveBaseWord(db: Pick<Db, "insert" | "delete">, text: string | null, by: string, now = new Date(), locale: Locale = "ro") {
  const clean = (text ?? "").replace(/\r\n?/g, "\n").trim();
  if (clean.length > MAX_WORD) throw new Error(`Textul poate avea cel mult ${MAX_WORD} de caractere.`);
  const key = wordKey(locale);
  if (!clean || clean === DEFAULT_WORDS[locale].trim()) {
    await db.delete(appSetting).where(eq(appSetting.key, key));
    return;
  }
  const value = { text: clean };
  await db.insert(appSetting).values({ key, value, updatedBy: by, updatedAt: now })
    .onConflictDoUpdate({ target: appSetting.key, set: { value, updatedBy: by, updatedAt: now } });
}

/** Câți arbori nu folosesc textul de bază: proprietarul și-a scris textul lui sau l-a ascuns. */
export async function ownWordCounts(db: Pick<Db, "select">) {
  const [r] = await db.select({
    own: sql<number>`count(*) filter (where ${tree.journeyWord} is not null and btrim(${tree.journeyWord}) <> '')`,
    hidden: sql<number>`count(*) filter (where ${tree.journeyWord} is not null and btrim(${tree.journeyWord}) = '')`,
  }).from(tree);
  return { own: Number(r?.own ?? 0), hidden: Number(r?.hidden ?? 0) };
}
