import { db } from "@/db";
import { branchPick, markBranchShown } from "@/lib/invita-ramura";
import { canInviteWriters } from "@/lib/plata";
import BranchInviteBox from "./BranchInviteBox";

/** Pe pagina arborelui, pentru cine poate invita: ruda de chemat după 5 persoane (src/lib/invita-ramura.ts). */
export default async function BranchInvite({ treeId, userId }: { treeId: string; userId: string }) {
  const pick = await branchPick(db, treeId, userId).catch(() => null);
  if (!pick) return null;
  const [writers] = await Promise.all([
    canInviteWriters(db, userId, treeId).catch(() => false),
    markBranchShown(db, userId, pick.personId).catch(() => undefined),
  ]);
  return <BranchInviteBox treeId={treeId} personId={pick.personId} name={pick.name} sex={pick.sex} count={pick.count} writers={writers} />;
}
