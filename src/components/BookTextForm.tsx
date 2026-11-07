"use client";
import { useState, useTransition } from "react";
import { saveBookText } from "@/app/carte-actions";
import type { BookText } from "@/lib/book";
import { useTranslations } from "use-intl";

/** Textele cărții, pentru proprietar și editori: titlul de pe copertă, subtitlul, cine a alcătuit-o și cuvântul înainte. */
export default function BookTextForm({ treeId, text, defaults }: { treeId: string; text: BookText; defaults: Pick<BookText, "title" | "subtitle" | "author"> }) {
  const [v, setV] = useState(text);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const t = useTranslations("BookUi.text");
  const field = (k: keyof BookText) => ({ value: v[k], onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => { setV({ ...v, [k]: e.target.value }); setMsg(null); } });
  const save = (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => {
      const r = await saveBookText(treeId, v);
      setMsg(r.error ?? t("saved"));
      if (r.ok) window.location.reload();
    });
  };
  return (
    <details className="card book-chrome book-text">
      <summary>{t("summary")}</summary>
      <form onSubmit={save} className="book-text-form">
        <label>{t("title")}<input {...field("title")} maxLength={120} placeholder={defaults.title} /></label>
        <label>{t("subtitle")}<input {...field("subtitle")} maxLength={200} placeholder={defaults.subtitle} /></label>
        <label>{t("author")}<input {...field("author")} maxLength={120} placeholder={defaults.author} /></label>
        <label>{t("preface")}
          <textarea {...field("preface")} maxLength={12000} rows={7}
            placeholder={t("prefaceHint")} />
        </label>
        <div className="actions">
          <button className="btn primary" disabled={pending}>{pending ? t("saving") : t("save")}</button>
          {msg && <span className="muted" role="status">{msg}</span>}
        </div>
      </form>
    </details>
  );
}
