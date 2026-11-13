"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "use-intl";
import { shrinkPhoto } from "@/lib/shrink-photo";

const KINDS = ["eroare", "arbore", "idee", "altceva"] as const;
const MAX_IMAGES = 3;
const MAX_MESSAGE = 4000;
type Err = "message" | "tooLong" | "tooMany" | "tooManyImages" | "tooBig" | "imageType" | "storageOff" | "failed" | "signIn" | "demo";

/**
 * Formularul „Raportează o problemă”: felul problemei, textul și până la 3 poze ale ecranului. Pozele se micșorează în browser
 * (cel mult 1600 px), ca să plece repede și pe date mobile. Pagina din care a venit omul o trimitem noi, fără să-l întrebăm.
 */
export default function ProblemForm({ page, kind: startKind }: { page: string | null; kind?: string }) {
  const t = useTranslations("Problem");
  const router = useRouter();
  const [kind, setKind] = useState<string>(KINDS.includes(startKind as (typeof KINDS)[number]) ? startKind! : "eroare");
  const [message, setMessage] = useState("");
  const [pics, setPics] = useState<{ file: File; url: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<Err | null>(null);
  const [sent, setSent] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const urls = useRef<string[]>([]);
  useEffect(() => () => urls.current.forEach((u) => URL.revokeObjectURL(u)), []);

  const add = async (list: FileList | null) => {
    if (!list?.length) return;
    setError(null);
    const room = MAX_IMAGES - pics.length;
    const chosen = [...list].filter((f) => f.type.startsWith("image/") || /\.(jpe?g|png|webp|heic)$/i.test(f.name));
    if (chosen.length > room) setError("tooManyImages");
    const small = await Promise.all(chosen.slice(0, Math.max(0, room)).map((f) => shrinkPhoto(f)));
    const next = small.map((file) => { const url = URL.createObjectURL(file); urls.current.push(url); return { file, url }; });
    setPics((p) => [...p, ...next].slice(0, MAX_IMAGES));
    if (input.current) input.current.value = "";
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim().length < 5) { setError("message"); return; }
    setBusy(true);
    setError(null);
    const fd = new FormData();
    fd.set("kind", kind);
    fd.set("message", message);
    if (page) fd.set("page", page);
    fd.set("screen", `${window.innerWidth}×${window.innerHeight}`);
    for (const p of pics) fd.append("images", p.file, p.file.name);
    try {
      const r = await fetch("/api/problema", { method: "POST", body: fd });
      const j = (await r.json().catch(() => ({}))) as { ok?: boolean; error?: Err };
      if (r.ok && j.ok) {
        setSent(true);
        setMessage("");
        setPics([]);
        router.refresh();
      } else setError(j.error ?? (r.status === 413 ? "tooBig" : "failed"));
    } catch {
      setError("failed");
    } finally {
      setBusy(false);
    }
  };

  if (sent) {
    return (
      <div className="stack" role="status">
        <p className="contact-sent">{t("sent")}</p>
        <div><button type="button" className="btn" onClick={() => setSent(false)}>{t("another")}</button></div>
      </div>
    );
  }
  return (
    <form onSubmit={submit} className="form problem-form">
      <fieldset className="problem-kinds">
        <legend>{t("kindLabel")}</legend>
        {KINDS.map((k) => (
          <label key={k} className={`problem-kind${kind === k ? " on" : ""}`}>
            <input type="radio" name="kind" value={k} checked={kind === k} onChange={() => setKind(k)} />
            <span>{t(`kinds.${k}`)}</span>
          </label>
        ))}
      </fieldset>
      <label className="problem-message">{t("message")}
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} required rows={6} maxLength={MAX_MESSAGE} placeholder={t("messagePlaceholder")} />
      </label>
      <div className="stack" style={{ gap: 8 }}>
        <span className="problem-images-label">{t("images")}</span>
        <p className="muted" style={{ margin: 0, fontSize: 14 }}>{t("imagesHelp")}</p>
        {pics.length > 0 && (
          <ul className="problem-pics">
            {pics.map((p, i) => (
              <li key={p.url}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt="" />
                <button type="button" className="btn" onClick={() => setPics((all) => all.filter((_, j) => j !== i))}>{t("remove")}</button>
              </li>
            ))}
          </ul>
        )}
        {pics.length < MAX_IMAGES && (
          <div>
            <input ref={input} id="problem-files" type="file" accept="image/*" multiple className="sr-only" tabIndex={-1} aria-hidden="true" onChange={(e) => add(e.target.files)} />
            <button type="button" className="btn" onClick={() => input.current?.click()}>{t("addImages")}</button>
          </div>
        )}
      </div>
      {page && <p className="muted" style={{ fontSize: 14, margin: 0 }}>{t("pageNote", { page })}</p>}
      {error && <p className="err" role="alert">{t(`errors.${error}`)}</p>}
      <div className="actions"><button className="btn primary" disabled={busy}>{busy ? t("sending") : t("send")}</button></div>
      <p className="muted" style={{ fontSize: 14, margin: 0 }}>{t.rich("privacyNote", { privacy: (c) => <a href="/confidentialitate">{c}</a> })}</p>
    </form>
  );
}
