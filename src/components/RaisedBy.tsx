"use client";
import { useState, useTransition } from "react";
import { useTranslations } from "use-intl";
import { setRaisedBy } from "@/app/actions";
import type { PersonView } from "@/lib/tree-data";

export type StepCarer = { p: PersonView; via: PersonView };

/**
 * „Cine a crescut-o?”: pe lângă părinți, cine a crescut copilul. Întâi soțul sau soția unui părinte (mama sau tatăl vitreg),
 * apoi bunicii, frații părinților și oricine altcineva din arbore. Părinții adevărați rămân la „Părinți”, desenele nu se schimbă.
 */
export default function RaisedBy({ treeId, p, carers, step, family, others, onChanged }: {
  treeId: string; p: PersonView; carers: PersonView[]; step: StepCarer[]; family: PersonView[]; others: PersonView[]; onChanged: (msg: string) => void;
}) {
  const t = useTranslations("Relations");
  const [open, setOpen] = useState(false);
  const [pick, setPick] = useState("");
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const run = (carer: PersonView, on: boolean) => start(async () => {
    const r = await setRaisedBy(treeId, p.id, carer.id, on);
    if (r.error) return setErr(r.error);
    setOpen(false);
    setPick("");
    onChanged(t(on ? "raisedOn" : "raisedOff", { carer: carer.name, name: p.givenName, sex: p.sex }));
  });
  if (!open) return <button className="btn" onClick={() => { setOpen(true); setErr(null); }}>{t("raisedAsk", { sex: p.sex })}</button>;
  const already = new Set(carers.map((c) => c.id));
  const steps = step.filter((s) => !already.has(s.p.id));
  const fam = family.filter((x) => !already.has(x.id)), rest = others.filter((x) => !already.has(x.id));
  const chosen = [...fam, ...rest].find((x) => x.id === pick);
  const label = (x: PersonView) => `${x.name}${x.birthYear ? ` (${x.birthYear})` : ""}`;
  return (
    <div className="confirm" style={{ width: "100%" }}>
      <div style={{ marginBottom: 8 }}>
        {t("raisedIntro", { name: p.givenName, sex: p.sex })}
      </div>
      {steps.length > 0 && (
        <div className="actions" style={{ flexWrap: "wrap", marginTop: 0 }}>
          {steps.map((s) => (
            <button key={s.p.id} className="btn primary" disabled={pending} onClick={() => run(s.p, true)}>
              {t("raisedStep", { name: s.p.givenName, sex: s.p.sex, via: s.via.givenName })}
            </button>
          ))}
        </div>
      )}
      {(fam.length > 0 || rest.length > 0) && (
        <div className="actions" style={{ flexWrap: "wrap", alignItems: "center" }}>
          <select value={pick} onChange={(e) => setPick(e.target.value)} aria-label={t("raisedSomeoneLabel")} style={{ maxWidth: "100%" }}>
            <option value="">{steps.length ? t("raisedSomeoneElse") : t("raisedPick")}</option>
            {fam.length > 0 && <optgroup label={t("raisedFamily")}>{fam.map((x) => <option key={x.id} value={x.id}>{label(x)}</option>)}</optgroup>}
            {rest.length > 0 && <optgroup label={t("raisedOthers")}>{rest.map((x) => <option key={x.id} value={x.id}>{label(x)}</option>)}</optgroup>}
          </select>
          <button className="btn" disabled={pending || !chosen} onClick={() => chosen && run(chosen, true)}>{t("add")}</button>
        </div>
      )}
      {carers.length > 0 && (
        <div className="actions" style={{ flexWrap: "wrap" }}>
          {carers.map((c) => (
            <button key={c.id} className="btn" disabled={pending} onClick={() => run(c, false)}>{t("raisedRemove", { name: c.givenName, sex: c.sex })}</button>
          ))}
        </div>
      )}
      <div className="actions"><button className="btn" disabled={pending} onClick={() => setOpen(false)}>{t("cancel")}</button></div>
      {err && <p className="err">{err}</p>}
    </div>
  );
}
