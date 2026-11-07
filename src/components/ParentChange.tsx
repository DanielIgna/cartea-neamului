"use client";
import { useState, useTransition } from "react";
import { useTranslations } from "use-intl";
import { otherRelation, setParent } from "@/app/actions";
import type { PersonView } from "@/lib/tree-data";

/**
 * „Schimbă mama / tatăl”: pentru copiii dintr-o altă căsătorie. Propune soțiile (soții) celuilalt părinte,
 * o persoană nouă sau scoaterea legăturii greșite.
 */
export default function ParentChange({ treeId, p, current, candidates, role, onAddNew, onChanged }: {
  treeId: string; p: PersonView; current: PersonView | undefined; candidates: PersonView[]; role: "father" | "mother";
  onAddNew: () => void; onChanged: (msg: string) => void;
}) {
  const t = useTranslations("Relations");
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const run = (id: string | null, msg: string, then?: () => void) => start(async () => {
    const r = await setParent(treeId, p.id, role, id);
    if (r.error) return setErr(r.error);
    setOpen(false);
    if (then) then(); else onChanged(msg);
  });
  if (!open) return <button className="btn" onClick={() => setOpen(true)}>{t("changeParent", { role })}</button>;
  const others = candidates.filter((c) => c.id !== current?.id);
  return (
    <div className="confirm" style={{ width: "100%" }}>
      <div style={{ marginBottom: 8 }}>
        {current ? <>{t.rich("currentParent", { role, name: p.givenName, current: current.name, b: (c: React.ReactNode) => <b>{c}</b> })} </> : null}
        {t("whoIsParent", { role })}
      </div>
      <div className="actions" style={{ flexWrap: "wrap", marginTop: 0 }}>
        {others.map((c) => (
          <button key={c.id} className="btn" disabled={pending} onClick={() => run(c.id, t("nowParent", { person: c.name, role, name: p.givenName }))}>{c.name}{c.birthYear ? ` (${c.birthYear})` : ""}</button>
        ))}
        <button className="btn primary" disabled={pending} onClick={() => run(null, "", onAddNew)}>{t("addNewParent")}</button>
        <button className="btn" disabled={pending} title={t("otherRelationTitle")} onClick={() => start(async () => {
          const r = await otherRelation(treeId, p.id, role);
          if (r.error) return setErr(r.error);
          setOpen(false);
          onChanged(t("otherRelationDone", { name: p.givenName, role }));
        })}>{t("otherRelation")}</button>
        {current && <button className="btn" disabled={pending} onClick={() => run(null, t("unlinked", { name: current.name }))}>{t("unlink", { name: current.givenName })}</button>}
        <button className="btn" disabled={pending} onClick={() => setOpen(false)}>{t("cancel")}</button>
      </div>
      {others.length > 0 && <p className="muted" style={{ fontSize: 13, margin: "6px 0 0" }}>{t("proposedPartners", { role })}</p>}
      {err && <p className="err">{err}</p>}
    </div>
  );
}
