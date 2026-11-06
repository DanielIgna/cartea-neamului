import type { MetadataRoute } from "next";

/** Cartea Neamului ca aplicație pe telefon: se pune pe ecranul principal și se deschide fără bara browserului. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Cartea Neamului",
    short_name: "Cartea Neamului",
    description: "Arborele familiei, construit împreună, cu amintirile celor dragi și cartea neamului gata de tipărit.",
    lang: "ro",
    dir: "ltr",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#eef1f2",
    theme_color: "#1f5fa8",
    categories: ["lifestyle", "education"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
