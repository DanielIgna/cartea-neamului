"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import { useTranslations } from "use-intl";
import { startFamilyTree } from "@/app/pornire-actions";
import type { StartInput } from "@/lib/family-start";

/**
 * Primii pași după înscriere (Daniel, 17.11.2026): „Adaugă-te pe tine, apoi pe părinți și bunici”, cel mult 3 câmpuri pe ecran,
 * gândit întâi pentru telefon (69% din vizite). Fiecare ecran se poate sări; numele de familie trec singure de la un pas la altul.
 * La sfârșit se face arborele (aceeași acțiune ca pornirea pas cu pas din /arbore-nou) și omul ajunge la pagina de bun venit.
 */
type P = { given: string; surname: string; birthSurname: string; birth: string };
const blank = (): P => ({ given: "", surname: "", birthSurname: "", birth: "" });
const SCREENS = ["me", "father", "mother", "fatherSide", "motherSide"] as const;

export default function QuickStart() {
  const t = useTranslations("QuickStart");
  const tf = useTranslations("FamilyStart");
  const [i, setI] = useState(0);
  const [me, setMe] = useState({ given: "", surname: "", sex: "" as "" | "M" | "F" });
  const [father, setFather] = useState<P>(blank);
  const [mother, setMother] = useState<P>(blank);
  const [ff, setFf] = useState<P>(blank);
  const [fm, setFm] = useState<P>(blank);
  const [mf, setMf] = useState<P>(blank);
  const [mm, setMm] = useState<P>(blank);
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const head = useRef<HTMLHeadingElement>(null);
  const first = useRef(true);
  useEffect(() => { if (first.current) { first.current = false; return; } head.current?.focus(); }, [i]);

  const screen = SCREENS[i];
  const last = i === SCREENS.length - 1;
  const typed = (p: P) => !!p.given.trim();
  const empty = screen === "father" ? !typed(father) : screen === "mother" ? !typed(mother)
    : screen === "fatherSide" ? !typed(ff) && !typed(fm) : screen === "motherSide" ? !typed(mf) && !typed(mm) : false;

  const create = () => start(async () => {
    setErr(null);
    const dad = father.surname.trim() || me.surname.trim();
    const momMaiden = mother.birthSurname.trim();
    const pick = (p: P, surname: string, living: boolean) => (typed(p) ? { ...p, surname: p.surname.trim() || surname, living } : undefined);
    const family = dad || me.surname.trim();
    const input: StartInput = {
      treeName: family ? tf("defaultTreeName", { surname: family }) : tf("defaultTreeNameMine"),
      region: "",
      me: { given: me.given, surname: me.surname, birthSurname: "", sex: me.sex as "M" | "F", birth: "", birthPlace: "" },
      father: pick(father, me.surname.trim(), true),
      // Mama poartă de obicei numele tatălui; numele ei de fată e cel scris pe ecranul ei.
      mother: typed(mother) ? { ...mother, surname: mother.surname.trim() || dad, living: true } : undefined,
      ff: pick(ff, dad, false), fm: typed(fm) ? { ...fm, surname: fm.surname.trim() || dad, living: false } : undefined,
      mf: pick(mf, momMaiden, false), mm: typed(mm) ? { ...mm, surname: mm.surname.trim() || momMaiden, living: false } : undefined,
    };
    const r = await startFamilyTree(input);
    if (r?.error) setErr(r.error);
  });

  const next = () => {
    setErr(null);
    if (screen === "me") {
      if (!me.given.trim()) return setErr(tf("errGiven"));
      if (!me.sex) return setErr(tf("errSex"));
      if (!father.surname) setFather({ ...father, surname: me.surname.trim() });
    }
    // Bunicii dinspre tată și dinspre mamă se leagă de părinți: fără părintele respectiv, ecranul lor se sare.
    if (screen === "mother" && !typed(father)) { if (!typed(mother)) return create(); return setI(SCREENS.indexOf("motherSide")); }
    if (screen === "fatherSide" && !typed(mother)) return create();
    if (last) return create();
    setI(i + 1);
  };
  const back = () => {
    setErr(null);
    if (screen === "motherSide" && !typed(father)) return setI(SCREENS.indexOf("mother"));
    setI(Math.max(0, i - 1));
  };

  const field = (label: string, value: string, on: (v: string) => void, opts: { auto?: string; ph?: string; numeric?: boolean } = {}) => (
    <label className="qs-field">{label}
      <input value={value} onChange={(e) => on(e.target.value)} autoComplete={opts.auto ?? "off"} placeholder={opts.ph}
        inputMode={opts.numeric ? "numeric" : undefined} enterKeyHint="next" />
    </label>
  );

  return (
    <div className="form qs">
      <div className="qs-progress" aria-hidden="true"><span style={{ width: `${((i + 1) / SCREENS.length) * 100}%` }} /></div>
      <p className="qs-step muted">{t("progress", { n: String(i + 1), total: String(SCREENS.length) })}</p>
      <form onSubmit={(e) => { e.preventDefault(); next(); }}>
        {screen === "me" && (
          <>
            <h3 ref={head} tabIndex={-1}>{tf("whoTitle")}</h3>
            {field(tf("given"), me.given, (v) => setMe({ ...me, given: v }), { auto: "given-name" })}
            {field(tf("surname"), me.surname, (v) => setMe({ ...me, surname: v }), { auto: "family-name" })}
            <div className="qs-sex" role="radiogroup" aria-label={tf("youAre")}>
              <label className="radio"><input type="radio" name="qs-sex" checked={me.sex === "M"} onChange={() => setMe({ ...me, sex: "M" })} /> {tf("man")}</label>
              <label className="radio"><input type="radio" name="qs-sex" checked={me.sex === "F"} onChange={() => setMe({ ...me, sex: "F" })} /> {tf("woman")}</label>
            </div>
          </>
        )}
        {screen === "father" && (
          <>
            <h3 ref={head} tabIndex={-1}>{tf("father")}</h3>
            {field(tf("given"), father.given, (v) => setFather({ ...father, given: v }))}
            {field(tf("surname"), father.surname, (v) => setFather({ ...father, surname: v }))}
            {field(`${tf("birthYear")} ${tf("ifKnown")}`, father.birth, (v) => setFather({ ...father, birth: v }), { ph: "1955", numeric: true })}
          </>
        )}
        {screen === "mother" && (
          <>
            <h3 ref={head} tabIndex={-1}>{tf("mother")}</h3>
            {field(tf("given"), mother.given, (v) => setMother({ ...mother, given: v }))}
            {field(tf("birthSurname"), mother.birthSurname, (v) => setMother({ ...mother, birthSurname: v }))}
            {field(`${tf("birthYear")} ${tf("ifKnown")}`, mother.birth, (v) => setMother({ ...mother, birth: v }), { ph: "1958", numeric: true })}
          </>
        )}
        {screen === "fatherSide" && (
          <>
            <h3 ref={head} tabIndex={-1}>{t("fatherSide")}</h3>
            {field(t("grandfatherGiven"), ff.given, (v) => setFf({ ...ff, given: v }))}
            {field(t("grandmotherGiven"), fm.given, (v) => setFm({ ...fm, given: v }))}
            {field(t("grandmotherMaiden"), fm.birthSurname, (v) => setFm({ ...fm, birthSurname: v }))}
          </>
        )}
        {screen === "motherSide" && (
          <>
            <h3 ref={head} tabIndex={-1}>{t("motherSide")}</h3>
            {field(t("grandfatherGiven"), mf.given, (v) => setMf({ ...mf, given: v }))}
            {field(t("grandmotherGiven"), mm.given, (v) => setMm({ ...mm, given: v }))}
            {field(t("grandmotherMaiden"), mm.birthSurname, (v) => setMm({ ...mm, birthSurname: v }))}
          </>
        )}
        {err && <p className="err" role="alert">{err}</p>}
        <div className="qs-nav">
          <button className="btn primary qs-main" disabled={pending}>
            {pending ? tf("creating") : last || (screen === "fatherSide" && !typed(mother)) ? t("finish") : empty ? t("dontKnow") : tf("next")}
          </button>
          {i > 0 && <button type="button" className="btn" onClick={back} disabled={pending}>{tf("back")}</button>}
        </div>
      </form>
      {i > 0 && <p className="muted qs-note">{t("later")}</p>}
    </div>
  );
}
