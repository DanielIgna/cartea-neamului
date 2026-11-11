"use client";
import { useTranslations } from "use-intl";
import { THEME_COOKIE, type Theme } from "@/lib/theme";

/**
 * Comutatorul de temă: o singură iconiță. Soarele când pagina e luminoasă, luna când e întunecată; un clic trece în cealaltă.
 * Până la primul clic pagina urmează telefonul sau calculatorul („automat”). Care iconiță se vede hotărăște CSS-ul
 * (după `data-theme` și după setarea aparatului), ca serverul să n-aibă de ghicit și pagina să nu clipească.
 * Alegerea se ține într-un cookie, ca serverul să trimită pagina direct în tema bună.
 * `labeled`: în meniul de pe telefon apare și un text lângă iconiță.
 */
export default function ThemeSwitch({ labeled = false }: { initial?: Theme; labeled?: boolean }) {
  const t = useTranslations("ThemeSwitch");
  const flip = () => {
    const root = document.documentElement;
    const now = root.dataset.theme ?? (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    const next: Theme = now === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    document.cookie = `${THEME_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax${location.protocol === "https:" ? "; secure" : ""}`;
  };
  return (
    <button type="button" className={labeled ? "theme-toggle theme-toggle-labeled" : "theme-toggle"} onClick={flip}>
      <span className="tt-sun" title={t("toDark")}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4L6 18M18 6l1.4-1.4" />
        </svg>
        <span className={labeled ? undefined : "sr-only"}>{t("toDark")}</span>
      </span>
      <span className="tt-moon" title={t("toLight")}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />
        </svg>
        <span className={labeled ? undefined : "sr-only"}>{t("toLight")}</span>
      </span>
    </button>
  );
}
