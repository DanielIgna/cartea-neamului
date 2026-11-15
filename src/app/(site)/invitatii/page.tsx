import Link from "next/link";
import { PRIVATE_ROBOTS } from "@/lib/page-metadata";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { inviteCode, tree, user } from "@/db/schema";
import { requireUser } from "@/lib/access";
import { planSettings } from "@/lib/plans";
import { checkReward, ensureInviteCode, inviteSettings, myInvites, proofOf, shareableTrees } from "@/lib/invitatii";
import { SITE_URL } from "@/lib/site-url";
import InviteShare from "@/components/InviteShare";
import VerifyEmailButton from "@/components/VerifyEmailButton";
import ShareTreeForm from "@/components/ShareTreeForm";
import { getAppName, getFormat, getLocale, getT } from "@/i18n/server";

export const dynamic = "force-dynamic";
export async function generateMetadata() {
  const t = await getT("Invites");
  return { title: `${t("metaTitle")} · ${await getAppName()}`, robots: PRIVATE_ROBOTS };
}

/**
 * „Invitațiile mele” (/invitatii): legătura personală cu butoanele de trimis, ce arbore vede cine vine prin ea, câți au deschis-o,
 * câți și-au făcut cont, câte zile s-au câștigat și cine a venit. Cine a venit el însuși printr-o invitație vede aici ce mai are
 * de făcut (email confirmat, o rudă în arbore) ca să primească amândoi zilele. Vezi src/lib/invitatii.ts.
 */
export default async function MyInvites() {
  const me = await requireUser("/invitatii");
  // Poate tocmai și-a confirmat emailul (legătura din email duce aici): dacă e gata dovada, se dau zilele acum.
  await checkReward(db, me.id).catch((e) => console.error("invitatii", e));
  const locale = await getLocale();
  const [t, format, app, code, s, plans, mine, proof, trees] = await Promise.all([
    getT("Invites", locale), getFormat(locale), getAppName(locale), ensureInviteCode(db, me.id), inviteSettings(db), planSettings(db),
    myInvites(db, me.id), proofOf(db, me.id), shareableTrees(db, me.id),
  ]);
  const [{ shareTreeId } = { shareTreeId: null }] = await db.select({ shareTreeId: inviteCode.shareTreeId }).from(inviteCode).where(eq(inviteCode.userId, me.id));
  const [{ verified } = { verified: false }] = await db.select({ verified: user.emailVerified }).from(user).where(eq(user.id, me.id));
  const [firstTree] = await db.select({ id: tree.id }).from(tree).where(eq(tree.ownerId, me.id)).limit(1);
  const link = `${SITE_URL}/i/${code}`;
  const base = plans.trialDays, total = base + s.daysReferred;
  const n = (v: number) => format.number(v);
  const statusOf = (p: { status: string; reason: string | null }) =>
    p.status === "acordat" ? (p.reason === "limita-lunara" ? t("status.limita") : t("status.acordat")) : p.status === "respins" ? t("status.respins") : t("status.asteapta");
  return (
    <section className="stack invites">
      {mine.invitedBy && mine.invitedBy.status === "asteapta" && (
        <div className="card">
          <div className="section-label" style={{ marginTop: 0 }}>{t("pendingTitle", { name: mine.invitedBy.name || t("someone") })}</div>
          <p>{t("pendingText", { days: String(s.daysReferred) })}</p>
          <ol className="invite-steps">
            <li>{verified || proof.google ? <>✓ {t("stepEmailDone")}</> : <>{t("stepEmail")}<br /><VerifyEmailButton email={me.email} label={t("sendVerify")} sent={t("verifySent")} failed={t("verifyFailed")} /></>}</li>
            <li>{proof.persons > 0 ? <>✓ {t("stepPersonDone")}</> : <>{t("stepPerson")}<br />
              <Link className="btn" href={firstTree ? `/arbore/${firstTree.id}` : "/arbore-nou"}>{firstTree ? t("myTrees") : t("startTree")}</Link></>}</li>
          </ol>
        </div>
      )}
      {mine.invitedBy?.status === "acordat" && <p className="muted" role="status">{t("gotDays")}</p>}

      <div className="card">
        <div className="section-label" style={{ marginTop: 0 }}>{t("label")}</div>
        <h2>{t("title")}</h2>
        {s.on ? (
          <>
            <p>{t("lead", { days: String(s.daysReferrer), more: String(s.daysReferred), total: String(total), base: String(base) })}</p>
            <p className="muted small">{t("paidNote")}{s.monthlyCap > 0 ? ` ${t("capNote", { cap: String(s.monthlyCap) })}` : ""}</p>
          </>
        ) : <p className="muted">{t("off")}</p>}
        <div className="section-label">{t("yourLink")}</div>
        <InviteShare link={link} app={app} total={total} />
      </div>

      <div className="stats">
        <div className="stat"><div className="stat-label">{t("statClicks")}</div><div className="stat-value">{n(mine.clicks)}</div></div>
        <div className="stat"><div className="stat-label">{t("statAccounts")}</div><div className="stat-value">{n(mine.accounts)}</div></div>
        <div className="stat"><div className="stat-label">{t("statRewarded")}</div><div className="stat-value">{n(mine.rewarded)}</div></div>
        <div className="stat ok"><div className="stat-label">{t("statDays")}</div><div className="stat-value">{n(mine.daysEarned)}</div></div>
      </div>

      {s.shareTree && trees.length > 0 && (
        <div className="card">
          <div className="section-label" style={{ marginTop: 0 }}>{t("shareTitle")}</div>
          <p className="muted small">{t("shareNote")}</p>
          <ShareTreeForm current={shareTreeId ?? ""} options={[{ id: "", label: t("shareNone") }, ...trees.map((x) => ({ id: x.id, label: t("shareTree", { tree: x.name }) }))]}
            save={t("shareSave")} saved={t("shareSaved")} />
        </div>
      )}

      <div className="card">
        <div className="section-label" style={{ marginTop: 0 }}>{t("listTitle")}</div>
        {mine.people.length === 0 ? <p className="muted">{t("empty")}</p> : (
          <ul className="invite-list">
            {mine.people.map((p, i) => (
              <li key={i}><b>{p.name || t("someone")}</b> <span className="muted small">· {format.dateTime(p.at, { day: "numeric", month: "short", year: "numeric" })}</span><br />
                <span className={`pill${p.status === "acordat" && !p.reason ? " ok" : p.status === "respins" ? " warn" : ""}`}>{statusOf(p)}</span></li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
