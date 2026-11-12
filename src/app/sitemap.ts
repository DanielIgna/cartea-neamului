import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-url";

/** Paginile publice ale site-ului, pentru motoarele de căutare. */
export default function sitemap(): MetadataRoute.Sitemap {
  const pages: [string, number][] = [["/", 1], ["/istoria-umanitatii", 0.7], ["/genealogii-vechi", 0.6], ["/libertatea-de-a-crede", 0.6], ["/parteneri", 0.3], ["/contact", 0.4], ["/confidentialitate", 0.3], ["/termeni", 0.3]];
  return pages.map(([path, priority]) => ({ url: `${SITE_URL}${path === "/" ? "" : path}`, changeFrequency: "monthly", priority }));
}
