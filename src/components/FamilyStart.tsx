"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import { useTranslations } from "use-intl";
import { startFamilyTree } from "@/app/pornire-actions";
import type { StartInput } from "@/lib/family-start";

type Who = { given: string; surname: string; birthSurname: string; birth: string; living: boolean };
type Key = "father" | "mother" | "ff" | "fm" | "mf" | "mm";
const empty = (living = false): Who => ({ given: "", surname: "", birthSurname: "", birth: "", living });
// Intră în arbore doar cine are prenumele scris: numele de familie vin deja completate, deci singure nu spun că omul e știut.
const has = (w: Who) => !!w.given.trim();
const STEPS = ["stepMe", "stepParents", "stepGrandparents", "stepTree"] as const;

/**
 * Arborele pornit pas cu pas, cum l-ar întreba un nepot pe bunic: întâi cine ești, apoi părinții, apoi bunicii.
 * Ce nu știe omul lasă gol; numele de familie trec singure de la un pas la altul (le poate schimba).
 */
export default function FamilyStart() {
  const t = useTranslations("FamilyStart");
  const [step, setStep] = useState(0);
  const [me, setMe] = useState({ given: "", surname: "", birthSurname: "", sex: "" as "" | "M" | "F", birth: "", birthPlace: "" });
  const [rel, setRel] = useState<Record<Key, Who>>({ father: empty(true), mother: empty(true), ff: empty(), fm: empty(), mf: empty(), mm: empty() });
  const [treeName, setTreeName] = useState("");
  const [region, setRegion] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const head = useRef<HTMLHeadingElement>(null);
  const first = useRef(true);
  // La fiecare pas, cititorul de ecran și telefonul pornesc de la titlul pasului.
  useEffect(() => { if (first.current) { first.current = false; return; } head.current?.focus(); }, [step]);

  const nameOf = (w: Who) => [w.given, w.surname].map((x) => x.trim()).filter(Boolean).join(" ");
  const full = (w: Who) => (w.birthSurname.trim() ? t("withBirthSurname", { name: nameOf(w), birthSurname: w.birthSurname.trim() }) : nameOf(w));
  const set = (k: Key, patch: Partial<Who>) => setRel((r) => ({ ...r, [k]: { ...r[k], ...patch } }));
  // Numele de familie trec de la un pas la altul, doar unde omul n-a scris încă nimic.
  const fill = (r: Record<Key, Who>, k: Key, surname: string) => (r[k].surname || !surname ? r[k] : { ...r[k], surname });
  const fatherOk = has(rel.father), motherOk = has(rel.mother);
  const grandOk = (fatherOk && (has(rel.ff) || has(rel.fm))) || (motherOk && (has(rel.mf) || has(rel.mm)));

  const next = () => {
    setErr(null);
    if (step === 0) {
      if (!me.given.trim()) return setErr(t("errGiven"));
      if (!me.sex) return setErr(t("errSex"));
      // O femeie măritată poartă de obicei numele soțului; al tatălui ei e numele de fată.
      const family = (me.sex === "F" && me.birthSurname.trim()) || me.surname.trim();
      setRel((r) => ({ ...r, father: fill(r, "father", family), mother: fill(r, "mother", family) }));
    }
    if (step === 1) {
      const dad = rel.father.surname.trim(), mom = rel.mother.birthSurname.trim();
      setRel((r) => ({ ...r, ff: fill(r, "ff", dad), fm: fill(r, "fm", dad), mf: fill(r, "mf", mom), mm: fill(r, "mm", mom) }));
    }
    if (step === 2 && !treeName) {
      const name = rel.father.surname.trim() || me.surname.trim();
      setTreeName(name ? t("defaultTreeName", { surname: name }) : t("defaultTreeNameMine"));
    }
    setStep(step + 1);
  };
  const back = () => { setErr(null); setStep(step - 1); };

  const submit = () => start(async () => {
    setErr(null);
    const pick = (k: Key) => (has(rel[k]) ? { ...rel[k] } : undefined);
    const input: StartInput = {
      treeName, region,
      me: { given: me.given, surname: me.surname, birthSurname: me.sex === "F" ? me.birthSurname : "", sex: me.sex as "M" | "F", birth: me.birth, birthPlace: me.birthPlace },
      father: pick("father"), mother: pick("mother"), ff: pick("ff"), fm: pick("fm"), mf: pick("mf"), mm: pick("mm"),
    };
    const r = await startFamilyTree(input);
    if (r?.error) setErr(r.error);
  });

  const personFields = (k: Key, title: string, woman: boolean) => (
    <fieldset className="start-person" key={k}>
      <legend>{title}</legend>
      <div className="row">
        <label>{t("given")}<input value={rel[k].given} onChange={(e) => set(k, { given: e.target.value })} autoComplete="off" /></label>
        <label>{woman ? t("surnameNow") : t("surname")}<input value={rel[k].surname} onChange={(e) => set(k, { surname: e.target.value })} autoComplete="off" /></label>
      </div>
      <div className="row">
        {woman && <label>{t("birthSurname")}<input value={rel[k].birthSurname} onChange={(e) => set(k, { birthSurname: e.target.value })} autoComplete="off" /></label>}
        <label><span>{t("birthYear")} <span className="muted">{t("ifKnown")}</span></span>
          <input value={rel[k].birth} onChange={(e) => set(k, { birth: e.target.value })} placeholder={t("birthYearPlaceholder")} autoComplete="off" />
        </label>
      </div>
      <label className="radio"><input type="checkbox" checked={rel[k].living} onChange={(e) => set(k, { living: e.target.checked })} /> {t("living")}</label>
    </fieldset>
  );

  const summary = [
    t("sumMe", { name: [me.given, me.surname].map((x) => x.trim()).filter(Boolean).join(" ") }),
    fatherOk && t("sumFather", { name: full(rel.father) }), motherOk && t("sumMother", { name: full(rel.mother) }),
    fatherOk && has(rel.ff) && t("sumFF", { name: full(rel.ff) }), fatherOk && has(rel.fm) && t("sumFM", { name: full(rel.fm) }),
    motherOk && has(rel.mf) && t("sumMF", { name: full(rel.mf) }), motherOk && has(rel.mm) && t("sumMM", { name: full(rel.mm) }),
  ].filter(Boolean) as string[];
  const skip = (step === 1 && !fatherOk && !motherOk) || (step === 2 && !grandOk);

  return (
    <div className="form start">
      <ol className="start-steps" aria-label={t("stepsLabel")}>
        {STEPS.map((s, i) => (
          <li key={s} className={i === step ? "now" : i < step ? "done" : ""} aria-current={i === step ? "step" : undefined}>
            <span aria-hidden="true">{i < step ? "✓" : i + 1}</span> {t(s)}
          </li>
        ))}
      </ol>

      {step === 0 && (
        <>
          <h3 ref={head} tabIndex={-1}>{t("whoTitle")}</h3>
          <p className="muted">{t("whoText")}</p>
          <div className="row">
            <label>{t("given")}<input value={me.given} onChange={(e) => setMe({ ...me, given: e.target.value })} autoComplete="given-name" required /></label>
            <label>{t("surname")}<input value={me.surname} onChange={(e) => setMe({ ...me, surname: e.target.value })} autoComplete="family-name" /></label>
          </div>
          <div className="start-sex" role="radiogroup" aria-label={t("youAre")}>
            <label className="radio"><input type="radio" name="sex" checked={me.sex === "M"} onChange={() => setMe({ ...me, sex: "M" })} /> {t("man")}</label>
            <label className="radio"><input type="radio" name="sex" checked={me.sex === "F"} onChange={() => setMe({ ...me, sex: "F" })} /> {t("woman")}</label>
          </div>
          {me.sex === "F" && (
            <label><span>{t("birthSurname")} <span className="muted">{t("birthSurnameHint")}</span></span>
              <input value={me.birthSurname} onChange={(e) => setMe({ ...me, birthSurname: e.target.value })} autoComplete="off" />
            </label>
          )}
          <div className="row">
            <label><span>{t("birthDate")} <span className="muted">{t("birthDateHint")}</span></span>
              <input value={me.birth} onChange={(e) => setMe({ ...me, birth: e.target.value })} placeholder={t("birthDatePlaceholder")} autoComplete="off" />
            </label>
            <label><span>{t("birthPlace")} <span className="muted">{t("ifYouWant")}</span></span>
              <input value={me.birthPlace} onChange={(e) => setMe({ ...me, birthPlace: e.target.value })} placeholder={t("birthPlacePlaceholder")} autoComplete="off" />
            </label>
          </div>
        </>
      )}

      {step === 1 && (
        <>
          <h3 ref={head} tabIndex={-1}>{t("parentsTitle")}</h3>
          <p className="muted">{t("parentsText")}</p>
          {personFields("father", t("father"), false)}
          {personFields("mother", t("mother"), true)}
        </>
      )}

      {step === 2 && (
        <>
          <h3 ref={head} tabIndex={-1}>{t("grandTitle")}</h3>
          {!fatherOk && !motherOk ? (
            <p className="muted">{t("grandNoParents")}</p>
          ) : (
            <>
              <p className="muted">{t("grandText")}</p>
              {fatherOk && <div className="start-side"><div className="section-label">{t("fatherSide")}</div>{personFields("ff", t("grandfather"), false)}{personFields("fm", t("grandmother"), true)}</div>}
              {motherOk && <div className="start-side"><div className="section-label">{t("motherSide")}</div>{personFields("mf", t("grandfather"), false)}{personFields("mm", t("grandmother"), true)}</div>}
            </>
          )}
        </>
      )}

      {step === 3 && (
        <>
          <h3 ref={head} tabIndex={-1}>{t("treeTitle")}</h3>
          <div className="row">
            <label>{t("treeName")}<input value={treeName} onChange={(e) => setTreeName(e.target.value)} required /></label>
            <label><span>{t("region")} <span className="muted">{t("ifYouWant")}</span></span><input value={region} onChange={(e) => setRegion(e.target.value)} placeholder={t("regionPlaceholder")} /></label>
          </div>
          <div className="start-summary">
            <b>{t("summaryTitle")}</b>
            <ul>{summary.map((s) => <li key={s}>{s}</li>)}</ul>
            <p className="muted">{t("afterText")}</p>
          </div>
        </>
      )}

      {err && <p className="err" role="alert">{err}</p>}
      <div className="actions start-nav">
        {step > 0 && <button type="button" className="btn" onClick={back} disabled={pending}>{t("back")}</button>}
        {step < 3
          ? <button type="button" className="btn primary" onClick={next}>{skip ? t("skip") : t("next")}</button>
          : <button type="button" className="btn primary" onClick={submit} disabled={pending || !treeName.trim()}>{pending ? t("creating") : t("create")}</button>}
      </div>
    </div>
  );
}
