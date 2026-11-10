"use client";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "use-intl";

/** O înregistrare gata de pus la o amintire: fișierul, cât ține și un link local ca să se poată asculta înainte de salvare. */
export type Voice = { blob: Blob; seconds: number; url: string; name: string };

// Chrome și Android înregistrează în WebM/Opus, iPhone-ul în MP4/AAC; luăm primul pe care îl știe browserul.
const TYPES = ["audio/webm;codecs=opus", "audio/mp4", "audio/ogg;codecs=opus", "audio/webm"];
const MAX_BYTES = 4 * 1024 * 1024;
const MIC_TIMEOUT_MS = 10_000;
const extOf = (type: string) => (type.includes("mp4") ? "m4a" : type.includes("ogg") ? "ogg" : "webm");
export const clock = (s: number | null | undefined) => (s ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}` : "");

/**
 * Încarcă poza sau glasul unei amintiri; fișierul nu intră în album și îl deschide doar cine vede amintirea.
 * `failed` e textul arătat când serverul nu spune de ce n-a mers (de pildă când s-a rupt legătura).
 */
export async function uploadForMemory(treeId: string, personId: string, file: Blob, name: string, kind: "photo" | "audio", title: string, failed: string) {
  const up = new FormData();
  up.set("personId", personId);
  up.set("kind", kind);
  up.set("forMemory", "on");
  up.set("title", title.slice(0, 200));
  up.set("file", file, name);
  const res = await fetch(`/api/arbore/${treeId}/documente`, { method: "POST", body: up });
  const json = (await res.json().catch(() => ({}))) as { id?: string; error?: string };
  if (!res.ok || !json.id) return { error: json.error ?? failed };
  return { id: json.id };
}

/**
 * Glasul din telefon sau din calculator: apeși, povestești, apeși „Gata”; asculți și, dacă vrei, reînregistrezi.
 * Merge și cu un mesaj vocal deja salvat (de pildă de pe WhatsApp), încărcat ca fișier. O înregistrare ține cel mult 5 minute.
 */
export default function VoiceRecorder({ value, onChange, big = false, maxSeconds = 300, label: wanted }: {
  value: Voice | null; onChange: (v: Voice | null) => void; big?: boolean; maxSeconds?: number; label?: string;
}) {
  const t = useTranslations("Voice");
  const label = wanted ?? t("record");
  const [state, setState] = useState<"idle" | "asking" | "recording">("idle");
  const [secs, setSecs] = useState(0);
  const [err, setErr] = useState<string | null>(null);
  const rec = useRef<MediaRecorder | null>(null);
  const timer = useRef<number | null>(null);
  const started = useRef(0);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => () => {
    if (timer.current) window.clearInterval(timer.current);
    rec.current?.stream.getTracks().forEach((t) => t.stop());
  }, []);

  // Cererea de microfon: dacă omul nu răspunde la întrebarea browserului (sau browserul n-o arată deloc) în 10 secunde,
  // ne oprim și spunem ce poate face, în loc să rămânem la „Pornește microfonul…”. Un microfon venit după aceea se oprește.
  const askMic = () => new Promise<MediaStream>((resolve, reject) => {
    let late = false;
    const timeout = window.setTimeout(() => { late = true; reject(new DOMException("timeout", "TimeoutError")); }, MIC_TIMEOUT_MS);
    navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } }).then(
      (s) => { window.clearTimeout(timeout); if (late) s.getTracks().forEach((x) => x.stop()); else resolve(s); },
      (e) => { window.clearTimeout(timeout); if (!late) reject(e); },
    );
  });
  const micError = (e: unknown) => {
    const name = e instanceof DOMException || e instanceof Error ? e.name : "";
    if (name === "NotAllowedError" || name === "PermissionDeniedError" || name === "SecurityError") return t("noMic");
    if (name === "NotFoundError" || name === "DevicesNotFoundError" || name === "OverconstrainedError") return t("noDevice");
    if (name === "NotReadableError" || name === "TrackStartError" || name === "AbortError") return t("micBusy");
    if (name === "TimeoutError") return t("micTimeout");
    return t("micFailed");
  };

  const start = async () => {
    setErr(null);
    const ok = typeof window !== "undefined" && typeof MediaRecorder !== "undefined" && !!navigator.mediaDevices?.getUserMedia;
    if (!ok) return setErr(t("noRecorder"));
    const type = TYPES.find((t) => MediaRecorder.isTypeSupported?.(t)) ?? "";
    setState("asking");
    let stream: MediaStream;
    try {
      stream = await askMic();
    } catch (e) {
      setState("idle");
      return setErr(micError(e));
    }
    const r = new MediaRecorder(stream, { ...(type ? { mimeType: type } : {}), audioBitsPerSecond: 48_000 });
    const chunks: Blob[] = [];
    r.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
    r.onstop = () => {
      stream.getTracks().forEach((t) => t.stop());
      if (timer.current) window.clearInterval(timer.current);
      const seconds = Math.max(1, Math.round((Date.now() - started.current) / 1000));
      const blobType = (r.mimeType || type || "audio/webm").split(";")[0];
      const blob = new Blob(chunks, { type: blobType });
      setState("idle");
      if (blob.size < 500) return setErr(t("nothing"));
      if (blob.size > MAX_BYTES) return setErr(t("tooBig"));
      onChange({ blob, seconds, url: URL.createObjectURL(blob), name: `glas-${new Date().toISOString().slice(0, 10)}.${extOf(blobType)}` });
    };
    rec.current = r;
    started.current = Date.now();
    setSecs(0);
    r.start(1000);
    setState("recording");
    timer.current = window.setInterval(() => {
      const s = Math.floor((Date.now() - started.current) / 1000);
      setSecs(s);
      if (s >= maxSeconds && r.state !== "inactive") r.stop();
    }, 250);
  };
  const stop = () => { if (rec.current && rec.current.state !== "inactive") rec.current.stop(); };

  const pick = (f: File) => {
    setErr(null);
    if (f.size > MAX_BYTES) return setErr(t("fileTooBig"));
    const url = URL.createObjectURL(f);
    const a = new Audio();
    a.preload = "metadata";
    const done = () => onChange({ blob: f, seconds: Number.isFinite(a.duration) ? Math.round(a.duration) : 0, url, name: f.name });
    a.onloadedmetadata = done;
    a.onerror = done;
    a.src = url;
  };

  return (
    <div className={`voice${big ? " big" : ""}`}>
      {state === "recording" ? (
        <div className="voice-live" role="status">
          <span className="voice-dot" aria-hidden />
          <span className="voice-clock">{clock(secs) || "0:00"}<small> / {clock(maxSeconds)}</small></span>
          <button type="button" className="btn primary voice-stop" onClick={stop}>{t("stop")}</button>
        </div>
      ) : value ? (
        <div className="voice-done">
          <audio controls src={value.url} preload="metadata" />
          {value.seconds > 0 && <span className="muted">{clock(value.seconds)}</span>}
          <span className="voice-tools">
            <button type="button" className="linklike" onClick={() => { onChange(null); void start(); }}>{t("again")}</button>
            <button type="button" className="linklike" onClick={() => onChange(null)}>{t("remove")}</button>
          </span>
        </div>
      ) : (
        <div className="voice-idle">
          <button type="button" className={big ? "voice-rec" : "btn"} onClick={start} disabled={state === "asking"} aria-label={label}>
            {big ? <><span className="voice-rec-dot" aria-hidden /><span>{state === "asking" ? t("starting") : label}</span></> : <>● {state === "asking" ? t("starting") : label}</>}
          </button>
          <button type="button" className="linklike voice-file" onClick={() => fileRef.current?.click()}>{t("uploadFile")}</button>
          <input ref={fileRef} type="file" accept="audio/*,.opus,.m4a" hidden onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) pick(f); }} />
        </div>
      )}
      {state !== "recording" && !value && <p className="muted voice-limit">{t("limit", { minutes: Math.round(maxSeconds / 60) })}</p>}
      {err && (
        <div className="err voice-err" role="alert">
          <p style={{ margin: 0 }}>{err}</p>
          {!value && state === "idle" && (
            <p style={{ margin: "6px 0 0" }}>
              <button type="button" className="btn" onClick={start}>{t("retry")}</button>{" "}
              <button type="button" className="linklike" onClick={() => fileRef.current?.click()}>{t("uploadFile")}</button>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
