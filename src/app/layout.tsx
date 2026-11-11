import type { Metadata, Viewport } from "next";
import Link from "next/link";
// Fonturile vin din pachete npm (fără descărcare de la Google la build, care pica intermitent pe Vercel).
import "@fontsource/alegreya/500.css";
import "@fontsource/alegreya/700.css";
import "@fontsource/alegreya-sans/400.css";
import "@fontsource/alegreya-sans/500.css";
import "@fontsource/alegreya-sans/700.css";
import "./globals.css";
import { currentUser } from "@/lib/access";
import UserMenu from "@/components/UserMenu";
import { db } from "@/db";
import { unreadCount } from "@/lib/chat";
import { pendingContacts } from "@/lib/shared-places";
import { pendingJoins } from "@/lib/join";
import ThemeSwitch from "@/components/ThemeSwitch";
import { PwaSetup } from "@/components/InstallApp";
import { THEME_COOKIE, parseTheme } from "@/lib/theme";
import { cookies } from "next/headers";
import { and, eq, isNotNull } from "drizzle-orm";
import { person } from "@/db/schema";
import { safeAccountImage } from "@/lib/tree-data";
import { isAdminUser } from "@/lib/admin";
import { consentState } from "@/lib/consent";
import { isDemo } from "@/lib/demo";
import { SITE_URL } from "@/lib/site-url";
import UsageBeat from "@/components/UsageBeat";
import UsageNotice from "@/components/UsageNotice";
import LanguagePicker from "@/components/LanguagePicker";
import LanguageSuggest from "@/components/LanguageSuggest";
import IntlClient from "@/i18n/IntlClient";
import { clientMessages } from "@/i18n/messages";
import { getLocaleInfo, getMessages, getT, suggestedLocale } from "@/i18n/server";


/**
 * Previzualizarea linkului pe WhatsApp, Facebook și în alte aplicații: titlul, descrierea și poza (app/opengraph-image).
 * Sunt fixe, în română, ca să arate la fel oricui trimite linkul; roboții acestor aplicații nu au cookie de limbă.
 */
const SHARE = {
  title: "Cartea Neamului",
  description: "Arborele familiei, construit împreună, cu amintirile celor dragi și cartea neamului gata de tipărit.",
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT("Meta");
  return {
    metadataBase: new URL(SITE_URL),
    title: t("appName"), description: t("description"), applicationName: t("appName"),
    openGraph: { ...SHARE, url: "/", siteName: "Cartea Neamului", locale: "ro_RO", type: "website" },
    twitter: { card: "summary_large_image", ...SHARE },
    // Pe iPhone, după „Adaugă pe ecranul principal”, se deschide ca o aplicație, cu numele întreg sub iconiță.
    appleWebApp: { capable: true, title: t("appName"), statusBarStyle: "default" },
    formatDetection: { telephone: false },
  };
}
export const viewport: Viewport = {
  themeColor: [{ media: "(prefers-color-scheme: light)", color: "#eef1f2" }, { media: "(prefers-color-scheme: dark)", color: "#0b1626" }],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const me = await currentUser();
  // Pe „Mesaje”: mesajele necitite plus cererile care îmi așteaptă răspunsul („Din aceleași locuri” și intrări în arbore).
  // Totul deodată, nu pe rând: fiecare întrebare la baza de date costă un drum dus-întors.
  const [unread, myPhoto, usage, theme] = await Promise.all([
    me ? Promise.all([unreadCount(db, me.id), pendingContacts(db, me.id), pendingJoins(db, me.id)].map((p) => p.catch(() => 0))).then((n) => n.reduce((a, b) => a + b, 0)) : 0,
    // Poza de lângă nume: cea pusă pe fișa ta din arbore; altfel poza din contul Google; altfel inițialele.
    me
      ? db.select({ photo: person.photoDocumentId }).from(person).where(and(eq(person.claimedByUserId, me.id), isNotNull(person.photoDocumentId))).limit(1)
          .then((r) => r[0]?.photo ?? null).catch(() => null)
      : null,
    // Cât timp petrec oamenii în site: întrebăm o singură dată și măsurăm doar la cei care spun „Bine” (nu și la contul de probă).
    me && !isDemo(me.email) ? consentState(db, me.id, "usage").catch(() => null) : null,
    cookies().then((c) => parseTheme(c.get(THEME_COOKIE)?.value)),
  ]);
  const avatar = myPhoto ? `/api/document/${myPhoto}` : safeAccountImage(me?.image);
  // Limba: aleasă pe acest telefon, din cont sau româna. Cine n-a ales încă și are browserul în altă limbă e întrebat o dată.
  const { locale, source } = await getLocaleInfo();
  const [messages, t, tp, suggest] = await Promise.all([getMessages(locale), getT("Layout"), getT("Partners"), suggestedLocale()]);
  const appName = (await getT("Meta"))("appName");
  const ask = suggest ? { s: await getT("LanguageSuggest", suggest), ro: await getT("LanguageSuggest", "ro") } : null;
  return (
    <html lang={locale} data-theme={theme === "auto" ? undefined : theme}>
      <body>
        <IntlClient locale={locale} messages={clientMessages(messages)}>
          <PwaSetup />
          <div className="wrap">
            <header className="top">
              <div className="brand"><Link href="/" style={{ textDecoration: "none", color: "inherit" }}><span className="brand-name">{appName}</span></Link></div>
              <div className={me ? "prefs prefs-wide" : "prefs"}>
                <ThemeSwitch initial={theme} />
                <LanguagePicker remember={source === "account"} />
              </div>
              {/* Pe telefon, cine e intrat în cont are tema și limba în meniul de lângă poză, ca antetul să încapă pe un rând. */}
              {me && <UserMenu name={me.name} unread={unread} image={avatar} admin={isAdminUser(me)}
                prefs={<><ThemeSwitch initial={theme} /><LanguagePicker remember={source === "account"} /></>} />}
            </header>
            {ask && suggest && <LanguageSuggest locale={suggest} question={ask.s("question")} hint={ask.s("hint")} accept={ask.s("accept")} stay={ask.ro("stay")} close={ask.s("close")} />}
            {usage && !usage.at && <UsageNotice />}
            <main id="continut">{children}</main>
            {me && usage?.granted && <UsageBeat userId={me.id} />}
            <footer className="site-foot">
              <span>© {new Date().getFullYear()} {appName}</span>
              <Link href="/confidentialitate">{t("privacy")}</Link>
              <Link href="/termeni">{t("terms")}</Link>
              {me && <Link href="/datele-mele">{t("myData")}</Link>}
              <Link href="/parteneri">{tp("menu")}</Link>
            </footer>
          </div>
        </IntlClient>
      </body>
    </html>
  );
}
