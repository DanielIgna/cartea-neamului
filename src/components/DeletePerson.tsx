"use client";
import { useState, useTransition } from "react";
import { useTranslations } from "use-intl";
import { deletePerson } from "@/app/actions";
import type { PersonView } from "@/lib/tree-data";

/** Ștergerea unei persoane adăugate din greșeală, cu confirmare în pagină. */
export default function DeletePerson({ treeId, p, onDeleted }: { treeId: string; p: PersonView; onDeleted: () => void }) {
  const t = useTranslations("Relations");
  const [ask, setAsk] = useState(false);
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  if (!ask) return <button className="btn" onClick={() => setAsk(true)}>{t("delete")}</button>;
  return (
    <div className="confirm" style={{ width: "100%" }}>
      {t.rich("deleteAsk", { name: p.name, sex: p.sex, b: (c: React.ReactNode) => <b>{c}</b> })}
      <div className="actions">
        <button className="btn danger" disabled={pending} onClick={() => start(async () => { const r = await deletePerson(treeId, p.id); if (r.error) setErr(r.error); else onDeleted(); })}>
          {pending ? t("deleting") : t("yesDelete")}
        </button>
        <button className="btn" disabled={pending} onClick={() => setAsk(false)}>{t("cancel")}</button>
      </div>
      {err && <p className="err">{err}</p>}
    </div>
  );
}
