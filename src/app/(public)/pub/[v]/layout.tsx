import Link from "next/link";
// Fonturile vin din pachete npm (fără descărcare de la Google la build, care pica intermitent pe Vercel).
import "@fontsource/alegreya/500.css";
import "@fontsource/alegreya/700.css";
import "@fontsource/alegreya-sans/400.css";
import "@fontsource/alegreya-sans/500.css";
import "@fontsource/alegreya-sans/700.css";
import "../../../globals.css";
import { Logo } from "@/components/Logo";
import ThemeSwitch from "@/components/ThemeSwitch";
import { PwaSetup } from "@/components/InstallApp";
import CookieNotice from "@/components/CookieNotice";
import LanguagePicker from "@/components/LanguagePicker";
import SignInLink from "@/components/SignInLink";
import SiteFooter from "@/components/SiteFooter";
import IntlClient from "@/i18n/IntlClient";
import { clientMessages } from "@/i18n/messages";
import { getAppName, getMessages, getT } from "@/i18n/server";
import { rootMetadata } from "@/lib/root-metadata";
import { readVariant, variantParams, type VariantParams } from "@/lib/public-variant-server";

export { viewport } from "@/lib/root-metadata";
export const dynamic = "force-static";
export const revalidate = 600;
export const generateStaticParams = variantParams;
// Altă variantă decât cele 54 nu există (middleware.ts nu trimite decât la ele).
export const dynamicParams = false;

export async function generateMetadata(props: VariantParams) {
  await readVariant(props);
  return rootMetadata();
}

/**
 * Cadrul paginilor publice pentru vizitatorii fără cont, făcut o dată și servit din cache (middleware.ts trimite aici).
 * E același antet și subsol ca în app/(site)/layout.tsx, fără ce ține de cont: limba, tema și anunțul despre cookie-uri
 * vin din adresa internă („ro.auto.0”), nu din cookie-uri, ca pagina să fie aceeași pentru toți cei cu aceleași alegeri.
 */
export default async function PublicLayout({ children, params }: { children: React.ReactNode } & VariantParams) {
  const v = await readVariant({ params });
  const [messages, t, appName] = await Promise.all([getMessages(v.locale), getT("Layout"), getAppName()]);
  return (
    <html lang={v.locale} data-theme={v.theme === "auto" ? undefined : v.theme}>
      <body>
        <IntlClient locale={v.locale} messages={clientMessages(messages)}>
          <PwaSetup />
          <div className="wrap">
            <header className="top">
              <div className="brand"><Link href="/" className="brand-link"><Logo /><span className="brand-name">{appName}</span></Link></div>
              <div className="prefs">
                <ThemeSwitch />
                <LanguagePicker />
                <SignInLink label={t("signIn")} short={t("signInShort")} />
              </div>
            </header>
            {!v.cookieSeen && <CookieNotice lead={t("cookieLead")} text={t("cookieText")} more={t("cookieMore")} ok={t("cookieOk")} />}
            <main id="continut">{children}</main>
            <SiteFooter signedIn={false} />
          </div>
        </IntlClient>
      </body>
    </html>
  );
}
