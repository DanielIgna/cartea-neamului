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
import ProfileRelatives from "@/components/ProfileRelatives";
import { closeFamily, closeKinIds, mayEdit, shareIds, type RelKind } from "@/lib/relatives";
import { editLimits, limitFor } from "@/lib/edit-limits";
import { loadHouses } from "@/lib/old-house";
import OldHouse from "@/components/OldHouse";

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
  // Rudele apropiate: fiecare le poate completa și corecta din profil (cele revendicate de altcineva rămân ale lor), dacă adminul nu i-a limitat.
  const limits = await editLimits(db);
  const [te, tr] = await Promise.all([getT("TreeErrors", locale), getT("Relatives", locale)]);
  const addLimit = limitFor(limits, id, me.id, role, "add"), editLimit = limitFor(limits, id, me.id, role, "edit");
  const myKin = mine ? closeKinIds(g, mine.id) : null;
  const fixable = (x: { id: string; createdBy: string | null; claimedBy: string | null }) => !editLimit
    && mayEdit({ editor: can(role, "editor"), contributor: can(role, "contributor"), meId: me.id, kin: myKin, target: x });
  const canEdit = fixable(p);
  const cf = closeFamily(g, pid);
  const shownPartners = cf.partners.filter((x) => !data.people[x]?.discreet);
  const relIds = new Set<string>([pid, cf.father, cf.mother, cf.paternal.grandfather, cf.paternal.grandmother, cf.maternal.grandfather, cf.maternal.grandmother,
    ...cf.partners, ...cf.siblings, ...cf.children, ...cf.nephews.flatMap((n) => [n.via, ...n.ids]), ...cf.grandchildren.flatMap((n) => [n.via, ...n.ids])]
    .filter((x): x is string => !!x && !!data.people[x]));
  const slots: [string, RelKind][] = [[pid, "father"], [pid, "mother"], [pid, "spouse"], [pid, "sibling"], [pid, "child"],
    ...[cf.father, cf.mother].filter((x): x is string => !!x).flatMap((x) => [[x, "father"], [x, "mother"]] as [string, RelKind][]),
    ...cf.siblings.map((x) => [x, "child"] as [string, RelKind]), ...cf.children.map((x) => [x, "child"] as [string, RelKind])];
  const sexOf = (x: string) => data.people[x]?.sex;
  const share: Record<string, string[]> = {}, lookalikes: Record<string, string[]> = {}, partnersOf: Record<string, string[]> = {};
  for (const [a, k] of slots) {
    const f = family(g, a);
    share[`${a}:${k}`] = shareIds(g, sexOf, a, k);
    lookalikes[`${a}:${k}`] = k === "child" ? f.children : k === "sibling" ? f.siblings
      : k === "spouse" ? [...new Set([...f.partners, ...f.children.flatMap((c) => g.parents.get(c) ?? [])])].filter((x) => x !== a) : [];
    if (k === "child") partnersOf[a] = [...f.partners].sort((x, y) => Number(!!data.people[x]?.discreet) - Number(!!data.people[y]?.discreet));
    for (const x of [...share[`${a}:${k}`], ...lookalikes[`${a}:${k}`], ...(partnersOf[a] ?? [])]) if (data.people[x]) relIds.add(x);
  }
  const relPeople = Object.fromEntries([...relIds].map((x) => [x, data.people[x]]));
  const lockedNote = !can(role, "contributor") ? tr("viewerOnly") : addLimit ? te(`limit.${addLimit}`) : editLimit ? te(`limit.${editLimit}`) : null;
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
  // Casa bătrânească: cele pe care le poate vedea, după aceleași reguli ca amintirile.
  const houses = await loadHouses(db, id, pid, { userId: me.id, personId: mine?.id ?? null }, g, data.tree.chatMaxDegree, p.claimedBy ?? null);
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
    <PageIntl ns={["Media", "Lada", "MemoryForm", "Voice", "PersonForm", "Relatives", "OldHouse"]}>
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
      <OldHouse treeId={id} personId={pid} name={p.givenName} houses={houses} canAdd={can(role, "contributor")} canEditOrphans={can(role, "editor")}
        storage={storageConfigured()} living={p.living} />
      {/* Soții discreți (de pildă o fostă soție) nu apar aici; se văd doar în profilurile copiilor lor, la „Părinți”. */}
      <ProfileRelatives treeId={id} personId={pid} own={mine?.id === pid} people={relPeople}
        data={{ father: cf.father, mother: cf.mother, paternal: cf.paternal, maternal: cf.maternal, partners: shownPartners, siblings: cf.siblings,
          children: cf.children, nephews: cf.nephews, grandchildren: cf.grandchildren }}
        editable={[...relIds].filter((x) => fixable(data.people[x]))} canAdd={can(role, "contributor") && !addLimit} lockedNote={lockedNote}
        share={share} lookalikes={lookalikes} partners={partnersOf} />
      {(rl.carers.length > 0 || rl.raised.length > 0) && (
        <div className="card">
          {group(tp("raisedBy", { sex: p.sex }), rl.carers)}
          {group(fam.children.length ? tp("raisedAlso") : tp("raised"), rl.raised)}
        </div>
      )}
    </section>
    </PageIntl>
  );
}
