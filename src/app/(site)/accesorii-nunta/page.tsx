import { CategoryHubPage } from "@/components/MagazinPagini";
import { categoryHubMetadata } from "@/lib/invitatii-nunta-meta";

export const dynamic = "force-dynamic";
export const generateMetadata = () => categoryHubMetadata("accesorii");

/** „Accesorii nuntă”: lista produselor publicate din Admin (Daniel, 28.11.2026). */
export default function Page() {
  return <CategoryHubPage category="accesorii" />;
}
