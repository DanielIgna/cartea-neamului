"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  CHOICE_COOKIE, CHOICE_EVENT, FIRST_COOKIE, LAST_COOKIE, SOURCE_COOKIE_DAYS, analyticsAllowed, encodeTouch, hasSignal, readCookie, touchFromUrl, type Touch,
} from "@/lib/sursa-shared";

/**
 * De unde a venit omul (src/lib/sursa-shared.ts). La prima pagină a vizitei (și la orice pagină cu ?src= sau utm_…) ținem minte,
 * DOAR în memoria paginii, sursa, site-ul din care a venit și pagina de intrare. Le scriem în cookie-uri (30 de zile) numai
 * dacă omul a ales „Accept” la cookie-urile de analiză: pe loc, dacă alesese deja, sau în clipa în care apasă „Accept”.
 * Fără acord nu se scrie nimic; dacă își retrage acordul, cookie-urile se șterg.
 */
let pending: Touch | null = null;
let firstLoad = true;

const secure = () => (location.protocol === "https:" ? "; secure" : "");
const set = (name: string, value: string) => { document.cookie = `${name}=${value}; path=/; max-age=${SOURCE_COOKIE_DAYS * 86_400}; samesite=lax${secure()}`; };
const drop = (name: string) => { document.cookie = `${name}=; path=/; max-age=0; samesite=lax${secure()}`; };

function flush() {
  const choice = readCookie(document.cookie, CHOICE_COOKIE);
  if (!analyticsAllowed(choice)) {
    if (readCookie(document.cookie, FIRST_COOKIE) || readCookie(document.cookie, LAST_COOKIE)) { drop(FIRST_COOKIE); drop(LAST_COOKIE); }
    return;
  }
  if (!pending) return;
  const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
  if (nav.globalPrivacyControl) return;
  const value = encodeTouch(pending);
  // First-touch: doar dacă nu există deja (ține 30 de zile de la prima vizită). Last-touch: la fiecare sursă nouă.
  if (!readCookie(document.cookie, FIRST_COOKIE)) set(FIRST_COOKIE, value);
  if (hasSignal(pending) || !readCookie(document.cookie, LAST_COOKIE)) set(LAST_COOKIE, value);
  pending = null;
}

export default function SourceTracker() {
  const pathname = usePathname();
  useEffect(() => {
    const touch = touchFromUrl(window.location.search, window.location.pathname, firstLoad ? document.referrer || null : null, window.location.host);
    // Prima pagină a vizitei contează mereu (și „direct”); paginile următoare, doar dacă au un link cu sursă.
    if (firstLoad || hasSignal(touch)) pending = touch;
    firstLoad = false;
    flush();
  }, [pathname]);
  useEffect(() => {
    window.addEventListener(CHOICE_EVENT, flush);
    return () => window.removeEventListener(CHOICE_EVENT, flush);
  }, []);
  return null;
}
