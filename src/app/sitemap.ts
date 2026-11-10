import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-url";

/** Paginile publice ale site-ului, pentru motoarele de căutare. */
export default function sitemap(): MetadataRoute.Sitemap {
  const pages: [string, number][] = [["/", 1], ["/istoria-bisericii", 0.7], ["/parteneri", 0.3], ["/confidentialitate", 0.3], ["/termeni", 0.3]];
  return pages.map(([path, priority]) => ({ url: `${SITE_URL}${path === "/" ? "" : path}`, changeFrequency: "monthly", priority }));
}
