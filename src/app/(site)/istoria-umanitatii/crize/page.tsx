import type { Metadata } from "next";
import CrizeArticle from "@/components/continut/CrizeArticle";
import { currentUser } from "@/lib/access";
import { CRIZE } from "@/lib/istorie/crize";
import { CRIZE_FILA } from "@/lib/istorie/crize-fila";
import { publicPageMetadata } from "@/lib/page-metadata";

export const generateMetadata = (): Metadata => publicPageMetadata({ path: CRIZE.path, title: CRIZE.title, description: CRIZE.description });

/**
 * Pagina făcută pe loc (cine are sesiune): fila cu versetele apare doar pentru un cont adevărat, verificat aici. Vizitatorii fără
 * cont și roboții primesc pagina gata făcută din app/(public)/pub/[v]/istoria-umanitatii/crize, fără filă.
 */
export default async function CrizePage() {
  const user = await currentUser();
  return <CrizeArticle fila={user ? CRIZE_FILA : null} />;
}
