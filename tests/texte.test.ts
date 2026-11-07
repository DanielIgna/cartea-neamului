import { describe, it, expect, beforeAll } from "vitest";
import { createDb, type Db } from "@/db";
import { runMigrations } from "@/db/migrate";
import { tree, user } from "@/db/schema";
import { DEFAULT_WORD, MAX_WORD, wordFor } from "@/lib/cuvant-final";
import { baseWord, baseWordInfo, ownWordCounts, saveBaseWord } from "@/lib/texte";

describe("textele schimbate din panou", () => {
  let db: Db;
  beforeAll(async () => {
    db = createDb();
    await runMigrations(db);
    await db.insert(user).values({ id: "admin", name: "Admin", email: "admin@test.ro" });
  });

  it("fără nimic salvat, cuvântul de la final e cel inițial", async () => {
    expect(await baseWordInfo(db)).toEqual({ text: DEFAULT_WORD, changed: false, updatedAt: null });
  });

  it("textul din panou ajunge la toți arborii fără textul lor; ce a scris sau a ascuns proprietarul rămâne", async () => {
    const at = new Date("2026-11-07T07:00:00Z");
    await saveBaseWord(db, "## Spița lui Isus Hristos\r\nÎn spița Lui intri prin credință.\r\n", "admin", at);
    const info = await baseWordInfo(db);
    expect(info).toEqual({ text: "## Spița lui Isus Hristos\nÎn spița Lui intri prin credință.", changed: true, updatedAt: at });
    const base = await baseWord(db);
    expect(wordFor(null, base)).toBe(base);
    expect(wordFor("Textul meu", base)).toBe("Textul meu");
    expect(wordFor("", base)).toBeNull();
  });

  it("„Pune înapoi textul inițial”, un text gol sau chiar textul inițial șterg schimbarea", async () => {
    await saveBaseWord(db, null, "admin");
    expect((await baseWordInfo(db)).changed).toBe(false);
    await saveBaseWord(db, "Altceva", "admin");
    await saveBaseWord(db, `  ${DEFAULT_WORD}\n`, "admin");
    expect((await baseWordInfo(db)).changed).toBe(false);
    await expect(saveBaseWord(db, "x".repeat(MAX_WORD + 1), "admin")).rejects.toThrow();
  });

  it("numără arborii care au textul lor sau l-au ascuns", async () => {
    await db.insert(tree).values([
      { name: "De bază" }, { name: "Al lui", journeyWord: "Cuvântul meu" }, { name: "Ascuns", journeyWord: "" }, { name: "Doar spații", journeyWord: "  " },
    ]);
    expect(await ownWordCounts(db)).toEqual({ own: 1, hidden: 2 });
  });
});
