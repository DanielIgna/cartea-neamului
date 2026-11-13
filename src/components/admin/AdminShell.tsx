"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { ADMIN_HOME, ADMIN_SIDES, ALL_ADMIN_ITEMS, DEFAULT_FAVORITES, activeItem, searchItems, type AdminIcon, type AdminItem, type AdminSide } from "@/lib/admin-menu";
import type { AdminBadges } from "@/lib/admin-briefing";

const FAV_KEY = "cn-admin-favorite";
const CLOSED_KEY = "cn-admin-grupuri-stranse";

function load<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch { return fallback; }
}
function save(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* fără stocare: meniul merge oricum */ }
}

const PATHS: Record<AdminIcon | "star" | "menu" | "close" | "chev", string> = {
  home: "M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
  people: "M16 20v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 18.5V20M10 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7M20 20v-1.5a3.5 3.5 0 0 0-2.5-3.35M15.5 4.2a3.5 3.5 0 0 1 0 6.6",
  chart: "M4 20V10M10 20V4M16 20v-7M22 20H2",
  pulse: "M3 12h4l3-8 4 16 3-8h4",
  sliders: "M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0M14 4v4M8 10v4M16 16v4",
  history: "M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5M12 7v5l3 2",
  alert: "M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0",
  text: "M4 6h16M4 12h16M4 18h10",
  image: "M4 5h16v14H4zM4 16l4.5-4.5 4 4L15 13l5 5M15.5 9.5h.01",
  inbox: "M22 12h-6l-2 3h-4l-2-3H2M5.5 5h13l3.5 7v6a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-6z",
  search: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14M21 21l-4.3-4.3",
  dna: "M7 3c0 6 10 6 10 12s-10 3-10 6M17 3c0 6-10 6-10 12M9 6h6M8.5 18h7",
  mail: "M3 5h18v14H3zM3 6l9 7 9-7",
  shield: "M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6zM9 12l2 2 4-4",
  server: "M3 4h18v7H3zM3 13h18v7H3zM7 7.5h.01M7 16.5h.01",
  robot: "M5 8h14v11H5zM12 8V4M9 13h.01M15 13h.01M9.5 16.5h5M3 12v3M21 12v3",
  star: "m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z",
  menu: "M4 6h16M4 12h16M4 18h16",
  close: "M6 6l12 12M18 6 6 18",
  chev: "m6 9 6 6 6-6",
};
function Icon({ name, filled }: { name: keyof typeof PATHS; filled?: boolean }) {
  return (
    <svg className="adm-ico" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={PATHS[name]} />
    </svg>
  );
}

/** Semnul de lângă o pagină: câte lucruri o așteaptă (roșu la erori) sau „NOU”. */
function itemBadge(item: AdminItem, badges: AdminBadges) {
  const n = (badges as Record<string, number>)[item.key] ?? 0;
  if (n > 0) return <span className={`adm-badge ${item.key === "infra" ? "bad" : "warn"}`} title="De văzut">{n > 99 ? "99+" : n}</span>;
  if (item.isNew) return <span className="adm-badge new">NOU</span>;
  return null;
}

/**
 * Cadrul panoului de admin: meniul din stânga pe calculator, sertar care se deschide din „Meniu” pe telefon.
 * Sus: Business / Infra & Dev, căutare rapidă (Ctrl/⌘ K) și favorite (steluța); mai jos grupurile, care se strâng.
 * Favoritele și grupurile strânse se țin minte în browser, doar pentru cel care folosește panoul.
 */
export default function AdminShell({ badges, children }: { badges: AdminBadges; children: React.ReactNode }) {
  const pathname = usePathname() ?? "/admin";
  const router = useRouter();
  const current = activeItem(pathname);
  const currentSide: AdminSide = ALL_ADMIN_ITEMS.find((i) => i.key === current.key)?.side ?? "business";
  const [side, setSide] = useState<AdminSide>(currentSide);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [favs, setFavs] = useState<string[]>(DEFAULT_FAVORITES);
  const [closed, setClosed] = useState<string[]>([]);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setFavs(load(FAV_KEY, DEFAULT_FAVORITES)); setClosed(load(CLOSED_KEY, [])); }, []);
  // La fiecare pagină nouă: sertarul se închide și partea (Business / Infra) e cea a paginii deschise.
  useEffect(() => { setOpen(false); setQ(""); setSide(currentSide); }, [pathname, currentSide]);
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
        requestAnimationFrame(() => searchRef.current?.focus());
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const results = useMemo(() => searchItems(q), [q]);
  const favItems = favs.map((k) => ALL_ADMIN_ITEMS.find((i) => i.key === k)).filter((i): i is (typeof ALL_ADMIN_ITEMS)[number] => !!i);
  const toggleFav = (key: string) => setFavs((f) => { const next = f.includes(key) ? f.filter((x) => x !== key) : [...f, key]; save(FAV_KEY, next); return next; });
  const toggleGroup = (id: string) => setClosed((c) => { const next = c.includes(id) ? c.filter((x) => x !== id) : [...c, id]; save(CLOSED_KEY, next); return next; });
  const s = ADMIN_SIDES[side];

  const row = (item: AdminItem, opts: { star?: boolean; hint?: boolean } = {}) => {
    const fav = favs.includes(item.key);
    return (
      <li key={item.key} className="adm-row">
        <Link href={item.href} className="adm-link" aria-current={current.key === item.key ? "page" : undefined} onClick={() => setOpen(false)}>
          <Icon name={item.icon} />
          <span className="adm-label">{item.label}{opts.hint && <small>{item.hint}</small>}</span>
          {itemBadge(item, badges)}
        </Link>
        {opts.star !== false && (
          <button type="button" className={`adm-star${fav ? " on" : ""}`} aria-pressed={fav} title={fav ? "Scoate de la favorite" : "Pune la favorite"} aria-label={`${fav ? "Scoate de la" : "Pune la"} favorite: ${item.label}`} onClick={() => toggleFav(item.key)}>
            <Icon name="star" filled={fav} />
          </button>
        )}
      </li>
    );
  };

  return (
    <div className="adm">
      <div className="adm-bar">
        <button type="button" className="btn adm-open" onClick={() => setOpen(true)} aria-expanded={open} aria-controls="adm-side"><Icon name="menu" /> Meniu</button>
        <span className="adm-where"><small>Admin</small>{current.label}</span>
        <button type="button" className="btn adm-open" aria-label="Caută în panou" onClick={() => { setOpen(true); requestAnimationFrame(() => searchRef.current?.focus()); }}><Icon name="search" /></button>
      </div>
      <div className="adm-scrim" hidden={!open} onClick={() => setOpen(false)} />
      <aside id="adm-side" className="adm-side" data-open={open} aria-label="Meniul panoului de admin">
        <div className="adm-head">
          <span className="adm-title">Panoul de admin</span>
          <button type="button" className="adm-x" aria-label="Închide meniul" onClick={() => setOpen(false)}><Icon name="close" /></button>
        </div>
        <div className="adm-sides" role="group" aria-label="Partea panoului">
          {(Object.keys(ADMIN_SIDES) as AdminSide[]).map((k) => (
            <button key={k} type="button" aria-pressed={side === k} className={k} onClick={() => setSide(k)}>
              <Icon name={k === "business" ? "chart" : "server"} /> {ADMIN_SIDES[k].label}
            </button>
          ))}
        </div>
        <div className="adm-sideinfo"><b>{s.title}</b><small>{s.sub}</small></div>
        <label className="adm-search">
          <Icon name="search" />
          <input ref={searchRef} type="search" value={q} placeholder="Caută rapid…" aria-label="Caută o pagină din panou"
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && results[0]) { router.push(results[0].href); setOpen(false); } }} />
          <kbd>⌘K</kbd>
        </label>

        <nav className="adm-nav">
          {q.trim() ? (
            <>
              <div className="adm-group-h static">Rezultate <span className="adm-count">{results.length}</span></div>
              {results.length ? <ul>{results.map((i) => row(i, { hint: true }))}</ul> : <p className="adm-empty">Nimic cu „{q}”.</p>}
            </>
          ) : (
            <>
              {favItems.length > 0 && (
                <>
                  <div className="adm-group-h static fav"><Icon name="star" filled /> Favorite</div>
                  <ul>{favItems.map((i) => row(i))}</ul>
                </>
              )}
              <ul className="adm-home">{row(ADMIN_HOME, { star: false })}</ul>
              {s.groups.map((g) => {
                const isClosed = closed.includes(g.id) && !g.items.some((i) => i.key === current.key);
                return (
                  <div key={g.id} className="adm-group">
                    <button type="button" className="adm-group-h" aria-expanded={!isClosed} onClick={() => toggleGroup(g.id)}>
                      {g.label} <span className="adm-count">{g.items.length}</span><span className="adm-chev" data-closed={isClosed}><Icon name="chev" /></span>
                    </button>
                    {!isClosed && <ul>{g.items.map((i) => row(i))}</ul>}
                  </div>
                );
              })}
            </>
          )}
        </nav>
      </aside>
      <div className="adm-main">{children}</div>
    </div>
  );
}
