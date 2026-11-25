"use client";

import { useEffect } from "react";

/**
 * Căsuța acordului de pe /plata (Daniel, 25.11.2026: „butonul pare mort”): dacă omul apasă pe plată fără bifă, în loc de bula mică
 * a browserului, căsuța se înroșește, sub ea apare „Bifează căsuța ca să poți plăti.”, iar pagina se duce la ea. Merge în orice browser;
 * fără JavaScript rămâne „required” și regula CSS :user-invalid.
 */
export default function ConsentGuard() {
  useEffect(() => {
    const onInvalid = (e: Event) => {
      const el = e.target as HTMLInputElement | null;
      if (!el || el.name !== "acord") return;
      e.preventDefault();
      const form = el.closest("form");
      form?.classList.add("need-acord");
      el.scrollIntoView({ block: "center", behavior: "smooth" });
      el.focus({ preventScroll: true });
    };
    const onChange = (e: Event) => {
      const el = e.target as HTMLInputElement | null;
      if (el?.name === "acord" && el.checked) el.closest("form")?.classList.remove("need-acord");
    };
    document.addEventListener("invalid", onInvalid, true);
    document.addEventListener("change", onChange);
    return () => { document.removeEventListener("invalid", onInvalid, true); document.removeEventListener("change", onChange); };
  }, []);
  return null;
}
