"use client";
import { useState } from "react";
import { useTranslations } from "use-intl";
import { THEME_COOKIE, type Theme } from "@/lib/theme";

const OPTIONS: Theme[] = ["auto", "light", "dark"];

/** Comutatorul de temă. Alegerea se ține într-un cookie, ca serverul să trimită pagina direct în tema bună, fără să clipească. */
export default function ThemeSwitch({ initial }: { initial: Theme }) {
  const t = useTranslations("ThemeSwitch");
  const [theme, setTheme] = useState<Theme>(initial);
  const choose = (v: Theme) => {
    setTheme(v);
    if (v === "auto") delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = v;
    document.cookie = `${THEME_COOKIE}=${v}; path=/; max-age=31536000; samesite=lax${location.protocol === "https:" ? "; secure" : ""}`;
  };
  return (
    <div className="seg theme-switch" role="group" aria-label={t("label")}>
      {OPTIONS.map((o) => (
        <button key={o} type="button" aria-pressed={theme === o} onClick={() => choose(o)}>{t(o)}</button>
      ))}
    </div>
  );
}
