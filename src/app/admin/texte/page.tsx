import { db } from "@/db";
import { requireAdmin } from "@/lib/admin-access";
import { DEFAULT_WORD, MAX_WORD } from "@/lib/cuvant-final";
import { de } from "@/lib/ro-words";
import { baseWordInfo, ownWordCounts } from "@/lib/texte";
import { AdminNav, day } from "@/components/admin/ui";
import BaseWordForm from "@/components/admin/BaseWordForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Texte · Admin" };

const arbori = (n: number) => (n === 1 ? "un arbore" : `${de(n)} arbori`);

/** Textele site-ului pe care le schimbă adminul, pentru toți: deocamdată cuvântul de la finalul Călătoriei în timp. */
export default async function AdminTexts() {
  await requireAdmin("/admin/texte");
  const [word, counts] = await Promise.all([baseWordInfo(db), ownWordCounts(db)]);
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
        <BaseWordForm text={word.text} original={DEFAULT_WORD} changed={word.changed} max={MAX_WORD} />
      </div>
    </section>
  );
}
