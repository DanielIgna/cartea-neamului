import { requireUser } from "@/lib/access";
import FamilyStart from "@/components/FamilyStart";
import GedcomImport from "@/components/GedcomImport";
import { getT } from "@/i18n/server";

export const dynamic = "force-dynamic";

/** Arbore nou: pornit pas cu pas (tu, părinții, bunicii) sau adus dintr-un fișier GEDCOM. */
export default async function NewTreePage() {
  await requireUser("/arbore-nou");
  const t = await getT("Home");
  return (
    <div className="layout">
      <section className="card start-card">
        <h2>{t("startAnotherTitle")}</h2>
        <p className="muted">{t("startText")}</p>
        <FamilyStart />
      </section>
      <aside className="card"><GedcomImport /></aside>
    </div>
  );
}
