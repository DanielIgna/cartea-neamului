"use client";
import { useRouter } from "next/navigation";
import type { PersonView } from "@/lib/tree-data";
import { Album } from "./Album";
import { DocumentUpload } from "./PersonTools";

export default function ProfileAlbum({ p, treeId, canEdit, canUpload }: { p: PersonView; treeId: string; canEdit: boolean; canUpload: boolean }) {
  const router = useRouter();
  return (
    <>
      <Album p={p} treeId={treeId} canEdit={canEdit} onChanged={() => router.refresh()} large />
      {canUpload && <DocumentUpload treeId={treeId} personId={p.id} personName={p.givenName} onUploaded={() => router.refresh()} />}
    </>
  );
}
