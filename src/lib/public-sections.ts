/**
 * Secțiunile publice cu multe pagini (ghiduri, glosar și, pe rând, nume de familie și localități). Ca și PUBLIC_PAGES, sunt
 * deschise tuturor și servite gata făcute vizitatorilor fără cont (middleware.ts). Fișier fără importuri de pe server.
 * Paginile acestea NU intră în PUBLIC_PAGES, ca robots.txt să rămână neschimbat (nimic de aici nu e oprit în robots.txt).
 */
export const PUBLIC_SECTIONS = [
  { key: "ghid", hub: "/ghid", label: "Ghiduri de genealogie", depth: 1 },
  { key: "glosar", hub: "/glosar", label: "Glosar de genealogie", depth: 1 },
  { key: "nume", hub: "/nume", label: "Nume de familie", depth: 1 },
  { key: "localitati", hub: "/localitati", label: "Localități", depth: 2 },
] as const;
export type SectionKey = (typeof PUBLIC_SECTIONS)[number]["key"];

const SLUG = "[a-z0-9]+(?:-[a-z0-9]+)*";

/** Adresa e hubul unei secțiuni sau o pagină din ea (/ghid, /ghid/cum-incepi…), cu numărul potrivit de segmente. */
export function sectionOf(pathname: string): SectionKey | null {
  for (const s of PUBLIC_SECTIONS) {
    if (pathname === s.hub) return s.key;
    if (new RegExp(`^${s.hub}(?:/${SLUG}){1,${s.depth}}$`).test(pathname)) return s.key;
  }
  return null;
}
