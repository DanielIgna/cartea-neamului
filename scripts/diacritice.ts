/**
 * Diacriticele din ce e deja scris în baza de date: „ǎ/Ǎ” → „ă/Ă”, „ş/ţ” cu sedilă → „ș/ț” cu virgulă, apoi forma NFC.
 * Implicit doar numără (dry-run): câte rânduri și câte câmpuri s-ar schimba, pe tabele, cu câteva exemple.
 * Cu --apply face schimbarea, într-o singură tranzacție. Salvările noi sunt deja normalizate de declanșatoarele din migrarea 0015.
 * Scriptul nu aplică migrări: dry-run-ul doar citește, chiar și pe o bază unde 0015 nu a ajuns încă.
 *
 *   npx tsx --env-file=.env.local scripts/diacritice.ts            # dry-run
 *   npx tsx --env-file=.env.local scripts/diacritice.ts --apply    # aplică
 */
import { sql } from "drizzle-orm";
import { db } from "../src/db";

const TABLES: Record<string, string[]> = {"person": ["given_name", "surname", "birth_surname", "birth_date_text", "birth_place", "death_date_text", "death_place", "residence_place", "biography", "notes", "occupation"], "memory": ["question", "title", "body", "when_text", "place"], "memory_reply": ["body"], "memory_question": ["text"], "tree": ["name", "region"], "document": ["title", "transcription", "description", "date_text", "place"], "place_pin": ["name", "detail"], "message": ["body"], "old_house": ["place", "built_by", "story"], "user": ["name"]};
const apply = process.argv.includes("--apply");
const fix = (c: string) => `translate(normalize("${c}", NFC), 'ǎǍşŞţŢ', 'ăĂșȘțȚ')`;
const differs = (c: string) => `("${c}" IS NOT NULL AND "${c}" <> ${fix(c)})`;

let rowsTotal = 0, fieldsTotal = 0;
type Ex = Pick<typeof db, "execute">;
const run = async (ex: Ex) => {
  for (const [table, cols] of Object.entries(TABLES)) {
    const where = cols.map(differs).join(" OR ");
    const fields = cols.map((c) => `(CASE WHEN ${differs(c)} THEN 1 ELSE 0 END)`).join(" + ");
    const res = await ex.execute(sql.raw(`SELECT count(*)::int AS rows, coalesce(sum(${fields}), 0)::int AS fields FROM "${table}" WHERE ${where}`));
    const r = (res as unknown as { rows: { rows: number; fields: number }[] }).rows[0];
    rowsTotal += r.rows; fieldsTotal += r.fields;
    if (!r.rows) { console.log(`${table}: nimic de schimbat`); continue; }
    const sample = await ex.execute(sql.raw(`SELECT ${cols.map((c) => `CASE WHEN ${differs(c)} THEN "${c}" END AS "${c}"`).join(", ")} FROM "${table}" WHERE ${where} LIMIT 3`));
    const samples = (sample as unknown as { rows: Record<string, string | null>[] }).rows.flatMap((x) => Object.values(x).filter((v): v is string => !!v)).slice(0, 3)
      .map((v) => `„${v.slice(0, 40)}”`);
    console.log(`${table}: ${r.rows} rânduri, ${r.fields} câmpuri. Exemple: ${samples.join(", ")}`);
    if (apply) await ex.execute(sql.raw(`UPDATE "${table}" SET ${cols.map((c) => `"${c}" = ${fix(c)}`).join(", ")} WHERE ${where}`));
  }
};
if (apply) await db.transaction(async (tx) => { await run(tx); }); else await run(db);
console.log(`${apply ? "Am schimbat" : "S-ar schimba (dry-run, nimic scris)"}: ${rowsTotal} rânduri, ${fieldsTotal} câmpuri.`);
process.exit(0);
