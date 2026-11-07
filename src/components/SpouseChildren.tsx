"use client";
import { useState, useTransition } from "react";
import { useTranslations } from "use-intl";
import { linkChildren, otherRelation } from "@/app/actions";
import type { PersonView } from "@/lib/tree-data";

/**
 * Propunere: copiii soțului/soției care au trecut un singur părinte. Pentru fiecare: „Da, e și al lui/ei”
 * sau „Nu, e din altă relație” (primește un părinte fără nume, discret, ca propunerea să nu mai apară).
 */
export default function SpouseChildren({ treeId, p, spouse, kids, onDone }: { treeId: string; p: PersonView; spouse: PersonView; kids: PersonView[]; onDone: (msg: string) => void }) {
  const t = useTranslations("Relations");
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const asRole: "father" | "mother" = p.sex === "M" || (p.sex === "U" && spouse.sex === "F") ? "father" : "mother";
  const yes = (k: PersonView) => start(async () => {
    const r = await linkChildren(treeId, p.id, [k.id]);
    if (r.error) setErr(r.error); else onDone(t("nowParentOf", { name: p.givenName, sex: p.sex, child: k.givenName }));
  });
  const no = (k: PersonView) => start(async () => {
    const r = await otherRelation(treeId, k.id, asRole);
    if (r.error) setErr(r.error); else onDone(t("kidOtherRelation", { child: k.givenName, spouse: spouse.givenName }));
  });
  return (
    <div className="confirm" style={{ marginTop: 10 }}>
      {t.rich("spouseKidsAsk", { name: p.givenName, sex: p.sex, spouse: spouse.givenName, count: kids.length, b: (c: React.ReactNode) => <b>{c}</b> })}
      {kids.map((k) => (
        <div key={k.id} className="actions" style={{ marginTop: 6, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ minWidth: 150 }}>{k.name}{k.birthYear ? ` (${k.birthYear})` : ""}</span>
          <button className="btn primary" disabled={pending} onClick={() => yes(k)}>{t("yesTheirs", { sex: p.sex })}</button>
          <button className="btn" disabled={pending} onClick={() => no(k)}>{t("noOtherRelation")}</button>
        </div>
      ))}
      {err && <p className="err">{err}</p>}
    </div>
  );
}
