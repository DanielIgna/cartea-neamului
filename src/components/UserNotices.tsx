import Link from "next/link";
import { db } from "@/db";
import { NOTICE_KINDS, unreadNotices, type NoticeKind } from "@/lib/invitatii";
import { closeNoticeAction } from "@/app/invitatii-actions";
import { getT } from "@/i18n/server";

/** Veștile din cont („Ai primit 7 zile gratuite pentru că Ion și-a făcut cont prin invitația ta”), sus, până le închide omul. */
export default async function UserNotices({ userId }: { userId: string }) {
  const list = (await unreadNotices(db, userId).catch(() => [])).filter((n) => (NOTICE_KINDS as readonly string[]).includes(n.kind));
  if (!list.length) return null;
  const t = await getT("Invites");
  return (
    <div className="user-notices">
      {list.map((n) => {
        const d = n.data ?? {};
        const text = t(`notice.${n.kind as NoticeKind}`, { name: String(d.name || t("someone")), days: String(d.days ?? "") });
        return (
          <div key={n.id} className="user-notice" role="status">
            <p>{text}</p>
            <div className="actions">
              <Link className="btn" href="/invitatii">{t("noticeSee")}</Link>
              <form action={closeNoticeAction}><input type="hidden" name="id" value={n.id} /><button className="btn">{t("noticeClose")}</button></form>
            </div>
          </div>
        );
      })}
    </div>
  );
}
