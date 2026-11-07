"use client";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { useTranslations } from "use-intl";
import { saveMemory } from "@/app/lada-actions";
import type { Chapter } from "@/lib/questions";
import { LANGUAGE_NAMES, LOCALES, type Locale } from "@/i18n/locales";
import { Avatar } from "./Avatar";
import VoiceRecorder, { uploadForMemory, type Voice } from "./VoiceRecorder";

type Person = { id: string; givenName: string; surname: string; sex: "M" | "F" | "U"; photoId: string | null; accountImage?: string | null };
/**
 * O întrebare pentru omul din ladă: una lăsată de o rudă (`askedId`) sau una scrisă din arbore (`key`).
 * `kicker` (capitolul sau „Întrebare de la…”) vine gata scris, în limba întrebărilor, ca tot ce citește bunica.
 */
export type GrandQuestion = { text: string; chapter: Chapter; kicker: string; key?: string; askedId?: string; askedBy?: string | null; mentions?: string[] };
/** Ce i se spune direct bunicii, în limba întrebărilor: cererea acordului și mulțumirea de la sfârșit. */
export type GrandWords = { consentQuestion: string; thanks: string };

const UUIDS = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;

/**
 * Modul „la bunici”: pentru omul în viață care nu are cont. Ruda care e în vizită ține telefonul; pe ecran apare o întrebare
 * cu litere mari, bunica povestește, telefonul înregistrează, iar povestea intră în lada ei. Întâi o întrebăm dacă e de acord
 * (răspunsul ei se poate înregistra), cine poate asculta și dacă poveștile pot intra în Cartea neamului.
 */
export default function LaBunici({ treeId, person, questions, storage, back, people, questionLocale, words }: {
  treeId: string; person: Person; questions: GrandQuestion[]; storage: boolean; back: string; people: string[]; questionLocale: Locale; words: GrandWords;
}) {
  const t = useTranslations("Grand"), tv = useTranslations("Voice");
  const router = useRouter(), path = usePathname(), params = useSearchParams();
  const [step, setStep] = useState<"intro" | "consent" | "ask" | "saved">("intro");
  const [visibility, setVisibility] = useState<"tree" | "close">("tree");
  const [inBook, setInBook] = useState(false);
  // Despre credință întrebăm doar dacă omul e de acord și cu asta, separat (e o dată ocrotită mai strict).
  const [faithOk, setFaithOk] = useState(false);
  const hasFaith = questions.some((q) => q.chapter === "credinta");
  const [consentVoice, setConsentVoice] = useState<Voice | null>(null);
  const [consentId, setConsentId] = useState<string | null>(null);
  const [i, setI] = useState(0);
  const [done, setDone] = useState<Set<number>>(new Set());
  const [voice, setVoice] = useState<Voice | null>(null);
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(!storage);
  const [onlyAsker, setOnlyAsker] = useState(false);
  const [saved, setSaved] = useState(0);
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const sex = person.sex === "F" ? "F" : "M", name = person.givenName;
  const left = useMemo(() => questions.map((q, k) => ({ q, k })).filter((x) => !done.has(x.k) && (faithOk || x.q.chapter !== "credinta")), [questions, done, faithOk]);
  const cur = left.length ? left[i % left.length] : null;

  const next = () => { setVoice(null); setText(""); setOnlyAsker(false); setErr(null); setI((x) => x + 1); };
  const keep = () => start(async () => {
    if (!cur) return;
    setErr(null);
    const body = text.trim();
    if (!voice && !body) return setErr(storage ? t("recordFirst") : t("writeFirst"));
    let cid = consentId;
    if (consentVoice && !cid) {
      const r = await uploadForMemory(treeId, person.id, consentVoice.blob, consentVoice.name, "audio", t("consentTitle", { name: `${person.givenName} ${person.surname}`.trim() }), tv("uploadAudioFailed"));
      if (r.error) return setErr(r.error);
      cid = r.id!;
      setConsentId(cid);
    }
    let audioId: string | null = null;
    if (voice) {
      const r = await uploadForMemory(treeId, person.id, voice.blob, voice.name, "audio", t("voiceTitle", { name, question: cur.q.text }), tv("uploadAudioFailed"));
      if (r.error) return setErr(r.error);
      audioId = r.id!;
    }
    const mentions = [...new Set([...(cur.q.mentions ?? []), ...(cur.q.key?.match(UUIDS) ?? [])])].filter((id) => people.includes(id));
    const r = await saveMemory({
      treeId, personId: person.id, helper: true, consent: true, consentAudioId: cid, chapter: cur.q.chapter, faithConsent: cur.q.chapter === "credinta" ? faithOk : undefined,
      question: cur.q.text, questionKey: cur.q.key ?? null, askedId: cur.q.askedId ?? null,
      body, audioId, audioSeconds: voice?.seconds || null, visibility: cur.q.askedId && onlyAsker ? "asker" : visibility, maxDegree: null, inBook, mentions,
    });
    if (r.error) return setErr(r.error);
    setDone(new Set(done).add(cur.k));
    setSaved(saved + 1);
    setVoice(null); setText(""); setOnlyAsker(false);
    setStep("saved");
  });

  return (
    <div className="grand" role="dialog" aria-modal="true" aria-label={t("aria", { name })}>
      <div className="grand-frame">
        <div className="grand-top">
          <span>{t("tells", { name })}{saved ? ` · ${t("kept", { count: saved })}` : ""}</span>
          <Link href={back} aria-label={t("close")}>×</Link>
        </div>

        {step === "intro" && (
          <div className="grand-body center">
            <div className="grand-kicker">{t("kicker")}</div>
            <Avatar p={person} size={120} />
            <h1>{t("tells", { name })}</h1>
            <p>{t("intro", { name, sex })}</p>
            <p className="grand-small">{t("introSmall")}</p>
            {/* Cine ține telefonul poate citi site-ul în altă limbă decât cea în care povestește bunica: întrebările pot fi în limba ei. */}
            <label className="grand-small grand-lang">{t("questionsIn")}{" "}
              <select value={questionLocale} onChange={(e) => { const q = new URLSearchParams(params.toString()); q.set("limba", e.target.value); router.replace(`${path}?${q}`); }}>
                {LOCALES.map((l) => <option key={l} value={l} lang={l}>{LANGUAGE_NAMES[l]}</option>)}
              </select>
            </label>
            <button className="btn primary grand-go" onClick={() => setStep("consent")}>{t("start")}</button>
          </div>
        )}

        {step === "consent" && (
          <div className="grand-body">
            <div className="grand-kicker">{t("consentKicker", { sex })}</div>
            <p className="grand-q" lang={questionLocale}>{words.consentQuestion}</p>
            {storage && (
              <div className="grand-box">
                <div className="grand-small">{t("recordConsentHint")}</div>
                <VoiceRecorder value={consentVoice} onChange={setConsentVoice} maxSeconds={60} label={t("recordConsent")} />
              </div>
            )}
            <fieldset className="grand-box grand-choices">
              <legend>{t("whoListens")}</legend>
              <label><input type="radio" name="cine" checked={visibility === "tree"} onChange={() => setVisibility("tree")} /> {t("allFamily")}</label>
              <label><input type="radio" name="cine" checked={visibility === "close"} onChange={() => setVisibility("close")} /> {t("closeFamily")}</label>
              <label><input type="checkbox" checked={inBook} onChange={(e) => setInBook(e.target.checked)} /> {t("inBook")}</label>
              {hasFaith && (
                <label><input type="checkbox" checked={faithOk} onChange={(e) => setFaithOk(e.target.checked)} />
                  <span>{t("faithOk", { sex })}{!faithOk && <span className="grand-small"> {t("faithSkip")}</span>}</span></label>
              )}
            </fieldset>
            <div className="actions grand-actions">
              <button className="btn primary grand-go" onClick={() => setStep("ask")}>{t("yes")}</button>
              <Link className="btn" href={back}>{t("notNow")}</Link>
            </div>
          </div>
        )}

        {step === "ask" && (cur ? (
          <div className="grand-body">
            <div className="grand-kicker" lang={cur.q.askedId ? undefined : questionLocale}>{cur.q.kicker}</div>
            <p className="grand-q" lang={cur.q.askedId ? undefined : questionLocale}>{cur.q.text}</p>
            {storage && <VoiceRecorder big value={voice} onChange={setVoice} label={t("pressAndTell")} />}
            {storage && !typing && <button className="linklike grand-type" onClick={() => setTyping(true)}>{t("iType")}</button>}
            {typing && (
              <textarea className="grand-text" value={text} onChange={(e) => setText(e.target.value)} maxLength={20000} rows={5}
                placeholder={t("typePlaceholder", { sex })} aria-label={t("typeAria")} />
            )}
            {cur.q.askedId && cur.q.askedBy && (
              <label className="grand-check"><input type="checkbox" checked={onlyAsker} onChange={(e) => setOnlyAsker(e.target.checked)} /> {t("onlyAsker", { name: cur.q.askedBy })}</label>
            )}
            {err && <p className="err" role="alert">{err}</p>}
            <div className="actions grand-actions">
              <button className="btn primary grand-go" disabled={pending || (!voice && !text.trim())} onClick={keep}>{pending ? (voice ? t("uploadingVoice") : t("keeping")) : t("keep")}</button>
              {left.length > 1 && <button className="btn" disabled={pending} onClick={next}>{t("otherQuestion")}</button>}
            </div>
          </div>
        ) : (
          <div className="grand-body center">
            <h1>{t("doneTitle")}</h1>
            <p lang={questionLocale}>{words.thanks}</p>
            <Link className="btn primary grand-go" href={`${back}#lada`}>{t("seeLada", { sex })}</Link>
          </div>
        ))}

        {step === "saved" && (
          <div className="grand-body center">
            <div className="grand-kicker">{t("savedKicker")}</div>
            <h1>{t("savedTitle", { sex })}</h1>
            <p>{t("savedText", { sex })}</p>
            <div className="actions grand-actions" style={{ justifyContent: "center" }}>
              {left.length > 0 && <button className="btn primary grand-go" onClick={() => { setStep("ask"); setErr(null); }}>{t("oneMore")}</button>}
              <Link className="btn" href={`${back}#lada`}>{t("doneForToday")}</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
