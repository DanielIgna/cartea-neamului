import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

/** Poza din previzualizarea linkului (WhatsApp, Facebook): numele aplicației și semnul platformei, 1200×630. */
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
  // Semnul platformei: generațiile în semicerc deasupra cărții deschise (același desen ca în components/Logo.tsx).
  const fan: [string, string][] = [
    ["M16.52 41.2A15.5 15.5 0 0 1 31.2 26.52L31.54 33.01A9 9 0 0 0 23.01 41.54Z", "#1f5fa8"],
    ["M32.8 26.52A15.5 15.5 0 0 1 47.48 41.2L40.99 41.54A9 9 0 0 0 32.46 33.01Z", "#b9822a"],
    ["M8.51 41.2A23.5 23.5 0 0 1 14.83 25.96L19.21 30.05A17.5 17.5 0 0 0 14.51 41.4Z", "#4a80bf"],
    ["M15.96 24.83A23.5 23.5 0 0 1 31.2 18.51L31.4 24.51A17.5 17.5 0 0 0 20.05 29.21Z", "#4a80bf"],
    ["M32.8 18.51A23.5 23.5 0 0 1 48.04 24.83L43.95 29.21A17.5 17.5 0 0 0 32.6 24.51Z", "#cc9d4f"],
    ["M49.17 25.96A23.5 23.5 0 0 1 55.49 41.2L49.49 41.4A17.5 17.5 0 0 0 44.79 30.05Z", "#cc9d4f"],
    ["M1.51 41.2A30.5 30.5 0 0 1 3.53 31.07L8.19 32.86A25.5 25.5 0 0 0 6.51 41.33Z", "#86aad6"],
    ["M4.14 29.59A30.5 30.5 0 0 1 9.88 21.01L13.5 24.45A25.5 25.5 0 0 0 8.71 31.63Z", "#86aad6"],
    ["M11.01 19.88A30.5 30.5 0 0 1 19.59 14.14L21.63 18.71A25.5 25.5 0 0 0 14.45 23.5Z", "#86aad6"],
    ["M21.07 13.53A30.5 30.5 0 0 1 31.2 11.51L31.33 16.51A25.5 25.5 0 0 0 22.86 18.19Z", "#86aad6"],
    ["M32.8 11.51A30.5 30.5 0 0 1 42.93 13.53L41.14 18.19A25.5 25.5 0 0 0 32.67 16.51Z", "#ddbd85"],
    ["M44.41 14.14A30.5 30.5 0 0 1 52.99 19.88L49.55 23.5A25.5 25.5 0 0 0 42.37 18.71Z", "#ddbd85"],
    ["M54.12 21.01A30.5 30.5 0 0 1 59.86 29.59L55.29 31.63A25.5 25.5 0 0 0 50.5 24.45Z", "#ddbd85"],
    ["M60.47 31.07A30.5 30.5 0 0 1 62.49 41.2L57.49 41.33A25.5 25.5 0 0 0 55.81 32.86Z", "#ddbd85"],
  ];
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", background: "#fbf6ec", padding: "0 80px" }}>
        <svg width="500" height="422" viewBox="0 8 64 54">
          {fan.map(([d, fill], i) => <path key={i} d={d} fill={fill} />)}
          <circle cx="32" cy="42" r="6" fill="#1b2430" />
          <path d="M3 46.5Q18 43.5 31 48.5V58Q18 53 3 56Z M61 46.5Q46 43.5 33 48.5V58Q46 53 61 56Z" fill="#1b2430" />
        </svg>
        <div style={{ display: "flex", flexDirection: "column", marginLeft: 60, flex: 1 }}>
          <div style={{ fontFamily: "Alegreya", fontSize: 96, color: "#1b2430", lineHeight: 1 }}>Cartea</div>
          <div style={{ fontFamily: "Alegreya", fontSize: 96, color: "#b9822a", lineHeight: 1.05 }}>Neamului</div>
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
