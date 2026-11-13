import Link from "next/link";
import { getT, getAppName } from "@/i18n/server";
import { operator } from "@/lib/legal";
import { FACEBOOK_URL } from "@/lib/contact";
import { GIFT_PATH, giftSeason } from "@/lib/cadou-sarbatori";

/** Subsolul tuturor paginilor (și al celor gata făcute pentru vizitatori): paginile legale, contact, istorie, Facebook, cine vinde. */
export default async function SiteFooter({ signedIn }: { signedIn: boolean }) {
  const [t, tp, tc, th, tr, appName] = await Promise.all([getT("Layout"), getT("Partners"), getT("ContactPage"), getT("Church"), getT("Resources"), getAppName()]);
  const tg = await getT("GiftPage");
  const seller = operator();
  return (
    <footer className="site-foot">
      <span>© {new Date().getFullYear()} {appName}</span>
      <Link href="/confidentialitate">{t("privacy")}</Link>
      <Link href="/termeni">{t("terms")}</Link>
      <a href="/confidentialitate#cookie-uri">{t("cookies")}</a>
      {signedIn && <Link href="/datele-mele">{t("myData")}</Link>}
      <Link href="/parteneri">{tp("menu")}</Link>
      <Link href="/resurse-genealogie">{tr("footer")}</Link>
      {giftSeason() && <Link href={GIFT_PATH}>{tg("footer")}</Link>}
      <Link href="/ghid">{t("guides")}</Link>
      <Link href="/glosar">{t("glossary")}</Link>
      <Link href="/nume">{t("surnames")}</Link>
      <Link href="/localitati">{t("places")}</Link>
      <Link href="/contact">{tc("menu")}</Link>
      <Link href="/istoria-umanitatii">{th("humanity")}</Link>
      <Link href="/genealogii-vechi">{th("genealogies")}</Link>
      <Link href="/libertatea-de-a-crede">{th("label")}</Link>
      <a href={FACEBOOK_URL} target="_blank" rel="noopener noreferrer">Facebook</a>
      {/* Cine vinde (cerut de lege pentru comerțul online): datele PFA-ului din src/lib/legal.ts și legătura ANPC – SAL. */}
      <span className="site-seller">{seller.name} · CUI {seller.cui} · {seller.regCom} · <a href="https://anpc.ro/ce-este-sal/" target="_blank" rel="noopener noreferrer">ANPC – SAL</a></span>
    </footer>
  );
}
