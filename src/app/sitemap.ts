import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-url";
import { PUBLIC_PAGES } from "@/lib/public-pages";

/** Paginile publice ale site-ului, pentru motoarele de căutare. */
export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_PAGES.map((p) => ({ url: `${SITE_URL}${p.path === "/" ? "" : p.path}`, changeFrequency: p.changeFrequency, priority: p.priority }));
}
