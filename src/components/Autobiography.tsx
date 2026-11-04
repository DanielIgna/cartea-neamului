"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { saveMemory } from "@/app/lada-actions";
import { bookProgress, FAITH_VERSE, type BookChapter, type BookQuestion } from "@/lib/autobiografie";
import { VISIBILITY_LABEL, type Visibility } from "@/lib/lada";
import { chapterLabel } from "@/lib/questions";
import type { MemoryView } from "@/lib/lada-db";

const CHOICES: Visibility[] = ["private", "close", "tree"];

/** O întrebare din carte: răspunsul e o amintire din ladă, iar la o schimbare păstrăm tot ce avea deja (poză, glas, loc). */
function Answer({ q, chapter, treeId, personId, saved }: { q: BookQuestion; chapter: string; treeId: string; personId: string; saved?: MemoryView }) {
  const router = useRouter();
  const [text, setText] = useState(saved?.body ?? "");
  const [visibility, setVisibility] = useState<Visibility>(saved?.visibility ?? "private");
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const changed = text.trim() !== (saved?.body ?? "") || visibility !== (saved?.visibility ?? "private");
  const save = () => start(async () => {
    const r = await saveMemory({
      treeId, personId, id: saved?.id, chapter, question: q.text, questionKey: q.key, body: text, visibility,
      title: saved?.title, whenText: saved?.whenText, place: saved?.place, photoId: saved?.photoId, audioId: saved?.audioId, audioSeconds: saved?.audioSeconds,
      maxDegree: saved?.maxDegree, inBook: saved?.inBook, mentions: saved?.mentions.map((m) => m.personId),
    });
    if ("error" in r) setMsg(r.error ?? "Nu s-a putut salva."); else { setMsg("Salvat."); router.refresh(); }
  });
  return (
    <div className="auto-q">
      <label htmlFor={q.key}><b>{q.text}</b></label>
      <textarea id={q.key} rows={4} value={text} maxLength={20000} onChange={(e) => { setText(e.target.value); setMsg(null); }} />
      <div className="auto-row">
        <label>Cine vede
          <select value={visibility} onChange={(e) => { setVisibility(e.target.value as Visibility); setMsg(null); }}>
            {CHOICES.map((v) => <option key={v} value={v}>{VISIBILITY_LABEL[v]}</option>)}
          </select>
        </label>
        <button type="button" className="btn primary" disabled={pending || !text.trim() || !changed} onClick={save}>{pending ? "Se salvează…" : saved ? "Salvează schimbarea" : "Salvează"}</button>
        {msg && <span role="status">{msg}</span>}
      </div>
    </div>
  );
}

/** Cartea așa cum a ajuns până acum: răspunsurile și celelalte amintiri din fiecare capitol, gata de tipărit. */
function Reader({ name, dates, book, memories, onBack }: { name: string; dates: string; book: BookChapter[]; memories: MemoryView[]; onBack: () => void }) {
  const inBook = new Set(book.map((c) => c.chapter as string));
  const other = [...new Set(memories.map((m) => m.chapter).filter((c) => !inBook.has(c)))];
  const chapters = [...book.map((c) => ({ key: c.chapter as string, title: c.title })), ...other.map((c) => ({ key: c, title: chapterLabel(c) }))]
    .map((c) => ({ ...c, items: memories.filter((m) => m.chapter === c.key) })).filter((c) => c.items.length);
  return (
    <article className="auto-book">
      <div className="actions auto-noprint">
        <button type="button" className="btn" onClick={onBack}>Înapoi la scris</button>
        <button type="button" className="btn primary" onClick={() => window.print()}>Tipărește sau salvează PDF</button>
      </div>
      <p className="auto-noprint notice">Aici vezi tot ce ai scris, și ciornele. Pe profil, ceilalți văd doar ce ai ales să vadă.</p>
      <header className="auto-cover"><h1>{name}</h1><p>{dates}</p><p>Autobiografie</p></header>
      {!chapters.length && <p>Cartea e încă goală. Începe cu primul capitol.</p>}
      {chapters.map((c) => (
        <section key={c.key}>
          <h2>{c.title}</h2>
          {c.items.map((m) => (
            <div key={m.id} className="auto-item">
              {(m.question || m.title) && <h3>{m.question ?? m.title}</h3>}
              <p>{m.body}</p>
            </div>
          ))}
        </section>
      ))}
    </article>
  );
}

export default function Autobiography({ treeId, personId, name, dates, back, book, memories }: {
  treeId: string; personId: string; name: string; dates: string; back: string; book: BookChapter[]; memories: MemoryView[];
}) {
  const [at, setAt] = useState(0);
  const [reading, setReading] = useState(false);
  const byKey = new Map(memories.filter((m) => m.questionKey).map((m) => [m.questionKey!, m]));
  const { done, total } = bookProgress(book, byKey.keys());
  const c = book[at];
  if (reading) return <section className="auto"><Reader name={name} dates={dates} book={book} memories={memories} onBack={() => setReading(false)} /></section>;
  return (
    <section className="auto">
      <div className="card">
        <Link href={back}>← Profilul meu</Link>
        <h1 style={{ margin: "8px 0 2px" }}>Autobiografia mea</h1>
        <p className="muted" style={{ marginTop: 0 }}>{name}. Scrii când vrei, câte puțin, și sari peste ce nu vrei. Tot ce scrii rămâne ciornă, până alegi cine vede.</p>
        <div className="auto-bar" role="progressbar" aria-valuenow={done} aria-valuemin={0} aria-valuemax={total} aria-label="Întrebări cu răspuns"><i style={{ width: `${total ? (done / total) * 100 : 0}%` }} /></div>
        <div className="auto-row">
          <span className="muted">{done} din {total} întrebări</span>
          <button type="button" className="btn" onClick={() => setReading(true)}>Citește cartea</button>
        </div>
      </div>
      <nav className="auto-toc" aria-label="Capitole">
        {book.map((x, i) => (
          <button key={x.chapter} type="button" aria-current={i === at ? "step" : undefined} onClick={() => setAt(i)}>
            {i + 1}. {x.title} <span className="muted">{x.questions.filter((q) => byKey.has(q.key)).length}/{x.questions.length}</span>
          </button>
        ))}
      </nav>
      <div className="card">
        <div className="section-label" style={{ marginTop: 0 }}>Capitolul {at + 1}</div>
        <h2 style={{ margin: "2px 0 4px" }}>{c.title}</h2>
        <p className="muted" style={{ marginTop: 0 }}>{c.intro}</p>
        {c.chapter === "credinta" && (
          <blockquote className="auto-verse">{FAITH_VERSE.text} <a href={FAITH_VERSE.href} target="_blank" rel="noopener noreferrer">{FAITH_VERSE.ref} ↗</a></blockquote>
        )}
        {c.questions.map((q) => <Answer key={`${q.key}:${byKey.get(q.key)?.id ?? "nou"}`} q={q} chapter={c.chapter} treeId={treeId} personId={personId} saved={byKey.get(q.key)} />)}
        <div className="actions">
          {at > 0 && <button type="button" className="btn" onClick={() => { setAt(at - 1); window.scrollTo(0, 0); }}>Capitolul de dinainte</button>}
          {at < book.length - 1
            ? <button type="button" className="btn primary" onClick={() => { setAt(at + 1); window.scrollTo(0, 0); }}>Capitolul următor</button>
            : <button type="button" className="btn primary" onClick={() => setReading(true)}>Citește cartea</button>}
        </div>
      </div>
    </section>
  );
}
