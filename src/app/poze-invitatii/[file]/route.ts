import { PHOTO_FILE, PHOTO_PREFIX } from "@/lib/invitatii-nunta";
import { PHOTO_MIME } from "@/lib/invitatii-nunta-incarcare";
import { getObjectBytes } from "@/lib/storage";

/**
 * O poză de prezentare a unei invitații de nuntă, urcată din Admin. E publică, ca paginile modelelor (și intră în Google
 * Imagini). Fiecare poză are numele ei, care nu se schimbă, deci stă mult în cache. ZIP-urile nu se pot cere de aici: doar
 * fișierele din magazin/invitatii-nunta/poze/, cu nume de forma <slug>-<8 semne>.webp|jpg|png.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  if (!PHOTO_FILE.test(file)) return new Response("Nu există.", { status: 404 });
  const ext = file.split(".").pop() as keyof typeof PHOTO_MIME;
  try {
    const bytes = await getObjectBytes(`${PHOTO_PREFIX}${file}`);
    return new Response(bytes as BodyInit, {
      headers: { "Content-Type": PHOTO_MIME[ext], "Cache-Control": "public, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff" },
    });
  } catch {
    return new Response("Nu există.", { status: 404 });
  }
}
