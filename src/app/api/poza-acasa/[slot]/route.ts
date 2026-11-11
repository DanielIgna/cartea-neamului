import { db } from "@/db";
import { homeImageEntries, isHomeSlot } from "@/lib/home-images";
import { getObjectBytes } from "@/lib/storage";

/**
 * Poza pusă de admin pe un loc al primei pagini. E publică, ca toată prima pagină. Adresa poartă data schimbării (?v=…),
 * deci o putem ține mult în cache; fără poză încărcată trimitem înapoi la poza inițială din public/home.
 */
export async function GET(req: Request, { params }: { params: Promise<{ slot: string }> }) {
  const { slot } = await params;
  if (!isHomeSlot(slot)) return new Response("Nu există.", { status: 404 });
  const e = (await homeImageEntries(db))[slot];
  if (!e) return Response.redirect(new URL("/", req.url), 302);
  try {
    const bytes = await getObjectBytes(e.key);
    return new Response(bytes as BodyInit, {
      headers: { "Content-Type": e.type, "Cache-Control": "public, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff" },
    });
  } catch (err) {
    console.error("poza-acasa", slot, err);
    return new Response("Poza nu se poate citi acum.", { status: 503 });
  }
}
