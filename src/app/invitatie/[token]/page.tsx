import Link from "next/link";
import { db } from "@/db";
import { currentUser } from "@/lib/access";
import { findInvitation } from "@/lib/invitations";
import { acceptInvite } from "@/app/actions";
import { getT } from "@/i18n/server";

export const dynamic = "force-dynamic";

export default async function Invitation({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const me = await currentUser();
  const found = /^[A-Za-z0-9_-]{20,64}$/.test(token) ? await findInvitation(db, token) : null;
  const expired = found && found.inv.expiresAt < new Date();
  const used = found && found.inv.acceptedBy && found.inv.acceptedBy !== me?.id;
  const t = await getT("Invitation");
  if (!found || expired || used) {
    return (
      <div className="card" style={{ maxWidth: 520, margin: "0 auto" }}>
        <h2>{!found ? t("notFound") : expired ? t("expired") : t("used")}</h2>
        <p className="muted">{t("askNew")}</p>
      </div>
    );
  }
  const next = `/invitatie/${token}`;
  return (
    <div className="card" style={{ maxWidth: 520, margin: "0 auto" }}>
      <div className="section-label" style={{ marginTop: 0 }}>{t("label")}</div>
      <h2>{t("title", { tree: found.treeName })}</h2>
      <p>{t("text")}</p>
      {found.inv.personId && <p className="muted">{t("alreadyIn")}</p>}
      {me ? (
        <form action={async () => { "use server"; await acceptInvite(token); }}>
          <button className="btn primary">{t("enterAs", { name: me.name })}</button>
        </form>
      ) : (
        <div className="actions">
          <Link className="btn primary" href={`/intrare?mod=cont-nou&next=${encodeURIComponent(next)}`}>{t("signUp")}</Link>
          <Link className="btn" href={`/intrare?next=${encodeURIComponent(next)}`}>{t("haveAccount")}</Link>
        </div>
      )}
    </div>
  );
}
