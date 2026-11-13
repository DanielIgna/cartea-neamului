import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { tree, treeMember } from "@/db/schema";
import { requireUser } from "@/lib/access";
import { chatContacts, inbox } from "@/lib/chat";
import { degreeWord, kinLabel } from "@/lib/kin-words";
import { shortDate } from "@/lib/person-text";
import PageIntl from "@/i18n/PageIntl";
import { getLocale, getT } from "@/i18n/server";
import { Avatar } from "@/components/Avatar";
import ChatLimit from "@/components/ChatLimit";
import LinkAnswer from "@/components/LinkAnswer";
import { roleIn } from "@/lib/access";
import { myLinks } from "@/lib/shared-places";
import { joinRequestsFor } from "@/lib/join";

export const dynamic = "force-dynamic";

/** Mesajele mele: pe fiecare arbore, rudele cu care pot vorbi, cu ultimul mesaj și câte sunt necitite. */
export default async function Inbox() {
  const me = await requireUser("/mesaje");
  const locale = await getLocale();
  const t = await getT("Chat", locale);
  const b = (c: React.ReactNode) => <b>{c}</b>;
  const preview = (from: string, body: string) => (from === me.id ? t("you", { text: body.slice(0, 80) }) : body.slice(0, 80));
  const trees = await db.select({ id: tree.id, name: tree.name }).from(treeMember).innerJoin(tree, eq(tree.id, treeMember.treeId)).where(eq(treeMember.userId, me.id));
  const links = await myLinks(db, me.id);
  const joins = await joinRequestsFor(db, me.id);
  // Conversațiile „Din aceleași locuri” stau în arborele celui care a acceptat, poate unul din care nu fac parte.
  const convs = await inbox(db, me.id, [...new Set([...trees.map((t) => t.id), ...links.filter((l) => l.status === "accepted").map((l) => l.treeId)])]);
  const sections = await Promise.all(trees.map(async (tr) => ({ tr, owner: (await roleIn(db, tr.id, me.id)) === "owner", ...(await chatContacts(db, tr.id, me.id)) })));
  return (
    <PageIntl ns={["Chat"]}>
    <section className="stack" style={{ maxWidth: 820, margin: "0 auto" }}>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>{t("title")}</h2>
        <p className="muted" style={{ margin: 0 }}>{t("intro")}</p>
      </div>
      {joins.length > 0 && (
        <div className="card">
          <div className="section-label" style={{ marginTop: 0 }}>{t("joinTitle")}</div>
          <p className="muted" style={{ marginTop: 0, fontSize: 14 }}>{t("joinIntro")}</p>
          <div className="stack" style={{ gap: 8 }}>
            {joins.map((j) => (
              <div key={j.id} className="link-row">
                <span className="who">
                  {t.rich("joinSays", { name: j.name, person: j.personName, sex: j.sex, hasBorn: j.born ? "yes" : "no", born: shortDate(j.born, locale), b,
                    link: (c) => <Link href={`/arbore/${j.treeId}?p=${j.personId}`}>{c}</Link> })}
                  <small>{t("joinAccount", { tree: j.treeName, email: j.email })}</small>
                  {j.note && <span className="notes" style={{ display: "block" }}>{j.note}</span>}
                </span>
                <LinkAnswer id={j.id} mode="ask" kind="join" />
              </div>
            ))}
          </div>
        </div>
      )}
      {links.length > 0 && (
        <div className="card">
          <div className="section-label" style={{ marginTop: 0 }}>{t("placesTitle")}</div>
          <p className="muted" style={{ marginTop: 0, fontSize: 14 }}>{t("placesIntro")}</p>
          <div className="stack" style={{ gap: 8 }}>
            {links.map((l) => {
              if (l.status === "accepted") {
                const conv = convs.find((x) => x.treeId === l.treeId && x.otherId === l.otherId);
                return (
                  <div key={l.id} className="link-row">
                    <Link className="who" href={`/mesaje/${l.treeId}/${l.otherId}`} style={{ color: "inherit", textDecoration: "none" }}>
                      <b>{l.name}</b>{conv?.unread ? <span className="badge">{conv.unread}</span> : null}
                      <small>{t("ancestorsFrom", { tree: l.treeName, place: l.place })}</small>
                      <small>{conv ? preview(conv.last.fromUserId, conv.last.body) : t("noMessages")}</small>
                    </Link>
                    {l.incoming && <LinkAnswer id={l.id} mode="end" />}
                  </div>
                );
              }
              if (l.incoming) {
                return (
                  <div key={l.id} className="link-row">
                    <span className="who">
                      {l.status === "pending" ? t.rich("asksLink", { name: l.name, b }) : t.rich("refused", { name: l.name, b })}
                      <small>{t("theirAncestors", { tree: l.treeName, place: l.place })}</small>
                      {l.note && l.status === "pending" && <span className="notes" style={{ display: "block" }}>{l.note}</span>}
                    </span>
                    <LinkAnswer id={l.id} mode={l.status === "pending" ? "ask" : "undo"} />
                  </div>
                );
              }
              return (
                <div key={l.id} className="link-row">
                  <span className="who">{t.rich("youAsked", { name: l.name, b })}<small>{t("ancestorsFrom", { tree: l.treeName, place: l.place })}</small></span>
                  <span className="chip">{l.status === "pending" ? t("waiting") : t("notAccepted")}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {sections.map(({ tr, owner, contacts, limit, mePersonId }) => {
        const allowed = contacts.filter((c) => c.allowed);
        return (
          <div className="card" key={tr.id}>
            <div className="section-label" style={{ marginTop: 0 }}>{t("treeUpTo", { tree: tr.name, degree: degreeWord(limit, locale) })}</div>
            {owner && <ChatLimit treeId={tr.id} limit={limit} />}
            {!mePersonId && <p className="muted">{t("notClaimed")}</p>}
            {mePersonId && !allowed.length && <p className="muted">{t("noRelatives", { degree: degreeWord(limit, locale) })}</p>}
            <div className="stack" style={{ gap: 8 }}>
              {allowed.map((c) => {
                const conv = convs.find((x) => x.treeId === tr.id && x.otherId === c.userId);
                return (
                  <Link key={c.userId} className="kin-card" href={`/mesaje/${tr.id}/${c.userId}`}>
                    <Avatar p={{ givenName: c.personName.split(" ")[0] ?? "", surname: c.personName.split(" ").slice(1).join(" "), photoId: c.photoId }} size={44} />
                    <span style={{ flex: 1 }}>
                      <b>{c.personName}</b>{conv?.unread ? <span className="badge">{conv.unread}</span> : null}
                      {c.kin && <small>{c.kin.degree ? t("kinDegree", { kin: kinLabel(c.kin.term, c.kin.sex, locale), degree: degreeWord(c.kin.degree, locale) }) : kinLabel(c.kin.term, c.kin.sex, locale)}</small>}
                      {conv && <small>{preview(conv.last.fromUserId, conv.last.body)}</small>}
                    </span>
                  </Link>
                );
              })}
            </div>
            {contacts.length > allowed.length && <p className="muted" style={{ fontSize: 13, marginBottom: 0 }}>{t("moreBeyond", { count: contacts.length - allowed.length, degree: degreeWord(limit, locale) })}</p>}
          </div>
        );
      })}
    </section>
    </PageIntl>
  );
}
