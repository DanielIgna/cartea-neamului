"use client";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "use-intl";
import { authClient } from "@/lib/auth-client";

/**
 * Meniul contului (Daniel, 24.11.2026, direcția „Panou cald”): pe paginile contului, pe calculator, un meniu lateral închis la
 * culoare cu toate paginile la un loc; pe telefon, o bară jos cu cinci butoane mari. Pe arbore și pe paginile publice nu apare:
 * acolo rămâne meniul din antet (UserMenu), care are în continuare toate legăturile.
 */
const ACCOUNT = /^\/(datele-mele|securitate|plata|invitatii|mesaje|arhiva|problema|arbore-nou)(\/|$)/;
export function isAccountPath(path: string | null) {
  return path === "/" || (!!path && ACCOUNT.test(path));
}

type Props = { name: string; image?: string | null; unread?: number; replies?: number; admin?: boolean; profile?: string | null; plan?: string | null };

export default function AccountNav({ name, image, unread = 0, replies = 0, admin = false, profile, plan }: Props) {
  const path = usePathname();
  const t = useTranslations("UserMenu");
  const tp = useTranslations("Partners");
  const ti = useTranslations("InviteShare");
  const router = useRouter();
  const [broken, setBroken] = useState(false);
  // Și fișa mea din arbore („Profilul meu”) stă în cadrul contului, cu același meniu.
  if (!isAccountPath(path) && !(profile && path === profile)) return null;
  const on = (href: string) => (href === "/" ? path === "/" : !!path && (path === href || path.startsWith(href + "/"))
    // Pe fișa mea e aprins doar „Profilul meu”, nu și „Arborele meu”.
    && !(href === "/arbore" && !!profile && path === profile));
  const report = path?.startsWith("/problema") ? "/problema" : `/problema?de=${encodeURIComponent(path || "/")}`;
  const initials = name.replace(/\s*\(.*\)\s*$/, "").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  const signOut = async () => { await authClient.signOut(); router.push("/"); router.refresh(); };
  const item = (href: string, icon: ReactNode, label: string, badge = 0, match = href) => (
    <Link href={href} aria-current={on(match) ? "page" : undefined}>
      {icon}<span>{label}</span>{badge ? <span className="acc-n">{badge}</span> : null}
    </Link>
  );
  return (
    <>
      <aside className="acc-side" aria-label={t("menu")}>
        <Link href="/datele-mele" className="acc-me">
          {image && !broken
            ? <img src={image} alt="" className="acc-av" referrerPolicy="no-referrer" onError={() => setBroken(true)} />
            : <span className="acc-av" aria-hidden>{initials || "?"}</span>}
          <span className="acc-me-t"><b>{name}</b>{plan && <small>{plan}</small>}</span>
        </Link>
        <nav className="acc-links">
          {item("/", <Ico n="home" />, t("home"))}
          {item("/arbore", <Ico n="tree" />, t("myTree"))}
          {profile && item(profile, <Ico n="user" />, t("profile"))}
          {item("/mesaje", <Ico n="msg" />, t("messages"), unread)}
          {item("/invitatii", <Ico n="inv" />, ti("menu"))}
          <div className="acc-grp">{t("accountGroup")}</div>
          {item("/plata", <Ico n="card" />, t("plan"))}
          {item("/datele-mele", <Ico n="data" />, t("myData"))}
          {item("/securitate", <Ico n="shield" />, t("security"))}
          {item("/arhiva", <Ico n="box" />, t("archive"))}
          <div className="acc-grp">{t("moreGroup")}</div>
          {item("/ghid", <Ico n="help" />, t("guides"))}
          {item("/parteneri", <Ico n="hand" />, tp("menu"))}
          {item(report, <Ico n="flag" />, t("report"), replies, "/problema")}
          {admin && item("/admin", <Ico n="key" />, t("admin"))}
        </nav>
        <button className="acc-out" onClick={signOut}><Ico n="out" /><span>{t("signOut")}</span></button>
      </aside>
      <nav className="acc-dock" aria-label={t("menu")}>
        {item("/", <Ico n="home" />, t("home"))}
        {item("/arbore", <Ico n="tree" />, t("myTreeShort"))}
        {item("/mesaje", <Ico n="msg" />, t("messages"), unread)}
        {item("/invitatii", <Ico n="inv" />, t("inviteShort"))}
        {item("/datele-mele", <Ico n="user" />, t("accountShort"), replies)}
      </nav>
    </>
  );
}

const PATHS: Record<string, ReactNode> = {
  home: <><path d="M3 11l9-7 9 7" /><path d="M5 10v10h14V10" /></>,
  tree: <><path d="M12 21v-7" /><path d="M12 14l-3.5-3M12 16l3.5-3" /><path d="M12 3c-3.3 0-6 2.5-6 5.6 0 1.4.5 2.6 1.4 3.6M12 3c3.3 0 6 2.5 6 5.6 0 1.4-.5 2.6-1.4 3.6" /><path d="M8 21h8" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21c1-4 4.5-6 8-6s7 2 8 6" /></>,
  msg: <path d="M4 5h16v11H8l-4 4z" />,
  inv: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c.8-3.4 3.4-5 6.5-5s5.7 1.6 6.5 5" /><path d="M18 8v6M15 11h6" /></>,
  card: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18" /></>,
  data: <><ellipse cx="12" cy="6" rx="7" ry="3" /><path d="M5 6v12c0 1.7 3 3 7 3s7-1.3 7-3V6" /><path d="M5 12c0 1.7 3 3 7 3s7-1.3 7-3" /></>,
  shield: <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" />,
  box: <><path d="M3 8l9-4 9 4-9 4z" /><path d="M3 8v8l9 4 9-4V8" /><path d="M12 12v8" /></>,
  help: <><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.7M12 17h.01" /></>,
  hand: <><path d="M8 12l3 3 6-6" /><circle cx="12" cy="12" r="9" /></>,
  flag: <path d="M5 21V4h11l-2 4 2 4H5" />,
  key: <><circle cx="8" cy="14" r="4" /><path d="M11 11l8-8M16 6l2 2" /></>,
  book: <><path d="M4 5c3-1 6-1 8 1 2-2 5-2 8-1v14c-3-1-6-1-8 1-2-2-5-2-8-1z" /><path d="M12 6v14" /></>,
  map: <><path d="M9 4l-6 2v14l6-2 6 2 6-2V4l-6 2z" /><path d="M9 4v14M15 6v14" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  print: <><path d="M7 9V3h10v6" /><rect x="3" y="9" width="18" height="8" rx="2" /><path d="M7 14h10v7H7z" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  ship: <><path d="M12 3v9" /><path d="M7 12h10l-2 6H9z" /><path d="M12 4l5 5h-5" /><path d="M3 20c2 1.3 4 1.3 6 0 2 1.3 4 1.3 6 0 2 1.3 4 1.3 6 0" /></>,
  globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z" /></>,
  down: <><path d="M12 4v11M7 10l5 5 5-5" /><path d="M5 20h14" /></>,
  out: <><path d="M15 4h4v16h-4" /><path d="M10 8l-4 4 4 4M6 12h10" /></>,
};
export function Ico({ n }: { n: keyof typeof PATHS | string }) {
  return (
    <svg className="acc-ic" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {PATHS[n]}
    </svg>
  );
}
