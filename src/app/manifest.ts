import type { MetadataRoute } from "next";
import { getLocale, getT } from "@/i18n/server";

/**
 * Cartea Neamului ca aplicație pe telefon: se pune pe ecranul principal și se deschide fără bara browserului.
 * Numele de sub iconiță e în limba aleasă pe telefon („The Family Book”, „Das Familienbuch”…).
 */
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const [locale, t] = await Promise.all([getLocale(), getT("Meta")]);
  return {
    name: t("appName"),
    short_name: t("appName"),
    description: t("description"),
    lang: locale,
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
