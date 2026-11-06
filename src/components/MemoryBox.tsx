"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition, type ComponentProps } from "react";
import { addMemoryReply, askQuestion, deleteMemory, deleteMemoryReply, dismissQuestion, hideMention } from "@/app/lada-actions";
import { CHAPTERS, type Question } from "@/lib/questions";
import type { AskedView, MemoryView } from "@/lib/lada-db";
import { placeKey } from "@/lib/place-key";
import MemoryForm, { type Draft, type PersonOption } from "./MemoryForm";
import { clock } from "./VoiceRecorder";

type Owner = { id: string; givenName: string; sex: "M" | "F" | "U"; living: boolean; claimed: boolean };
type Run = (fn: () => Promise<{ error?: string }>, ok?: string) => void;

const UUIDS = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
export const fmtDay = (iso: string) => new Date(iso).toLocaleDateString("ro-RO", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Bucharest" });
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
  const [pending, start] = useTransition();
  const [writing, setWriting] = useState<Draft | null>(isOwner && startMention && people.some((p) => p.id === startMention) ? { mentions: [startMention] } : null);
  const [editing, setEditing] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [skip, setSkip] = useState(0);
  const formRef = useRef<HTMLDivElement>(null);
  const lui = owner.sex === "F" ? "ei" : "lui";
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
              <div className="section-label" style={{ marginTop: 0 }}>Lada cu amintiri</div>
              <h3>{isOwner ? "Lada ta cu amintiri" : `Ce a povestit ${owner.givenName} despre viața ${lui}`}</h3>
              <p>{isOwner ? "Amintirile tale, pe capitole, pentru cei din familie. Tu alegi la fiecare cine o vede." : own.length ? `${own.length} ${own.length === 1 ? "amintire" : "amintiri"} pe care le poți vedea.` : ""}</p>
            </div>
            <div className="actions" style={{ marginTop: 0 }}>
              {isOwner && owner.living && <Link className="btn primary" href={`/arbore/${treeId}/persoana/${owner.id}/autobiografie`}>Autobiografia ta ▸</Link>}
              {!isOwner && own.some((m) => m.visibility !== "private") && <Link className="btn" href={`/arbore/${treeId}/persoana/${owner.id}/autobiografie/carte`}>Autobiografia, ca o carte</Link>}
              {shown > 0 && <Link className="btn" href={`/arbore/${treeId}/persoana/${owner.id}/poveste`}>Răsfoiește povestea ▸</Link>}
            </div>
          </div>
          {msg && <p className="notice" role="status" style={{ margin: "12px 0 0" }}>{msg}</p>}

          {isOwner && !writing && !editing && (
            <div className="sunday">
              {q ? (
                <>
                  <div className="sunday-label">Întrebarea de duminică</div>
                  <p className="sunday-q">{q.text}</p>
                  <div className="actions">
                    <button className="btn primary" onClick={() => open({ question: q.text, questionKey: q.key, chapter: q.chapter, mentions: (q.key.match(UUIDS) ?? []).filter((id) => people.some((p) => p.id === id)) })}>Răspunde</button>
                    {upcoming.length > 1 && <button className="btn" onClick={() => setSkip(skip + 1)}>Altă întrebare</button>}
                    <button className="btn" onClick={() => open({})}>Scrie altceva</button>
                  </div>
                  <small className="muted">În fiecare duminică vine o întrebare nouă, din arbore și din vremurile prin care ai trecut. Răspunde când ai chef: nu se pierde nimic.</small>
                </>
              ) : (
                <div className="actions" style={{ marginTop: 0 }}><button className="btn primary" onClick={() => open({})}>Scrie o amintire</button></div>
              )}
            </div>
          )}
          {writing && <div ref={formRef}><MemoryForm {...formProps} ownerId={owner.id} ownerName={owner.givenName} draft={writing} /></div>}

          {isOwner && openAsked.length > 0 && (
            <>
              <div className="section-label">Întrebări de la familie ({openAsked.length})</div>
              <ul className="asked">{openAsked.map((x) => (
                <li key={x.id}>
                  <span className="q"><b>„{x.text}”</b><small>{x.askedBy?.name ? `de la ${x.askedBy.name}, ` : ""}{fmtDay(x.createdAt)}</small></span>
                  <span className="tools">
                    <button className="btn primary" onClick={() => open({ question: x.text, askedId: x.id, askedByName: x.askedBy?.name ?? null })}>Răspunde</button>
                    <button className="linklike" disabled={pending} onClick={() => run(() => dismissQuestion(treeId, x.id), "Am pus întrebarea deoparte. O găsești la „Amânate”.")}>Nu acum</button>
                  </span>
                </li>
              ))}</ul>
            </>
          )}
          {isOwner && later.length > 0 && (
            <details className="share-preview" style={{ marginTop: 10 }}>
              <summary>Întrebări amânate ({later.length})</summary>
              <ul className="asked" style={{ marginTop: 8 }}>{later.map((x) => (
                <li key={x.id}>
                  <span className="q"><b>„{x.text}”</b><small>{x.askedBy?.name ? `de la ${x.askedBy.name}` : ""}</small></span>
                  <button className="btn" onClick={() => open({ question: x.text, askedId: x.id, askedByName: x.askedBy?.name ?? null })}>Răspunde</button>
                </li>
              ))}</ul>
            </details>
          )}

          {canHelp && (
            <div className="helper-call">
              <b>Ești la {owner.givenName}?</b> Deschide modul „la bunici”: telefonul îi arată întrebările cu litere mari, {owner.givenName} povestește, iar telefonul înregistrează, cu acordul {owner.sex === "F" ? "ei" : "lui"} spus la început.
              <div className="actions" style={{ marginTop: 8 }}>
                <Link className="btn primary" href={`/arbore/${treeId}/persoana/${owner.id}/la-bunici`}>Deschide modul „la bunici”</Link>
                <Link className="btn" href={`/arbore/${treeId}/persoana/${owner.id}/la-bunici?carte=1`}>Cu întrebările autobiografiei</Link>
              </div>
            </div>
          )}
          {!isOwner && canAsk && <AskBox treeId={treeId} owner={owner} mine={questions.filter((x) => x.mine)} run={run} pending={pending} visibleIds={own.map((m) => m.id)} />}

          {chapters.map((c) => (
            <section key={c.key}>
              <h4 className="chapter-title">{c.label} <small>{c.items.length}</small></h4>
              <div className="memories">{c.items.map((m) => <MemoryCard key={m.id} m={m} {...cardProps} />)}</div>
            </section>
          ))}
          {!own.length && (
            <p className="muted" style={{ marginBottom: 0 }}>
              {isOwner ? "Lada e goală deocamdată. Începe cu întrebarea de mai sus sau scrie orice îți vine în minte: o întâmplare, un om, un loc."
                : owner.claimed ? `${owner.givenName} n-a pus încă amintiri în ladă (sau încă nu pentru tine).`
                : `${owner.givenName} nu și-a făcut încă cont, așa că nu și-a deschis lada. Întrebările lăsate aici ${owner.sex === "F" ? "o" : "îl"} așteaptă când intră.`}
            </p>
          )}
        </div>
      )}

      <div className="card" id="despre">
        <div className="section-label" style={{ marginTop: 0 }}>{isOwner ? "Amintiri ale altora despre tine" : `Amintiri despre ${owner.givenName}`}</div>
        {aboutShown.length ? (
          <div className="memories">{aboutShown.map((m) => <MemoryCard key={m.id} m={m} {...cardProps} from />)}</div>
        ) : (
          <p className="muted" style={{ margin: 0, fontSize: 14 }}>
            {isOwner ? "Când cineva din familie scrie în lada lui o amintire în care ești și tu, o vezi aici."
              : `Când cineva din familie scrie în lada lui o amintire în care e și ${owner.givenName}, apare aici.`}
          </p>
        )}
        {!isOwner && viewerPersonId && (
          <div className="actions" style={{ marginTop: 10 }}>
            <Link className="btn" href={`/arbore/${treeId}/persoana/${viewerPersonId}?scrie=${owner.id}#lada`}>Scrie o amintire cu {owner.givenName}</Link>
          </div>
        )}
        {hiddenHere.length > 0 && (
          <details className="share-preview" style={{ marginTop: 12 }}>
            <summary>Ascunse de pe profilul tău ({hiddenHere.length})</summary>
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
  const lui = owner.sex === "F" ? "ei" : "lui";
  return (
    <>
      <div className="section-label">Lasă o întrebare în lada {lui}</div>
      <form className="ask-form" onSubmit={(e) => { e.preventDefault(); const t = text; run(async () => { const r = await askQuestion(treeId, owner.id, t); if (!r.error) setText(""); return r; }, `Am pus întrebarea în lada ${lui}. Primești răspunsul aici, pe profil.`); }}>
        <textarea value={text} onChange={(e) => setText(e.target.value)} maxLength={400} placeholder="De pildă: Cum era o zi de duminică în copilăria ta?" aria-label="Întrebarea ta" />
        <div className="actions" style={{ marginTop: 0, alignItems: "center" }}>
          <button className="btn primary" disabled={pending || text.trim().length < 3}>Lasă întrebarea</button>
          <small className="muted">{owner.claimed ? `${owner.givenName} alege dacă răspunsul îl vede toată familia sau doar tu.`
            : `${owner.givenName} o găsește în ladă când își face cont, sau i-o citește cine deschide modul „la bunici”.`}</small>
        </div>
      </form>
      {mine.length > 0 && (
        <ul className="asked" style={{ marginTop: 10 }}>{mine.map((x) => (
          <li key={x.id}>
            <span className="q"><b>„{x.text}”</b><small>{x.answeredId ? "a răspuns" : "încă fără răspuns"}</small></span>
            {x.answeredId && visibleIds.includes(x.answeredId) ? <a className="btn" href={`#amintire-${x.answeredId}`}>Citește răspunsul</a>
              : !x.answeredId && <button className="linklike" disabled={pending} onClick={() => run(() => dismissQuestion(treeId, x.id), "Am retras întrebarea.")}>Retrage</button>}
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
  if (editing === m.id) return <div id={`amintire-${m.id}`}><MemoryForm {...formProps} ownerId={m.personId} ownerName={nameOf(m.personId)} edit={m} /></div>;
  const long = m.body.length > 700 && !full;
  const meHere = viewerPersonId && m.mentions.find((x) => x.personId === viewerPersonId);
  const hiddenByProfile = m.mentions.find((x) => x.personId === profileId)?.hidden;
  const vis = m.visibility === "private" ? "Doar tu (ciornă)" : m.visibility === "asker" ? `Doar ${m.askedBy?.name ?? "cel care a întrebat"}`
    : m.visibility === "close" ? `Familia apropiată, până la gradul ${m.maxDegree ?? "de la mesaje"}` : "Tot arborele";
  return (
    <article className={`memory${m.visibility === "private" ? " draft" : ""}`} id={`amintire-${m.id}`}>
      {from && m.author && (
        <div className="from">Scrisă de {m.author.personId ? <Link href={`/arbore/${treeId}/persoana/${m.author.personId}#lada`}>{m.author.name}</Link> : m.author.name}</div>
      )}
      {m.title && <h4>{m.title}</h4>}
      {m.question && <p className="q">La întrebarea „{m.question}”{m.askedBy ? `, de la ${m.askedBy.name}` : ""}</p>}
      {m.photoId && <a className="photo" href={`/api/document/${m.photoId}`} target="_blank" rel="noopener"><img src={`/api/document/${m.photoId}`} alt={m.title ?? "Poza amintirii"} loading="lazy" /></a>}
      {m.audioId && (
        <div className="voice-row">
          <audio controls preload="none" src={`/api/document/${m.audioId}`} aria-label={`Amintirea spusă cu glasul${m.audioSeconds ? `, ${clock(m.audioSeconds)}` : ""}`} />
          {m.audioSeconds ? <span className="muted">{clock(m.audioSeconds)}</span> : null}
        </div>
      )}
      {m.body && <p className="body">{long ? `${m.body.slice(0, 600).trimEnd()}… ` : m.body}{long && <button className="linklike" onClick={() => setFull(true)}>Citește tot</button>}</p>}
      {m.helper && <div className="meta">Povestită de {nameOf(m.personId)}{m.author ? `, înregistrată de ${m.author.name}` : ""} în modul „la bunici”, cu acordul {m.consentAudioId ? <a href={`/api/document/${m.consentAudioId}`} target="_blank" rel="noopener">spus cu glasul</a> : "dat la început"}.</div>}
      {(m.whenText || m.place) && (
        <div className="meta">
          {m.whenText}{m.whenText && m.place ? " · " : ""}
          {m.place && (m.visibility === "private" ? m.place
            : <Link href={`/arbore/${treeId}/harta?loc=${encodeURIComponent(placeKey(m.place, null) ?? "")}`} title="Vezi locul pe harta neamului">{m.place}</Link>)}
        </div>
      )}
      {(m.mentions.length > 0 || m.editable) && (
        <div className="chips">
          {m.mentions.map((x) => <Link key={x.personId} className="chip" href={`/arbore/${treeId}/persoana/${x.personId}`}>{nameOf(x.personId)}</Link>)}
          {m.editable && <span className="chip priv" title="Cine vede amintirea">{vis}</span>}
          {m.editable && m.inBook && <span className="chip ok">poate intra în carte</span>}
          {m.mine && from && hiddenByProfile && <span className="chip">ascunsă de {nameOf(profileId)} de pe profil</span>}
        </div>
      )}
      <div className="tools">
        {m.visibility !== "private" && <button className="linklike" onClick={() => setReplying(!replying)}>Și eu îmi amintesc…</button>}
        {m.editable && <button className="linklike" onClick={() => setEditing(m.id)}>Schimbă</button>}
        {m.editable && <button className="linklike" onClick={() => setConfirm(true)}>Șterge</button>}
        {meHere && (meHere.hidden
          ? <button className="linklike" disabled={pending} onClick={() => run(() => hideMention(treeId, m.id, viewerPersonId!, false), "Amintirea apare din nou pe profilul tău.")}>Arată-o din nou pe profilul meu</button>
          : <button className="linklike" disabled={pending} onClick={() => run(() => hideMention(treeId, m.id, viewerPersonId!, true), "Am ascuns amintirea de pe profilul tău. În lada autorului rămâne.")}>Ascunde-o de pe profilul meu</button>)}
        <span className="muted" style={{ marginLeft: "auto", fontSize: 13 }}>{fmtDay(m.createdAt)}</span>
      </div>
      {confirm && (
        <div className="confirm" style={{ marginTop: 8 }}>
          Ștergi amintirea{m.replies.length ? ` și cele ${m.replies.length} răspunsuri de sub ea` : ""}? Nu se mai poate aduce înapoi.
          <div className="actions" style={{ marginTop: 8 }}>
            <button className="btn danger" disabled={pending} onClick={() => run(() => deleteMemory(treeId, m.id), "Am șters amintirea.")}>Da, șterge</button>
            <button className="btn" onClick={() => setConfirm(false)}>Nu</button>
          </div>
        </div>
      )}
      {(m.replies.length > 0 || replying) && (
        <div className="replies">
          {m.replies.map((r) => (
            <div key={r.id} className="reply">
              <span className="who">{r.author?.personId ? <Link href={`/arbore/${treeId}/persoana/${r.author.personId}`}>{r.author.name}</Link> : r.author?.name ?? "Cineva"}</span>
              <span className="muted"> · {fmtDay(r.createdAt)}</span>
              {(r.mine || m.editable) && <button className="linklike" style={{ float: "right", fontSize: 13 }} disabled={pending} onClick={() => run(() => deleteMemoryReply(treeId, r.id))}>Șterge</button>}
              <p>{r.body}</p>
            </div>
          ))}
          {replying && (
            <form className="ask-form" onSubmit={(e) => { e.preventDefault(); const t = reply; run(async () => { const r = await addMemoryReply(treeId, m.id, t); if (!r.error) { setReply(""); setReplying(false); } return r; }); }}>
              <textarea value={reply} onChange={(e) => setReply(e.target.value)} maxLength={4000} autoFocus placeholder="Ce îți amintești tu despre asta?" aria-label="Și eu îmi amintesc" />
              <div className="actions" style={{ marginTop: 0 }}>
                <button className="btn primary" disabled={pending || !reply.trim()}>Adaugă</button>
                <button type="button" className="btn" onClick={() => setReplying(false)}>Renunță</button>
              </div>
            </form>
          )}
        </div>
      )}
    </article>
  );
}
