import { Logo } from "@/components/Logo";
import Link from "next/link";
// Fonturile vin din pachete npm (fără descărcare de la Google la build, care pica intermitent pe Vercel).
import "@fontsource/alegreya/500.css";
import "@fontsource/alegreya/700.css";
import "@fontsource/alegreya-sans/400.css";
import "@fontsource/alegreya-sans/500.css";
import "@fontsource/alegreya-sans/700.css";
import "../globals.css";
import { currentUser } from "@/lib/access";
import UserMenu from "@/components/UserMenu";
import { db } from "@/db";
import { unreadCount } from "@/lib/chat";
import { unseenReplies } from "@/lib/probleme";
import { pendingContacts } from "@/lib/shared-places";
import { pendingJoins } from "@/lib/join";
import ThemeSwitch from "@/components/ThemeSwitch";
import { PwaSetup } from "@/components/InstallApp";
import { THEME_COOKIE, parseTheme } from "@/lib/theme";
import { cookies } from "next/headers";
import CookieNotice from "@/components/CookieNotice";
import AccessBanner from "@/components/AccessBanner";
import KeepNotice, { KEEP_NOTICE_COOKIE } from "@/components/KeepNotice";
import { planSettings } from "@/lib/plans";
import { COOKIE_NOTICE_COOKIE } from "@/lib/legal";
import { and, eq, isNotNull } from "drizzle-orm";
import { person } from "@/db/schema";
import { safeAccountImage } from "@/lib/tree-data";
import { isAdminUser } from "@/lib/admin";
import { consentState } from "@/lib/consent";
import { isDemo } from "@/lib/demo";
import UsageBeat from "@/components/UsageBeat";
import UsageNotice from "@/components/UsageNotice";
import LanguagePicker from "@/components/LanguagePicker";
import SignInLink from "@/components/SignInLink";
import LanguageSuggest from "@/components/LanguageSuggest";
import IntlClient from "@/i18n/IntlClient";
import SiteFooter from "@/components/SiteFooter";
import VisitBeacon from "@/components/VisitBeacon";
import { clientMessages } from "@/i18n/messages";
import { getLocaleInfo, getMessages, getT, suggestedLocale } from "@/i18n/server";


export { rootMetadata as generateMetadata, viewport } from "@/lib/root-metadata";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const me = await currentUser();
  // Pe „Mesaje”: mesajele necitite plus cererile care îmi așteaptă răspunsul („Din aceleași locuri” și intrări în arbore).
  // Totul deodată, nu pe rând: fiecare întrebare la baza de date costă un drum dus-întors.
  const [unread, myPhoto, usage, prefs, replies] = await Promise.all([
    me ? Promise.all([unreadCount(db, me.id), pendingContacts(db, me.id), pendingJoins(db, me.id)].map((p) => p.catch(() => 0))).then((n) => n.reduce((a, b) => a + b, 0)) : 0,
    // Poza de lângă nume: cea pusă pe fișa ta din arbore; altfel poza din contul Google; altfel inițialele.
    me
      ? db.select({ photo: person.photoDocumentId }).from(person).where(and(eq(person.claimedByUserId, me.id), isNotNull(person.photoDocumentId))).limit(1)
          .then((r) => r[0]?.photo ?? null).catch(() => null)
      : null,
    // Cât timp petrec oamenii în site: întrebăm o singură dată și măsurăm doar la cei care spun „Bine” (nu și la contul de probă).
    me && !isDemo(me.email) ? consentState(db, me.id, "usage").catch(() => null) : null,
    cookies().then((c) => ({ theme: parseTheme(c.get(THEME_COOKIE)?.value), cookieSeen: c.has(COOKIE_NOTICE_COOKIE), keepSeen: c.has(KEEP_NOTICE_COOKIE) })),
    // Răspunsurile noastre la problemele raportate, pe care omul nu le-a văzut încă (semnul de lângă „Raportează o problemă”).
    me ? unseenReplies(db, me.id).catch(() => 0) : 0,
  ]);
  const { theme, cookieSeen, keepSeen } = prefs;
  const avatar = myPhoto ? `/api/document/${myPhoto}` : safeAccountImage(me?.image);
  // Limba: aleasă pe acest telefon, din cont sau româna. Cine n-a ales încă și are browserul în altă limbă e întrebat o dată.
  const { locale, source } = await getLocaleInfo();
  const [messages, t, suggest] = await Promise.all([getMessages(locale), getT("Layout"), suggestedLocale()]);
  const appName = (await getT("Meta"))("appName");
  const ask = suggest ? { s: await getT("LanguageSuggest", suggest), ro: await getT("LanguageSuggest", "ro") } : null;
  return (
    <html lang={locale} data-theme={theme === "auto" ? undefined : theme}>
      <body>
        <IntlClient locale={locale} messages={clientMessages(messages)}>
          <PwaSetup />
          <div className="wrap">
            <header className="top">
              <div className="brand"><Link href="/" className="brand-link"><Logo /><span className="brand-name">{appName}</span></Link></div>
              <div className={me ? "prefs prefs-wide" : "prefs"}>
                <ThemeSwitch />
                <LanguagePicker remember={source === "account"} />
                {!me && <SignInLink label={t("signIn")} short={t("signInShort")} />}
              </div>
              {/* Pe telefon, cine e intrat în cont are tema și limba în meniul de lângă poză, ca antetul să încapă pe un rând. */}
              {me && <UserMenu name={me.name} unread={unread} replies={replies} image={avatar} admin={isAdminUser(me)}
                prefs={<><ThemeSwitch labeled /><LanguagePicker remember={source === "account"} /></>} />}
            </header>
            {ask && suggest && <LanguageSuggest locale={suggest} question={ask.s("question")} hint={ask.s("hint")} accept={ask.s("accept")} stay={ask.ro("stay")} close={ask.s("close")} />}
            {usage && !usage.at && <UsageNotice />}
            {/* Anunțul despre cookie-uri vine o singură dată, dar nu peste celelalte două întrebări: așteaptă pagina următoare. */}
            {!cookieSeen && !(ask && suggest) && !(usage && !usage.at)
              && <CookieNotice lead={t("cookieLead")} text={t("cookieText")} more={t("cookieMore")} ok={t("cookieOk")} />}
            {me && <AccessBanner userId={me.id} locale={locale} />}
            {me && !keepSeen && cookieSeen && !(ask && suggest) && !(usage && !usage.at) && await keepNotice(me.createdAt, locale)}
            <main id="continut">{children}</main>
            {me && usage?.granted && <UsageBeat userId={me.id} />}
            <VisitBeacon />
            <SiteFooter signedIn={!!me} />
          </div>
        </IntlClient>
      </body>
    </html>
  );
}

/**
 * Anunțul despre „Păstrare” (2026-11-13), o singură dată, doar pentru cei care aveau deja cont și doar când plățile sunt pornite.
 * Nu vine peste celelalte anunțuri: așteaptă pagina următoare.
 */
async function keepNotice(createdAt: Date, locale: string) {
  if (createdAt >= new Date("2026-11-14T00:00:00Z")) return null;
  const s = await planSettings(db).catch(() => null);
  const price = s && (locale === "ro" ? s.keepLei : s.keepEur);
  if (!s?.on || !price) return null;
  const [tk, tp] = await Promise.all([getT("Keep"), getT("Plata")]);
  return <KeepNotice lead={tk("noticeLead")} text={tk("notice", { price: locale === "ro" ? `${price} lei` : `${price} €` })} more={tk("noticeMore")} terms={tp("terms")} ok={tk("noticeOk")} />;
}
