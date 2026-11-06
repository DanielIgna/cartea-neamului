"use client";
import { useRef, useState, useTransition } from "react";
import { saveMemory } from "@/app/lada-actions";
import { CHAPTERS, type Chapter } from "@/lib/questions";
import type { Visibility } from "@/lib/lada";
import type { MemoryView } from "@/lib/lada-db";
import { FAITH_CONSENT_TEXT } from "@/lib/legal";
import { shrinkPhoto } from "./PhotoPick";
import VoiceRecorder, { clock, uploadForMemory, type Voice } from "./VoiceRecorder";

export type PersonOption = { id: string; name: string; years: string };
export type Draft = { question?: string | null; questionKey?: string | null; askedId?: string | null; askedByName?: string | null; chapter?: Chapter; mentions?: string[] };

/**
 * Scrisul unei amintiri: textul, capitolul, când și unde, o poză, cine mai e în ea și cine o vede.
 * La o întrebare de la o rudă se poate alege ca răspunsul să-l vadă doar cel care a întrebat.
 * În capitolul „Credința”, la primul răspuns (sau la una înregistrată „la bunici” pentru altcineva), cere acordul explicit.
 */
export default function MemoryForm({ treeId, ownerId, ownerName, people, storage, defaultDegree, draft, edit, faithConsent = false, onDone, onCancel }: {
  treeId: string; ownerId: string; ownerName: string; people: PersonOption[]; storage: boolean; defaultDegree: number;
  draft?: Draft; edit?: MemoryView; faithConsent?: boolean; onDone: (msg: string) => void; onCancel: () => void;
}) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [mentions, setMentions] = useState<string[]>(edit?.mentions.map((m) => m.personId) ?? draft?.mentions ?? []);
  const [visibility, setVisibility] = useState<Visibility>(edit?.visibility ?? (draft?.askedId ? "asker" : "tree"));
  const [photo, setPhoto] = useState<File | null>(null);
  const [keepPhoto, setKeepPhoto] = useState(!!edit?.photoId);
  const [voice, setVoice] = useState<Voice | null>(null);
  const [keepAudio, setKeepAudio] = useState(!!edit?.audioId);
  const fileRef = useRef<HTMLInputElement>(null);
  const question = edit?.question ?? draft?.question ?? null;
  const askedId = edit?.askedId ?? draft?.askedId ?? null;
  const askedByName = edit?.askedBy?.name ?? draft?.askedByName ?? null;
  const name = (id: string) => people.find((p) => p.id === id)?.name ?? "";
  const [chapter, setChapter] = useState<Chapter>((edit?.chapter as Chapter | undefined) ?? draft?.chapter ?? "altele");
  // O amintire înregistrată de tine „la bunici” pentru altcineva: acordul e al lui, nu al tău.
  const forSomeoneElse = !!edit?.helper && edit.mine;
  const askFaith = chapter === "credinta" && (forSomeoneElse || !faithConsent);

  const submit = (form: FormData) => start(async () => {
    setErr(null);
    const body = String(form.get("body") ?? "").trim();
    if (!body && !voice && !keepAudio) return setErr("Scrie amintirea sau spune-o cu glasul.");
    const label = String(form.get("title") ?? "").trim() || body.slice(0, 60) || ownerName;
    let photoId = keepPhoto ? edit?.photoId ?? null : null;
    if (photo) {
      const small = await shrinkPhoto(photo);
      const r = await uploadForMemory(treeId, ownerId, small, small.name, "photo", `Amintire: ${label}`);
      if (r.error) return setErr(r.error);
      photoId = r.id!;
    }
    let audioId = keepAudio ? edit?.audioId ?? null : null, audioSeconds = keepAudio ? edit?.audioSeconds ?? null : null;
    if (voice) {
      const r = await uploadForMemory(treeId, ownerId, voice.blob, voice.name, "audio", `Glas: ${label}`);
      if (r.error) return setErr(r.error);
      audioId = r.id!;
      audioSeconds = voice.seconds || null;
    }
    const r = await saveMemory({
      treeId, personId: ownerId, id: edit?.id, chapter, faithConsent: askFaith ? form.get("faithConsent") === "on" : undefined,
      question, questionKey: edit?.questionKey ?? draft?.questionKey ?? null, askedId,
      title: String(form.get("title") ?? ""), body: String(form.get("body") ?? ""), whenText: String(form.get("whenText") ?? ""), place: String(form.get("place") ?? ""),
      photoId, audioId, audioSeconds, visibility, maxDegree: visibility === "close" ? Number(form.get("maxDegree")) || defaultDegree : null, inBook: form.get("inBook") === "on", mentions,
    });
    if (r.error) return setErr(r.error);
    onDone(edit ? "Amintirea a fost schimbată." : visibility === "private" ? "Am pus amintirea în ladă, ca ciornă: doar tu o vezi." : "Am pus amintirea în ladă.");
  });

  return (
    <form className="form memory-form" action={submit}>
      {question && <div className="memory-question">Răspunzi la: <b>„{question}”</b>{askedByName ? <> · de la {askedByName}</> : null}</div>}
      <label><span>Titlu <span className="muted">(dacă vrei)</span></span>
        <input name="title" maxLength={160} defaultValue={edit?.title ?? ""} placeholder="De pildă: Iarna cu zăpada până la streașină" />
      </label>
      <label><span>Amintirea {storage && <span className="muted">(scrisă, spusă cu glasul sau amândouă)</span>}</span>
        <textarea name="body" rows={7} maxLength={20000} defaultValue={edit?.body ?? ""}
          placeholder="Povestește cum a fost: unde erai, cine era acolo, ce s-a întâmplat, ce ai simțit…" />
      </label>
      {storage && (
        keepAudio && edit?.audioId && !voice ? (
          <div className="voice">
            <div className="voice-done">
              <audio controls preload="none" src={`/api/document/${edit.audioId}`} />
              {edit.audioSeconds ? <span className="muted">{clock(edit.audioSeconds)}</span> : null}
              <span className="voice-tools"><button type="button" className="linklike" onClick={() => setKeepAudio(false)}>Schimbă sau scoate înregistrarea</button></span>
            </div>
          </div>
        ) : <VoiceRecorder value={voice} onChange={setVoice} label="Spune-o cu glasul" />
      )}
      <div className="row">
        <label>Capitol
          <select name="chapter" value={chapter} onChange={(e) => setChapter(e.target.value as Chapter)}>
            {CHAPTERS.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
          </select>
        </label>
        <label><span>Când <span className="muted">(dacă știi)</span></span>
          <input name="whenText" maxLength={80} defaultValue={edit?.whenText ?? ""} placeholder="vara lui 1965, cca. 1970" />
        </label>
      </div>
      <div className="row">
        <label><span>Unde <span className="muted">(dacă vrei)</span></span>
          <input name="place" maxLength={160} defaultValue={edit?.place ?? ""} placeholder="Huedin, la bunici" />
        </label>
        {storage ? (
          <label><span>Poză <span className="muted">(dacă ai)</span></span>
            <span className="photo-pick">
              <button type="button" className="btn" onClick={() => fileRef.current?.click()}>{photo ? "Altă poză" : keepPhoto ? "Schimbă poza" : "Alege o poză"}</button>
              {(photo || keepPhoto) && <button type="button" className="linklike" onClick={() => { setPhoto(null); setKeepPhoto(false); }}>Scoate poza</button>}
              <span className="muted" style={{ fontSize: 13 }}>{photo ? photo.name : keepPhoto ? "poza de acum rămâne" : ""}</span>
            </span>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) setPhoto(f); }} />
          </label>
        ) : <span />}
      </div>
      <fieldset className="share">
        <legend>Cine mai e în amintire? <span className="muted">(apare și pe profilul lor)</span></legend>
        <div className="chips" style={{ margin: "2px 0" }}>
          {mentions.map((id) => (
            <span key={id} className="chip mention-chip">{name(id)} <button type="button" className="linklike" aria-label={`Scoate-l pe ${name(id)}`} onClick={() => setMentions(mentions.filter((x) => x !== id))}>×</button></span>
          ))}
        </div>
        <select value="" onChange={(e) => { const id = e.target.value; if (id && !mentions.includes(id)) setMentions([...mentions, id]); }} aria-label="Adaugă pe cineva din arbore">
          <option value="">adaugă pe cineva din arbore…</option>
          {people.filter((p) => p.id !== ownerId && !mentions.includes(p.id)).map((p) => <option key={p.id} value={p.id}>{p.name}{p.years ? ` (${p.years})` : ""}</option>)}
        </select>
      </fieldset>
      <fieldset className="share">
        <legend>Cine o vede?</legend>
        <label className="radio"><input type="radio" name="vis" checked={visibility === "tree"} onChange={() => setVisibility("tree")} /> Tot arborele</label>
        <label className="radio"><input type="radio" name="vis" checked={visibility === "close"} onChange={() => setVisibility("close")} /> Familia apropiată, până la gradul
          <select name="maxDegree" defaultValue={edit?.maxDegree ?? defaultDegree} disabled={visibility !== "close"} style={{ width: "auto", marginLeft: 6 }}>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </label>
        {askedId && askedByName && <label className="radio"><input type="radio" name="vis" checked={visibility === "asker"} onChange={() => setVisibility("asker")} /> Doar {askedByName}, care a întrebat</label>}
        <label className="radio"><input type="radio" name="vis" checked={visibility === "private"} onChange={() => setVisibility("private")} /> Doar eu, deocamdată (ciornă)</label>
        <small className="muted">Gradul 1: părinții și copiii; 2: frații și bunicii; 3: unchii și nepoții de frate; 4: verii primari. Soții văd mereu.</small>
      </fieldset>
      <label className="radio"><input type="checkbox" name="inBook" defaultChecked={edit?.inBook ?? false} /> Poate intra în Cartea neamului</label>
      {askFaith && (
        <label className="faith-consent">
          <input type="checkbox" name="faithConsent" required onChange={(e) => e.currentTarget.setCustomValidity("")}
            onInvalid={(e) => e.currentTarget.setCustomValidity("Bifează acordul ca să poți păstra răspunsul.")} />
          <span>{forSomeoneElse ? `${ownerName} e de acord să păstrăm ce a spus despre credința sa.` : FAITH_CONSENT_TEXT}</span>
        </label>
      )}
      {err && <p className="err" role="alert">{err}</p>}
      <div className="actions" style={{ marginTop: 0 }}>
        <button className="btn primary" disabled={pending}>{pending ? (voice ? "Se încarcă glasul…" : photo ? "Se încarcă poza…" : "Se salvează…") : edit ? "Salvează schimbarea" : "Pune amintirea în ladă"}</button>
        <button type="button" className="btn" disabled={pending} onClick={onCancel}>Renunță</button>
      </div>
    </form>
  );
}
