import Link from "next/link";
import { localizedPath, type Locale } from "@/i18n/locales";
import { PRODUCTS_PATH, shopPageText } from "@/lib/produse-texte";

/**
 * „Magazin” în antet, pe toate paginile (Daniel, 27.11.2026): duce la /produse. Pe calculator, sacoșa și cuvântul pe un rând;
 * pe telefon, sacoșa cu cuvântul mic dedesubt, cât un buton de deget, ca numele site-ului să încapă.
 */
export default function ShopLink({ locale }: { locale: Locale }) {
  const label = shopPageText(locale).menu;
  return (
    <Link className="shop-link" href={localizedPath(PRODUCTS_PATH, locale)} title={label}>
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 8h14l-1.2 11.2a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8z" /><path d="M9 10V7a3 3 0 0 1 6 0v3" />
      </svg>
      <span>{label}</span>
    </Link>
  );
}
