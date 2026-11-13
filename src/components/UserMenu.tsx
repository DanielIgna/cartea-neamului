"use client";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "use-intl";
import { authClient } from "@/lib/auth-client";

/**
 * Meniul contului din antet. Pe calculator: butoanele pe un rând. Pe telefon: doar poza (cu numărul de mesaje noi)
 * și un buton „Meniu” care deschide o listă cu rânduri mari, ușor de atins; tema și limba (`prefs`) stau tot acolo.
 */
export default function UserMenu({ name, unread = 0, replies = 0, image, admin = false, prefs }: { name: string; unread?: number; replies?: number; image?: string | null; admin?: boolean; prefs?: ReactNode }) {
  const t = useTranslations("UserMenu");
  const tp = useTranslations("Partners");
  const router = useRouter();
  const path = usePathname();
  const menu = useRef<HTMLDetailsElement>(null);
  // Dacă poza nu se încarcă (link expirat, poză ștearsă, rețea), rămân inițialele în loc de un cerc gol.
  const [broken, setBroken] = useState<string | null>(null);
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  // „Raportează o problemă” ține minte pagina de pe care s-a apăsat, ca omul să n-o mai explice.
  const report = path?.startsWith("/problema") ? "/problema" : `/problema?de=${encodeURIComponent(path || "/")}`;
  const replyBadge = replies ? <span className="badge">{replies}</span> : null;
  const signOut = async () => { await authClient.signOut(); router.push("/"); router.refresh(); };
  const avatar = (size: number) => image && broken !== image
    ? <img src={image} alt="" className="avatar" style={{ width: size, height: size }} referrerPolicy="no-referrer" onError={() => setBroken(image)} />
    : <span className="avatar avatar-empty" style={{ width: size, height: size, fontSize: size * 0.42 }} aria-hidden>{initials || "?"}</span>;
  // Meniul de pe telefon se închide când schimbi pagina, la Esc sau când atingi în afara lui.
  useEffect(() => { if (menu.current) menu.current.open = false; }, [path]);
  useEffect(() => {
    const close = (e: Event) => {
      const m = menu.current;
      if (!m?.open) return;
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !m.contains(e.target as Node)) m.open = false;
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", close);
    return () => { document.removeEventListener("pointerdown", close); document.removeEventListener("keydown", close); };
  }, []);
  return (
    <>
      <div className="um-inline">
        {admin && <Link className="btn" href="/admin">{t("admin")}</Link>}
        <Link className="btn" href="/mesaje">{t("messages")}{unread ? <span className="badge">{unread}</span> : null}</Link>
        <Link className="user-chip" href="/datele-mele" title={t("account")}>
          {avatar(30)}
          <span className="muted">{name}</span>
        </Link>
        <Link className="menu-quiet" href="/plata">{t("plan")}</Link>
        <Link className="menu-quiet" href="/parteneri">{tp("menu")}</Link>
        <Link className="menu-quiet" href={report}>{t("report")}{replyBadge}</Link>
        <button className="btn" onClick={signOut}>{t("signOut")}</button>
      </div>
      <details className="um-mobile" ref={menu}>
        <summary aria-label={t("menu")}>
          <span className="um-face">{avatar(34)}{unread + replies ? <span className="badge um-badge">{unread + replies}</span> : null}</span>
          <span className="um-burger" aria-hidden><i /><i /><i /></span>
        </summary>
        <div className="um-panel">
          <div className="um-who">{avatar(40)}<b>{name}</b></div>
          <nav className="um-links">
            <Link href="/">{t("home")}</Link>
            <Link href="/mesaje">{t("messages")}{unread ? <span className="badge">{unread}</span> : null}</Link>
            <Link href="/datele-mele">{t("account")}</Link>
            <Link href="/plata">{t("plan")}</Link>
            {admin && <Link href="/admin">{t("admin")}</Link>}
            <Link href="/parteneri">{tp("menu")}</Link>
            <Link href={report}>{t("report")}{replyBadge}</Link>
          </nav>
          {prefs && <div className="um-prefs">{prefs}</div>}
          <button className="btn um-out" onClick={signOut}>{t("signOut")}</button>
        </div>
      </details>
    </>
  );
}
