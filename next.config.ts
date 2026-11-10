import type { NextConfig } from "next";

const dev = process.env.NODE_ENV !== "production";

// Legătura „live” a arborelui merge direct din browser la serverul de realtime (adresa vine din variabilele de mediu).
const realtime = (() => {
  try {
    const u = new URL(process.env.NEON_REALTIME_URL ?? "");
    return [`https://${u.host}`, `wss://${u.host}`];
  } catch {
    return [];
  }
})();

// Pozele, actele și glasul se deschid printr-o adresă semnată, direct de la stocarea de fișiere (Neon Object Storage, S3).
const storage = (() => {
  try {
    return [`https://${new URL(process.env.NEON_STORAGE_ENDPOINT_URL_S3 || process.env.AWS_ENDPOINT_URL_S3 || "").host}`];
  } catch {
    return [];
  }
})();
const files = [...storage, "https://*.neon.tech"].join(" ");

/**
 * Ce are voie să încarce o pagină: totul de pe site, plus plăcile hărții (OpenStreetMap) și pozele din contul Google.
 * Fonturile sunt pe site; „Continuă cu Google” e o trecere de pagină, nu o încărcare. Paginile nu pot fi puse în cadrul altui site.
 * Next pune scripturi și stiluri în pagină, de aceea 'unsafe-inline'; în dezvoltare mai cere și 'unsafe-eval'.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: https://tile.openstreetmap.org https://*.tile.openstreetmap.org https://*.googleusercontent.com ${files}`,
  "font-src 'self' data:",
  `media-src 'self' blob: data: ${files}`,
  `connect-src 'self' ${files}${realtime.length ? ` ${realtime.join(" ")}` : ""}${dev ? " ws:" : ""}`,
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "frame-src 'self'",
  "frame-ancestors 'self'",
  "form-action 'self' https://accounts.google.com",
  "base-uri 'self'",
  "object-src 'none'",
].join("; ");

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Microfonul doar pentru site (amintirile spuse cu glasul); restul, oprite.
  { key: "Permissions-Policy", value: "microphone=(self), camera=(), geolocation=(), payment=(), usb=(), bluetooth=(), serial=(), hid=(), midi=(), magnetometer=(), gyroscope=(), accelerometer=(), display-capture=(), browsing-topics=(), interest-cohort=()" },
  { key: "Content-Security-Policy", value: csp },
];

const config: NextConfig = {
  serverExternalPackages: ["@electric-sql/pglite"],
  poweredByHeader: false,
  // Titlul, descrierea și poza pentru previzualizarea linkurilor stau în <head> chiar din primul HTML, pentru orice browser sau robot
  // (altfel Next le poate trimite mai târziu, în corpul paginii, celor pe care nu-i recunoaște ca roboți).
  htmlLimitedBots: /.*/,
  // Pagina de eroare a bibliotecii de conectare (în engleză) e înlocuită de a noastră, cu același cod de eroare.
  async redirects() {
    return [{ source: "/api/auth/error", destination: "/intrare/eroare", permanent: false }];
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};
export default config;
