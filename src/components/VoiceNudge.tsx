import Link from "next/link";
import { db } from "@/db";
import { voiceNudge } from "@/lib/extra";
import { getT } from "@/i18n/server";

/**
 * Un îndemn discret, după ce s-au completat primele fișe și încă nu e nicio înregistrare în arbore: „Înregistrează glasul
 * bunicii”. Duce la „La bunici” pentru cel mai în vârstă om în viață din arbore, unde se înregistrează glasul.
 */
export default async function VoiceNudge({ treeId }: { treeId: string }) {
  const n = await voiceNudge(db, treeId).catch(() => null);
  if (!n) return null;
  const t = await getT("Access");
  return (
    <p className="voice-nudge">
      <span>{n.name ? t("voiceNudge", { name: n.name }) : t("voiceNudgeAny")}</span>
      {n.personId && <Link href={`/arbore/${treeId}/persoana/${n.personId}/la-bunici`}>{t("voiceNudgeCta")}</Link>}
    </p>
  );
}
