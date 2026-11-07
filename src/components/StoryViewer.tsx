"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "use-intl";
import { andList } from "@/lib/questions";
import { Avatar } from "./Avatar";

export type StoryMemory = {
  id: string; title: string | null; question: string | null; body: string; when: string; photoId: string | null;
  mentions: string[]; from: string | null; replies: number;
  audioId: string | null; audioSeconds: number | null; recordedBy: string | null;
};
type Who = { givenName: string; surname: string; photoId: string | null; accountImage?: string | null };
export type Slide =
  | { kind: "cover"; name: string; dates: string; who: Who; count: number; kicker: string }
  | { kind: "chapter"; label: string; kicker: string; count: number }
  | { kind: "memory"; chapter: string; m: StoryMemory }
  | { kind: "end"; givenName: string; isOwner: boolean; living: boolean; drafts: number; writeHref: string | null };

/**
 * Povestea unui om, filă cu filă, ca pe telefon: atingi în dreapta pentru mai departe, în stânga pentru înapoi,
 * sau tragi cu degetul; pe calculator merg și săgețile, iar Escape te duce înapoi la profil.
 */
export default function StoryViewer({ slides, back, title }: { slides: Slide[]; back: string; title: string }) {
  const [i, setI] = useState(0);
  const router = useRouter();
  const t = useTranslations("Story"), locale = useLocale();
  const many = (count: number) => t("memories", { count });
  const n = slides.length;
  const go = useCallback((d: number) => setI((x) => Math.min(n - 1, Math.max(0, x + d))), [n]);
  const down = useRef<{ x: number; y: number; t: number } | null>(null);

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "PageDown" || (e.key === " " && !(e.target as HTMLElement).closest("button,a"))) { e.preventDefault(); go(1); }
      else if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); go(-1); }
      else if (e.key === "Escape") router.push(back);
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [go, back, router]);

  const onUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = down.current;
    down.current = null;
    if (!d || (e.target as HTMLElement).closest("a,button,audio")) return;
    const dx = e.clientX - d.x, dy = e.clientY - d.y;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) return go(dx < 0 ? 1 : -1);
    if (Math.abs(dx) < 10 && Math.abs(dy) < 10 && Date.now() - d.t < 600) {
      const r = e.currentTarget.getBoundingClientRect();
      go(e.clientX - r.left < r.width / 3 ? -1 : 1);
    }
  };

  const s = slides[i];
  return (
    <div className="story" role="dialog" aria-modal="true" aria-label={t("aria", { name: title })}>
      <div className="story-frame" onPointerDown={(e) => { down.current = { x: e.clientX, y: e.clientY, t: Date.now() }; }} onPointerUp={onUp} onPointerCancel={() => { down.current = null; }}>
        <div className="story-bars" aria-hidden>
          {n > 30 ? <span className="one"><i style={{ width: `${((i + 1) / n) * 100}%` }} /></span>
            : slides.map((_, k) => <span key={k} className={k <= i ? "done" : ""} />)}
        </div>
        <div className="story-top"><span>{title}</span><Link href={back} aria-label={t("close")}>×</Link></div>
        <div className="story-slide" key={i} aria-live="polite">
          {s.kind === "cover" && (
            <div className="story-cover">
              <div className="story-kicker">{s.kicker}</div>
              <Avatar p={s.who} size={132} />
              <h1>{s.name}</h1>
              {s.dates && <div className="story-dates">{s.dates}</div>}
              <p>{s.count ? many(s.count) : t("empty")}</p>
              {n > 2 && <small className="story-hint">{t("hint")}</small>}
            </div>
          )}
          {s.kind === "chapter" && (
            <div className="story-chapter">
              <div className="story-kicker">{s.kicker}</div>
              <h2>{s.label}</h2>
              <p>{many(s.count)}</p>
            </div>
          )}
          {s.kind === "memory" && (
            <article className="story-memory">
              <div className="story-kicker">{s.chapter}</div>
              {s.m.photoId && <img className="photo" src={`/api/document/${s.m.photoId}`} alt="" draggable={false} />}
              {s.m.title && <h3>{s.m.title}</h3>}
              {s.m.question && <p className="q">{t("quoted", { text: s.m.question })}</p>}
              {s.m.audioId && <audio className="story-audio" controls preload="none" src={`/api/document/${s.m.audioId}`} />}
              {s.m.body && <p className="body">{s.m.body}</p>}
              {s.m.when && <div className="meta">{s.m.when}</div>}
              {s.m.mentions.length > 0 && <div className="meta">{t("with", { names: andList(s.m.mentions, locale) })}</div>}
              {s.m.from && <div className="meta">{t("writtenBy", { name: s.m.from })}</div>}
              {s.m.recordedBy && <div className="meta">{t("recordedBy", { name: s.m.recordedBy })}</div>}
              {s.m.replies > 0 && <Link className="story-replies" href={`${back}#amintire-${s.m.id}`}>{t("replies", { count: s.m.replies })} ›</Link>}
            </article>
          )}
          {s.kind === "end" && (
            <div className="story-end">
              <div className="story-kicker">{t("endKicker")}</div>
              <h2>{s.isOwner ? t("endOwner") : s.living ? t("endLiving", { name: s.givenName }) : t("endDeceased", { name: s.givenName })}</h2>
              <div className="actions" style={{ justifyContent: "center" }}>
                {s.isOwner && <Link className="btn primary" href={`${back}#lada`}>{t("writeMore")}</Link>}
                {!s.isOwner && s.living && <Link className="btn primary" href={`${back}#lada`}>{t("leaveQuestion")}</Link>}
                {!s.isOwner && !s.living && s.writeHref && <Link className="btn primary" href={s.writeHref}>{t("writeWith", { name: s.givenName })}</Link>}
                <button className="btn" onClick={() => setI(0)}>{t("restart")}</button>
                <Link className="btn" href={back}>{t("backToProfile")}</Link>
              </div>
              {s.isOwner && s.drafts > 0 && <small>{t("drafts", { count: String(s.drafts) })}</small>}
            </div>
          )}
        </div>
        <div className="story-nav">
          <button onClick={() => go(-1)} disabled={i === 0} aria-label={t("prev")}>‹</button>
          <span>{i + 1} / {n}</span>
          <button onClick={() => go(1)} disabled={i === n - 1} aria-label={t("next")}>›</button>
        </div>
      </div>
    </div>
  );
}
