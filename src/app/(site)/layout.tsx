import { Logo } from "@/components/Logo";
import Link from "next/link";
import { dirOf } from "@/i18n/locales";
// Fonturile vin din pachete npm (fără descărcare de la Google la build, care pica intermitent pe Vercel).
import "@fontsource/alegreya/500.css";
import "@fontsource/alegreya/700.css";
import "@fontsource/alegreya-sans/400.css";
import "@fontsource/alegreya-sans/500.css";
import "@fontsource/alegreya-sans/700.css";
// Ebraica (Daniel, 2026-11-14): Alegreya n-are litere ebraice; aceste fonturi se descarcă doar pe paginile cu text în ebraică.
import "@fontsource/frank-ruhl-libre/hebrew-500.css";
import "@fontsource/frank-ruhl-libre/hebrew-700.css";
import "@fontsource/assistant/hebrew-400.css";
import "@fontsource/assistant/hebrew-500.css";
import "@fontsource/assistant/hebrew-700.css";
import "../globals.css";
import { currentUser } from "@/lib/access";
import UserMenu from "@/components/UserMenu";
import AccountNav from "@/components/AccountNav";
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
import UserNotices from "@/components/UserNotices";
import KeepNotice, { KEEP_NOTICE_COOKIE } from "@/components/KeepNotice";
import { planSettings } from "@/lib/plans";
import { COOKIE_NOTICE_COOKIE } from "@/lib/legal";
import { eq, sql } from "drizzle-orm";
import { person } from "@/db/schema";
import { safeAccountImage } from "@/lib/tree-data";
import { isAdminFresh } from "@/lib/admin-access";
import { consentState } from "@/lib/consent";
import { isDemo } from "@/lib/demo";
import UsageBeat from "@/components/UsageBeat";
import UsageNotice from "@/components/UsageNotice";
import NewsNotice from "@/components/NewsNotice";
import { growthSettings } from "@/lib/crestere";
import LanguagePicker from "@/components/LanguagePicker";
import SignInLink from "@/components/SignInLink";
import LanguageSuggest from "@/components/LanguageSuggest";
import IntlClient from "@/i18n/IntlClient";
import SiteFooter from "@/components/SiteFooter";
import VisitBeacon from "@/components/VisitBeacon";
import SourceTracker from "@/components/SourceTracker";
import { clientMessages } from "@/i18n/messages";
import { getLocaleInfo, getMessages, getT, suggestedLocale } from "@/i18n/server";


export { rootMetadata as generateMetadata, viewport } from "@/lib/root-metadata";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const me = await currentUser();
  // Pe „Mesaje”: mesajele necitite plus cererile care îmi așteaptă răspunsul („Din aceleași locuri” și intrări în arbore).
  // Totul deodată, nu pe rând: fiecare întrebare la baza de date costă un drum dus-întors.
  const [unread, mine, usage, prefs, replies, news] = await Promise.all([
    me ? Promise.all([unreadCount(db, me.id), pendingContacts(db, me.id), pendingJoins(db, me.id)].map((p) => p.catch(() => 0))).then((n) => n.reduce((a, b) => a + b, 0)) : 0,
    // Poza de lângă nume: cea pusă pe fișa ta din arbore; altfel poza din contul Google; altfel inițialele.
    // Tot de aici vine și „Profilul meu” din meniul contului: fișa mea (cea cu poză, dacă am una), în arborele ei.
    me
      ? db.select({ id: person.id, treeId: person.treeId, photo: person.photoDocumentId }).from(person).where(eq(person.claimedByUserId, me.id))
          .orderBy(sql`${person.photoDocumentId} is null`).limit(1).then((r) => r[0] ?? null).catch(() => null)
      : null,
    // Cât timp petrec oamenii în site: întrebăm o singură dată și măsurăm doar la cei care spun „Bine” (nu și la contul de probă).
    me && !isDemo(me.email) ? consentState(db, me.id, "usage").catch(() => null) : null,
    cookies().then((c) => ({ theme: parseTheme(c.get(THEME_COOKIE)?.value), cookieSeen: c.has(COOKIE_NOTICE_COOKIE), keepSeen: c.has(KEEP_NOTICE_COOKIE) })),
    // Răspunsurile noastre la problemele raportate, pe care omul nu le-a văzut încă (semnul de lângă „Raportează o problemă”).
    me ? unseenReplies(db, me.id).catch(() => 0) : 0,
    // „Vrei sfaturi pe email?”: o singură dată, doar dacă e pornită din Admin → Creștere (src/lib/crestere.ts).
    // Al doilea prilej (17.11.2026), după bifa de la înscriere: doar după primul arbore (măcar 2 persoane într-un arbore al omului).
    me && !isDemo(me.email) ? Promise.all([consentState(db, me.id, "news"), growthSettings(db)]).then(async ([c, g]) => {
      if (!g.askNews || c.at) return null;
      const r = await db.execute(sql`select 1 from tree t where t.owner_id = ${me.id} and (select count(*) from person p where p.tree_id = t.id) >= 2 limit 1`);
      return (r.rows?.length ?? 0) > 0 ? "ask" : null;
    }).catch(() => null) : null,
  ]);
  const { theme, cookieSeen, keepSeen } = prefs;
  // Butonul Admin din meniu: citit ca la paginile de admin (baza de date pentru adresele proprietarilor), nu doar din cookie-ul
  // sesiunii, care putea să nu-l arate pe telefon deși panoul îl lăsa să intre (Daniel, 25.11.2026).
  const admin = me ? await isAdminFresh(me).catch(() => false) : false;
  const myPhoto = mine?.photo ?? null;
  const avatar = myPhoto ? `/api/document/${myPhoto}` : safeAccountImage(me?.image);
  // Limba: aleasă pe acest telefon, din cont sau româna. Cine n-a ales încă și are browserul în altă limbă e întrebat o dată.
  const { locale, source } = await getLocaleInfo();
  const [messages, t, suggest] = await Promise.all([getMessages(locale), getT("Layout"), suggestedLocale()]);
  const appName = (await getT("Meta"))("appName");
  const ask = suggest ? { s: await getT("LanguageSuggest", suggest), ro: await getT("LanguageSuggest", "ro") } : null;
  return (
    <html lang={locale} dir={dirOf(locale)} data-theme={theme === "auto" ? undefined : theme}>
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
              {me && <UserMenu name={me.name} unread={unread} replies={replies} image={avatar} admin={admin}
                prefs={<><ThemeSwitch labeled /><LanguagePicker remember={source === "account"} /></>} />}
            </header>
            {ask && suggest && <LanguageSuggest locale={suggest} question={ask.s("question")} hint={ask.s("hint")} accept={ask.s("accept")} stay={ask.ro("stay")} close={ask.s("close")} />}
            {usage && !usage.at && <UsageNotice />}
            {/* Anunțul despre cookie-uri vine o singură dată, dar nu peste celelalte două întrebări: așteaptă pagina următoare. */}
            {!cookieSeen && !(ask && suggest) && !(usage && !usage.at)
              && <CookieNotice lead={t("cookieLead")} text={t("cookieText")} more={t("cookieMore")} ok={t("cookieOk")} necessary={t("cookieNecessary")} />}
            {news === "ask" && usage?.at && cookieSeen && !(ask && suggest) && <NewsNotice afterTree />}
            {me && <AccessBanner userId={me.id} locale={locale} />}
            {me && <UserNotices userId={me.id} />}
            {me && !keepSeen && cookieSeen && !(ask && suggest) && !(usage && !usage.at) && await keepNotice(me.createdAt, locale)}
            {/* Pe paginile contului: meniul lateral (calculator) și bara de jos (telefon), src/components/AccountNav.tsx. */}
            <div className="acc-wrap">
              {me && <AccountNav name={me.name} image={avatar} unread={unread} replies={replies} admin={admin}
                profile={mine ? `/arbore/${mine.treeId}/persoana/${mine.id}` : null} />}
              <main id="continut">{children}</main>
            </div>
            {me && usage?.granted && <UsageBeat userId={me.id} />}
            <VisitBeacon />
            <SourceTracker />
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
