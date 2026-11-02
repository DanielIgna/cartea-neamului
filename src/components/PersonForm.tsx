"use client";
import { useActionState, useEffect } from "react";
import { addRelative, updatePerson } from "@/app/actions";
import type { PersonView } from "@/lib/tree-data";

export type RelKind = "father" | "mother" | "child" | "spouse" | "sibling";
const TITLE: Record<RelKind, string> = { father: "Adaugă tatăl", mother: "Adaugă mama", child: "Adaugă un copil", spouse: "Adaugă soțul sau soția", sibling: "Adaugă un frate sau o soră" };

type Props =
  | { mode: "add"; kind: RelKind; treeId: string; anchor: PersonView; partners?: PersonView[]; onDone: () => void; onCancel?: () => void }
  | { mode: "edit"; treeId: string; person: PersonView; onDone: () => void; onCancel?: () => void };

/** Un singur formular pentru „adaugă o rudă” și „editează fișa”: date, locuri, ce se știe despre persoană și note. */
export default function PersonForm(props: Props) {
  const [state, action, pending] = useActionState(props.mode === "add" ? addRelative : updatePerson, null);
  useEffect(() => { if (state && "ok" in state && state.ok) props.onDone(); }, [state]);
  const p = props.mode === "edit" ? props.person : null;
  const kind = props.mode === "add" ? props.kind : null;
  const askSex = kind === "child" || kind === "spouse" || kind === "sibling" || props.mode === "edit";
  const anchor = props.mode === "add" ? props.anchor : null;
  const defaultSurname = p ? p.surname : kind === "sibling" ? anchor!.birthSurname || anchor!.surname : kind === "father" || kind === "child" ? anchor!.surname : "";
  const who = p ? p.givenName : "persoana";
  return (
    <form action={action} className="form" style={{ marginTop: 10 }}>
      <div className="section-label" style={{ marginTop: 0 }}>{p ? `Editează fișa lui ${p.givenName}` : `${TITLE[kind!]} lui ${anchor!.givenName}`}</div>
      <input type="hidden" name="treeId" value={props.treeId} />
      {p ? <input type="hidden" name="personId" value={p.id} /> : <><input type="hidden" name="anchorId" value={anchor!.id} /><input type="hidden" name="kind" value={kind!} /></>}
      <div className="row">
        <label>Prenume<input name="given" required defaultValue={p?.givenName} /></label>
        <label>Nume<input name="surname" defaultValue={defaultSurname} /></label>
      </div>
      <div className="row">
        <label>Nume de fată (dacă e cazul)<input name="birthSurname" defaultValue={p?.birthSurname ?? ""} /></label>
        {askSex && (
          <label>Sex
            <select name="sex" defaultValue={p?.sex ?? (kind === "spouse" ? (anchor!.sex === "M" ? "F" : anchor!.sex === "F" ? "M" : "U") : "U")}>
              <option value="M">bărbat</option><option value="F">femeie</option><option value="U">nu știu</option>
            </select>
          </label>
        )}
      </div>
      <div className="row">
        <label>Născut(ă)<input name="birth" placeholder="1902 sau cca. 1870" defaultValue={p?.birthText ?? ""} /></label>
        <label>Locul nașterii<input name="birthPlace" defaultValue={p?.birthPlace ?? ""} /></label>
      </div>
      <div className="row">
        <label>Decedat(ă)<input name="death" placeholder="1980" defaultValue={p?.deathText ?? ""} /></label>
        <label>Locul decesului<input name="deathPlace" defaultValue={p?.deathPlace ?? ""} /></label>
      </div>
      <label>Ocupație<input name="occupation" defaultValue={p?.occupation ?? ""} placeholder="agricultor, învățătoare, tâmplar…" /></label>
      {kind === "child" && props.mode === "add" && !!props.partners?.length && (
        <label>Celălalt părinte
          <select name="otherParentId" defaultValue={props.partners[0].id}>
            {props.partners.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
            <option value="">nu știu / altcineva</option>
          </select>
        </label>
      )}
      <label>Ce se știe despre {who}
        <textarea name="biography" defaultValue={p?.biography ?? ""} placeholder="Câteva rânduri: cum era, ce făcea, povești din familie, unde a trăit…" />
      </label>
      <label>Note suplimentare
        <textarea name="notes" defaultValue={p?.notes ?? ""} placeholder="Surse (registre, acte), lucruri de verificat, cine a povestit…" style={{ minHeight: 60 }} />
      </label>
      <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input type="checkbox" name="living" defaultChecked={p?.living ?? false} /> Persoana e în viață (rămâne privată în arbore)
      </label>
      {state && "error" in state && state.error && <p className="err">{state.error}</p>}
      <div className="actions">
        <button className="btn primary" disabled={pending}>{pending ? "Se salvează…" : p ? "Salvează" : "Adaugă"}</button>
        {props.onCancel && <button type="button" className="btn" onClick={props.onCancel}>Renunță</button>}
      </div>
    </form>
  );
}
