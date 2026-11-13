import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { requireUser } from "@/lib/access";
import { canMessage, conversation, markRead } from "@/lib/chat";
import { degreeWord, kinLabel } from "@/lib/kin-words";
import ChatBox from "@/components/ChatBox";
import PageIntl from "@/i18n/PageIntl";
import { getLocale, getT } from "@/i18n/server";

export const dynamic = "force-dynamic";

export default async function Thread({ params }: { params: Promise<{ treeId: string; userId: string }> }) {
  const { treeId, userId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(treeId)) notFound();
  const me = await requireUser(`/mesaje/${treeId}/${userId}`);
  const ok = await canMessage(db, treeId, me.id, userId);
  const msgs = await conversation(db, treeId, me.id, userId);
  const locale = await getLocale();
  const t = await getT("Chat", locale);
  const reason = ok.ok ? null : ok.code === "beyondLimit" ? t("reasons.beyondLimit", { degree: degreeWord(ok.limit, locale) }) : t(`reasons.${ok.code}`);
  if (!ok.ok && !msgs.length) {
    return <section className="card" style={{ maxWidth: 720, margin: "0 auto" }}><p>{reason}</p><Link href="/mesaje">{t("backToMessages")}</Link></section>;
  }
  await markRead(db, treeId, me.id, userId);
  const c = ok.ok ? ok.contact : null;
  return (
    <PageIntl ns={["Chat"]}>
    <section className="card" style={{ maxWidth: 720, margin: "0 auto" }}>
      <Link href="/mesaje" style={{ fontSize: 14 }}>{t("allMessages")}</Link>
      <h2 style={{ margin: "8px 0 0" }}>{c?.personName ?? t("conversation")}</h2>
      {c?.via && <div className="meta">{t("viaPlaces", { place: c.via.place, tree: c.via.treeName })}</div>}
      {c?.kin && <div className="meta">{c.kin.degree ? t("kinDegree", { kin: kinLabel(c.kin.term, c.kin.sex, locale), degree: degreeWord(c.kin.degree, locale) }) : kinLabel(c.kin.term, c.kin.sex, locale)} · <Link href={`/arbore/${treeId}/persoana/${c.personId}`}>{t("profile")}</Link></div>}
      <ChatBox treeId={treeId} to={userId} canSend={ok.ok} reason={reason}
        messages={msgs.map((m) => ({ id: m.id, mine: m.fromUserId === me.id, body: m.body, at: m.createdAt.toISOString() }))} />
    </section>
    </PageIntl>
  );
}
