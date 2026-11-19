import Link from "next/link";
import { getT, getAppName, getLocale } from "@/i18n/server";
import { operator } from "@/lib/legal";
import { FACEBOOK_URL } from "@/lib/contact";
import { GIFT_PATH, giftSeason } from "@/lib/cadou-sarbatori";

/** Subsolul tuturor paginilor (și al celor gata făcute pentru vizitatori): paginile legale, contact, istorie, Facebook, cine vinde. */
export default async function SiteFooter({ signedIn }: { signedIn: boolean }) {
  const [t, tp, tc, th, tr, appName] = await Promise.all([getT("Layout"), getT("Partners"), getT("ContactPage"), getT("Church"), getT("Resources"), getAppName()]);
  const [tg, ta] = await Promise.all([getT("GiftPage"), getT("Archives")]);
  const seller = operator();
  const ro = (await getLocale()) === "ro";
  return (
    <footer className="site-foot">
      <span>© {new Date().getFullYear()} {appName}</span>
      <Link href="/confidentialitate">{t("privacy")}</Link>
      <Link href="/termeni">{t("terms")}</Link>
      <a href="/confidentialitate#cookie-uri">{t("cookies")}</a>
      {signedIn && <Link href="/datele-mele">{t("myData")}</Link>}
      <Link href="/parteneri">{tp("menu")}</Link>
      <Link href="/resurse-genealogie">{tr("footer")}</Link>
      <Link href="/surse-publice">{ta("footer")}</Link>
      {giftSeason() && <Link href={GIFT_PATH}>{tg("footer")}</Link>}
      <Link href="/ghid">{t("guides")}</Link>
      <Link href="/glosar">{t("glossary")}</Link>
      <Link href="/nume">{t("surnames")}</Link>
      <Link href="/localitati">{t("places")}</Link>
      <Link href="/diaspora">{t("diaspora")}</Link>
      <Link href="/contact">{tc("menu")}</Link>
      {/* Paginile doar în română: școli, presă și widgetul „Arborele meu” (Etapa 5). */}
      {ro && <Link href="/genealogie">Genealogie pe regiuni</Link>}
      {ro && <Link href="/cadouri">Cadouri</Link>}
      {ro && <Link href="/unelte">Unelte gratuite</Link>}
      {ro && <Link href="/scoala">Pentru școli</Link>}
      {ro && <Link href="/presa">Presă</Link>}
      {ro && <Link href="/arborele-meu">Widget pentru blog</Link>}
      <Link href="/istoria-umanitatii">{th("humanity")}</Link>
      <Link href="/genealogii-vechi">{th("genealogies")}</Link>
      <Link href="/libertatea-de-a-crede">{th("label")}</Link>
      {/* Pagina de Facebook cu sigla ei, puțin mai vizibilă decât celelalte legături (Daniel, 19.11.2026). */}
      <a className="foot-fb" href={FACEBOOK_URL} target="_blank" rel="noopener noreferrer">
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><circle cx="12" cy="12" r="12" fill="#1877F2" /><path fill="#fff" d="M13.4 19.5v-6h2l.3-2.4h-2.3V9.6c0-.7.2-1.2 1.2-1.2h1.2V6.3a16 16 0 0 0-1.8-.1c-1.8 0-3 1.1-3 3.1v1.8h-2v2.4h2v6h2.4z" /></svg>
        Facebook
      </a>
      {/* Cine vinde (cerut de lege pentru comerțul online): datele PFA-ului din src/lib/legal.ts și legătura ANPC – SAL. */}
      <span className="site-seller">{seller.name} · CUI {seller.cui} · {seller.regCom} · <a href="https://anpc.ro/ce-este-sal/" target="_blank" rel="noopener noreferrer">ANPC – SAL</a></span>
    </footer>
  );
}
