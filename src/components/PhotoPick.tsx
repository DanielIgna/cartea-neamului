"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "use-intl";
import type { PersonView } from "@/lib/tree-data";
import { shrinkPhoto } from "@/lib/shrink-photo";

/** „Pune o poză” / „Schimbă poza” lângă nume: alegi poza din telefon sau din calculator și devine poza de profil; rămâne și în album. */
export default function PhotoPick({ treeId, p, onDone, className = "linklike" }: {
  treeId: string; p: Pick<PersonView, "id" | "name" | "photoId">; onDone?: () => void; className?: string;
}) {
  const t = useTranslations("Media");
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const upload = async (file: File) => {
    setBusy(true);
    setErr(null);
    try {
      const small = await shrinkPhoto(file);
      const form = new FormData();
      form.set("personId", p.id);
      form.set("title", t("profileTitle", { name: p.name }));
      form.set("kind", "photo");
      form.set("asProfile", "on");
      form.set("file", small, small.name);
      const res = await fetch(`/api/arbore/${treeId}/documente`, { method: "POST", body: form });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? t("photoFailed"));
      if (onDone) onDone(); else router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <span className="photo-pick">
      <button type="button" className={className} disabled={busy} onClick={() => input.current?.click()}>
        {busy ? t("photoUploading") : p.photoId ? t("photoChange") : t("photoAdd")}
      </button>
      <input ref={input} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) void upload(f); }} />
      {err && <span className="err" role="alert">{err}</span>}
    </span>
  );
}
