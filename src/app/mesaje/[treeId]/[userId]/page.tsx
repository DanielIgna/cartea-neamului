import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { requireUser } from "@/lib/access";
import { canMessage, conversation, markRead } from "@/lib/chat";
import { romanDegree } from "@/lib/kinship";
import ChatBox from "@/components/ChatBox";

export const dynamic = "force-dynamic";

export default async function Thread({ params }: { params: Promise<{ treeId: string; userId: string }> }) {
  const { treeId, userId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(treeId)) notFound();
  const me = await requireUser(`/mesaje/${treeId}/${userId}`);
  const ok = await canMessage(db, treeId, me.id, userId);
  const msgs = await conversation(db, treeId, me.id, userId);
  if (!ok.ok && !msgs.length) {
    return <section className="card" style={{ maxWidth: 720, margin: "0 auto" }}><p>{ok.reason}</p><Link href="/mesaje">← Înapoi la mesaje</Link></section>;
  }
  await markRead(db, treeId, me.id, userId);
  const c = ok.ok ? ok.contact : null;
  return (
    <section className="card" style={{ maxWidth: 720, margin: "0 auto" }}>
      <Link href="/mesaje" style={{ fontSize: 14 }}>← Toate mesajele</Link>
      <h2 style={{ margin: "8px 0 0" }}>{c?.personName ?? "Conversație"}</h2>
      {c?.via && <div className="meta">Din aceleași locuri: strămoși din {c.via.place} · {c.via.treeName}</div>}
      {c?.kin && <div className="meta">{c.kin.label}{c.kin.degree ? ` · gradul ${romanDegree(c.kin.degree)}` : ""} · <Link href={`/arbore/${treeId}/persoana/${c.personId}`}>profil</Link></div>}
      <ChatBox treeId={treeId} to={userId} canSend={ok.ok} reason={ok.ok ? null : ok.reason}
        messages={msgs.map((m) => ({ id: m.id, mine: m.fromUserId === me.id, body: m.body, at: m.createdAt.toISOString() }))} />
    </section>
  );
}
