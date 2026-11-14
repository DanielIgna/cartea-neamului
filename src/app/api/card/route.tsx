import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { getName, KIND_LABEL } from "@/lib/continut/nume";
import { getCounty } from "@/lib/continut/localitati";
import { REGIONS } from "@/lib/continut/regiuni";

export const runtime = "nodejs";

/**
 * Cardul de distribuit al unui nume de familie sau al unei localități (Admin → Creștere): o poză 1200×630 care apare în
 * previzualizarea linkului pe WhatsApp și Facebook și care se poate descărca pentru o postare. Doar date din fișierele
 * publice (content/nume, content/localitati), niciun om anume.
 *   /api/card?nume=<slug>   /api/card?judet=<slug>[&oras=<slug>]
 */
const FONTS = path.join(process.cwd(), "node_modules", "@fontsource");
let fonts: Promise<{ name: string; data: Buffer; weight: 400 | 700 }[]> | null = null;
const loadFonts = () => (fonts ??= Promise.all([
  ["alegreya", "alegreya-latin-700-normal.woff", 700], ["alegreya", "alegreya-latin-ext-700-normal.woff", 700],
  ["alegreya", "alegreya-latin-500-normal.woff", 400], ["alegreya", "alegreya-latin-ext-500-normal.woff", 400],
].map(async ([dir, file, weight]) => ({ name: "Alegreya", data: await readFile(path.join(FONTS, dir as string, "files", file as string)), weight: weight as 400 | 700 }))));

function cardFor(q: URLSearchParams) {
  const nume = q.get("nume");
  if (nume) {
    const n = getName(nume);
    if (!n) return null;
    return { eyebrow: `Nume de familie · ${KIND_LABEL[n.kind]}`, title: n.name, sub: n.meaning.replace(/\*/g, "").slice(0, 150),
      foot: n.regions.length ? n.regions.map((r) => REGIONS[r].name).join(" · ") : "Toată țara" };
  }
  const j = q.get("judet");
  if (j) {
    const c = getCounty(j);
    if (!c) return null;
    const oras = q.get("oras");
    if (oras && c.seatSlug === oras && c.seat) return { eyebrow: `Reședința județului ${c.name}`, title: c.seat, sub: "Unde cauți actele și registrele vechi ale familiei", foot: c.regions.map((r) => REGIONS[r].name).join(" · ") };
    return { eyebrow: "Arhive și registre", title: c.slug === "bucuresti" ? "București" : `Județul ${c.name}`, sub: "Unde cauți actele strămoșilor și ce nume de familie sunt des întâlnite", foot: c.regions.map((r) => REGIONS[r].name).join(" · ") };
  }
  return null;
}

export async function GET(req: Request) {
  const card = cardFor(new URL(req.url).searchParams);
  if (!card) return new Response("not found", { status: 404 });
  const size = card.title.length > 18 ? 84 : 112;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "64px 72px",
        background: "linear-gradient(135deg, #fbf6ee 0%, #f1e4d1 100%)", color: "#2b2118", fontFamily: "Alegreya" }}>
        <div style={{ display: "flex", fontSize: 30, letterSpacing: 2, textTransform: "uppercase", color: "#8a4b2a" }}>{card.eyebrow}</div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontFamily: "Alegreya", fontWeight: 700, fontSize: size, lineHeight: 1.05 }}>{card.title}</div>
          <div style={{ display: "flex", fontSize: 34, marginTop: 20, color: "#5a4636", maxWidth: 1000 }}>{card.sub}</div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", fontSize: 28, color: "#6b5a4c" }}>
          <div style={{ display: "flex" }}>{card.foot}</div>
          <div style={{ display: "flex", fontFamily: "Alegreya", fontWeight: 700, fontSize: 36, color: "#8a4b2a" }}>carteaneamului.ro</div>
        </div>
      </div>
    ),
    { width: 1200, height: 630, fonts: await loadFonts(), headers: { "Cache-Control": "public, max-age=86400, s-maxage=604800" } },
  );
}
