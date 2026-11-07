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
import UsageBeat from "@/components/UsageBeat";
import UsageNotice from "@/components/UsageNotice";
import LanguagePicker from "@/components/LanguagePicker";
import LanguageSuggest from "@/components/LanguageSuggest";
import IntlClient from "@/i18n/IntlClient";
import { clientMessages } from "@/i18n/messages";
import { getLocaleInfo, getMessages, getT, suggestedLocale } from "@/i18n/server";


export async function generateMetadata(): Promise<Metadata> {
  const t = await getT("Meta");
  return {
    title: "Cartea Neamului", description: t("description"), applicationName: "Cartea Neamului",
    // Pe iPhone, după „Adaugă pe ecranul principal”, se deschide ca o aplicație, cu numele întreg sub iconiță.
    appleWebApp: { capable: true, title: "Cartea Neamului", statusBarStyle: "default" },
    formatDetection: { telephone: false },
  };
}
export const viewport: Viewport = {
  themeColor: [{ media: "(prefers-color-scheme: light)", color: "#eef1f2" }, { media: "(prefers-color-scheme: dark)", color: "#0b1626" }],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const me = await currentUser();
  // Pe „Mesaje”: mesajele necitite plus cererile care îmi așteaptă răspunsul („Din aceleași locuri” și intrări în arbore).
  const unread = me ? (await Promise.all([unreadCount(db, me.id), pendingContacts(db, me.id), pendingJoins(db, me.id)].map((p) => p.catch(() => 0)))).reduce((a, b) => a + b, 0) : 0;
  const theme = parseTheme((await cookies()).get(THEME_COOKIE)?.value);
  // Poza de lângă nume: cea pusă pe fișa ta din arbore; altfel poza din contul Google; altfel inițialele.
  const myPhoto = me
    ? await db.select({ photo: person.photoDocumentId }).from(person).where(and(eq(person.claimedByUserId, me.id), isNotNull(person.photoDocumentId))).limit(1)
        .then((r) => r[0]?.photo ?? null).catch(() => null)
    : null;
  const avatar = myPhoto ? `/api/document/${myPhoto}` : safeAccountImage(me?.image);
  // Cât timp petrec oamenii în site: întrebăm o singură dată și măsurăm doar la cei care spun „Bine” (nu și la contul de probă).
  const usage = me && !isDemo(me.email) ? await consentState(db, me.id, "usage").catch(() => null) : null;
  // Limba: aleasă pe acest telefon, din cont sau româna. Cine n-a ales încă și are browserul în altă limbă e întrebat o dată.
  const { locale, source } = await getLocaleInfo();
  const [messages, t, suggest] = await Promise.all([getMessages(locale), getT("Layout"), suggestedLocale()]);
  const ask = suggest ? { s: await getT("LanguageSuggest", suggest), ro: await getT("LanguageSuggest", "ro") } : null;
  return (
    <html lang={locale} data-theme={theme === "auto" ? undefined : theme}>
      <body>
        <IntlClient locale={locale} messages={clientMessages(messages)}>
          <PwaSetup />
          <div className="wrap">
            <header className="top">
              <div className="brand"><Link href="/" style={{ textDecoration: "none", color: "inherit" }}><h1>Cartea Neamului</h1></Link></div>
              <div className="prefs">
                <ThemeSwitch initial={theme} />
                <LanguagePicker remember={source === "account"} />
              </div>
              {me && <UserMenu name={me.name} unread={unread} image={avatar} admin={isAdminUser(me)} />}
            </header>
            {ask && suggest && <LanguageSuggest locale={suggest} question={ask.s("question")} hint={ask.s("hint")} accept={ask.s("accept")} stay={ask.ro("stay")} />}
            {usage && !usage.at && <UsageNotice />}
            {children}
            {me && usage?.granted && <UsageBeat userId={me.id} />}
            <footer className="site-foot">
              <span>© {new Date().getFullYear()} Cartea Neamului</span>
              <Link href="/confidentialitate">{t("privacy")}</Link>
              <Link href="/termeni">{t("terms")}</Link>
              {me && <Link href="/datele-mele">{t("myData")}</Link>}
            </footer>
          </div>
        </IntlClient>
      </body>
    </html>
  );
}
