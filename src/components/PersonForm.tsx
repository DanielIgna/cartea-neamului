"use client";
import { useActionState, useEffect, useRef, useState } from "react";
import { addRelative, updatePerson } from "@/app/actions";
import type { PersonView } from "@/lib/tree-data";
import { sameLooking } from "@/lib/family";

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
  | {
      mode: "add"; kind: RelKind; treeId: string; anchor: PersonView; partners?: PersonView[]; shareWith?: PersonView[]; discreet?: boolean;
      /** Oamenii deja trecuți care ar putea fi chiar persoana pe care o adaugi (ca să nu apară de două ori) și, la mamă/tată, cum o legi pe cea existentă. */
      lookalikes?: PersonView[]; useExisting?: (x: PersonView) => Promise<string | null>;
      onDone: (msg?: string) => void; onCancel?: () => void;
    }
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
  // Pe măsură ce scrii numele, verificăm dacă persoana nu e deja în arbore lângă aceeași rudă (de pildă bunica trecută a doua oară).
  const [typed, setTyped] = useState({ given: "", surname: defaultSurname });
  const [linking, setLinking] = useState(false);
  const [linkErr, setLinkErr] = useState<string | null>(null);
  const matches = props.mode === "add" && typed.given.trim().length > 1
    ? (props.lookalikes ?? []).filter((x) => sameLooking({ id: "", givenName: typed.given, surname: typed.surname, birthSurname: null, sex: x.sex, birthYear: null }, x))
    : [];
  return (
    <form action={action} className="form" style={{ marginTop: 10 }}>
      <div className="section-label" style={{ marginTop: 0 }}>{p ? `Editează fișa lui ${p.givenName}` : `${TITLE[kind!]} lui ${anchor!.givenName}`}</div>
      <input type="hidden" name="treeId" value={props.treeId} />
      {p ? <input type="hidden" name="personId" value={p.id} /> : <><input type="hidden" name="anchorId" value={anchor!.id} /><input type="hidden" name="kind" value={kind!} /></>}
      <div className="row">
        <label>Prenume<input name="given" required defaultValue={p?.givenName}
          onChange={(e) => {
            setTyped((t) => ({ ...t, given: e.target.value }));
            if (!sexTouched.current && sexRef.current && (kind === "child" || kind === "sibling")) sexRef.current.value = guessSex(e.target.value);
          }} /></label>
        <label>Nume<input name="surname" defaultValue={defaultSurname} onChange={(e) => setTyped((t) => ({ ...t, surname: e.target.value }))} /></label>
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
        <label>Născut(ă)<input name="birth" placeholder="12.03.1985, 1902 sau cca. 1870" defaultValue={p?.birthText ?? ""} /></label>
        <label>Locul nașterii<input name="birthPlace" placeholder="sat, comună sau oraș" defaultValue={p?.birthPlace ?? ""} /></label>
        <label>Țara<input name="birthCountry" list="tari" defaultValue={countryHint} /></label>
      </div>
      <small className="muted" style={{ marginTop: -6 }}>La naștere și la deces scrie ziua, luna și anul, dacă le știi (12.03.1932); altfel doar anul sau „cca. 1870”.</small>
      <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input type="checkbox" name="living" checked={living} onChange={(e) => setLiving(e.target.checked)} /> Persoana e în viață (rămâne privată în arbore)
      </label>
      {living && <small className="muted" style={{ marginTop: -6 }}>Cu data completă a nașterii (ziua, luna, anul), persoana își poate găsi singură fișa când își face cont, iar tu confirmi că e ea.</small>}
      {living ? (
        <div className="row">
          <label>Locuiește acum în<input name="residencePlace" placeholder="ex. Huedin, Cluj-Napoca, Torino" defaultValue={p?.residencePlace ?? ""} /></label>
          <label>Țara<input name="residenceCountry" list="tari" defaultValue={p?.residenceCountry ?? "România"} /></label>
        </div>
      ) : (
        <div className="row">
          <label>Decedat(ă)<input name="death" placeholder="5.11.2008 sau 1980" defaultValue={p?.deathText ?? ""} /></label>
          <label>Locul decesului<input name="deathPlace" defaultValue={p?.deathPlace ?? ""} /></label>
          <label>Țara<input name="deathCountry" list="tari" defaultValue={p?.deathCountry ?? "România"} /></label>
        </div>
      )}
      <label>Ocupație<input name="occupation" defaultValue={p?.occupation ?? ""} placeholder="agricultor, învățătoare, tâmplar…" /></label>
      {kind === "child" && props.mode === "add" && !!props.partners?.length && (
        <label>Celălalt părinte
          <select name="otherParentId" defaultValue={props.partners[0].id}>
            {props.partners.map((x) => <option key={x.id} value={x.id}>{x.name}{x.discreet ? " (din altă relație)" : ""}</option>)}
            <option value="">nu știu / altcineva</option>
          </select>
        </label>
      )}
      {(props.mode === "edit" || kind === "spouse" || kind === "father" || kind === "mother") && (
        <label style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
          <input type="checkbox" name="discreet" defaultChecked={p ? p.discreet : props.mode === "add" && !!props.discreet} style={{ marginTop: 4 }} />
          <span>Discret(ă): nu apare în desenele arborelui, ci doar în fișele copiilor
            <small className="muted" style={{ display: "block" }}>De pildă o fostă soție sau mama unui copil dintr-o altă relație. Copiii pornesc în desen doar din celălalt părinte.</small></span>
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
      {props.mode === "add" && matches.length > 0 && (
        <div className="confirm">
          {matches.map((x) => (
            <div key={x.id} style={{ marginBottom: 6 }}>
              <b>{x.name}{x.birthYear ? `, ${x.birthYear}` : ""}</b>{" "}
              {kind === "mother" || kind === "father" ? `e deja în arbore, lângă familia lui ${props.anchor.givenName}. E aceeași persoană?`
                : kind === "spouse" ? `e deja trecut(ă) lângă ${props.anchor.givenName}.`
                : kind === "child" ? `e deja copilul lui ${props.anchor.givenName}.` : `e deja ${x.sex === "F" ? "sora" : "fratele"} lui ${props.anchor.givenName}.`}
              {props.useExisting && (
                <div className="actions" style={{ marginTop: 4 }}>
                  <button type="button" className="btn primary" disabled={linking} onClick={async () => {
                    setLinking(true); setLinkErr(null);
                    const err = await props.useExisting!(x);
                    setLinking(false);
                    if (err) setLinkErr(err); else props.onDone(`${x.name} este acum ${kind === "mother" ? "mama" : "tatăl"} lui ${props.anchor.givenName}.`);
                  }}>{linking ? "Se leagă…" : `Da, e ${x.givenName}: ${x.sex === "M" ? "leagă-l" : "leag-o"} pe ${x.sex === "M" ? "el" : "ea"}`}</button>
                </div>
              )}
            </div>
          ))}
          <small className="muted">Dacă e altă persoană, cu același nume, continuă cu „Adaugă”.</small>
          {linkErr && <p className="err">{linkErr}</p>}
        </div>
      )}
      {state && "error" in state && state.error && <p className="err">{state.error}</p>}
      <div className="actions">
        <button className="btn primary" disabled={pending}>{pending ? "Se salvează…" : p ? "Salvează" : "Adaugă"}</button>
        {props.onCancel && <button type="button" className="btn" onClick={props.onCancel}>Renunță</button>}
      </div>
    </form>
  );
}
