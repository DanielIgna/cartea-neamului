import Link from "next/link";
import { getT, getAppName, getLocale } from "@/i18n/server";
import { operator } from "@/lib/legal";
import { FACEBOOK_URL, TIKTOK_URL } from "@/lib/contact";
import { GIFT_PATH, giftSeason } from "@/lib/cadou-sarbatori";
import { POPULAR_LINKS } from "@/lib/legaturi-populare";

/** Subsolul tuturor paginilor (și al celor gata făcute pentru vizitatori): paginile legale, contact, istorie, Facebook, cine vinde. */
export default async function SiteFooter({ signedIn }: { signedIn: boolean }) {
  const [t, tp, tc, th, tr, appName] = await Promise.all([getT("Layout"), getT("Partners"), getT("ContactPage"), getT("Church"), getT("Resources"), getAppName()]);
  const [tg, ta] = await Promise.all([getT("GiftPage"), getT("Archives")]);
  const seller = operator();
  const ro = (await getLocale()) === "ro";
  return (
    <footer className="site-foot">
      {/* Ghidurile citite des, ca subsolul să trimită greutatea spre conținut, nu doar spre paginile legale (26.11.2026). */}
      {ro && (
        <nav className="foot-popular" aria-label="Citite des">
          <b>Citite des:</b> {POPULAR_LINKS.map((l) => <Link key={l.href} href={l.href}>{l.label}</Link>)}
        </nav>
      )}
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
      {/* Contul de TikTok, lângă Facebook (Daniel, 24.11.2026): sigla oficială, monocromă, în culoarea textului. */}
      <a className="foot-fb foot-tt" href={TIKTOK_URL} target="_blank" rel="noopener" aria-label="Cartea Neamului pe TikTok">
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" /></svg>
        TikTok
      </a>
      {/* Cine vinde (cerut de lege pentru comerțul online): datele PFA-ului din src/lib/legal.ts și legătura ANPC – SAL. */}
      <span className="site-seller">{seller.name} · CUI {seller.cui} · {seller.regCom} · <a href="https://anpc.ro/ce-este-sal/" target="_blank" rel="noopener noreferrer">ANPC – SAL</a></span>
    </footer>
  );
}
