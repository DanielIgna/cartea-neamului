"use client";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { saveMemory } from "@/app/lada-actions";
import { chapterLabel, type Chapter } from "@/lib/questions";
import { Avatar } from "./Album";
import VoiceRecorder, { uploadForMemory, type Voice } from "./VoiceRecorder";

type Person = { id: string; givenName: string; surname: string; sex: "M" | "F" | "U"; photoId: string | null; accountImage?: string | null };
/** O întrebare pentru omul din ladă: una lăsată de o rudă (`askedId`) sau una scrisă din arbore (`key`). */
export type GrandQuestion = { text: string; chapter: Chapter; key?: string; askedId?: string; askedBy?: string | null; mentions?: string[] };

const UUIDS = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;

/**
 * Modul „la bunici”: pentru omul în viață care nu are cont. Ruda care e în vizită ține telefonul; pe ecran apare o întrebare
 * cu litere mari, bunica povestește, telefonul înregistrează, iar povestea intră în lada ei. Întâi o întrebăm dacă e de acord
 * (răspunsul ei se poate înregistra), cine poate asculta și dacă poveștile pot intra în Cartea neamului.
 */
export default function LaBunici({ treeId, person, questions, storage, back, people }: {
  treeId: string; person: Person; questions: GrandQuestion[]; storage: boolean; back: string; people: string[];
}) {
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
  const ei = person.sex === "F" ? "ei" : "lui";
  const left = useMemo(() => questions.map((q, k) => ({ q, k })).filter((x) => !done.has(x.k) && (faithOk || x.q.chapter !== "credinta")), [questions, done, faithOk]);
  const cur = left.length ? left[i % left.length] : null;

  const next = () => { setVoice(null); setText(""); setOnlyAsker(false); setErr(null); setI((x) => x + 1); };
  const keep = () => start(async () => {
    if (!cur) return;
    setErr(null);
    const body = text.trim();
    if (!voice && !body) return setErr(storage ? "Înregistrează ce povestește (sau scrie tu)." : "Scrie ce povestește.");
    let cid = consentId;
    if (consentVoice && !cid) {
      const r = await uploadForMemory(treeId, person.id, consentVoice.blob, consentVoice.name, "audio", `Acord: ${person.givenName} ${person.surname}`);
      if (r.error) return setErr(r.error);
      cid = r.id!;
      setConsentId(cid);
    }
    let audioId: string | null = null;
    if (voice) {
      const r = await uploadForMemory(treeId, person.id, voice.blob, voice.name, "audio", `Glas: ${person.givenName} – ${cur.q.text}`);
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
    <div className="grand" role="dialog" aria-modal="true" aria-label={`La bunici: ${person.givenName} povestește`}>
      <div className="grand-frame">
        <div className="grand-top">
          <span>{person.givenName} povestește{saved ? ` · ${saved} ${saved === 1 ? "poveste păstrată" : "povești păstrate"}` : ""}</span>
          <Link href={back} aria-label="Închide">×</Link>
        </div>

        {step === "intro" && (
          <div className="grand-body center">
            <div className="grand-kicker">La bunici</div>
            <Avatar p={person} size={120} />
            <h1>{person.givenName} povestește</h1>
            <p>Ține telefonul între voi. Pe ecran apare o întrebare cu litere mari; {person.givenName} povestește, iar telefonul înregistrează. Fiecare răspuns intră în lada {ei} cu amintiri.</p>
            <p className="grand-small">Tu apeși butoanele. Poți sări peste orice întrebare și te poți opri oricând.</p>
            <button className="btn primary grand-go" onClick={() => setStep("consent")}>Începem</button>
          </div>
        )}

        {step === "consent" && (
          <div className="grand-body">
            <div className="grand-kicker">Întâi, acordul {ei}</div>
            <p className="grand-q">{person.givenName}, ești de acord să păstrăm poveștile tale în arbore, ca să le asculte familia?</p>
            {storage && (
              <div className="grand-box">
                <div className="grand-small">Dacă vrei, înregistrează-i răspunsul: rămâne lângă fiecare poveste.</div>
                <VoiceRecorder value={consentVoice} onChange={setConsentVoice} maxSeconds={60} label="Înregistrează-i răspunsul" />
              </div>
            )}
            <fieldset className="grand-box grand-choices">
              <legend>Cine le poate asculta?</legend>
              <label><input type="radio" name="cine" checked={visibility === "tree"} onChange={() => setVisibility("tree")} /> Toată familia din arbore</label>
              <label><input type="radio" name="cine" checked={visibility === "close"} onChange={() => setVisibility("close")} /> Doar familia apropiată</label>
              <label><input type="checkbox" checked={inBook} onChange={(e) => setInBook(e.target.checked)} /> Pot intra și în Cartea neamului, pe hârtie</label>
              {hasFaith && (
                <label><input type="checkbox" checked={faithOk} onChange={(e) => setFaithOk(e.target.checked)} />
                  <span>E de acord să păstrăm și ce spune despre credința {ei}{!faithOk && <span className="grand-small"> (fără acest acord, sărim peste întrebările despre credință)</span>}</span></label>
              )}
            </fieldset>
            <div className="actions grand-actions">
              <button className="btn primary grand-go" onClick={() => setStep("ask")}>Da, e de acord</button>
              <Link className="btn" href={back}>Nu acum</Link>
            </div>
          </div>
        )}

        {step === "ask" && (cur ? (
          <div className="grand-body">
            <div className="grand-kicker">{cur.q.askedId ? `Întrebare de la ${cur.q.askedBy ?? "familie"}` : chapterLabel(cur.q.chapter)}</div>
            <p className="grand-q">{cur.q.text}</p>
            {storage && <VoiceRecorder big value={voice} onChange={setVoice} label="Apasă și povestește" />}
            {storage && !typing && <button className="linklike grand-type" onClick={() => setTyping(true)}>Scriu eu ce spune</button>}
            {typing && (
              <textarea className="grand-text" value={text} onChange={(e) => setText(e.target.value)} maxLength={20000} rows={5}
                placeholder={`Scrie aici, cu vorbele ${ei}, ce povestește…`} aria-label="Ce povestește" />
            )}
            {cur.q.askedId && cur.q.askedBy && (
              <label className="grand-check"><input type="checkbox" checked={onlyAsker} onChange={(e) => setOnlyAsker(e.target.checked)} /> Răspunsul îl aude doar {cur.q.askedBy}, care a întrebat</label>
            )}
            {err && <p className="err" role="alert">{err}</p>}
            <div className="actions grand-actions">
              <button className="btn primary grand-go" disabled={pending || (!voice && !text.trim())} onClick={keep}>{pending ? (voice ? "Se încarcă glasul…" : "Se păstrează…") : "Păstrează povestea"}</button>
              {left.length > 1 && <button className="btn" disabled={pending} onClick={next}>Altă întrebare</button>}
            </div>
          </div>
        ) : (
          <div className="grand-body center">
            <h1>Gata cu întrebările de azi</h1>
            <p>Mulțumim, {person.givenName}!</p>
            <Link className="btn primary grand-go" href={`${back}#lada`}>Vezi lada {ei}</Link>
          </div>
        ))}

        {step === "saved" && (
          <div className="grand-body center">
            <div className="grand-kicker">Păstrată</div>
            <h1>Am pus-o în lada {ei}.</h1>
            <p>Familia o poate asculta de pe profilul {ei}.</p>
            <div className="actions grand-actions" style={{ justifyContent: "center" }}>
              {left.length > 0 && <button className="btn primary grand-go" onClick={() => { setStep("ask"); setErr(null); }}>Încă o întrebare</button>}
              <Link className="btn" href={`${back}#lada`}>Gata pentru azi</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
