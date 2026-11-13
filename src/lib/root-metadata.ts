import type { Metadata, Viewport } from "next";
import { getT } from "@/i18n/server";
import { SITE_URL } from "@/lib/site-url";

/**
 * Previzualizarea linkului pe WhatsApp, Facebook și în alte aplicații: titlul, descrierea și poza (app/opengraph-image).
 * Sunt fixe, în română, ca să arate la fel oricui trimite linkul; roboții acestor aplicații nu au cookie de limbă.
 */
const SHARE = {
  title: "Cartea Neamului",
  description: "Arborele familiei, construit împreună, cu amintirile celor dragi și cartea neamului gata de tipărit.",
} as const;

export async function rootMetadata(): Promise<Metadata> {
  const t = await getT("Meta");
  return {
    metadataBase: new URL(SITE_URL),
    title: t("appName"), description: t("description"), applicationName: t("appName"),
    openGraph: { ...SHARE, siteName: "Cartea Neamului", locale: "ro_RO", type: "website" },
    twitter: { card: "summary_large_image", ...SHARE },
    // Pe iPhone, după „Adaugă pe ecranul principal”, se deschide ca o aplicație, cu numele întreg sub iconiță.
    appleWebApp: { capable: true, title: t("appName"), statusBarStyle: "default" },
    formatDetection: { telephone: false },
  };
}
export const viewport: Viewport = {
  themeColor: [{ media: "(prefers-color-scheme: light)", color: "#f6efe4" }, { media: "(prefers-color-scheme: dark)", color: "#16100d" }],
};

