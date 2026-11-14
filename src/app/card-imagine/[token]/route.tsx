import { readFile } from "node:fs/promises";
import path from "node:path";
import QRCode from "qrcode";
import { ImageResponse } from "next/og";
import { db } from "@/db";
import { CARD_ORIGIN, activationUrl, cardByShareToken, giftCardsEnabled, pl } from "@/lib/carduri-cadou";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FONTS = path.join(process.cwd(), "node_modules", "@fontsource");
let fonts: Promise<{ name: string; data: Buffer; weight: 400 | 700 }[]> | null = null;
const loadFonts = () => (fonts ??= Promise.all([
  ["alegreya", "alegreya-latin-700-normal.woff", 700], ["alegreya", "alegreya-latin-ext-700-normal.woff", 700],
  ["alegreya", "alegreya-latin-500-normal.woff", 400], ["alegreya", "alegreya-latin-ext-500-normal.woff", 400],
].map(async ([dir, file, weight]) => ({ name: "Alegreya", data: await readFile(path.join(FONTS, dir as string, "files", file as string)), weight: weight as 400 | 700 }))));

const durata = (m: number) => (m === 12 ? "un an" : m % 12 === 0 ? `${m / 12} ani` : pl(m, "lună", "luni"));

/**
 * Poza cardului cadou digital: `?f=og` (1200×630) e previzualizarea din WhatsApp/Facebook, fără cod; altfel e cardul de salvat
 * în telefon (1080×1350), cu codul și QR-ul spre /activeaza. Doar pentru cardurile vândute, cât e pornită funcția.
 */
export async function GET(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const og = new URL(req.url).searchParams.get("f") === "og";
  const [on, c] = await Promise.all([giftCardsEnabled(db), cardByShareToken(db, token)]);
  const sold = !!c && on && (c.status === "vandut_activat_de_magazin" || c.status === "folosit");
  const title = sold && c!.pentru ? `Pentru ${c!.pentru}` : "Un card cadou pentru tine";
  const sub = sold ? `Povestea familiei tale, într-un singur loc. ${durata(c!.durataLuni)[0].toUpperCase()}${durata(c!.durataLuni).slice(1)} în Cartea Neamului.` : "Povestea familiei tale, într-un singur loc.";
  const bg = "linear-gradient(135deg, #fbf6ee 0%, #f1e4d1 100%)";
  const opts = { fonts: await loadFonts(), headers: { "cache-control": "private, no-store" } };
  if (og || !sold) {
    return new ImageResponse(
      (
        <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "64px 72px", background: bg, color: "#2b2118", fontFamily: "Alegreya" }}>
          <div style={{ display: "flex", fontSize: 30, letterSpacing: 2, textTransform: "uppercase", color: "#8a4b2a" }}>Card cadou · Cartea Neamului</div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontWeight: 700, fontSize: 96, lineHeight: 1.05 }}>{title}</div>
            <div style={{ display: "flex", fontSize: 38, marginTop: 20, color: "#5a4636", maxWidth: 1000 }}>{sub}</div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", fontWeight: 700, fontSize: 36, color: "#8a4b2a" }}>carteaneamului.ro</div>
        </div>
      ),
      { width: 1200, height: 630, ...opts },
    );
  }
  const qr = await QRCode.toDataURL(activationUrl(CARD_ORIGIN, c!.cod), { margin: 1, width: 360, color: { dark: "#2a1d17", light: "#fffdf8" } });
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between", padding: "80px 72px", background: bg, color: "#2b2118", fontFamily: "Alegreya", textAlign: "center" }}>
        <div style={{ display: "flex", fontSize: 34, letterSpacing: 3, textTransform: "uppercase", color: "#8a4b2a" }}>Card cadou · Cartea Neamului</div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ display: "flex", fontWeight: 700, fontSize: 92, lineHeight: 1.05 }}>{title}</div>
          <div style={{ display: "flex", fontSize: 40, marginTop: 24, color: "#5a4636", maxWidth: 900, justifyContent: "center" }}>{sub}</div>
          {c!.mesaj && <div style={{ display: "flex", fontSize: 36, marginTop: 28, fontStyle: "italic", color: "#5a4636", maxWidth: 860, justifyContent: "center" }}>„{c!.mesaj.slice(0, 160)}”</div>}
        </div>
        <img src={qr} width={340} height={340} alt="" />
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "22px 48px", border: "4px solid #a8722f", borderRadius: 24, background: "#fffdf8" }}>
          <div style={{ display: "flex", fontSize: 28, letterSpacing: 2, textTransform: "uppercase", color: "#7a5520" }}>Codul tău</div>
          <div style={{ display: "flex", fontWeight: 700, fontSize: 72, letterSpacing: 6 }}>{c!.cod}</div>
        </div>
        <div style={{ display: "flex", fontSize: 34, color: "#6b5a4c" }}>Activează pe carteaneamului.ro/activeaza</div>
      </div>
    ),
    { width: 1080, height: 1350, ...opts },
  );
}
