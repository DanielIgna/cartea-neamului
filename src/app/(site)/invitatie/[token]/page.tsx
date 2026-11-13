import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { user } from "@/db/schema";
import { currentUser } from "@/lib/access";
import { findInvitation } from "@/lib/invitations";
import { acceptInvite } from "@/app/actions";
import { getT } from "@/i18n/server";

export const dynamic = "force-dynamic";

const validToken = (token: string) => /^[A-Za-z0-9_-]{20,64}$/.test(token);

/**
 * Previzualizarea linkului de invitație: „Ana te invită în arborele familiei „Neamul Pop””, cu prenumele celui care a făcut
 * linkul și numele arborelui, nimic altceva (fără nume de rude, date sau locuri). Linkurile de invitație nu se indexează.
 */
export async function generateMetadata({ params }: { params: Promise<{ token: string }> }): Promise<Metadata> {
  const { token } = await params;
  const found = validToken(token) ? await findInvitation(db, token).catch(() => null) : null;
  if (!found || found.inv.expiresAt < new Date()) return { robots: { index: false, follow: false } };
  const t = await getT("Invitation");
  const creator = found.inv.createdBy;
  const [by] = creator ? await db.select({ name: user.name }).from(user).where(eq(user.id, creator)).limit(1).catch(() => []) : [];
  const first = by?.name?.trim().split(/\s+/)[0] ?? "";
  const title = first ? t("ogTitle", { name: first, tree: found.treeName }) : t("ogTitleNoName", { tree: found.treeName });
  const description = t("ogDescription");
  return {
    title, description, robots: { index: false, follow: false },
    openGraph: { title, description, url: `/invitatie/${token}`, siteName: "Cartea Neamului", locale: "ro_RO", type: "website" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function Invitation({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const me = await currentUser();
  const found = validToken(token) ? await findInvitation(db, token) : null;
  const expired = found && found.inv.expiresAt < new Date();
  const used = found && found.inv.acceptedBy && found.inv.acceptedBy !== me?.id;
  const t = await getT("Invitation");
  // Un link greșit sau expirat întoarce 404 (cu mesajul prietenos din not-found.tsx de alături), ca să nu fie tratat ca pagină bună.
  if (!found || expired) notFound();
  if (used) {
    return (
      <div className="card" style={{ maxWidth: 520, margin: "0 auto" }}>
        <h2>{t("used")}</h2>
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
