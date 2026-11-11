"use client";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useTranslations } from "use-intl";
import type { FilmData, Frame, Reel } from "@/lib/family-film";
import { proposeHomePhoto, withdrawHomePhoto } from "@/app/film-actions";
import "./family-film.css";

export type MyProposal = { id: string; documentId: string | null; caption: string | null; status: string };

const src = (f: Pick<Frame, "id">) => `/api/document/${f.id}`;
const SLIDE_MS = 6000;

/**
 * „Filmul vieții” de pe profil: o bandă de film care curge singură cu pozele omului și ale familiei, în ordinea anilor,
 * rolele de film (câte una pentru fiecare rudă cu poze) și proiectorul, care le arată mari, ca pe un film vechi.
 * Din proiector, o poză din album se poate propune pentru bannerul de pe prima pagină (cu acord, apoi aprobare).
 */
export default function FamilyFilm({ treeId, name, film, canPropose, proposals }: {
  treeId: string; name: string; film: FilmData; canPropose: boolean; proposals: MyProposal[];
}) {
  const t = useTranslations("Film");
  const [show, setShow] = useState<{ frames: Frame[]; at: number; title: string } | null>(null);
  const span = useMemo(() => {
    const ys = film.life.map((f) => f.year).filter((y): y is number => y != null);
    return ys.length ? (Math.min(...ys) === Math.max(...ys) ? `${ys[0]}` : `${Math.min(...ys)}–${Math.max(...ys)}`) : null;
  }, [film.life]);
  const reelTitle = (r: Reel) => r.role === "memories" ? t("roles.memories") : r.role === "self" ? t("roles.self") : t(`roles.${r.role}`, { sex: r.sex });

  // Banda curge în buclă: conținutul e pus de două ori; cu puține poze, se repetă până umple banda.
  const loop = useMemo(() => {
    if (!film.life.length) return [];
    const reps = Math.max(1, Math.ceil(8 / film.life.length));
    return Array.from({ length: reps }, () => film.life).flat();
  }, [film.life]);

  return (
    <section className="ff" id="film" aria-labelledby="ff-title">
      <div className="ff-head">
        <div>
          <div className="ff-eyebrow">{t("eyebrow")}{span ? <> · <span className="ff-span">{span}</span></> : null}</div>
          <h2 id="ff-title" className="ff-title">{t("title", { name })}</h2>
          <p className="ff-lead">{film.total ? t("lead", { name, count: film.total }) : t("empty", { name })}</p>
        </div>
        {film.life.length > 0 && (
          <button className="ff-play" onClick={() => setShow({ frames: film.life, at: 0, title: t("eyebrow") })}>
            <span aria-hidden className="ff-play-dot">▶</span>{t("play")}
          </button>
        )}
      </div>

      {film.life.length > 0 ? (
        <div className="ff-strip" role="region" aria-label={t("stripLabel")} tabIndex={0}>
          <div className="ff-track" style={{ ["--ff-dur" as string]: `${Math.max(30, loop.length * 5)}s` }}>
            {[0, 1].map((half) => (
              <div className="ff-half" key={half} aria-hidden={half === 1 || undefined}>
                {loop.map((f, i) => (
                  <button key={`${half}-${i}`} className="ff-cell" tabIndex={half ? -1 : 0}
                    onClick={() => setShow({ frames: film.life, at: i % film.life.length, title: t("eyebrow") })}>
                    <img src={src(f)} alt={half ? "" : f.caption ?? f.title} loading="lazy" draggable={false} />
                    <span className="ff-edge">{f.year ?? "····"}</span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="ff-strip ff-strip-empty" aria-hidden>
          <div className="ff-half">{Array.from({ length: 8 }, (_, i) => <span className="ff-cell" key={i} />)}</div>
        </div>
      )}
      {!film.total && <p className="ff-empty-cta"><a href="#album">{t("addPhotos")}</a></p>}

      {film.reels.length > 0 && (
        <>
          <div className="ff-sub">
            <h3>{t("reelsTitle")}</h3>
            <p>{t("reelsLead")}</p>
          </div>
          <div className="ff-reels">
            {film.reels.map((r) => (
              <button key={r.id} className="ff-reel" onClick={() => setShow({ frames: r.frames, at: 0, title: r.name ?? reelTitle(r) })}>
                <span className="ff-stack" aria-hidden>
                  {r.frames.slice(0, 3).reverse().map((f, i, a) => <img key={f.id} src={src(f)} alt="" loading="lazy" style={{ ["--i" as string]: a.length - 1 - i }} />)}
                </span>
                <span className="ff-reel-text">
                  <small>{reelTitle(r)}</small>
                  {r.name && <b>{r.name}</b>}
                  <span>{[r.years, t("frames", { count: r.frames.length })].filter(Boolean).join(" · ")}</span>
                </span>
              </button>
            ))}
          </div>
        </>
      )}

      {proposals.length > 0 && <MyProposals proposals={proposals} />}

      {show && createPortal(<Projector treeId={treeId} frames={show.frames} start={show.at} title={show.title} canPropose={canPropose}
        proposed={new Set(proposals.filter((p) => p.status !== "rejected").map((p) => p.documentId ?? ""))} onClose={() => setShow(null)} />, document.body)}
    </section>
  );
}

function MyProposals({ proposals }: { proposals: MyProposal[] }) {
  const t = useTranslations("Film");
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  return (
    <div className="ff-mine">
      <h3>{t("mine")}</h3>
      <ul>
        {proposals.map((p) => (
          <li key={p.id}>
            {p.documentId && <img src={`/api/document/${p.documentId}`} alt="" loading="lazy" />}
            <span>
              <b className={`ff-status ff-status-${p.status}`}>{t(`status.${p.status === "approved" || p.status === "rejected" ? p.status : "pending"}`)}</b>
              {p.caption && <small>{p.caption}</small>}
            </span>
            <button className="ff-link" disabled={pending} onClick={() => start(async () => {
              const r = await withdrawHomePhoto(p.id);
              setErr(r.error ?? null);
              if (!r.error) router.refresh();
            })}>{t("withdraw")}</button>
          </li>
        ))}
      </ul>
      <p className="ff-note">{t("mineNote")}</p>
      {err && <p className="err">{err}</p>}
    </div>
  );
}

/** Proiectorul: o poză mare odată, cu granulație, pâlpâire și zgârieturi de film vechi; merge singur sau cu săgețile. */
function Projector({ treeId, frames, start, title, canPropose, proposed, onClose }: {
  treeId: string; frames: Frame[]; start: number; title: string; canPropose: boolean; proposed: Set<string>; onClose: () => void;
}) {
  const t = useTranslations("Film");
  const [at, setAt] = useState(start);
  const [playing, setPlaying] = useState(frames.length > 1);
  const [leader, setLeader] = useState(true);
  const [form, setForm] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const f = frames[at];
  const go = useCallback((d: number) => { setForm(false); setAt((x) => (x + d + frames.length) % frames.length); }, [frames.length]);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const id = setTimeout(() => setLeader(false), reduce ? 0 : 1600);
    closeRef.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { clearTimeout(id); document.body.style.overflow = prev; };
  }, []);
  useEffect(() => {
    if (!playing || leader || form) return;
    const id = setTimeout(() => go(1), SLIDE_MS);
    return () => clearTimeout(id);
  }, [playing, leader, form, at, go]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest?.("textarea, input")) return;
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
      else if (e.key === " ") { e.preventDefault(); setPlaying((p) => !p); }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [go, onClose]);

  return (
    <div className="ff-proj" role="dialog" aria-modal="true" aria-label={title}>
      <div className="ff-grain" aria-hidden />
      <div className="ff-proj-top">
        <span className="ff-proj-title">{title}</span>
        <span className="ff-count">{t("counter", { n: String(at + 1), total: String(frames.length) })}</span>
        <button ref={closeRef} className="ff-x" onClick={onClose} aria-label={t("close")}>✕</button>
      </div>
      <div className="ff-screen">
        {leader ? (
          <div className="ff-leader" aria-hidden><span>3</span><span>2</span><span>1</span></div>
        ) : (
          <figure className="ff-shot" key={f.id}>
            <div className="ff-pic"><img src={src(f)} alt={f.caption ?? f.title} /><div className="ff-scratch" aria-hidden /></div>
            <figcaption>
              <span className="ff-when">{[f.when ?? (f.year ? String(f.year) : null), f.age != null ? t("age", { age: f.age }) : null].filter(Boolean).join(" · ")}</span>
              <b>{f.title}</b>
              {f.caption && f.caption !== f.title && <span className="ff-cap">{f.caption}</span>}
            </figcaption>
          </figure>
        )}
      </div>
      <div className="ff-controls">
        <button onClick={() => go(-1)} aria-label={t("prev")} disabled={frames.length < 2}>‹</button>
        <button onClick={() => setPlaying((p) => !p)} aria-label={playing ? t("pause") : t("resume")} disabled={frames.length < 2}>{playing ? "❚❚" : "▶"}</button>
        <button onClick={() => go(1)} aria-label={t("next")} disabled={frames.length < 2}>›</button>
        {canPropose && !leader && f.source === "album" && (proposed.has(f.id)
          ? <span className="ff-proposed">{t("alreadyProposed")}</span>
          : <button className="ff-propose" onClick={() => { setForm((x) => !x); setPlaying(false); }}>{t("propose")}</button>)}
        {canPropose && !leader && f.source === "memory" && <span className="ff-proposed">{t("memoryNote")}</span>}
      </div>
      {form && <ProposeForm treeId={treeId} frame={f} onDone={() => setForm(false)} />}
    </div>
  );
}

function ProposeForm({ treeId, frame, onDone }: { treeId: string; frame: Frame; onDone: () => void }) {
  const t = useTranslations("Film");
  const router = useRouter();
  const [caption, setCaption] = useState("");
  const [consent, setConsent] = useState(false);
  const [msg, setMsg] = useState<{ ok?: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  if (msg?.ok) return (
    <div className="ff-form"><p className="ff-ok">{msg.text}</p><button className="ff-propose" onClick={onDone}>{t("closeForm")}</button></div>
  );
  return (
    <form className="ff-form" onSubmit={(e) => {
      e.preventDefault();
      start(async () => {
        const r = await proposeHomePhoto({ treeId, docId: frame.id, caption, consent });
        if (r.error) setMsg({ text: r.error });
        else { setMsg({ ok: true, text: t("sent") }); router.refresh(); }
      });
    }}>
      <h3>{t("proposeTitle")}</h3>
      <p>{t("proposeLead")}</p>
      <label>{t("captionLabel")}
        <input value={caption} onChange={(e) => setCaption(e.target.value)} maxLength={120} placeholder={t("captionPlaceholder")} />
      </label>
      <label className="ff-check"><input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} /> <span>{t("consent")}</span></label>
      {msg && <p className="ff-err">{msg.text}</p>}
      <div className="ff-form-actions">
        <button type="submit" className="ff-propose ff-primary" disabled={pending || !consent}>{t("send")}</button>
        <button type="button" className="ff-link" onClick={onDone}>{t("cancel")}</button>
      </div>
    </form>
  );
}
