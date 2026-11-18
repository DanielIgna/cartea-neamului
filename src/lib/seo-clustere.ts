import { PUBLIC_PAGES } from "./public-pages";
import { PUBLIC_SECTIONS, sectionOf } from "./public-sections";

/**
 * Grupa („clusterul”) unei pagini, ca în Admin → SEO și Admin → Analiză: paginile principale, fiecare secțiune cu multe pagini
 * (ghiduri, glosar, nume, localități, diaspora…) și zona privată (arbori, cont, plată), care nu e în Google.
 */
export type Cluster = { key: string; label: string; indexable: boolean };

export function clusterOf(path: string): Cluster {
  const p = path.replace(/\/+$/, "") || "/";
  const sec = sectionOf(p);
  if (sec) return { key: sec, label: PUBLIC_SECTIONS.find((s) => s.key === sec)!.label, indexable: true };
  if (PUBLIC_PAGES.some((x) => x.path === p)) return { key: "pagini", label: "Paginile principale", indexable: true };
  if (p === "/scoala" || (p.startsWith("/scoala/") && !p.startsWith("/scoala/fisa/"))) return { key: "scoala", label: "Pentru școli", indexable: true };
  if (p === "/cadouri" || p.startsWith("/cadouri/")) return { key: "cadouri", label: "Cadouri", indexable: true };
  if (p === "/unelte" || p.startsWith("/unelte/")) return { key: "unelte", label: "Unelte gratuite", indexable: true };
  if (p === "/presa" || p === "/arborele-meu") return { key: "autoritate", label: "Presă și widget", indexable: true };
  if (p === "/intrare" || p.startsWith("/intrare/")) return { key: "cont", label: "Intrare / cont nou", indexable: false };
  return { key: "privat", label: "Pagini private sau fără loc în Google", indexable: false };
}

export const pageLabel = (p: string) => PUBLIC_PAGES.find((x) => x.path === p)?.label ?? p;
