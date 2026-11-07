"use client";
import { useTranslations } from "use-intl";
import type { BookOptions } from "@/lib/book";
import { LANGUAGE_NAMES, LOCALES, type Locale } from "@/i18n/locales";

/**
 * Alegerile cărții: de la cine pornește, în ce limbă e scrisă, cum apar cei în viață, cu sau fără poze, A4 sau A5. Fiecare
 * schimbare reîncarcă pagina cu alegerea nouă în adresă (cartea se așază mereu într-o pagină proaspătă), iar adresa se
 * poate păstra sau trimite. Limba cărții se pune în adresă doar când diferă de limba cititorului: așa, cartea unui nepot
 * din Germania iese în germană, iar el o poate face și în română, pentru bunici.
 */
export default function BookOptionsForm({ treeId, center, options, people, bookLocale, uiLocale }: {
  treeId: string; center: string | null; options: BookOptions; people: { id: string; label: string }[]; bookLocale: Locale; uiLocale: Locale;
}) {
  const t = useTranslations("BookUi.options");
  const go = (change: Partial<Record<"p" | "limba" | "vii" | "poze" | "format", string>>) => {
    const now = { p: center ?? "", limba: bookLocale, vii: options.living, poze: options.photos ? "da" : "nu", format: options.format, ...change };
    const q = new URLSearchParams();
    if (now.p) q.set("p", now.p);
    if (now.limba !== uiLocale) q.set("limba", now.limba);
    if (now.vii !== "nume") q.set("vii", now.vii);
    if (now.poze === "nu") q.set("poze", "nu");
    if (now.format !== "A4") q.set("format", now.format);
    window.location.assign(`/arbore/${treeId}/carte${q.size ? `?${q}` : ""}`);
  };
  return (
    <div className="book-options">
      <label>{t("startFrom")}
        <select value={center ?? ""} onChange={(e) => go({ p: e.target.value })}>
          {people.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
        </select>
      </label>
      <label>{t("language")}
        <select value={bookLocale} onChange={(e) => go({ limba: e.target.value })}>
          {LOCALES.map((l) => <option key={l} value={l} lang={l}>{LANGUAGE_NAMES[l]}</option>)}
        </select>
      </label>
      <fieldset>
        <legend>{t("living")}</legend>
        {([["nume", t("livingNames")], ["tot", t("livingAll")], ["ascunsi", t("livingHidden")]] as const).map(([v, l]) => (
          <label key={v} className="inline"><input type="radio" name="vii" checked={options.living === v} onChange={() => go({ vii: v })} />{l}</label>
        ))}
      </fieldset>
      <fieldset>
        <legend>{t("page")}</legend>
        {(["A4", "A5"] as const).map((f) => (
          <label key={f} className="inline"><input type="radio" name="format" checked={options.format === f} onChange={() => go({ format: f })} />{f}</label>
        ))}
        <label className="inline"><input type="checkbox" checked={options.photos} onChange={(e) => go({ poze: e.target.checked ? "da" : "nu" })} />{t("photos")}</label>
      </fieldset>
    </div>
  );
}
