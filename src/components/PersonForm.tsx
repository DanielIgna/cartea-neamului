"use client";
import { useActionState, useEffect, useRef, useState } from "react";
import { addRelative, updatePerson } from "@/app/actions";
import type { PersonView } from "@/lib/tree-data";

/** Sexul ghicit după prenumele românesc: cele terminate în „a” sunt de obicei feminine (cu câteva excepții bărbătești). */
const MALE_A = new Set(["toma", "luca", "mihăiță", "mihaita", "nicola", "costea", "sava", "ilia", "jean-luca", "andrea", "gheorghiță", "gheorghita", "ionuță", "ionuta", "costică", "costica", "nicușa", "nicusa", "mitrea", "petrea", "vasilică", "vasilica", "dumitra"]);
export function guessSex(given: string): "M" | "F" | "U" {
  const first = given.trim().toLowerCase().split(/[\s-]+/)[0] ?? "";
  if (first.length < 2) return "U";
  if (MALE_A.has(first)) return "M";
  return /[aă]$/.test(first) ? "F" : "M";
}

/** Țările din care vin cel mai des familiile din România; se poate scrie oricare alta. */
const COUNTRIES = ["România", "Republica Moldova", "Italia", "Spania", "Germania", "Franța", "Austria", "Ungaria", "Marea Britanie", "Irlanda", "Belgia", "Olanda",
  "Elveția", "Suedia", "Danemarca", "Norvegia", "Finlanda", "Portugalia", "Grecia", "Cipru", "Serbia", "Bulgaria", "Ucraina", "Cehia", "Polonia", "Israel",
  "Statele Unite ale Americii", "Canada", "Australia", "Noua Zeelandă", "Emiratele Arabe Unite"];

export type RelKind = "father" | "mother" | "child" | "spouse" | "sibling";
const TITLE: Record<RelKind, string> = { father: "Adaugă tatăl", mother: "Adaugă mama", child: "Adaugă un copil", spouse: "Adaugă soțul sau soția", sibling: "Adaugă un frate sau o soră" };

type Props =
  | { mode: "add"; kind: RelKind; treeId: string; anchor: PersonView; partners?: PersonView[]; shareWith?: PersonView[]; onDone: () => void; onCancel?: () => void }
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
  const [living, setLiving] = useState(p?.living ?? false);
  // Țara de naștere pornește de la a rudei de lângă care adaugi (copiii născuți în Italia ai unor părinți născuți în Italia…), altfel România.
  const countryHint = p?.birthCountry ?? anchor?.birthCountry ?? "România";
  // Cât timp nu alegi tu sexul, îl potrivim după prenume (Ana → femeie, Ion → bărbat).
  const sexRef = useRef<HTMLSelectElement>(null);
  const sexTouched = useRef(props.mode === "edit");
  return (
    <form action={action} className="form" style={{ marginTop: 10 }}>
      <div className="section-label" style={{ marginTop: 0 }}>{p ? `Editează fișa lui ${p.givenName}` : `${TITLE[kind!]} lui ${anchor!.givenName}`}</div>
      <input type="hidden" name="treeId" value={props.treeId} />
      {p ? <input type="hidden" name="personId" value={p.id} /> : <><input type="hidden" name="anchorId" value={anchor!.id} /><input type="hidden" name="kind" value={kind!} /></>}
      <div className="row">
        <label>Prenume<input name="given" required defaultValue={p?.givenName}
          onChange={(e) => { if (!sexTouched.current && sexRef.current && (kind === "child" || kind === "sibling")) sexRef.current.value = guessSex(e.target.value); }} /></label>
        <label>Nume<input name="surname" defaultValue={defaultSurname} /></label>
      </div>
      <div className="row">
        <label>Nume de fată (dacă e cazul)<input name="birthSurname" defaultValue={p?.birthSurname ?? ""} /></label>
        {askSex && (
          <label>Sex
            <select name="sex" ref={sexRef} onChange={() => { sexTouched.current = true; }} defaultValue={p?.sex ?? (kind === "spouse" ? (anchor!.sex === "M" ? "F" : anchor!.sex === "F" ? "M" : "U") : "U")}>
              <option value="M">bărbat</option><option value="F">femeie</option><option value="U">nu știu</option>
            </select>
          </label>
        )}
      </div>
      <datalist id="tari">{COUNTRIES.map((c) => <option key={c} value={c} />)}</datalist>
      <div className="row">
        <label>Născut(ă)<input name="birth" placeholder="1902 sau cca. 1870" defaultValue={p?.birthText ?? ""} /></label>
        <label>Locul nașterii<input name="birthPlace" placeholder="sat, comună sau oraș" defaultValue={p?.birthPlace ?? ""} /></label>
        <label>Țara<input name="birthCountry" list="tari" defaultValue={countryHint} /></label>
      </div>
      <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input type="checkbox" name="living" checked={living} onChange={(e) => setLiving(e.target.checked)} /> Persoana e în viață (rămâne privată în arbore)
      </label>
      {living ? (
        <div className="row">
          <label>Locuiește acum în<input name="residencePlace" placeholder="ex. Huedin, Cluj-Napoca, Torino" defaultValue={p?.residencePlace ?? ""} /></label>
          <label>Țara<input name="residenceCountry" list="tari" defaultValue={p?.residenceCountry ?? "România"} /></label>
        </div>
      ) : (
        <div className="row">
          <label>Decedat(ă)<input name="death" placeholder="1980" defaultValue={p?.deathText ?? ""} /></label>
          <label>Locul decesului<input name="deathPlace" defaultValue={p?.deathPlace ?? ""} /></label>
          <label>Țara<input name="deathCountry" list="tari" defaultValue={p?.deathCountry ?? "România"} /></label>
        </div>
      )}
      <label>Ocupație<input name="occupation" defaultValue={p?.occupation ?? ""} placeholder="agricultor, învățătoare, tâmplar…" /></label>
      {kind === "child" && props.mode === "add" && !!props.partners?.length && (
        <label>Celălalt părinte
          <select name="otherParentId" defaultValue={props.partners[0].id}>
            {props.partners.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
            <option value="">nu știu / altcineva</option>
          </select>
        </label>
      )}
      {props.mode === "add" && !!props.shareWith?.length && (
        <fieldset className="share">
          <legend>{kind === "spouse" ? `E și părintele copiilor lui ${anchor!.givenName}?` : `E ${kind === "father" ? "tatăl" : "mama"} și pentru frații lui ${anchor!.givenName}?`}</legend>
          {props.shareWith.map((x) => (
            <label key={x.id}><input type="checkbox" name="also" value={x.id} defaultChecked /> {x.name}{x.birthYear ? ` (${x.birthYear})` : ""}</label>
          ))}
          <small className="muted">Debifează pe cei din altă căsătorie.</small>
        </fieldset>
      )}
      <label>Ce se știe despre {who}
        <textarea name="biography" defaultValue={p?.biography ?? ""} placeholder="Câteva rânduri: cum era, ce făcea, povești din familie, unde a trăit…" />
      </label>
      <label>Note suplimentare
        <textarea name="notes" defaultValue={p?.notes ?? ""} placeholder="Surse (registre, acte), lucruri de verificat, cine a povestit…" style={{ minHeight: 60 }} />
      </label>
      {state && "error" in state && state.error && <p className="err">{state.error}</p>}
      <div className="actions">
        <button className="btn primary" disabled={pending}>{pending ? "Se salvează…" : p ? "Salvează" : "Adaugă"}</button>
        {props.onCancel && <button type="button" className="btn" onClick={props.onCancel}>Renunță</button>}
      </div>
    </form>
  );
}
