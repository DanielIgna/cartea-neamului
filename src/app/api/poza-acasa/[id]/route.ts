import { db } from "@/db";
import { findUpload, homeImagesState } from "@/lib/home-images";
import { getObjectBytes } from "@/lib/storage";

/**
 * O poză încărcată de admin pentru prima pagină. E publică, ca toată prima pagină. Fiecare poză are id-ul ei, care nu se
 * schimbă, deci o putem ține mult în cache.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const up = /^[\w-]+$/.test(id) ? findUpload(await homeImagesState(db), id) : null;
  if (!up) return new Response("Nu există.", { status: 404 });
  try {
    const bytes = await getObjectBytes(up.key);
    return new Response(bytes as BodyInit, {
      headers: { "Content-Type": up.type, "Cache-Control": "public, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff" },
    });
  } catch (err) {
    console.error("poza-acasa", id, err);
    return new Response("Poza nu se poate citi acum.", { status: 503 });
  }
}
