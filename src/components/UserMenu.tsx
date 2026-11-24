"use client";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "use-intl";
import { authClient } from "@/lib/auth-client";
import { Ico } from "@/components/AccountNav";

/**
 * Meniul contului din antet. Pe calculator: butoanele pe un rând. Pe telefon: doar poza (cu numărul de mesaje noi)
 * și un buton „Meniu” care deschide o listă cu rânduri mari, ușor de atins; tema și limba (`prefs`) stau tot acolo.
 */
export default function UserMenu({ name, unread = 0, replies = 0, image, admin = false, prefs }: { name: string; unread?: number; replies?: number; image?: string | null; admin?: boolean; prefs?: ReactNode }) {
  const t = useTranslations("UserMenu");
  const tp = useTranslations("Partners");
  const ti = useTranslations("InviteShare");
  const router = useRouter();
  const path = usePathname();
  const menu = useRef<HTMLDetailsElement>(null);
  // Dacă poza nu se încarcă (link expirat, poză ștearsă, rețea), rămân inițialele în loc de un cerc gol.
  const [broken, setBroken] = useState<string | null>(null);
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  // „Raportează o problemă” ține minte pagina de pe care s-a apăsat, ca omul să n-o mai explice.
  const inTree = !!path && /^\/arbore(\/|$)/.test(path);
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
        {admin && <Link className="btn" href="/admin"><Ico n="key" />{t("admin")}</Link>}
        <Link className="btn" href="/mesaje"><Ico n="msg" />{t("messages")}{unread ? <span className="badge">{unread}</span> : null}</Link>
        <Link className="user-chip" href="/datele-mele" title={t("account")}>
          {avatar(30)}
          <span className="muted">{name}</span>
        </Link>
        {/* „Arborele meu” (Daniel, 24.11.2026): drumul spre arbore pe orice pagină, fără să știi că trebuie apăsat pe siglă. */}
        <Link className="menu-quiet menu-tree" href="/arbore" aria-current={inTree ? "page" : undefined}><Ico n="tree" />{t("myTree")}</Link>
        <Link className="menu-quiet" href="/plata"><Ico n="card" />{t("plan")}</Link>
        <Link className="menu-quiet" href="/invitatii"><Ico n="inv" />{ti("menu")}</Link>
        <Link className="menu-quiet" href="/ghid"><Ico n="help" />{t("guides")}</Link>
        <Link className="menu-quiet" href="/parteneri"><Ico n="hand" />{tp("menu")}</Link>
        <Link className="menu-quiet" href={report}><Ico n="flag" />{t("report")}{replyBadge}</Link>
        <button className="btn" onClick={signOut}><Ico n="out" />{t("signOut")}</button>
      </div>
      {/* Pe telefon, arborele are butonul lui lângă meniu: se vede pe orice pagină, fără să deschizi meniul. */}
      <Link className="um-tree" href="/arbore" aria-label={t("myTree")} title={t("myTree")} aria-current={inTree ? "page" : undefined}>
        <TreeIcon /><span>{t("myTreeShort")}</span>
      </Link>
      <details className="um-mobile" ref={menu}>
        <summary aria-label={t("menu")}>
          <span className="um-face">{avatar(34)}{unread + replies ? <span className="badge um-badge">{unread + replies}</span> : null}</span>
          <span className="um-burger" aria-hidden><i /><i /><i /></span>
        </summary>
        <div className="um-panel">
          <div className="um-who">{avatar(40)}<b>{name}</b></div>
          <nav className="um-links">
            <Link href="/">{t("home")}</Link>
            <Link href="/arbore">{t("myTree")}</Link>
            <Link href="/mesaje">{t("messages")}{unread ? <span className="badge">{unread}</span> : null}</Link>
            <Link href="/datele-mele">{t("account")}</Link>
            <Link href="/plata">{t("plan")}</Link>
            <Link href="/invitatii">{ti("menu")}</Link>
            {admin && <Link href="/admin">{t("admin")}</Link>}
            <Link href="/ghid">{t("guides")}</Link>
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

/** Un copăcel simplu, în culoarea textului (pentru butonul „Arborele meu” de pe telefon). */
function TreeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 21v-7" /><path d="M12 14l-3.5-3M12 16l3.5-3" />
      <path d="M12 3c-3.3 0-6 2.5-6 5.6 0 1.4.5 2.6 1.4 3.6M12 3c3.3 0 6 2.5 6 5.6 0 1.4-.5 2.6-1.4 3.6" />
      <path d="M8 21h8" />
    </svg>
  );
}
