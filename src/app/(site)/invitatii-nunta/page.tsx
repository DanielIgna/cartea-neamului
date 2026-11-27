import { db } from "@/db";
import { getLocale } from "@/i18n/server";
import { ShopHub } from "@/components/InvitatiiNunta";
import { shopOpen } from "@/lib/invitatii-nunta-server";
import { publishedModels } from "@/lib/invitatii-nunta-produse";
import { hubMetadata } from "@/lib/invitatii-nunta-meta";

export const dynamic = "force-dynamic";
export const generateMetadata = hubMetadata;

/** „Invitații de nuntă”: lista modelelor publicate din Admin (Daniel, 27.11.2026). */
export default async function InvitatiiNuntaPage() {
  const [open, models] = await Promise.all([shopOpen(db), publishedModels(db)]);
  return <ShopHub locale={await getLocale()} open={open} models={models} />;
}
