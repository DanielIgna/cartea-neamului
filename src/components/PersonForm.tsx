"use client";
import { useActionState, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "use-intl";
import { addRelative, updatePerson } from "@/app/actions";
import type { PersonView } from "@/lib/tree-data";
import { sameLooking } from "@/lib/family";
import { COUNTRY_NAMES, countryName } from "@/lib/place-key";

/** Sexul ghicit după prenumele românesc: cele terminate în „a” sunt de obicei feminine (cu câteva excepții bărbătești). */
const MALE_A = new Set(["toma", "luca", "mihăiță", "mihaita", "nicola", "costea", "sava", "ilia", "jean-luca", "andrea", "gheorghiță", "gheorghita", "ionuță", "ionuta", "costică", "costica", "nicușa", "nicusa", "mitrea", "petrea", "vasilică", "vasilica", "dumitra"]);
export function guessSex(given: string): "M" | "F" | "U" {
  const first = given.trim().toLowerCase().split(/[\s-]+/)[0] ?? "";
  if (first.length < 2) return "U";
  if (MALE_A.has(first)) return "M";
  return /[aă]$/.test(first) ? "F" : "M";
}

export type RelKind = "father" | "mother" | "child" | "spouse" | "sibling";

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
  const t = useTranslations("PersonForm"), locale = useLocale();
  // Țările din care vin cel mai des familiile din România, scrise în limba omului; se poate scrie oricare alta.
  const countries = Object.keys(COUNTRY_NAMES).map((cc) => countryName(cc, locale)), romania = countryName("RO", locale);
  const [state, action, pending] = useActionState(props.mode === "add" ? addRelative : updatePerson, null);
  useEffect(() => { if (state && "ok" in state && state.ok) props.onDone(); }, [state]);
  const p = props.mode === "edit" ? props.person : null;
  const kind = props.mode === "add" ? props.kind : null;
  const askSex = kind === "child" || kind === "spouse" || kind === "sibling" || props.mode === "edit";
  const anchor = props.mode === "add" ? props.anchor : null;
  const defaultSurname = p ? p.surname : kind === "sibling" ? anchor!.birthSurname || anchor!.surname : kind === "father" || kind === "child" ? anchor!.surname : "";
  const [living, setLiving] = useState(p?.living ?? false);
  // Țara de naștere pornește de la a rudei de lângă care adaugi (copiii născuți în Italia ai unor părinți născuți în Italia…), altfel România.
  const countryHint = p?.birthCountry ?? anchor?.birthCountry ?? romania;
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
  // Deschis din „+ Frate / soră” și celelalte butoane, formularul poate apărea mai jos de ecran (mai ales pe telefon):
  // îl aducem în fața ochilor și punem cursorul în primul câmp.
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    const f = formRef.current;
    if (!f) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    f.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    f.querySelector<HTMLInputElement>("input:not([type=hidden]), select, textarea")?.focus({ preventScroll: true });
  }, []);
  return (
    <form ref={formRef} action={action} className="form person-form" style={{ marginTop: 10 }}>
      <div className="section-label" style={{ marginTop: 0 }}>{p ? t("editTitle", { name: p.givenName }) : t("addTitle", { kind: kind!, name: anchor!.givenName })}</div>
      <input type="hidden" name="treeId" value={props.treeId} />
      {p ? <input type="hidden" name="personId" value={p.id} /> : <><input type="hidden" name="anchorId" value={anchor!.id} /><input type="hidden" name="kind" value={kind!} /></>}
      <div className="row">
        <label>{t("given")}<input name="given" required defaultValue={p?.givenName}
          onChange={(e) => {
            setTyped((t) => ({ ...t, given: e.target.value }));
            if (!sexTouched.current && sexRef.current && (kind === "child" || kind === "sibling")) sexRef.current.value = guessSex(e.target.value);
          }} /></label>
        <label>{t("surname")}<input name="surname" defaultValue={defaultSurname} onChange={(e) => setTyped((t) => ({ ...t, surname: e.target.value }))} /></label>
      </div>
      <div className="row">
        <label>{t("birthSurname")}<input name="birthSurname" defaultValue={p?.birthSurname ?? ""} /></label>
        {askSex && (
          <label>{t("sex")}
            <select name="sex" ref={sexRef} onChange={() => { sexTouched.current = true; }} defaultValue={p?.sex ?? (kind === "spouse" ? (anchor!.sex === "M" ? "F" : anchor!.sex === "F" ? "M" : "U") : "U")}>
              <option value="M">{t("man")}</option><option value="F">{t("woman")}</option><option value="U">{t("unknown")}</option>
            </select>
          </label>
        )}
      </div>
      <datalist id="tari">{countries.map((c) => <option key={c} value={c} />)}</datalist>
      <div className="row">
        <label>{t("born")}<input name="birth" placeholder={t("birthPlaceholder")} defaultValue={p?.birthText ?? ""} /></label>
        <label>{t("birthPlace")}<input name="birthPlace" placeholder={t("placePlaceholder")} defaultValue={p?.birthPlace ?? ""} /></label>
        <label>{t("country")}<input name="birthCountry" list="tari" defaultValue={countryHint} /></label>
      </div>
      <small className="muted" style={{ marginTop: -6 }}>{t("dateHint")}</small>
      <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input type="checkbox" name="living" checked={living} onChange={(e) => setLiving(e.target.checked)} /> {t("living")}
      </label>
      {living && <small className="muted" style={{ marginTop: -6 }}>{t("livingHint")}</small>}
      {living ? (
        <div className="row">
          <label>{t("livesIn")}<input name="residencePlace" placeholder={t("livesPlaceholder")} defaultValue={p?.residencePlace ?? ""} /></label>
          <label>{t("country")}<input name="residenceCountry" list="tari" defaultValue={p?.residenceCountry ?? romania} /></label>
        </div>
      ) : (
        <div className="row">
          <label>{t("died")}<input name="death" placeholder={t("deathPlaceholder")} defaultValue={p?.deathText ?? ""} /></label>
          <label>{t("deathPlace")}<input name="deathPlace" defaultValue={p?.deathPlace ?? ""} /></label>
          <label>{t("country")}<input name="deathCountry" list="tari" defaultValue={p?.deathCountry ?? romania} /></label>
        </div>
      )}
      <label>{t("occupation")}<input name="occupation" defaultValue={p?.occupation ?? ""} placeholder={t("occupationPlaceholder")} /></label>
      {kind === "child" && props.mode === "add" && !!props.partners?.length && (
        <label>{t("otherParent")}
          <select name="otherParentId" defaultValue={props.partners[0].id}>
            {props.partners.map((x) => <option key={x.id} value={x.id}>{x.discreet ? t("otherRelationName", { name: x.name }) : x.name}</option>)}
            <option value="">{t("otherParentUnknown")}</option>
          </select>
        </label>
      )}
      {(props.mode === "edit" || kind === "spouse" || kind === "father" || kind === "mother") && (
        <label style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
          <input type="checkbox" name="discreet" defaultChecked={p ? p.discreet : props.mode === "add" && !!props.discreet} style={{ marginTop: 4 }} />
          <span>{t("discreet")}
            <small className="muted" style={{ display: "block" }}>{t("discreetHint")}</small></span>
        </label>
      )}
      {props.mode === "add" && !!props.shareWith?.length && (
        <fieldset className="share">
          <legend>{kind === "spouse" ? t("shareSpouse", { name: anchor!.givenName }) : t("shareParent", { kind: kind === "father" ? "father" : "mother", name: anchor!.givenName })}</legend>
          {props.shareWith.map((x) => (
            <label key={x.id}><input type="checkbox" name="also" value={x.id} defaultChecked /> {x.name}{x.birthYear ? ` (${x.birthYear})` : ""}</label>
          ))}
          <small className="muted">{t("shareHint")}</small>
        </fieldset>
      )}
      <label>{p ? t("aboutName", { name: p.givenName }) : t("aboutNew")}
        <textarea name="biography" defaultValue={p?.biography ?? ""} placeholder={t("bioPlaceholder")} />
      </label>
      <label>{t("notes")}
        <textarea name="notes" defaultValue={p?.notes ?? ""} placeholder={t("notesPlaceholder")} style={{ minHeight: 60 }} />
      </label>
      {props.mode === "add" && matches.length > 0 && (
        <div className="confirm">
          {matches.map((x) => (
            <div key={x.id} style={{ marginBottom: 6 }}>
              {(() => {
                const v = { who: `${x.name}${x.birthYear ? `, ${x.birthYear}` : ""}`, name: props.anchor.givenName, sex: x.sex, b: (c: React.ReactNode) => <b>{c}</b> };
                return kind === "mother" || kind === "father" ? t.rich("matchParent", v) : kind === "spouse" ? t.rich("matchSpouse", v)
                  : kind === "child" ? t.rich("matchChild", v) : t.rich("matchSibling", v);
              })()}
              {props.useExisting && (
                <div className="actions" style={{ marginTop: 4 }}>
                  <button type="button" className="btn primary" disabled={linking} onClick={async () => {
                    setLinking(true); setLinkErr(null);
                    const err = await props.useExisting!(x);
                    setLinking(false);
                    if (err) setLinkErr(err); else props.onDone(t("linked", { person: x.name, kind: kind === "mother" ? "mother" : "father", name: props.anchor.givenName }));
                  }}>{linking ? t("linking") : t("linkYes", { name: x.givenName, sex: x.sex })}</button>
                </div>
              )}
            </div>
          ))}
          <small className="muted">{t("otherSameName")}</small>
          {linkErr && <p className="err">{linkErr}</p>}
        </div>
      )}
      {state && "error" in state && state.error && <p className="err">{state.error}</p>}
      <div className="actions">
        <button className="btn primary" disabled={pending}>{pending ? t("saving") : p ? t("save") : t("add")}</button>
        {props.onCancel && <button type="button" className="btn" onClick={props.onCancel}>{t("cancel")}</button>}
      </div>
    </form>
  );
}
