"use client";
import { useState, useTransition } from "react";
import { useTranslations } from "use-intl";
import { decideCheck } from "@/app/actions";
import type { PersonView } from "@/lib/tree-data";
import type { Check } from "@/lib/verificari";

const SHOWN = 4;

/**
 * „De verificat în arbore”: întrebări despre legăturile care par greșite sau neclare. Un răspuns bifat rămâne adevărul
 * arborelui (nu se mai întreabă, pentru nimeni) și schimbarea se face singură. Doar pentru proprietar și editori.
 */
export default function Checks({ treeId, checks, people, onDone, inline }: {
  treeId: string; checks: Check[]; people: Record<string, PersonView>; onDone: (msg: string) => void; inline?: boolean;
}) {
  const t = useTranslations("Checks");
  const [all, setAll] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  // Răspunsurile date acum dispar imediat, fără să aștepte reîncărcarea arborelui.
  const [answered, setAnswered] = useState<string[]>([]);
  const [pending, start] = useTransition();
  const list = checks.filter((c) => !answered.includes(c.key)).filter((c) => Object.values(c).every((v) => typeof v !== "string" || !/^[0-9a-f-]{36}$/i.test(v) || people[v]));
  if (!list.length) return null;
  const shown = all || inline ? list : list.slice(0, SHOWN);
  const nm = (id: string) => {
    const p = people[id];
    return p ? `${p.name}${p.birthYear ? ` (${t("born", { year: `${p.approx ? "~" : ""}${p.birthYear}` })})` : ""}` : "?";
  };
  const b = (c: React.ReactNode) => <b>{c}</b>;
  const answer = (c: Check, choice: string, changes: boolean) => {
    setErr(null);
    setBusy(c.key);
    start(async () => {
      const r = await decideCheck(treeId, c.key, choice);
      setBusy(null);
      if (r.error) setErr(r.error);
      else { setAnswered((a) => [...a, c.key]); onDone(changes ? t("done") : t("kept")); }
    });
  };
  const btn = (c: Check, choice: string, label: string, primary: boolean, changes: boolean) => (
    <button key={choice} className={`btn${primary ? " primary" : ""}`} disabled={pending} onClick={() => answer(c, choice, changes)}>{label}</button>
  );
  const item = (c: Check) => {
    switch (c.kind) {
      case "sotGeneratie":
        return (<>
          <div>{t.rich("sotQ", { who: nm(c.who), older: nm(c.older), namesake: nm(c.namesake), b })}</div>
          {c.kids.length > 0 && <div className="muted" style={{ marginTop: 4 }}>{t("sotKids", { kids: c.kids.map((k) => people[k]?.givenName ?? "?").join(", "), namesake: people[c.namesake]?.name ?? "" })}</div>}
          <div className="actions" style={{ marginTop: 6 }}>
            {btn(c, "muta", t("sotYes", { namesake: nm(c.namesake) }), true, true)}
            {btn(c, "corect", t("sotNo", { older: nm(c.older) }), false, false)}
          </div>
        </>);
      case "copilGeneratie": {
        const sex = people[c.who]?.sex ?? "U";
        return (<>
          <div>{t.rich("copilQ", { who: nm(c.who), older: nm(c.older), namesake: nm(c.namesake), sex, b })}</div>
          <div className="actions" style={{ marginTop: 6 }}>
            {btn(c, "muta", t("copilYes", { namesake: nm(c.namesake), sex }), true, true)}
            {btn(c, "corect", t("copilNo"), false, false)}
          </div>
        </>);
      }
      case "parinteLipsa": {
        const sex = people[c.child]?.sex ?? "U";
        return (<>
          <div>{t.rich("parinteQ", { child: nm(c.child), parent: nm(c.parent), role: c.role, sex, b })}</div>
          <div className="actions" style={{ marginTop: 6 }}>
            {c.options.map((o) => o.person ? btn(c, o.id, nm(o.person), false, true) : btn(c, o.id, t("parinteAlta", { role: c.role }), false, true))}
          </div>
        </>);
      }
      case "numeDeFata":
        return (<>
          <div>{t.rich("numeQ", { who: nm(c.who), father: nm(c.father), surname: people[c.who]?.surname ?? "", maiden: c.maiden, b })}</div>
          <div className="actions" style={{ marginTop: 6 }}>
            {btn(c, "da", t("numeYes", { maiden: c.maiden }), true, true)}
            {btn(c, "corect", t("numeNo"), false, false)}
          </div>
        </>);
    }
  };
  const body = (
    <>
      {shown.map((c) => (
        <div key={c.key} className="confirm" style={{ marginTop: 8, opacity: busy === c.key ? 0.6 : 1 }}>
          {item(c)}
          {busy === c.key && <div className="muted" style={{ marginTop: 4 }}>{t("saving")}</div>}
        </div>
      ))}
      {!inline && list.length > SHOWN && (
        <button className="linklike" style={{ marginTop: 8 }} onClick={() => setAll((a) => !a)}>{all ? t("less") : t("more", { count: list.length })}</button>
      )}
      {err && <p className="err">{err}</p>}
    </>
  );
  if (inline) return body;
  return (
    <div className="card">
      <div className="section-label" style={{ marginTop: 0 }}>{t("title")}</div>
      <p className="muted" style={{ marginTop: 0 }}>{t("lead")}</p>
      {body}
    </div>
  );
}
