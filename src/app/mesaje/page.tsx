import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { tree, treeMember } from "@/db/schema";
import { requireUser } from "@/lib/access";
import { chatContacts, inbox } from "@/lib/chat";
import { romanDegree } from "@/lib/kinship";
import { Avatar } from "@/components/Album";
import ChatLimit from "@/components/ChatLimit";
import { roleIn } from "@/lib/access";

export const dynamic = "force-dynamic";

/** Mesajele mele: pe fiecare arbore, rudele cu care pot vorbi, cu ultimul mesaj și câte sunt necitite. */
export default async function Inbox() {
  const me = await requireUser("/mesaje");
  const trees = await db.select({ id: tree.id, name: tree.name }).from(treeMember).innerJoin(tree, eq(tree.id, treeMember.treeId)).where(eq(treeMember.userId, me.id));
  const convs = await inbox(db, me.id, trees.map((t) => t.id));
  const sections = await Promise.all(trees.map(async (t) => ({ t, owner: (await roleIn(db, t.id, me.id)) === "owner", ...(await chatContacts(db, t.id, me.id)) })));
  return (
    <section className="stack" style={{ maxWidth: 820, margin: "0 auto" }}>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Mesaje între rude</h2>
        <p className="muted" style={{ margin: 0 }}>Poți scrie rudelor care și-au revendicat fișa în același arbore, până la gradul de rudenie ales de proprietarul arborelui. Soții își pot scrie oricând.</p>
      </div>
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
