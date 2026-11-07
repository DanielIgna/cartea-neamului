"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useFormatter, useTranslations } from "use-intl";
import { findMe } from "@/app/join-actions";

export type MyJoin = { id: string; status: "pending" | "accepted" | "declined"; at: string; treeId: string | null; treeName: string | null };

/** „Ești deja într-un arbore?”: cine își face cont își caută fișa, trecută deja de o rudă, după nume și data nașterii. */
export default function JoinTree({ requests, compact }: { requests: MyJoin[]; compact: boolean }) {
  const t = useTranslations("JoinTree");
  const format = useFormatter();
  const when = (iso: string) => format.dateTime(new Date(iso), { day: "numeric", month: "long" });
  const router = useRouter();
  // Câmpurile rămân completate după căutare (un formular cu `action` s-ar goli singur), ca o greșeală să se corecteze ușor.
  const [v, setV] = useState({ given: "", surname: "", birth: "", note: "" });
  const [state, setState] = useState<Awaited<ReturnType<typeof findMe>> | null>(null);
  const [pending, start] = useTransition();
  const field = (k: keyof typeof v) => ({ name: k, value: v[k], onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setV({ ...v, [k]: e.target.value }) });
  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData();
    for (const [k, x] of Object.entries(v)) f.set(k, x);
    start(async () => {
      const res = await findMe(null, f);
      setState(res);
      if (res.found) router.refresh();
    });
  }
  const today = new Date().toISOString().slice(0, 10);
  const found = state && !state.error ? (state.found ? t("found", { count: state.found }) : state.declined ? t("declined") : t("notFound")) : null;

  const form = (
    <form onSubmit={submit} method="post" className="form">
      <div className="row">
        <label>{t("given")}<input {...field("given")} required maxLength={80} autoComplete="given-name" /></label>
        <label>{t("surname")}<input {...field("surname")} required maxLength={80} autoComplete="family-name" /></label>
      </div>
      <label>{t("birth")}<input {...field("birth")} type="date" required min="1900-01-01" max={today} /></label>
      <label>{t("note")}
        <textarea {...field("note")} maxLength={500} style={{ minHeight: 60 }} placeholder={t("notePlaceholder")} />
      </label>
      <small className="muted">{t("marriedHint")}</small>
      {state?.error && <p className="err" style={{ margin: 0 }}>{state.error}</p>}
      {found && <p className={state?.found ? "confirm" : "muted"} style={{ margin: 0 }}>{found}</p>}
      <div className="actions" style={{ margin: 0 }}><button className="btn primary" disabled={pending}>{pending ? t("searching") : t("search")}</button></div>
    </form>
  );

  return (
    <div className="card">
      {compact ? (
        <details>
          <summary style={{ cursor: "pointer", color: "var(--accent)" }}>{t("compactSummary")}</summary>
          <p className="muted" style={{ fontSize: 14 }}>{t("compactText")}</p>
          {form}
        </details>
      ) : (
        <>
          <div className="section-label" style={{ marginTop: 0 }}>{t("title")}</div>
          <p className="muted" style={{ marginTop: 0, fontSize: 14 }}>{t("text")}</p>
          {form}
        </>
      )}
      {requests.length > 0 && (
        <ul className="join-list">
          {requests.map((r) => (
            <li key={r.id}>
              {r.status === "accepted" && r.treeId ? t.rich("accepted", { tree: r.treeName ?? "", link: (c) => <Link href={`/arbore/${r.treeId}`}>{c}</Link> })
                : r.status === "pending" ? t("pending", { date: when(r.at) })
                : t("notConfirmed", { date: when(r.at) })}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
