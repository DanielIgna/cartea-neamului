import type { Metadata } from "next";
import { PRIVATE_ROBOTS } from "@/lib/page-metadata";
import { db } from "@/db";
import { currentUser } from "@/lib/access";
import { isAdminUser } from "@/lib/admin";
import { adminBadges } from "@/lib/admin-briefing";
import AdminShell from "@/components/admin/AdminShell";

/** Tot panoul de admin rămâne în afara motoarelor de căutare (pe lângă robots.txt). */
export const metadata: Metadata = { robots: PRIVATE_ROBOTS };

/**
 * Meniul panoului (stânga pe calculator, sertar pe telefon) se arată doar adminului; ceilalți primesc pagina, care le spune
 * „nu există” (requireAdmin în fiecare pagină), fără să afle ce e în meniu.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const me = await currentUser();
  if (!isAdminUser(me)) return children;
  const badges = await adminBadges(db).catch(() => ({ probleme: 0, propuneri: 0, adn: 0, infra: 0 }));
  // Panoul rămâne în română și de la stânga la dreapta, oricare ar fi limba site-ului.
  return <div dir="ltr" lang="ro"><AdminShell badges={badges}>{children}</AdminShell></div>;
}
