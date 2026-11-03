"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { PersonView } from "@/lib/tree-data";

/**
 * Micșorează o poză în browser înainte de încărcare: cel mult 1600 px pe latura mare, JPEG. O poză de 8 MB din telefon
 * ajunge pe la 300–600 KB, deci încape sub limita de 4 MB a site-ului și se încarcă repede și pe date mobile.
 * Dacă browserul nu o poate citi (de pildă HEIC pe Windows), trimitem fișierul așa cum e.
 */
export async function shrinkPhoto(file: File, max = 1600): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/gif") return file;
  try {
    const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
    const k = Math.min(1, max / Math.max(bmp.width, bmp.height));
    if (k === 1 && file.size <= 1_500_000 && /^image\/(jpeg|png|webp)$/.test(file.type)) { bmp.close(); return file; }
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bmp.width * k));
    canvas.height = Math.max(1, Math.round(bmp.height * k));
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.fillStyle = "#fff"; // pozele PNG transparente nu ies cu fundal negru
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    bmp.close();
    const blob = await new Promise<Blob | null>((done) => canvas.toBlob(done, "image/jpeg", 0.86));
    return blob ? new File([blob], `${file.name.replace(/\.[^.]+$/, "") || "poza"}.jpg`, { type: "image/jpeg" }) : file;
  } catch {
    return file;
  }
}

/** „Pune o poză” / „Schimbă poza” lângă nume: alegi poza din telefon sau din calculator și devine poza de profil; rămâne și în album. */
export default function PhotoPick({ treeId, p, onDone, className = "linklike" }: {
  treeId: string; p: Pick<PersonView, "id" | "name" | "photoId">; onDone?: () => void; className?: string;
}) {
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
      form.set("title", `Poză de profil, ${p.name}`);
      form.set("kind", "photo");
      form.set("asProfile", "on");
      form.set("file", small, small.name);
      const res = await fetch(`/api/arbore/${treeId}/documente`, { method: "POST", body: form });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Poza nu s-a încărcat. Încearcă din nou.");
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
        {busy ? "Se încarcă poza…" : p.photoId ? "Schimbă poza" : "Pune o poză"}
      </button>
      <input ref={input} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) void upload(f); }} />
      {err && <span className="err" role="alert">{err}</span>}
    </span>
  );
}
