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
