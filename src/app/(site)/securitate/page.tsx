import { and, desc, eq, gt } from "drizzle-orm";
import { headers } from "next/headers";
import { db } from "@/db";
import { account, session, user } from "@/db/schema";
import { requireUser } from "@/lib/access";
import { auth } from "@/lib/auth";
import { PRIVATE_ROBOTS } from "@/lib/page-metadata";
import { deviceLabel } from "@/lib/securitate";
import SecuritySettings from "@/components/SecuritySettings";
import PageIntl from "@/i18n/PageIntl";
import { getAppName, getFormat, getLocale, getT } from "@/i18n/server";

export const dynamic = "force-dynamic";
export async function generateMetadata() {
  const t = await getT("Security");
  return { title: `${t("metaTitle")} · ${await getAppName()}`, robots: PRIVATE_ROBOTS };
}

/**
 * „Siguranța contului” (Daniel, 2026-11-13): verificarea în 2 pași, la alegerea omului (pentru panoul de admin e cerută),
 * unde e intrat în cont, cu „Ieși de pe toate celelalte”, și ce face site-ul singur (emailul la dispozitiv nou, blocarea).
 */
export default async function SecurityPage({ searchParams }: { searchParams: Promise<{ admin?: string }> }) {
  const me = await requireUser("/securitate");
  const { admin } = await searchParams;
  const locale = await getLocale();
  const [t, format] = await Promise.all([getT("Security", locale), getFormat(locale)]);
  const [u] = await db.select({ on: user.twoFactorEnabled }).from(user).where(eq(user.id, me.id));
  const hasPassword = (await db.select({ id: account.id }).from(account).where(and(eq(account.userId, me.id), eq(account.providerId, "credential")))).length > 0;
  const current = await auth.api.getSession({ headers: await headers() });
  const rows = await db.select({ id: session.id, token: session.token, createdAt: session.createdAt, updatedAt: session.updatedAt, ua: session.userAgent })
    .from(session).where(and(eq(session.userId, me.id), gt(session.expiresAt, new Date()))).orderBy(desc(session.updatedAt)).limit(20);
  const day = (d: Date) => format.dateTime(d, { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Bucharest" });
  const sessions = rows.map((r) => ({ id: r.id, label: deviceLabel(r.ua), since: t("since", { date: day(r.createdAt) }), current: r.token === current?.session.token }));
  return (
    <PageIntl ns={["Security"]}>
      <section className="stack" style={{ maxWidth: 640, margin: "0 auto" }}>
        <div className="card">
          <div className="section-label" style={{ marginTop: 0 }}>{t("label")}</div>
          <h2>{t("title")}</h2>
          <p style={{ marginBottom: 0 }}>{t("intro")}</p>
          {admin && !u?.on && <p className="err" style={{ marginBottom: 0 }}>{t("adminNeeded")}</p>}
        </div>
        <SecuritySettings enabled={!!u?.on} hasPassword={hasPassword} sessions={sessions} />
        <div className="card">
          <h3 style={{ marginTop: 0 }}>{t("alertsTitle")}</h3>
          <p style={{ marginBottom: 0 }}>{t("alertsText")}</p>
        </div>
      </section>
    </PageIntl>
  );
}
