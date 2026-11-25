import type { Metadata } from "next";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { accountPlan } from "@/db/schema";
import { currentUser } from "@/lib/access";
import { getLocale, getT } from "@/i18n/server";
import { PRIVATE_ROBOTS } from "@/lib/page-metadata";
import { isTier } from "@/lib/plans";
import { DURATA_LUNI, normalizeActivationCode } from "@/lib/coduri-activare";
import { HELP_EMAIL } from "@/lib/coduri-activare-email";
import { activareAction } from "@/app/coduri-activare-actions";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT("CodActivare");
  return { title: t("metaTitle"), robots: PRIVATE_ROBOTS };
}

const ERRORS = { invalid: "invalid", used: "used", cancelled: "cancelled", prea_multe: "tooMany", has_subscription: "hasSub" } as const;

/**
 * Activarea codurilor de pe cardurile cadou vândute pe alte platforme (Trendyol…), Daniel 25.11.2026. Codul vine din QR
 * (/activare?cod=…) sau se scrie de mână. Fără cont: „Continuă” duce la cont nou sau intrare, apoi înapoi aici cu codul.
 * Pe pagină NU apar prețuri, oferte, alte pachete sau butoane de cumpărare: doar titlul, câmpul, butonul, 3 pași și emailul de ajutor.
 */
export default async function Activare({ searchParams }: { searchParams: Promise<{ cod?: string; r?: string }> }) {
  const { cod: rawCod, r } = await searchParams;
  const [t, tp, locale, me] = await Promise.all([getT("CodActivare"), getT("Plata"), getLocale(), currentUser()]);
  const cod = normalizeActivationCode(rawCod ?? "") ?? (rawCod ?? "").slice(0, 24);
  const next = `/activare${cod ? `?cod=${encodeURIComponent(cod)}` : ""}`;
  // Textul cu adresa de ajutor ca legătură: {email} se pune printr-un semn de loc, apoi se înlocuiește cu legătura.
  const withMail = (key: "help" | "cancelled") => t(key, { email: "\u0000" }).split("\u0000").flatMap((part, i) =>
    i ? [<a key={i} href={`mailto:${HELP_EMAIL}`}>{HELP_EMAIL}</a>, part] : [part]);

  let done: string | null = null;
  if (me && (r === "ok" || r === "ok_prelungit" || r === "used_by_you")) {
    const [p] = await db.select({ tier: accountPlan.tier, paidUntil: accountPlan.paidUntil }).from(accountPlan).where(eq(accountPlan.userId, me.id));
    if (p?.paidUntil) {
      const plan = tp(`tiers.${isTier(p.tier) ? p.tier : "basic"}.name`);
      const date = new Intl.DateTimeFormat(locale, { dateStyle: "long", timeZone: "Europe/Bucharest" }).format(p.paidUntil);
      done = t(r === "ok" ? "ok" : r === "ok_prelungit" ? "okExtended" : "usedByYou", { plan, date });
    }
  }
  const err = r && r in ERRORS ? ERRORS[r as keyof typeof ERRORS] : null;

  return (
    <section className="stack" style={{ maxWidth: 560, margin: "0 auto" }}>
      <div className="card">
        <h1 style={{ marginTop: 0 }}>{t("title")}</h1>
        {done ? (
          <>
            <p className="cc-ok" role="status">{done}</p>
            <div className="actions"><Link className="btn primary" href="/">{t("toTree")}</Link></div>
          </>
        ) : (
          <>
            <p>{t("lead")}</p>
            {err === "hasSub" ? (
              <p className="err" role="alert">{t("hasSub", { months: DURATA_LUNI })} <Link href="/plata#abonament">{t("myPlan")}</Link></p>
            ) : err === "cancelled" ? (
              <p className="err" role="alert">{withMail("cancelled")}</p>
            ) : err ? (
              <p className="err" role="alert">{t(err)}</p>
            ) : null}
            {r === "gata" && me && <p className="muted" role="status">{t("ready")}</p>}
            <form action={activareAction} className="form">
              <label>{t("label")}
                <input name="cod" className="cc-code-input" defaultValue={cod} placeholder="CN-FAM-XXXX-XXXX" required maxLength={24}
                  autoComplete="off" autoCapitalize="characters" spellCheck={false} />
              </label>
              <div className="actions"><button className="btn primary">{me ? t("button") : t("continue")}</button></div>
            </form>
            {me ? (
              <p className="muted"><small>{t("account", { email: me.email })}</small></p>
            ) : (
              <p className="muted"><small>{t("signedOut")} <Link href={`/intrare?next=${encodeURIComponent(next)}`}>{t("signIn")}</Link></small></p>
            )}
          </>
        )}
      </div>
      <div className="card">
        <h2 style={{ marginTop: 0, fontSize: "1.15rem" }}>{t("stepsTitle")}</h2>
        <ol style={{ margin: 0, paddingInlineStart: "1.3em", display: "grid", gap: 6 }}>
          <li>{t("step1")}</li>
          <li>{t("step2")}</li>
          <li>{t("step3")}</li>
        </ol>
        <p className="muted" style={{ marginBottom: 0 }}>{withMail("help")}</p>
      </div>
    </section>
  );
}
