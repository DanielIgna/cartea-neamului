import type { PersonView } from "@/lib/tree-data";

const initials = (p: { givenName: string; surname: string }) => `${p.givenName[0] ?? ""}${p.surname[0] ?? ""}`.toUpperCase();

/** Poza de profil, rotundă: cea încărcată în arbore; altfel poza din contul Google al celui care și-a revendicat fișa; altfel inițialele. */
export function Avatar({ p, size = 72 }: { p: Pick<PersonView, "givenName" | "surname" | "photoId"> & { accountImage?: string | null }; size?: number }) {
  const src = p.photoId ? `/api/document/${p.photoId}` : p.accountImage ?? null;
  return src
    ? <img src={src} alt="" className="avatar" style={{ width: size, height: size }} referrerPolicy="no-referrer" />
    : <span className="avatar avatar-empty" style={{ width: size, height: size, fontSize: size / 2.6 }} aria-hidden>{initials(p)}</span>;
}
