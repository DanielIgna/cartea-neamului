import { requireUser } from "@/lib/access";
import FamilyStart from "@/components/FamilyStart";
import GedcomImport from "@/components/GedcomImport";

export const dynamic = "force-dynamic";

/** Arbore nou: pornit pas cu pas (tu, părinții, bunicii) sau adus dintr-un fișier GEDCOM. */
export default async function NewTreePage() {
  await requireUser("/arbore-nou");
  return (
    <div className="layout">
      <section className="card start-card">
        <h2>Pornește un arbore nou</h2>
        <p className="muted">Patru pași scurți: tu, părinții, bunicii, iar la sfârșit arborele e gata, cu toate legăturile. Ce nu știi lași gol.</p>
        <FamilyStart />
      </section>
      <aside className="card"><GedcomImport /></aside>
    </div>
  );
}
