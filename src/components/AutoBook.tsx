"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "use-intl";
import type { Verse } from "@/lib/autobiografie";
import type { Chapter } from "@/lib/questions";
import type { MemoryView } from "@/lib/lada-db";
import MemoryForm, { type Draft, type PersonOption } from "./MemoryForm";
import { clock } from "./VoiceRecorder";

export type AutoQuestion = { key: string; text: string; mentions: string[] };
export type AutoChapter = { key: Chapter; title: string; intro: string; verse?: Verse; questions: AutoQuestion[] };
type Writing = { at: string; draft?: Draft; edit?: MemoryView };

const SHOWN = 5;
/** Începutul răspunsului, tăiat la un cuvânt întreg. */
const excerpt = (s: string, n = 220) => {
  const t = s.replace(/\s+/g, " ").trim();
  if (t.length <= n) return t;
  const cut = t.slice(0, n), sp = cut.lastIndexOf(" ");
  return `${(sp > n / 2 ? cut.slice(0, sp) : cut).replace(/[\s,.;:!?–-]+$/, "")}…`;
};

/**
 * Autobiografia, de scris: capitolele cărții unul sub altul, fiecare cu întrebările lui. Omul răspunde la ce vrea, în ce ordine
 * vrea, scris sau cu glasul; fiecare răspuns intră în lada lui cu amintiri, cu alegerea lui de cine îl vede.
 */
export default function AutoBook({ treeId, owner, chapters, own, people, storage, defaultDegree, verse, faithConsent }: {
  treeId: string; owner: { id: string; givenName: string }; chapters: AutoChapter[]; own: MemoryView[];
  people: PersonOption[]; storage: boolean; defaultDegree: number; verse: Verse; faithConsent: boolean;
}) {
  const router = useRouter();
  const t = useTranslations("Auto");
  const keys = new Set(chapters.flatMap((c) => c.questions.map((q) => q.key)));
  // Răspunsul la o întrebare a cărții: cel mai nou, dacă a răspuns de două ori.
  const answers = new Map<string, MemoryView>();
  for (const m of [...own].sort((a, b) => a.createdAt.localeCompare(b.createdAt))) if (m.questionKey && keys.has(m.questionKey)) answers.set(m.questionKey, m);
  const done = chapters.map((c) => c.questions.filter((q) => answers.has(q.key)).length);
  const total = chapters.reduce((n, c) => n + c.questions.length, 0), written = done.reduce((n, d) => n + d, 0);
  const firstOpen = chapters.findIndex((c, i) => done[i] < c.questions.length);
  const [open, setOpen] = useState<Set<string>>(new Set([chapters[Math.max(0, firstOpen)]?.key].filter(Boolean) as string[]));
  const [all, setAll] = useState<Set<string>>(new Set());
  const [writing, setWriting] = useState<Writing | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const toggle = (k: string) => setOpen((s) => { const n = new Set(s); if (n.has(k)) n.delete(k); else n.add(k); return n; });
  const start = (w: Writing) => {
    setMsg(null); setWriting(w);
    requestAnimationFrame(() => document.getElementById(`scrie-${w.at}`)?.scrollIntoView({ behavior: "smooth", block: "center" }));
  };
  const formProps = {
    treeId, ownerId: owner.id, ownerName: owner.givenName, people, storage, defaultDegree, faithConsent,
    onDone: (text: string) => { setWriting(null); setMsg(text); router.refresh(); }, onCancel: () => setWriting(null),
  };
  const form = (at: string) => writing?.at === at && (
    <div id={`scrie-${at}`} className="auto-form"><MemoryForm {...formProps} draft={writing.draft} edit={writing.edit} /></div>
  );
  const answer = (m: MemoryView, at: string) => (
    <div className="auto-a">
      {m.title && <b>{m.title}</b>}
      {m.body && <p>{excerpt(m.body)}</p>}
      <div className="auto-a-meta">
        {m.audioId && <span className="chip">{m.audioSeconds ? t("voicedTime", { time: clock(m.audioSeconds) }) : t("voiced")}</span>}
        {m.photoId && <span className="chip">{t("withPhoto")}</span>}
        {m.visibility === "private" && <span className="chip priv">{t("draft")}</span>}
        <button className="linklike" onClick={() => start({ at, edit: m })}>{t("change")}</button>
      </div>
    </div>
  );

  return (
    <div className="stack auto">
      <div className="card auto-head">
        <Link href={`/arbore/${treeId}/persoana/${owner.id}#lada`} style={{ fontSize: 14 }}>{t("back")}</Link>
        <div className="section-label">{t("label")}</div>
        <h2>{t("title")}</h2>
        <p>{t("lead")}</p>
        <blockquote className="auto-verse">{t("quoted", { text: verse.text })} <cite>{verse.ref}</cite></blockquote>
        <div className="auto-progress" aria-label={t("progress", { done: String(written), total })}>
          <span style={{ width: `${total ? Math.round((written / total) * 100) : 0}%` }} />
        </div>
        <div className="actions" style={{ alignItems: "center" }}>
          <span className="muted">{written ? t("progress", { done: String(written), total }) : t("waiting", { total })}</span>
          <Link className="btn primary" href={`/arbore/${treeId}/persoana/${owner.id}/autobiografie/carte`} style={{ marginLeft: "auto" }}>{t("seeBook")}</Link>
        </div>
        {msg && <p className="notice" role="status" style={{ margin: "10px 0 0" }}>{msg}</p>}
      </div>

      {chapters.map((c, ci) => {
        const isOpen = open.has(c.key);
        const free = own.filter((m) => m.chapter === c.key && !(m.questionKey && keys.has(m.questionKey))).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
        const waiting = c.questions.filter((q) => !answers.has(q.key));
        const shown = all.has(c.key) ? c.questions : c.questions.filter((q) => answers.has(q.key) || waiting.indexOf(q) < SHOWN);
        return (
          <section key={c.key} className={`card auto-ch${isOpen ? " open" : ""}`}>
            <button className="auto-ch-head" aria-expanded={isOpen} onClick={() => toggle(c.key)}>
              <span className="auto-ch-n">{ci + 1}</span>
              <span className="auto-ch-t">{c.title}</span>
              <small className={done[ci] === c.questions.length && c.questions.length ? "auto-full" : ""}>{free.length
                ? t("chapterMore", { done: String(done[ci]), total: String(c.questions.length), more: String(free.length) }) : t("chapterCount", { done: String(done[ci]), total: String(c.questions.length) })}</small>
            </button>
            {isOpen && (
              <div className="auto-ch-body">
                <p className="auto-intro">{c.intro}</p>
                {c.verse && <blockquote className="auto-verse">{t("quoted", { text: c.verse.text })} <cite>{c.verse.ref}</cite></blockquote>}
                {c.key === "credinta" && !faithConsent && (
                  <p className="faith-note">{t.rich("faithNote", { link: (x) => <Link href="/datele-mele">{x}</Link> })}</p>
                )}
                <ol className="auto-qs">
                  {shown.map((q) => {
                    const m = answers.get(q.key);
                    return (
                      <li key={q.key} className={m ? "done" : ""}>
                        <p className="auto-q">{q.text}</p>
                        {m ? (writing?.at === q.key ? null : answer(m, q.key))
                          : writing?.at !== q.key && <button className="btn" onClick={() => start({ at: q.key, draft: { question: q.text, questionKey: q.key, chapter: c.key, mentions: q.mentions } })}>{t("answer")}</button>}
                        {form(q.key)}
                      </li>
                    );
                  })}
                </ol>
                {!all.has(c.key) && shown.length < c.questions.length && (
                  <button className="linklike" onClick={() => setAll(new Set(all).add(c.key))}>{t("moreQuestions", { count: c.questions.length - shown.length })}</button>
                )}
                {free.length > 0 && (
                  <>
                    <div className="section-label">{t("alsoWrote")}</div>
                    <ul className="auto-qs auto-free">
                      {free.map((m) => (
                        <li key={m.id} className="done">
                          {m.question && <p className="auto-q">{m.question}</p>}
                          {writing?.at === m.id ? null : answer(m, m.id)}
                          {form(m.id)}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
                <div className="actions">
                  {writing?.at !== `ch-${c.key}` && <button className="btn" onClick={() => start({ at: `ch-${c.key}`, draft: { chapter: c.key } })}>{t("writeElse")}</button>}
                </div>
                {form(`ch-${c.key}`)}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
