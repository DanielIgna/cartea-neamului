import IstorieArticle, { istorieMetadata } from "@/components/continut/IstorieArticle";
import { currentUser } from "@/lib/access";
import { FILE } from "@/lib/istorie/file";

const SLUG = "tiparul-istoriei";
export const generateMetadata = () => istorieMetadata(SLUG);

/** Pagina făcută pe loc (cine are sesiune): fila apare doar pentru un cont adevărat, verificat aici. Vizitatorii fără cont și roboții primesc pagina gata făcută din app/(public)/pub/[v]/istoria-umanitatii/tiparul-istoriei, fără filă. */
export default async function Page() {
  const user = await currentUser();
  return <IstorieArticle slug={SLUG} fila={user ? FILE[SLUG] ?? null : null} />;
}
