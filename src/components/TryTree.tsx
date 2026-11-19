"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "use-intl";
import FanChart from "@/components/FanChart";
import { saveDraft } from "@/lib/incepe-draft";

/**
 * „Începe chiar acum” din bannerul primei pagini (Daniel, 19.11.2026: 70% din cei care intrau pe prima pagină plecau fără să
 * apese nimic). În loc de un buton, omul își scrie numele și vede pe loc evantaiul cu el în mijloc; apoi scrie părinții și
 * evantaiul se umple. „Salvează arborele” îl duce la contul nou, iar ce a scris rămâne în browser (src/lib/incepe-draft.ts) și
 * completează primii pași (src/components/QuickStart.tsx). Cine vine din Facebook primește un salut potrivit, iar cine vine din
 * linkul de Crăciun, drumul spre dar.
 */
export default function TryTree({ signUpHref = "/intrare?mod=cont-nou" }: { signUpHref?: string }) {
  const t = useTranslations("TryTree");
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [given, setGiven] = useState("");
  const [surname, setSurname] = useState("");
  const [father, setFather] = useState("");
  const [mother, setMother] = useState("");
  const [err, setErr] = useState(false);
  const [from, setFrom] = useState<{ fb: boolean; gift: boolean }>({ fb: false, gift: false });
  const second = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const us = (q.get("utm_source") ?? q.get("ref") ?? "").toLowerCase();
    const fb = us === "fb" || us.startsWith("facebook") || /(^|\.)(facebook|fb)\.(com|me)$/.test(hostOf(document.referrer));
    const gift = /craciun|cadou|sarbator/.test((q.get("utm_campaign") ?? "").toLowerCase());
    setFrom({ fb, gift });
    // Prima pagină pornește mereu goală (Daniel, 19.11.2026): un nume scris mai demult, pe același telefon sau calculator,
    // nu reapare aici, ca nimeni să nu vadă numele altcuiva. Ce s-a scris se folosește doar mai departe, la contul nou.
  }, []);
  useEffect(() => { if (step === 2) second.current?.focus(); }, [step]);

  // În mijlocul evantaiului doar primul prenume, scurt și fără nume de familie.
  const firstName = given.trim().split(/\s+/)[0] ?? "";
  const q = (s: string) => (s.trim() ? [s.trim()] : undefined);
  // Inelele evantaiului: tata, mama, apoi bunicii; ce nu e scris rămâne cu semnul întrebării, ca un loc de completat.
  const names = [
    q(father) ?? ["?", t("dad")], q(mother) ?? ["?", t("mom")],
    ["?", t("gf")], ["?", t("gm")], ["?", t("gf")], ["?", t("gm")],
    ...Array.from({ length: 8 }, () => ["?"]),
  ];

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      if (!given.trim()) { setErr(true); return; }
      setErr(false);
      saveDraft({ given, surname, father, mother });
      setStep(2);
      return;
    }
    saveDraft({ given, surname, father, mother });
    router.push(signUpHref);
  };

  return (
    <div className="tt">
      {from.fb && <p className="tt-hello" role="status">{t("fbHello")}</p>}
      {from.gift && <p className="tt-hello"><Link href="/cadou-de-sarbatori">{t("giftHello")}<span aria-hidden="true"> →</span></Link></p>}
      <form className="tt-form" onSubmit={submit} noValidate>
        <p className="tt-q" id="tt-q">{step === 1 ? t("q1") : t("q2")}</p>
        {step === 1 ? (
          <div className="tt-row">
            <label className="tt-field"><span className="sr-only">{t("given")}</span>
              <input value={given} onChange={(e) => { setGiven(e.target.value); setErr(false); }} placeholder={t("given")} autoComplete="given-name"
                enterKeyHint="next" maxLength={60} aria-invalid={err || undefined} aria-describedby={err ? "tt-err" : undefined} />
            </label>
            <label className="tt-field"><span className="sr-only">{t("surname")}</span>
              <input value={surname} onChange={(e) => setSurname(e.target.value)} placeholder={t("surname")} autoComplete="family-name" enterKeyHint="go" maxLength={60} />
            </label>
          </div>
        ) : (
          <div className="tt-row">
            <label className="tt-field"><span className="sr-only">{t("father")}</span>
              <input ref={second} value={father} onChange={(e) => setFather(e.target.value)} placeholder={t("father")} autoComplete="off" enterKeyHint="next" maxLength={60} />
            </label>
            <label className="tt-field"><span className="sr-only">{t("mother")}</span>
              <input value={mother} onChange={(e) => setMother(e.target.value)} placeholder={t("mother")} autoComplete="off" enterKeyHint="go" maxLength={60} />
            </label>
          </div>
        )}
        {err && <p className="tt-err" id="tt-err" role="alert">{t("err")}</p>}
        <button className="lp-btn lp-btn-gold tt-go" data-cta={step === 1 ? "acasa-nume" : "acasa-parinti"}>
          {step === 1 ? t("go1") : t("go2")}<span aria-hidden="true">→</span>
        </button>
        {step === 2 && <p className="tt-note">{t("note2")}</p>}
      </form>
      <div className="tt-fan" aria-hidden="true">
        <FanChart live you={firstName || t("you")} names={names} />
      </div>
    </div>
  );
}

function hostOf(ref: string) {
  try { return new URL(ref).hostname.toLowerCase(); } catch { return ""; }
}
