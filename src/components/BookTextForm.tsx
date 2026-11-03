"use client";
import { useState, useTransition } from "react";
import { saveBookText } from "@/app/carte-actions";
import type { BookText } from "@/lib/book";

/** Textele cărții, pentru proprietar și editori: titlul de pe copertă, subtitlul, cine a alcătuit-o și cuvântul înainte. */
export default function BookTextForm({ treeId, text, defaults }: { treeId: string; text: BookText; defaults: Pick<BookText, "title" | "subtitle" | "author"> }) {
  const [v, setV] = useState(text);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const field = (k: keyof BookText) => ({ value: v[k], onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => { setV({ ...v, [k]: e.target.value }); setMsg(null); } });
  const save = (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => {
      const r = await saveBookText(treeId, v);
      setMsg(r.error ?? "Am păstrat textele. Cartea se reface cu ele…");
      if (r.ok) window.location.reload();
    });
  };
  return (
    <details className="card book-chrome book-text">
      <summary>Scrie titlul și cuvântul înainte</summary>
      <form onSubmit={save} className="book-text-form">
        <label>Titlul de pe copertă<input {...field("title")} maxLength={120} placeholder={defaults.title} /></label>
        <label>Subtitlu<input {...field("subtitle")} maxLength={200} placeholder={defaults.subtitle} /></label>
        <label>Alcătuită de<input {...field("author")} maxLength={120} placeholder={defaults.author} /></label>
        <label>Cuvânt înainte
          <textarea {...field("preface")} maxLength={12000} rows={7}
            placeholder="De pildă: de ce ați făcut cartea, cine a adunat poveștile, cui îi e dedicată. Un rând gol începe un paragraf nou." />
        </label>
        <div className="actions">
          <button className="btn primary" disabled={pending}>{pending ? "Se păstrează…" : "Păstrează textele"}</button>
          {msg && <span className="muted" role="status">{msg}</span>}
        </div>
      </form>
    </details>
  );
}
