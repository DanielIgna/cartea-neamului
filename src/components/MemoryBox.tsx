"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition, type ComponentProps } from "react";
import { useLocale, useTranslations } from "use-intl";
import { addMemoryReply, askQuestion, deleteMemory, deleteMemoryReply, dismissQuestion, hideMention } from "@/app/lada-actions";
import { CHAPTERS, type Question } from "@/lib/questions";
import type { AskedView, MemoryView } from "@/lib/lada-db";
import { placeKey } from "@/lib/place-key";
import { degreeWord } from "@/lib/kin-words";
import MemoryForm, { type Draft, type PersonOption } from "./MemoryForm";
import { clock } from "./VoiceRecorder";

type Owner = { id: string; givenName: string; sex: "M" | "F" | "U"; living: boolean; claimed: boolean };
type Run = (fn: () => Promise<{ error?: string }>, ok?: string) => void;

const UUIDS = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
export const fmtDay = (iso: string, locale: string) => new Date(iso).toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Bucharest" });
const order = (a: MemoryView, b: MemoryView) => (a.whenYear ?? 9999) - (b.whenYear ?? 9999) || a.createdAt.localeCompare(b.createdAt);

/**
 * Lada cu amintiri de pe profil. Omul își scrie amintirile (pornind de la întrebarea de duminică, de la întrebările rudelor
 * sau de la nimic), pe capitole; rudele le citesc, adaugă „Și eu îmi amintesc” și îi pot lăsa întrebări.
 * Dedesubt, amintirile altora în care e pomenit (merge și pentru cei care nu mai sunt).
 */
export default function MemoryBox(props: {
  treeId: string; owner: Owner; isOwner: boolean; viewerPersonId: string | null; canAsk: boolean; canHelp?: boolean;
  own: MemoryView[]; about: MemoryView[]; questions: AskedView[]; upcoming: Question[];
  people: PersonOption[]; storage: boolean; defaultDegree: number; startMention?: string | null; faithConsent?: boolean;
}) {
  const { treeId, owner, isOwner, viewerPersonId, canAsk, canHelp, own, about, questions, upcoming, people, storage, defaultDegree, startMention, faithConsent = false } = props;
  const router = useRouter();
  const t = useTranslations("Lada"), locale = useLocale();
  const [pending, start] = useTransition();
  const [writing, setWriting] = useState<Draft | null>(isOwner && startMention && people.some((p) => p.id === startMention) ? { mentions: [startMention] } : null);
  const [editing, setEditing] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [skip, setSkip] = useState(0);
  const formRef = useRef<HTMLDivElement>(null);
  const sex = owner.sex === "F" ? "F" : "M", name = owner.givenName;
  const nameOf = (id: string) => people.find((p) => p.id === id)?.name ?? "";

  useEffect(() => { if (writing && startMention) formRef.current?.scrollIntoView({ block: "start" }); }, []);

  const open = (d: Draft) => { setMsg(null); setEditing(null); setWriting(d); requestAnimationFrame(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })); };
  const done = (text: string) => { setWriting(null); setEditing(null); setMsg(text); router.refresh(); };
  const run: Run = (fn, ok) => start(async () => {
    const r = await fn();
    setMsg(r.error ?? ok ?? null);
    if (!r.error) router.refresh();
  });
  const formProps = { treeId, people, storage, defaultDegree, faithConsent, onDone: done, onCancel: () => { setWriting(null); setEditing(null); } };
  const cardProps = { treeId, profileId: owner.id, viewerPersonId, nameOf, run, pending, editing, setEditing: (id: string | null) => { setMsg(null); setWriting(null); setEditing(id); }, formProps };

  const q = upcoming.length ? upcoming[skip % upcoming.length] : null;
  const openAsked = questions.filter((x) => !x.answeredId && !x.dismissed);
  const later = questions.filter((x) => !x.answeredId && x.dismissed);
  const chapters = CHAPTERS.map((c) => ({ ...c, items: own.filter((m) => m.chapter === c.key).sort(order) })).filter((c) => c.items.length);
  const shown = own.filter((m) => m.visibility !== "private").length + about.length;
  const hiddenHere = about.filter((m) => viewerPersonId === owner.id && m.mentions.some((x) => x.personId === owner.id && x.hidden));
  const aboutShown = about.filter((m) => !hiddenHere.includes(m));
  const showLada = owner.living || own.length > 0;

  return (
    <>
      {showLada && (
        <div className="card lada" id="lada">
          <div className="lada-head">
            <div>
              <div className="section-label" style={{ marginTop: 0 }}>{t("label")}</div>
              <h3>{isOwner ? t("titleOwn") : t("titleOther", { name, sex })}</h3>
              <p>{isOwner ? t("leadOwn") : own.length ? t("leadOther", { count: own.length }) : ""}</p>
            </div>
            <div className="actions" style={{ marginTop: 0 }}>
              {isOwner && owner.living && <Link className="btn primary" href={`/arbore/${treeId}/persoana/${owner.id}/autobiografie`}>{t("autobiographyOwn")}</Link>}
              {!isOwner && own.some((m) => m.visibility !== "private") && <Link className="btn" href={`/arbore/${treeId}/persoana/${owner.id}/autobiografie/carte`}>{t("autobiographyBook")}</Link>}
              {shown > 0 && <Link className="btn" href={`/arbore/${treeId}/persoana/${owner.id}/poveste`}>{t("browseStory")}</Link>}
            </div>
          </div>
          {msg && <p className="notice" role="status" style={{ margin: "12px 0 0" }}>{msg}</p>}

          {isOwner && !writing && !editing && (
            <div className="sunday">
              {q ? (
                <>
                  <div className="sunday-label">{t("sundayLabel")}</div>
                  <p className="sunday-q">{q.text}</p>
                  <div className="actions">
                    <button className="btn primary" onClick={() => open({ question: q.text, questionKey: q.key, chapter: q.chapter, mentions: (q.key.match(UUIDS) ?? []).filter((id) => people.some((p) => p.id === id)) })}>{t("answer")}</button>
                    {upcoming.length > 1 && <button className="btn" onClick={() => setSkip(skip + 1)}>{t("otherQuestion")}</button>}
                    <button className="btn" onClick={() => open({})}>{t("writeSomethingElse")}</button>
                  </div>
                  <small className="muted">{t("sundayHint")}</small>
                </>
              ) : (
                <div className="actions" style={{ marginTop: 0 }}><button className="btn primary" onClick={() => open({})}>{t("writeMemory")}</button></div>
              )}
            </div>
          )}
          {writing && <div ref={formRef}><MemoryForm {...formProps} ownerId={owner.id} ownerName={owner.givenName} draft={writing} /></div>}

          {isOwner && openAsked.length > 0 && (
            <>
              <div className="section-label">{t("familyQuestions", { count: String(openAsked.length) })}</div>
              <ul className="asked">{openAsked.map((x) => (
                <li key={x.id}>
                  <span className="q"><b>{t("quoted", { text: x.text })}</b><small>{x.askedBy?.name ? t("fromOn", { name: x.askedBy.name, date: fmtDay(x.createdAt, locale) }) : fmtDay(x.createdAt, locale)}</small></span>
                  <span className="tools">
                    <button className="btn primary" onClick={() => open({ question: x.text, askedId: x.id, askedByName: x.askedBy?.name ?? null })}>{t("answer")}</button>
                    <button className="linklike" disabled={pending} onClick={() => run(() => dismissQuestion(treeId, x.id), t("setAside"))}>{t("notNow")}</button>
                  </span>
                </li>
              ))}</ul>
            </>
          )}
          {isOwner && later.length > 0 && (
            <details className="share-preview" style={{ marginTop: 10 }}>
              <summary>{t("postponed", { count: String(later.length) })}</summary>
              <ul className="asked" style={{ marginTop: 8 }}>{later.map((x) => (
                <li key={x.id}>
                  <span className="q"><b>{t("quoted", { text: x.text })}</b><small>{x.askedBy?.name ? t("from", { name: x.askedBy.name }) : ""}</small></span>
                  <button className="btn" onClick={() => open({ question: x.text, askedId: x.id, askedByName: x.askedBy?.name ?? null })}>{t("answer")}</button>
                </li>
              ))}</ul>
            </details>
          )}

          {canHelp && (
            <div className="helper-call">
              {t.rich("helperCall", { name, sex, b: (c) => <b>{c}</b> })}
              <div className="actions" style={{ marginTop: 8 }}>
                <Link className="btn primary" href={`/arbore/${treeId}/persoana/${owner.id}/la-bunici`}>{t("helperOpen")}</Link>
                <Link className="btn" href={`/arbore/${treeId}/persoana/${owner.id}/la-bunici?carte=1`}>{t("helperBook")}</Link>
              </div>
            </div>
          )}
          {!isOwner && canAsk && <AskBox treeId={treeId} owner={owner} mine={questions.filter((x) => x.mine)} run={run} pending={pending} visibleIds={own.map((m) => m.id)} />}

          {chapters.map((c) => (
            <section key={c.key}>
              <h4 className="chapter-title">{t(`chapters.${c.key}`)} <small>{c.items.length}</small></h4>
              <div className="memories">{c.items.map((m) => <MemoryCard key={m.id} m={m} {...cardProps} />)}</div>
            </section>
          ))}
          {!own.length && (
            <p className="muted" style={{ marginBottom: 0 }}>
              {isOwner ? t("emptyOwn") : owner.claimed ? t("emptyClaimed", { name }) : t("emptyUnclaimed", { name, sex })}
            </p>
          )}
        </div>
      )}

      <div className="card" id="despre">
        <div className="section-label" style={{ marginTop: 0 }}>{isOwner ? t("aboutYou") : t("aboutName", { name })}</div>
        {aboutShown.length ? (
          <div className="memories">{aboutShown.map((m) => <MemoryCard key={m.id} m={m} {...cardProps} from />)}</div>
        ) : (
          <p className="muted" style={{ margin: 0, fontSize: 14 }}>
            {isOwner ? t("aboutEmptyOwn") : t("aboutEmptyOther", { name })}
          </p>
        )}
        {!isOwner && viewerPersonId && (
          <div className="actions" style={{ marginTop: 10 }}>
            <Link className="btn" href={`/arbore/${treeId}/persoana/${viewerPersonId}?scrie=${owner.id}#lada`}>{t("writeWith", { name })}</Link>
          </div>
        )}
        {hiddenHere.length > 0 && (
          <details className="share-preview" style={{ marginTop: 12 }}>
            <summary>{t("hiddenFromProfile", { count: String(hiddenHere.length) })}</summary>
            <div className="memories" style={{ marginTop: 8 }}>{hiddenHere.map((m) => <MemoryCard key={m.id} m={m} {...cardProps} from />)}</div>
          </details>
        )}
      </div>
    </>
  );
}

/** Cine vizitează lada cuiva în viață îi poate lăsa o întrebare și vede ce a întrebat el până acum. */
function AskBox({ treeId, owner, mine, run, pending, visibleIds }: { treeId: string; owner: Owner; mine: AskedView[]; run: Run; pending: boolean; visibleIds: string[] }) {
  const [text, setText] = useState("");
  const t = useTranslations("Lada");
  const sex = owner.sex === "F" ? "F" : "M", name = owner.givenName;
  return (
    <>
      <div className="section-label">{t("askLabel", { sex })}</div>
      <form className="ask-form" onSubmit={(e) => { e.preventDefault(); const q = text; run(async () => { const r = await askQuestion(treeId, owner.id, q); if (!r.error) setText(""); return r; }, t("askDone", { sex })); }}>
        <textarea value={text} onChange={(e) => setText(e.target.value)} maxLength={400} placeholder={t("askPlaceholder")} aria-label={t("askAria")} />
        <div className="actions" style={{ marginTop: 0, alignItems: "center" }}>
          <button className="btn primary" disabled={pending || text.trim().length < 3}>{t("askButton")}</button>
          <small className="muted">{owner.claimed ? t("askClaimed", { name }) : t("askUnclaimed", { name })}</small>
        </div>
      </form>
      {mine.length > 0 && (
        <ul className="asked" style={{ marginTop: 10 }}>{mine.map((x) => (
          <li key={x.id}>
            <span className="q"><b>{t("quoted", { text: x.text })}</b><small>{x.answeredId ? t("answered") : t("notAnswered")}</small></span>
            {x.answeredId && visibleIds.includes(x.answeredId) ? <a className="btn" href={`#amintire-${x.answeredId}`}>{t("readAnswer")}</a>
              : !x.answeredId && <button className="linklike" disabled={pending} onClick={() => run(() => dismissQuestion(treeId, x.id), t("withdrawn"))}>{t("withdraw")}</button>}
          </li>
        ))}</ul>
      )}
    </>
  );
}

type CardProps = {
  m: MemoryView; treeId: string; profileId: string; viewerPersonId: string | null; nameOf: (id: string) => string; run: Run; pending: boolean;
  editing: string | null; setEditing: (id: string | null) => void; from?: boolean;
  formProps: Omit<ComponentProps<typeof MemoryForm>, "ownerId" | "ownerName" | "draft" | "edit">;
};

/** O amintire: capitolul, întrebarea la care răspunde, textul, poza, cine mai e în ea și „Și eu îmi amintesc” de sub ea. */
function MemoryCard({ m, treeId, profileId, viewerPersonId, nameOf, run, pending, editing, setEditing, from, formProps }: CardProps) {
  const [full, setFull] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [replying, setReplying] = useState(false);
  const [reply, setReply] = useState("");
  const t = useTranslations("Lada"), locale = useLocale();
  if (editing === m.id) return <div id={`amintire-${m.id}`}><MemoryForm {...formProps} ownerId={m.personId} ownerName={nameOf(m.personId)} edit={m} /></div>;
  const long = m.body.length > 700 && !full;
  const meHere = viewerPersonId && m.mentions.find((x) => x.personId === viewerPersonId);
  const hiddenByProfile = m.mentions.find((x) => x.personId === profileId)?.hidden;
  const vis = m.visibility === "private" ? t("visPrivate") : m.visibility === "asker" ? (m.askedBy?.name ? t("visAsker", { name: m.askedBy.name }) : t("visAskerUnknown"))
    : m.visibility === "close" ? (m.maxDegree ? t("visClose", { degree: degreeWord(m.maxDegree, locale) }) : t("visCloseDefault")) : t("visTree");
  return (
    <article className={`memory${m.visibility === "private" ? " draft" : ""}`} id={`amintire-${m.id}`}>
      {from && m.author && (
        <div className="from">{t.rich("writtenBy", { name: m.author.name, link: (c) => (m.author?.personId ? <Link href={`/arbore/${treeId}/persoana/${m.author.personId}#lada`}>{c}</Link> : <>{c}</>) })}</div>
      )}
      {m.title && <h4>{m.title}</h4>}
      {m.question && <p className="q">{m.askedBy ? t("atQuestionFrom", { question: m.question, name: m.askedBy.name }) : t("atQuestion", { question: m.question })}</p>}
      {m.photoId && <a className="photo" href={`/api/document/${m.photoId}`} target="_blank" rel="noopener"><img src={`/api/document/${m.photoId}`} alt={m.title ?? t("photoAlt")} loading="lazy" /></a>}
      {m.audioId && (
        <div className="voice-row">
          <audio controls preload="none" src={`/api/document/${m.audioId}`} aria-label={m.audioSeconds ? t("voiceAriaTime", { time: clock(m.audioSeconds) }) : t("voiceAria")} />
          {m.audioSeconds ? <span className="muted">{clock(m.audioSeconds)}</span> : null}
        </div>
      )}
      {m.body && <p className="body">{long ? `${m.body.slice(0, 600).trimEnd()}… ` : m.body}{long && <button className="linklike" onClick={() => setFull(true)}>{t("readAll")}</button>}</p>}
      {m.helper && (
        <div className="meta">
          {m.consentAudioId
            ? t.rich("helperVoice", { name: nameOf(m.personId), recorder: m.author?.name ?? t("someoneInFamily"), link: (c) => <a href={`/api/document/${m.consentAudioId}`} target="_blank" rel="noopener">{c}</a> })
            : t("helperPlain", { name: nameOf(m.personId), recorder: m.author?.name ?? t("someoneInFamily") })}
        </div>
      )}
      {(m.whenText || m.place) && (
        <div className="meta">
          {m.whenText}{m.whenText && m.place ? " · " : ""}
          {m.place && (m.visibility === "private" ? m.place
            : <Link href={`/arbore/${treeId}/harta?loc=${encodeURIComponent(placeKey(m.place, null) ?? "")}`} title={t("seeOnMap")}>{m.place}</Link>)}
        </div>
      )}
      {(m.mentions.length > 0 || m.editable) && (
        <div className="chips">
          {m.mentions.map((x) => <Link key={x.personId} className="chip" href={`/arbore/${treeId}/persoana/${x.personId}`}>{nameOf(x.personId)}</Link>)}
          {m.editable && <span className="chip priv" title={t("whoSees")}>{vis}</span>}
          {m.editable && m.inBook && <span className="chip ok">{t("inBook")}</span>}
          {m.mine && from && hiddenByProfile && <span className="chip">{t("hiddenBy", { name: nameOf(profileId) })}</span>}
        </div>
      )}
      <div className="tools">
        {m.visibility !== "private" && <button className="linklike" onClick={() => setReplying(!replying)}>{t("alsoRemember")}</button>}
        {m.editable && <button className="linklike" onClick={() => setEditing(m.id)}>{t("change")}</button>}
        {m.editable && <button className="linklike" onClick={() => setConfirm(true)}>{t("delete")}</button>}
        {meHere && (meHere.hidden
          ? <button className="linklike" disabled={pending} onClick={() => run(() => hideMention(treeId, m.id, viewerPersonId!, false), t("shownAgain"))}>{t("showAgain")}</button>
          : <button className="linklike" disabled={pending} onClick={() => run(() => hideMention(treeId, m.id, viewerPersonId!, true), t("hidden"))}>{t("hide")}</button>)}
        <span className="muted" style={{ marginInlineStart: "auto", fontSize: 13 }}>{fmtDay(m.createdAt, locale)}</span>
      </div>
      {confirm && (
        <div className="confirm" style={{ marginTop: 8 }}>
          {t("confirmDelete", { count: m.replies.length })}
          <div className="actions" style={{ marginTop: 8 }}>
            <button className="btn danger" disabled={pending} onClick={() => run(() => deleteMemory(treeId, m.id), t("deleted"))}>{t("yesDelete")}</button>
            <button className="btn" onClick={() => setConfirm(false)}>{t("no")}</button>
          </div>
        </div>
      )}
      {(m.replies.length > 0 || replying) && (
        <div className="replies">
          {m.replies.map((r) => (
            <div key={r.id} className="reply">
              <span className="who">{r.author?.personId ? <Link href={`/arbore/${treeId}/persoana/${r.author.personId}`}>{r.author.name}</Link> : r.author?.name ?? t("someone")}</span>
              <span className="muted"> · {fmtDay(r.createdAt, locale)}</span>
              {(r.mine || m.editable) && <button className="linklike" style={{ float: "right", fontSize: 13 }} disabled={pending} onClick={() => run(() => deleteMemoryReply(treeId, r.id))}>{t("delete")}</button>}
              <p>{r.body}</p>
            </div>
          ))}
          {replying && (
            <form className="ask-form" onSubmit={(e) => { e.preventDefault(); const t = reply; run(async () => { const r = await addMemoryReply(treeId, m.id, t); if (!r.error) { setReply(""); setReplying(false); } return r; }); }}>
              <textarea value={reply} onChange={(e) => setReply(e.target.value)} maxLength={4000} autoFocus placeholder={t("replyPlaceholder")} aria-label={t("replyAria")} />
              <div className="actions" style={{ marginTop: 0 }}>
                <button className="btn primary" disabled={pending || !reply.trim()}>{t("add")}</button>
                <button type="button" className="btn" onClick={() => setReplying(false)}>{t("cancel")}</button>
              </div>
            </form>
          )}
        </div>
      )}
    </article>
  );
}
