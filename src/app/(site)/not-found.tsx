import type { Metadata } from "next";
import Link from "next/link";
import { getAppName, getT } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT("NotFound");
  return { title: `${t("title")} · ${await getAppName()}`, robots: { index: false, follow: false } };
}

/** Pagina pentru adresele care nu există (status 404), în limba aleasă. */
export default async function NotFoundPage() {
  const t = await getT("NotFound");
  return (
    <div className="card" style={{ maxWidth: 560, margin: "24px auto" }}>
      <h1 style={{ fontSize: "1.6rem" }}>{t("title")}</h1>
      <p className="muted">{t("text")}</p>
      <div className="actions"><Link className="btn primary" href="/">{t("home")}</Link></div>
    </div>
  );
}
