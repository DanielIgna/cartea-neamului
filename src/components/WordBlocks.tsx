import { parseWord } from "@/lib/cuvant-final";
import type { Locale } from "@/i18n/locales";
import "./time-journey.css";

/** Ghilimelele obișnuite în fiecare limbă, pentru versete: „…”, “…”, « … », „…“. */
const QUOTES: Record<Locale, [string, string]> = {
  ro: ["„", "”"], "en-GB": ["“", "”"], "en-US": ["“", "”"], fr: ["« ", " »"], es: ["«", "»"], nl: ["‘", "’"], de: ["„", "“"], it: ["«", "»"], hu: ["„", "”"], he: ["“", "”"],
};
export const quoted = (text: string, locale: Locale = "ro") => {
  const [a, b] = QUOTES[locale] ?? QUOTES.ro;
  return `${a}${text.replace(/^[„"“«‘]\s*|\s*[”"“»’]$/g, "")}${b}`;
};

/** Cuvântul de la finalul călătoriei, cu titluri, versete și paragrafe: în călătorie și în previzualizarea din panou. */
export default function WordBlocks({ text, locale = "ro" }: { text: string; locale?: Locale }) {
  return (
    <>
      {parseWord(text).map((b, i) =>
        b.kind === "title" ? <h2 key={i}>{b.text}</h2>
          : b.kind === "verse" ? <blockquote key={i}><p>{quoted(b.text, locale)}</p>{b.ref && <cite>{b.ref}</cite>}</blockquote>
          : <p key={i}>{b.text}</p>)}
    </>
  );
}
