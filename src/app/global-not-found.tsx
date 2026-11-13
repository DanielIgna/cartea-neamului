import Link from "next/link";
import type { Metadata } from "next";
import "@fontsource/alegreya/500.css";
import "@fontsource/alegreya/700.css";
import "@fontsource/alegreya-sans/400.css";
import "@fontsource/alegreya-sans/500.css";
import "@fontsource/alegreya-sans/700.css";
import "./globals.css";
import { Logo } from "@/components/Logo";
import SiteFooter from "@/components/SiteFooter";
import { getAppName, getLocale, getT } from "@/i18n/server";
import { rootMetadata } from "@/lib/root-metadata";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT("NotFound");
  return { ...(await rootMetadata()), title: `${t("title")} · ${await getAppName()}`, robots: { index: false, follow: false } };
}

/**
 * Pagina 404 pentru adresele care nu există nicăieri. Site-ul are două cadre separate, (site) și (public), fără unul comun
 * deasupra, așa că pagina asta își are propriul <html>, cu antetul și subsolul obișnuite (cele din interiorul unui cadru
 * folosesc în continuare app/(site)/not-found.tsx).
 */
export default async function GlobalNotFound() {
  const [t, appName, locale] = await Promise.all([getT("NotFound"), getAppName(), getLocale()]);
  return (
    <html lang={locale}>
      <body>
        <div className="wrap">
          <header className="top">
            <div className="brand"><Link href="/" className="brand-link"><Logo /><span className="brand-name">{appName}</span></Link></div>
          </header>
          <main id="continut">
            <div className="card" style={{ maxWidth: 560, margin: "24px auto" }}>
              <h1 style={{ fontSize: "1.6rem" }}>{t("title")}</h1>
              <p className="muted">{t("text")}</p>
              <div className="actions"><Link className="btn primary" href="/">{t("home")}</Link></div>
            </div>
          </main>
          <SiteFooter signedIn={false} />
        </div>
      </body>
    </html>
  );
}
