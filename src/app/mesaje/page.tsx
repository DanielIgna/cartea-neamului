import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { tree, treeMember } from "@/db/schema";
import { requireUser } from "@/lib/access";
import { chatContacts, inbox } from "@/lib/chat";
import { romanDegree } from "@/lib/kinship";
import { Avatar } from "@/components/Album";
import ChatLimit from "@/components/ChatLimit";
import LinkAnswer from "@/components/LinkAnswer";
import { roleIn } from "@/lib/access";
import { myLinks } from "@/lib/shared-places";

export const dynamic = "force-dynamic";

/** Mesajele mele: pe fiecare arbore, rudele cu care pot vorbi, cu ultimul mesaj și câte sunt necitite. */
export default async function Inbox() {
  const me = await requireUser("/mesaje");
  const trees = await db.select({ id: tree.id, name: tree.name }).from(treeMember).innerJoin(tree, eq(tree.id, treeMember.treeId)).where(eq(treeMember.userId, me.id));
  const links = await myLinks(db, me.id);
  // Conversațiile „Din aceleași locuri” stau în arborele celui care a acceptat, poate unul din care nu fac parte.
  const convs = await inbox(db, me.id, [...new Set([...trees.map((t) => t.id), ...links.filter((l) => l.status === "accepted").map((l) => l.treeId)])]);
  const sections = await Promise.all(trees.map(async (t) => ({ t, owner: (await roleIn(db, t.id, me.id)) === "owner", ...(await chatContacts(db, t.id, me.id)) })));
  return (
    <section className="stack" style={{ maxWidth: 820, margin: "0 auto" }}>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Mesaje între rude</h2>
        <p className="muted" style={{ margin: 0 }}>Poți scrie rudelor care și-au revendicat fișa în același arbore, până la gradul de rudenie ales de proprietarul arborelui. Soții își pot scrie oricând.</p>
      </div>
      {links.length > 0 && (
        <div className="card">
          <div className="section-label" style={{ marginTop: 0 }}>Din aceleași locuri</div>
          <p className="muted" style={{ marginTop: 0, fontSize: 14 }}>Familii din alți arbori, cu strămoși în aceleași sate. Le găsești pe harta neamului.</p>
          <div className="stack" style={{ gap: 8 }}>
            {links.map((l) => {
              if (l.status === "accepted") {
                const conv = convs.find((x) => x.treeId === l.treeId && x.otherId === l.otherId);
                return (
                  <div key={l.id} className="link-row">
                    <Link className="who" href={`/mesaje/${l.treeId}/${l.otherId}`} style={{ color: "inherit", textDecoration: "none" }}>
                      <b>{l.name}</b>{conv?.unread ? <span className="badge">{conv.unread}</span> : null}
                      <small>{l.treeName} · strămoși din {l.place}</small>
                      <small>{conv ? `${conv.last.fromUserId === me.id ? "Tu: " : ""}${conv.last.body.slice(0, 80)}` : "Niciun mesaj încă. Scrie primul."}</small>
                    </Link>
                    {l.incoming && <LinkAnswer id={l.id} mode="end" />}
                  </div>
                );
              }
              if (l.incoming) {
                return (
                  <div key={l.id} className="link-row">
                    <span className="who">
                      {l.status === "pending" ? <><b>{l.name}</b> vă cere legătura</> : <>Ai refuzat legătura cu <b>{l.name}</b></>}
                      <small>{l.treeName} · au strămoși în {l.place}</small>
                      {l.note && l.status === "pending" && <span className="notes" style={{ display: "block" }}>{l.note}</span>}
                    </span>
                    <LinkAnswer id={l.id} mode={l.status === "pending" ? "ask" : "undo"} />
                  </div>
                );
              }
              return (
                <div key={l.id} className="link-row">
                  <span className="who">Ai cerut legătura cu <b>{l.name}</b><small>{l.treeName} · strămoși din {l.place}</small></span>
                  <span className="chip">{l.status === "pending" ? "Așteaptă răspunsul" : "Nu a acceptat legătura"}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {sections.map(({ t, owner, contacts, limit, mePersonId }) => {
        const allowed = contacts.filter((c) => c.allowed);
        return (
          <div className="card" key={t.id}>
            <div className="section-label" style={{ marginTop: 0 }}>{t.name} · rude până la gradul {romanDegree(limit)}</div>
            {owner && <ChatLimit treeId={t.id} limit={limit} />}
            {!mePersonId && <p className="muted">În acest arbore nu ți-ai revendicat încă fișa, așa că rudele nu știu cine ești. Cere o invitație legată de fișa ta.</p>}
            {mePersonId && !allowed.length && <p className="muted">Nicio rudă cu cont în acest arbore, până la gradul {romanDegree(limit)}. Invită-le din arbore.</p>}
            <div className="stack" style={{ gap: 8 }}>
              {allowed.map((c) => {
                const conv = convs.find((x) => x.treeId === t.id && x.otherId === c.userId);
                return (
                  <Link key={c.userId} className="kin-card" href={`/mesaje/${t.id}/${c.userId}`}>
                    <Avatar p={{ givenName: c.personName.split(" ")[0] ?? "", surname: c.personName.split(" ").slice(1).join(" "), photoId: c.photoId }} size={44} />
                    <span style={{ flex: 1 }}>
                      <b>{c.personName}</b>{conv?.unread ? <span className="badge">{conv.unread}</span> : null}
                      <small>{c.kin?.label}{c.kin?.degree ? ` · gradul ${romanDegree(c.kin.degree)}` : ""}</small>
                      {conv && <small>{conv.last.fromUserId === me.id ? "Tu: " : ""}{conv.last.body.slice(0, 80)}</small>}
                    </span>
                  </Link>
                );
              })}
            </div>
            {contacts.length > allowed.length && <p className="muted" style={{ fontSize: 13, marginBottom: 0 }}>Alte {contacts.length - allowed.length} rude cu cont sunt mai departe de gradul {romanDegree(limit)}.</p>}
          </div>
        );
      })}
    </section>
  );
}
