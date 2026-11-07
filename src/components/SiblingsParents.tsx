"use client";
import { useState, useTransition } from "react";
import { useTranslations } from "use-intl";
import { otherRelation, replacePlaceholder, setParent } from "@/app/actions";
import type { PersonView } from "@/lib/tree-data";

/**
 * Propunere: frații au un părinte pe care persoana nu-l are (ea a rămas fără mamă, ori cu „Tată necunoscut” pus automat când
 * i s-au adăugat frații), așa că neamul de pe partea aceea nu ajunge la ea. „Da” o leagă de același părinte: un „Tată necunoscut”
 * se înlocuiește cu el pentru toți copiii lui (`alsoFor`). „Nu” îi pune un loc gol discret (apare doar în fișa ei), ca propunerea să nu mai apară.
 */
export default function SiblingsParents({ treeId, p, role, parent, current, alsoFor = [], onDone }: {
  treeId: string; p: PersonView; role: "father" | "mother"; parent: PersonView; current?: PersonView; alsoFor?: PersonView[]; onDone: (msg: string) => void;
}) {
  const t = useTranslations("Relations");
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const names = alsoFor.map((x) => x.givenName).join(", ");
  const v = { role, sex: p.sex, name: p.givenName, parent: parent.name, names, current: current?.givenName ?? "", also: names ? "yes" : "no", replaced: current ? "yes" : "no" };
  const yes = () => start(async () => {
    const r = current ? await replacePlaceholder(treeId, current.id, parent.id) : await setParent(treeId, p.id, role, parent.id);
    if (r.error) return setErr(r.error);
    onDone(t("siblingsLinked", v));
  });
  const no = () => start(async () => {
    const r = await otherRelation(treeId, p.id, role);
    if (r.error) setErr(r.error); else onDone(t("siblingsOther", v));
  });
  return (
    <div className="confirm" style={{ marginTop: 10 }}>
      {t.rich("siblingsAsk", { ...v, b: (c: React.ReactNode) => <b>{c}</b> })}
      <div className="actions" style={{ marginTop: 6, flexWrap: "wrap" }}>
        <button className="btn primary" disabled={pending} onClick={yes}>{pending ? t("linking") : t("siblingsYes", v)}</button>
        <button className="btn" disabled={pending} onClick={no}>{t("siblingsNo", v)}</button>
      </div>
      {err && <p className="err">{err}</p>}
    </div>
  );
}
