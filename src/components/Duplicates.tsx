"use client";
import { useEffect, useState, useTransition } from "react";
import { useTranslations } from "use-intl";
import { mergePeople } from "@/app/actions";
import type { PersonView } from "@/lib/tree-data";
import type { Duplicate } from "@/lib/family";

const KEY = (treeId: string) => `cn-nu-sunt-dubluri-${treeId}`;
const pairKey = (d: Duplicate) => [d.keep, d.drop].sort().join("|");
function readDismissed(treeId: string): string[] {
  try { return JSON.parse(localStorage.getItem(KEY(treeId)) ?? "[]"); } catch { return []; }
}

/** Fișe care par aceeași persoană trecută de două ori: le unim (cu o confirmare) sau spunem că nu e aceeași persoană. */
export default function Duplicates({ treeId, pairs, people, kids, onDone, inline }: {
  treeId: string; pairs: Duplicate[]; people: Record<string, PersonView>; kids: (id: string) => number; onDone: (msg: string, keptId: string) => void; inline?: boolean;
}) {
  const [dismissed, setDismissed] = useState<string[]>([]);
  useEffect(() => setDismissed(readDismissed(treeId)), [treeId]);
  const [asking, setAsking] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const t = useTranslations("Duplicates");
  const shown = pairs.filter((d) => !dismissed.includes(pairKey(d)) && people[d.keep] && people[d.drop]);
  if (!shown.length) return null;
  const label = (id: string) => { const n = kids(id); return `${people[id].name}${people[id].birthYear ? `, ${people[id].birthYear}` : ""}${n ? ` (${t("kids", { count: n })})` : ""}`; };
  const notSame = (d: Duplicate) => {
    const next = [...dismissed, pairKey(d)];
    setDismissed(next);
    try { localStorage.setItem(KEY(treeId), JSON.stringify(next)); } catch { /* fără memorie locală: apare din nou data viitoare */ }
  };
  const body = (
    <>
      {shown.map((d) => (
        <div key={pairKey(d)} className="confirm" style={{ marginTop: 8 }}>
          {t.rich("same", { first: label(d.keep), second: label(d.drop), b: (c) => <b>{c}</b> })}
          {d.via && people[d.via] ? t("via", { name: people[d.via].name }) : null}
          {d.born && people[d.born] ? t("childOf", { sex: people[d.drop].sex, parent: people[d.born].name }) : null}.
          {asking === pairKey(d) ? (
            <>
              <div style={{ margin: "6px 0" }}>{t("ask", { name: people[d.keep].name, parents: d.born ? "yes" : "no" })}</div>
              <div className="actions" style={{ marginTop: 0 }}>
                <button className="btn primary" disabled={pending} onClick={() => start(async () => {
                  const r = await mergePeople(treeId, d.keep, d.drop);
                  if (r.error) setErr(r.error); else { setAsking(null); onDone(r.message ?? t("merged"), d.keep); }
                })}>{pending ? t("merging") : t("yesMerge")}</button>
                <button className="btn" disabled={pending} onClick={() => setAsking(null)}>{t("cancel")}</button>
              </div>
            </>
          ) : (
            <div className="actions" style={{ marginTop: 6 }}>
              <button className="btn primary" onClick={() => { setErr(null); setAsking(pairKey(d)); }}>{t("mergeBoth")}</button>
              <button className="btn" onClick={() => notSame(d)}>{t("notSame")}</button>
            </div>
          )}
        </div>
      ))}
      {err && <p className="err">{err}</p>}
    </>
  );
  if (inline) return body;
  return (
    <div className="card">
      <div className="section-label" style={{ marginTop: 0 }}>{t("title")}</div>
      {body}
    </div>
  );
}

/** Unire de mână: alegi fișa dublă a acestei persoane (scrisă poate altfel, „Ana” și „Anuța”), iar tot ce are trece aici. */
export function MergeWith({ treeId, p, candidates, onDone }: { treeId: string; p: PersonView; candidates: PersonView[]; onDone: (msg: string, keptId: string) => void }) {
  const [open, setOpen] = useState(false);
  const [other, setOther] = useState("");
  const [sure, setSure] = useState(false);
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const t = useTranslations("Duplicates");
  if (!open) return <button className="btn" onClick={() => setOpen(true)} title={t("mergeWithTitle")}>{t("mergeWith")}</button>;
  const chosen = candidates.find((c) => c.id === other);
  return (
    <div className="confirm" style={{ width: "100%" }}>
      <label>{t("which", { name: p.givenName, sex: p.sex })}
        <select value={other} onChange={(e) => { setOther(e.target.value); setSure(false); }}>
          <option value="">{t("choose")}</option>
          {candidates.map((c) => <option key={c.id} value={c.id}>{c.name}{c.birthYear ? `, ${c.birthYear}` : ""}</option>)}
        </select>
      </label>
      {chosen && <p style={{ margin: "6px 0" }}>{t("moveAll", { other: chosen.name, name: p.name })}</p>}
      <div className="actions" style={{ marginTop: 6 }}>
        {chosen && !sure && <button className="btn primary" onClick={() => setSure(true)}>{t("merge")}</button>}
        {chosen && sure && <button className="btn primary" disabled={pending} onClick={() => start(async () => {
          const r = await mergePeople(treeId, p.id, chosen.id);
          if (r.error) setErr(r.error); else { setOpen(false); onDone(r.message ?? t("merged"), p.id); }
        })}>{pending ? t("merging") : t("yesSame")}</button>}
        <button className="btn" disabled={pending} onClick={() => { setOpen(false); setOther(""); setSure(false); }}>{t("cancel")}</button>
      </div>
      {err && <p className="err">{err}</p>}
    </div>
  );
}
