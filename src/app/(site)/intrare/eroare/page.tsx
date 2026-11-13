import type { Metadata } from "next";
import Link from "next/link";
import { getT } from "@/i18n/server";

export const metadata: Metadata = { title: "Intrarea nu a reușit · Cartea Neamului", robots: { index: false, follow: false } };

/** Unde ajungi când intrarea în cont nu reușește (de pildă cu Google). Codul erorii se arată mic, pentru cine ne scrie. */
export default async function AuthError({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const t = await getT("AuthError");
  const code = typeof error === "string" ? error.replace(/[^\w.-]/g, "").slice(0, 60) : "";
  const known = ["state_mismatch", "please_restart_the_process", "email_not_found", "account_not_linked", "unable_to_link_account", "access_denied"];
  const hint = code === "access_denied" ? t("denied") : known.includes(code) ? t("restart") : t("generic");
  return (
    <div className="card" style={{ maxWidth: 560, margin: "24px auto" }}>
      <h1 style={{ fontSize: "1.6rem" }}>{t("title")}</h1>
      <p>{hint}</p>
      <div className="actions">
        <Link className="btn primary" href="/intrare">{t("again")}</Link>
        <Link className="btn" href="/">{t("home")}</Link>
      </div>
      {code && <p className="muted" style={{ fontSize: 13 }}>{t("code", { code })}</p>}
    </div>
  );
}
