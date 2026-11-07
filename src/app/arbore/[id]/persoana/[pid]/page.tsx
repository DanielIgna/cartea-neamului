import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { person } from "@/db/schema";
import { loadTreeView, where } from "@/lib/tree-data";
import { requireUser, roleIn, can } from "@/lib/access";
import { buildGraph, family, kinship } from "@/lib/kinship";
import { canMessage } from "@/lib/chat";
import { storageConfigured } from "@/lib/storage";
import { lifeDates, years } from "@/lib/person-text";
import { Avatar } from "@/components/Avatar";
import ProfileAlbum from "@/components/ProfileAlbum";
import PhotoPick from "@/components/PhotoPick";
import { raisedLinks } from "@/lib/raised";
import { isPlaceholder } from "@/lib/family";
import { questionContext } from "@/lib/lada";
import { loadLada } from "@/lib/lada-db";
import { questionsFor, sundayQuestion, type Question } from "@/lib/questions";
import MemoryBox from "@/components/MemoryBox";
import { hasConsent } from "@/lib/consent";
import PageIntl from "@/i18n/PageIntl";
import { getLocale, getT } from "@/i18n/server";
import { degreeWord, kinLabel } from "@/lib/kin-words";

export const dynamic = "force-dynamic";
const UUID = /^[0-9a-f-]{36}$/i;

/** Profilul unei persoane: poza, ce se știe despre ea, lada cu amintiri, albumul cu descrieri și familia ei apropiată. */
export default async function ProfilePage({ params, searchParams }: { params: Promise<{ id: string; pid: string }>; searchParams: Promise<{ scrie?: string }> }) {
  const { id, pid } = await params;
  const { scrie } = await searchParams;
  if (!UUID.test(id) || !UUID.test(pid)) notFound();
  const me = await requireUser(`/arbore/${id}/persoana/${pid}`);
  const role = await roleIn(db, id, me.id);
  if (!role) notFound();
  const locale = await getLocale();
  const [t, tp, tc] = await Promise.all([getT("Profile", locale), getT("Person", locale), getT("Chat", locale)]);
  const data = await loadTreeView(db, id, undefined, 1, locale);
  const p = data?.people[pid];
  if (!data || !p) notFound();
  const g = buildGraph(Object.values(data.people), data.rels);
  const fam = family(g, pid);
  const rl = raisedLinks(g, data.raised, pid);
  const [mine] = await db.select({ id: person.id }).from(person).where(and(eq(person.treeId, id), eq(person.claimedByUserId, me.id))).limit(1);
  const ego = mine?.id ?? data.rootId;
  const kin = ego && ego !== pid ? kinship(g, ego, pid) : null;
  const chat = p.claimedBy && p.claimedBy !== me.id ? await canMessage(db, id, me.id, p.claimedBy) : null;
  const canEdit = can(role, "editor") || (can(role, "contributor") && (p.createdBy === me.id || p.claimedBy === me.id));
  // Lada cu amintiri: ce poate vedea cel care se uită, și, pentru omul însuși, întrebarea de duminică și următoarele (pentru „Altă întrebare”).
  const lada = await loadLada(db, id, pid, { userId: me.id, personId: mine?.id ?? null }, g, data.tree.chatMaxDegree);
  let upcoming: Question[] = [];
  const qctx = lada.isOwner ? questionContext(g, data.people, pid) : null;
  if (qctx) {
    const all = questionsFor(qctx, await getT("Questions", locale), locale), now = new Date();
    const left = all.filter((q) => !lada.answeredKeys.includes(q.key)).length;
    upcoming = Array.from({ length: Math.min(12, left) }, (_, k) => sundayQuestion(all, lada.answeredKeys, now, k)).filter((q): q is Question => !!q);
  }
  const options = Object.values(data.people).filter((x) => !isPlaceholder(x.givenName))
    .map((x) => ({ id: x.id, name: x.name, years: years(x, locale) })).sort((a, b) => a.name.localeCompare(b.name, locale));
  const memories = lada.own.length + lada.about.length;
  const bornIn = where(p.birthPlace, p.birthCountry, locale);
  const group = (title: string, ids: string[]) => ids.length > 0 && (
    <>
      <div className="section-label">{title}</div>
      <div className="kin-grid">
        {ids.map((x) => data.people[x]).filter(Boolean).map((r) => (
          <Link key={r.id} className="kin-card" href={`/arbore/${id}/persoana/${r.id}`}>
            <Avatar p={r} size={44} />
            <span><b>{r.name}</b><small>{years(r, locale)}</small></span>
          </Link>
        ))}
      </div>
    </>
  );
  return (
    <PageIntl ns={["Media", "Lada", "MemoryForm", "Voice"]}>
    <section className="stack" style={{ maxWidth: 980, margin: "0 auto" }}>
      <div className="card">
        <Link href={`/arbore/${id}?p=${pid}`} style={{ fontSize: 14 }}>{t("back", { name: p.givenName })}</Link>
        <div className="profile-hero" style={{ marginTop: 12 }}>
          <div style={{ display: "grid", justifyItems: "center", gap: 6 }}>
            <Avatar p={p} size={128} />
            {storageConfigured() && (canEdit || (can(role, "contributor") && !p.photoId)) && <span style={{ fontSize: 14 }}><PhotoPick treeId={id} p={{ id: p.id, name: p.name, photoId: p.photoId }} /></span>}
          </div>
          <div>
            <h2>{p.name}</h2>
            <div className="meta">{p.birthSurname ? `${tp("bornAs", { sex: p.sex, surname: p.birthSurname })} · ` : ""}{lifeDates(p, locale)}{bornIn ? ` · ${t("bornIn", { sex: p.sex, place: bornIn })}` : ""}
              {p.living && (p.residencePlace || p.residenceCountry) ? ` · ${t("livesIn", { place: where(p.residencePlace, p.residenceCountry, locale) || p.residenceCountry || "" })}` : ""}</div>
            <div className="chips">
              {p.living ? <span className="chip priv">{tp("chipLiving")}</span> : <span className="chip">{t("chipMemory")}</span>}
              {p.claimed && <span className="chip ok">{tp("chipClaimed")}</span>}
              {p.occupation && <span className="chip">{p.occupation}</span>}
            </div>
            {kin && <div className="kin">{t.rich("forYou", { kin: kinLabel(kin.term, kin.sex, locale), b: (c) => <b>{c}</b> })}{kin.degree ? ` · ${t("degree", { degree: degreeWord(kin.degree, locale) })}` : ""}</div>}
            <div className="actions">
              {chat?.ok && <Link className="btn primary" href={`/mesaje/${id}/${p.claimedBy}`}>{t("sendMessage")}</Link>}
              {(p.living || memories > 0) && <a className="btn" href={p.living || lada.own.length ? "#lada" : "#despre"}>{t("memoryBox", { mine: lada.isOwner ? "yes" : "no" })}{memories ? ` (${memories})` : ""}</a>}
              {chat && !chat.ok && <span className="muted" style={{ fontSize: 14 }}>{chat.code === "beyondLimit" ? tc("reasons.beyondLimit", { degree: degreeWord(chat.limit, locale) }) : tc(`reasons.${chat.code}`)}</span>}
              {p.living && !p.claimed && <span className="muted" style={{ fontSize: 14 }}>{t("noAccount", { name: p.givenName, sex: p.sex })}</span>}
            </div>
          </div>
        </div>
      </div>
      <div className="card">
        <div className="section-label" style={{ marginTop: 0 }}>{p.living ? t("about", { name: p.givenName }) : tp("whatWeKnow", { name: p.givenName })}</div>
        {p.biography ? <p className="bio">{p.biography}</p> : <p className="muted">{canEdit ? t("nothingEdit") : tp("nothingYet")}</p>}
        {p.notes && <><div className="section-label">{tp("notes")}</div><p className="notes">{p.notes}</p></>}
      </div>
      <MemoryBox treeId={id} owner={{ id: p.id, givenName: p.givenName, sex: p.sex, living: p.living, claimed: p.claimed }} isOwner={lada.isOwner}
        viewerPersonId={mine?.id ?? null} canAsk={p.living && !lada.isOwner} canHelp={p.living && !p.claimed && can(role, "contributor")} own={lada.own} about={lada.about} questions={lada.questions} upcoming={upcoming}
        people={options} storage={storageConfigured()} defaultDegree={data.tree.chatMaxDegree} startMention={scrie ?? null}
        faithConsent={lada.isOwner ? await hasConsent(db, me.id, "faith") : false} />
      <div className="card">
        <div className="section-label" style={{ marginTop: 0 }}>{t("album")}</div>
        <ProfileAlbum p={p} treeId={id} canEdit={can(role, "contributor")} canUpload={can(role, "contributor") && storageConfigured()} />
      </div>
      <div className="card">
        {/* Soții discreți (de pildă o fostă soție) nu apar aici; se văd doar în profilurile copiilor lor, la „Părinți”. */}
        {(() => { const shown = fam.partners.filter((x) => !data.people[x]?.discreet); return group(tp("spouses", { count: shown.length, sex: p.sex }), shown); })()}
        {group(tp("children", { count: fam.children.length }), fam.children)}
        {group(tp("parents"), fam.parents)}
        {group(tp("raisedBy", { sex: p.sex }), rl.carers)}
        {group(fam.children.length ? tp("raisedAlso") : tp("raised"), rl.raised)}
        {group(tp("siblings", { count: fam.siblings.length }), fam.siblings)}
        {!fam.partners.length && !fam.children.length && !fam.parents.length && !rl.carers.length && !rl.raised.length && <p className="muted">{tp("noRelatives")}</p>}
      </div>
    </section>
    </PageIntl>
  );
}
