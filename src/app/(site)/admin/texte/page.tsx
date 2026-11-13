import { db } from "@/db";
import { requireAdmin } from "@/lib/admin-access";
import Link from "next/link";
import { MAX_WORD } from "@/lib/cuvant-final";
import { DEFAULT_WORDS } from "@/lib/cuvant-final-limbi";
import { LANGUAGE_NAMES, LOCALES, isLocale, type Locale } from "@/i18n/locales";
import { de } from "@/lib/ro-words";
import { baseWordInfo, ownWordCounts } from "@/lib/texte";
import { AdminNav, day } from "@/components/admin/ui";
import BaseWordForm from "@/components/admin/BaseWordForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Texte · Admin" };

const arbori = (n: number) => (n === 1 ? "un arbore" : `${de(n)} arbori`);

/**
 * Textele site-ului pe care le schimbă adminul, pentru toți: deocamdată cuvântul de la finalul Călătoriei în timp, câte unul
 * pentru fiecare limbă (`?limba=de`). Fiecare cititor îl vede în limba lui; ce schimbi într-o limbă nu se schimbă în celelalte.
 */
export default async function AdminTexts({ searchParams }: { searchParams: Promise<{ limba?: string }> }) {
  await requireAdmin("/admin/texte");
  const { limba } = await searchParams;
  const locale: Locale = isLocale(limba) ? limba : "ro";
  const [word, ro, counts] = await Promise.all([baseWordInfo(db, locale), baseWordInfo(db, "ro"), ownWordCounts(db)]);
  const others = [
    counts.own ? `${arbori(counts.own)} ${counts.own === 1 ? "are textul lui" : "au textul lor"}` : null,
    counts.hidden ? `${arbori(counts.hidden)} ${counts.hidden === 1 ? "l-a ascuns" : "l-au ascuns"}` : null,
  ].filter(Boolean).join(" și ");

  return (
    <section className="stack">
      <AdminNav active="texte" />
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Cuvântul de la finalul Călătoriei în timp</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          Îl văd toți la capătul călătoriei, în arborii unde proprietarul n-a scris textul lui. Acum se vede{" "}
          {word.changed ? <>textul schimbat de tine pe {day(word.updatedAt?.toISOString())}</> : "textul inițial"}.
          {others && <> {others.charAt(0).toUpperCase() + others.slice(1)}: acolo nu se schimbă nimic.</>}
        </p>
        <nav className="chips" aria-label="Limba textului" style={{ display: "flex", flexWrap: "wrap", gap: 6, margin: "8px 0 12px" }}>
          {LOCALES.map((l) => (
            <Link key={l} href={l === "ro" ? "/admin/texte" : `/admin/texte?limba=${l}`} className={`chip${l === locale ? " on" : ""}`}
              aria-current={l === locale ? "page" : undefined} lang={l}>{LANGUAGE_NAMES[l]}</Link>
          ))}
        </nav>
        {locale !== "ro" && (
          <p className="muted" style={{ fontSize: 14 }}>
            Textul în {LANGUAGE_NAMES[locale]} îl văd cei care au ales limba aceasta. Pornește de la traducerea textului inițial, cu versetele din
            Biblia clasică a limbii.{ro.changed && " Textul în română l-ai schimbat: dacă vrei aceeași schimbare și aici, scrie-o și în această limbă."}
          </p>
        )}
        <BaseWordForm key={locale} locale={locale} text={word.text} original={DEFAULT_WORDS[locale]} changed={word.changed} max={MAX_WORD} />
      </div>
    </section>
  );
}
