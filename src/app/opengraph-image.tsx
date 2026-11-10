import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

/** Poza din previzualizarea linkului (WhatsApp, Facebook): numele aplicației și un arbore desenat simplu, 1200×630. */
export const alt = "Cartea Neamului: arborele familiei, construit împreună";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const font = (file: string) => readFile(join(process.cwd(), "node_modules/@fontsource", file));

export default async function OpenGraphImage() {
  // Fiecare literă se ia din fontul care o are: subsetul „latin” are literele de bază, „latin-ext” pe ă, î, ș, ț.
  const [serif, serifExt, sans, sansExt] = await Promise.all([
    font("alegreya/files/alegreya-latin-700-normal.woff"),
    font("alegreya/files/alegreya-latin-ext-700-normal.woff"),
    font("alegreya-sans/files/alegreya-sans-latin-500-normal.woff"),
    font("alegreya-sans/files/alegreya-sans-latin-ext-500-normal.woff"),
  ]);
  // Frunzele arborelui: câte un cerc pe fiecare ramură, ca pe iconița aplicației.
  const leaves = [[150, 150, 34], [250, 105, 30], [352, 150, 34], [110, 245, 26], [392, 245, 26], [200, 210, 24], [304, 205, 24]];
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", background: "#f6ecdb", padding: "0 80px" }}>
        <svg width="500" height="500" viewBox="0 0 500 500">
          <circle cx="250" cy="220" r="200" fill="#e9dcc3" />
          <path d="M250 470V170M250 330l-100-90M250 290l100-80M250 230l-60-50M250 220l60-55M250 170V110"
            stroke="#7a5a3a" strokeWidth="18" strokeLinecap="round" fill="none" />
          {leaves.map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} fill={i % 2 ? "#9a6a1e" : "#1f5fa8"} />)}
          <path d="M60 470q95-30 190 0q95-30 190 0" stroke="#7a5a3a" strokeWidth="8" fill="none" strokeLinecap="round" />
        </svg>
        <div style={{ display: "flex", flexDirection: "column", marginLeft: 60, flex: 1 }}>
          <div style={{ fontFamily: "Alegreya", fontSize: 96, color: "#1b2430", lineHeight: 1 }}>Cartea</div>
          <div style={{ fontFamily: "Alegreya", fontSize: 96, color: "#1f5fa8", lineHeight: 1.05 }}>Neamului</div>
          <div style={{ fontFamily: "Alegreya Sans", fontSize: 36, color: "#3d4652", marginTop: 34, lineHeight: 1.3 }}>
            Arborele familiei, construit împreună, cu amintirile celor dragi.
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Alegreya", data: serif, weight: 700, style: "normal" },
        { name: "Alegreya", data: serifExt, weight: 700, style: "normal" },
        { name: "Alegreya Sans", data: sans, weight: 500, style: "normal" },
        { name: "Alegreya Sans", data: sansExt, weight: 500, style: "normal" },
      ],
    },
  );
}
