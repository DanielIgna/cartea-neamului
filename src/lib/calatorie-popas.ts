/**
 * Unde citești Evanghelia după Ioan, gratuit și fără cont, pe bible.com, în traducerea obișnuită a fiecărei limbi:
 * Cornilescu, King James, Segond 1910, Reina-Valera 1909, Statenvertaling, Luther 1912, Nuova Riveduta, Károli.
 * (Textele popasului din anii comunismului sunt în texte, la `Journey.regime`.)
 */
import type { Locale } from "@/i18n/locales";

export const READ_JOHN: Record<Locale, string> = {
  ro: "https://www.bible.com/ro/bible/191/JHN.1.VDC",
  "en-GB": "https://www.bible.com/bible/1/JHN.1.KJV",
  "en-US": "https://www.bible.com/bible/1/JHN.1.KJV",
  fr: "https://www.bible.com/fr/bible/93/JHN.1.LSG",
  es: "https://www.bible.com/es/bible/1718/JHN.1.RVR09",
  nl: "https://www.bible.com/nl/bible/165/JHN.1.STV",
  de: "https://www.bible.com/de/bible/51/JHN.1.DELUT",
  it: "https://www.bible.com/it/bible/122/JHN.1.NR06",
  hu: "https://www.bible.com/hu/bible/84/JHN.1.HUNK",
};
