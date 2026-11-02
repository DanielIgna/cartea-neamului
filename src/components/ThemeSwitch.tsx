"use client";
import { useState } from "react";
import { THEME_COOKIE, type Theme } from "@/lib/theme";

const OPTIONS: [Theme, string][] = [["auto", "Automat"], ["light", "Luminos"], ["dark", "Întunecat"]];

/** Comutatorul de temă. Alegerea se ține într-un cookie, ca serverul să trimită pagina direct în tema bună, fără să clipească. */
export default function ThemeSwitch({ initial }: { initial: Theme }) {
  const [theme, setTheme] = useState<Theme>(initial);
  const choose = (t: Theme) => {
    setTheme(t);
    if (t === "auto") delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = t;
    document.cookie = `${THEME_COOKIE}=${t}; path=/; max-age=31536000; samesite=lax`;
  };
  return (
    <div className="seg theme-switch" role="group" aria-label="Tema culorilor">
      {OPTIONS.map(([t, label]) => (
        <button key={t} type="button" aria-pressed={theme === t} onClick={() => choose(t)}>{label}</button>
      ))}
    </div>
  );
}
